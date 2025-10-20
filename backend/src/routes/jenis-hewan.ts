import express from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { RowDataPacket } from 'mysql2';

const router = express.Router();

// GET ALL JENIS HEWAN
router.get('/', authenticate, authorize(1), async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  try {
    const [rows] = await pool.execute('CALL GetAllJenisHewan()') as [RowDataPacket[][], any];
    res.json(rows[0]);
  } catch (error) {
    console.error('❌ [GET ALL JENIS HEWAN] Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// GET ALL JENIS HEWAN (Pawrent only)
router.get('/public/list', authenticate, authorize(3), async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  try {
    const [rows] = await pool.execute('CALL GetAllJenisHewan()') as [RowDataPacket[][], any];
    res.json(rows[0]);
  } catch (error) {
    console.error('❌ [GET ALL JENIS HEWAN PAWRENT] Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// GET ALL JENIS HEWAN (Vet only)
router.get('/vet/list', authenticate, authorize(2), async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  try {
    const [rows] = await pool.execute('CALL GetAllJenisHewan()') as [RowDataPacket[][], any];
    res.json(rows[0]);
  } catch (error) {
    console.error('❌ [GET ALL JENIS HEWAN VET] Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// CREATE JENIS HEWAN
router.post('/', authenticate, authorize(1), async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  const { nama_jenis_hewan, deskripsi_jenis_hewan } = req.body;
  try {
    if (!nama_jenis_hewan) {
      return res.status(400).json({ message: 'Nama jenis hewan wajib diisi' });
    }
    const [result] = await pool.execute(
      'CALL CreateJenisHewan(?, ?)',
      [nama_jenis_hewan, deskripsi_jenis_hewan || null]
    ) as [RowDataPacket[][], any];
    res.status(201).json(result[0][0]);
  } catch (error) {
    console.error('❌ [CREATE JENIS HEWAN] Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// UPDATE JENIS HEWAN
router.put('/:id', authenticate, authorize(1), async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  const { id } = req.params;
  const { nama_jenis_hewan, deskripsi_jenis_hewan } = req.body;
  try {
    if (!nama_jenis_hewan) {
      return res.status(400).json({ message: 'Nama jenis hewan wajib diisi' });
    }
    const [result] = await pool.execute(
      'CALL UpdateJenisHewan(?, ?, ?)',
      [id, nama_jenis_hewan, deskripsi_jenis_hewan || null]
    ) as [RowDataPacket[][], any];
    res.json(result[0][0]);
  } catch (error) {
    console.error('❌ [UPDATE JENIS HEWAN] Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// DELETE JENIS HEWAN
router.delete('/:id', authenticate, authorize(1), async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  const { id } = req.params;
  try {
    await pool.execute('CALL DeleteJenisHewan(?)', [id]);
    res.json({ message: 'Jenis hewan berhasil dihapus' });
  } catch (error) {
    console.error('❌ [DELETE JENIS HEWAN] Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

export default router;