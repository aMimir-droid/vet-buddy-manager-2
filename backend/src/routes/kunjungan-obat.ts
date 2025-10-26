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
// (expects: kunjungan_id, obat_id, qty, [harga_saat_itu], dosis, frekuensi)
// ========================================================
router.post('/', authenticate, async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  
  try {
    const { kunjungan_id, obat_id, qty, harga_saat_itu, dosis, frekuensi } = req.body;

    if (!kunjungan_id || !obat_id || qty == null || !dosis || !frekuensi) {
      return res.status(400).json({ 
        message: 'Field wajib: kunjungan_id, obat_id, qty, dosis, frekuensi (harga_saat_itu optional)' 
      });
    }

    if (typeof qty !== 'number' || qty <= 0) {
      return res.status(400).json({ message: 'qty harus berupa angka > 0' });
    }

    console.log('Creating kunjungan obat:', { kunjungan_id, obat_id, qty, harga_saat_itu, dosis, frekuensi });

    const [result] = await pool.execute(
      'CALL CreateKunjunganObat(?, ?, ?, ?, ?, ?)',
      [kunjungan_id, obat_id, qty, harga_saat_itu ?? null, dosis, frekuensi]
    ) as [RowDataPacket[][], any];

    // stored procedure returns the created row as first resultset
    const created = result?.[0] ?? null;

    res.status(201).json({ 
      message: 'Obat berhasil ditambahkan ke kunjungan',
      data: created
    });
  } catch (error: any) {
    console.error('Error creating kunjungan obat:', error);
    
    if (error?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        message: 'Obat ini sudah ditambahkan ke kunjungan' 
      });
    }
    
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: error?.message || 'Unknown error'
    });
  }
});

// ========================================================
// UPDATE KUNJUNGAN OBAT
// (use kunjungan_obat_id as identifier)
// ========================================================
router.put('/:kunjunganObatId', authenticate, async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  
  try {
    const { kunjunganObatId } = req.params;
    const { qty, harga_saat_itu, dosis, frekuensi } = req.body;

    if (qty != null && (typeof qty !== 'number' || qty <= 0)) {
      return res.status(400).json({ message: 'qty harus berupa angka > 0 jika diberikan' });
    }

    console.log('Updating kunjungan obat:', { kunjunganObatId, qty, harga_saat_itu, dosis, frekuensi });

    const [result] = await pool.execute(
      'CALL UpdateKunjunganObat(?, ?, ?, ?, ?)',
      [
        kunjunganObatId,
        qty ?? null,
        (harga_saat_itu !== undefined) ? harga_saat_itu : null,
        dosis ?? null,
        frekuensi ?? null
      ]
    ) as [RowDataPacket[][], any];

    // stored procedure returns the updated row as first resultset
    const updated = result?.[0] ?? null;

    res.json({
      message: 'Obat kunjungan berhasil diupdate',
      data: updated
    });
  } catch (error: any) {
    console.error('Error updating kunjungan obat:', error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: error?.message || 'Unknown error'
    });
  }
});

// ========================================================
// DELETE KUNJUNGAN OBAT
// (use kunjungan_obat_id as identifier; read affected_rows)
// ========================================================
router.delete('/:kunjunganObatId', authenticate, async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  
  try {
    const { kunjunganObatId } = req.params;

    console.log('Deleting kunjungan obat:', { kunjunganObatId });

    const [result] = await pool.execute(
      'CALL DeleteKunjunganObat(?)',
      [kunjunganObatId]
    ) as [RowDataPacket[][], any];

    // DeleteKunjunganObat SELECTs affected_rows AS affected_rows
    const affected = result?.[0]?.[0]?.affected_rows ?? 0;
    if (affected === 0) {
      return res.status(404).json({ message: 'Data obat kunjungan tidak ditemukan' });
    }

    res.json({ message: 'Obat berhasil dihapus dari kunjungan' });
  } catch (error: any) {
    console.error('Error deleting kunjungan obat:', error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: error?.message || 'Unknown error'
    });
  }
});

export default router;