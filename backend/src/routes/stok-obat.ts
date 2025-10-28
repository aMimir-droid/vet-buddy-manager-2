import express from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { RowDataPacket } from 'mysql2';

const router = express.Router();

// ========================================================
// GET ALL STOK OBAT
// ========================================================
router.get('/', authenticate, async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  try {
    const [rows] = await pool.execute('CALL GetAllStokObat()') as [RowDataPacket[][], any];
    res.json(rows[0]);
  } catch (error) {
    console.error('Error getting all stok obat:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// ========================================================
// GET STOK BY OBAT ID
// ========================================================
router.get('/obat/:obatId', authenticate, async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  const { obatId } = req.params;
  try {
    const [rows] = await pool.execute('CALL GetStokByObatId(?)', [obatId]) as [RowDataPacket[][], any];
    if (rows[0].length === 0) {
      return res.status(404).json({ message: 'Stok obat tidak ditemukan' });
    }
    res.json(rows[0][0]);
  } catch (error) {
    console.error('Error getting stok by obat ID:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// ========================================================
// CREATE STOK OBAT (Admin only)
// ========================================================
router.post('/', authenticate, authorize(1), async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  const { obat_id, klinik_id, jumlah_stok } = req.body;  // Tambah klinik_id
  try {
    const [result] = await pool.execute('CALL CreateStokObat(?, ?, ?)', [obat_id, klinik_id, jumlah_stok]) as [RowDataPacket[][], any];
    res.status(201).json(result[0][0]);
  } catch (error: any) {
    console.error('Error creating stok obat:', error);
    if (error.sqlState === '45000') {
      return res.status(400).json({ message: error.sqlMessage });
    }
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// ========================================================
// UPDATE STOK OBAT (Admin only)
// ========================================================
router.put('/obat/:obatId/klinik/:klinikId', authenticate, authorize(1), async (req: AuthRequest, res) => {  // Update endpoint
  const pool = req.dbPool;
  const { obatId, klinikId } = req.params;
  const { jumlah_stok } = req.body;
  try {
    const [result] = await pool.execute('CALL UpdateStokObat(?, ?, ?)', [obatId, klinikId, jumlah_stok]) as [RowDataPacket[][], any];
    res.json(result[0][0]);
  } catch (error: any) {
    console.error('Error updating stok obat:', error);
    if (error.sqlState === '45000') {
      return res.status(400).json({ message: error.sqlMessage });
    }
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// ========================================================
// ADD MUTASI OBAT (dengan history)
// ========================================================
router.post('/mutasi', authenticate, async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  const { obat_id, klinik_id, tipe_mutasi, qty, sumber_mutasi, keterangan } = req.body;  // Update parameter
  const user_id = req.user.user_id;
  try {
    const [result] = await pool.execute('CALL AddMutasiObat(?, ?, ?, ?, ?, ?, ?)', [obat_id, klinik_id, tipe_mutasi, qty, sumber_mutasi, keterangan, user_id]) as [RowDataPacket[][], any];
    res.status(201).json(result[0][0]);
  } catch (error: any) {
    console.error('Error adding mutasi obat:', error);
    if (error.sqlState === '45000') {
      return res.status(400).json({ message: error.sqlMessage });
    }
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// ========================================================
// GET MUTASI BY OBAT ID
// ========================================================
router.get('/mutasi/obat/:obatId', authenticate, async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  const { obatId } = req.params;
  try {
    const [rows] = await pool.execute('CALL GetMutasiByObatId(?)', [obatId]) as [RowDataPacket[][], any];
    res.json(rows[0]);
  } catch (error) {
    console.error('Error getting mutasi by obat ID:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// ========================================================
// GET ALL MUTASI OBAT (Admin only)
// ========================================================
router.get('/mutasi', authenticate, authorize(1), async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  try {
    const [rows] = await pool.execute('CALL GetAllMutasiObat()') as [RowDataPacket[][], any];
    res.json(rows[0]);
  } catch (error) {
    console.error('Error getting all mutasi obat:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// ========================================================
// GET OBAT WITH STOK BY KLINIK (Admin Klinik only)
// ========================================================
router.get('/klinik/:klinikId/obat', authenticate, authorize(4), async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  const { klinikId } = req.params;
  const userKlinikId = req.user.klinik_id;

  // Validasi: Pastikan Admin Klinik hanya akses klinik mereka sendiri
  if (parseInt(klinikId) !== userKlinikId) {
    return res.status(403).json({ message: 'Akses ditolak: Anda hanya bisa melihat data klinik Anda' });
  }

  try {
    const [rows] = await pool.execute('CALL GetObatWithStokByKlinik(?)', [klinikId]) as [RowDataPacket[][], any];
    res.json(rows[0]);
  } catch (error) {
    console.error('Error getting obat with stok by klinik:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// ========================================================
// GET MUTASI BY KLINIK (Admin Klinik only)
// ========================================================
router.get('/klinik/:klinikId/mutasi', authenticate, authorize(4), async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  const { klinikId } = req.params;
  const userKlinikId = req.user.klinik_id;

  // Validasi: Pastikan Admin Klinik hanya akses klinik mereka sendiri
  if (parseInt(klinikId) !== userKlinikId) {
    return res.status(403).json({ message: 'Akses ditolak: Anda hanya bisa melihat data klinik Anda' });
  }

  try {
    const [rows] = await pool.execute('CALL GetMutasiByKlinik(?)', [klinikId]) as [RowDataPacket[][], any];
    res.json(rows[0]);
  } catch (error) {
    console.error('Error getting mutasi by klinik:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// ========================================================
// ADD MUTASI OBAT BY KLINIK (Admin Klinik only, dengan validasi klinik)
// ========================================================
router.post('/klinik/:klinikId/mutasi', authenticate, authorize(4), async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  const { klinikId } = req.params;
  const { obat_id, tipe_mutasi, qty, sumber_mutasi, keterangan } = req.body;
  const user_id = req.user.user_id;
  const userKlinikId = req.user.klinik_id;

  // Validasi: Pastikan Admin Klinik hanya mutasi di klinik mereka sendiri
  if (parseInt(klinikId) !== userKlinikId) {
    return res.status(403).json({ message: 'Akses ditolak: Anda hanya bisa mengelola stok klinik Anda' });
  }

  try {
    const [result] = await pool.execute('CALL AddMutasiObat(?, ?, ?, ?, ?, ?, ?)', [obat_id, klinikId, tipe_mutasi, qty, sumber_mutasi, keterangan, user_id]) as [RowDataPacket[][], any];
    res.status(201).json(result[0][0]);
  } catch (error: any) {
    console.error('Error adding mutasi obat by klinik:', error);
    if (error.sqlState === '45000') {
      return res.status(400).json({ message: error.sqlMessage });
    }
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// ========================================================
// GET ALL OBAT WITH STOK BY KLINIK (Admin Klinik only - tampilkan semua obat)
// ========================================================
router.get('/klinik/:klinikId/all-obat-stok', authenticate, authorize(4), async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  const { klinikId } = req.params;
  const userKlinikId = req.user.klinik_id;

  // Validasi: Pastikan Admin Klinik hanya akses klinik mereka sendiri
  if (parseInt(klinikId) !== userKlinikId) {
    return res.status(403).json({ message: 'Akses ditolak: Anda hanya bisa melihat data klinik Anda' });
  }

  try {
    const [rows] = await pool.execute('CALL GetAllObatWithStokByKlinik(?)', [klinikId]) as [RowDataPacket[][], any];
    res.json(rows[0]);
  } catch (error) {
    console.error('Error getting all obat with stok by klinik:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

export default router;