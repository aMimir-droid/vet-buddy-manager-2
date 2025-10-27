DELIMITER $$

-- ========================================================
-- STORED PROCEDURES BOOKING (CRUD) - UPDATED FOR NEW SCHEMA
-- - Includes klinik_id in Booking table
-- - Unique constraint: uq_booking (klinik_id, dokter_id, tanggal_booking, waktu_booking)
-- - Return row yang dibuat / diupdate with nama_klinik
-- ========================================================

-- CREATE BOOKING - UPDATED: Ganti nama_pengunjung dengan hewan_id
DROP PROCEDURE IF EXISTS CreateBooking$$
CREATE PROCEDURE CreateBooking(
    IN p_klinik_id INT,
    IN p_dokter_id INT,
    IN p_pawrent_id INT,
    IN p_hewan_id INT,  -- GANTI: Dari p_nama_pengunjung ke p_hewan_id
    IN p_tanggal_booking DATE,
    IN p_waktu_booking TIME,
    IN p_status VARCHAR(20),
    IN p_catatan TEXT
)
BEGIN
    DECLARE v_exists INT DEFAULT 0;
    DECLARE v_shift_exists INT DEFAULT 0;
    DECLARE v_conflict INT DEFAULT 0;
    DECLARE v_pawrent_conflict INT DEFAULT 0;
    DECLARE v_dokter_klinik_id INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Validasi dasar
    IF p_klinik_id IS NULL OR p_dokter_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Parameter klinik_id dan dokter_id wajib diisi';
    END IF;

    IF p_tanggal_booking IS NULL OR p_waktu_booking IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Tanggal dan waktu booking wajib diisi';
    END IF;

    -- Pastikan dokter ada, aktif, dan klinik_id cocok dengan yang diberikan
    SELECT klinik_id INTO v_dokter_klinik_id
    FROM Dokter
    WHERE dokter_id = p_dokter_id
      AND (is_active = 1 OR is_active = TRUE);

    IF v_dokter_klinik_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Dokter tidak ditemukan atau tidak aktif';
    END IF;

    IF v_dokter_klinik_id != p_klinik_id THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Klinik dokter tidak cocok dengan klinik yang dipilih';
    END IF;

    -- Pastikan ada shift aktif yang menutupi hari+jam booking
    SELECT COUNT(*) INTO v_shift_exists
    FROM Shift_Dokter
    WHERE dokter_id = p_dokter_id
      AND (is_active = 1 OR is_active = TRUE)
      AND jam_mulai <= p_waktu_booking
      AND jam_selesai >= p_waktu_booking
      AND hari_minggu = (WEEKDAY(p_tanggal_booking) + 1);

    IF v_shift_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Dokter tidak memiliki shift aktif pada tanggal/jam tersebut';
    END IF;

    -- Cek konflik booking dengan aturan jarak minimal 30 menit (1800 detik), per klinik+dokter
    SELECT COUNT(*) INTO v_conflict
    FROM Booking
    WHERE klinik_id = p_klinik_id
      AND dokter_id = p_dokter_id
      AND tanggal_booking = p_tanggal_booking
      AND ABS(TIME_TO_SEC(TIMEDIFF(waktu_booking, p_waktu_booking))) < 1800
      AND (status IS NULL OR LOWER(status) != 'cancelled');

    IF v_conflict > 0 THEN
        SIGNAL SQLSTATE '23000' SET MESSAGE_TEXT = 'Waktu booking bentrok (jarak minimal 30 menit dengan booking lain untuk dokter di klinik ini)';
    END IF;

    -- Cek pawrent tidak melakukan double-booking pada dokter yang sama dalam rentang 30 menit
    IF p_pawrent_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_pawrent_conflict
        FROM Booking
        WHERE klinik_id = p_klinik_id
          AND pawrent_id = p_pawrent_id
          AND dokter_id = p_dokter_id
          AND tanggal_booking = p_tanggal_booking
          AND ABS(TIME_TO_SEC(TIMEDIFF(waktu_booking, p_waktu_booking))) < 1800
          AND (status IS NULL OR LOWER(status) != 'cancelled');

        IF v_pawrent_conflict > 0 THEN
            SIGNAL SQLSTATE '23000' SET MESSAGE_TEXT = 'Anda sudah memiliki booking berdekatan dengan dokter ini di klinik ini';
        END IF;
    END IF;

    -- Semua validasi ok -> insert booking
    INSERT INTO Booking (
        klinik_id,
        dokter_id,
        pawrent_id,
        hewan_id,  -- GANTI
        tanggal_booking,
        waktu_booking,
        status,
        catatan
    ) VALUES (
        p_klinik_id,
        p_dokter_id,
        p_pawrent_id,
        p_hewan_id,  -- GANTI
        p_tanggal_booking,
        p_waktu_booking,
        COALESCE(p_status, 'pending'),
        p_catatan
    );

    -- Kembalikan row yang dibuat
    SELECT
        b.booking_id,
        b.klinik_id,
        k.nama_klinik,
        b.dokter_id,
        d.nama_dokter,
        b.pawrent_id,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) AS nama_pawrent,
        b.hewan_id,  -- GANTI
        h.nama_hewan,  -- TAMBAHKAN: Nama hewan
        b.tanggal_booking,
        b.waktu_booking,
        b.status,
        b.catatan
    FROM Booking b
    LEFT JOIN Klinik k ON b.klinik_id = k.klinik_id
    LEFT JOIN Dokter d ON b.dokter_id = d.dokter_id
    LEFT JOIN Pawrent p ON b.pawrent_id = p.pawrent_id
    LEFT JOIN Hewan h ON b.hewan_id = h.hewan_id  -- TAMBAHKAN: Join Hewan
    WHERE b.booking_id = LAST_INSERT_ID();

    COMMIT;
