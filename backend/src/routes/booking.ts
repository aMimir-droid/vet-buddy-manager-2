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
    klinik_id,
    dokter_id,
    pawrent_id,
    hewan_id,  // GANTI: Dari nama_pengunjung ke hewan_id
    tanggal_booking,
    waktu_booking,
    status,
    catatan
  } = req.body;

  try {
    if (!klinik_id || !dokter_id || !tanggal_booking || !waktu_booking) {
      return res.status(400).json({ message: 'klinik_id, dokter_id, tanggal_booking dan waktu_booking wajib diisi' });
    }

    // Ambil pawrent_id dan hewan_id dari user yang login (untuk pawrent)
    const effectivePawrentId = req.user.role_id === 3 ? req.user.pawrent_id : req.body.pawrent_id;
    const effectiveHewanId = req.user.role_id === 3 ? req.body.hewan_id : req.body.hewan_id;  // TAMBAHKAN: Ambil hewan_id dari request

    const [result]: any = await pool.execute(
      'CALL CreateBooking(?, ?, ?, ?, ?, ?, ?, ?)',  // Parameter tetap 8
      [
        klinik_id,
        dokter_id,
        effectivePawrentId,
        effectiveHewanId,  // GANTI: Kirim hewan_id
        tanggal_booking,
        waktu_booking,
        status || 'pending',
        catatan || null
      ]
    );

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
    klinik_id,  // TAMBAHKAN: Destructure klinik_id
    dokter_id,
    pawrent_id,
    hewan_id,  // GANTI: Dari nama_pengunjung ke hewan_id
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

    // For pawrent role, override pawrent_id and hewan_id (ensure correct ownership)
    const effectivePawrentId = req.user.role_id === 3 ? req.user.pawrent_id : pawrent_id;
    const effectiveHewanId = req.user.role_id === 3 ? req.body.hewan_id : req.body.hewan_id;  // TAMBAHKAN: Ambil hewan_id dari request (sama untuk pawrent dan admin)

    const [result]: any = await pool.execute(
      'CALL UpdateBooking(?, ?, ?, ?, ?, ?, ?, ?, ?)',  // PERBAIKI: 9 parameters
      [
        parseInt(id, 10),
        klinik_id ?? null,  // TAMBAHKAN: Pass klinik_id
        dokter_id ?? null,
        effectivePawrentId ?? null,
        effectiveHewanId ?? null,  // GANTI: Pass hewan_id
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
    return res.status(400).json({ message: 'dokterId dan date wajib diisi' });
  }

  try {
    // Parse date
    const bookingDate = new Date(date);
    if (isNaN(bookingDate.getTime())) {
      return res.status(400).json({ message: 'Format tanggal tidak valid' });
    }

    // TAMBAHKAN: Validasi tanggal tidak di masa lalu (opsional)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (bookingDate < today) {
      return res.json({ availableSlots: [], message: 'Tidak bisa booking untuk tanggal masa lalu' });
    }

    // Get shift for this dokter on this day of week
    // UPDATE: Map getDay() ke 1-7 (1=Senin, ..., 7=Minggu)
    let dayOfWeek = bookingDate.getDay(); // 0 = Sunday
    if (dayOfWeek === 0) {
      dayOfWeek = 7; // Minggu
    }
    // dayOfWeek sekarang: 1=Senin, 2=Selasa, ..., 7=Minggu
    
    console.log(`🔍 [AVAILABLE SLOTS] Checking shift for dokter ${dokterId} on day ${dayOfWeek} (date: ${date})`);
    
    const [shiftRows] = await pool.execute(
      'SELECT * FROM Shift_Dokter WHERE dokter_id = ? AND hari_minggu = ? AND is_active = 1',
      [dokterId, dayOfWeek]
    ) as [RowDataPacket[], any];

    console.log(`📊 [AVAILABLE SLOTS] Found ${shiftRows.length} shifts for dokter ${dokterId} on day ${dayOfWeek}`);

    if (shiftRows.length === 0) {
      console.log(`❌ [AVAILABLE SLOTS] No active shift found for dokter ${dokterId} on day ${dayOfWeek}`);
      return res.json({ availableSlots: [] }); // No shift, no slots
    }

    const shift = shiftRows[0];
    const startTime = shift.jam_mulai;
    const endTime = shift.jam_selesai;

    console.log(`⏰ [AVAILABLE SLOTS] Shift time: ${startTime} - ${endTime}`);

    // Generate slots every 30 minutes
    const slots = [];
    let current = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);

    while (current < end) {
      slots.push(current.toTimeString().substring(0, 5)); // HH:MM
      current.setMinutes(current.getMinutes() + 30);
    }

    console.log(`📅 [AVAILABLE SLOTS] Generated ${slots.length} potential slots: ${slots.join(', ')}`);

    // Get existing bookings for this dokter on this date
    const [bookingRows] = await pool.execute(
      'SELECT waktu_booking FROM Booking WHERE dokter_id = ? AND tanggal_booking = ? AND status != "cancelled"',
      [dokterId, date]
    ) as [RowDataPacket[], any];

    const bookedTimes = bookingRows.map((b: any) => b.waktu_booking);
    console.log(`📋 [AVAILABLE SLOTS] Existing bookings: ${bookedTimes.join(', ')}`);

    // Filter out booked slots and slots within 30 minutes of booked slots
    const availableSlots = slots.filter(slot => {
      const slotTime = new Date(`${date}T${slot}:00`);
      return !bookedTimes.some((booked: string) => {
        const bookedTime = new Date(`${date}T${booked}`);
        const diff = Math.abs(slotTime.getTime() - bookedTime.getTime()) / (1000 * 60);
        return diff < 30; // Within 30 minutes
      });
    });

    console.log(`✅ [AVAILABLE SLOTS] Available slots: ${availableSlots.join(', ')}`);

    res.json({ availableSlots });
  } catch (error: any) {
    console.error('❌ [GET AVAILABLE SLOTS] Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
});

// TAMBAHKAN: GET all bookings (admin only) - menggunakan procedure GetAllBookings
router.get('/all', authenticate, authorize(1), async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  try {
    const [rows] = await pool.execute('CALL GetAllBookings()') as [RowDataPacket[], any];
    res.json(rows[0]); // Procedure mengembalikan result set
  } catch (error: any) {
    console.error('❌ [GET ALL BOOKINGS] Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error?.message });
  }
});

export default router;