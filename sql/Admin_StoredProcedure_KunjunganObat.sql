DELIMITER $$

-- ========================================================
-- KUNJUNGAN OBAT MANAGEMENT STORED PROCEDURES (CRUD ONLY)
-- ========================================================

-- ========================================================
-- GET OBAT BY KUNJUNGAN
-- ========================================================
DROP PROCEDURE IF EXISTS GetObatByKunjungan$$
CREATE PROCEDURE GetObatByKunjungan(
    IN p_kunjungan_id INT
)
BEGIN
    SELECT 
        ko.kunjungan_id,
        ko.obat_id,
        o.nama_obat,
        o.kegunaan,
        o.harga_obat,
        ko.dosis,
        ko.frekuensi,
        (o.harga_obat) AS total_biaya
    FROM Kunjungan_Obat ko
    INNER JOIN Obat o ON ko.obat_id = o.obat_id
    WHERE ko.kunjungan_id = p_kunjungan_id
    ORDER BY o.nama_obat;
END$$

-- ========================================================
-- CREATE KUNJUNGAN OBAT
-- ========================================================
DROP PROCEDURE IF EXISTS CreateKunjunganObat$$
CREATE PROCEDURE CreateKunjunganObat(
    IN p_kunjungan_id INT,
    IN p_obat_id INT,
    IN p_dosis VARCHAR(100),
    IN p_frekuensi VARCHAR(100)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Check if kunjungan exists
    IF NOT EXISTS (SELECT 1 FROM Kunjungan WHERE kunjungan_id = p_kunjungan_id) THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Kunjungan tidak ditemukan';
    END IF;
    
    -- Check if obat exists
    IF NOT EXISTS (SELECT 1 FROM Obat WHERE obat_id = p_obat_id) THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Obat tidak ditemukan';
    END IF;
    
    -- Check for duplicate
    IF EXISTS (SELECT 1 FROM Kunjungan_Obat WHERE kunjungan_id = p_kunjungan_id AND obat_id = p_obat_id) THEN
        SIGNAL SQLSTATE '23000' 
        SET MESSAGE_TEXT = 'Obat sudah ada dalam kunjungan ini';
    END IF;
    
    -- Insert kunjungan obat
    INSERT INTO Kunjungan_Obat (
        kunjungan_id,
        obat_id,
        dosis,
        frekuensi,
        tanggal_pemberian
    ) VALUES (
        p_kunjungan_id,
        p_obat_id,
        p_dosis,
        p_frekuensi,
        CURDATE()
    );
    
    -- Return created data
    SELECT 
        ko.kunjungan_id,
        ko.obat_id,
        o.nama_obat,
        o.kegunaan,
        o.harga_obat,
        ko.dosis,
        ko.frekuensi,
        ko.tanggal_pemberian
    FROM Kunjungan_Obat ko
    INNER JOIN Obat o ON ko.obat_id = o.obat_id
    WHERE ko.kunjungan_id = p_kunjungan_id 
      AND ko.obat_id = p_obat_id;
    
    COMMIT;
END$$

-- ========================================================
-- UPDATE KUNJUNGAN OBAT
-- ========================================================
DROP PROCEDURE IF EXISTS UpdateKunjunganObat$$
CREATE PROCEDURE UpdateKunjunganObat(
    IN p_kunjungan_id INT,
    IN p_obat_id INT,
    IN p_dosis VARCHAR(100),
    IN p_frekuensi VARCHAR(100)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Check if exists
    IF NOT EXISTS (SELECT 1 FROM Kunjungan_Obat WHERE kunjungan_id = p_kunjungan_id AND obat_id = p_obat_id) THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Data obat kunjungan tidak ditemukan';
    END IF;
    
    UPDATE Kunjungan_Obat
    SET 
        dosis = p_dosis,
        frekuensi = p_frekuensi
    WHERE kunjungan_id = p_kunjungan_id 
      AND obat_id = p_obat_id;
    
    COMMIT;
END$$

-- ========================================================
-- DELETE KUNJUNGAN OBAT
-- ========================================================
DROP PROCEDURE IF EXISTS DeleteKunjunganObat$$
CREATE PROCEDURE DeleteKunjunganObat(
    IN p_kunjungan_id INT,
    IN p_obat_id INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Check if exists
    IF NOT EXISTS (SELECT 1 FROM Kunjungan_Obat WHERE kunjungan_id = p_kunjungan_id AND obat_id = p_obat_id) THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Data obat kunjungan tidak ditemukan';
    END IF;
    
    DELETE FROM Kunjungan_Obat
    WHERE kunjungan_id = p_kunjungan_id 
      AND obat_id = p_obat_id;
    
    COMMIT;
END$$

DELIMITER ;