import express from 'express';
import pool from '../config/database';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// ========================================================
// GET ALL - Menggunakan Stored Procedure
// ========================================================
router.get('/', authenticate, async (req, res) => {
  console.log('📋 [GET ALL KUNJUNGAN] Request received');
  try {
    console.log('🔄 [GET ALL KUNJUNGAN] Calling stored procedure GetAllKunjungan');
    const [rows]: any = await pool.execute('CALL GetAllKunjungan()');
    console.log(`✅ [GET ALL KUNJUNGAN] Success - ${rows[0]?.length || 0} records found`);
    res.json(rows[0]);
  } catch (error) {
    console.error('❌ [GET ALL KUNJUNGAN] Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// ========================================================
// GET BY ID - Menggunakan Stored Procedure
// ========================================================
router.get('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  console.log(`📋 [GET KUNJUNGAN BY ID] Request received for ID: ${id}`);
  try {
    console.log(`🔄 [GET KUNJUNGAN BY ID] Calling stored procedure GetKunjunganById with ID: ${id}`);
    const [rows]: any = await pool.execute('CALL GetKunjunganById(?)', [id]);
    
    if (rows[0].length === 0) {
      console.log(`⚠️ [GET KUNJUNGAN BY ID] Not found for ID: ${id}`);
      return res.status(404).json({ message: 'Kunjungan tidak ditemukan' });
    }
    
    console.log(`✅ [GET KUNJUNGAN BY ID] Success for ID: ${id}`);
    res.json(rows[0][0]);
  } catch (error) {
    console.error(`❌ [GET KUNJUNGAN BY ID] Error for ID: ${id}`, error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// ========================================================
// GET HEWAN HISTORY - Menggunakan Stored Procedure
// ========================================================
router.get('/hewan/:hewanId/history', authenticate, async (req, res) => {
  const { hewanId } = req.params;
  console.log(`📋 [GET HEWAN HISTORY] Request received for Hewan ID: ${hewanId}`);
  try {
    console.log(`🔄 [GET HEWAN HISTORY] Calling stored procedure GetHewanKunjunganHistory with Hewan ID: ${hewanId}`);
    const [rows]: any = await pool.execute('CALL GetHewanKunjunganHistory(?)', [hewanId]);
    console.log(`✅ [GET HEWAN HISTORY] Success - ${rows[0]?.length || 0} records found for Hewan ID: ${hewanId}`);
    res.json(rows[0]);
  } catch (error) {
    console.error(`❌ [GET HEWAN HISTORY] Error for Hewan ID: ${hewanId}`, error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// ========================================================
// CREATE - Menggunakan Stored Procedure
// ========================================================
router.post('/', authenticate, async (req, res) => {
  console.log('📋 [CREATE KUNJUNGAN] Request received');
  console.log('📝 [CREATE KUNJUNGAN] Request body:', JSON.stringify(req.body, null, 2));
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

    console.log('🔄 [CREATE KUNJUNGAN] Calling stored procedure CreateKunjungan');
    console.log(`📊 [CREATE KUNJUNGAN] Parameters: Hewan ID: ${hewan_id}, Dokter ID: ${dokter_id}, Tanggal: ${tanggal_kunjungan}, Previous Visit: ${kunjungan_sebelumnya || 'None'}`);
    
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
    res.status(500).json({ message: error.message || 'Terjadi kesalahan server' });
  }
});

// ========================================================
// UPDATE - Menggunakan Stored Procedure
// ========================================================
router.put('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  console.log(`📋 [UPDATE KUNJUNGAN] Request received for ID: ${id}`);
  console.log('📝 [UPDATE KUNJUNGAN] Request body:', JSON.stringify(req.body, null, 2));
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

    console.log('🔄 [UPDATE KUNJUNGAN] Calling stored procedure UpdateKunjungan');
    console.log(`📊 [UPDATE KUNJUNGAN] Parameters: ID: ${id}, Hewan ID: ${hewan_id}, Dokter ID: ${dokter_id}, Previous Visit: ${kunjungan_sebelumnya || 'None'}`);
    
    const [result]: any = await pool.execute(
      'CALL UpdateKunjungan(?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id,
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

    const updatedKunjungan = result[0][0];
    console.log(`✅ [UPDATE KUNJUNGAN] Success for ID: ${id}`);
    res.json({
      message: 'Kunjungan berhasil diupdate',
      data: updatedKunjungan
    });
  } catch (error: any) {
    console.error(`❌ [UPDATE KUNJUNGAN] Error for ID: ${id}`, error);
    res.status(500).json({ message: error.message || 'Terjadi kesalahan server' });
  }
});

// ========================================================
// DELETE - Menggunakan Stored Procedure
// ========================================================
router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  console.log(`📋 [DELETE KUNJUNGAN] Request received for ID: ${id}`);
  try {
    console.log(`🔄 [DELETE KUNJUNGAN] Calling stored procedure DeleteKunjungan for ID: ${id}`);
    const [result]: any = await pool.execute('CALL DeleteKunjungan(?)', [id]);
    
    const affectedRows = result[0][0].affected_rows;

    if (affectedRows === 0) {
      console.log(`⚠️ [DELETE KUNJUNGAN] Not found for ID: ${id}`);
      return res.status(404).json({ message: 'Kunjungan tidak ditemukan' });
    }

    console.log(`✅ [DELETE KUNJUNGAN] Success - Deleted ID: ${id}`);
    res.json({ message: 'Kunjungan berhasil dihapus' });
  } catch (error) {
    console.error(`❌ [DELETE KUNJUNGAN] Error for ID: ${id}`, error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// ========================================================
// GET BY DATE RANGE - Menggunakan Stored Procedure
// ========================================================
router.get('/date-range/:startDate/:endDate', authenticate, async (req, res) => {
  const { startDate, endDate } = req.params;
  console.log(`📋 [GET BY DATE RANGE] Request received from ${startDate} to ${endDate}`);
  try {
    console.log(`🔄 [GET BY DATE RANGE] Calling stored procedure GetKunjunganByDateRange`);
    const [rows]: any = await pool.execute(
      'CALL GetKunjunganByDateRange(?, ?)',
      [startDate, endDate]
    );

    console.log(`✅ [GET BY DATE RANGE] Success - ${rows[0]?.length || 0} records found`);
    res.json(rows[0]);
  } catch (error) {
    console.error(`❌ [GET BY DATE RANGE] Error from ${startDate} to ${endDate}`, error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

export default router;

