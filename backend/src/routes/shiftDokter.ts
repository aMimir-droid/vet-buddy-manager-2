import express from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { RowDataPacket } from 'mysql2';

const router = express.Router();

// ========================================================
// GET ALL SHIFT_DOKTER - Menggunakan Stored Procedure
// ========================================================
router.get('/', authenticate, async (req: AuthRequest, res) => {
  console.log('📋 [GET ALL SHIFT_DOKTER] Request received');
  const pool = req.dbPool;  // ✅ Tambahkan ini
  try {
    const [rows]: any = await pool.execute('CALL GetAllShiftDokter()');
    console.log(`✅ [GET ALL SHIFT_DOKTER] Success - ${rows[0]?.length || 0} shifts found`);
    res.json(rows[0]);
  } catch (error: any) {
    console.error('❌ [GET ALL SHIFT_DOKTER] Error:', error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// GET ALL SHIFT FOR PAWRENT (PUBLIC VIEW)
// ========================================================
router.get('/public/list', authenticate, authorize(3), async (req: AuthRequest, res) => {
  const pool = req.dbPool;  // Add this line to define pool
  try {
    console.log('📋 [GET ALL SHIFT - PUBLIC] Request received');
    const [rows]: any = await pool.execute('CALL GetAllShiftDokter()');
    console.log(`✅ [GET ALL SHIFT - PUBLIC] Success - ${rows[0]?.length || 0} shifts found`);
    return res.json(rows[0]);
  } catch (error: any) {
    console.error('❌ [GET ALL SHIFT - PUBLIC] Error:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});


// ========================================================
// GET ALL SHIFT FOR ADMIN (aktif dan non-aktif, untuk Admin Global)
// ========================================================
router.get('/admin/all', authenticate, authorize(1), async (req: AuthRequest, res) => {
  console.log('📋 [GET ALL SHIFT - ADMIN] Request received');
  const pool = req.dbPool;
  try {
    const [rows]: any = await pool.execute('CALL GetAllShiftDokterAdmin()');
    console.log(`✅ [GET ALL SHIFT - ADMIN] Success - ${rows[0]?.length || 0} shifts found`);
    res.json(rows[0]);
  } catch (error: any) {
    console.error('❌ [GET ALL SHIFT - ADMIN] Error:', error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
// ========================================================
// GET SHIFT BY ID
// ========================================================
router.get('/:id(\\d+)', authenticate, async (req: AuthRequest, res) => {
  const pool = req.dbPool;  // Add this line to define pool
  const { id } = req.params;
  console.log(`📋 [GET SHIFT BY ID] Request received for ID: ${id}`);
  try {
    console.log(`🔄 [GET SHIFT BY ID] Calling stored procedure GetShiftDokterById with ID: ${id}`);
    const [rows]: any = await pool.execute('CALL GetShiftDokterById(?)', [id]);
    const result = rows?.[0] ?? [];
    if (result.length === 0) {
      console.log(`⚠️ [GET SHIFT BY ID] Not found for ID: ${id}`);
      return res.status(404).json({ message: 'Shift tidak ditemukan' });
    }
    console.log(`✅ [GET SHIFT BY ID] Success for ID: ${id}`);
    return res.json(result[0]);
  } catch (error: any) {
    console.error(`❌ [GET SHIFT BY ID] Error for ID: ${id}`, error);
    return res.status(500).json({
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// CREATE SHIFT - Allowed for roles: Vet (2) and Admin (1)
// Stored procedure assumed: CreateShiftDokter(dokter_id, hari_minggu, jam_mulai, jam_selesai, is_active)
// ========================================================
router.post('/', authenticate, async (req: AuthRequest, res) => {
  const pool = req.dbPool;  // Add this line to define pool
  console.log('📋 [CREATE SHIFT] Request received');
  console.log('📝 [CREATE SHIFT] Request body:', JSON.stringify(req.body, null, 2));
  try {
    const authReq = req as AuthRequest;
    const user = authReq.user;
    if (!user || ![1, 2].includes(user.role_id)) {
      return res.status(403).json({ message: 'Akses ditolak' });
    }

    const { dokter_id, hari_minggu, jam_mulai, jam_selesai, is_active } = req.body;

    if (dokter_id === undefined || hari_minggu === undefined || !jam_mulai || !jam_selesai) {
      return res.status(400).json({ message: 'dokter_id, hari_minggu, jam_mulai, jam_selesai wajib diisi' });
    }

    const dokterIdNum = parseInt(dokter_id, 10);
    const hariNum = parseInt(hari_minggu, 10);
    if (Number.isNaN(dokterIdNum) || Number.isNaN(hariNum)) {
      return res.status(400).json({ message: 'dokter_id dan hari_minggu harus berupa angka' });
    }
    if (hariNum < 0 || hariNum > 6) {
      return res.status(400).json({ message: 'hari_minggu harus antara 0 (Minggu) sampai 6 (Sabtu)' });
    }

    const activeFlag = is_active === undefined ? 1 : (is_active ? 1 : 0);

    console.log('🔄 [CREATE SHIFT] Calling stored procedure CreateShiftDokter');
    console.log(`📊 [CREATE SHIFT] Params: dokter_id=${dokterIdNum}, hari_minggu=${hariNum}, jam_mulai=${jam_mulai}, jam_selesai=${jam_selesai}, is_active=${activeFlag}`);

    const [result]: any = await pool.execute(
      'CALL CreateShiftDokter(?, ?, ?, ?, ?)',
      [dokterIdNum, hariNum, jam_mulai, jam_selesai, activeFlag]
    );

    const newShift = result?.[0]?.[0] ?? null;
    console.log(`✅ [CREATE SHIFT] Success - New Shift ID: ${newShift?.shift_id}`);
    return res.status(201).json(newShift);
  } catch (error: any) {
    console.error('❌ [CREATE SHIFT] Error:', error);
    if (error?.sqlState === '45000') {
      return res.status(400).json({ message: error.sqlMessage || error.message });
    }
    return res.status(500).json({
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// UPDATE SHIFT - Allowed for roles: Vet (2) and Admin (1)
// Stored procedure assumed: UpdateShiftDokter(shift_id, dokter_id, hari_minggu, jam_mulai, jam_selesai, is_active)
// ========================================================
router.put('/:id(\\d+)', authenticate, async (req: AuthRequest, res) => {
  const pool = req.dbPool;  // Add this line to define pool
  const { id } = req.params;
  console.log(`📋 [UPDATE SHIFT] Request received for ID: ${id}`);
  console.log('📝 [UPDATE SHIFT] Request body:', JSON.stringify(req.body, null, 2));
  try {
    const authReq = req as AuthRequest;
    const user = authReq.user;
    if (!user || ![1, 2].includes(user.role_id)) {
      return res.status(403).json({ message: 'Akses ditolak' });
    }

    const { dokter_id, hari_minggu, jam_mulai, jam_selesai, is_active } = req.body;

    if (dokter_id === undefined || hari_minggu === undefined || !jam_mulai || !jam_selesai) {
      return res.status(400).json({ message: 'dokter_id, hari_minggu, jam_mulai, jam_selesai wajib diisi' });
    }

    const dokterIdNum = parseInt(dokter_id, 10);
    const hariNum = parseInt(hari_minggu, 10);
    if (Number.isNaN(dokterIdNum) || Number.isNaN(hariNum)) {
      return res.status(400).json({ message: 'dokter_id dan hari_minggu harus berupa angka' });
    }
    if (hariNum < 0 || hariNum > 6) {
      return res.status(400).json({ message: 'hari_minggu harus antara 0 (Minggu) sampai 6 (Sabtu)' });
    }

    const activeFlag = is_active === undefined ? 1 : (is_active ? 1 : 0);

    console.log('🔄 [UPDATE SHIFT] Calling stored procedure UpdateShiftDokter');
    console.log(`📊 [UPDATE SHIFT] Params: id=${id}, dokter_id=${dokterIdNum}, hari_minggu=${hariNum}, jam_mulai=${jam_mulai}, jam_selesai=${jam_selesai}, is_active=${activeFlag}`);

    const [result]: any = await pool.execute(
      'CALL UpdateShiftDokter(?, ?, ?, ?, ?, ?)',
      [id, dokterIdNum, hariNum, jam_mulai, jam_selesai, activeFlag]
    );

    const updatedShift = result?.[0]?.[0] ?? null;
    console.log(`✅ [UPDATE SHIFT] Success for ID: ${id}`);
    return res.json(updatedShift);
  } catch (error: any) {
    console.error(`❌ [UPDATE SHIFT] Error for ID: ${id}`, error);
    if (error?.sqlState === '45000') {
      return res.status(400).json({ message: error.sqlMessage || error.message });
    }
    return res.status(500).json({
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// DELETE SHIFT - Allowed for roles: Vet (2) and Admin (1)
// Stored procedure assumed: DeleteShiftDokter(shift_id)
// ========================================================
router.delete('/:id(\\d+)', authenticate, async (req: AuthRequest, res) => {
  const pool = req.dbPool;  // Add this line to define pool
  const { id } = req.params;
  console.log(`📋 [DELETE SHIFT] Request received for ID: ${id}`);
  try {
    const authReq = req as AuthRequest;
    const user = authReq.user;
    if (!user || ![1, 2].includes(user.role_id)) {
      return res.status(403).json({ message: 'Akses ditolak' });
    }

    console.log(`🔄 [DELETE SHIFT] Calling stored procedure DeleteShiftDokter for ID: ${id}`);
    const [result]: any = await pool.execute('CALL DeleteShiftDokter(?)', [id]);

    const affectedRows = result?.[0]?.[0]?.affected_rows ?? 0;
    if (affectedRows === 0) {
      console.log(`⚠️ [DELETE SHIFT] Not found or not deleted for ID: ${id}`);
      return res.status(404).json({ message: 'Shift tidak ditemukan' });
    }

    console.log(`✅ [DELETE SHIFT] Success - Deleted ID: ${id}`);
    return res.json({ message: 'Shift berhasil dihapus' });
  } catch (error: any) {
    console.error(`❌ [DELETE SHIFT] Error for ID: ${id}`, error);
    if (error?.sqlState === '45000') {
      return res.status(400).json({ message: error.sqlMessage || error.message });
    }
    return res.status(500).json({
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Tambahkan di shiftDokter.ts
router.get('/by-dokter/:dokterId', authenticate, async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  const { dokterId } = req.params;
  try {
    const [rows]: any = await pool.execute('CALL GetShiftDokterByDokter(?)', [dokterId]);
    res.json(rows[0]);
  } catch (error: any) {
    console.error('Error fetching shift by dokter:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
});

router.get('/aktif/list', authenticate, async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  try {
    const [rows]: any = await pool.execute('CALL GetAllShiftDokterAktif()');
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// ========================================================
// GET SHIFT BY KLINIK (untuk Admin Klinik)
// ========================================================
router.get('/by-klinik/:klinikId', authenticate, authorize(4), async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  const { klinikId } = req.params;
  const user = req.user;
  
  console.log(`📋 [GET SHIFT BY KLINIK] Request received for Klinik ID: ${klinikId} by User ID: ${user?.user_id}`);
  
  // Pastikan user.klinik_id sama dengan klinikId yang diminta
  if (!user?.klinik_id || user.klinik_id.toString() !== klinikId) {
    return res.status(403).json({ message: 'Akses ditolak: Anda hanya bisa melihat dokter di klinik Anda' });
  }
  
  try {
    // Ubah dari GetShiftDokterByKlinik ke GetAllShiftDokterByKlinik untuk mengambil semua shift (aktif dan tidak aktif)
    const [rows]: any = await pool.execute('CALL GetAllShiftDokterByKlinik(?)', [klinikId]);
    console.log(`✅ [GET SHIFT BY KLINIK] Success - ${rows[0]?.length || 0} shifts found for Klinik ID: ${klinikId}`);
    res.json(rows[0]);
  } catch (error: any) {  // ✅ Ubah dari catch (error) ke catch (error: any) untuk konsistensi dan menghindari error TypeScript
    console.error(`❌ [GET SHIFT BY KLINIK] Error for Klinik ID: ${klinikId}`, error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// CREATE SHIFT (untuk Admin Klinik) - Hanya untuk dokter di kliniknya
// ========================================================
router.post('/by-klinik/:klinikId', authenticate, authorize(4), async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  const { klinikId } = req.params;
  const user = req.user;
  
  if (!user?.klinik_id || user.klinik_id.toString() !== klinikId) {
    return res.status(403).json({ message: 'Akses ditolak: Anda hanya bisa menambah shift di klinik Anda' });
  }
  
  const { dokter_id, hari_minggu, jam_mulai, jam_selesai, is_active } = req.body;
  
  // Validasi dokter_id milik klinik user
  const [dokterCheck]: any = await pool.execute(
    'SELECT klinik_id FROM Dokter WHERE dokter_id = ? AND deleted_at IS NULL',
    [dokter_id]
  );
  if (!dokterCheck[0] || dokterCheck[0].klinik_id !== parseInt(klinikId, 10)) {
    return res.status(403).json({ message: 'Dokter tidak ditemukan di klinik Anda' });
  }
  
  // Lanjutkan dengan logika create seperti di route POST '/' , tapi gunakan CALL CreateShiftDokter
  try {
    const [result]: any = await pool.execute(
      'CALL CreateShiftDokter(?, ?, ?, ?, ?)',
      [parseInt(dokter_id, 10), parseInt(hari_minggu, 10), jam_mulai, jam_selesai, is_active ? 1 : 0]
    );
    res.status(201).json(result[0][0]);
  } catch (error: any) {
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// ========================================================
// UPDATE SHIFT (untuk Admin Klinik) - Hanya untuk dokter di kliniknya
// ========================================================
router.put('/by-klinik/:klinikId/:shiftId', authenticate, authorize(4), async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  const { klinikId, shiftId } = req.params;
  const user = req.user;
  
  if (!user?.klinik_id || user.klinik_id.toString() !== klinikId) {
    return res.status(403).json({ message: 'Akses ditolak: Anda hanya bisa mengupdate shift di klinik Anda' });
  }
  
  const { dokter_id, hari_minggu, jam_mulai, jam_selesai, is_active } = req.body;
  
  // Validasi dokter_id milik klinik user
  const [dokterCheck]: any = await pool.execute(
    'SELECT klinik_id FROM Dokter WHERE dokter_id = ? AND deleted_at IS NULL',
    [dokter_id]
  );
  if (!dokterCheck[0] || dokterCheck[0].klinik_id !== parseInt(klinikId, 10)) {
    return res.status(403).json({ message: 'Dokter tidak ditemukan di klinik Anda' });
  }
  
  // Lanjutkan dengan logika update seperti di route PUT '/:id'
  try {
    const [result]: any = await pool.execute(
      'CALL UpdateShiftDokter(?, ?, ?, ?, ?, ?)',
      [shiftId, parseInt(dokter_id, 10), parseInt(hari_minggu, 10), jam_mulai, jam_selesai, is_active ? 1 : 0]
    );
    res.json(result[0][0]);
  } catch (error: any) {
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// ========================================================
// DELETE SHIFT (untuk Admin Klinik) - Hanya untuk dokter di kliniknya
// ========================================================
router.delete('/by-klinik/:klinikId/:shiftId', authenticate, authorize(4), async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  const { klinikId, shiftId } = req.params;
  const user = req.user;
  
  if (!user?.klinik_id || user.klinik_id.toString() !== klinikId) {
    return res.status(403).json({ message: 'Akses ditolak: Anda hanya bisa menghapus shift di klinik Anda' });
  }
  
  // Validasi shift milik klinik user (opsional, tapi aman)
  const [shiftCheck]: any = await pool.execute(`
    SELECT k.klinik_id FROM Shift_Dokter s
    JOIN Dokter d ON s.dokter_id = d.dokter_id
    JOIN Klinik k ON d.klinik_id = k.klinik_id
    WHERE s.shift_id = ? AND s.is_active = TRUE
  `, [shiftId]);
  if (!shiftCheck[0] || shiftCheck[0].klinik_id !== parseInt(klinikId, 10)) {
    return res.status(403).json({ message: 'Shift tidak ditemukan di klinik Anda' });
  }
  
  // Lanjutkan dengan logika delete seperti di route DELETE '/:id'
  try {
    await pool.execute('CALL DeleteShiftDokter(?)', [shiftId]);
    res.json({ message: 'Shift berhasil dihapus' });
  } catch (error: any) {
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});



export default router;