DELIMITER $$

-- ========================================================
-- LAYANAN MANAGEMENT STORED PROCEDURES (CRUD ONLY)
-- (Disesuaikan: memperhatikan Detail_Layanan.deleted_at, soft-delete,
--  dan menghitung penggunaan hanya dari kunjungan yang tidak deleted)
-- ========================================================

-- ========================================================
-- GET ALL LAYANAN (Detail_Layanan) - hanya yang tidak deleted
-- ========================================================
DROP PROCEDURE IF EXISTS GetAllLayanan$$
CREATE PROCEDURE GetAllLayanan()
BEGIN
    SELECT 
        dl.kode_layanan,
        dl.nama_layanan,
        dl.deskripsi_layanan,
        dl.biaya_layanan,
        COUNT(DISTINCT k.kunjungan_id) AS total_penggunaan
    FROM Detail_Layanan dl
    LEFT JOIN Layanan l ON dl.kode_layanan = l.kode_layanan
    LEFT JOIN Kunjungan k ON l.kunjungan_id = k.kunjungan_id AND k.deleted_at IS NULL
    WHERE dl.deleted_at IS NULL
    GROUP BY dl.kode_layanan
    ORDER BY dl.nama_layanan;
END$$

-- ========================================================
-- GET LAYANAN BY KODE - hanya yang tidak deleted
-- ========================================================
DROP PROCEDURE IF EXISTS GetLayananByKode$$
CREATE PROCEDURE GetLayananByKode(IN p_kode_layanan VARCHAR(20))
BEGIN
    SELECT 
        dl.kode_layanan,
        dl.nama_layanan,
        dl.deskripsi_layanan,
        dl.biaya_layanan,
        COUNT(DISTINCT k.kunjungan_id) AS total_penggunaan
    FROM Detail_Layanan dl
    LEFT JOIN Layanan l ON dl.kode_layanan = l.kode_layanan
    LEFT JOIN Kunjungan k ON l.kunjungan_id = k.kunjungan_id AND k.deleted_at IS NULL
    WHERE dl.kode_layanan = p_kode_layanan
      AND dl.deleted_at IS NULL
    GROUP BY dl.kode_layanan;
END$$

-- ========================================================
-- CREATE LAYANAN (Detail_Layanan)
-- - menolak jika kode sudah ada dan belum di-soft-delete
-- ========================================================
DROP PROCEDURE IF EXISTS CreateLayanan$$
CREATE PROCEDURE CreateLayanan(
    IN p_kode_layanan VARCHAR(20),
    IN p_nama_layanan VARCHAR(100),
    IN p_deskripsi_layanan VARCHAR(255),
    IN p_biaya_layanan DECIMAL(12,2)
)
BEGIN
    DECLARE duplicate_check INT;
    
    -- Check for duplicate kode_layanan among non-deleted rows
    SELECT COUNT(*) INTO duplicate_check
    FROM Detail_Layanan
    WHERE kode_layanan = p_kode_layanan
      AND deleted_at IS NULL;
    
    IF duplicate_check > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Kode layanan sudah terdaftar';
    END IF;
    
    -- Validate biaya_layanan tidak negatif
    IF p_biaya_layanan < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Biaya layanan tidak boleh negatif';
    END IF;
    
    -- Validate nama_layanan tidak kosong
    IF p_nama_layanan IS NULL OR TRIM(p_nama_layanan) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Nama layanan wajib diisi';
    END IF;
    
    -- Insert new layanan
    INSERT INTO Detail_Layanan (
        kode_layanan,
        nama_layanan,
        deskripsi_layanan,
        biaya_layanan,
        deleted_at
    )
    VALUES (
        p_kode_layanan,
        p_nama_layanan,
        p_deskripsi_layanan,
        p_biaya_layanan,
        NULL
    );
    
    -- Return the new layanan
    SELECT 
        kode_layanan,
        nama_layanan,
        deskripsi_layanan,
        biaya_layanan,
        0 AS total_penggunaan
    FROM Detail_Layanan
    WHERE kode_layanan = p_kode_layanan
      AND deleted_at IS NULL;
END$$

