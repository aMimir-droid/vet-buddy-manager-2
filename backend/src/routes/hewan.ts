import express from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { RowDataPacket } from 'mysql2';

const router = express.Router();

// ========================================================
// PENTING: Route spesifik HARUS di atas route generic!
// ========================================================

// ========================================================
// PAWRENT-SPECIFIC ROUTES (Harus di atas route generic)
// ========================================================

// UPDATE HEWAN BY PAWRENT
router.put('/my/:id', authenticate, authorize(3), async (req: AuthRequest, res) => {
  console.log('✏️ [UPDATE MY HEWAN] Request received');
  console.log('📝 [UPDATE MY HEWAN] Request body:', JSON.stringify(req.body, null, 2));
  const pool = req.dbPool;
  
  try {
    const hewanId = parseInt(req.params.id);
    const { nama_hewan, jenis_hewan_id, tanggal_lahir, jenis_kelamin, status_hidup } = req.body;
    
    // Get pawrent_id from authenticated user
    const pawrent_id = req.user.pawrent_id;
    
    if (!pawrent_id) {
      return res.status(403).json({ 
        message: 'Pawrent ID tidak ditemukan untuk user ini' 
      });
    }

    // Verify ownership before update
    const [checkOwnership]: any = await pool.execute(
      'SELECT pawrent_id FROM Hewan WHERE hewan_id = ?',
      [hewanId]
    );

    if (checkOwnership.length === 0) {
      return res.status(404).json({ message: 'Hewan tidak ditemukan' });
    }

    if (checkOwnership[0].pawrent_id !== pawrent_id) {
      return res.status(403).json({ 
        message: 'Anda tidak memiliki izin untuk mengubah hewan ini' 
      });
    }

    console.log('🔄 [UPDATE MY HEWAN] Calling stored procedure UpdateHewanByPawrent');
    console.log(`📊 [UPDATE MY HEWAN] Parameters: hewan_id=${hewanId}, pawrent_id=${pawrent_id}`);
    
    // PERBAIKAN: Kirim 6 parameter, bukan 7
    const [result]: any = await pool.execute(
      'CALL UpdateHewanByPawrent(?, ?, ?, ?, ?, ?)',
      [
        hewanId,                      // p_hewan_id
        nama_hewan,                   // p_nama_hewan
        tanggal_lahir || null,        // p_tanggal_lahir
        jenis_kelamin,                // p_jenis_kelamin
        jenis_hewan_id,               // p_jenis_hewan_id
        status_hidup                  // p_status_hidup
      ]
    );
    
    const updatedHewan = result[0][0];
    console.log(`✅ [UPDATE MY HEWAN] Success - Hewan ID: ${hewanId}`);
    res.json(updatedHewan);
  } catch (error: any) {
    console.error('❌ [UPDATE MY HEWAN] Error:', error);
    
    if (error.sqlState === '45000') {
      return res.status(400).json({ message: error.sqlMessage || 'Validasi gagal' });
    }
    
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// CREATE HEWAN BY PAWRENT
router.post('/my', authenticate, authorize(3), async (req: AuthRequest, res) => {
  console.log('📋 [CREATE MY HEWAN] Request received');
  console.log('📝 [CREATE MY HEWAN] Request body:', JSON.stringify(req.body, null, 2));
  const pool = req.dbPool;
  
  try {
    const { nama_hewan, jenis_hewan_id, tanggal_lahir, jenis_kelamin, status_hidup } = req.body;
    
    // Validate required fields
    if (!nama_hewan || !jenis_hewan_id) {
      return res.status(400).json({ 
        message: 'Nama hewan dan jenis hewan wajib diisi' 
      });
    }

    // Get pawrent_id from authenticated user
    const pawrent_id = req.user.pawrent_id;
    
    if (!pawrent_id) {
      return res.status(403).json({ 
        message: 'Pawrent ID tidak ditemukan untuk user ini' 
      });
    }

    console.log('🔄 [CREATE MY HEWAN] Calling stored procedure CreateHewanByPawrent');
    console.log(`📊 [CREATE MY HEWAN] Parameters: nama=${nama_hewan}, jenis=${jenis_hewan_id}, pawrent=${pawrent_id}`);
    
    const [result]: any = await pool.execute(
      'CALL CreateHewanByPawrent(?, ?, ?, ?, ?, ?)',
      [
        nama_hewan,
        tanggal_lahir || null,
        jenis_kelamin || 'Jantan',
        jenis_hewan_id,
        pawrent_id,
        status_hidup || 'Hidup'
      ]
    );
    
    const newHewan = result[0][0];
    console.log(`✅ [CREATE MY HEWAN] Success - New Hewan ID: ${newHewan?.hewan_id}`);
    res.status(201).json(newHewan);
  } catch (error: any) {
    console.error('❌ [CREATE MY HEWAN] Error:', error);
    
    if (error.sqlState === '45000') {
      return res.status(400).json({ message: error.sqlMessage || 'Validasi gagal' });
    }
    
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE HEWAN BY PAWRENT
router.delete('/my/:id', authenticate, authorize(3), async (req: AuthRequest, res) => {
  console.log('🗑️ [DELETE MY HEWAN] Request received');
  const pool = req.dbPool;
  
  try {
    const hewanId = parseInt(req.params.id);
    const pawrent_id = req.user.pawrent_id;
    
    if (!pawrent_id) {
      return res.status(403).json({ 
        message: 'Pawrent ID tidak ditemukan untuk user ini' 
      });
    }

    console.log(`🔄 [DELETE MY HEWAN] Calling stored procedure DeleteHewanByPawrent`);
    console.log(`📊 [DELETE MY HEWAN] Parameters: hewan_id=${hewanId}, pawrent_id=${pawrent_id}`);
    
    const [result]: any = await pool.execute(
      'CALL DeleteHewanByPawrent(?, ?)',
      [hewanId, pawrent_id]
    );
    
    console.log(`✅ [DELETE MY HEWAN] Success - Hewan ID ${hewanId} deleted`);
    res.json({ message: 'Hewan berhasil dihapus' });
  } catch (error: any) {
    console.error('❌ [DELETE MY HEWAN] Error:', error);
    
    if (error.sqlState === '45000') {
      return res.status(400).json({ message: error.sqlMessage || 'Validasi gagal' });
    }
    
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// GENERIC ROUTES (Untuk Admin & Vet)
// ========================================================

// GET ALL HEWANS
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
        message: 'Akses ditolak. Anda tidak memiliki izin untuk operasi ini.' 
      });
    }
    
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET HEWAN BY ID
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
        message: 'Akses ditolak. Anda tidak memiliki izin untuk operasi ini.' 
      });
    }
    
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET ALL JENIS HEWAN
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
        message: 'Akses ditolak. Anda tidak memiliki izin untuk operasi ini.' 
      });
    }
    
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// CREATE HEWAN (Admin only)
router.post('/', authenticate, authorize(1), async (req: AuthRequest, res) => {
  console.log('📋 [CREATE HEWAN] Request received');
  console.log('📝 [CREATE HEWAN] Request body:', JSON.stringify(req.body, null, 2));
  const pool = req.dbPool;
  
  try {
    const { nama_hewan, jenis_hewan_id, tanggal_lahir, jenis_kelamin, pawrent_id, status_hidup } = req.body;
    
    // Validate required fields
    if (!nama_hewan || !jenis_hewan_id || !pawrent_id) {
      return res.status(400).json({ 
        message: 'Nama hewan, jenis hewan, dan pawrent wajib diisi' 
      });
    }

    console.log('🔄 [CREATE HEWAN] Calling stored procedure CreateHewan');
    
    const [result]: any = await pool.execute(
      'CALL CreateHewan(?, ?, ?, ?, ?, ?)',
      [
        nama_hewan,
        tanggal_lahir || null,
        jenis_kelamin || 'Jantan',
        jenis_hewan_id,
        pawrent_id,
        status_hidup || 'Hidup'
      ]
    );
    
    const newHewan = result[0][0];
    console.log(`✅ [CREATE HEWAN] Success - New Hewan ID: ${newHewan?.hewan_id}`);
    res.status(201).json(newHewan);
  } catch (error: any) {
    console.error('❌ [CREATE HEWAN] Error:', error);
    
    if (error.sqlState === '45000') {
      return res.status(400).json({ message: error.sqlMessage || 'Validasi gagal' });
    }
    
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// UPDATE HEWAN (Admin only)
router.put('/:id', authenticate, authorize(1), async (req: AuthRequest, res) => {
  const { id } = req.params;
  console.log(`📋 [UPDATE HEWAN] Request received for ID: ${id}`);
  const pool = req.dbPool;
  
  try {
    const { nama_hewan, jenis_hewan_id, tanggal_lahir, jenis_kelamin, pawrent_id, status_hidup } = req.body;
    
    console.log('🔄 [UPDATE HEWAN] Calling stored procedure UpdateHewan');
    
    const [result]: any = await pool.execute(
      'CALL UpdateHewan(?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        nama_hewan,
        tanggal_lahir || null,
        jenis_kelamin,
        jenis_hewan_id,
        pawrent_id,
        status_hidup
      ]
    );
    
    const updatedHewan = result[0][0];
    console.log(`✅ [UPDATE HEWAN] Success for ID: ${id}`);
    res.json(updatedHewan);
  } catch (error: any) {
    console.error(`❌ [UPDATE HEWAN] Error for ID: ${id}`, error);
    
    if (error.sqlState === '45000') {
      return res.status(400).json({ message: error.sqlMessage || 'Validasi gagal' });
    }
    
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE HEWAN (Admin only)
router.delete('/:id', authenticate, authorize(1), async (req: AuthRequest, res) => {
  const { id } = req.params;
  console.log(`📋 [DELETE HEWAN] Request received for ID: ${id}`);
  const pool = req.dbPool;
  
  try {
    console.log(`🔄 [DELETE HEWAN] Calling stored procedure DeleteHewan for ID: ${id}`);
    const [result]: any = await pool.execute('CALL DeleteHewan(?)', [id]);
    
    const affectedRows = result[0][0].affected_rows;

    if (affectedRows === 0) {
      return res.status(404).json({ message: 'Hewan tidak ditemukan' });
    }

    console.log(`✅ [DELETE HEWAN] Success - Deleted ID: ${id}`);
    res.json({ message: 'Hewan berhasil dihapus' });
  } catch (error: any) {
    console.error(`❌ [DELETE HEWAN] Error for ID: ${id}`, error);
    
    if (error.sqlState === '45000') {
      return res.status(400).json({ message: error.sqlMessage || 'Validasi gagal' });
    }
    
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;