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

export default router;