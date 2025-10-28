DELIMITER $$

-- ========================================================
-- KUNJUNGAN CRUD (menggunakan soft-delete; Get hanya menampilkan yang aktif)
-- ========================================================

DROP PROCEDURE IF EXISTS CreateKunjungan$$
CREATE PROCEDURE CreateKunjungan (
    IN p_klinik_id INT, -- TAMBAHKAN
    IN p_hewan_id INT,
    IN p_dokter_id INT,
    IN p_tanggal_kunjungan DATE,
    IN p_waktu_kunjungan TIME,
    IN p_catatan TEXT,
    IN p_metode_pembayaran VARCHAR(20),
    IN p_kunjungan_sebelumnya INT,
    IN p_booking_id INT
)
BEGIN
    DECLARE new_id INT;

    -- Cegah duplikat natural key yang masih aktif
    IF EXISTS(
        SELECT 1 FROM Kunjungan
        WHERE klinik_id = p_klinik_id -- TAMBAHKAN
          AND hewan_id = p_hewan_id
          AND dokter_id = p_dokter_id
          AND tanggal_kunjungan = p_tanggal_kunjungan
          AND waktu_kunjungan = p_waktu_kunjungan
          AND deleted_at IS NULL
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Kunjungan untuk kombinasi klinik/hewan/dokter/tanggal/waktu sudah ada';
    END IF;

    INSERT INTO Kunjungan (
        klinik_id, -- TAMBAHKAN
        hewan_id,
        dokter_id,
        tanggal_kunjungan,
        waktu_kunjungan,
        catatan,
        metode_pembayaran,
        kunjungan_sebelumnya,
        booking_id,
        deleted_at
    )
    VALUES (
        p_klinik_id, -- TAMBAHKAN
        p_hewan_id,
        p_dokter_id,
        p_tanggal_kunjungan,
        p_waktu_kunjungan,
        p_catatan,
        p_metode_pembayaran,
        p_kunjungan_sebelumnya,
        p_booking_id,
        NULL
    );

    SET new_id = LAST_INSERT_ID();

    -- BARU: Update status booking menjadi 'done' jika booking_id disediakan
    IF p_booking_id IS NOT NULL THEN
        UPDATE Booking 
        SET status = 'done' 
        WHERE booking_id = p_booking_id 
          AND status != 'canceled';  -- Hindari update jika sudah canceled
    END IF;

    -- Kembalikan data kunjungan
    SELECT * FROM Kunjungan WHERE kunjungan_id = new_id;
END$$


DROP PROCEDURE IF EXISTS UpdateKunjungan$$
CREATE PROCEDURE UpdateKunjungan (
    IN p_kunjungan_id INT,
    IN p_klinik_id INT,                -- ditambahkan
    IN p_hewan_id INT,
    IN p_dokter_id INT,
    IN p_tanggal_kunjungan DATE,
    IN p_waktu_kunjungan TIME,
    IN p_catatan TEXT,
    IN p_metode_pembayaran VARCHAR(20),
    IN p_kunjungan_sebelumnya INT,
    IN p_booking_id INT                -- ditambahkan (boleh NULL)
)
BEGIN
    DECLARE exists_active INT DEFAULT 0;

    -- Pastikan record ada dan belum di-soft-delete
    SELECT COUNT(*) INTO exists_active
    FROM Kunjungan
    WHERE kunjungan_id = p_kunjungan_id
      AND deleted_at IS NULL;

    IF exists_active = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Kunjungan tidak ditemukan atau sudah dihapus';
    END IF;

    -- Cek konflik natural key (untuk update) terhadap baris aktif lain
    IF EXISTS(
        SELECT 1 FROM Kunjungan
        WHERE klinik_id = p_klinik_id
          AND hewan_id = p_hewan_id
          AND dokter_id = p_dokter_id
          AND tanggal_kunjungan = p_tanggal_kunjungan
          AND waktu_kunjungan = p_waktu_kunjungan
          AND deleted_at IS NULL
          AND kunjungan_id <> p_kunjungan_id
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Konflik: kombinasi klinik/hewan/dokter/tanggal/waktu sudah dipakai oleh kunjungan lain';
    END IF;

    UPDATE Kunjungan
    SET 
        klinik_id = p_klinik_id,
        hewan_id = p_hewan_id,
        dokter_id = p_dokter_id,
        tanggal_kunjungan = p_tanggal_kunjungan,
        waktu_kunjungan = p_waktu_kunjungan,
        catatan = p_catatan,
        metode_pembayaran = p_metode_pembayaran,
        kunjungan_sebelumnya = p_kunjungan_sebelumnya,
        booking_id = p_booking_id
    WHERE kunjungan_id = p_kunjungan_id
      AND deleted_at IS NULL;

    SELECT 
        k.kunjungan_id,
        k.klinik_id,
        k.hewan_id,
        k.dokter_id,
        k.tanggal_kunjungan,
        k.waktu_kunjungan,
        k.catatan,
        k.metode_pembayaran,
        k.kunjungan_sebelumnya,
        k.booking_id,
        k.deleted_at,
        (k.deleted_at IS NOT NULL) AS is_deleted,
        h.nama_hewan,
        CONCAT(d.title_dokter, ' ', d.nama_dokter) AS nama_dokter,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) AS nama_pawrent
    FROM Kunjungan k
    LEFT JOIN Hewan h ON k.hewan_id = h.hewan_id
    LEFT JOIN Dokter d ON k.dokter_id = d.dokter_id
    LEFT JOIN Pawrent p ON h.pawrent_id = p.pawrent_id
    WHERE k.kunjungan_id = p_kunjungan_id;
END$$


-- ========================================================
-- GET ALL KUNJUNGAN (hanya yang aktif / not soft-deleted)
-- ========================================================
DROP PROCEDURE IF EXISTS GetAllKunjungan$$
CREATE PROCEDURE GetAllKunjungan()
BEGIN
SELECT 
    k.kunjungan_id,
    k.klinik_id,
    k.hewan_id,
    k.dokter_id,
    k.tanggal_kunjungan,
    k.waktu_kunjungan,
    k.catatan,
    k.metode_pembayaran,
    k.kunjungan_sebelumnya,
    k.booking_id,
    k.deleted_at,
    (k.deleted_at IS NOT NULL) AS is_deleted,
    h.nama_hewan,
    CONCAT(d.title_dokter, ' ', d.nama_dokter) AS nama_dokter,
    CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) AS nama_pawrent,
    -- Perbaiki subquery: Hapus kondisi deleted_at untuk obat karena tidak ada kolom tersebut
    (SELECT COALESCE(SUM(l.biaya_saat_itu * l.qty), 0) 
     FROM Layanan l 
     INNER JOIN Detail_Layanan dl ON l.kode_layanan = dl.kode_layanan 
     WHERE l.kunjungan_id = k.kunjungan_id AND dl.deleted_at IS NULL) + 
    (SELECT COALESCE(SUM(ko.harga_saat_itu * ko.qty), 0) 
     FROM Kunjungan_Obat ko 
     WHERE ko.kunjungan_id = k.kunjungan_id) AS total_biaya
