DELIMITER $$

-- ========================================================
-- OBAT MANAGEMENT STORED PROCEDURES (CRUD ONLY)
-- ========================================================

-- ========================================================
-- GET ALL OBAT
-- ========================================================
DROP PROCEDURE IF EXISTS GetAllObat$$
CREATE PROCEDURE GetAllObat()
BEGIN
    SELECT 
        o.obat_id,
        o.nama_obat,
        o.kegunaan,
        o.harga_obat,
        COUNT(DISTINCT ko.kunjungan_id) as total_penggunaan
    FROM Obat o
    LEFT JOIN Kunjungan_Obat ko ON o.obat_id = ko.obat_id
    GROUP BY o.obat_id
    ORDER BY o.nama_obat;
END$$

-- ========================================================
-- GET OBAT BY ID
-- ========================================================
DROP PROCEDURE IF EXISTS GetObatById$$
CREATE PROCEDURE GetObatById(IN p_obat_id INT)
BEGIN
    SELECT 
        o.obat_id,
        o.nama_obat,
        o.kegunaan,
        o.harga_obat,
        COUNT(DISTINCT ko.kunjungan_id) as total_penggunaan
    FROM Obat o
    LEFT JOIN Kunjungan_Obat ko ON o.obat_id = ko.obat_id
    WHERE o.obat_id = p_obat_id
    GROUP BY o.obat_id;
END$$

-- ========================================================
-- CREATE OBAT
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
    
    -- Insert new obat
    INSERT INTO Obat (
        nama_obat,
        kegunaan,
        harga_obat
    )
    VALUES (
        p_nama_obat,
        p_kegunaan,
        p_harga_obat
    );
    
    SET new_obat_id = LAST_INSERT_ID();
    
    -- Return the new obat
    SELECT 
        obat_id,
        nama_obat,
        kegunaan,
        harga_obat,
        0 as total_penggunaan
    FROM Obat
    WHERE obat_id = new_obat_id;
END$$

-- ========================================================
-- UPDATE OBAT
-- ========================================================
DROP PROCEDURE IF EXISTS UpdateObat$$
CREATE PROCEDURE UpdateObat(
    IN p_obat_id INT,
    IN p_nama_obat VARCHAR(100),
    IN p_kegunaan VARCHAR(255),
    IN p_harga_obat DECIMAL(12,2)
)
BEGIN
    DECLARE obat_exists INT;
    
    -- Check if obat exists
    SELECT COUNT(*) INTO obat_exists
    FROM Obat
    WHERE obat_id = p_obat_id;
    
    IF obat_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Obat tidak ditemukan';
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
    
    -- Update obat
    UPDATE Obat
    SET 
        nama_obat = p_nama_obat,
        kegunaan = p_kegunaan,
        harga_obat = p_harga_obat
    WHERE obat_id = p_obat_id;
    
    -- Return updated obat
    SELECT 
        o.obat_id,
        o.nama_obat,
        o.kegunaan,
        o.harga_obat,
        COUNT(DISTINCT ko.kunjungan_id) as total_penggunaan
    FROM Obat o
    LEFT JOIN Kunjungan_Obat ko ON o.obat_id = ko.obat_id
    WHERE o.obat_id = p_obat_id
    GROUP BY o.obat_id;
END$$

-- ========================================================
-- DELETE OBAT
-- ========================================================
DROP PROCEDURE IF EXISTS DeleteObat$$
CREATE PROCEDURE DeleteObat(IN p_obat_id INT)
BEGIN
    DECLARE rows_affected INT;
    DECLARE usage_count INT;
    
    -- Check if obat is being used in any kunjungan
    SELECT COUNT(*) INTO usage_count
    FROM Kunjungan_Obat
    WHERE obat_id = p_obat_id;
    
    IF usage_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Tidak dapat menghapus obat yang sudah digunakan dalam kunjungan';
    END IF;
    
    -- Delete obat
    DELETE FROM Obat 
    WHERE obat_id = p_obat_id;
    
    SET rows_affected = ROW_COUNT();
    
    SELECT rows_affected as affected_rows;
END$$

DELIMITER ;