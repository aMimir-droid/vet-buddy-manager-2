import express from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { RowDataPacket } from 'mysql2';

const router = express.Router();

// GET booking by id (uses stored procedure GetBookingById)
router.get('/:id(\\d+)', authenticate, async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  const { id } = req.params;
  try {
    const [rows]: any = await pool.execute('CALL GetBookingById(?)', [id]) as [RowDataPacket[][], any];
    const result = rows?.[0] ?? [];
    if (result.length === 0) {
      return res.status(404).json({ message: 'Booking tidak ditemukan' });
    }
    res.json(result[0]);
  } catch (error: any) {
    console.error('❌ [GET BOOKING BY ID] Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error?.message });
  }
});

// GET bookings for a dokter (uses stored procedure GetBookingsByDokter)
router.get('/dokter/:dokterId', authenticate, async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  const { dokterId } = req.params;
  try {
    const [rows]: any = await pool.execute('CALL GetBookingsByDokter(?)', [dokterId]) as [RowDataPacket[][], any];
    res.json(rows?.[0] ?? []);
  } catch (error: any) {
    console.error('❌ [GET BOOKINGS BY DOKTER] Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error?.message });
  }
});

// GET my bookings (pawrent) - convenience endpoint (direct SELECT)
router.get('/my', authenticate, authorize(3), async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  const pawrentId = req.user?.pawrent_id;
  try {
    const [rows] = await pool.execute(
      `SELECT 
        b.*, 
        d.nama_dokter 
      FROM Booking b 
      LEFT JOIN Dokter d ON b.dokter_id = d.dokter_id 
      WHERE b.pawrent_id = ? 
      ORDER BY b.tanggal_booking, b.waktu_booking`,
      [pawrentId]
    ) as [RowDataPacket[], any];
    res.json(rows);
  } catch (error: any) {
    console.error('❌ [GET MY BOOKINGS] Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error?.message });
  }
});

// CREATE booking - use stored procedure CreateBooking
// Allowed: pawrent (3) and admin (1)
router.post('/', authenticate, authorize(1, 3), async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  const {
    dokter_id,
    tanggal_booking,
    waktu_booking,
    status,
    catatan
  } = req.body;

  try {
    if (!dokter_id || !tanggal_booking || !waktu_booking) {
      return res.status(400).json({ message: 'dokter_id, tanggal_booking dan waktu_booking wajib diisi' });
    }

    // Ambil pawrent_id dan nama dari user yang login
    const effectivePawrentId = req.user.role_id === 3 ? req.user.pawrent_id : req.body.pawrent_id;
    const nama_pengunjung = req.user.role_id === 3
      ? `${req.user.nama_depan_pawrent || ''} ${req.user.nama_belakang_pawrent || ''}`.trim()
      : req.body.nama_pengunjung || null;

    const [result]: any = await pool.execute(
      'CALL CreateBooking(?, ?, ?, ?, ?, ?, ?)',
      [
        dokter_id,
        effectivePawrentId,
        nama_pengunjung,
        tanggal_booking,
        waktu_booking,
        status || 'pending',
        catatan || null
      ]
    ) as [RowDataPacket[][], any];

    const created = result?.[0]?.[0] ?? null;
    res.status(201).json({ message: 'Booking berhasil dibuat', data: created });
  } catch (error: any) {
    console.error('❌ [CREATE BOOKING] Error:', error);
    const sqlState = error?.sqlState ?? error?.code;
    const msg = error?.sqlMessage ?? error?.message ?? String(error);
    if (sqlState === '45000') {
      return res.status(400).json({ message: msg });
    }
    if (sqlState === '23000' || sqlState === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: msg || 'Waktu booking konflik' });
    }
    res.status(500).json({ message: 'Terjadi kesalahan server', error: msg });
  }
});

