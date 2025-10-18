import express from 'express';
import pool from '../config/database';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// ========================================================
// GET ALL DOKTERS - Menggunakan Stored Procedure
// ========================================================
router.get('/', authenticate, async (req, res) => {
  console.log('📋 [GET ALL DOKTERS] Request received');
  try {
    console.log('🔄 [GET ALL DOKTERS] Calling stored procedure GetAllDokters');
    const [rows]: any = await pool.execute('CALL GetAllDokters()');
    console.log(`✅ [GET ALL DOKTERS] Success - ${rows[0]?.length || 0} dokters found`);
    res.json(rows[0]);
  } catch (error: any) {
    console.error('❌ [GET ALL DOKTERS] Error:', error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// GET DOKTER BY ID - Menggunakan Stored Procedure
// ========================================================
router.get('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  console.log(`📋 [GET DOKTER BY ID] Request received for ID: ${id}`);
  try {
    console.log(`🔄 [GET DOKTER BY ID] Calling stored procedure GetDokterById with ID: ${id}`);
    const [rows]: any = await pool.execute('CALL GetDokterById(?)', [id]);
    
    if (rows[0].length === 0) {
      console.log(`⚠️ [GET DOKTER BY ID] Not found for ID: ${id}`);
      return res.status(404).json({ message: 'Dokter tidak ditemukan' });
    }
    
    console.log(`✅ [GET DOKTER BY ID] Success for ID: ${id}`);
    res.json(rows[0][0]);
  } catch (error: any) {
    console.error(`❌ [GET DOKTER BY ID] Error for ID: ${id}`, error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// GET ALL SPESIALISASI - Menggunakan Stored Procedure
// ========================================================
router.get('/spesialisasi/list', authenticate, async (req, res) => {
  console.log('📋 [GET SPESIALISASI] Request received');
  try {
    console.log('🔄 [GET SPESIALISASI] Calling stored procedure GetAllSpesialisasi');
    const [rows]: any = await pool.execute('CALL GetAllSpesialisasi()');
    console.log(`✅ [GET SPESIALISASI] Success - ${rows[0]?.length || 0} spesialisasi found`);
    res.json(rows[0]);
  } catch (error: any) {
    console.error('❌ [GET SPESIALISASI] Error:', error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// GET AVAILABLE KLINIKS - Menggunakan Stored Procedure
// ========================================================
router.get('/kliniks/available', authenticate, async (req, res) => {
  console.log('📋 [GET AVAILABLE KLINIKS] Request received');
  try {
    console.log('🔄 [GET AVAILABLE KLINIKS] Calling stored procedure GetAvailableKliniks');
    const [rows]: any = await pool.execute('CALL GetAvailableKliniks()');
    console.log(`✅ [GET AVAILABLE KLINIKS] Success - ${rows[0]?.length || 0} kliniks found`);
    res.json(rows[0]);
  } catch (error: any) {
    console.error('❌ [GET AVAILABLE KLINIKS] Error:', error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// CREATE DOKTER - Menggunakan Stored Procedure (Admin only)
// ========================================================
router.post('/', authenticate, authorize(1), async (req, res) => {
  console.log('📋 [CREATE DOKTER] Request received');
  console.log('📝 [CREATE DOKTER] Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { 
      title_dokter, 
      nama_dokter, 
      telepon_dokter, 
      tanggal_mulai_kerja, 
      spesialisasi_id, 
      klinik_id 
    } = req.body;
    
    // Validate required fields
    if (!title_dokter || !nama_dokter) {
      return res.status(400).json({ 
        message: 'Title dokter dan nama dokter wajib diisi' 
      });
    }

    console.log('🔄 [CREATE DOKTER] Calling stored procedure CreateDokter');
    console.log(`📊 [CREATE DOKTER] Parameters: Name: ${nama_dokter}, Title: ${title_dokter}, Spesialisasi: ${spesialisasi_id || 'None'}, Klinik: ${klinik_id || 'None'}`);
    
    const [result]: any = await pool.execute(
      'CALL CreateDokter(?, ?, ?, ?, ?, ?)',
      [
        title_dokter,
        nama_dokter,
        telepon_dokter || null,
        tanggal_mulai_kerja || null,
        spesialisasi_id || null,
        klinik_id || null
      ]
    );
    
    const newDokter = result[0][0];
    console.log(`✅ [CREATE DOKTER] Success - New Dokter ID: ${newDokter?.dokter_id}`);
    res.status(201).json(newDokter);
  } catch (error: any) {
    console.error('❌ [CREATE DOKTER] Error:', error);
    console.error('Error details:', error.message);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Nomor telepon dokter sudah terdaftar' });
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
// UPDATE DOKTER - Menggunakan Stored Procedure (Admin only)
// ========================================================
router.put('/:id', authenticate, authorize(1), async (req, res) => {
  const { id } = req.params;
  console.log(`📋 [UPDATE DOKTER] Request received for ID: ${id}`);
  console.log('📝 [UPDATE DOKTER] Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { 
      title_dokter, 
      nama_dokter, 
      telepon_dokter, 
      tanggal_mulai_kerja, 
      spesialisasi_id, 
      klinik_id 
    } = req.body;
    
    // Validate required fields
    if (!title_dokter || !nama_dokter) {
      return res.status(400).json({ 
        message: 'Title dokter dan nama dokter wajib diisi' 
      });
    }

    console.log('🔄 [UPDATE DOKTER] Calling stored procedure UpdateDokter');
    console.log(`📊 [UPDATE DOKTER] Parameters: ID: ${id}, Name: ${nama_dokter}, Title: ${title_dokter}`);
    
    const [result]: any = await pool.execute(
      'CALL UpdateDokter(?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        title_dokter,
        nama_dokter,
        telepon_dokter || null,
        tanggal_mulai_kerja || null,
        spesialisasi_id || null,
        klinik_id || null
      ]
    );
    
    const updatedDokter = result[0][0];
    console.log(`✅ [UPDATE DOKTER] Success for ID: ${id}`);
    res.json(updatedDokter);
  } catch (error: any) {
    console.error(`❌ [UPDATE DOKTER] Error for ID: ${id}`, error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Nomor telepon dokter sudah terdaftar' });
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
// DELETE DOKTER - Menggunakan Stored Procedure (Admin only)
// ========================================================
router.delete('/:id', authenticate, authorize(1), async (req, res) => {
  const { id } = req.params;
  console.log(`📋 [DELETE DOKTER] Request received for ID: ${id}`);
  try {
    console.log(`🔄 [DELETE DOKTER] Calling stored procedure DeleteDokter for ID: ${id}`);
    const [result]: any = await pool.execute('CALL DeleteDokter(?)', [id]);
    
    const affectedRows = result[0][0].affected_rows;

    if (affectedRows === 0) {
      console.log(`⚠️ [DELETE DOKTER] Not found for ID: ${id}`);
      return res.status(404).json({ message: 'Dokter tidak ditemukan' });
    }

    console.log(`✅ [DELETE DOKTER] Success - Deleted ID: ${id}`);
    res.json({ message: 'Dokter berhasil dihapus' });
  } catch (error: any) {
    console.error(`❌ [DELETE DOKTER] Error for ID: ${id}`, error);
    
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