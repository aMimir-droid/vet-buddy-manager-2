import express from 'express';
import pool from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { RowDataPacket } from 'mysql2';

const router = express.Router();

// ========================================================
// GET ALL OBAT - Menggunakan Stored Procedure
// ========================================================
router.get('/', authenticate, async (req, res) => {
  console.log('📋 [GET ALL OBAT] Request received');
  try {
    console.log('🔄 [GET ALL OBAT] Calling stored procedure GetAllObat');
    const [rows]: any = await pool.execute('CALL GetAllObat()');
    console.log(`✅ [GET ALL OBAT] Success - ${rows[0]?.length || 0} obat found`);
    res.json(rows[0]);
  } catch (error: any) {
    console.error('❌ [GET ALL OBAT] Error:', error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// GET OBAT BY ID - Menggunakan Stored Procedure
// ========================================================
router.get('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  console.log(`📋 [GET OBAT BY ID] Request received for ID: ${id}`);
  try {
    console.log(`🔄 [GET OBAT BY ID] Calling stored procedure GetObatById with ID: ${id}`);
    const [rows]: any = await pool.execute('CALL GetObatById(?)', [id]);
    
    if (rows[0].length === 0) {
      console.log(`⚠️ [GET OBAT BY ID] Not found for ID: ${id}`);
      return res.status(404).json({ message: 'Obat tidak ditemukan' });
    }
    
    console.log(`✅ [GET OBAT BY ID] Success for ID: ${id}`);
    res.json(rows[0][0]);
  } catch (error: any) {
    console.error(`❌ [GET OBAT BY ID] Error for ID: ${id}`, error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// CREATE OBAT - Menggunakan Stored Procedure (Admin only)
// ========================================================
router.post('/', authenticate, authorize(1), async (req, res) => {
  console.log('📋 [CREATE OBAT] Request received');
  console.log('📝 [CREATE OBAT] Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { nama_obat, kegunaan, harga_obat } = req.body;
    
    // Validate required fields
    if (!nama_obat || harga_obat === undefined) {
      return res.status(400).json({ 
        message: 'Nama obat dan harga wajib diisi' 
      });
    }

    // Validate harga_obat
    if (parseFloat(harga_obat) < 0) {
      return res.status(400).json({ message: 'Harga obat tidak boleh negatif' });
    }

    console.log('🔄 [CREATE OBAT] Calling stored procedure CreateObat');
    console.log(`📊 [CREATE OBAT] Parameters: Nama: ${nama_obat}, Harga: ${harga_obat}`);
    
    const [result]: any = await pool.execute(
      'CALL CreateObat(?, ?, ?)',
      [
        nama_obat,
        kegunaan || null,
        harga_obat
      ]
    );
    
    const newObat = result[0][0];
    console.log(`✅ [CREATE OBAT] Success - New Obat ID: ${newObat?.obat_id}`);
    res.status(201).json(newObat);
  } catch (error: any) {
    console.error('❌ [CREATE OBAT] Error:', error);
    console.error('Error details:', error.message);
    
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
// UPDATE OBAT - Menggunakan Stored Procedure (Admin only)
// ========================================================
router.put('/:id', authenticate, authorize(1), async (req, res) => {
  const { id } = req.params;
  console.log(`📋 [UPDATE OBAT] Request received for ID: ${id}`);
  console.log('📝 [UPDATE OBAT] Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { nama_obat, kegunaan, harga_obat } = req.body;
    
    // Validate required fields
    if (!nama_obat || harga_obat === undefined) {
      return res.status(400).json({ 
        message: 'Nama obat dan harga wajib diisi' 
      });
    }

    // Validate harga_obat
    if (parseFloat(harga_obat) < 0) {
      return res.status(400).json({ message: 'Harga obat tidak boleh negatif' });
    }

    console.log('🔄 [UPDATE OBAT] Calling stored procedure UpdateObat');
    console.log(`📊 [UPDATE OBAT] Parameters: ID: ${id}, Nama: ${nama_obat}, Harga: ${harga_obat}`);
    
    const [result]: any = await pool.execute(
      'CALL UpdateObat(?, ?, ?, ?)',
      [
        id,
        nama_obat,
        kegunaan || null,
        harga_obat
      ]
    );
    
    const updatedObat = result[0][0];
    console.log(`✅ [UPDATE OBAT] Success for ID: ${id}`);
    res.json(updatedObat);
  } catch (error: any) {
    console.error(`❌ [UPDATE OBAT] Error for ID: ${id}`, error);
    
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
// DELETE OBAT - Menggunakan Stored Procedure (Admin only)
// ========================================================
router.delete('/:id', authenticate, authorize(1), async (req, res) => {
  const { id } = req.params;
  console.log(`📋 [DELETE OBAT] Request received for ID: ${id}`);
  try {
    console.log(`🔄 [DELETE OBAT] Calling stored procedure DeleteObat for ID: ${id}`);
    const [result]: any = await pool.execute('CALL DeleteObat(?)', [id]);
    
    const affectedRows = result[0][0].affected_rows;

    if (affectedRows === 0) {
      console.log(`⚠️ [DELETE OBAT] Not found for ID: ${id}`);
      return res.status(404).json({ message: 'Obat tidak ditemukan' });
    }

    console.log(`✅ [DELETE OBAT] Success - Deleted ID: ${id}`);
    res.json({ message: 'Obat berhasil dihapus' });
  } catch (error: any) {
    console.error(`❌ [DELETE OBAT] Error for ID: ${id}`, error);
    
    if (error.sqlState === '45000') {
      return res.status(400).json({ message: error.sqlMessage });
    }
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET ALL OBAT FOR PAWRENT
router.get('/public/list', authenticate, authorize(3), async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  try {
    const [rows] = await pool.execute('CALL GetAllObat()') as [RowDataPacket[][], any];
    res.json(rows[0]);
  } catch (error) {
    console.error('❌ [GET ALL OBAT FOR PAWRENT] Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

export default router;