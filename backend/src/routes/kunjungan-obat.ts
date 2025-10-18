import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { RowDataPacket } from 'mysql2';

const router = express.Router();

// ========================================================
// GET OBAT BY KUNJUNGAN
// ========================================================
router.get('/kunjungan/:kunjunganId', authenticate, async (req: AuthRequest, res) => {
  const pool = req.dbPool; // ✅ Gunakan pool dari request
  
  try {
    const { kunjunganId } = req.params;
    
    console.log(`🔄 [GET OBAT BY KUNJUNGAN] Using DB pool for role_id: ${req.user.role_id}`);
    const [rows] = await pool.execute(
      'CALL GetObatByKunjungan(?)',
      [kunjunganId]
    ) as [RowDataPacket[][], any];
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error getting obat by kunjungan:', error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========================================================
// CREATE KUNJUNGAN OBAT
// ========================================================
router.post('/', authenticate, async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  
  try {
    const { kunjungan_id, obat_id, dosis, frekuensi } = req.body;

    if (!kunjungan_id || !obat_id || !dosis || !frekuensi) {
      return res.status(400).json({ 
        message: 'Semua field harus diisi (kunjungan_id, obat_id, dosis, frekuensi)' 
      });
    }

    console.log('Creating kunjungan obat:', { kunjungan_id, obat_id, dosis, frekuensi });

    const [result] = await pool.execute(
      'CALL CreateKunjunganObat(?, ?, ?, ?)',
      [kunjungan_id, obat_id, dosis, frekuensi]
    ) as [RowDataPacket[][], any];

    res.status(201).json({ 
      message: 'Obat berhasil ditambahkan ke kunjungan',
      data: result[0]
    });
  } catch (error: any) {
    console.error('Error creating kunjungan obat:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        message: 'Obat ini sudah ditambahkan ke kunjungan' 
      });
    }
    
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: error.message || 'Unknown error'
    });
  }
});

// ========================================================
// UPDATE KUNJUNGAN OBAT
// ========================================================
router.put('/:kunjunganId/:obatId', authenticate, async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  
  try {
    const { kunjunganId, obatId } = req.params;
    const { dosis, frekuensi } = req.body;

    if (!dosis || !frekuensi) {
      return res.status(400).json({ 
        message: 'Dosis dan frekuensi harus diisi' 
      });
    }

    console.log('Updating kunjungan obat:', { kunjunganId, obatId, dosis, frekuensi });

    await pool.execute(
      'CALL UpdateKunjunganObat(?, ?, ?, ?)',
      [kunjunganId, obatId, dosis, frekuensi]
    );

    res.json({ message: 'Obat kunjungan berhasil diupdate' });
  } catch (error: any) {
    console.error('Error updating kunjungan obat:', error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: error.message || 'Unknown error'
    });
  }
});

// ========================================================
// DELETE KUNJUNGAN OBAT
// ========================================================
router.delete('/:kunjunganId/:obatId', authenticate, async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  
  try {
    const { kunjunganId, obatId } = req.params;

    console.log('Deleting kunjungan obat:', { kunjunganId, obatId });

    await pool.execute(
      'CALL DeleteKunjunganObat(?, ?)',
      [kunjunganId, obatId]
    );

    res.json({ message: 'Obat berhasil dihapus dari kunjungan' });
  } catch (error: any) {
    console.error('Error deleting kunjungan obat:', error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: error.message || 'Unknown error'
    });
  }
});

export default router;