import express from 'express';
import pool from '../config/database';
import { authenticate } from '../middleware/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = express.Router();

// Get all klinik with doctor count
router.get('/', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        k.klinik_id,
        k.nama_klinik,
        k.alamat_klinik,
        k.telepon_klinik,
        COUNT(d.dokter_id) as jumlah_dokter
      FROM Klinik k
      LEFT JOIN Dokter d ON k.klinik_id = d.klinik_id
      GROUP BY k.klinik_id, k.nama_klinik, k.alamat_klinik, k.telepon_klinik
      ORDER BY k.nama_klinik
    `) as [RowDataPacket[], any];
    
    console.log('Klinik data fetched:', rows.length);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching kliniks:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Get klinik by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        k.klinik_id,
        k.nama_klinik,
        k.alamat_klinik,
        k.telepon_klinik,
        COUNT(d.dokter_id) as jumlah_dokter
      FROM Klinik k
      LEFT JOIN Dokter d ON k.klinik_id = d.klinik_id
      WHERE k.klinik_id = ?
      GROUP BY k.klinik_id, k.nama_klinik, k.alamat_klinik, k.telepon_klinik
    `, [req.params.id]) as [RowDataPacket[], any];
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Klinik tidak ditemukan' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching klinik by id:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Create klinik
router.post('/', authenticate, async (req, res) => {
  try {
    const { nama_klinik, alamat_klinik, telepon_klinik } = req.body;
    
    console.log('Creating klinik:', { nama_klinik, alamat_klinik, telepon_klinik });
    
    // Validate required fields
    if (!nama_klinik || !alamat_klinik) {
      return res.status(400).json({ message: 'Nama klinik dan alamat wajib diisi' });
    }

    const [result] = await pool.execute(
      `INSERT INTO Klinik (nama_klinik, alamat_klinik, telepon_klinik) 
       VALUES (?, ?, ?)`,
      [nama_klinik, alamat_klinik, telepon_klinik || null]
    ) as [ResultSetHeader, any];
    
    const [newKlinik] = await pool.execute(
      `SELECT 
        klinik_id,
        nama_klinik,
        alamat_klinik,
        telepon_klinik,
        0 as jumlah_dokter
       FROM Klinik 
       WHERE klinik_id = ?`,
      [result.insertId]
    ) as [RowDataPacket[], any];
    
    console.log('Klinik created successfully:', newKlinik[0]);
    res.status(201).json(newKlinik[0]);
  } catch (error: any) {
    console.error('Error creating klinik:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Nomor telepon sudah terdaftar' });
    }
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Update klinik
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { nama_klinik, alamat_klinik, telepon_klinik } = req.body;
    
    console.log('Updating klinik:', req.params.id, { nama_klinik, alamat_klinik, telepon_klinik });
    
    // Validate required fields
    if (!nama_klinik || !alamat_klinik) {
      return res.status(400).json({ message: 'Nama klinik dan alamat wajib diisi' });
    }

    await pool.execute(
      `UPDATE Klinik 
       SET nama_klinik = ?, alamat_klinik = ?, telepon_klinik = ?
       WHERE klinik_id = ?`,
      [nama_klinik, alamat_klinik, telepon_klinik || null, req.params.id]
    );
    
    const [updated] = await pool.execute(
      `SELECT 
        k.klinik_id,
        k.nama_klinik,
        k.alamat_klinik,
        k.telepon_klinik,
        COUNT(d.dokter_id) as jumlah_dokter
       FROM Klinik k
       LEFT JOIN Dokter d ON k.klinik_id = d.klinik_id
       WHERE k.klinik_id = ?
       GROUP BY k.klinik_id, k.nama_klinik, k.alamat_klinik, k.telepon_klinik`,
      [req.params.id]
    ) as [RowDataPacket[], any];
    
    console.log('Klinik updated successfully:', updated[0]);
    res.json(updated[0]);
  } catch (error: any) {
    console.error('Error updating klinik:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Nomor telepon sudah terdaftar' });
    }
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Delete klinik
router.delete('/:id', authenticate, async (req, res) => {
  try {
    console.log('Deleting klinik:', req.params.id);
    
    // Check if there are doctors associated with this clinic
    const [doctors] = await pool.execute(
      'SELECT COUNT(*) as count FROM Dokter WHERE klinik_id = ?',
      [req.params.id]
    ) as [RowDataPacket[], any];

    if (doctors[0].count > 0) {
      return res.status(400).json({ 
        message: `Tidak dapat menghapus klinik. Masih ada ${doctors[0].count} dokter yang terdaftar di klinik ini.` 
      });
    }

    await pool.execute('DELETE FROM Klinik WHERE klinik_id = ?', [req.params.id]);
    console.log('Klinik deleted successfully');
    res.json({ message: 'Klinik berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting klinik:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Get doctors by clinic
router.get('/:id/dokters', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        d.dokter_id,
        d.title_dokter,
        d.nama_dokter,
        d.telepon_dokter,
        d.tanggal_mulai_kerja,
        s.nama_spesialisasi
      FROM Dokter d
      LEFT JOIN Spesialisasi s ON d.spesialisasi_id = s.spesialisasi_id
      WHERE d.klinik_id = ?
      ORDER BY d.nama_dokter
    `, [req.params.id]) as [RowDataPacket[], any];
    
    console.log('Doctors fetched for clinic:', req.params.id, rows.length);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching doctors by clinic:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

export default router;