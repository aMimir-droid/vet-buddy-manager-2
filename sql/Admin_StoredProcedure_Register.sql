-- ========================================================
-- REGISTER STORED PROCEDURES
-- Database: vet_buddy
-- ========================================================

USE vet_buddy;

DELIMITER $$

-- ========================================================
-- CHECK USERNAME AVAILABILITY
-- ========================================================
DROP PROCEDURE IF EXISTS CheckUsernameAvailability$$
CREATE PROCEDURE CheckUsernameAvailability(
    IN p_username VARCHAR(50)
)
BEGIN
    SELECT COUNT(*) as count
    FROM User_Login
    WHERE username = p_username;
END$$

-- ========================================================
-- CHECK EMAIL AVAILABILITY
-- ========================================================
DROP PROCEDURE IF EXISTS CheckEmailAvailability$$
CREATE PROCEDURE CheckEmailAvailability(
    IN p_email VARCHAR(100)
)
BEGIN
    SELECT COUNT(*) as count
    FROM User_Login
    WHERE email = p_email;
END$$

-- ========================================================
-- CHECK PHONE NUMBER AVAILABILITY (PAWRENT)
-- ========================================================
DROP PROCEDURE IF EXISTS CheckPawrentPhoneAvailability$$
CREATE PROCEDURE CheckPawrentPhoneAvailability(
    IN p_nomor_hp VARCHAR(15)
)
BEGIN
    SELECT COUNT(*) as count
    FROM Pawrent
    WHERE nomor_hp = p_nomor_hp;
END$$

-- ========================================================
-- CHECK PHONE NUMBER AVAILABILITY (DOKTER)
-- ========================================================
DROP PROCEDURE IF EXISTS CheckDokterPhoneAvailability$$
CREATE PROCEDURE CheckDokterPhoneAvailability(
    IN p_telepon_dokter VARCHAR(15)
)
BEGIN
    SELECT COUNT(*) as count
    FROM Dokter
    WHERE telepon_dokter = p_telepon_dokter;
END$$

-- ========================================================
-- REGISTER PAWRENT
-- ========================================================
DROP PROCEDURE IF EXISTS RegisterPawrent$$
CREATE PROCEDURE RegisterPawrent(
    IN p_username VARCHAR(50),
    IN p_email VARCHAR(100),
    IN p_password_hash VARCHAR(255),
    IN p_nama_depan_pawrent VARCHAR(50),
    IN p_nama_belakang_pawrent VARCHAR(50),
    IN p_alamat_pawrent TEXT,
    IN p_kota_pawrent VARCHAR(50),
    IN p_kode_pos_pawrent VARCHAR(10),
    IN p_nomor_hp VARCHAR(15),
    IN p_dokter_id INT
)
BEGIN
    DECLARE v_pawrent_id INT;
    DECLARE v_user_id INT;
    DECLARE v_dokter_exists INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Check if dokter exists
    SELECT COUNT(*) INTO v_dokter_exists
    FROM Dokter
    WHERE dokter_id = p_dokter_id;

    IF v_dokter_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Dokter tidak ditemukan';
    END IF;

    -- Check if username already exists
    IF EXISTS (SELECT 1 FROM User_Login WHERE username = p_username) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Username sudah terdaftar';
    END IF;

    -- Check if email already exists
    IF EXISTS (SELECT 1 FROM User_Login WHERE email = p_email) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Email sudah terdaftar';
    END IF;

    -- Check if phone number already exists
    IF EXISTS (SELECT 1 FROM Pawrent WHERE nomor_hp = p_nomor_hp) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Nomor HP sudah terdaftar';
    END IF;

    -- Insert into Pawrent table
    INSERT INTO Pawrent (
        nama_depan_pawrent,
        nama_belakang_pawrent,
        alamat_pawrent,
        kota_pawrent,
        kode_pos_pawrent,
        nomor_hp,
        dokter_id
    ) VALUES (
        p_nama_depan_pawrent,
        p_nama_belakang_pawrent,
        p_alamat_pawrent,
        p_kota_pawrent,
        p_kode_pos_pawrent,
        p_nomor_hp,
        p_dokter_id
    );

    SET v_pawrent_id = LAST_INSERT_ID();

    -- Insert into User_Login table
    INSERT INTO User_Login (
        username,
        email,
        password_hash,
        role_id,
        pawrent_id,
        is_active
    ) VALUES (
        p_username,
        p_email,
        p_password_hash,
        3, -- Pawrent role
        v_pawrent_id,
        TRUE
    );

    SET v_user_id = LAST_INSERT_ID();

    COMMIT;

    -- Return created user information
    SELECT 
        u.user_id,
        u.username,
        u.email,
        u.role_id,
        u.pawrent_id,
        u.dokter_id,
        u.is_active,
        u.created_at,
        p.nama_depan_pawrent,
        p.nama_belakang_pawrent,
        p.nomor_hp,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) as full_name
    FROM User_Login u
    JOIN Pawrent p ON u.pawrent_id = p.pawrent_id
    WHERE u.user_id = v_user_id;
END$$

