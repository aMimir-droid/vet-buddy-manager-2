import express from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { RowDataPacket } from 'mysql2';

const router = express.Router();

// ========================================================
// PENTING: Route spesifik HARUS di atas route generic!
// ========================================================

// ========================================================
// PAWRENT-SPECIFIC ROUTES (Harus di atas route generic)
// ========================================================

// GET MY HEWANS - Pawrent melihat hewan miliknya
router.get('/my', authenticate, authorize(3), async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  
  try {
    console.log('🔍 [GET MY HEWANS] Getting hewans for pawrent_id:', req.user.pawrent_id);
    
    if (!req.user.pawrent_id) {
      return res.status(400).json({ message: 'Pawrent ID tidak ditemukan' });
    }

    const [rows] = await pool.execute(
      'SELECT * FROM Hewan WHERE pawrent_id = ? AND deleted_at IS NULL ORDER BY nama_hewan',
      [req.user.pawrent_id]
    ) as [RowDataPacket[], any];

    res.json(rows);
  } catch (error) {
    console.error('❌ [GET MY HEWANS] Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// CREATE HEWAN BY PAWRENT
router.post('/my', authenticate, authorize(3), async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  
  try {
    console.log('➕ [CREATE MY HEWAN] Request body:', req.body);
    console.log('👤 [CREATE MY HEWAN] User pawrent_id:', req.user.pawrent_id);
    
    const { nama_hewan, tanggal_lahir, jenis_kelamin, jenis_hewan_id, status_hidup } = req.body;
    
    // Validate required fields
    if (!nama_hewan || !jenis_kelamin || !jenis_hewan_id) {
      return res.status(400).json({ 
        message: 'Data tidak lengkap. Nama hewan, jenis kelamin, dan jenis hewan wajib diisi' 
      });
    }

    if (!req.user.pawrent_id) {
      return res.status(400).json({ message: 'Pawrent ID tidak ditemukan' });
    }

    const [result] = await pool.execute(
      'CALL CreateHewanByPawrent(?, ?, ?, ?, ?, ?)',
      [
        nama_hewan,
        tanggal_lahir || null,
        jenis_kelamin,
        jenis_hewan_id,
        req.user.pawrent_id, // Use logged-in user's pawrent_id
        status_hidup || 'Hidup'
      ]
    ) as [RowDataPacket[][], any];

    console.log('✅ [CREATE MY HEWAN] Success:', result[0][0]);
    res.status(201).json(result[0][0]);
  } catch (error: any) {
    console.error('❌ [CREATE MY HEWAN] Error:', error);
    res.status(500).json({ 
      message: error.sqlMessage || 'Terjadi kesalahan saat membuat data hewan' 
    });
  }
});

// UPDATE HEWAN BY PAWRENT
router.put('/my/:id', authenticate, authorize(3), async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  const { id } = req.params;
  
  try {
    console.log('✏️ [UPDATE MY HEWAN] Updating hewan:', id);
    console.log('👤 [UPDATE MY HEWAN] User pawrent_id:', req.user.pawrent_id);
    
    const { nama_hewan, tanggal_lahir, jenis_kelamin, jenis_hewan_id, status_hidup } = req.body;

    if (!req.user.pawrent_id) {
      return res.status(400).json({ message: 'Pawrent ID tidak ditemukan' });
    }

    // pastikan jenis_hewan_id valid number
    const jenisId = jenis_hewan_id ? parseInt(jenis_hewan_id) : null;
    if (!jenisId) {
      return res.status(400).json({ message: 'Jenis hewan tidak valid' });
    }

    // CEK OWNERSHIP sebelum panggil stored procedure
    const [ownerRows] = await pool.execute(
      'SELECT pawrent_id FROM Hewan WHERE hewan_id = ?',
      [parseInt(id)]
    ) as [RowDataPacket[], any];

    if (!ownerRows || ownerRows.length === 0) {
      return res.status(404).json({ message: 'Hewan tidak ditemukan' });
    }

    if (ownerRows[0].pawrent_id !== req.user.pawrent_id) {
      return res.status(403).json({ message: 'Anda tidak memiliki hak untuk mengubah hewan ini' });
    }

    const [result] = await pool.execute(
      'CALL UpdateHewanByPawrent(?, ?, ?, ?, ?, ?, ?)', // 7 params: id, nama, tanggal, jenis_kelamin, jenis_hewan_id, pawrent_id, status_hidup
      [
        parseInt(id, 10),
        nama_hewan,
        tanggal_lahir || null,
        jenis_kelamin,
        jenisId,
        req.user.pawrent_id,
        status_hidup || 'Hidup'
      ]
    ) as [RowDataPacket[][], any];

    console.log('✅ [UPDATE MY HEWAN] Success:', result[0][0]);
    res.json(result[0][0]);
  } catch (error: any) {
    console.error('❌ [UPDATE MY HEWAN] Error:', error);
    res.status(500).json({ 
      message: error.sqlMessage || 'Terjadi kesalahan saat mengupdate data hewan' 
    });
  }
});

// DELETE HEWAN BY PAWRENT
router.delete('/my/:id', authenticate, authorize(3), async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  const { id } = req.params;
  
  try {
    console.log('🗑️ [DELETE MY HEWAN] Deleting hewan:', id);
    console.log('👤 [DELETE MY HEWAN] User pawrent_id:', req.user.pawrent_id);

    if (!req.user.pawrent_id) {
      return res.status(400).json({ message: 'Pawrent ID tidak ditemukan' });
    }

    await pool.execute(
      'CALL DeleteHewanByPawrent(?, ?)',

      [parseInt(id), req.user.pawrent_id]
    );

    console.log('✅ [DELETE MY HEWAN] Success');
    res.json({ message: 'Hewan berhasil dihapus' });
  } catch (error: any) {
    console.error('❌ [DELETE MY HEWAN] Error:', error);
    res.status(500).json({ 
      message: error.sqlMessage || 'Terjadi kesalahan saat menghapus data hewan' 
    });
  }
});

