import express from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { RowDataPacket } from 'mysql2';

const router = express.Router();

// ========================================================
// GET ALL AUDIT LOGS (Admin only)
// ========================================================
router.get('/', authenticate, authorize(1), async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  
  try {
    const { 
      start_date, 
      end_date, 
      table_name, 
      action_type,
      klinik_id,
      limit = 100,
      offset = 0 
    } = req.query;

    console.log('📋 [GET AUDIT LOGS] Request received with filters:', {
      start_date, end_date, table_name, action_type, klinik_id, limit, offset
    });

    const [rows] = await pool.execute(
      'CALL GetAuditLogs(?, ?, ?, ?, ?, ?, ?)',
      [
        start_date || null,
        end_date || null,
        table_name || null,
        action_type || null,
        klinik_id || null,
        parseInt(limit as string),
        parseInt(offset as string)
      ]
    ) as [RowDataPacket[][], any];

    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM AuditLog 
       WHERE (? IS NULL OR DATE(executed_at) >= ?)
         AND (? IS NULL OR DATE(executed_at) <= ?)
         AND (? IS NULL OR table_name = ?)
         AND (? IS NULL OR action_type = ?)
         AND (? IS NULL OR klinik_id = ?)`,
      [
        start_date || null, start_date || null,
        end_date || null, end_date || null,
        table_name || null, table_name || null,
        action_type || null, action_type || null,
        klinik_id || null, klinik_id || null
      ]
    ) as [RowDataPacket[], any];

    console.log(`✅ [GET AUDIT LOGS] Success - ${rows[0]?.length || 0} logs found`);

    res.json({
      data: rows[0],
      total: countResult[0].total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (error: any) {
    console.error('❌ [GET AUDIT LOGS] Error:', error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// GET AUDIT LOGS BY KLINIK (Admin Klinik only)
// ========================================================
router.get('/by-klinik', authenticate, authorize(4), async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  const klinikId = req.user.klinik_id;
  
  if (!klinikId) {
    return res.status(400).json({ message: 'Klinik ID tidak ditemukan' });
  }

  try {
    const { 
      start_date, 
      end_date,
      limit = 100,
      offset = 0 
    } = req.query;

    console.log(`📋 [GET AUDIT LOGS BY KLINIK] Request for klinik ${klinikId}`);

    const [rows] = await pool.execute(
      'CALL GetAuditLogsByKlinik(?, ?, ?, ?, ?)',
      [
        klinikId,
        start_date || null,
        end_date || null,
        parseInt(limit as string),
        parseInt(offset as string)
      ]
    ) as [RowDataPacket[][], any];

    // Get total count for this klinik
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM AuditLog 
       WHERE klinik_id = ?
         AND (? IS NULL OR DATE(executed_at) >= ?)
         AND (? IS NULL OR DATE(executed_at) <= ?)`,
      [
        klinikId,
        start_date || null, start_date || null,
        end_date || null, end_date || null
      ]
    ) as [RowDataPacket[], any];

    console.log(`✅ [GET AUDIT LOGS BY KLINIK] Success - ${rows[0]?.length || 0} logs found`);

    res.json({
      data: rows[0],
      total: countResult[0].total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      klinik_id: klinikId
    });
  } catch (error: any) {
    console.error('❌ [GET AUDIT LOGS BY KLINIK] Error:', error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// GET AUDIT LOG STATISTICS
// ========================================================
router.get('/stats', authenticate, async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  
  try {
    // Admin Klinik only sees their klinik's stats
    const klinikId = req.user.role_id === 4 ? req.user.klinik_id : null;

    console.log('📊 [GET AUDIT STATS] Request received', klinikId ? `for klinik ${klinikId}` : '(all kliniks)');

    const [rows] = await pool.execute(
      'CALL GetAuditLogStats(?)',
      [klinikId]
    ) as [RowDataPacket[][], any];

    console.log('✅ [GET AUDIT STATS] Success');
    res.json(rows[0][0]);
  } catch (error: any) {
    console.error('❌ [GET AUDIT STATS] Error:', error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// GET LOGS BY TABLE
// ========================================================
router.get('/by-table', authenticate, async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  
  try {
    const klinikId = req.user.role_id === 4 ? req.user.klinik_id : null;

    console.log('📊 [GET LOGS BY TABLE] Request received');

    const [rows] = await pool.execute(
      'CALL GetAuditLogsByTable(?)',
      [klinikId]
    ) as [RowDataPacket[][], any];

    console.log(`✅ [GET LOGS BY TABLE] Success - ${rows[0]?.length || 0} tables found`);
    res.json(rows[0]);
  } catch (error: any) {
    console.error('❌ [GET LOGS BY TABLE] Error:', error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// GET LOGS BY USER
// ========================================================
router.get('/by-user', authenticate, async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  
  try {
    const klinikId = req.user.role_id === 4 ? req.user.klinik_id : null;

    console.log('📊 [GET LOGS BY USER] Request received');

    const [rows] = await pool.execute(
      'CALL GetAuditLogsByUser(?)',
      [klinikId]
    ) as [RowDataPacket[][], any];

    console.log(`✅ [GET LOGS BY USER] Success - ${rows[0]?.length || 0} users found`);
    res.json(rows[0]);
  } catch (error: any) {
    console.error('❌ [GET LOGS BY USER] Error:', error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// GET LOG DETAIL BY ID
// ========================================================
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  const { id } = req.params;
  
  try {
    console.log(`📋 [GET AUDIT LOG BY ID] Request for ID: ${id}`);

    const [rows] = await pool.execute(
      'CALL GetAuditLogById(?)',
      [id]
    ) as [RowDataPacket[][], any];

    if (rows[0].length === 0) {
      return res.status(404).json({ message: 'Audit log tidak ditemukan' });
    }

    // If user is Admin Klinik, verify the log is for their klinik
    if (req.user.role_id === 4) {
      const log = rows[0][0];
      if (log.klinik_id && log.klinik_id !== req.user.klinik_id) {
        return res.status(403).json({ message: 'Akses ditolak - Log bukan untuk klinik Anda' });
      }
    }

    console.log(`✅ [GET AUDIT LOG BY ID] Success for ID: ${id}`);
    res.json(rows[0][0]);
  } catch (error: any) {
    console.error(`❌ [GET AUDIT LOG BY ID] Error for ID: ${id}`, error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;