FROM Kunjungan k
LEFT JOIN Hewan h ON k.hewan_id = h.hewan_id
LEFT JOIN Dokter d ON k.dokter_id = d.dokter_id
LEFT JOIN Pawrent p ON h.pawrent_id = p.pawrent_id
WHERE k.deleted_at IS NULL
ORDER BY k.tanggal_kunjungan DESC, k.waktu_kunjungan DESC;
END$$

-- ========================================================
-- GET KUNJUNGAN BY ID (hanya jika aktif)
-- ========================================================
DROP PROCEDURE IF EXISTS GetKunjunganById$$
CREATE PROCEDURE GetKunjunganById(IN p_kunjungan_id INT)
BEGIN
SELECT 
    k.kunjungan_id,
    k.klinik_id,  -- Tambahkan ini
    k.hewan_id,
    k.dokter_id,
    k.tanggal_kunjungan,
    k.waktu_kunjungan,
    k.catatan,
    k.metode_pembayaran,
    k.kunjungan_sebelumnya,
    k.booking_id,
    k.deleted_at,
    (k.deleted_at IS NOT NULL) AS is_deleted,
    h.nama_hewan,
    CONCAT(d.title_dokter, ' ', d.nama_dokter) AS nama_dokter,
    CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) AS nama_pawrent
FROM Kunjungan k
LEFT JOIN Hewan h ON k.hewan_id = h.hewan_id
LEFT JOIN Dokter d ON k.dokter_id = d.dokter_id
LEFT JOIN Pawrent p ON h.pawrent_id = p.pawrent_id
WHERE k.kunjungan_id = p_kunjungan_id;
END$$


