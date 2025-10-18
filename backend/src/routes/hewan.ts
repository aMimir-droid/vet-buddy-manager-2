import express from 'express';
import pool from '../config/database';
import { authenticate } from '../middleware/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = express.Router();

// Get all hewan
router.get('/', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        h.hewan_id,
        h.nama_hewan,
        h.tanggal_lahir,
        h.jenis_kelamin,
        h.status_hidup,
        h.jenis_hewan_id,
        h.pawrent_id,
        jh.nama_jenis_hewan,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) as nama_pawrent,
        TIMESTAMPDIFF(YEAR, h.tanggal_lahir, CURDATE()) as umur_tahun,
        TIMESTAMPDIFF(MONTH, h.tanggal_lahir, CURDATE()) % 12 as umur_bulan
      FROM Hewan h
      LEFT JOIN Jenis_Hewan jh ON h.jenis_hewan_id = jh.jenis_hewan_id
      LEFT JOIN Pawrent p ON h.pawrent_id = p.pawrent_id
      ORDER BY h.nama_hewan
    `) as [RowDataPacket[], any];
    res.json(rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Get hewan by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        h.hewan_id,
        h.nama_hewan,
        h.tanggal_lahir,
        h.jenis_kelamin,
        h.status_hidup,
        h.jenis_hewan_id,
        h.pawrent_id,
        jh.nama_jenis_hewan,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) as nama_pawrent
      FROM Hewan h
      LEFT JOIN Jenis_Hewan jh ON h.jenis_hewan_id = jh.jenis_hewan_id
      LEFT JOIN Pawrent p ON h.pawrent_id = p.pawrent_id
      WHERE h.hewan_id = ?
    `, [req.params.id]) as [RowDataPacket[], any];
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Hewan tidak ditemukan' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Create hewan
router.post('/', authenticate, async (req, res) => {
  try {
    const { 
      nama_hewan, 
      tanggal_lahir, 
      jenis_kelamin, 
      status_hidup,
      jenis_hewan_id,
      pawrent_id 
    } = req.body;
    
    const [result] = await pool.execute(
      `INSERT INTO Hewan 
      (nama_hewan, tanggal_lahir, jenis_kelamin, status_hidup, jenis_hewan_id, pawrent_id) 
      VALUES (?, ?, ?, ?, ?, ?)`,
      [nama_hewan, tanggal_lahir || null, jenis_kelamin, status_hidup || 'Hidup', jenis_hewan_id, pawrent_id]
    ) as [ResultSetHeader, any];
    
    const [newHewan] = await pool.execute(
      `SELECT 
        h.hewan_id,
        h.nama_hewan,
        h.tanggal_lahir,
        h.jenis_kelamin,
        h.status_hidup,
        h.jenis_hewan_id,
        h.pawrent_id,
        jh.nama_jenis_hewan,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) as nama_pawrent
      FROM Hewan h
      LEFT JOIN Jenis_Hewan jh ON h.jenis_hewan_id = jh.jenis_hewan_id
      LEFT JOIN Pawrent p ON h.pawrent_id = p.pawrent_id
      WHERE h.hewan_id = ?`,
      [result.insertId]
    ) as [RowDataPacket[], any];
    
    res.status(201).json(newHewan[0]);
  } catch (error: any) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Update hewan
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { 
      nama_hewan, 
      tanggal_lahir, 
      jenis_kelamin, 
      status_hidup,
      jenis_hewan_id,
      pawrent_id 
    } = req.body;
    
    await pool.execute(
      `UPDATE Hewan 
      SET nama_hewan = ?, 
          tanggal_lahir = ?, 
          jenis_kelamin = ?, 
          status_hidup = ?,
          jenis_hewan_id = ?,
          pawrent_id = ?
      WHERE hewan_id = ?`,
      [nama_hewan, tanggal_lahir, jenis_kelamin, status_hidup, jenis_hewan_id, pawrent_id, req.params.id]
    );
    
    const [updated] = await pool.execute(
      `SELECT 
        h.hewan_id,
        h.nama_hewan,
        h.tanggal_lahir,
        h.jenis_kelamin,
        h.status_hidup,
        h.jenis_hewan_id,
        h.pawrent_id,
        jh.nama_jenis_hewan,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) as nama_pawrent
      FROM Hewan h
      LEFT JOIN Jenis_Hewan jh ON h.jenis_hewan_id = jh.jenis_hewan_id
      LEFT JOIN Pawrent p ON h.pawrent_id = p.pawrent_id
      WHERE h.hewan_id = ?`,
      [req.params.id]
    ) as [RowDataPacket[], any];
    
    res.json(updated[0]);
  } catch (error: any) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Delete hewan
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await pool.execute('DELETE FROM Hewan WHERE hewan_id = ?', [req.params.id]);
    res.json({ message: 'Hewan berhasil dihapus' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

export default router;