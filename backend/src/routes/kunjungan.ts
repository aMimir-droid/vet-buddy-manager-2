import express from 'express';
import pool from '../config/database';
import { authenticate } from '../middleware/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = express.Router();

// Get all kunjungan
router.get('/', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        k.kunjungan_id,
        k.hewan_id,
        k.dokter_id,
        k.tanggal_kunjungan,
        k.waktu_kunjungan,
        k.catatan,
        k.total_biaya,
        k.metode_pembayaran,
        k.kunjungan_sebelumnya,
        h.nama_hewan,
        jh.nama_jenis_hewan,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) as nama_pawrent,
        p.nomor_hp as telepon_pawrent,
        CONCAT(d.title_dokter, ' ', d.nama_dokter) as nama_dokter,
        ks.tanggal_kunjungan as tanggal_kunjungan_sebelumnya
      FROM Kunjungan k
      INNER JOIN Hewan h ON k.hewan_id = h.hewan_id
      LEFT JOIN Jenis_Hewan jh ON h.jenis_hewan_id = jh.jenis_hewan_id
      LEFT JOIN Pawrent p ON h.pawrent_id = p.pawrent_id
      LEFT JOIN Dokter d ON k.dokter_id = d.dokter_id
      LEFT JOIN Kunjungan ks ON k.kunjungan_sebelumnya = ks.kunjungan_id
      ORDER BY k.tanggal_kunjungan DESC, k.waktu_kunjungan DESC
    `) as [RowDataPacket[], any];
    res.json(rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Get kunjungan by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        k.kunjungan_id,
        k.hewan_id,
        k.dokter_id,
        k.tanggal_kunjungan,
        k.waktu_kunjungan,
        k.catatan,
        k.total_biaya,
        k.metode_pembayaran,
        k.kunjungan_sebelumnya,
        h.nama_hewan,
        jh.nama_jenis_hewan,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) as nama_pawrent,
        CONCAT(d.title_dokter, ' ', d.nama_dokter) as nama_dokter
      FROM Kunjungan k
      INNER JOIN Hewan h ON k.hewan_id = h.hewan_id
      LEFT JOIN Jenis_Hewan jh ON h.jenis_hewan_id = jh.jenis_hewan_id
      LEFT JOIN Pawrent p ON h.pawrent_id = p.pawrent_id
      LEFT JOIN Dokter d ON k.dokter_id = d.dokter_id
      WHERE k.kunjungan_id = ?
    `, [req.params.id]) as [RowDataPacket[], any];
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Kunjungan tidak ditemukan' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Get kunjungan by date range
router.get('/range/:start/:end', authenticate, async (req, res) => {
  try {
    const { start, end } = req.params;
    const [rows] = await pool.execute(`
      SELECT 
        k.kunjungan_id,
        k.hewan_id,
        k.dokter_id,
        k.tanggal_kunjungan,
        k.waktu_kunjungan,
        k.catatan,
        k.total_biaya,
        k.metode_pembayaran,
        h.nama_hewan,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) as nama_pawrent,
        CONCAT(d.title_dokter, ' ', d.nama_dokter) as nama_dokter
      FROM Kunjungan k
      INNER JOIN Hewan h ON k.hewan_id = h.hewan_id
      LEFT JOIN Pawrent p ON h.pawrent_id = p.pawrent_id
      LEFT JOIN Dokter d ON k.dokter_id = d.dokter_id
      WHERE k.tanggal_kunjungan BETWEEN ? AND ?
      ORDER BY k.tanggal_kunjungan DESC, k.waktu_kunjungan DESC
    `, [start, end]) as [RowDataPacket[], any];
    
    res.json(rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Create kunjungan
router.post('/', authenticate, async (req, res) => {
  try {
    const { 
      hewan_id,
      dokter_id,
      tanggal_kunjungan,
      waktu_kunjungan,
      catatan,
      total_biaya,
      metode_pembayaran,
      kunjungan_sebelumnya
    } = req.body;
    
    const [result] = await pool.execute(
      `INSERT INTO Kunjungan 
      (hewan_id, dokter_id, tanggal_kunjungan, waktu_kunjungan, catatan, total_biaya, metode_pembayaran, kunjungan_sebelumnya) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        hewan_id, 
        dokter_id, 
        tanggal_kunjungan, 
        waktu_kunjungan, 
        catatan || null, 
        total_biaya, 
        metode_pembayaran,
        kunjungan_sebelumnya || null
      ]
    ) as [ResultSetHeader, any];
    
    const [newKunjungan] = await pool.execute(
      `SELECT 
        k.kunjungan_id,
        k.hewan_id,
        k.dokter_id,
        k.tanggal_kunjungan,
        k.waktu_kunjungan,
        k.catatan,
        k.total_biaya,
        k.metode_pembayaran,
        k.kunjungan_sebelumnya,
        h.nama_hewan,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) as nama_pawrent,
        CONCAT(d.title_dokter, ' ', d.nama_dokter) as nama_dokter
      FROM Kunjungan k
      INNER JOIN Hewan h ON k.hewan_id = h.hewan_id
      LEFT JOIN Pawrent p ON h.pawrent_id = p.pawrent_id
      LEFT JOIN Dokter d ON k.dokter_id = d.dokter_id
      WHERE k.kunjungan_id = ?`,
      [result.insertId]
    ) as [RowDataPacket[], any];
    
    res.status(201).json(newKunjungan[0]);
  } catch (error: any) {
    console.error('Error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Kunjungan dengan waktu yang sama sudah ada' });
    }
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Update kunjungan
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { 
      hewan_id,
      dokter_id,
      tanggal_kunjungan,
      waktu_kunjungan,
      catatan,
      total_biaya,
      metode_pembayaran,
      kunjungan_sebelumnya
    } = req.body;
    
    await pool.execute(
      `UPDATE Kunjungan 
      SET hewan_id = ?,
          dokter_id = ?,
          tanggal_kunjungan = ?,
          waktu_kunjungan = ?,
          catatan = ?,
          total_biaya = ?,
          metode_pembayaran = ?,
          kunjungan_sebelumnya = ?
      WHERE kunjungan_id = ?`,
      [
        hewan_id,
        dokter_id,
        tanggal_kunjungan,
        waktu_kunjungan,
        catatan,
        total_biaya,
        metode_pembayaran,
        kunjungan_sebelumnya || null,
        req.params.id
      ]
    );
    
    const [updated] = await pool.execute(
      `SELECT 
        k.kunjungan_id,
        k.hewan_id,
        k.dokter_id,
        k.tanggal_kunjungan,
        k.waktu_kunjungan,
        k.catatan,
        k.total_biaya,
        k.metode_pembayaran,
        k.kunjungan_sebelumnya,
        h.nama_hewan,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) as nama_pawrent,
        CONCAT(d.title_dokter, ' ', d.nama_dokter) as nama_dokter
      FROM Kunjungan k
      INNER JOIN Hewan h ON k.hewan_id = h.hewan_id
      LEFT JOIN Pawrent p ON h.pawrent_id = p.pawrent_id
      LEFT JOIN Dokter d ON k.dokter_id = d.dokter_id
      WHERE k.kunjungan_id = ?`,
      [req.params.id]
    ) as [RowDataPacket[], any];
    
    res.json(updated[0]);
  } catch (error: any) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Delete kunjungan
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await pool.execute('DELETE FROM Kunjungan WHERE kunjungan_id = ?', [req.params.id]);
    res.json({ message: 'Kunjungan berhasil dihapus' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Get previous visits for a hewan
router.get('/hewan/:hewanId/history', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        k.kunjungan_id,
        k.tanggal_kunjungan,
        k.waktu_kunjungan,
        k.catatan,
        k.total_biaya,
        CONCAT(d.title_dokter, ' ', d.nama_dokter) as nama_dokter
      FROM Kunjungan k
      LEFT JOIN Dokter d ON k.dokter_id = d.dokter_id
      WHERE k.hewan_id = ?
      ORDER BY k.tanggal_kunjungan DESC, k.waktu_kunjungan DESC
      LIMIT 10
    `, [req.params.hewanId]) as [RowDataPacket[], any];
    
    res.json(rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

export default router;