-- ========================================================
-- GET HEWAN HISTORY (hanya kunjungan aktif)
-- ========================================================
DROP PROCEDURE IF EXISTS GetHewanKunjunganHistory$$
CREATE PROCEDURE GetHewanKunjunganHistory(IN p_hewan_id INT)
BEGIN
    SELECT 
        k.kunjungan_id,
        k.tanggal_kunjungan,
        k.waktu_kunjungan,
        k.catatan,
        k.metode_pembayaran,
        k.kunjungan_sebelumnya,
        k.deleted_at,
        (k.deleted_at IS NOT NULL) AS is_deleted,
        CONCAT(d.title_dokter, ' ', d.nama_dokter) AS nama_dokter
    FROM Kunjungan k
    LEFT JOIN Dokter d ON k.dokter_id = d.dokter_id
    WHERE k.hewan_id = p_hewan_id
      AND k.deleted_at IS NULL
    ORDER BY k.tanggal_kunjungan DESC, k.waktu_kunjungan DESC
    LIMIT 10;
END$$


-- ========================================================
-- DELETE KUNJUNGAN (soft delete)
-- ========================================================
DROP PROCEDURE IF EXISTS DeleteKunjungan$$
CREATE PROCEDURE DeleteKunjungan(IN p_kunjungan_id INT)
BEGIN
    DECLARE exists_active INT DEFAULT 0;
    DECLARE rows_affected INT DEFAULT 0;

    SELECT COUNT(*) INTO exists_active
    FROM Kunjungan
    WHERE kunjungan_id = p_kunjungan_id
      AND deleted_at IS NULL;

    IF exists_active = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Kunjungan tidak ditemukan atau sudah dihapus';
    END IF;

    UPDATE Kunjungan
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE kunjungan_id = p_kunjungan_id
      AND deleted_at IS NULL;

    SET rows_affected = ROW_COUNT();

    SELECT rows_affected AS affected_rows;
END$$

-- BARU: Event untuk otomatis cancel booking yang lewat tanggal
DROP EVENT IF EXISTS AutoCancelExpiredBookings$$
CREATE EVENT AutoCancelExpiredBookings
ON SCHEDULE EVERY 1 DAY STARTS '2023-10-24 00:00:00'  -- Ganti tanggal mulai sesuai kebutuhan
DO
BEGIN
    UPDATE Booking 
    SET status = 'canceled' 
    WHERE tanggal_booking < CURDATE() 
      AND status IN ('pending', 'booked');  -- Hanya update yang belum selesai
END$$

-- ========================================================
-- BOOKING CRUD (menggunakan soft-delete; Get hanya menampilkan yang aktif)
-- ========================================================

