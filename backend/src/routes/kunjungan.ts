import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// ========================================================
// GET ALL - Menggunakan pool sesuai role user
// ========================================================
router.get('/', authenticate, async (req: AuthRequest, res) => {
  console.log('📋 [GET ALL KUNJUNGAN] Request received');
  const pool = req.dbPool; // Get pool from request
  
  try {
    console.log(`🔄 [GET ALL KUNJUNGAN] Using DB pool for role_id: ${req.user.role_id}`);
    const [rows]: any = await pool.execute('CALL GetAllKunjungan()');
    console.log(`✅ [GET ALL KUNJUNGAN] Success - ${rows[0]?.length || 0} records found`);
    res.json(rows[0]);
  } catch (error: any) {
    console.error('❌ [GET ALL KUNJUNGAN] Error:', error);
    
    // Handle permission errors
    if (error.code === 'ER_TABLEACCESS_DENIED_ERROR') {
      return res.status(403).json({ 
        message: 'Akses ditolak: Anda tidak memiliki hak akses ke resource ini' 
      });
    }
    
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// ========================================================
// GET BY ID - Menggunakan Stored Procedure
// ========================================================
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  console.log('📋 [GET KUNJUNGAN BY ID] Request received');
  const pool = req.dbPool;
  const { id } = req.params;
  
  try {
    console.log(`🔄 [GET KUNJUNGAN BY ID] Getting kunjungan ID: ${id}`);
    const [rows]: any = await pool.execute('CALL GetKunjunganById(?)', [id]);
    
    if (!rows[0] || rows[0].length === 0) {
      console.log(`❌ [GET KUNJUNGAN BY ID] Not found - ID: ${id}`);
      return res.status(404).json({ message: 'Kunjungan tidak ditemukan' });
    }
    
    console.log(`✅ [GET KUNJUNGAN BY ID] Success - ID: ${id}`);
    res.json(rows[0][0]);
  } catch (error: any) {
    console.error('❌ [GET KUNJUNGAN BY ID] Error:', error);
    
    // Handle permission errors
    if (error.code === 'ER_TABLEACCESS_DENIED_ERROR') {
      return res.status(403).json({ 
        message: 'Akses ditolak: Anda tidak memiliki hak akses ke resource ini' 
      });
    }
    
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// ========================================================
// GET HEWAN HISTORY - Menggunakan Stored Procedure
// ========================================================
router.get('/hewan/:hewanId/history', authenticate, async (req: AuthRequest, res) => {
  console.log('📋 [GET HEWAN HISTORY] Request received');
  const pool = req.dbPool;
  const { hewanId } = req.params;
  
  try {
    console.log(`🔄 [GET HEWAN HISTORY] Getting history for hewan ID: ${hewanId}`);
    const [rows]: any = await pool.execute('CALL GetHewanKunjunganHistory(?)', [hewanId]);
    console.log(`✅ [GET HEWAN HISTORY] Success - ${rows[0]?.length || 0} records found`);
    res.json(rows[0]);
  } catch (error: any) {
    console.error('❌ [GET HEWAN HISTORY] Error:', error);
    
    // Handle permission errors
    if (error.code === 'ER_TABLEACCESS_DENIED_ERROR') {
      return res.status(403).json({ 
        message: 'Akses ditolak: Anda tidak memiliki hak akses ke resource ini' 
      });
    }
    
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// ========================================================
// CREATE - Menggunakan pool sesuai role user
// ========================================================
router.post('/', authenticate, async (req: AuthRequest, res) => {
  console.log('📋 [CREATE KUNJUNGAN] Request received');
  const pool = req.dbPool;
  
  try {
    const { 
      hewan_id, 
      dokter_id, 
      tanggal_kunjungan, 
      waktu_kunjungan, 
      catatan, 
      total_biaya, 
      metode_pembayaran,
      kunjungan_sebelumnya 
    } = req.body;

    console.log(`🔄 [CREATE KUNJUNGAN] Creating kunjungan for hewan_id: ${hewan_id}`);
    
    const [result]: any = await pool.execute(
      'CALL CreateKunjungan(?, ?, ?, ?, ?, ?, ?, ?)',
      [
        hewan_id,
        dokter_id,
        tanggal_kunjungan,
        waktu_kunjungan,
        catatan || null,
        total_biaya,
        metode_pembayaran,
        kunjungan_sebelumnya || null
      ]
    );

    const newKunjungan = result[0][0];
    console.log(`✅ [CREATE KUNJUNGAN] Success - New Kunjungan ID: ${newKunjungan?.kunjungan_id}`);
    
    res.status(201).json({
      message: 'Kunjungan berhasil ditambahkan',
      data: newKunjungan
    });
  } catch (error: any) {
    console.error('❌ [CREATE KUNJUNGAN] Error:', error);
    
    if (error.code === 'ER_TABLEACCESS_DENIED_ERROR') {
      return res.status(403).json({ 
        message: 'Akses ditolak: Anda tidak memiliki hak akses untuk membuat data ini' 
      });
    }
    
    res.status(500).json({ message: error.message || 'Terjadi kesalahan server' });
  }
});

// ========================================================
// UPDATE - Menggunakan pool sesuai role user
// ========================================================
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  console.log('📋 [UPDATE KUNJUNGAN] Request received');
  const pool = req.dbPool;
  const { id } = req.params;
  
  try {
    const { 
      tanggal_kunjungan, 
      waktu_kunjungan, 
      catatan, 
      total_biaya, 
      metode_pembayaran,
      kunjungan_sebelumnya 
    } = req.body;

    console.log(`🔄 [UPDATE KUNJUNGAN] Updating kunjungan ID: ${id}`);
    
    const [result]: any = await pool.execute(
      'CALL UpdateKunjungan(?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        tanggal_kunjungan,
        waktu_kunjungan,
        catatan || null,
        total_biaya,
        metode_pembayaran,
        kunjungan_sebelumnya || null
      ]
    );

    if (!result[0] || result[0].length === 0) {
      console.log(`❌ [UPDATE KUNJUNGAN] Not found - ID: ${id}`);
      return res.status(404).json({ message: 'Kunjungan tidak ditemukan' });
    }

    console.log(`✅ [UPDATE KUNJUNGAN] Success - ID: ${id}`);
    res.json({
      message: 'Kunjungan berhasil diupdate',
      data: result[0][0]
    });
  } catch (error: any) {
    console.error('❌ [UPDATE KUNJUNGAN] Error:', error);
    
    if (error.code === 'ER_TABLEACCESS_DENIED_ERROR') {
      return res.status(403).json({ 
        message: 'Akses ditolak: Anda tidak memiliki hak akses untuk mengubah data ini' 
      });
    }
    
    res.status(500).json({ message: error.message || 'Terjadi kesalahan server' });
  }
});

// ========================================================
// DELETE - Menggunakan pool sesuai role user
// ========================================================
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  console.log('📋 [DELETE KUNJUNGAN] Request received');
  const pool = req.dbPool;
  const { id } = req.params;
  
  try {
    console.log(`🔄 [DELETE KUNJUNGAN] Deleting kunjungan ID: ${id}`);
    const [result]: any = await pool.execute('CALL DeleteKunjungan(?)', [id]);
    
    if (!result.affectedRows && result[0]?.affectedRows === 0) {
      console.log(`❌ [DELETE KUNJUNGAN] Not found - ID: ${id}`);
      return res.status(404).json({ message: 'Kunjungan tidak ditemukan' });
    }

    console.log(`✅ [DELETE KUNJUNGAN] Success - ID: ${id}`);
    res.json({ message: 'Kunjungan berhasil dihapus' });
  } catch (error: any) {
    console.error('❌ [DELETE KUNJUNGAN] Error:', error);
    
    if (error.code === 'ER_TABLEACCESS_DENIED_ERROR') {
      return res.status(403).json({ 
        message: 'Akses ditolak: Anda tidak memiliki hak akses untuk menghapus data ini' 
      });
    }
    
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// ========================================================
// GET BY DATE RANGE - Menggunakan Stored Procedure
// ========================================================
router.get('/date-range/:startDate/:endDate', authenticate, async (req: AuthRequest, res) => {
  console.log('📋 [GET KUNJUNGAN BY DATE RANGE] Request received');
  const pool = req.dbPool;
  const { startDate, endDate } = req.params;
  
  try {
    console.log(`🔄 [GET KUNJUNGAN BY DATE RANGE] Getting data from ${startDate} to ${endDate}`);
    const [rows]: any = await pool.execute(
      'CALL GetKunjunganByDateRange(?, ?)',
      [startDate, endDate]
    );
    console.log(`✅ [GET KUNJUNGAN BY DATE RANGE] Success - ${rows[0]?.length || 0} records found`);
    res.json(rows[0]);
  } catch (error: any) {
    console.error('❌ [GET KUNJUNGAN BY DATE RANGE] Error:', error);
    
    // Handle permission errors
    if (error.code === 'ER_TABLEACCESS_DENIED_ERROR') {
      return res.status(403).json({ 
        message: 'Akses ditolak: Anda tidak memiliki hak akses ke resource ini' 
      });
    }
    
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

export default router;