// UPDATE booking - uses stored procedure UpdateBooking
// Allow admin and pawrent (pawrent should own the booking - ownership check + pending-only enforced)
router.put('/:id(\\d+)', authenticate, authorize(1, 3), async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  const { id } = req.params;
  const {
    dokter_id,
    pawrent_id,
    nama_pengunjung,
    tanggal_booking,
    waktu_booking,
    status,
    catatan
  } = req.body;

  try {
    // Fetch current booking to validate ownership and status
    const [rows] = await pool.execute('SELECT booking_id, pawrent_id, status FROM Booking WHERE booking_id = ?', [parseInt(id, 10)]) as [any[], any];
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'Booking tidak ditemukan' });
    }
    const current = rows[0];

    // Pawrent can only update their own booking
    if (req.user.role_id === 3) {
      if (!req.user.pawrent_id || current.pawrent_id !== req.user.pawrent_id) {
        return res.status(403).json({ message: 'Anda tidak memiliki izin untuk mengubah booking ini' });
      }

      // Pawrent can only update when status is 'pending'
      const currStatus = (current.status || '').toString().toLowerCase();
      if (currStatus !== 'pending') {
        return res.status(403).json({ message: 'Booking tidak dapat diubah karena status bukan pending' });
      }
    }

    // For pawrent role override pawrent_id (ensure correct ownership)
    const effectivePawrentId = req.user.role_id === 3 ? req.user.pawrent_id : pawrent_id;

    const [result]: any = await pool.execute(
      'CALL UpdateBooking(?, ?, ?, ?, ?, ?, ?, ?)',
      [
        parseInt(id, 10),
        dokter_id ?? null,
        effectivePawrentId ?? null,
        nama_pengunjung ?? null,
        tanggal_booking ?? null,
        waktu_booking ?? null,
        status ?? null,
        catatan ?? null
      ]
    ) as [RowDataPacket[][], any];

    const updated = result?.[0]?.[0] ?? null;
    res.json({ message: 'Booking berhasil diupdate', data: updated });
  } catch (error: any) {
    console.error('❌ [UPDATE BOOKING] Error:', error);
    const sqlState = error?.sqlState ?? error?.code;
    const msg = error?.sqlMessage ?? error?.message ?? String(error);
    if (sqlState === '23000' || sqlState === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: msg || 'Conflict updating booking' });
    }
    res.status(500).json({ message: 'Terjadi kesalahan server', error: msg });
  }
});

// DELETE booking - admin only
router.delete('/:id(\\d+)', authenticate, authorize(1), async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  const { id } = req.params;

  try {
    const [result]: any = await pool.execute('CALL DeleteBooking(?)', [parseInt(id, 10)]) as [RowDataPacket[][], any];
    // Some procedures return affected rows; handle gracefully
    const affected = result?.[0]?.[0]?.affected_rows ?? null;
    res.json({ message: 'Booking dihapus', affected_rows: affected });
  } catch (error: any) {
    console.error('❌ [DELETE BOOKING] Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error?.message });
  }
});

// NEW: GET available slots for a dokter on a date
// Query params: dokterId, date (YYYY-MM-DD)
router.get('/available', authenticate, async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  const dokterId = Number(req.query.dokterId);
  const date = String(req.query.date || '');

  if (!dokterId || !date) {
    return res.status(400).json({ message: 'Parameter dokterId dan date wajib diisi (YYYY-MM-DD)' });
  }

  try {
    // 1) Ambil shifts aktif untuk dokter pada hari tersebut
    const [shiftRows]: any = await pool.execute(
      `SELECT jam_mulai, jam_selesai
       FROM Shift_Dokter
       WHERE dokter_id = ?
         AND (is_active = 1 OR is_active = TRUE)
         AND hari_minggu = (WEEKDAY(?) + 1)`,
      [dokterId, date]
    );

    if (!shiftRows || shiftRows.length === 0) {
      return res.json({ availableSlots: [], shifts: [] });
    }

    // 2) Ambil booking yang sudah ada untuk dokter pada tanggal itu (non-cancelled)
    const [bookingRows]: any = await pool.execute(
      `SELECT waktu_booking
       FROM Booking
       WHERE dokter_id = ?
         AND tanggal_booking = ?
         AND (status IS NULL OR LOWER(status) != 'cancelled')`,
      [dokterId, date]
    );

    const existingTimes = (bookingRows || []).map((r: any) => (r.waktu_booking || '').toString().substring(0,5)); // "HH:MM"

    // helper
    const toMinutes = (t: string) => {
      const [hh, mm] = t.split(':').map((s: string) => parseInt(s, 10) || 0);
      return hh * 60 + mm;
    };

    const slotDuration = 30; // menit
    const availableSlots: string[] = [];

    // For each shift, generate 30-min slots where slot + duration <= jam_selesai
    for (const s of shiftRows) {
      const startStr = (s.jam_mulai || '').toString().substring(0,5);
      const endStr = (s.jam_selesai || '').toString().substring(0,5);
      if (!startStr || !endStr) continue;

      const startMin = toMinutes(startStr);
      const endMin = toMinutes(endStr);

      // last slot start such that slot + slotDuration <= endMin
      for (let slot = startMin; slot + slotDuration <= endMin; slot += slotDuration) {
        const hh = Math.floor(slot / 60).toString().padStart(2, '0');
        const mm = (slot % 60).toString().padStart(2, '0');
        const slotStr = `${hh}:${mm}`;

        // check existing bookings: none may be within < 30 minutes (1800s) of this slot
        let conflict = false;
        for (const et of existingTimes) {
          const etMin = toMinutes(et);
          if (Math.abs(etMin - slot) < slotDuration) {
            conflict = true;
            break;
          }
        }
        if (!conflict) availableSlots.push(slotStr);
      }
    }

    res.json({ availableSlots, shifts: shiftRows });
  } catch (error: any) {
    console.error('❌ [GET AVAILABLE SLOTS] Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error?.message ?? String(error) });
  }
});

export default router;