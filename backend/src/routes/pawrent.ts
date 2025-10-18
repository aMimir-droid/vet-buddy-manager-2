import express from 'express';
import pool from '../config/database';
import { authenticate } from '../middleware/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = express.Router();

// Get all pawrents
router.get('/', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        p.pawrent_id,
        p.nama_depan_pawrent,
        p.nama_belakang_pawrent,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) as nama_lengkap,
        p.alamat_pawrent,
        p.kota_pawrent,
        p.kode_pos_pawrent,
        p.nomor_hp,
        p.dokter_id,
        d.nama_dokter,
        COUNT(h.hewan_id) as jumlah_hewan
      FROM Pawrent p
      LEFT JOIN Dokter d ON p.dokter_id = d.dokter_id
      LEFT JOIN Hewan h ON p.pawrent_id = h.pawrent_id
      GROUP BY p.pawrent_id
      ORDER BY p.nama_depan_pawrent
    `) as [RowDataPacket[], any];
    res.json(rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Get pawrent by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        p.pawrent_id,
        p.nama_depan_pawrent,
        p.nama_belakang_pawrent,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) as nama_lengkap,
        p.alamat_pawrent,
        p.kota_pawrent,
        p.kode_pos_pawrent,
        p.nomor_hp,
        p.dokter_id,
        d.nama_dokter
      FROM Pawrent p
      LEFT JOIN Dokter d ON p.dokter_id = d.dokter_id
      WHERE p.pawrent_id = ?
    `, [req.params.id]) as [RowDataPacket[], any];
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Pawrent tidak ditemukan' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Create pawrent
router.post('/', authenticate, async (req, res) => {
  try {
    const { 
      nama_depan_pawrent, 
      nama_belakang_pawrent, 
      alamat_pawrent, 
      kota_pawrent,
      kode_pos_pawrent,
      nomor_hp,
      dokter_id 
    } = req.body;
    
    const [result] = await pool.execute(
      `INSERT INTO Pawrent 
      (nama_depan_pawrent, nama_belakang_pawrent, alamat_pawrent, kota_pawrent, kode_pos_pawrent, nomor_hp, dokter_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nama_depan_pawrent, nama_belakang_pawrent, alamat_pawrent || null, kota_pawrent || null, kode_pos_pawrent || null, nomor_hp, dokter_id]
    ) as [ResultSetHeader, any];
    
    const [newPawrent] = await pool.execute(
      `SELECT 
        pawrent_id,
        nama_depan_pawrent,
        nama_belakang_pawrent,
        CONCAT(nama_depan_pawrent, ' ', nama_belakang_pawrent) as nama_lengkap,
        alamat_pawrent,
        kota_pawrent,
        kode_pos_pawrent,
        nomor_hp,
        dokter_id
      FROM Pawrent WHERE pawrent_id = ?`,
      [result.insertId]
    ) as [RowDataPacket[], any];
    
    res.status(201).json(newPawrent[0]);
  } catch (error: any) {
    console.error('Error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Nomor HP sudah terdaftar' });
    }
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Update pawrent
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { 
      nama_depan_pawrent, 
      nama_belakang_pawrent, 
      alamat_pawrent, 
      kota_pawrent,
      kode_pos_pawrent,
      nomor_hp,
      dokter_id 
    } = req.body;
    
    await pool.execute(
      `UPDATE Pawrent 
      SET nama_depan_pawrent = ?, 
          nama_belakang_pawrent = ?, 
          alamat_pawrent = ?, 
          kota_pawrent = ?,
          kode_pos_pawrent = ?,
          nomor_hp = ?,
          dokter_id = ?
      WHERE pawrent_id = ?`,
      [nama_depan_pawrent, nama_belakang_pawrent, alamat_pawrent, kota_pawrent, kode_pos_pawrent, nomor_hp, dokter_id, req.params.id]
    );
    
    const [updated] = await pool.execute(
      `SELECT 
        pawrent_id,
        nama_depan_pawrent,
        nama_belakang_pawrent,
        CONCAT(nama_depan_pawrent, ' ', nama_belakang_pawrent) as nama_lengkap,
        alamat_pawrent,
        kota_pawrent,
        kode_pos_pawrent,
        nomor_hp,
        dokter_id
      FROM Pawrent WHERE pawrent_id = ?`,
      [req.params.id]
    ) as [RowDataPacket[], any];
    
    res.json(updated[0]);
  } catch (error: any) {
    console.error('Error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Nomor HP sudah terdaftar' });
    }
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Delete pawrent
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await pool.execute('DELETE FROM Pawrent WHERE pawrent_id = ?', [req.params.id]);
    res.json({ message: 'Pawrent berhasil dihapus' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

export default router;