DELIMITER $$

-- ========================================================
-- PAWRENT MANAGEMENT STORED PROCEDURES
-- ========================================================

-- ========================================================
-- GET ALL PAWRENTS
-- ========================================================
DROP PROCEDURE IF EXISTS GetAllPawrents$$
CREATE PROCEDURE GetAllPawrents()
BEGIN
    SELECT 
        p.pawrent_id,
        p.nama_depan_pawrent,
        p.nama_belakang_pawrent,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) as nama_lengkap,
        p.alamat_pawrent,
        p.kota_pawrent,
        p.kode_pos_pawrent,
        p.nomor_hp,
        p.dokter_id,
        CONCAT(d.title_dokter, ' ', d.nama_dokter) as nama_dokter,
        COUNT(DISTINCT h.hewan_id) as jumlah_hewan,
        COUNT(DISTINCT k.kunjungan_id) as total_kunjungan,
        MAX(k.tanggal_kunjungan) as kunjungan_terakhir
    FROM Pawrent p
    LEFT JOIN Dokter d ON p.dokter_id = d.dokter_id
    LEFT JOIN Hewan h ON p.pawrent_id = h.pawrent_id
    LEFT JOIN Kunjungan k ON h.hewan_id = k.hewan_id
    GROUP BY p.pawrent_id
    ORDER BY p.nama_depan_pawrent, p.nama_belakang_pawrent;
END$$

-- ========================================================
-- GET PAWRENT BY ID
-- ========================================================
DROP PROCEDURE IF EXISTS GetPawrentById$$
CREATE PROCEDURE GetPawrentById(IN p_pawrent_id INT)
BEGIN
    SELECT 
        p.pawrent_id,
        p.nama_depan_pawrent,
        p.nama_belakang_pawrent,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) as nama_lengkap,
        p.alamat_pawrent,
        p.kota_pawrent,
        p.kode_pos_pawrent,
        p.nomor_hp,
        p.dokter_id,
        CONCAT(d.title_dokter, ' ', d.nama_dokter) as nama_dokter,
        d.telepon_dokter,
        s.nama_spesialisasi,
        k.nama_klinik,
        COUNT(DISTINCT h.hewan_id) as jumlah_hewan,
        COUNT(DISTINCT kj.kunjungan_id) as total_kunjungan,
        MAX(kj.tanggal_kunjungan) as kunjungan_terakhir
    FROM Pawrent p
    LEFT JOIN Dokter d ON p.dokter_id = d.dokter_id
    LEFT JOIN Spesialisasi s ON d.spesialisasi_id = s.spesialisasi_id
    LEFT JOIN Klinik k ON d.klinik_id = k.klinik_id
    LEFT JOIN Hewan h ON p.pawrent_id = h.pawrent_id
    LEFT JOIN Kunjungan kj ON h.hewan_id = kj.hewan_id
    WHERE p.pawrent_id = p_pawrent_id
    GROUP BY p.pawrent_id;
END$$

-- ========================================================
-- GET AVAILABLE DOKTERS (for pawrent assignment)
-- ========================================================
DROP PROCEDURE IF EXISTS GetAvailableDoktersForPawrent$$
CREATE PROCEDURE GetAvailableDoktersForPawrent()
BEGIN
    SELECT 
        d.dokter_id,
        d.title_dokter,
        d.nama_dokter,
        CONCAT(d.title_dokter, ' ', d.nama_dokter) as nama_lengkap,
        d.telepon_dokter,
        s.nama_spesialisasi,
        k.nama_klinik,
        COUNT(p.pawrent_id) as jumlah_pasien
    FROM Dokter d
    LEFT JOIN Spesialisasi s ON d.spesialisasi_id = s.spesialisasi_id
    LEFT JOIN Klinik k ON d.klinik_id = k.klinik_id
    LEFT JOIN Pawrent p ON d.dokter_id = p.dokter_id
    GROUP BY d.dokter_id
    ORDER BY d.nama_dokter;
END$$

