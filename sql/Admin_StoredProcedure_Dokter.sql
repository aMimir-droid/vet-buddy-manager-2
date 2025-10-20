DELIMITER $$

-- ========================================================
-- DOKTER MANAGEMENT STORED PROCEDURES
-- ========================================================

-- ========================================================
-- GET ALL DOKTERS
-- ========================================================
DROP PROCEDURE IF EXISTS GetAllDokters$$
CREATE PROCEDURE GetAllDokters()
BEGIN
    SELECT 
        d.dokter_id,
        d.title_dokter,
        d.nama_dokter,
        d.telepon_dokter,
        d.tanggal_mulai_kerja,
        d.spesialisasi_id,
        d.klinik_id,
        s.nama_spesialisasi,
        k.nama_klinik,
        TIMESTAMPDIFF(YEAR, d.tanggal_mulai_kerja, CURDATE()) as lama_bekerja_tahun,
        TIMESTAMPDIFF(MONTH, d.tanggal_mulai_kerja, CURDATE()) % 12 as lama_bekerja_bulan,
        COUNT(DISTINCT p.pawrent_id) as total_pawrent
    FROM Dokter d
    LEFT JOIN Spesialisasi s ON d.spesialisasi_id = s.spesialisasi_id
    LEFT JOIN Klinik k ON d.klinik_id = k.klinik_id
    LEFT JOIN Kunjungan kj ON d.dokter_id = kj.dokter_id
    LEFT JOIN Pawrent p ON d.dokter_id = p.dokter_id
    GROUP BY d.dokter_id
    ORDER BY d.nama_dokter;
END$$

-- ========================================================
-- GET DOKTER BY ID
-- ========================================================
DROP PROCEDURE IF EXISTS GetDokterById$$
CREATE PROCEDURE GetDokterById(IN p_dokter_id INT)
BEGIN
    SELECT 
        d.dokter_id,
        d.title_dokter,
        d.nama_dokter,
        d.telepon_dokter,
        d.tanggal_mulai_kerja,
        d.spesialisasi_id,
        d.klinik_id,
        s.nama_spesialisasi,
        k.nama_klinik,
        TIMESTAMPDIFF(YEAR, d.tanggal_mulai_kerja, CURDATE()) as lama_bekerja_tahun,
        TIMESTAMPDIFF(MONTH, d.tanggal_mulai_kerja, CURDATE()) % 12 as lama_bekerja_bulan
    FROM Dokter d
    LEFT JOIN Spesialisasi s ON d.spesialisasi_id = s.spesialisasi_id
    LEFT JOIN Klinik k ON d.klinik_id = k.klinik_id
    LEFT JOIN Kunjungan kj ON d.dokter_id = kj.dokter_id
    LEFT JOIN Pawrent p ON d.dokter_id = p.dokter_id
    WHERE d.dokter_id = p_dokter_id
    GROUP BY d.dokter_id;
END$$

-- ========================================================
-- GET ALL SPESIALISASI
-- ========================================================
DROP PROCEDURE IF EXISTS GetAllSpesialisasi$$
CREATE PROCEDURE GetAllSpesialisasi()
BEGIN
    SELECT 
        spesialisasi_id,
        nama_spesialisasi,
        deskripsi_spesialisasi,
        COUNT(d.dokter_id) as jumlah_dokter
    FROM Spesialisasi s
    LEFT JOIN Dokter d ON s.spesialisasi_id = d.spesialisasi_id
    GROUP BY s.spesialisasi_id
    ORDER BY s.nama_spesialisasi;
END$$

-- ========================================================
-- GET AVAILABLE KLINIKS (for doctor assignment)
-- ========================================================
DROP PROCEDURE IF EXISTS GetAvailableKliniks$$
CREATE PROCEDURE GetAvailableKliniks()
BEGIN
    SELECT 
        k.klinik_id,
        k.nama_klinik,
        k.alamat_klinik,
        k.telepon_klinik,
        COUNT(d.dokter_id) as jumlah_dokter
    FROM Klinik k
    LEFT JOIN Dokter d ON k.klinik_id = d.klinik_id
    GROUP BY k.klinik_id
    ORDER BY k.nama_klinik;
END$$

-- ========================================================
-- CREATE DOKTER
-- ========================================================
DROP PROCEDURE IF EXISTS CreateDokter$$
CREATE PROCEDURE CreateDokter(
    IN p_title_dokter VARCHAR(20),
    IN p_nama_dokter VARCHAR(100),
    IN p_telepon_dokter VARCHAR(15),
    IN p_tanggal_mulai_kerja DATE,
    IN p_spesialisasi_id INT,
    IN p_klinik_id INT
)
BEGIN
    DECLARE new_dokter_id INT;
    DECLARE duplicate_check INT;
    
    -- Check for duplicate telepon_dokter
    IF p_telepon_dokter IS NOT NULL THEN
        SELECT COUNT(*) INTO duplicate_check
        FROM Dokter
        WHERE telepon_dokter = p_telepon_dokter;
        
        IF duplicate_check > 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Nomor telepon dokter sudah terdaftar';
        END IF;
    END IF;
    
    -- Validate tanggal_mulai_kerja tidak di masa depan
    IF p_tanggal_mulai_kerja > CURDATE() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Tanggal mulai kerja tidak boleh di masa depan';
    END IF;
    
    -- Insert new dokter
    INSERT INTO Dokter (
        title_dokter,
        nama_dokter,
        telepon_dokter,
        tanggal_mulai_kerja,
        spesialisasi_id,
        klinik_id
    )
    VALUES (
        p_title_dokter,
        p_nama_dokter,
        p_telepon_dokter,
        p_tanggal_mulai_kerja,
        p_spesialisasi_id,
        p_klinik_id
    );
    
    SET new_dokter_id = LAST_INSERT_ID();
    
    -- Return the new dokter with joined data
    SELECT 
        d.dokter_id,
        d.title_dokter,
        d.nama_dokter,
        d.telepon_dokter,
        d.tanggal_mulai_kerja,
        d.spesialisasi_id,
        d.klinik_id,
        s.nama_spesialisasi,
        k.nama_klinik
    FROM Dokter d
    LEFT JOIN Spesialisasi s ON d.spesialisasi_id = s.spesialisasi_id
    LEFT JOIN Klinik k ON d.klinik_id = k.klinik_id
    WHERE d.dokter_id = new_dokter_id;
