import express from 'express';
import pool from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { RowDataPacket } from 'mysql2';

const router = express.Router();

// GET LAYANAN BY KUNJUNGAN
// ========================================================
router.get('/kunjungan/:kunjunganId', authenticate, async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  
  try {
    const { kunjunganId } = req.params;
    
    const [rows] = await pool.execute(
      'CALL GetLayananByKunjungan(?)',
      [kunjunganId]
    ) as [RowDataPacket[][], any];
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error getting layanan by kunjungan:', error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ADD LAYANAN TO KUNJUNGAN
// (Body: { kunjungan_id, kode_layanan })
// ========================================================
router.post('/', authenticate, async (req: AuthRequest, res) => {
  const { kunjungan_id, kode_layanan } = req.body;

  if (!kunjungan_id || !kode_layanan) {
    return res.status(400).json({ message: 'kunjungan_id dan kode_layanan diperlukan' });
  }

  try {
    const [result] = await pool.execute(
      'CALL AddLayananToKunjungan(?, ?, ?)',
      [kunjungan_id, kode_layanan, 1]  // Default qty to 1
    ) as [any[], any];

    res.status(201).json({ message: 'Layanan berhasil ditambahkan ke kunjungan', data: result[0] });
  } catch (error: any) {
    console.error('Error adding layanan to kunjungan:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE LAYANAN FROM KUNJUNGAN
// (Menggunakan composite key Anda: kunjunganId dan kodeLayanan)
// ========================================================
router.delete('/:kunjunganId/:kodeLayanan', authenticate, async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  const { kunjunganId, kodeLayanan } = req.params;

  try {
    await pool.execute(
      'CALL DeleteLayananFromKunjungan(?, ?)',
      [kunjunganId, kodeLayanan]
    );
    
    res.json({ message: 'Layanan berhasil dihapus dari kunjungan' });
  } catch (error: any) {
    console.error('Error deleting layanan kunjungan:', error);
    if (error.sqlState === '45000') {
      return res.status(404).json({ message: error.sqlMessage });
    }
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: error?.message || 'Unknown error'
    });
  }
});

export default router;