END$$

-- UPDATE BOOKING - UPDATED: Ganti nama_pengunjung dengan hewan_id
DROP PROCEDURE IF EXISTS UpdateBooking$$
CREATE PROCEDURE UpdateBooking(
    IN p_booking_id INT,
    IN p_klinik_id INT,
    IN p_dokter_id INT,
    IN p_pawrent_id INT,
    IN p_hewan_id INT,  -- GANTI
    IN p_tanggal_booking DATE,
    IN p_waktu_booking TIME,
    IN p_status VARCHAR(20),
    IN p_catatan TEXT
)
BEGIN
    DECLARE v_exists INT DEFAULT 0;
    DECLARE v_curr_klinik INT;
    DECLARE v_curr_dokter INT;
    DECLARE v_curr_tanggal DATE;
    DECLARE v_curr_waktu TIME;
    DECLARE v_new_klinik INT;
    DECLARE v_new_dokter INT;
    DECLARE v_new_tanggal DATE;
    DECLARE v_new_waktu TIME;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    IF p_booking_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Parameter booking_id wajib diisi';
    END IF;

    SELECT COUNT(*) INTO v_exists FROM Booking WHERE booking_id = p_booking_id;
    IF v_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Booking tidak ditemukan';
    END IF;

    -- Ambil nilai saat ini untuk pengecekan unik apabila ada perubahan
    SELECT klinik_id, dokter_id, tanggal_booking, waktu_booking
    INTO v_curr_klinik, v_curr_dokter, v_curr_tanggal, v_curr_waktu
    FROM Booking WHERE booking_id = p_booking_id LIMIT 1;

    SET v_new_klinik = COALESCE(p_klinik_id, v_curr_klinik);
    SET v_new_dokter = COALESCE(p_dokter_id, v_curr_dokter);
    SET v_new_tanggal = COALESCE(p_tanggal_booking, v_curr_tanggal);
    SET v_new_waktu = COALESCE(p_waktu_booking, v_curr_waktu);

    -- Jika kombinasi klinik+dokter+tanggal+waktu berubah, cek konflik
    IF NOT (v_new_klinik <=> v_curr_klinik) OR NOT (v_new_dokter <=> v_curr_dokter) OR NOT (v_new_tanggal <=> v_curr_tanggal) OR NOT (v_new_waktu <=> v_curr_waktu) THEN
        SELECT COUNT(*) INTO v_exists
        FROM Booking
        WHERE klinik_id = v_new_klinik
          AND dokter_id = v_new_dokter
          AND tanggal_booking = v_new_tanggal
          AND waktu_booking = v_new_waktu
          AND booking_id <> p_booking_id;

        IF v_exists > 0 THEN
            SIGNAL SQLSTATE '23000' SET MESSAGE_TEXT = 'Waktu booking untuk dokter di klinik ini sudah terpakai';
        END IF;
    END IF;

    -- Jika dokter diberikan, validasi klinik_id cocok
    IF p_dokter_id IS NOT NULL THEN
        SELECT klinik_id INTO v_exists FROM Dokter WHERE dokter_id = p_dokter_id;
        IF v_exists != COALESCE(p_klinik_id, v_curr_klinik) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Klinik dokter tidak cocok';
        END IF;
    END IF;

    IF p_pawrent_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM Pawrent WHERE pawrent_id = p_pawrent_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Pawrent tidak ditemukan';
    END IF;

    UPDATE Booking
    SET
        klinik_id = COALESCE(p_klinik_id, klinik_id),
        dokter_id = COALESCE(p_dokter_id, dokter_id),
        pawrent_id = COALESCE(p_pawrent_id, pawrent_id),
        hewan_id = COALESCE(p_hewan_id, hewan_id),  -- TAMBAHKAN: Update hewan_id
        tanggal_booking = COALESCE(p_tanggal_booking, tanggal_booking),
        waktu_booking = COALESCE(p_waktu_booking, waktu_booking),
        status = COALESCE(p_status, status),
        catatan = COALESCE(p_catatan, catatan)
    WHERE booking_id = p_booking_id;

    -- Kembalikan data yang diupdate
    SELECT
        b.booking_id,
        b.klinik_id,
        k.nama_klinik,
        b.dokter_id,
        d.nama_dokter,
        b.pawrent_id,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) AS nama_pawrent,
        b.hewan_id,  -- GANTI
        h.nama_hewan,  -- TAMBAHKAN
        b.tanggal_booking,
        b.waktu_booking,
        b.status,
        b.catatan
    FROM Booking b
    LEFT JOIN Klinik k ON b.klinik_id = k.klinik_id
    LEFT JOIN Dokter d ON b.dokter_id = d.dokter_id
    LEFT JOIN Pawrent p ON b.pawrent_id = p.pawrent_id
    LEFT JOIN Hewan h ON b.hewan_id = h.hewan_id  -- TAMBAHKAN
    WHERE b.booking_id = p_booking_id;

    COMMIT;
