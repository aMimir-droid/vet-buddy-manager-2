import express from 'express';
import pool from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { RowDataPacket } from 'mysql2';

const router = express.Router();

// ========================================================
// GET ALL LAYANAN - Menggunakan Stored Procedure
// ========================================================
router.get('/', authenticate, async (req, res) => {
  console.log('📋 [GET ALL LAYANAN] Request received');
  try {
    console.log('🔄 [GET ALL LAYANAN] Calling stored procedure GetAllLayanan');
    const [rows]: any = await pool.execute('CALL GetAllLayanan()');
    console.log(`✅ [GET ALL LAYANAN] Success - ${rows[0]?.length || 0} layanan found`);
    res.json(rows[0]);
  } catch (error: any) {
    console.error('❌ [GET ALL LAYANAN] Error:', error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// GET LAYANAN BY KODE - Menggunakan Stored Procedure
// ========================================================
router.get('/:kode', authenticate, async (req, res) => {
  const { kode } = req.params;
  console.log(`📋 [GET LAYANAN BY KODE] Request received for Kode: ${kode}`);
  try {
    console.log(`🔄 [GET LAYANAN BY KODE] Calling stored procedure GetLayananByKode with Kode: ${kode}`);
    const [rows]: any = await pool.execute('CALL GetLayananByKode(?)', [kode]);
    
    if (rows[0].length === 0) {
      console.log(`⚠️ [GET LAYANAN BY KODE] Not found for Kode: ${kode}`);
      return res.status(404).json({ message: 'Layanan tidak ditemukan' });
    }
    
    console.log(`✅ [GET LAYANAN BY KODE] Success for Kode: ${kode}`);
    res.json(rows[0][0]);
  } catch (error: any) {
    console.error(`❌ [GET LAYANAN BY KODE] Error for Kode: ${kode}`, error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// CREATE LAYANAN - Menggunakan Stored Procedure (Admin only)
// ========================================================
router.post('/', authenticate, authorize(1), async (req, res) => {
  console.log('📋 [CREATE LAYANAN] Request received');
  console.log('📝 [CREATE LAYANAN] Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { kode_layanan, nama_layanan, deskripsi_layanan, biaya_layanan } = req.body;
    
    // Validate required fields
    if (!kode_layanan || !nama_layanan || biaya_layanan === undefined) {
      return res.status(400).json({ 
        message: 'Kode layanan, nama layanan, dan biaya wajib diisi' 
      });
    }

    // Validate biaya_layanan
    if (parseFloat(biaya_layanan) < 0) {
      return res.status(400).json({ message: 'Biaya layanan tidak boleh negatif' });
    }

    console.log('🔄 [CREATE LAYANAN] Calling stored procedure CreateLayanan');
    console.log(`📊 [CREATE LAYANAN] Parameters: Kode: ${kode_layanan}, Nama: ${nama_layanan}, Biaya: ${biaya_layanan}`);
    
    const [result]: any = await pool.execute(
      'CALL CreateLayanan(?, ?, ?, ?)',
      [
        kode_layanan,
        nama_layanan,
        deskripsi_layanan || null,
        biaya_layanan
      ]
    );
    
    const newLayanan = result[0][0];
    console.log(`✅ [CREATE LAYANAN] Success - New Layanan Kode: ${newLayanan?.kode_layanan}`);
    res.status(201).json(newLayanan);
  } catch (error: any) {
    console.error('❌ [CREATE LAYANAN] Error:', error);
    console.error('Error details:', error.message);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Kode layanan sudah terdaftar' });
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
// UPDATE LAYANAN - Menggunakan Stored Procedure (Admin only)
// ========================================================
router.put('/:kode', authenticate, authorize(1), async (req, res) => {
  const { kode } = req.params;
  console.log(`📋 [UPDATE LAYANAN] Request received for Kode: ${kode}`);
  console.log('📝 [UPDATE LAYANAN] Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { nama_layanan, deskripsi_layanan, biaya_layanan } = req.body;
    
    // Validate required fields
    if (!nama_layanan || biaya_layanan === undefined) {
      return res.status(400).json({ 
        message: 'Nama layanan dan biaya wajib diisi' 
      });
    }

    // Validate biaya_layanan
    if (parseFloat(biaya_layanan) < 0) {
      return res.status(400).json({ message: 'Biaya layanan tidak boleh negatif' });
    }

    console.log('🔄 [UPDATE LAYANAN] Calling stored procedure UpdateLayanan');
    console.log(`📊 [UPDATE LAYANAN] Parameters: Kode: ${kode}, Nama: ${nama_layanan}, Biaya: ${biaya_layanan}`);
    
    const [result]: any = await pool.execute(
      'CALL UpdateLayanan(?, ?, ?, ?)',
      [
        kode,
        nama_layanan,
        deskripsi_layanan || null,
        biaya_layanan
      ]
    );
    
    const updatedLayanan = result[0][0];
    console.log(`✅ [UPDATE LAYANAN] Success for Kode: ${kode}`);
    res.json(updatedLayanan);
  } catch (error: any) {
    console.error(`❌ [UPDATE LAYANAN] Error for Kode: ${kode}`, error);
    
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
// DELETE LAYANAN - Menggunakan Stored Procedure (Admin only)
// ========================================================
router.delete('/:kode', authenticate, authorize(1), async (req, res) => {
  const { kode } = req.params;
  console.log(`📋 [DELETE LAYANAN] Request received for Kode: ${kode}`);
  try {
    console.log(`🔄 [DELETE LAYANAN] Calling stored procedure DeleteLayanan for Kode: ${kode}`);
    const [result]: any = await pool.execute('CALL DeleteLayanan(?)', [kode]);
    
    const affectedRows = result[0][0].affected_rows;

    if (affectedRows === 0) {
      console.log(`⚠️ [DELETE LAYANAN] Not found for Kode: ${kode}`);
      return res.status(404).json({ message: 'Layanan tidak ditemukan' });
    }

    console.log(`✅ [DELETE LAYANAN] Success - Deleted Kode: ${kode}`);
    res.json({ message: 'Layanan berhasil dihapus' });
  } catch (error: any) {
    console.error(`❌ [DELETE LAYANAN] Error for Kode: ${kode}`, error);
    
    if (error.sqlState === '45000') {
      return res.status(400).json({ message: error.sqlMessage });
    }
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET ALL LAYANAN FOR PAWRENT
router.get('/public/list', authenticate, authorize(3), async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  try {
    const [rows] = await pool.execute('CALL GetAllLayanan()') as [RowDataPacket[][], any];
    res.json(rows[0]);
  } catch (error) {
    console.error('❌ [GET ALL LAYANAN PAWRENT] Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

export default router;