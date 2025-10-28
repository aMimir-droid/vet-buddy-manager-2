DELIMITER $$

-- ========================================================
-- OBAT MANAGEMENT STORED PROCEDURES (CRUD WITH SOFT DELETE)
-- ========================================================

-- ========================================================
-- GET ALL OBAT (hanya yang aktif — hidden soft-deleted)
-- ========================================================
DROP PROCEDURE IF EXISTS GetAllObat$$
CREATE PROCEDURE GetAllObat()
BEGIN
    SELECT 
        o.obat_id,
        o.nama_obat,
        o.kegunaan,
        o.harga_obat,
        o.deleted_at,
        (o.deleted_at IS NOT NULL) AS is_deleted,
        COUNT(DISTINCT k.kunjungan_id) AS total_penggunaan
    FROM Obat o
    LEFT JOIN Kunjungan_Obat ko ON o.obat_id = ko.obat_id
    LEFT JOIN Kunjungan k ON ko.kunjungan_id = k.kunjungan_id AND k.deleted_at IS NULL
    WHERE o.deleted_at IS NULL
    GROUP BY o.obat_id
    ORDER BY o.nama_obat;
END$$

-- ========================================================
-- GET OBAT BY ID (hanya yang aktif — hidden soft-deleted)
-- ========================================================
DROP PROCEDURE IF EXISTS GetObatById$$
CREATE PROCEDURE GetObatById(IN p_obat_id INT)
BEGIN
    SELECT 
        o.obat_id,
        o.nama_obat,
        o.kegunaan,
        o.harga_obat,
        o.deleted_at,
        (o.deleted_at IS NOT NULL) AS is_deleted,
        COUNT(DISTINCT k.kunjungan_id) AS total_penggunaan
    FROM Obat o
    LEFT JOIN Kunjungan_Obat ko ON o.obat_id = ko.obat_id
    LEFT JOIN Kunjungan k ON ko.kunjungan_id = k.kunjungan_id AND k.deleted_at IS NULL
    WHERE o.obat_id = p_obat_id
      AND o.deleted_at IS NULL
    GROUP BY o.obat_id;
END$$

-- ========================================================
-- CREATE OBAT
-- - Tidak mengizinkan buat bila nama sudah ada aktif
-- - Tidak mengizinkan buat bila ada entri soft-deleted dengan nama sama (minta restore)
-- ========================================================
DROP PROCEDURE IF EXISTS CreateObat$$
CREATE PROCEDURE CreateObat(
    IN p_nama_obat VARCHAR(100),
    IN p_kegunaan VARCHAR(255),
    IN p_harga_obat DECIMAL(12,2)
)
BEGIN
    DECLARE new_obat_id INT;

    -- Validate harga_obat tidak negatif
    IF p_harga_obat < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Harga obat tidak boleh negatif';
    END IF;

    -- Validate nama_obat tidak kosong
    IF p_nama_obat IS NULL OR TRIM(p_nama_obat) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Nama obat wajib diisi';
    END IF;

    -- Insert new obat (allow same names, do not restore soft-deleted entries)
    INSERT INTO Obat (
        nama_obat,
        kegunaan,
        harga_obat,
        deleted_at
    )
    VALUES (
        p_nama_obat,
        p_kegunaan,
        p_harga_obat,
        NULL
    );

    SET new_obat_id = LAST_INSERT_ID();

    -- Return the new obat
    SELECT 
        o.obat_id,
        o.nama_obat,
        o.kegunaan,
        o.harga_obat,
        o.deleted_at,
        (o.deleted_at IS NOT NULL) AS is_deleted,
        0 AS total_penggunaan
    FROM Obat o
    WHERE o.obat_id = new_obat_id;
END$$

