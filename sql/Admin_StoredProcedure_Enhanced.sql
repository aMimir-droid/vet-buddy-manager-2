DELIMITER $$

-- ========================================================
-- KUNJUNGAN CRUD (menggunakan soft-delete; Get hanya menampilkan yang aktif)
-- ========================================================

DROP PROCEDURE IF EXISTS CreateKunjungan$$
CREATE PROCEDURE CreateKunjungan (
    IN p_hewan_id INT,
    IN p_dokter_id INT,
    IN p_tanggal_kunjungan DATE,
    IN p_waktu_kunjungan TIME,
    IN p_catatan TEXT,
    IN p_metode_pembayaran VARCHAR(20),
    IN p_kunjungan_sebelumnya INT
)
BEGIN
    DECLARE new_id INT;

    -- Cegah duplikat natural key yang masih aktif
    IF EXISTS(
        SELECT 1 FROM Kunjungan
        WHERE hewan_id = p_hewan_id
          AND dokter_id = p_dokter_id
          AND tanggal_kunjungan = p_tanggal_kunjungan
          AND waktu_kunjungan = p_waktu_kunjungan
          AND deleted_at IS NULL
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Kunjungan untuk kombinasi hewan/dokter/tanggal/waktu sudah ada';
    END IF;

    INSERT INTO Kunjungan (
        hewan_id,
        dokter_id,
        tanggal_kunjungan,
        waktu_kunjungan,
        catatan,
        metode_pembayaran,
        kunjungan_sebelumnya,
        deleted_at
    )
    VALUES (
        p_hewan_id,
        p_dokter_id,
        p_tanggal_kunjungan,
        p_waktu_kunjungan,
        p_catatan,
        p_metode_pembayaran,
        p_kunjungan_sebelumnya,
        NULL
    );

    SET new_id = LAST_INSERT_ID();

    SELECT 
        k.kunjungan_id,
        k.hewan_id,
        k.dokter_id,
        k.tanggal_kunjungan,
        k.waktu_kunjungan,
        k.catatan,
        k.metode_pembayaran,
        k.kunjungan_sebelumnya,
        k.deleted_at,
        (k.deleted_at IS NOT NULL) AS is_deleted,
        h.nama_hewan,
        CONCAT(d.title_dokter, ' ', d.nama_dokter) AS nama_dokter,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) AS nama_pawrent
    FROM Kunjungan k
    LEFT JOIN Hewan h ON k.hewan_id = h.hewan_id
    LEFT JOIN Dokter d ON k.dokter_id = d.dokter_id
    LEFT JOIN Pawrent p ON h.pawrent_id = p.pawrent_id
    WHERE k.kunjungan_id = new_id;
END$$


DROP PROCEDURE IF EXISTS UpdateKunjungan$$
CREATE PROCEDURE UpdateKunjungan (
    IN p_kunjungan_id INT,
    IN p_hewan_id INT,
    IN p_dokter_id INT,
    IN p_tanggal_kunjungan DATE,
    IN p_waktu_kunjungan TIME,
    IN p_catatan TEXT,
    IN p_metode_pembayaran VARCHAR(20),
    IN p_kunjungan_sebelumnya INT
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
        WHERE hewan_id = p_hewan_id
          AND dokter_id = p_dokter_id
          AND tanggal_kunjungan = p_tanggal_kunjungan
          AND waktu_kunjungan = p_waktu_kunjungan
          AND deleted_at IS NULL
          AND kunjungan_id <> p_kunjungan_id
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Konflik: kombinasi hewan/dokter/tanggal/waktu sudah dipakai oleh kunjungan lain';
    END IF;

    UPDATE Kunjungan
    SET 
        hewan_id = p_hewan_id,
        dokter_id = p_dokter_id,
        tanggal_kunjungan = p_tanggal_kunjungan,
        waktu_kunjungan = p_waktu_kunjungan,
        catatan = p_catatan,
        metode_pembayaran = p_metode_pembayaran,
        kunjungan_sebelumnya = p_kunjungan_sebelumnya
    WHERE kunjungan_id = p_kunjungan_id
      AND deleted_at IS NULL;

    SELECT 
        k.kunjungan_id,
        k.hewan_id,
        k.dokter_id,
        k.tanggal_kunjungan,
        k.waktu_kunjungan,
        k.catatan,
        k.metode_pembayaran,
        k.kunjungan_sebelumnya,
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
        k.hewan_id,
        k.dokter_id,
        k.tanggal_kunjungan,
        k.waktu_kunjungan,
        k.catatan,
        k.metode_pembayaran,
        k.kunjungan_sebelumnya,
        k.deleted_at,
        (k.deleted_at IS NOT NULL) AS is_deleted,
        h.nama_hewan,
        CONCAT(d.title_dokter, ' ', d.nama_dokter) AS nama_dokter,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) AS nama_pawrent
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
        k.hewan_id,
        k.dokter_id,
        k.tanggal_kunjungan,
        k.waktu_kunjungan,
        k.catatan,
        k.metode_pembayaran,
        k.kunjungan_sebelumnya,
        k.deleted_at,
        (k.deleted_at IS NOT NULL) AS is_deleted,
        h.nama_hewan,
        CONCAT(d.title_dokter, ' ', d.nama_dokter) AS nama_dokter,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) AS nama_pawrent
    FROM Kunjungan k
    LEFT JOIN Hewan h ON k.hewan_id = h.hewan_id
    LEFT JOIN Dokter d ON k.dokter_id = d.dokter_id
    LEFT JOIN Pawrent p ON h.pawrent_id = p.pawrent_id
    WHERE k.kunjungan_id = p_kunjungan_id
      AND k.deleted_at IS NULL;
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

DELIMITER ;