END$$

-- GET BOOKING BY ID - UPDATED
DROP PROCEDURE IF EXISTS GetBookingById$$
CREATE PROCEDURE GetBookingById(
    IN p_booking_id INT
)
BEGIN
    IF p_booking_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Parameter booking_id wajib diisi';
    END IF;

    SELECT
        b.booking_id,
        b.klinik_id,
        k.nama_klinik,
        b.dokter_id,
        d.nama_dokter,
        b.pawrent_id,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) AS nama_pawrent,
        b.hewan_id,  -- GANTI
        h.nama_hewan,  -- TAMBAHKAN
        b.tanggal_booking,
        b.waktu_booking,
        b.status,
        b.catatan
    FROM Booking b
    LEFT JOIN Klinik k ON b.klinik_id = k.klinik_id
    LEFT JOIN Dokter d ON b.dokter_id = d.dokter_id
    LEFT JOIN Pawrent p ON b.pawrent_id = p.pawrent_id
    LEFT JOIN Hewan h ON b.hewan_id = h.hewan_id  -- TAMBAHKAN
    WHERE b.booking_id = p_booking_id;
END$$

-- GET BOOKINGS BY DOKTER - UPDATED
DROP PROCEDURE IF EXISTS GetBookingsByDokter$$
CREATE PROCEDURE GetBookingsByDokter(
    IN p_dokter_id INT
)
BEGIN
    IF p_dokter_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Parameter dokter_id wajib diisi';
    END IF;

    SELECT
        b.booking_id,
        b.klinik_id,
        k.nama_klinik,
        b.dokter_id,
        d.nama_dokter,
        b.pawrent_id,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) AS nama_pawrent,
        b.hewan_id,  -- GANTI
        h.nama_hewan,  -- TAMBAHKAN
        b.tanggal_booking,
        b.waktu_booking,
        b.status,
        b.catatan
    FROM Booking b
    LEFT JOIN Klinik k ON b.klinik_id = k.klinik_id
    LEFT JOIN Dokter d ON b.dokter_id = d.dokter_id
    LEFT JOIN Pawrent p ON b.pawrent_id = p.pawrent_id
    LEFT JOIN Hewan h ON b.hewan_id = h.hewan_id  -- TAMBAHKAN
    WHERE b.dokter_id = p_dokter_id
    ORDER BY b.tanggal_booking, b.waktu_booking;
END$$

-- GET ALL BOOKINGS - UPDATED
DROP PROCEDURE IF EXISTS GetAllBookings$$
CREATE PROCEDURE GetAllBookings()
BEGIN
    SELECT
        b.booking_id,
        b.klinik_id,
        k.nama_klinik,
        b.dokter_id,
        d.nama_dokter,
        b.pawrent_id,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) AS nama_pawrent,
        b.hewan_id,  -- GANTI
        h.nama_hewan,  -- TAMBAHKAN
        b.tanggal_booking,
        b.waktu_booking,
        b.status,
        b.catatan
    FROM Booking b
    LEFT JOIN Klinik k ON b.klinik_id = k.klinik_id
    LEFT JOIN Dokter d ON b.dokter_id = d.dokter_id
    LEFT JOIN Pawrent p ON b.pawrent_id = p.pawrent_id
    LEFT JOIN Hewan h ON b.hewan_id = h.hewan_id  -- TAMBAHKAN
    ORDER BY b.tanggal_booking DESC, b.waktu_booking DESC;
END$$

-- TAMBAHKAN: Stored Procedure untuk GetBookingsByPawrent
DROP PROCEDURE IF EXISTS GetBookingsByPawrent$$
CREATE PROCEDURE GetBookingsByPawrent(
    IN p_pawrent_id INT
)
BEGIN
    IF p_pawrent_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Pawrent ID tidak boleh null';
    END IF;

    SELECT
        b.booking_id,
        b.klinik_id,
        b.dokter_id,
        b.pawrent_id,
        b.hewan_id,
        b.tanggal_booking,
        b.waktu_booking,
        b.status,
        b.catatan,
        d.nama_dokter,
        k.nama_klinik,
        h.nama_hewan
    FROM booking b
    LEFT JOIN dokter d ON b.dokter_id = d.dokter_id
    LEFT JOIN klinik k ON b.klinik_id = k.klinik_id
    LEFT JOIN hewan h ON b.hewan_id = h.hewan_id
    WHERE b.pawrent_id = p_pawrent_id
    ORDER BY b.tanggal_booking DESC, b.waktu_booking DESC;
END$$

DELIMITER ;