-- ========================================================
-- UPDATE OBAT
-- - Tidak mengizinkan update pada record yang sudah soft-deleted
-- - Menghapus pengecekan konflik nama (mengizinkan nama yang sama)
-- ========================================================
DROP PROCEDURE IF EXISTS UpdateObat$$
CREATE PROCEDURE UpdateObat(
    IN p_obat_id INT,
    IN p_nama_obat VARCHAR(100),
    IN p_kegunaan VARCHAR(255),
    IN p_harga_obat DECIMAL(12,2)
)
BEGIN
    DECLARE obat_exists INT DEFAULT 0;

    -- Check if obat exists and not soft-deleted
    SELECT COUNT(*) INTO obat_exists
    FROM Obat
    WHERE obat_id = p_obat_id
      AND deleted_at IS NULL;

    IF obat_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Obat tidak ditemukan atau sudah dihapus (soft-deleted)';
    END IF;

    -- Validate harga_obat tidak negatif
    IF p_harga_obat < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Harga obat tidak boleh negatif';
    END IF;

    -- Validate nama_obat tidak kosong
    IF p_nama_obat IS NULL OR TRIM(p_nama_obat) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Nama obat wajib diisi';
    END IF;

    -- Update obat (no name conflict checks)
    UPDATE Obat
    SET 
        nama_obat = p_nama_obat,
        kegunaan = p_kegunaan,
        harga_obat = p_harga_obat
    WHERE obat_id = p_obat_id
      AND deleted_at IS NULL;

    -- Return updated obat
    SELECT 
        o.obat_id,
        o.nama_obat,
        o.kegunaan,
        o.harga_obat,
        o.deleted_at,
        (o.deleted_at IS NOT NULL) AS is_deleted,
        COUNT(DISTINCT k.kunjungan_id) AS total_penggunaan
    FROM Obat o
    LEFT JOIN Kunjungan_Obat ko ON o.obat_id = ko.obat_id
    LEFT JOIN Kunjungan k ON ko.kunjungan_id = k.kunjungan_id AND k.deleted_at IS NULL
    WHERE o.obat_id = p_obat_id
    GROUP BY o.obat_id;
END$$

-- ========================================================
-- DELETE OBAT (soft delete)
-- - Selalu melakukan soft-delete (menandai deleted_at)
-- - Tidak menghapus fisik; masih bisa dilihat dalam Get*
-- ========================================================
DROP PROCEDURE IF EXISTS DeleteObat$$
CREATE PROCEDURE DeleteObat(IN p_obat_id INT)
BEGIN
    DECLARE obat_exists INT DEFAULT 0;
    DECLARE rows_affected INT DEFAULT 0;

    -- Check if obat exists and not already deleted
    SELECT COUNT(*) INTO obat_exists
    FROM Obat
    WHERE obat_id = p_obat_id
      AND deleted_at IS NULL;

    IF obat_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Obat tidak ditemukan atau sudah dihapus';
    END IF;

    -- Soft delete obat (tetap dilakukan meskipun obat pernah dipakai)
    UPDATE Obat
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE obat_id = p_obat_id
      AND deleted_at IS NULL;

    SET rows_affected = ROW_COUNT();

    SELECT rows_affected AS affected_rows;
END$$

-- ========================================================
-- GET ALL OBAT WITH STOK BY KLINIK (untuk Admin Klinik - tampilkan semua obat, bahkan yang stok kosong)
-- ========================================================
DROP PROCEDURE IF EXISTS GetAllObatWithStokByKlinik$$
CREATE PROCEDURE GetAllObatWithStokByKlinik(IN p_klinik_id INT)
BEGIN
    SELECT 
        o.obat_id,
        o.nama_obat,
        o.kegunaan,
        o.harga_obat,
        COALESCE(so.jumlah_stok, 0) AS jumlah_stok,  -- Jika stok NULL, tampilkan 0
        so.stok_id,
        so.updated_at
    FROM Obat o
    LEFT JOIN Stok_Obat so ON o.obat_id = so.obat_id AND so.klinik_id = p_klinik_id
    WHERE o.deleted_at IS NULL
    ORDER BY o.nama_obat;
END$$

DELIMITER ;