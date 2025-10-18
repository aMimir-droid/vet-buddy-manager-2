import express from 'express';
import pool from '../config/database';
import { authenticate, authorize } from '../middleware/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = express.Router();

// Get all layanan
router.get('/', authenticate, async (req, res) => {
  try {
    console.log('Fetching all layanan...');
    
    const [rows] = await pool.execute(`
      SELECT 
        kode_layanan,
        nama_layanan,
        deskripsi_layanan,
        biaya_layanan
      FROM Detail_Layanan
      ORDER BY nama_layanan
    `) as [RowDataPacket[], any];
    
    console.log('Layanan fetched successfully:', rows.length);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching layanan:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Get layanan by kode
router.get('/:kode', authenticate, async (req, res) => {
  try {
    console.log('Fetching layanan by kode:', req.params.kode);
    
    const [rows] = await pool.execute(`
      SELECT 
        kode_layanan,
        nama_layanan,
        deskripsi_layanan,
        biaya_layanan
      FROM Detail_Layanan
      WHERE kode_layanan = ?
    `, [req.params.kode]) as [RowDataPacket[], any];
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Layanan tidak ditemukan' });
    }
    
    console.log('Layanan fetched successfully');
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching layanan by kode:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Create layanan (admin only)
router.post('/', authenticate, authorize(1), async (req, res) => {
  try {
    const { kode_layanan, nama_layanan, deskripsi_layanan, biaya_layanan } = req.body;
    
    console.log('Creating layanan:', { kode_layanan, nama_layanan, biaya_layanan });
    
    // Validate required fields
    if (!kode_layanan || !nama_layanan || !biaya_layanan) {
      return res.status(400).json({ message: 'Kode layanan, nama layanan, dan biaya wajib diisi' });
    }

    // Validate biaya_layanan is not negative
    if (parseFloat(biaya_layanan) < 0) {
      return res.status(400).json({ message: 'Biaya layanan tidak boleh negatif' });
    }

    const [result] = await pool.execute(
      `INSERT INTO Detail_Layanan (kode_layanan, nama_layanan, deskripsi_layanan, biaya_layanan) 
       VALUES (?, ?, ?, ?)`,
      [kode_layanan, nama_layanan, deskripsi_layanan || null, biaya_layanan]
    ) as [ResultSetHeader, any];
    
    const [newLayanan] = await pool.execute(
      `SELECT kode_layanan, nama_layanan, deskripsi_layanan, biaya_layanan 
       FROM Detail_Layanan WHERE kode_layanan = ?`,
      [kode_layanan]
    ) as [RowDataPacket[], any];
    
    console.log('Layanan created successfully:', newLayanan[0]);
    res.status(201).json(newLayanan[0]);
  } catch (error: any) {
    console.error('Error creating layanan:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Kode layanan sudah terdaftar' });
    }
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Update layanan (admin only)
router.put('/:kode', authenticate, authorize(1), async (req, res) => {
  try {
    const { nama_layanan, deskripsi_layanan, biaya_layanan } = req.body;
    
    console.log('Updating layanan:', req.params.kode, { nama_layanan, biaya_layanan });
    
    // Validate required fields
    if (!nama_layanan || !biaya_layanan) {
      return res.status(400).json({ message: 'Nama layanan dan biaya wajib diisi' });
    }

    // Validate biaya_layanan is not negative
    if (parseFloat(biaya_layanan) < 0) {
      return res.status(400).json({ message: 'Biaya layanan tidak boleh negatif' });
    }

    await pool.execute(
      `UPDATE Detail_Layanan 
       SET nama_layanan = ?, deskripsi_layanan = ?, biaya_layanan = ?
       WHERE kode_layanan = ?`,
      [nama_layanan, deskripsi_layanan || null, biaya_layanan, req.params.kode]
    );
    
    const [updated] = await pool.execute(
      `SELECT kode_layanan, nama_layanan, deskripsi_layanan, biaya_layanan 
       FROM Detail_Layanan WHERE kode_layanan = ?`,
      [req.params.kode]
    ) as [RowDataPacket[], any];
    
    console.log('Layanan updated successfully:', updated[0]);
    res.json(updated[0]);
  } catch (error: any) {
    console.error('Error updating layanan:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Delete layanan (admin only)
router.delete('/:kode', authenticate, authorize(1), async (req, res) => {
  try {
    console.log('Deleting layanan:', req.params.kode);
    
    // Check if layanan is used in any kunjungan
    const [usage] = await pool.execute(
      'SELECT COUNT(*) as count FROM Layanan WHERE kode_layanan = ?',
      [req.params.kode]
    ) as [RowDataPacket[], any];

    if (usage[0].count > 0) {
      return res.status(400).json({ 
        message: `Tidak dapat menghapus layanan. Masih ada ${usage[0].count} kunjungan yang menggunakan layanan ini.` 
      });
    }

    await pool.execute('DELETE FROM Detail_Layanan WHERE kode_layanan = ?', [req.params.kode]);
    console.log('Layanan deleted successfully');
    res.json({ message: 'Layanan berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting layanan:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Get usage statistics for a layanan
router.get('/:kode/stats', authenticate, async (req, res) => {
  try {
    console.log('Fetching layanan statistics:', req.params.kode);
    
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_usage,
        COUNT(DISTINCT k.kunjungan_id) as total_kunjungan,
        SUM(dl.biaya_layanan) as total_revenue
      FROM Layanan l
      JOIN Detail_Layanan dl ON l.kode_layanan = dl.kode_layanan
      JOIN Kunjungan k ON l.kunjungan_id = k.kunjungan_id
      WHERE l.kode_layanan = ?
    `, [req.params.kode]) as [RowDataPacket[], any];
    
    console.log('Layanan statistics fetched successfully');
    res.json(stats[0]);
  } catch (error) {
    console.error('Error fetching layanan statistics:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

export default router;