-- ========================================================
-- UPDATE LAYANAN (Detail_Layanan)
-- - hanya memperbarui layanan yang belum di-soft-delete
-- ========================================================
DROP PROCEDURE IF EXISTS UpdateLayanan$$
CREATE PROCEDURE UpdateLayanan(
    IN p_kode_layanan VARCHAR(20),
    IN p_nama_layanan VARCHAR(100),
    IN p_deskripsi_layanan VARCHAR(255),
    IN p_biaya_layanan DECIMAL(12,2)
)
BEGIN
    DECLARE layanan_exists INT;
    
    -- Check if layanan exists and is not deleted
    SELECT COUNT(*) INTO layanan_exists
    FROM Detail_Layanan
    WHERE kode_layanan = p_kode_layanan
      AND deleted_at IS NULL;
    
    IF layanan_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Layanan tidak ditemukan atau sudah dihapus';
    END IF;
    
    -- Validate biaya_layanan tidak negatif
    IF p_biaya_layanan < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Biaya layanan tidak boleh negatif';
    END IF;
    
    -- Validate nama_layanan tidak kosong
    IF p_nama_layanan IS NULL OR TRIM(p_nama_layanan) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Nama layanan wajib diisi';
    END IF;
    
    -- Update layanan (only non-deleted)
    UPDATE Detail_Layanan
    SET 
        nama_layanan = p_nama_layanan,
        deskripsi_layanan = p_deskripsi_layanan,
        biaya_layanan = p_biaya_layanan
    WHERE kode_layanan = p_kode_layanan
      AND deleted_at IS NULL;
    
    -- Return updated layanan with penggunaan (menghitung kunjungan yang tidak deleted)
    SELECT 
        dl.kode_layanan,
        dl.nama_layanan,
        dl.deskripsi_layanan,
        dl.biaya_layanan,
        COUNT(DISTINCT k.kunjungan_id) AS total_penggunaan
    FROM Detail_Layanan dl
    LEFT JOIN Layanan l ON dl.kode_layanan = l.kode_layanan
    LEFT JOIN Kunjungan k ON l.kunjungan_id = k.kunjungan_id AND k.deleted_at IS NULL
    WHERE dl.kode_layanan = p_kode_layanan
      AND dl.deleted_at IS NULL
    GROUP BY dl.kode_layanan;
END$$

-- ========================================================
-- DELETE LAYANAN (Detail_Layanan) - soft-delete
-- - tidak menghapus jika layanan sudah dipakai di kunjungan aktif
-- ========================================================
DROP PROCEDURE IF EXISTS DeleteLayanan$$
CREATE PROCEDURE DeleteLayanan(IN p_kode_layanan VARCHAR(20))
BEGIN
    DECLARE usage_count INT;
    DECLARE rows_affected INT;
    
    -- Check if layanan is being used in any Kunjungan that is not deleted
    SELECT COUNT(*) INTO usage_count
    FROM Layanan l
    JOIN Kunjungan k ON l.kunjungan_id = k.kunjungan_id
    WHERE l.kode_layanan = p_kode_layanan
      AND k.deleted_at IS NULL;
    
    IF usage_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Tidak dapat menghapus layanan yang sudah digunakan dalam kunjungan aktif';
    END IF;
    
    -- Soft-delete layanan (set deleted_at) only if not already deleted
    UPDATE Detail_Layanan
    SET deleted_at = NOW()
    WHERE kode_layanan = p_kode_layanan
      AND deleted_at IS NULL;
    
    SET rows_affected = ROW_COUNT();
    
    SELECT rows_affected AS affected_rows;
END$$

-- ========================================================
-- ADD LAYANAN TO KUNJUNGAN
-- ========================================================
DROP PROCEDURE IF EXISTS AddLayananToKunjungan$$
CREATE PROCEDURE AddLayananToKunjungan(
    IN p_kunjungan_id INT,
    IN p_kode_layanan VARCHAR(20)
)
BEGIN
    -- Validasi kunjungan dan layanan
    IF NOT EXISTS (SELECT 1 FROM Kunjungan WHERE kunjungan_id = p_kunjungan_id AND deleted_at IS NULL) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Kunjungan tidak ditemukan';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM Detail_Layanan WHERE kode_layanan = p_kode_layanan AND deleted_at IS NULL) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Layanan tidak ditemukan';
    END IF;

    -- Tambah layanan ke kunjungan
    INSERT INTO Layanan (kunjungan_id, kode_layanan)
    VALUES (p_kunjungan_id, p_kode_layanan);

    -- Kembalikan data layanan
    SELECT * FROM Layanan WHERE kunjungan_id = p_kunjungan_id AND kode_layanan = p_kode_layanan;
END$$

DELIMITER ;