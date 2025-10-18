import express from 'express';
import pool from '../config/database';
import { authenticate } from '../middleware/auth';
import { RowDataPacket } from 'mysql2';

const router = express.Router();

// Get all audit logs with filters
router.get('/', authenticate, async (req, res) => {
  try {
    const { 
      start_date, 
      end_date, 
      table_name, 
      action_type,
      executed_by,
      limit = 100,
      offset = 0 
    } = req.query;

    let query = `
      SELECT 
        log_id,
        table_name,
        action_type,
        executed_by,
        old_data,
        new_data,
        executed_at
      FROM AuditLog
      WHERE 1=1
    `;
    const params: any[] = [];

    if (start_date) {
      query += ` AND DATE(executed_at) >= ?`;
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND DATE(executed_at) <= ?`;
      params.push(end_date);
    }

    if (table_name) {
      query += ` AND table_name = ?`;
      params.push(table_name);
    }

    if (action_type) {
      query += ` AND action_type = ?`;
      params.push(action_type);
    }

    if (executed_by) {
      query += ` AND executed_by LIKE ?`;
      params.push(`%${executed_by}%`);
    }

    query += ` ORDER BY executed_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit as string), parseInt(offset as string));

    const [rows] = await pool.execute(query, params) as [RowDataPacket[], any];
    
    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM AuditLog WHERE 1=1`;
    const countParams: any[] = [];

    if (start_date) {
      countQuery += ` AND DATE(executed_at) >= ?`;
      countParams.push(start_date);
    }

    if (end_date) {
      countQuery += ` AND DATE(executed_at) <= ?`;
      countParams.push(end_date);
    }

    if (table_name) {
      countQuery += ` AND table_name = ?`;
      countParams.push(table_name);
    }

    if (action_type) {
      countQuery += ` AND action_type = ?`;
      countParams.push(action_type);
    }

    if (executed_by) {
      countQuery += ` AND executed_by LIKE ?`;
      countParams.push(`%${executed_by}%`);
    }

    const [countResult] = await pool.execute(countQuery, countParams) as [RowDataPacket[], any];
    
    res.json({
      data: rows,
      total: countResult[0].total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Get audit log statistics
router.get('/stats', authenticate, async (req, res) => {
  try {
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_logs,
        SUM(CASE WHEN action_type = 'INSERT' THEN 1 ELSE 0 END) as total_inserts,
        SUM(CASE WHEN action_type = 'UPDATE' THEN 1 ELSE 0 END) as total_updates,
        SUM(CASE WHEN action_type = 'DELETE' THEN 1 ELSE 0 END) as total_deletes,
        COUNT(DISTINCT table_name) as total_tables,
        COUNT(DISTINCT executed_by) as total_users,
        COUNT(CASE WHEN DATE(executed_at) = CURDATE() THEN 1 END) as today_logs,
        COUNT(CASE WHEN DATE(executed_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as week_logs
      FROM AuditLog
    `) as [RowDataPacket[], any];

    res.json(stats[0]);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Get logs by table
router.get('/by-table', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        table_name,
        COUNT(*) as count,
        SUM(CASE WHEN action_type = 'INSERT' THEN 1 ELSE 0 END) as inserts,
        SUM(CASE WHEN action_type = 'UPDATE' THEN 1 ELSE 0 END) as updates,
        SUM(CASE WHEN action_type = 'DELETE' THEN 1 ELSE 0 END) as deletes
      FROM AuditLog
      GROUP BY table_name
      ORDER BY count DESC
    `) as [RowDataPacket[], any];

    res.json(rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Get logs by user
router.get('/by-user', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        executed_by,
        COUNT(*) as count,
        MAX(executed_at) as last_activity
      FROM AuditLog
      GROUP BY executed_by
      ORDER BY count DESC
    `) as [RowDataPacket[], any];

    res.json(rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Get log detail by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        log_id,
        table_name,
        action_type,
        executed_by,
        old_data,
        new_data,
        executed_at
      FROM AuditLog
      WHERE log_id = ?
    `, [req.params.id]) as [RowDataPacket[], any];

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Log tidak ditemukan' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

export default router;