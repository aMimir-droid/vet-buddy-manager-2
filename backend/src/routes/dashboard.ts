import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { RowDataPacket } from 'mysql2';

const router = express.Router();

// Get dashboard statistics using stored procedure
router.get('/stats', authenticate, async (req: AuthRequest, res) => {
  const pool = req.dbPool; // ✅ Gunakan pool dari request
  
  try {
    console.log(`🔄 [DASHBOARD STATS] Using DB pool for role_id: ${req.user.role_id}`);
    const [rows] = await pool.execute('CALL GetDashboardStats()') as [RowDataPacket[][], any];
    res.json(rows[0][0]);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

export default router;