-- ========================================================
-- REGISTER DOKTER
-- ========================================================
DROP PROCEDURE IF EXISTS RegisterDokter$$
CREATE PROCEDURE RegisterDokter(
    IN p_username VARCHAR(50),
    IN p_email VARCHAR(100),
    IN p_password_hash VARCHAR(255),
    IN p_title_dokter VARCHAR(10),
    IN p_nama_dokter VARCHAR(100),
    IN p_telepon_dokter VARCHAR(15),
    IN p_tanggal_mulai_kerja DATE,
    IN p_spesialisasi_id INT,
    IN p_klinik_id INT
)
BEGIN
    DECLARE v_dokter_id INT;
    DECLARE v_user_id INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Check if username already exists
    IF EXISTS (SELECT 1 FROM User_Login WHERE username = p_username) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Username sudah terdaftar';
    END IF;

    -- Check if email already exists
    IF EXISTS (SELECT 1 FROM User_Login WHERE email = p_email) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Email sudah terdaftar';
    END IF;

    -- Check if phone number already exists (if provided)
    IF p_telepon_dokter IS NOT NULL AND p_telepon_dokter != '' THEN
        IF EXISTS (SELECT 1 FROM Dokter WHERE telepon_dokter = p_telepon_dokter) THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Nomor telepon dokter sudah terdaftar';
        END IF;
    END IF;

    -- Insert into Dokter table
    INSERT INTO Dokter (
        title_dokter,
        nama_dokter,
        telepon_dokter,
        tanggal_mulai_kerja,
        spesialisasi_id,
        klinik_id
    ) VALUES (
        p_title_dokter,
        p_nama_dokter,
        p_telepon_dokter,
        p_tanggal_mulai_kerja,
        p_spesialisasi_id,
        p_klinik_id
    );

    SET v_dokter_id = LAST_INSERT_ID();

    -- Insert into User_Login table
    INSERT INTO User_Login (
        username,
        email,
        password_hash,
        role_id,
        dokter_id,
        is_active
    ) VALUES (
        p_username,
        p_email,
        p_password_hash,
        2, -- Dokter role
        v_dokter_id,
        TRUE
    );

    SET v_user_id = LAST_INSERT_ID();

    COMMIT;

    -- Return created user information
    SELECT 
        u.user_id,
        u.username,
        u.email,
        u.role_id,
        u.pawrent_id,
        u.dokter_id,
        u.is_active,
        u.created_at,
        d.title_dokter,
        d.nama_dokter,
        d.telepon_dokter,
        CONCAT(d.title_dokter, ' ', d.nama_dokter) as full_name
    FROM User_Login u
    JOIN Dokter d ON u.dokter_id = d.dokter_id
    WHERE u.user_id = v_user_id;
END$$

-- ========================================================
-- GET PUBLIC DOKTERS (For Registration)
-- ========================================================
DROP PROCEDURE IF EXISTS GetPublicDokters$$
CREATE PROCEDURE GetPublicDokters()
BEGIN
    SELECT 
        d.dokter_id,
        d.title_dokter,
        d.nama_dokter,
        d.telepon_dokter,
        s.spesialisasi_id,
        s.nama_spesialisasi,
        k.klinik_id,
        k.nama_klinik,
        CONCAT(d.title_dokter, ' ', d.nama_dokter) as full_name,
        CONCAT(d.title_dokter, ' ', d.nama_dokter, 
               CASE 
                   WHEN s.nama_spesialisasi IS NOT NULL 
                   THEN CONCAT(' - ', s.nama_spesialisasi)
                   ELSE ''
               END) as display_name
    FROM Dokter d
    LEFT JOIN Spesialisasi s ON d.spesialisasi_id = s.spesialisasi_id
    LEFT JOIN Klinik k ON d.klinik_id = k.klinik_id
    ORDER BY d.nama_dokter;
END$$

-- ========================================================
-- GET PUBLIC KLINIKS (For Registration)
-- ========================================================
DROP PROCEDURE IF EXISTS GetPublicKliniks$$
CREATE PROCEDURE GetPublicKliniks()
BEGIN
    SELECT 
        klinik_id,
        nama_klinik,
        alamat_klinik,
        telepon_klinik
    FROM Klinik
    ORDER BY nama_klinik;
END$$

-- ========================================================
-- GET PUBLIC SPESIALISASI (For Registration)
-- ========================================================
DROP PROCEDURE IF EXISTS GetPublicSpesialisasi$$
CREATE PROCEDURE GetPublicSpesialisasi()
BEGIN
    SELECT 
        spesialisasi_id,
        nama_spesialisasi,
        deskripsi_spesialisasi
    FROM Spesialisasi
    ORDER BY nama_spesialisasi;
END$$

DELIMITER ;

-- ========================================================
-- GRANT EXECUTE PERMISSIONS
-- ========================================================

-- Public procedures (no authentication needed)
GRANT EXECUTE ON PROCEDURE vet_buddy.CheckUsernameAvailability TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.CheckEmailAvailability TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.CheckPawrentPhoneAvailability TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.CheckDokterPhoneAvailability TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.RegisterPawrent TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.RegisterDokter TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetPublicDokters TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetPublicKliniks TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetPublicSpesialisasi TO 'admin_user'@'localhost';

FLUSH PRIVILEGES;