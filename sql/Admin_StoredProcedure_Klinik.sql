DELIMITER $$

-- ========================================================
-- KLINIK MANAGEMENT STORED PROCEDURES (CRUD ONLY)
-- ========================================================

-- ========================================================
-- GET ALL KLINIK
-- ========================================================
DROP PROCEDURE IF EXISTS GetAllKlinik$$
CREATE PROCEDURE GetAllKlinik()
BEGIN
    SELECT 
        k.klinik_id,
        k.nama_klinik,
        k.alamat_klinik,
        k.telepon_klinik,
        COUNT(DISTINCT d.dokter_id) as jumlah_dokter
    FROM Klinik k
    LEFT JOIN Dokter d ON k.klinik_id = d.klinik_id
    GROUP BY k.klinik_id
    ORDER BY k.nama_klinik;
END$$

-- ========================================================
-- GET KLINIK BY ID
-- ========================================================
DROP PROCEDURE IF EXISTS GetKlinikById$$
CREATE PROCEDURE GetKlinikById(IN p_klinik_id INT)
BEGIN
    SELECT 
        k.klinik_id,
        k.nama_klinik,
        k.alamat_klinik,
        k.telepon_klinik,
        COUNT(DISTINCT d.dokter_id) as jumlah_dokter
    FROM Klinik k
    LEFT JOIN Dokter d ON k.klinik_id = d.klinik_id
    WHERE k.klinik_id = p_klinik_id
    GROUP BY k.klinik_id;
END$$

-- ========================================================
-- CREATE KLINIK
-- ========================================================
DROP PROCEDURE IF EXISTS CreateKlinik$$
CREATE PROCEDURE CreateKlinik(
    IN p_nama_klinik VARCHAR(100),
    IN p_alamat_klinik VARCHAR(200),
    IN p_telepon_klinik VARCHAR(15)
)
BEGIN
    DECLARE new_klinik_id INT;
    DECLARE duplicate_check INT;
    
    -- Check for duplicate telepon_klinik
    IF p_telepon_klinik IS NOT NULL THEN
        SELECT COUNT(*) INTO duplicate_check
        FROM Klinik
        WHERE telepon_klinik = p_telepon_klinik;
        
        IF duplicate_check > 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Nomor telepon klinik sudah terdaftar';
        END IF;
    END IF;
    
    -- Validate nama_klinik tidak kosong
    IF p_nama_klinik IS NULL OR TRIM(p_nama_klinik) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Nama klinik wajib diisi';
    END IF;
    
    -- Validate alamat_klinik tidak kosong
    IF p_alamat_klinik IS NULL OR TRIM(p_alamat_klinik) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Alamat klinik wajib diisi';
    END IF;
    
    -- Insert new klinik
    INSERT INTO Klinik (
        nama_klinik,
        alamat_klinik,
        telepon_klinik
    )
    VALUES (
        p_nama_klinik,
        p_alamat_klinik,
        p_telepon_klinik
    );
    
    SET new_klinik_id = LAST_INSERT_ID();
    
    -- Return the new klinik
    SELECT 
        klinik_id,
        nama_klinik,
        alamat_klinik,
        telepon_klinik,
        0 as jumlah_dokter
    FROM Klinik
    WHERE klinik_id = new_klinik_id;
END$$

-- ========================================================
-- UPDATE KLINIK
-- ========================================================
DROP PROCEDURE IF EXISTS UpdateKlinik$$
CREATE PROCEDURE UpdateKlinik(
    IN p_klinik_id INT,
    IN p_nama_klinik VARCHAR(100),
    IN p_alamat_klinik VARCHAR(200),
    IN p_telepon_klinik VARCHAR(15)
)
BEGIN
    DECLARE duplicate_check INT;
    DECLARE klinik_exists INT;
    
    -- Check if klinik exists
    SELECT COUNT(*) INTO klinik_exists
    FROM Klinik
    WHERE klinik_id = p_klinik_id;
    
    IF klinik_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Klinik tidak ditemukan';
    END IF;
    
    -- Check for duplicate telepon_klinik (excluding current klinik)
    IF p_telepon_klinik IS NOT NULL THEN
        SELECT COUNT(*) INTO duplicate_check
        FROM Klinik
        WHERE telepon_klinik = p_telepon_klinik AND klinik_id != p_klinik_id;
        
        IF duplicate_check > 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Nomor telepon klinik sudah terdaftar';
        END IF;
    END IF;
    
    -- Validate nama_klinik tidak kosong
    IF p_nama_klinik IS NULL OR TRIM(p_nama_klinik) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Nama klinik wajib diisi';
    END IF;
    
    -- Validate alamat_klinik tidak kosong
    IF p_alamat_klinik IS NULL OR TRIM(p_alamat_klinik) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Alamat klinik wajib diisi';
    END IF;
    
    -- Update klinik
    UPDATE Klinik
    SET 
        nama_klinik = p_nama_klinik,
        alamat_klinik = p_alamat_klinik,
        telepon_klinik = p_telepon_klinik
    WHERE klinik_id = p_klinik_id;
    
    -- Return updated klinik
    SELECT 
        k.klinik_id,
        k.nama_klinik,
        k.alamat_klinik,
        k.telepon_klinik,
        COUNT(DISTINCT d.dokter_id) as jumlah_dokter
    FROM Klinik k
    LEFT JOIN Dokter d ON k.klinik_id = d.klinik_id
    WHERE k.klinik_id = p_klinik_id
    GROUP BY k.klinik_id;
END$$

-- ========================================================
-- DELETE KLINIK
-- ========================================================
DROP PROCEDURE IF EXISTS DeleteKlinik$$
CREATE PROCEDURE DeleteKlinik(IN p_klinik_id INT)
BEGIN
    DECLARE rows_affected INT;
    DECLARE dokter_count INT;
    
    -- Check if klinik has dokters
    SELECT COUNT(*) INTO dokter_count
    FROM Dokter
    WHERE klinik_id = p_klinik_id;
    
    IF dokter_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Tidak dapat menghapus klinik yang masih memiliki dokter terdaftar';
    END IF;
    
    -- Delete klinik
    DELETE FROM Klinik 
    WHERE klinik_id = p_klinik_id;
    
    SET rows_affected = ROW_COUNT();
    
    SELECT rows_affected as affected_rows;
END$$

-- ========================================================
-- GET DOKTERS BY KLINIK (Helper untuk detail klinik)
-- ========================================================
DROP PROCEDURE IF EXISTS GetDoktersByKlinik$$
CREATE PROCEDURE GetDoktersByKlinik(IN p_klinik_id INT)
BEGIN
    SELECT 
        d.dokter_id,
        d.title_dokter,
        d.nama_dokter,
        CONCAT(d.title_dokter, ' ', d.nama_dokter) as nama_lengkap,
        d.telepon_dokter,
        d.tanggal_mulai_kerja,
        s.nama_spesialisasi,
        COUNT(DISTINCT p.pawrent_id) as jumlah_pasien,
        COUNT(DISTINCT k.kunjungan_id) as jumlah_kunjungan
    FROM Dokter d
    LEFT JOIN Spesialisasi s ON d.spesialisasi_id = s.spesialisasi_id
    LEFT JOIN Pawrent p ON d.dokter_id = p.dokter_id
    LEFT JOIN Kunjungan k ON d.dokter_id = k.dokter_id
    WHERE d.klinik_id = p_klinik_id
    GROUP BY d.dokter_id
    ORDER BY d.nama_dokter;
END$$

DELIMITER ;