// ========================================================
// ADMIN & VET ROUTES (Generic - untuk semua hewan)
// ========================================================

// GET ALL HEWANS
router.get('/', authenticate, async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  
  try {
    console.log('📋 [GET ALL HEWANS] Role:', req.user.role_id);
    const [rows] = await pool.execute('CALL GetAllHewans()') as [RowDataPacket[][], any];
    res.json(rows[0]);
  } catch (error) {
    console.error('❌ [GET ALL HEWANS] Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// GET HEWAN BY ID
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  const { id } = req.params;
  
  try {
    console.log('🔍 [GET HEWAN BY ID] Getting hewan:', id);
    const [rows] = await pool.execute(
      'CALL GetHewanById(?)', 
      [parseInt(id)]
    ) as [RowDataPacket[][], any];
    
    if (rows[0].length === 0) {
      return res.status(404).json({ message: 'Hewan tidak ditemukan' });
    }
    
    res.json(rows[0][0]);
  } catch (error) {
    console.error('❌ [GET HEWAN BY ID] Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// CREATE HEWAN (Admin/Vet)
router.post('/', authenticate, authorize(1, 2), async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  
  try {
    console.log('➕ [CREATE HEWAN] Request body:', req.body);
    
    const { 
      nama_hewan, 
      tanggal_lahir, 
      jenis_kelamin, 
      jenis_hewan_id, 
      pawrent_id,
      status_hidup 
    } = req.body;
    
    // ✅ Admin HARUS memilih pawrent
    if (!pawrent_id) {
      return res.status(400).json({ 
        message: 'Pawrent wajib dipilih. Setiap hewan harus memiliki pemilik' 
      });
    }

    const [result] = await pool.execute(
      'CALL CreateHewan(?, ?, ?, ?, ?, ?)',

      [
        nama_hewan,
        tanggal_lahir || null,
        jenis_kelamin,
        jenis_hewan_id,
        pawrent_id, // ✅ From form selection
        status_hidup || 'Hidup'
      ]
    ) as [RowDataPacket[][], any];

    console.log('✅ [CREATE HEWAN] Success:', result[0][0]);
    res.status(201).json(result[0][0]);
  } catch (error: any) {
    console.error('❌ [CREATE HEWAN] Error:', error);
    res.status(500).json({ 
      message: error.sqlMessage || 'Terjadi kesalahan saat membuat data hewan' 
    });
  }
});

// UPDATE HEWAN (Admin/Vet)
router.put('/:id', authenticate, authorize(1, 2), async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  const { id } = req.params;
  
  try {
    console.log(`✏️ [UPDATE HEWAN] Updating hewan: ${id}`);
    console.log('📝 [UPDATE HEWAN] Request body:', JSON.stringify(req.body, null, 2));
    
    const { 
      nama_hewan, 
      tanggal_lahir, 
      jenis_kelamin, 
      jenis_hewan_id, 
      pawrent_id,
      status_hidup 
    } = req.body;

    // Validate required fields
    if (!nama_hewan || !jenis_kelamin || !jenis_hewan_id) {
      return res.status(400).json({ 
        message: 'Nama hewan, jenis kelamin, dan jenis hewan wajib diisi' 
      });
    }

    // ✅ PERBAIKAN: Validate pawrent_id hanya jika provided
    if (pawrent_id === null || pawrent_id === undefined || pawrent_id === '') {
      return res.status(400).json({ 
        message: 'Pawrent wajib dipilih. Setiap hewan harus memiliki pemilik (pawrent)' 
      });
    }

    console.log('🔄 [UPDATE HEWAN] Calling stored procedure UpdateHewan');
    console.log(`📊 [UPDATE HEWAN] Parameters: ID=${id}, Nama=${nama_hewan}, Pawrent=${pawrent_id}`);

    const [result] = await pool.execute(
      'CALL UpdateHewan(?, ?, ?, ?, ?, ?, ?)',
      [
        parseInt(id),
        nama_hewan,
        tanggal_lahir || null,
        jenis_kelamin,
        parseInt(jenis_hewan_id),
        pawrent_id ? parseInt(pawrent_id) : null, // ✅ Convert to int or null
        status_hidup || 'Hidup'
      ]
    ) as [RowDataPacket[][], any];

    const updatedHewan = result[0][0];
    console.log(`✅ [UPDATE HEWAN] Success - Hewan ID: ${id}`);
    res.json(updatedHewan);

  } catch (error: any) {
    console.error(`❌ [UPDATE HEWAN] Error for ID: ${id}`, error);
    
    if (error.sqlState === '45000') {
      return res.status(400).json({ message: error.sqlMessage });
    }
    
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE HEWAN (Admin/Vet)
router.delete('/:id', authenticate, authorize(1, 2), async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  const { id } = req.params;
  
  try {
    console.log('🗑️ [DELETE HEWAN] Deleting hewan:', id);
    
    await pool.execute('CALL DeleteHewan(?)', [parseInt(id)]);
    
    console.log('✅ [DELETE HEWAN] Success');
    res.json({ message: 'Hewan berhasil dihapus' });
  } catch (error: any) {
    console.error('❌ [DELETE HEWAN] Error:', error);
    res.status(500).json({ 
      message: error.sqlMessage || 'Terjadi kesalahan saat menghapus data hewan' 
    });
  }
});

// GET ALL JENIS HEWAN (alias untuk kompatibilitas client)
router.get('/jenis/all', authenticate, async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  
  try {
    console.log('📋 [GET ALL JENIS HEWAN] (all)');
    const [rows] = await pool.execute('CALL GetAllJenisHewan()') as [RowDataPacket[][], any];
    res.json(rows[0]);
  } catch (error) {
    console.error('❌ [GET ALL JENIS HEWAN] Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// New: alias endpoint expected by frontend
router.get('/jenis/list', authenticate, async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  
  try {
    console.log('📋 [GET ALL JENIS HEWAN] (list alias)');
    const [rows] = await pool.execute('CALL GetAllJenisHewan()') as [RowDataPacket[][], any];
    res.json(rows[0]);
  } catch (error) {
    console.error('❌ [GET ALL JENIS HEWAN] Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// GET hewan by pawrent
router.get('/by-pawrent/:pawrentId', authenticate, async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  const { pawrentId } = req.params;
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM Hewan WHERE pawrent_id = ?',
      [pawrentId]
    ) as [RowDataPacket[], any];
    res.json(rows);
  } catch (error: any) {
    console.error('❌ [GET HEWAN BY PAWRENT] Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error?.message });
  }
});

export default router;