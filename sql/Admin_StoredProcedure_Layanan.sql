DELIMITER $$

-- ========================================================
-- LAYANAN MANAGEMENT STORED PROCEDURES (CRUD ONLY)
-- ========================================================

-- ========================================================
-- GET ALL LAYANAN (Detail_Layanan)
-- ========================================================
DROP PROCEDURE IF EXISTS GetAllLayanan$$
CREATE PROCEDURE GetAllLayanan()
BEGIN
    SELECT 
        dl.kode_layanan,
        dl.nama_layanan,
        dl.deskripsi_layanan,
        dl.biaya_layanan,
        COUNT(DISTINCT l.kunjungan_id) as total_penggunaan
    FROM Detail_Layanan dl
    LEFT JOIN Layanan l ON dl.kode_layanan = l.kode_layanan
    GROUP BY dl.kode_layanan
    ORDER BY dl.nama_layanan;
END$$

-- ========================================================
-- GET LAYANAN BY KODE
-- ========================================================
DROP PROCEDURE IF EXISTS GetLayananByKode$$
CREATE PROCEDURE GetLayananByKode(IN p_kode_layanan VARCHAR(20))
BEGIN
    SELECT 
        dl.kode_layanan,
        dl.nama_layanan,
        dl.deskripsi_layanan,
        dl.biaya_layanan,
        COUNT(DISTINCT l.kunjungan_id) as total_penggunaan
    FROM Detail_Layanan dl
    LEFT JOIN Layanan l ON dl.kode_layanan = l.kode_layanan
    WHERE dl.kode_layanan = p_kode_layanan
    GROUP BY dl.kode_layanan;
END$$

-- ========================================================
-- CREATE LAYANAN (Detail_Layanan)
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
    
    -- Check for duplicate kode_layanan
    SELECT COUNT(*) INTO duplicate_check
    FROM Detail_Layanan
    WHERE kode_layanan = p_kode_layanan;
    
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
        biaya_layanan
    )
    VALUES (
        p_kode_layanan,
        p_nama_layanan,
        p_deskripsi_layanan,
        p_biaya_layanan
    );
    
    -- Return the new layanan
    SELECT 
        kode_layanan,
        nama_layanan,
        deskripsi_layanan,
        biaya_layanan,
        0 as total_penggunaan
    FROM Detail_Layanan
    WHERE kode_layanan = p_kode_layanan;
END$$

-- ========================================================
-- UPDATE LAYANAN (Detail_Layanan)
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
    
    -- Check if layanan exists
    SELECT COUNT(*) INTO layanan_exists
    FROM Detail_Layanan
    WHERE kode_layanan = p_kode_layanan;
    
    IF layanan_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Layanan tidak ditemukan';
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
    
    -- Update layanan
    UPDATE Detail_Layanan
    SET 
        nama_layanan = p_nama_layanan,
        deskripsi_layanan = p_deskripsi_layanan,
        biaya_layanan = p_biaya_layanan
    WHERE kode_layanan = p_kode_layanan;
    
    -- Return updated layanan
    SELECT 
        dl.kode_layanan,
        dl.nama_layanan,
        dl.deskripsi_layanan,
        dl.biaya_layanan,
        COUNT(DISTINCT l.kunjungan_id) as total_penggunaan
    FROM Detail_Layanan dl
    LEFT JOIN Layanan l ON dl.kode_layanan = l.kode_layanan
    WHERE dl.kode_layanan = p_kode_layanan
    GROUP BY dl.kode_layanan;
END$$

-- ========================================================
-- DELETE LAYANAN (Detail_Layanan)
-- ========================================================
DROP PROCEDURE IF EXISTS DeleteLayanan$$
CREATE PROCEDURE DeleteLayanan(IN p_kode_layanan VARCHAR(20))
BEGIN
    DECLARE rows_affected INT;
    DECLARE usage_count INT;
    
    -- Check if layanan is being used in any kunjungan
    SELECT COUNT(*) INTO usage_count
    FROM Layanan
    WHERE kode_layanan = p_kode_layanan;
    
    IF usage_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Tidak dapat menghapus layanan yang sudah digunakan dalam kunjungan';
    END IF;
    
    -- Delete layanan
    DELETE FROM Detail_Layanan 
    WHERE kode_layanan = p_kode_layanan;
    
    SET rows_affected = ROW_COUNT();
    
    SELECT rows_affected as affected_rows;
END$$

DELIMITER ;