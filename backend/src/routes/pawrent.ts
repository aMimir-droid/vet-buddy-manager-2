import express from 'express';
import pool from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth'; // ✅ Import AuthRequest
import { RowDataPacket } from 'mysql2';

const router = express.Router();

// ========================================================
// GET ALL PAWRENTS - Menggunakan Stored Procedure
// ========================================================
router.get('/', authenticate, async (req, res) => {
  console.log('📋 [GET ALL PAWRENTS] Request received');
  try {
    console.log('🔄 [GET ALL PAWRENTS] Calling stored procedure GetAllPawrents');
    const [rows]: any = await pool.execute('CALL GetAllPawrents()');
    console.log(`✅ [GET ALL PAWRENTS] Success - ${rows[0]?.length || 0} pawrents found`);
    res.json(rows[0]);
  } catch (error: any) {
    console.error('❌ [GET ALL PAWRENTS] Error:', error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// GET PAWRENT BY ID - Menggunakan Stored Procedure
// ========================================================
router.get('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  console.log(`📋 [GET PAWRENT BY ID] Request received for ID: ${id}`);
  try {
    console.log(`🔄 [GET PAWRENT BY ID] Calling stored procedure GetPawrentById with ID: ${id}`);
    const [rows]: any = await pool.execute('CALL GetPawrentById(?)', [id]);
    
    if (rows[0].length === 0) {
      console.log(`⚠️ [GET PAWRENT BY ID] Not found for ID: ${id}`);
      return res.status(404).json({ message: 'Pawrent tidak ditemukan' });
    }
    
    console.log(`✅ [GET PAWRENT BY ID] Success for ID: ${id}`);
    res.json(rows[0][0]);
  } catch (error: any) {
    console.error(`❌ [GET PAWRENT BY ID] Error for ID: ${id}`, error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// GET AVAILABLE DOKTERS - Menggunakan Stored Procedure
// ========================================================
router.get('/dokters/available', authenticate, async (req, res) => {
  console.log('📋 [GET AVAILABLE DOKTERS] Request received');
  try {
    console.log('🔄 [GET AVAILABLE DOKTERS] Calling stored procedure GetAvailableDoktersForPawrent');
    const [rows]: any = await pool.execute('CALL GetAvailableDoktersForPawrent()');
    console.log(`✅ [GET AVAILABLE DOKTERS] Success - ${rows[0]?.length || 0} dokters found`);
    res.json(rows[0]);
  } catch (error: any) {
    console.error('❌ [GET AVAILABLE DOKTERS] Error:', error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// CREATE PAWRENT - Menggunakan Stored Procedure (Admin only)
// ========================================================
router.post('/', authenticate, authorize(1), async (req, res) => {
  console.log('📋 [CREATE PAWRENT] Request received');
  console.log('📝 [CREATE PAWRENT] Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { 
      nama_depan_pawrent, 
      nama_belakang_pawrent, 
      alamat_pawrent, 
      kota_pawrent,
      kode_pos_pawrent,
      nomor_hp,
      dokter_id 
    } = req.body;
    
    // Validate required fields
    if (!nama_depan_pawrent || !nama_belakang_pawrent || !nomor_hp || !dokter_id) {
      return res.status(400).json({ 
        message: 'Nama depan, nama belakang, nomor HP, dan dokter wajib diisi' 
      });
    }

    // Validate phone number format (basic)
    if (!/^[0-9]{10,15}$/.test(nomor_hp.replace(/[\s-]/g, ''))) {
      return res.status(400).json({ message: 'Format nomor HP tidak valid' });
    }

    console.log('🔄 [CREATE PAWRENT] Calling stored procedure CreatePawrent');
    console.log(`📊 [CREATE PAWRENT] Parameters: Name: ${nama_depan_pawrent} ${nama_belakang_pawrent}, Phone: ${nomor_hp}, Dokter: ${dokter_id}`);
    
    const [result]: any = await pool.execute(
      'CALL CreatePawrent(?, ?, ?, ?, ?, ?, ?)',
      [
        nama_depan_pawrent,
        nama_belakang_pawrent,
        alamat_pawrent || null,
        kota_pawrent || null,
        kode_pos_pawrent || null,
        nomor_hp,
        dokter_id
      ]
    );
    
    const newPawrent = result[0][0];
    console.log(`✅ [CREATE PAWRENT] Success - New Pawrent ID: ${newPawrent?.pawrent_id}`);
    res.status(201).json(newPawrent);
  } catch (error: any) {
    console.error('❌ [CREATE PAWRENT] Error:', error);
    console.error('Error details:', error.message);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Nomor HP sudah terdaftar' });
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
// UPDATE PAWRENT - Menggunakan Stored Procedure (Admin only)
// ========================================================
router.put('/:id', authenticate, authorize(1), async (req, res) => {
  const { id } = req.params;
  console.log(`📋 [UPDATE PAWRENT] Request received for ID: ${id}`);
  console.log('📝 [UPDATE PAWRENT] Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { 
      nama_depan_pawrent, 
      nama_belakang_pawrent, 
      alamat_pawrent, 
      kota_pawrent,
      kode_pos_pawrent,
      nomor_hp,
      dokter_id 
    } = req.body;
    
    // Validate required fields
    if (!nama_depan_pawrent || !nama_belakang_pawrent || !nomor_hp || !dokter_id) {
      return res.status(400).json({ 
        message: 'Nama depan, nama belakang, nomor HP, dan dokter wajib diisi' 
      });
    }

    // Validate phone number format (basic)
    if (!/^[0-9]{10,15}$/.test(nomor_hp.replace(/[\s-]/g, ''))) {
      return res.status(400).json({ message: 'Format nomor HP tidak valid' });
    }

    console.log('🔄 [UPDATE PAWRENT] Calling stored procedure UpdatePawrent');
    console.log(`📊 [UPDATE PAWRENT] Parameters: ID: ${id}, Name: ${nama_depan_pawrent} ${nama_belakang_pawrent}`);
    
    const [result]: any = await pool.execute(
      'CALL UpdatePawrent(?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        nama_depan_pawrent,
        nama_belakang_pawrent,
        alamat_pawrent || null,
        kota_pawrent || null,
        kode_pos_pawrent || null,
        nomor_hp,
        dokter_id
      ]
    );
    
    const updatedPawrent = result[0][0];
    console.log(`✅ [UPDATE PAWRENT] Success for ID: ${id}`);
    res.json(updatedPawrent);
  } catch (error: any) {
    console.error(`❌ [UPDATE PAWRENT] Error for ID: ${id}`, error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Nomor HP sudah terdaftar' });
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
// DELETE PAWRENT - Menggunakan Stored Procedure (Admin only)
// ========================================================
router.delete('/:id', authenticate, authorize(1), async (req, res) => {
  const { id } = req.params;
  console.log(`📋 [DELETE PAWRENT] Request received for ID: ${id}`);
  try {
    console.log(`🔄 [DELETE PAWRENT] Calling stored procedure DeletePawrent for ID: ${id}`);
    const [result]: any = await pool.execute('CALL DeletePawrent(?)', [id]);
    
    const affectedRows = result[0][0].affected_rows;

    if (affectedRows === 0) {
      console.log(`⚠️ [DELETE PAWRENT] Not found for ID: ${id}`);
      return res.status(404).json({ message: 'Pawrent tidak ditemukan' });
    }

    console.log(`✅ [DELETE PAWRENT] Success - Deleted ID: ${id}`);
    res.json({ message: 'Pawrent berhasil dihapus' });
  } catch (error: any) {
    console.error(`❌ [DELETE PAWRENT] Error for ID: ${id}`, error);
    
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
// UPDATE SELF PROFILE - Pawrent dapat update data sendiri
// ========================================================
router.put('/profile/me', authenticate, authorize(3), async (req: AuthRequest, res) => { // ✅ Use AuthRequest
  console.log('📋 [UPDATE SELF PAWRENT] Request received');
  console.log('📝 [UPDATE SELF PAWRENT] Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const pawrent_id = req.user?.pawrent_id; // ✅ Now accessible
    
    if (!pawrent_id) {
      return res.status(400).json({ 
        message: 'Pawrent ID tidak ditemukan. Pastikan user login sebagai pawrent.' 
      });
    }
    
    const { 
      nama_depan_pawrent, 
      nama_belakang_pawrent, 
      alamat_pawrent, 
      kota_pawrent,
      kode_pos_pawrent,
      nomor_hp
    } = req.body;
    
    // Validate required fields
    if (!nama_depan_pawrent || !nama_belakang_pawrent || !nomor_hp) {
      return res.status(400).json({ 
        message: 'Nama depan, nama belakang, dan nomor HP wajib diisi' 
      });
    }

    // Validate phone number format (basic)
    if (!/^[0-9]{10,15}$/.test(nomor_hp.replace(/[\s-]/g, ''))) {
      return res.status(400).json({ 
        message: 'Format nomor HP tidak valid. Gunakan 10-15 digit angka.' 
      });
    }

    console.log('🔄 [UPDATE SELF PAWRENT] Calling stored procedure UpdatePawrentSelf');
    console.log(`📊 [UPDATE SELF PAWRENT] Parameters: Pawrent ID: ${pawrent_id}`);
    
    const [result]: any = await pool.execute(
      'CALL UpdatePawrentSelf(?, ?, ?, ?, ?, ?, ?)',
      [
        pawrent_id,
        nama_depan_pawrent,
        nama_belakang_pawrent,
        alamat_pawrent || null,
        kota_pawrent || null,
        kode_pos_pawrent || null,
        nomor_hp
      ]
    );
    
    const updatedPawrent = result[0][0];
    console.log(`✅ [UPDATE SELF PAWRENT] Success for Pawrent ID: ${pawrent_id}`);
    res.json(updatedPawrent);
  } catch (error: any) {
    console.error('❌ [UPDATE SELF PAWRENT] Error:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        message: 'Nomor HP sudah terdaftar oleh pawrent lain' 
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