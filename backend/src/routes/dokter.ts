import express from 'express';
import pool from '../config/database';
import { authenticate, authorize } from '../middleware/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = express.Router();

// Get all dokter
router.get('/', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        d.*,
        s.nama_spesialisasi,
        kl.nama_klinik
      FROM Dokter d
      LEFT JOIN Spesialisasi s ON d.spesialisasi_id = s.spesialisasi_id
      LEFT JOIN Klinik kl ON d.klinik_id = kl.klinik_id
      ORDER BY d.nama_dokter
    `) as [RowDataPacket[], any];
    res.json(rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Get dokter by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        d.*,
        s.nama_spesialisasi,
        kl.nama_klinik
      FROM Dokter d
      LEFT JOIN Spesialisasi s ON d.spesialisasi_id = s.spesialisasi_id
      LEFT JOIN Klinik kl ON d.klinik_id = kl.klinik_id
      WHERE d.dokter_id = ?
    `, [req.params.id]) as [RowDataPacket[], any];
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Dokter tidak ditemukan' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Get dokter profile using stored procedure
router.get('/profile/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'CALL GetDokterProfile(?)',
      [req.params.id]
    ) as [RowDataPacket[][], any];
    res.json(rows[0][0]);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Create dokter (admin only)
router.post('/', authenticate, authorize(1), async (req, res) => {
  try {
    const { 
      title_dokter, 
      nama_dokter, 
      telepon_dokter, 
      tanggal_mulai_kerja, 
      spesialisasi_id, 
      klinik_id 
    } = req.body;
    
    const [result] = await pool.execute(
      'INSERT INTO Dokter (title_dokter, nama_dokter, telepon_dokter, tanggal_mulai_kerja, spesialisasi_id, klinik_id) VALUES (?, ?, ?, ?, ?, ?)',
      [title_dokter, nama_dokter, telepon_dokter, tanggal_mulai_kerja, spesialisasi_id, klinik_id]
    ) as [ResultSetHeader, any];
    
    const [newDokter] = await pool.execute(
      'SELECT * FROM Dokter WHERE dokter_id = ?',
      [result.insertId]
    ) as [RowDataPacket[], any];
    
    res.status(201).json(newDokter[0]);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Update dokter (admin only)
router.put('/:id', authenticate, authorize(1), async (req, res) => {
  try {
    const { title_dokter, nama_dokter, telepon_dokter, spesialisasi_id, klinik_id } = req.body;
    
    await pool.execute(
      'UPDATE Dokter SET title_dokter = ?, nama_dokter = ?, telepon_dokter = ?, spesialisasi_id = ?, klinik_id = ? WHERE dokter_id = ?',
      [title_dokter, nama_dokter, telepon_dokter, spesialisasi_id, klinik_id, req.params.id]
    );
    
    const [updated] = await pool.execute(
      'SELECT * FROM Dokter WHERE dokter_id = ?',
      [req.params.id]
    ) as [RowDataPacket[], any];
    
    res.json(updated[0]);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Delete dokter (admin only)
router.delete('/:id', authenticate, authorize(1), async (req, res) => {
  try {
    await pool.execute('DELETE FROM Dokter WHERE dokter_id = ?', [req.params.id]);
    res.json({ message: 'Dokter berhasil dihapus' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

export default router;