END$$

-- ========================================================
-- UPDATE DOKTER
-- ========================================================
DROP PROCEDURE IF EXISTS UpdateDokter$$
CREATE PROCEDURE UpdateDokter(
    IN p_dokter_id INT,
    IN p_title_dokter VARCHAR(20),
    IN p_nama_dokter VARCHAR(100),
    IN p_telepon_dokter VARCHAR(15),
    IN p_tanggal_mulai_kerja DATE,
    IN p_spesialisasi_id INT,
    IN p_klinik_id INT
)
BEGIN
    DECLARE duplicate_check INT;
    
    -- Check for duplicate telepon_dokter (excluding current dokter)
    IF p_telepon_dokter IS NOT NULL THEN
        SELECT COUNT(*) INTO duplicate_check
        FROM Dokter
        WHERE telepon_dokter = p_telepon_dokter AND dokter_id != p_dokter_id;
        
        IF duplicate_check > 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Nomor telepon dokter sudah terdaftar';
        END IF;
    END IF;
    
    -- Validate tanggal_mulai_kerja tidak di masa depan
    IF p_tanggal_mulai_kerja > CURDATE() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Tanggal mulai kerja tidak boleh di masa depan';
    END IF;
    
    -- Update dokter
    UPDATE Dokter
    SET 
        title_dokter = p_title_dokter,
        nama_dokter = p_nama_dokter,
        telepon_dokter = p_telepon_dokter,
        tanggal_mulai_kerja = p_tanggal_mulai_kerja,
        spesialisasi_id = p_spesialisasi_id,
        klinik_id = p_klinik_id
    WHERE dokter_id = p_dokter_id;
    
    -- Return updated dokter with joined data
    SELECT 
        d.dokter_id,
        d.title_dokter,
        d.nama_dokter,
        d.telepon_dokter,
        d.tanggal_mulai_kerja,
        d.spesialisasi_id,
        d.klinik_id,
        s.nama_spesialisasi,
        k.nama_klinik
    FROM Dokter d
    LEFT JOIN Spesialisasi s ON d.spesialisasi_id = s.spesialisasi_id
    LEFT JOIN Klinik k ON d.klinik_id = k.klinik_id
    WHERE d.dokter_id = p_dokter_id;
END$$

-- ========================================================
-- DELETE DOKTER
-- ========================================================
DROP PROCEDURE IF EXISTS DeleteDokter$$
CREATE PROCEDURE DeleteDokter(IN p_dokter_id INT)
BEGIN
    DECLARE rows_affected INT;
    DECLARE pawrent_count INT;
    DECLARE kunjungan_count INT;
    DECLARE user_count INT;
    
    -- Check if dokter has pawrents
    SELECT COUNT(*) INTO pawrent_count
    FROM Pawrent
    WHERE dokter_id = p_dokter_id;
    
    IF pawrent_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Tidak dapat menghapus dokter yang masih memiliki pawrent terdaftar';
    END IF;
    
    -- Check if dokter has kunjungans
    SELECT COUNT(*) INTO kunjungan_count
    FROM Kunjungan
    WHERE dokter_id = p_dokter_id;
    
    IF kunjungan_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Tidak dapat menghapus dokter yang memiliki riwayat kunjungan';
    END IF;
    
    -- Check if dokter has user login
    SELECT COUNT(*) INTO user_count
    FROM User_Login
    WHERE dokter_id = p_dokter_id;
    
    IF user_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Tidak dapat menghapus dokter yang memiliki akun login. Hapus user login terlebih dahulu';
    END IF;
    
    -- Delete dokter
    DELETE FROM Dokter 
    WHERE dokter_id = p_dokter_id;
    
    SET rows_affected = ROW_COUNT();
    
    SELECT rows_affected as affected_rows;
END$$

-- ========================================================
-- GET ALL DOKTERS FOR PAWRENT
-- ========================================================
DROP PROCEDURE IF EXISTS GetAllDoktersForPawrent$$
CREATE PROCEDURE GetAllDoktersForPawrent()
BEGIN
    SELECT 
        d.dokter_id,
        d.title_dokter,
        d.nama_dokter,
        d.telepon_dokter,
        s.nama_spesialisasi,
        s.deskripsi_spesialisasi,
        k.nama_klinik
    FROM Dokter d
    LEFT JOIN Spesialisasi s ON d.spesialisasi_id = s.spesialisasi_id
    LEFT JOIN Klinik k ON d.klinik_id = k.klinik_id
    ORDER BY d.nama_dokter;
END$$

DELIMITER ;