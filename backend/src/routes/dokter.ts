import express from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { RowDataPacket } from 'mysql2';

const router = express.Router();

// ========================================================
// GET ALL DOKTERS - Menggunakan pool sesuai role user
// ========================================================
router.get('/', authenticate, async (req: AuthRequest, res) => {
  console.log('📋 [GET ALL DOKTERS] Request received');
  const pool = req.dbPool; // ✅ Gunakan pool dari request
  
  try {
    console.log(`🔄 [GET ALL DOKTERS] Using DB pool for role_id: ${req.user.role_id}`);
    const [rows]: any = await pool.execute('CALL GetAllDokters()');
    console.log(`✅ [GET ALL DOKTERS] Success - ${rows[0]?.length || 0} dokters found`);
    res.json(rows[0]);
  } catch (error: any) {
    console.error('❌ [GET ALL DOKTERS] Error:', error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// GET DOKTER BY ID
// ========================================================
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  const { id } = req.params;
  console.log(`📋 [GET DOKTER BY ID] Request received for ID: ${id}`);
  const pool = req.dbPool;
  
  try {
    console.log(`🔄 [GET DOKTER BY ID] Calling stored procedure GetDokterById with ID: ${id}`);
    const [rows]: any = await pool.execute('CALL GetDokterById(?)', [id]);
    
    if (rows[0].length === 0) {
      return res.status(404).json({ message: 'Dokter tidak ditemukan' });
    }
    
    console.log(`✅ [GET DOKTER BY ID] Success for ID: ${id}`);
    res.json(rows[0][0]);
  } catch (error: any) {
    console.error(`❌ [GET DOKTER BY ID] Error for ID: ${id}`, error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// GET ALL SPESIALISASI
// ========================================================
router.get('/spesialisasi/list', authenticate, async (req: AuthRequest, res) => {
  console.log('📋 [GET SPESIALISASI] Request received');
  const pool = req.dbPool;
  
  try {
    console.log('🔄 [GET SPESIALISASI] Calling stored procedure GetAllSpesialisasi');
    const [rows]: any = await pool.execute('CALL GetAllSpesialisasi()');
    console.log(`✅ [GET SPESIALISASI] Success - ${rows[0]?.length || 0} spesialisasi found`);
    res.json(rows[0]);
  } catch (error: any) {
    console.error('❌ [GET SPESIALISASI] Error:', error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// GET AVAILABLE KLINIKS
// ========================================================
router.get('/kliniks/available', authenticate, async (req: AuthRequest, res) => {
  console.log('📋 [GET AVAILABLE KLINIKS] Request received');
  const pool = req.dbPool;
  
  try {
    console.log('🔄 [GET AVAILABLE KLINIKS] Calling stored procedure GetAvailableKliniks');
    const [rows]: any = await pool.execute('CALL GetAvailableKliniks()');
    console.log(`✅ [GET AVAILABLE KLINIKS] Success - ${rows[0]?.length || 0} kliniks found`);
    res.json(rows[0]);
  } catch (error: any) {
    console.error('❌ [GET AVAILABLE KLINIKS] Error:', error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// CREATE DOKTER (Admin only)
// ========================================================
router.post('/', authenticate, authorize(1), async (req: AuthRequest, res) => {
  console.log('📋 [CREATE DOKTER] Request received');
  console.log('📝 [CREATE DOKTER] Request body:', JSON.stringify(req.body, null, 2));
  const pool = req.dbPool;
  
  try {
    const { 
      title_dokter, 
      nama_dokter, 
      telepon_dokter, 
      tanggal_mulai_kerja, 
      spesialisasi_id, 
      klinik_id 
    } = req.body;
    
    if (!title_dokter || !nama_dokter) {
      return res.status(400).json({ 
        message: 'Title dokter dan nama dokter wajib diisi' 
      });
    }

    console.log('🔄 [CREATE DOKTER] Calling stored procedure CreateDokter');
    
    const [result]: any = await pool.execute(
      'CALL CreateDokter(?, ?, ?, ?, ?, ?)',
      [
        title_dokter,
        nama_dokter,
        telepon_dokter || null,
        tanggal_mulai_kerja || null,
        spesialisasi_id || null,
        klinik_id || null
      ]
    );
    
    const newDokter = result[0][0];
    console.log(`✅ [CREATE DOKTER] Success - New Dokter ID: ${newDokter?.dokter_id}`);
    res.status(201).json(newDokter);
  } catch (error: any) {
    console.error('❌ [CREATE DOKTER] Error:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Nomor telepon sudah terdaftar' });
    }
    if (error.sqlState === '45000') {
      return res.status(400).json({ message: error.sqlMessage });
    }
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// UPDATE DOKTER (Dokter sendiri & Admin)
// ========================================================
router.put('/:id', authenticate, authorize(1, 2), async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  const { id } = req.params;
  const { title_dokter, nama_dokter, telepon_dokter, tanggal_mulai_kerja, spesialisasi_id, klinik_id, is_active } = req.body;

  try {
    // Jika vet, hanya boleh update data dirinya sendiri
    if (req.user.role_id === 2 && req.user.dokter_id !== parseInt(id)) {
      return res.status(403).json({ message: "Akses ditolak" });
    }

    const [result] = await pool.execute(
      'CALL UpdateDokter(?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        title_dokter || null,
        nama_dokter || null,
        telepon_dokter || null,
        tanggal_mulai_kerja || null,
        spesialisasi_id || null,
        klinik_id || null,
        is_active !== undefined ? is_active : null
      ]
    ) as [RowDataPacket[][], any];

    res.json(result[0][0]);
  } catch (error: any) {
    console.error('❌ [UPDATE DOKTER] Error:', error);
    res.status(500).json({ message: error.message || 'Terjadi kesalahan server' });
  }
});

// ========================================================
// DELETE DOKTER (Admin only)
// ========================================================
router.delete('/:id', authenticate, authorize(1), async (req: AuthRequest, res) => {
  const { id } = req.params;
  console.log(`📋 [DELETE DOKTER] Request received for ID: ${id}`);
  const pool = req.dbPool;
  
  try {
    const [result]: any = await pool.execute('CALL DeleteDokter(?)', [id]);
    
    const affectedRows = result[0][0].affected_rows;

    if (affectedRows === 0) {
      return res.status(404).json({ message: 'Dokter tidak ditemukan' });
    }

    console.log(`✅ [DELETE DOKTER] Success - Deleted ID: ${id}`);
    res.json({ message: 'Dokter berhasil dihapus' });
  } catch (error: any) {
    console.error(`❌ [DELETE DOKTER] Error for ID: ${id}`, error);
    
    if (error.sqlState === '45000') {
      return res.status(400).json({ message: error.sqlMessage });
    }
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET ALL DOKTERS FOR PAWRENT
router.get('/public/list', authenticate, authorize(3), async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  try {
    const [rows] = await pool.execute('CALL GetAllDoktersForPawrent()') as [RowDataPacket[][], any];
    res.json(rows[0]);
  } catch (error) {
    console.error('❌ [GET ALL DOKTERS FOR PAWRENT] Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// ========================================================
// TOGGLE ACTIVE STATUS DOKTER (Dokter sendiri & Admin)
// ========================================================
router.patch('/:id/toggle-active', authenticate, authorize(1, 2), async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  const { id } = req.params;

  try {
    // Jika vet, hanya boleh update data dirinya sendiri
    if (req.user.role_id === 2 && req.user.dokter_id !== parseInt(id)) {
      return res.status(403).json({ message: "Akses ditolak" });
    }

    // Get current is_active status
    const [currentRows]: any = await pool.execute('SELECT is_active FROM Dokter WHERE dokter_id = ? AND deleted_at IS NULL', [id]);
    if (currentRows.length === 0) {
      return res.status(404).json({ message: "Dokter tidak ditemukan" });
    }

    const currentIsActive = currentRows[0].is_active;
    const newIsActive = !currentIsActive;

    // Update only is_active
    await pool.execute('UPDATE Dokter SET is_active = ? WHERE dokter_id = ?', [newIsActive, id]);

    res.json({ message: `Status dokter ${newIsActive ? 'diaktifkan' : 'dinonaktifkan'}`, is_active: newIsActive });
  } catch (error: any) {
    console.error('❌ [TOGGLE ACTIVE DOKTER] Error:', error);
    res.status(500).json({ message: error.message || 'Terjadi kesalahan server' });
  }
});

export default router;