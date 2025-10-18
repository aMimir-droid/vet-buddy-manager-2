import express from 'express';
import pool from '../config/database';
import { authenticate } from '../middleware/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = express.Router();

// Get all obat
router.get('/', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        obat_id,
        nama_obat,
        kegunaan,
        harga_obat
      FROM Obat
      ORDER BY nama_obat
    `) as [RowDataPacket[], any];
    res.json(rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Get obat by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        obat_id,
        nama_obat,
        kegunaan,
        harga_obat
      FROM Obat
      WHERE obat_id = ?
    `, [req.params.id]) as [RowDataPacket[], any];
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Obat tidak ditemukan' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Create obat
router.post('/', authenticate, async (req, res) => {
  try {
    const { nama_obat, kegunaan, harga_obat } = req.body;
    
    const [result] = await pool.execute(
      `INSERT INTO Obat (nama_obat, kegunaan, harga_obat) 
       VALUES (?, ?, ?)`,
      [nama_obat, kegunaan || null, harga_obat]
    ) as [ResultSetHeader, any];
    
    const [newObat] = await pool.execute(
      `SELECT obat_id, nama_obat, kegunaan, harga_obat 
       FROM Obat WHERE obat_id = ?`,
      [result.insertId]
    ) as [RowDataPacket[], any];
    
    res.status(201).json(newObat[0]);
  } catch (error: any) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Update obat
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { nama_obat, kegunaan, harga_obat } = req.body;
    
    await pool.execute(
      `UPDATE Obat 
       SET nama_obat = ?, kegunaan = ?, harga_obat = ?
       WHERE obat_id = ?`,
      [nama_obat, kegunaan, harga_obat, req.params.id]
    );
    
    const [updated] = await pool.execute(
      `SELECT obat_id, nama_obat, kegunaan, harga_obat 
       FROM Obat WHERE obat_id = ?`,
      [req.params.id]
    ) as [RowDataPacket[], any];
    
    res.json(updated[0]);
  } catch (error: any) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Delete obat
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await pool.execute('DELETE FROM Obat WHERE obat_id = ?', [req.params.id]);
    res.json({ message: 'Obat berhasil dihapus' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

export default router;