-- ========================================================
-- CREATE PAWRENT
-- ========================================================
DROP PROCEDURE IF EXISTS CreatePawrent$$
CREATE PROCEDURE CreatePawrent(
    IN p_nama_depan_pawrent VARCHAR(50),
    IN p_nama_belakang_pawrent VARCHAR(50),
    IN p_alamat_pawrent VARCHAR(200),
    IN p_kota_pawrent VARCHAR(100),
    IN p_kode_pos_pawrent VARCHAR(10),
    IN p_nomor_hp VARCHAR(15),
    IN p_dokter_id INT
)
BEGIN
    DECLARE new_pawrent_id INT;
    DECLARE duplicate_check INT;
    
    -- Check for duplicate nomor_hp
    IF p_nomor_hp IS NOT NULL THEN
        SELECT COUNT(*) INTO duplicate_check
        FROM Pawrent
        WHERE nomor_hp = p_nomor_hp;
        
        IF duplicate_check > 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Nomor HP sudah terdaftar';
        END IF;
    END IF;
    
    -- Validate dokter exists
    SELECT COUNT(*) INTO duplicate_check
    FROM Dokter
    WHERE dokter_id = p_dokter_id;
    
    IF duplicate_check = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Dokter tidak ditemukan';
    END IF;
    
    -- Insert new pawrent
    INSERT INTO Pawrent (
        nama_depan_pawrent,
        nama_belakang_pawrent,
        alamat_pawrent,
        kota_pawrent,
        kode_pos_pawrent,
        nomor_hp,
        dokter_id
    )
    VALUES (
        p_nama_depan_pawrent,
        p_nama_belakang_pawrent,
        p_alamat_pawrent,
        p_kota_pawrent,
        p_kode_pos_pawrent,
        p_nomor_hp,
        p_dokter_id
    );
    
    SET new_pawrent_id = LAST_INSERT_ID();
    
    -- Return the new pawrent with joined data
    SELECT 
        p.pawrent_id,
        p.nama_depan_pawrent,
        p.nama_belakang_pawrent,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) as nama_lengkap,
        p.alamat_pawrent,
        p.kota_pawrent,
        p.kode_pos_pawrent,
        p.nomor_hp,
        p.dokter_id,
        CONCAT(d.title_dokter, ' ', d.nama_dokter) as nama_dokter
    FROM Pawrent p
    LEFT JOIN Dokter d ON p.dokter_id = d.dokter_id
    WHERE p.pawrent_id = new_pawrent_id;
END$$

-- ========================================================
-- UPDATE PAWRENT
-- ========================================================
DROP PROCEDURE IF EXISTS UpdatePawrent$$
CREATE PROCEDURE UpdatePawrent(
    IN p_pawrent_id INT,
    IN p_nama_depan_pawrent VARCHAR(50),
    IN p_nama_belakang_pawrent VARCHAR(50),
    IN p_alamat_pawrent VARCHAR(200),
    IN p_kota_pawrent VARCHAR(100),
    IN p_kode_pos_pawrent VARCHAR(10),
    IN p_nomor_hp VARCHAR(15),
    IN p_dokter_id INT
)
BEGIN
    DECLARE duplicate_check INT;
    
    -- Check for duplicate nomor_hp (excluding current pawrent)
    IF p_nomor_hp IS NOT NULL THEN
        SELECT COUNT(*) INTO duplicate_check
        FROM Pawrent
        WHERE nomor_hp = p_nomor_hp AND pawrent_id != p_pawrent_id;
        
        IF duplicate_check > 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Nomor HP sudah terdaftar';
        END IF;
    END IF;
    
    -- Validate dokter exists
    SELECT COUNT(*) INTO duplicate_check
    FROM Dokter
    WHERE dokter_id = p_dokter_id;
    
    IF duplicate_check = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Dokter tidak ditemukan';
    END IF;
    
    -- Update pawrent
    UPDATE Pawrent
    SET 
        nama_depan_pawrent = p_nama_depan_pawrent,
        nama_belakang_pawrent = p_nama_belakang_pawrent,
        alamat_pawrent = p_alamat_pawrent,
        kota_pawrent = p_kota_pawrent,
        kode_pos_pawrent = p_kode_pos_pawrent,
        nomor_hp = p_nomor_hp,
        dokter_id = p_dokter_id
    WHERE pawrent_id = p_pawrent_id;
    
    -- Return updated pawrent with joined data
    SELECT 
        p.pawrent_id,
        p.nama_depan_pawrent,
        p.nama_belakang_pawrent,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) as nama_lengkap,
        p.alamat_pawrent,
        p.kota_pawrent,
        p.kode_pos_pawrent,
        p.nomor_hp,
        p.dokter_id,
        CONCAT(d.title_dokter, ' ', d.nama_dokter) as nama_dokter
    FROM Pawrent p
    LEFT JOIN Dokter d ON p.dokter_id = d.dokter_id
    WHERE p.pawrent_id = p_pawrent_id;
END$$

-- ========================================================
-- DELETE PAWRENT
-- ========================================================
DROP PROCEDURE IF EXISTS DeletePawrent$$
CREATE PROCEDURE DeletePawrent(IN p_pawrent_id INT)
BEGIN
    DECLARE rows_affected INT;
    DECLARE hewan_count INT;
    DECLARE user_count INT;
    
    -- Check if pawrent has hewans
    SELECT COUNT(*) INTO hewan_count
    FROM Hewan
    WHERE pawrent_id = p_pawrent_id;
    
    IF hewan_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Tidak dapat menghapus pawrent yang masih memiliki hewan terdaftar';
    END IF;
    
    -- Check if pawrent has user account
    SELECT COUNT(*) INTO user_count
    FROM User_Login
    WHERE pawrent_id = p_pawrent_id;
    
    IF user_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Tidak dapat menghapus pawrent yang masih memiliki akun user. Hapus user terlebih dahulu';
    END IF;
    
    -- Delete pawrent
    DELETE FROM Pawrent 
    WHERE pawrent_id = p_pawrent_id;
    
    SET rows_affected = ROW_COUNT();
    
    SELECT rows_affected as affected_rows;
END$$

