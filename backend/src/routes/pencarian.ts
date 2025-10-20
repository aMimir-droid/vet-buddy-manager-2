import express from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { RowDataPacket } from 'mysql2';

const router = express.Router();

// GET Riwayat Kunjungan by Hewan
router.get('/riwayat-kunjungan/:hewanId', authenticate, authorize(1), async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  const { hewanId } = req.params;
  try {
    const [rows] = await pool.execute('CALL GetRiwayatKunjunganByHewan(?)', [hewanId]) as [RowDataPacket[][], any];
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// GET Hewan by Jenis
router.get('/hewan-by-jenis/:jenisId', authenticate, authorize(1), async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  const { jenisId } = req.params;
  try {
    const [rows] = await pool.execute('CALL GetHewanByJenis(?)', [jenisId]) as [RowDataPacket[][], any];
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// GET Kunjungan by Date Range
router.get('/kunjungan-by-date', authenticate, authorize(1), async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  const { start, end } = req.query;
  try {
    const [rows] = await pool.execute('CALL GetKunjunganByDateRange(?, ?)', [start, end]) as [RowDataPacket[][], any];
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;