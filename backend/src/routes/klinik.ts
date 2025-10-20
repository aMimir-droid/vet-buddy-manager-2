import express from 'express';
import pool from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { RowDataPacket } from 'mysql2';

const router = express.Router();

// ========================================================
// GET ALL KLINIK - Menggunakan Stored Procedure
// ========================================================
router.get('/', authenticate, async (req, res) => {
  console.log('📋 [GET ALL KLINIK] Request received');
  try {
    console.log('🔄 [GET ALL KLINIK] Calling stored procedure GetAllKlinik');
    const [rows]: any = await pool.execute('CALL GetAllKlinik()');
    console.log(`✅ [GET ALL KLINIK] Success - ${rows[0]?.length || 0} klinik found`);
    res.json(rows[0]);
  } catch (error: any) {
    console.error('❌ [GET ALL KLINIK] Error:', error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// GET KLINIK BY ID - Menggunakan Stored Procedure
// ========================================================
router.get('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  console.log(`📋 [GET KLINIK BY ID] Request received for ID: ${id}`);
  try {
    console.log(`🔄 [GET KLINIK BY ID] Calling stored procedure GetKlinikById with ID: ${id}`);
    const [rows]: any = await pool.execute('CALL GetKlinikById(?)', [id]);
    
    if (rows[0].length === 0) {
      console.log(`⚠️ [GET KLINIK BY ID] Not found for ID: ${id}`);
      return res.status(404).json({ message: 'Klinik tidak ditemukan' });
    }
    
    console.log(`✅ [GET KLINIK BY ID] Success for ID: ${id}`);
    res.json(rows[0][0]);
  } catch (error: any) {
    console.error(`❌ [GET KLINIK BY ID] Error for ID: ${id}`, error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// CREATE KLINIK - Menggunakan Stored Procedure (Admin only)
// ========================================================
router.post('/', authenticate, authorize(1), async (req, res) => {
  console.log('📋 [CREATE KLINIK] Request received');
  console.log('📝 [CREATE KLINIK] Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { nama_klinik, alamat_klinik, telepon_klinik } = req.body;
    
    // Validate required fields
    if (!nama_klinik || !alamat_klinik) {
      return res.status(400).json({ 
        message: 'Nama klinik dan alamat wajib diisi' 
      });
    }

    console.log('🔄 [CREATE KLINIK] Calling stored procedure CreateKlinik');
    console.log(`📊 [CREATE KLINIK] Parameters: Nama: ${nama_klinik}, Alamat: ${alamat_klinik}`);
    
    const [result]: any = await pool.execute(
      'CALL CreateKlinik(?, ?, ?)',
      [
        nama_klinik,
        alamat_klinik,
        telepon_klinik || null
      ]
    );
    
    const newKlinik = result[0][0];
    console.log(`✅ [CREATE KLINIK] Success - New Klinik ID: ${newKlinik?.klinik_id}`);
    res.status(201).json(newKlinik);
  } catch (error: any) {
    console.error('❌ [CREATE KLINIK] Error:', error);
    console.error('Error details:', error.message);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Nomor telepon klinik sudah terdaftar' });
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
// UPDATE KLINIK - Menggunakan Stored Procedure (Admin only)
// ========================================================
router.put('/:id', authenticate, authorize(1), async (req, res) => {
  const { id } = req.params;
  console.log(`📋 [UPDATE KLINIK] Request received for ID: ${id}`);
  console.log('📝 [UPDATE KLINIK] Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { nama_klinik, alamat_klinik, telepon_klinik } = req.body;
    
    // Validate required fields
    if (!nama_klinik || !alamat_klinik) {
      return res.status(400).json({ 
        message: 'Nama klinik dan alamat wajib diisi' 
      });
    }

    console.log('🔄 [UPDATE KLINIK] Calling stored procedure UpdateKlinik');
    console.log(`📊 [UPDATE KLINIK] Parameters: ID: ${id}, Nama: ${nama_klinik}`);
    
    const [result]: any = await pool.execute(
      'CALL UpdateKlinik(?, ?, ?, ?)',
      [
        id,
        nama_klinik,
        alamat_klinik,
        telepon_klinik || null
      ]
    );
    
    const updatedKlinik = result[0][0];
    console.log(`✅ [UPDATE KLINIK] Success for ID: ${id}`);
    res.json(updatedKlinik);
  } catch (error: any) {
    console.error(`❌ [UPDATE KLINIK] Error for ID: ${id}`, error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Nomor telepon klinik sudah terdaftar' });
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
// DELETE KLINIK - Menggunakan Stored Procedure (Admin only)
// ========================================================
router.delete('/:id', authenticate, authorize(1), async (req, res) => {
  const { id } = req.params;
  console.log(`📋 [DELETE KLINIK] Request received for ID: ${id}`);
  try {
    console.log(`🔄 [DELETE KLINIK] Calling stored procedure DeleteKlinik for ID: ${id}`);
    const [result]: any = await pool.execute('CALL DeleteKlinik(?)', [id]);
    
    const affectedRows = result[0][0].affected_rows;

    if (affectedRows === 0) {
      console.log(`⚠️ [DELETE KLINIK] Not found for ID: ${id}`);
      return res.status(404).json({ message: 'Klinik tidak ditemukan' });
    }

    console.log(`✅ [DELETE KLINIK] Success - Deleted ID: ${id}`);
    res.json({ message: 'Klinik berhasil dihapus' });
  } catch (error: any) {
    console.error(`❌ [DELETE KLINIK] Error for ID: ${id}`, error);
    
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
// GET DOKTERS BY KLINIK - Menggunakan Stored Procedure
// ========================================================
router.get('/:id/dokters', authenticate, async (req, res) => {
  const { id } = req.params;
  console.log(`📋 [GET DOKTERS BY KLINIK] Request received for Klinik ID: ${id}`);
  try {
    console.log(`🔄 [GET DOKTERS BY KLINIK] Calling stored procedure GetDoktersByKlinik with ID: ${id}`);
    const [rows]: any = await pool.execute('CALL GetDoktersByKlinik(?)', [id]);
    console.log(`✅ [GET DOKTERS BY KLINIK] Success - ${rows[0]?.length || 0} dokters found`);
    res.json(rows[0]);
  } catch (error: any) {
    console.error(`❌ [GET DOKTERS BY KLINIK] Error for Klinik ID: ${id}`, error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET ALL KLINIK FOR PAWRENT
router.get('/public/list', authenticate, authorize(3), async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  try {
    const [rows] = await pool.execute('CALL GetAllKlinik()') as [RowDataPacket[][], any];
    res.json(rows[0]);
  } catch (error) {
    console.error('❌ [GET ALL KLINIK PAWRENT] Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

export default router;