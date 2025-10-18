import express from 'express';
import pool from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth'; // ✅ Import AuthRequest
import { RowDataPacket } from 'mysql2';

const router = express.Router();

// ========================================================
// GET ALL HEWANS - Menggunakan Stored Procedure
// ========================================================
router.get('/', authenticate, async (req, res) => {
  console.log('📋 [GET ALL HEWANS] Request received');
  try {
    console.log('🔄 [GET ALL HEWANS] Calling stored procedure GetAllHewans');
    const [rows]: any = await pool.execute('CALL GetAllHewans()');
    console.log(`✅ [GET ALL HEWANS] Success - ${rows[0]?.length || 0} hewans found`);
    res.json(rows[0]);
  } catch (error: any) {
    console.error('❌ [GET ALL HEWANS] Error:', error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// GET HEWAN BY ID - Menggunakan Stored Procedure
// ========================================================
router.get('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  console.log(`📋 [GET HEWAN BY ID] Request received for ID: ${id}`);
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
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// GET ALL JENIS HEWAN - Menggunakan Stored Procedure
// ========================================================
router.get('/jenis/list', authenticate, async (req, res) => {
  console.log('📋 [GET ALL JENIS HEWAN] Request received');
  try {
    console.log('🔄 [GET ALL JENIS HEWAN] Calling stored procedure GetAllJenisHewan');
    const [rows]: any = await pool.execute('CALL GetAllJenisHewan()');
    console.log(`✅ [GET ALL JENIS HEWAN] Success - ${rows[0]?.length || 0} jenis found`);
    res.json(rows[0]);
  } catch (error: any) {
    console.error('❌ [GET ALL JENIS HEWAN] Error:', error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// GET AVAILABLE PAWRENTS - Menggunakan Stored Procedure
// ========================================================
router.get('/pawrents/available', authenticate, async (req, res) => {
  console.log('📋 [GET AVAILABLE PAWRENTS] Request received');
  try {
    console.log('🔄 [GET AVAILABLE PAWRENTS] Calling stored procedure GetAvailablePawrentsForHewan');
    const [rows]: any = await pool.execute('CALL GetAvailablePawrentsForHewan()');
    console.log(`✅ [GET AVAILABLE PAWRENTS] Success - ${rows[0]?.length || 0} pawrents found`);
    res.json(rows[0]);
  } catch (error: any) {
    console.error('❌ [GET AVAILABLE PAWRENTS] Error:', error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// CREATE HEWAN - Menggunakan Stored Procedure (Admin only)
// ========================================================
router.post('/', authenticate, authorize(1), async (req, res) => {
  console.log('📋 [CREATE HEWAN] Request received');
  console.log('📝 [CREATE HEWAN] Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { 
      nama_hewan, 
      tanggal_lahir, 
      jenis_kelamin, 
      jenis_hewan_id, 
      pawrent_id 
    } = req.body;
    
    // MANDATORY: Validate pawrent_id is provided
    if (!pawrent_id) {
      return res.status(400).json({ 
        message: 'Pawrent wajib dipilih. Setiap hewan harus memiliki pemilik (pawrent)' 
      });
    }

    // Validate required fields
    if (!nama_hewan || !jenis_kelamin || !jenis_hewan_id) {
      return res.status(400).json({ 
        message: 'Nama hewan, jenis kelamin, dan jenis hewan wajib diisi' 
      });
    }

    // Validate nama_hewan is not empty
    if (nama_hewan.trim() === '') {
      return res.status(400).json({ 
        message: 'Nama hewan tidak boleh kosong' 
      });
    }

    console.log('🔄 [CREATE HEWAN] Calling stored procedure CreateHewan');
    console.log(`📊 [CREATE HEWAN] Parameters: Name: ${nama_hewan}, Jenis: ${jenis_hewan_id}, Pawrent: ${pawrent_id} (REQUIRED)`);
    
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
    console.log(`✅ [CREATE HEWAN] Success - New Hewan ID: ${newHewan?.hewan_id} with Pawrent ID: ${pawrent_id}`);
    res.status(201).json(newHewan);
  } catch (error: any) {
    console.error('❌ [CREATE HEWAN] Error:', error);
    console.error('Error details:', error.message);
    
    if (error.sqlState === '45000') {
      return res.status(400).json({ message: error.sqlMessage });
    }
    if (error.code === 'ER_BAD_NULL_ERROR') {
      return res.status(400).json({ 
        message: 'Pawrent wajib dipilih. Setiap hewan harus memiliki pemilik (pawrent)' 
      });
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
router.put('/:id', authenticate, authorize(1), async (req, res) => {
  const { id } = req.params;
  console.log(`📋 [UPDATE HEWAN] Request received for ID: ${id}`);
  console.log('📝 [UPDATE HEWAN] Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { 
      nama_hewan, 
      tanggal_lahir, 
      jenis_kelamin, 
      status_hidup,
      jenis_hewan_id, 
      pawrent_id 
    } = req.body;
    
    // MANDATORY: Validate pawrent_id is provided
    if (!pawrent_id) {
      return res.status(400).json({ 
        message: 'Pawrent wajib dipilih. Setiap hewan harus memiliki pemilik (pawrent)' 
      });
    }

    // Validate required fields
    if (!nama_hewan || !jenis_kelamin || !status_hidup || !jenis_hewan_id) {
      return res.status(400).json({ 
        message: 'Semua field wajib diisi' 
      });
    }

    // Validate nama_hewan is not empty
    if (nama_hewan.trim() === '') {
      return res.status(400).json({ 
        message: 'Nama hewan tidak boleh kosong' 
      });
    }

    console.log('🔄 [UPDATE HEWAN] Calling stored procedure UpdateHewan');
    console.log(`📊 [UPDATE HEWAN] Parameters: ID: ${id}, Name: ${nama_hewan}, Status: ${status_hidup}, Pawrent: ${pawrent_id} (REQUIRED)`);
    
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
    
    if (error.sqlState === '45000') {
      return res.status(400).json({ message: error.sqlMessage });
    }
    if (error.code === 'ER_BAD_NULL_ERROR') {
      return res.status(400).json({ 
        message: 'Pawrent wajib dipilih. Setiap hewan harus memiliki pemilik (pawrent)' 
      });
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
  console.log('📝 [UPDATE MY HEWAN] Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { 
      nama_hewan, 
      tanggal_lahir, 
      jenis_kelamin, 
      status_hidup,  // ✅ TAMBAHKAN ini
      jenis_hewan_id 
    } = req.body;
    
    const pawrent_id = req.user?.pawrent_id;
    
    if (!pawrent_id) {
      return res.status(403).json({ 
        message: 'User tidak terhubung dengan pawrent' 
      });
    }

    console.log('🔄 [UPDATE MY HEWAN] Calling stored procedure UpdateHewanByPawrent');
    console.log(`📊 [UPDATE MY HEWAN] Parameters: Hewan ID: ${id}, Pawrent ID: ${pawrent_id}, Status: ${status_hidup || 'No change'}`);
    
    const [result]: any = await pool.execute(
      'CALL UpdateHewanByPawrent(?, ?, ?, ?, ?, ?, ?)',  // ✅ 7 parameters
      [
        id,
        pawrent_id,
        nama_hewan,
        tanggal_lahir || null,
        jenis_kelamin,
        status_hidup || 'Hidup',  // ✅ TAMBAHKAN ini dengan default
        jenis_hewan_id
      ]
    );
    
    const updatedHewan = result[0][0];
    console.log(`✅ [UPDATE MY HEWAN] Success for Hewan ID: ${id}`);
    console.log(`📊 [UPDATE MY HEWAN] Updated status: ${updatedHewan?.status_hidup}`);
    res.json(updatedHewan);
  } catch (error: any) {
    console.error(`❌ [UPDATE MY HEWAN] Error for Hewan ID: ${id}`, error);
    
    if (error.sqlState === '45000') {
      return res.status(403).json({ message: error.sqlMessage });
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
router.delete('/:id', authenticate, authorize(1), async (req, res) => {
  const { id } = req.params;
  console.log(`📋 [DELETE HEWAN] Request received for ID: ${id}`);
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
// GET HEWANS BY CURRENT PAWRENT - Pawrent hanya lihat hewan miliknya
// ========================================================
router.get('/my-pets', authenticate, authorize(3), async (req: AuthRequest, res) => { // ✅ Use AuthRequest
  console.log('📋 [GET MY PETS] Request received');
  try {
    const pawrentId = req.user?.pawrent_id; // ✅ Now accessible with optional chaining
    
    if (!pawrentId) {
      return res.status(400).json({ 
        message: 'Pawrent ID tidak ditemukan. Pastikan user login sebagai pawrent.' 
      });
    }

    console.log(`🔄 [GET MY PETS] Fetching pets for pawrent ID: ${pawrentId}`);
    const [rows]: any = await pool.execute('CALL GetAllHewans()');
    
    // Filter hewan berdasarkan pawrent_id
    const myPets = rows[0].filter((hewan: any) => hewan.pawrent_id === pawrentId);
    
    console.log(`✅ [GET MY PETS] Success - ${myPets.length} pets found for pawrent ${pawrentId}`);
    res.json(myPets);
  } catch (error: any) {
    console.error('❌ [GET MY PETS] Error:', error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;