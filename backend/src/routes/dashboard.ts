import express from 'express';
import pool from '../config/database';
import { authenticate } from '../middleware/auth';
import { RowDataPacket } from 'mysql2';

const router = express.Router();

// Get dashboard statistics using stored procedure
router.get('/stats', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.execute('CALL GetDashboardStats()') as [RowDataPacket[][], any];
    res.json(rows[0][0]);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

export default router;