DROP PROCEDURE IF EXISTS CreateBooking$$
CREATE PROCEDURE CreateBooking (
    IN p_klinik_id INT,
    IN p_dokter_id INT,
    IN p_pawrent_id INT,
    IN p_hewan_id INT,
    IN p_tanggal_booking DATE,
    IN p_waktu_booking TIME,
    IN p_status VARCHAR(20),
    IN p_catatan TEXT
)
BEGIN
    DECLARE new_id INT;

    -- Cegah duplikat booking yang masih aktif (HAPUS: deleted_at IS NULL jika tidak ada kolom)
    IF EXISTS(
        SELECT 1 FROM Booking
        WHERE klinik_id = p_klinik_id
          AND dokter_id = p_dokter_id
          AND pawrent_id = p_pawrent_id
          AND hewan_id = p_hewan_id
          AND tanggal_booking = p_tanggal_booking
          AND waktu_booking = p_waktu_booking
          -- AND deleted_at IS NULL  -- HAPUS jika tidak ada kolom
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Booking untuk kombinasi klinik/dokter/pawrent/hewan/tanggal/waktu sudah ada';
    END IF;

    INSERT INTO Booking (
        klinik_id,
        dokter_id,
        pawrent_id,
        hewan_id,
        tanggal_booking,
        waktu_booking,
        status,
        catatan
        -- deleted_at  -- HAPUS jika tidak ada kolom
    )
    VALUES (
        p_klinik_id,
        p_dokter_id,
        p_pawrent_id,
        p_hewan_id,
        p_tanggal_booking,
        p_waktu_booking,
        p_status,
        p_catatan
        -- NULL  -- HAPUS jika tidak ada kolom
    );

    SET new_id = LAST_INSERT_ID();

    -- Kembalikan data booking
    SELECT * FROM Booking WHERE booking_id = new_id;
END$$


DROP PROCEDURE IF EXISTS UpdateBooking$$
CREATE PROCEDURE UpdateBooking (
    IN p_booking_id INT,
    IN p_klinik_id INT,
    IN p_dokter_id INT,
    IN p_pawrent_id INT,
    IN p_hewan_id INT,
    IN p_tanggal_booking DATE,
    IN p_waktu_booking TIME,
    IN p_status VARCHAR(20),
    IN p_catatan TEXT
)
BEGIN
    DECLARE exists_active INT DEFAULT 0;

    -- Pastikan record ada (removed deleted_at check since column doesn't exist)
    SELECT COUNT(*) INTO exists_active
    FROM Booking
    WHERE booking_id = p_booking_id;

    IF exists_active = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Booking tidak ditemukan';
    END IF;

    -- Cek konflik booking (untuk update) terhadap baris lain (removed deleted_at filter)
    IF EXISTS(
        SELECT 1 FROM Booking
        WHERE klinik_id = p_klinik_id
          AND dokter_id = p_dokter_id
          AND pawrent_id = p_pawrent_id
          AND hewan_id = p_hewan_id
          AND tanggal_booking = p_tanggal_booking
          AND waktu_booking = p_waktu_booking
          AND booking_id <> p_booking_id
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Konflik: kombinasi klinik/dokter/pawrent/hewan/tanggal/waktu sudah dipakai oleh booking lain';
    END IF;

    UPDATE Booking
    SET 
        klinik_id = p_klinik_id,
        dokter_id = p_dokter_id,
        pawrent_id = p_pawrent_id,
        hewan_id = p_hewan_id,
        tanggal_booking = p_tanggal_booking,
        waktu_booking = p_waktu_booking,
        status = p_status,
        catatan = p_catatan
    WHERE booking_id = p_booking_id;

    -- Kembalikan data booking yang sudah diupdate
    SELECT * FROM Booking WHERE booking_id = p_booking_id;
END$$


-- ========================================================
-- GET ALL BOOKINGS (hanya yang aktif / not soft-deleted)
-- ========================================================
DROP PROCEDURE IF EXISTS GetAllBookings$$
CREATE PROCEDURE GetAllBookings()
BEGIN
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
        k.nama_klinik,
        CONCAT(d.title_dokter, ' ', d.nama_dokter) AS nama_dokter,
        p.nama_depan_pawrent,
        p.nama_belakang_pawrent,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) AS nama_pawrent,
        h.nama_hewan,
        jh.nama_jenis_hewan AS jenis_hewan  -- UBAH: Join dengan Jenis_Hewan untuk nama jenis
    FROM Booking b
    LEFT JOIN Klinik k ON b.klinik_id = k.klinik_id
    LEFT JOIN Dokter d ON b.dokter_id = d.dokter_id
    LEFT JOIN Pawrent p ON b.pawrent_id = p.pawrent_id
    LEFT JOIN Hewan h ON b.hewan_id = h.hewan_id
    LEFT JOIN Jenis_Hewan jh ON h.jenis_hewan_id = jh.jenis_hewan_id  -- TAMBAHKAN: Join untuk jenis hewan
    ORDER BY b.tanggal_booking DESC, b.waktu_booking DESC;
END$$


-- ========================================================
-- GET BOOKING BY ID (hanya jika aktif)
-- ========================================================
DROP PROCEDURE IF EXISTS GetBookingById$$
CREATE PROCEDURE GetBookingById(IN p_booking_id INT)
BEGIN
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
        k.nama_klinik,
        CONCAT(d.title_dokter, ' ', d.nama_dokter) AS nama_dokter,
        p.nama_depan_pawrent,
        p.nama_belakang_pawrent,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) AS nama_pawrent,
        h.nama_hewan,
        jh.nama_jenis_hewan AS jenis_hewan  -- UBAH: Join dengan Jenis_Hewan untuk nama jenis
    FROM Booking b
    LEFT JOIN Klinik k ON b.klinik_id = k.klinik_id
    LEFT JOIN Dokter d ON b.dokter_id = d.dokter_id
    LEFT JOIN Pawrent p ON b.pawrent_id = p.pawrent_id
    LEFT JOIN Hewan h ON b.hewan_id = h.hewan_id
    LEFT JOIN Jenis_Hewan jh ON h.jenis_hewan_id = jh.jenis_hewan_id  -- TAMBAHKAN: Join untuk jenis hewan
    WHERE b.booking_id = p_booking_id;
END$$


-- ========================================================
-- DELETE BOOKING (soft delete)
-- ========================================================
DROP PROCEDURE IF EXISTS DeleteBooking$$
CREATE PROCEDURE DeleteBooking(IN p_booking_id INT)
BEGIN
    DECLARE exists_active INT DEFAULT 0;
    DECLARE rows_affected INT DEFAULT 0;

    -- Pastikan record ada (removed deleted_at check)
    SELECT COUNT(*) INTO exists_active
    FROM Booking
    WHERE booking_id = p_booking_id;

    IF exists_active = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Booking tidak ditemukan';
    END IF;

    -- Hard delete the record (since no soft-delete column)
    DELETE FROM Booking WHERE booking_id = p_booking_id;

    SET rows_affected = ROW_COUNT();

    SELECT rows_affected AS affected_rows;
END$$

-- BARU: Procedure untuk available bookings (hanya pending/booked, tanggal >= hari ini)
DROP PROCEDURE IF EXISTS GetAvailableBookingsForKunjungan$$
CREATE PROCEDURE GetAvailableBookingsForKunjungan()
BEGIN
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
        k.nama_klinik,
        CONCAT(d.title_dokter, ' ', d.nama_dokter) AS nama_dokter,
        p.nama_depan_pawrent,
        p.nama_belakang_pawrent,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) AS nama_pawrent,
        h.nama_hewan,
        jh.nama_jenis_hewan AS jenis_hewan
    FROM Booking b
    LEFT JOIN Klinik k ON b.klinik_id = k.klinik_id
    LEFT JOIN Dokter d ON b.dokter_id = d.dokter_id
    LEFT JOIN Pawrent p ON b.pawrent_id = p.pawrent_id
    LEFT JOIN Hewan h ON b.hewan_id = h.hewan_id
    LEFT JOIN Jenis_Hewan jh ON h.jenis_hewan_id = jh.jenis_hewan_id
    WHERE b.status IN ('pending', 'booked')  -- Hanya pending dan booked
      AND b.tanggal_booking >= CURDATE()     -- Tidak lewat tanggal
    ORDER BY b.tanggal_booking DESC, b.waktu_booking DESC;