-- ========================================================
-- UPDATE PAWRENT SELF (Pawrent update profil sendiri)
-- ========================================================
DROP PROCEDURE IF EXISTS UpdatePawrentSelf$$
CREATE PROCEDURE UpdatePawrentSelf(
    IN p_pawrent_id INT,
    IN p_nama_depan_pawrent VARCHAR(30),
    IN p_nama_belakang_pawrent VARCHAR(30),
    IN p_alamat_pawrent VARCHAR(100),
    IN p_kota_pawrent VARCHAR(20),
    IN p_kode_pos_pawrent VARCHAR(10),
    IN p_nomor_hp VARCHAR(15)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Validate pawrent exists
    IF NOT EXISTS (SELECT 1 FROM Pawrent WHERE pawrent_id = p_pawrent_id) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Pawrent tidak ditemukan';
    END IF;
    
    -- Validate required fields
    IF p_nama_depan_pawrent IS NULL OR TRIM(p_nama_depan_pawrent) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Nama depan wajib diisi';
    END IF;
    
    IF p_nama_belakang_pawrent IS NULL OR TRIM(p_nama_belakang_pawrent) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Nama belakang wajib diisi';
    END IF;
    
    IF p_nomor_hp IS NULL OR TRIM(p_nomor_hp) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Nomor HP wajib diisi';
    END IF;
    
    -- Validate nomor HP unique (kecuali untuk pawrent ini sendiri)
    IF EXISTS (
        SELECT 1 FROM Pawrent 
        WHERE nomor_hp = p_nomor_hp 
        AND pawrent_id != p_pawrent_id
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Nomor HP sudah digunakan oleh pawrent lain';
    END IF;
    
    -- Update pawrent data
    UPDATE Pawrent
    SET 
        nama_depan_pawrent = p_nama_depan_pawrent,
        nama_belakang_pawrent = p_nama_belakang_pawrent,
        alamat_pawrent = p_alamat_pawrent,
        kota_pawrent = p_kota_pawrent,
        kode_pos_pawrent = p_kode_pos_pawrent,
        nomor_hp = p_nomor_hp
    WHERE pawrent_id = p_pawrent_id;
    
    -- Return the updated pawrent with joined data
    SELECT 
        p.pawrent_id,
        p.nama_depan_pawrent,
        p.nama_belakang_pawrent,
        p.alamat_pawrent,
        p.kota_pawrent,
        p.kode_pos_pawrent,
        p.nomor_hp,
        p.dokter_id,
        d.nama_dokter,
        d.title_dokter,
        u.email,
        u.created_at
    FROM Pawrent p
    LEFT JOIN Dokter d ON p.dokter_id = d.dokter_id
    LEFT JOIN User_Login u ON p.pawrent_id = u.pawrent_id
    WHERE p.pawrent_id = p_pawrent_id;
    
    COMMIT;
END$$

-- ========================================================
-- UPDATE HEWAN BY PAWRENT (dengan validasi ownership)
-- ========================================================
DROP PROCEDURE IF EXISTS UpdateHewanByPawrent$$
CREATE PROCEDURE UpdateHewanByPawrent(
    IN p_hewan_id INT,
    IN p_pawrent_id INT,
    IN p_nama_hewan VARCHAR(50),
    IN p_tanggal_lahir DATE,
    IN p_jenis_kelamin ENUM('Jantan','Betina'),
    IN p_status_hidup ENUM('Hidup','Mati'),  -- ✅ TAMBAHKAN PARAMETER INI
    IN p_jenis_hewan_id INT
)
BEGIN
    DECLARE current_pawrent_id INT;
    
    -- Check ownership
    SELECT pawrent_id INTO current_pawrent_id
    FROM Hewan
    WHERE hewan_id = p_hewan_id;
    
    IF current_pawrent_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Hewan tidak ditemukan';
    END IF;
    
    IF current_pawrent_id != p_pawrent_id THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Anda tidak memiliki hak untuk mengubah hewan ini';
    END IF;
    
    -- Validate tanggal lahir
    IF p_tanggal_lahir > CURDATE() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Tanggal lahir tidak boleh di masa depan';
    END IF;
    
    -- Update hewan (✅ TAMBAHKAN status_hidup)
    UPDATE Hewan
    SET 
        nama_hewan = p_nama_hewan,
        tanggal_lahir = p_tanggal_lahir,
        jenis_kelamin = p_jenis_kelamin,
        status_hidup = p_status_hidup,  -- ✅ TAMBAHKAN FIELD INI
        jenis_hewan_id = p_jenis_hewan_id
    WHERE hewan_id = p_hewan_id;
    
    -- Return updated hewan
    SELECT 
        h.hewan_id,
        h.nama_hewan,
        h.tanggal_lahir,
        h.jenis_kelamin,
        h.status_hidup,
        h.jenis_hewan_id,
        h.pawrent_id,
        jh.nama_jenis_hewan,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) as nama_pawrent
    FROM Hewan h
    INNER JOIN Jenis_Hewan jh ON h.jenis_hewan_id = jh.jenis_hewan_id
    INNER JOIN Pawrent p ON h.pawrent_id = p.pawrent_id
    WHERE h.hewan_id = p_hewan_id;
END$$


DELIMITER ;