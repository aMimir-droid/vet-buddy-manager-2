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

// GET my bookings (pawrent) - menggunakan stored procedure GetBookingsByPawrent
router.get('/my', authenticate, authorize(3), async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  const pawrentId = req.user?.pawrent_id;
  try {
    const [rows]: any = await pool.execute('CALL GetBookingsByPawrent(?)', [pawrentId]);
    res.json(rows[0]);
  } catch (error: any) {
    console.error('Error fetching my bookings:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
});

// CREATE booking - use stored procedure CreateBooking
// Allowed: pawrent (3), admin (1), and admin_klinik (4)
router.post('/', authenticate, authorize(1, 3, 4), async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  const {
    klinik_id,
    dokter_id,
    pawrent_id,
    hewan_id,
    tanggal_booking,
    waktu_booking,
    status,
    catatan
  } = req.body;

  try {
    if (!klinik_id || !dokter_id || !tanggal_booking || !waktu_booking) {
      return res.status(400).json({ message: 'klinik_id, dokter_id, tanggal_booking dan waktu_booking wajib diisi' });
    }

    // TAMBAHKAN: Check untuk admin_klinik_user (role 4) - pastikan klinik_id sesuai
    if (req.user.role_id === 4) {
      if (klinik_id !== req.user.klinik_id) {
        return res.status(403).json({ message: 'Akses ditolak: Anda hanya bisa membuat booking untuk klinik Anda sendiri' });
      }
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
router.put('/:id(\\d+)', authenticate, authorize(1, 2, 3, 4), async (req: AuthRequest, res) => {  // TAMBAHKAN: authorize(4) untuk admin_klinik
  const pool = req.dbPool;
  const bookingId = req.params.id;
  const { klinik_id, dokter_id, pawrent_id, hewan_id, tanggal_booking, waktu_booking, status, catatan } = req.body;
  const user = req.user;

  // Ambil data booking lama jika field kosong
  const [oldRows]: any = await pool.execute(
    "SELECT * FROM booking WHERE booking_id = ?",
    [bookingId]
  );
  const old = oldRows[0];

  // Ownership check (dokter & pawrent)
  if (user.role_id === 2) {
    if (!old || old.dokter_id !== user.dokter_id) {
      return res.status(403).json({ message: "Akses ditolak" });
    }
  }
  if (user.role_id === 3) {
    if (!old || old.pawrent_id !== user.pawrent_id || old.status !== "pending") {
      return res.status(403).json({ message: "Akses ditolak" });
    }
  }

  // TAMBAHKAN: Ownership check untuk admin_klinik (role 4)
  if (user.role_id === 4) {
    if (old.klinik_id !== user.klinik_id) {
      return res.status(403).json({ message: 'Akses ditolak: Booking tidak di klinik Anda' });
    }
  }

  try {
    await pool.execute(
      'CALL UpdateBooking(?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        bookingId,
        klinik_id ?? old.klinik_id,
        dokter_id ?? old.dokter_id,
        pawrent_id ?? old.pawrent_id,
        hewan_id ?? old.hewan_id,
        tanggal_booking ?? old.tanggal_booking,
        waktu_booking ?? old.waktu_booking,
        status ?? old.status,
        catatan ?? old.catatan
      ]
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
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

// Tambahkan endpoint untuk booking yang belum dipakai kunjungan

router.get('/available-for-kunjungan', authenticate, async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  try {
    const [rows]: any = await pool.execute('CALL GetAvailableBookingsForKunjungan()');
    res.json(rows[0] || []);
  } catch (error: any) {
    console.error('❌ [GET AVAILABLE BOOKINGS FOR KUNJUNGAN] Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error?.message });
  }
});

// GET ALL BOOKINGS FOR ADMIN KLINIK (filtered by klinik_id)
router.get('/admin-klinik', authenticate, async (req: AuthRequest, res) => {
  console.log('📋 [GET ALL BOOKINGS ADMIN KLINIK] Request received');
  const pool = req.dbPool;
  const klinikId = req.user.klinik_id;
  
  if (!klinikId) {
    console.log('❌ [GET ALL BOOKINGS ADMIN KLINIK] Klinik ID not found in token');
    return res.status(403).json({ message: 'Akses ditolak: Klinik tidak ditemukan' });
  }
  
  try {
    console.log(`🔄 [GET ALL BOOKINGS ADMIN KLINIK] Using DB pool for role_id: ${req.user.role_id}, klinik_id: ${klinikId}`);
    const [rows]: any = await pool.execute('CALL GetBookingsByKlinik(?)', [klinikId]);
    console.log(`✅ [GET ALL BOOKINGS ADMIN KLINIK] Success - ${rows[0]?.length || 0} records found`);
    res.json(rows[0] || []);
  } catch (error: any) {
    console.error('❌ [GET ALL BOOKINGS ADMIN KLINIK] Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

export default router;