END$$

-- ========================================================
-- GET KUNJUNGAN BY KLINIK (untuk admin klinik)
-- ========================================================
DROP PROCEDURE IF EXISTS GetKunjunganByKlinik$$
CREATE PROCEDURE GetKunjunganByKlinik(IN p_klinik_id INT)
BEGIN
    -- Jika tidak ada data, return array kosong (bukan message)
    SELECT 
        k.kunjungan_id,
        k.klinik_id,
        k.hewan_id,
        k.dokter_id,
        k.tanggal_kunjungan,
        k.waktu_kunjungan,
        k.catatan,
        k.metode_pembayaran,
        k.kunjungan_sebelumnya,
        k.booking_id,
        h.nama_hewan,
        p.nama_depan_pawrent,
        p.nama_belakang_pawrent,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) AS nama_pawrent,
        d.nama_dokter,
        d.title_dokter,
        kl.nama_klinik,
        -- PERBAIKAN: Gunakan query seperti di GetAllKunjungan (tabel Layanan dan Detail_Layanan)
        (SELECT COALESCE(SUM(l.biaya_saat_itu * l.qty), 0) 
         FROM Layanan l 
         INNER JOIN Detail_Layanan dl ON l.kode_layanan = dl.kode_layanan 
         WHERE l.kunjungan_id = k.kunjungan_id AND dl.deleted_at IS NULL) + 
        (SELECT COALESCE(SUM(ko.qty * ko.harga_saat_itu), 0) 
         FROM Kunjungan_Obat ko 
         WHERE ko.kunjungan_id = k.kunjungan_id) AS total_biaya
    FROM Kunjungan k
    LEFT JOIN Hewan h ON k.hewan_id = h.hewan_id
    LEFT JOIN Pawrent p ON h.pawrent_id = p.pawrent_id
    LEFT JOIN Dokter d ON k.dokter_id = d.dokter_id
    LEFT JOIN Klinik kl ON k.klinik_id = kl.klinik_id
    WHERE k.klinik_id = p_klinik_id AND k.deleted_at IS NULL
    ORDER BY k.tanggal_kunjungan DESC, k.waktu_kunjungan DESC;
END$$
DELIMITER ;


