import express from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = express.Router();

// ========================================================
// GET ALL HEWANS - Menggunakan Stored Procedure
// ========================================================
router.get('/', authenticate, async (req: AuthRequest, res) => {
  console.log('📋 [GET ALL HEWANS] Request received');
  const pool = req.dbPool;
  
  try {
    console.log(`🔄 [GET ALL HEWANS] Using DB pool for role_id: ${req.user.role_id}`);
    const [rows]: any = await pool.execute('CALL GetAllHewans()');
    console.log(`✅ [GET ALL HEWANS] Success - ${rows[0]?.length || 0} hewans found`);
    res.json(rows[0]);
  } catch (error: any) {
    console.error('❌ [GET ALL HEWANS] Error:', error);
    
    if (error.code === 'ER_TABLEACCESS_DENIED_ERROR' || error.code === 'ER_PROCACCESS_DENIED_ERROR') {
      return res.status(403).json({ 
        message: 'Akses ditolak: Anda tidak memiliki hak akses ke resource ini' 
      });
    }
    
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// GET HEWAN BY ID - Menggunakan Stored Procedure
// ========================================================
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  const { id } = req.params;
  console.log(`📋 [GET HEWAN BY ID] Request received for ID: ${id}`);
  const pool = req.dbPool;
  
  try {
    console.log(`🔄 [GET HEWAN BY ID] Calling stored procedure GetHewanById with ID: ${id}`);
    const [rows]: any = await pool.execute('CALL GetHewanById(?)', [id]);
    
    if (rows[0].length === 0) {
      console.log(`⚠️ [GET HEWAN BY ID] Not found for ID: ${id}`);
      return res.status(404).json({ message: 'Hewan tidak ditemukan' });
    }
    
    console.log(`✅ [GET HEWAN BY ID] Success for ID: ${id}`);
    res.json(rows[0][0]);
  } catch (error: any) {
    console.error(`❌ [GET HEWAN BY ID] Error for ID: ${id}`, error);
    
    if (error.code === 'ER_TABLEACCESS_DENIED_ERROR' || error.code === 'ER_PROCACCESS_DENIED_ERROR') {
      return res.status(403).json({ 
        message: 'Akses ditolak: Anda tidak memiliki hak akses ke resource ini' 
      });
    }
    
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// GET ALL JENIS HEWAN - Menggunakan Stored Procedure
// ========================================================
router.get('/jenis/list', authenticate, async (req: AuthRequest, res) => {
  console.log('📋 [GET ALL JENIS HEWAN] Request received');
  const pool = req.dbPool;
  
  try {
    console.log('🔄 [GET ALL JENIS HEWAN] Calling stored procedure GetAllJenisHewan');
    const [rows]: any = await pool.execute('CALL GetAllJenisHewan()');
    console.log(`✅ [GET ALL JENIS HEWAN] Success - ${rows[0]?.length || 0} jenis found`);
    res.json(rows[0]);
  } catch (error: any) {
    console.error('❌ [GET ALL JENIS HEWAN] Error:', error);
    
    if (error.code === 'ER_TABLEACCESS_DENIED_ERROR' || error.code === 'ER_PROCACCESS_DENIED_ERROR') {
      return res.status(403).json({ 
        message: 'Akses ditolak: Anda tidak memiliki hak akses ke resource ini' 
      });
    }
    
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// GET AVAILABLE PAWRENTS - Menggunakan Stored Procedure
// ========================================================
router.get('/pawrents/available', authenticate, async (req: AuthRequest, res) => {
  console.log('📋 [GET AVAILABLE PAWRENTS] Request received');
  const pool = req.dbPool;
  
  try {
    console.log('🔄 [GET AVAILABLE PAWRENTS] Calling stored procedure GetAvailablePawrentsForHewan');
    const [rows]: any = await pool.execute('CALL GetAvailablePawrentsForHewan()');
    console.log(`✅ [GET AVAILABLE PAWRENTS] Success - ${rows[0]?.length || 0} pawrents found`);
    res.json(rows[0]);
  } catch (error: any) {
    console.error('❌ [GET AVAILABLE PAWRENTS] Error:', error);
    
    if (error.code === 'ER_TABLEACCESS_DENIED_ERROR' || error.code === 'ER_PROCACCESS_DENIED_ERROR') {
      return res.status(403).json({ 
        message: 'Akses ditolak: Anda tidak memiliki hak akses ke resource ini' 
      });
    }
    
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// CREATE HEWAN - Menggunakan Stored Procedure (Admin only)
// ========================================================
router.post('/', authenticate, authorize(1), async (req: AuthRequest, res) => {
  console.log('📋 [CREATE HEWAN] Request received');
  console.log('📝 [CREATE HEWAN] Request body:', JSON.stringify(req.body, null, 2));
  const pool = req.dbPool;
  
  try {
    const { 
      nama_hewan, 
      tanggal_lahir, 
      jenis_kelamin, 
      jenis_hewan_id, 
      pawrent_id 
    } = req.body;
    
    if (!pawrent_id) {
      return res.status(400).json({ message: 'Pawrent wajib dipilih' });
    }

    if (!nama_hewan || !jenis_kelamin || !jenis_hewan_id) {
      return res.status(400).json({ message: 'Nama, jenis kelamin, dan jenis hewan wajib diisi' });
    }

    if (nama_hewan.trim() === '') {
      return res.status(400).json({ message: 'Nama hewan tidak boleh kosong' });
    }

    console.log('🔄 [CREATE HEWAN] Calling stored procedure CreateHewan');
    
    const [result]: any = await pool.execute(
      'CALL CreateHewan(?, ?, ?, ?, ?)',
      [
        nama_hewan,
        tanggal_lahir || null,
        jenis_kelamin,
        jenis_hewan_id,
        pawrent_id
      ]
    );
    
    const newHewan = result[0][0];
    console.log(`✅ [CREATE HEWAN] Success - New Hewan ID: ${newHewan?.hewan_id}`);
    res.status(201).json(newHewan);
  } catch (error: any) {
    console.error('❌ [CREATE HEWAN] Error:', error);
    
    if (error.code === 'ER_TABLEACCESS_DENIED_ERROR' || error.code === 'ER_PROCACCESS_DENIED_ERROR') {
      return res.status(403).json({ 
        message: 'Akses ditolak: Anda tidak memiliki hak akses untuk membuat data ini' 
      });
    }
    
    if (error.sqlState === '45000') {
      return res.status(400).json({ message: error.sqlMessage });
    }
    
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// UPDATE HEWAN - Menggunakan Stored Procedure (Admin only)
// ========================================================
router.put('/:id', authenticate, authorize(1), async (req: AuthRequest, res) => {
  const { id } = req.params;
  console.log(`📋 [UPDATE HEWAN] Request received for ID: ${id}`);
  const pool = req.dbPool;
  
  try {
    const { 
      nama_hewan, 
      tanggal_lahir, 
      jenis_kelamin, 
      status_hidup,
      jenis_hewan_id, 
      pawrent_id 
    } = req.body;

    const [result]: any = await pool.execute(
      'CALL UpdateHewan(?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        nama_hewan,
        tanggal_lahir || null,
        jenis_kelamin,
        status_hidup,
        jenis_hewan_id,
        pawrent_id
      ]
    );
    
    const updatedHewan = result[0][0];
    console.log(`✅ [UPDATE HEWAN] Success for ID: ${id}`);
    res.json(updatedHewan);
  } catch (error: any) {
    console.error(`❌ [UPDATE HEWAN] Error for ID: ${id}`, error);
    
    if (error.code === 'ER_TABLEACCESS_DENIED_ERROR' || error.code === 'ER_PROCACCESS_DENIED_ERROR') {
      return res.status(403).json({ 
        message: 'Akses ditolak: Anda tidak memiliki hak akses untuk mengubah data ini' 
      });
    }
    
    if (error.sqlState === '45000') {
      return res.status(400).json({ message: error.sqlMessage });
    }
    
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// DELETE HEWAN - Menggunakan Stored Procedure (Admin only)
// ========================================================
router.delete('/:id', authenticate, authorize(1), async (req: AuthRequest, res) => {
  const { id } = req.params;
  console.log(`📋 [DELETE HEWAN] Request received for ID: ${id}`);
  const pool = req.dbPool;
  
  try {
    console.log(`🔄 [DELETE HEWAN] Calling stored procedure DeleteHewan for ID: ${id}`);
    const [result]: any = await pool.execute('CALL DeleteHewan(?)', [id]);
    
    const affectedRows = result[0][0].affected_rows;

    if (affectedRows === 0) {
      console.log(`⚠️ [DELETE HEWAN] Not found for ID: ${id}`);
      return res.status(404).json({ message: 'Hewan tidak ditemukan' });
    }

    console.log(`✅ [DELETE HEWAN] Success - Deleted ID: ${id}`);
    res.json({ message: 'Hewan berhasil dihapus' });
  } catch (error: any) {
    console.error(`❌ [DELETE HEWAN] Error for ID: ${id}`, error);
    
    if (error.code === 'ER_TABLEACCESS_DENIED_ERROR' || error.code === 'ER_PROCACCESS_DENIED_ERROR') {
      return res.status(403).json({ 
        message: 'Akses ditolak: Anda tidak memiliki hak akses untuk menghapus data ini' 
      });
    }
    
    if (error.sqlState === '45000') {
      return res.status(400).json({ message: error.sqlMessage });
    }
    
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// UPDATE HEWAN BY PAWRENT - Pawrent dapat update hewan sendiri
// ========================================================
router.put('/my/:id', authenticate, authorize(3), async (req: AuthRequest, res) => {
  const { id } = req.params;
  console.log(`📋 [UPDATE MY HEWAN] Request received for Hewan ID: ${id}`);
  const pool = req.dbPool;
  
  try {
    const { 
      nama_hewan, 
      tanggal_lahir, 
      jenis_kelamin, 
      jenis_hewan_id,
      status_hidup 
    } = req.body;

    console.log('📝 [UPDATE MY HEWAN] Request body:', {
      id,
      nama_hewan,
      tanggal_lahir,
      jenis_kelamin,
      jenis_hewan_id,
      status_hidup
    });

    // Validate required fields
    if (!nama_hewan || !jenis_kelamin || !jenis_hewan_id || !status_hidup) {
      return res.status(400).json({ 
        message: 'Nama hewan, jenis kelamin, jenis hewan, dan status hidup wajib diisi' 
      });
    }

    console.log('🔄 [UPDATE MY HEWAN] Calling stored procedure UpdateHewanByPawrent');
    
    const [result]: any = await pool.execute(
      'CALL UpdateHewanByPawrent(?, ?, ?, ?, ?, ?)',
      [
        id, 
        nama_hewan, 
        tanggal_lahir, 
        jenis_kelamin, 
        jenis_hewan_id,
        status_hidup
      ]
    );

    const updatedHewan = result[0][0];
    console.log(`✅ [UPDATE MY HEWAN] Success for ID: ${id}`);
    
    res.json({ 
      message: 'Hewan berhasil diupdate', 
      data: updatedHewan 
    });
  } catch (error: any) {
    console.error('❌ [UPDATE MY HEWAN] Error:', error);
    
    if (error.code === 'ER_TABLEACCESS_DENIED_ERROR' || error.code === 'ER_PROCACCESS_DENIED_ERROR') {
      return res.status(403).json({ 
        message: 'Akses ditolak: Anda tidak memiliki hak akses untuk mengubah data ini' 
      });
    }
    
    if (error.sqlState === '45000') {
      return res.status(400).json({ message: error.sqlMessage });
    }
    
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;