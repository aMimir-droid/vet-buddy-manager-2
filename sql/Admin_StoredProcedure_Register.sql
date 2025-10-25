-- ========================================================
-- REGISTER STORED PROCEDURES
-- Database: vet_buddy
-- ========================================================

USE vet_buddy;

DELIMITER $$

-- CHECK USERNAME AVAILABILITY (only non-deleted users)
DROP PROCEDURE IF EXISTS CheckUsernameAvailability$$
CREATE PROCEDURE CheckUsernameAvailability(
    IN p_username VARCHAR(50)
)
BEGIN
    SELECT COUNT(*) as count
    FROM User_Login
    WHERE username = p_username
      AND deleted_at IS NULL;
END$$

-- CHECK EMAIL AVAILABILITY (only non-deleted users)
DROP PROCEDURE IF EXISTS CheckEmailAvailability$$
CREATE PROCEDURE CheckEmailAvailability(
    IN p_email VARCHAR(100)
)
BEGIN
    SELECT COUNT(*) as count
    FROM User_Login
    WHERE email = p_email
      AND deleted_at IS NULL;
END$$

-- CHECK PHONE NUMBER AVAILABILITY (PAWRENT) (only non-deleted pawrents)
DROP PROCEDURE IF EXISTS CheckPawrentPhoneAvailability$$
CREATE PROCEDURE CheckPawrentPhoneAvailability(
    IN p_nomor_hp VARCHAR(15)
)
BEGIN
    SELECT COUNT(*) as count
    FROM Pawrent
    WHERE nomor_hp = p_nomor_hp
      AND deleted_at IS NULL;
END$$

-- CHECK PHONE NUMBER AVAILABILITY (DOKTER) (only non-deleted dokters)
DROP PROCEDURE IF EXISTS CheckDokterPhoneAvailability$$
CREATE PROCEDURE CheckDokterPhoneAvailability(
    IN p_telepon_dokter VARCHAR(15)
)
BEGIN
    SELECT COUNT(*) as count
    FROM Dokter
    WHERE telepon_dokter = p_telepon_dokter
      AND deleted_at IS NULL;
END$$

-- REGISTER PAWRENT (respect soft-deleted rows)
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
    DECLARE v_username_active INT DEFAULT 0;
    DECLARE v_username_soft INT DEFAULT 0;
    DECLARE v_email_active INT DEFAULT 0;
    DECLARE v_email_soft INT DEFAULT 0;
    DECLARE v_hp_exists INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Check if dokter exists and active
    IF p_dokter_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_dokter_exists
        FROM Dokter
        WHERE dokter_id = p_dokter_id
          AND deleted_at IS NULL;

        IF v_dokter_exists = 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Dokter tidak ditemukan';
        END IF;
    END IF;

    -- Single query to check username/email status (active vs soft-deleted)
    SELECT
        MAX(CASE WHEN username = p_username AND deleted_at IS NULL THEN 1 ELSE 0 END),
        MAX(CASE WHEN username = p_username AND deleted_at IS NOT NULL THEN 1 ELSE 0 END),
        MAX(CASE WHEN email    = p_email    AND deleted_at IS NULL THEN 1 ELSE 0 END),
        MAX(CASE WHEN email    = p_email    AND deleted_at IS NOT NULL THEN 1 ELSE 0 END)
    INTO
        v_username_active,
        v_username_soft,
        v_email_active,
        v_email_soft
    FROM User_Login
    WHERE username = p_username OR email = p_email;

    IF v_username_active > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Username sudah terdaftar';
    ELSEIF v_username_soft > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Username sudah pernah terdaftar dan telah dihapus. Pilih username lain atau hubungi admin untuk restore.';
    END IF;

    IF v_email_active > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Email sudah terdaftar';
    ELSEIF v_email_soft > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Email sudah pernah terdaftar dan telah dihapus. Gunakan email lain atau hubungi admin untuk restore.';
    END IF;

    -- Single check untuk nomor HP pada Pawrent (hanya active)
    SELECT COUNT(*) INTO v_hp_exists
    FROM Pawrent
    WHERE nomor_hp = p_nomor_hp
      AND deleted_at IS NULL;

    IF v_hp_exists > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Nomor HP sudah terdaftar';
    END IF;

    -- Insert into Pawrent table
    INSERT INTO Pawrent (
        nama_depan_pawrent,
        nama_belakang_pawrent,
        alamat_pawrent,
        kota_pawrent,
        kode_pos_pawrent,
        nomor_hp,
        dokter_id,
        deleted_at
    ) VALUES (
        p_nama_depan_pawrent,
        p_nama_belakang_pawrent,
        p_alamat_pawrent,
        p_kota_pawrent,
        p_kode_pos_pawrent,
        p_nomor_hp,
        p_dokter_id,
        NULL
    );

    SET v_pawrent_id = LAST_INSERT_ID();

    -- Insert into User_Login table
    INSERT INTO User_Login (
        username,
        email,
        password_hash,
        role_id,
        pawrent_id,
        is_active,
        deleted_at
    ) VALUES (
        p_username,
        p_email,
        p_password_hash,
        3, -- Pawrent role (pastikan konsisten dengan tabel Role)
        v_pawrent_id,
        TRUE,
        NULL
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

-- REGISTER DOKTER (respect soft-delete)
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
    DECLARE v_username_active INT DEFAULT 0;
    DECLARE v_username_soft INT DEFAULT 0;
    DECLARE v_email_active INT DEFAULT 0;
    DECLARE v_email_soft INT DEFAULT 0;
    DECLARE v_tel_exists INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Single query to check username/email status
    SELECT
        MAX(CASE WHEN username = p_username AND deleted_at IS NULL THEN 1 ELSE 0 END),
        MAX(CASE WHEN username = p_username AND deleted_at IS NOT NULL THEN 1 ELSE 0 END),
        MAX(CASE WHEN email    = p_email    AND deleted_at IS NULL THEN 1 ELSE 0 END),
        MAX(CASE WHEN email    = p_email    AND deleted_at IS NOT NULL THEN 1 ELSE 0 END)
    INTO
        v_username_active,
        v_username_soft,
        v_email_active,
        v_email_soft
    FROM User_Login
    WHERE username = p_username OR email = p_email;

    IF v_username_active > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Username sudah terdaftar';
    ELSEIF v_username_soft > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Username sudah pernah terdaftar dan telah dihapus. Pilih username lain atau hubungi admin untuk restore.';
    END IF;

    IF v_email_active > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Email sudah terdaftar';
    ELSEIF v_email_soft > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Email sudah pernah terdaftar dan telah dihapus. Gunakan email lain atau hubungi admin untuk restore.';
    END IF;

    -- Single check untuk telepon dokter (active only)
    IF p_telepon_dokter IS NOT NULL AND p_telepon_dokter <> '' THEN
        SELECT COUNT(*) INTO v_tel_exists
        FROM Dokter
        WHERE telepon_dokter = p_telepon_dokter
          AND deleted_at IS NULL;

        IF v_tel_exists > 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Nomor telepon dokter sudah terdaftar';
        END IF;
    END IF;

    -- Insert into Dokter table
    INSERT INTO Dokter (
        title_dokter,
        nama_dokter,
        telepon_dokter,
        tanggal_mulai_kerja,
        spesialisasi_id,
        klinik_id,
        deleted_at
    ) VALUES (
        p_title_dokter,
        p_nama_dokter,
        p_telepon_dokter,
        p_tanggal_mulai_kerja,
        p_spesialisasi_id,
        p_klinik_id,
        NULL
    );

    SET v_dokter_id = LAST_INSERT_ID();

    -- Insert into User_Login table
    INSERT INTO User_Login (
        username,
        email,
        password_hash,
        role_id,
        dokter_id,
        is_active,
        deleted_at
    ) VALUES (
        p_username,
        p_email,
        p_password_hash,
        2, -- Dokter role
        v_dokter_id,
        TRUE,
        NULL
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

-- GET PUBLIC DOKTERS (only active dokters for registration)
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
    WHERE d.deleted_at IS NULL
    ORDER BY d.nama_dokter;
END$$

-- GetPublicKliniks and GetPublicSpesialisasi left as-is (they have no deleted_at in schema)
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

-- SOFT-DELETE USER (mark User_Login.deleted_at, set is_active = FALSE, and soft-delete related Dokter/Pawrent)
DROP PROCEDURE IF EXISTS SoftDeleteUser$$
CREATE PROCEDURE SoftDeleteUser(
    IN p_user_id INT,
    IN p_deleted_by VARCHAR(50) -- optional for AuditLog.executed_by
)
BEGIN
    DECLARE v_role INT;
    DECLARE v_dokter_id INT;
    DECLARE v_pawrent_id INT;
    DECLARE v_exists INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    SELECT role_id, dokter_id, pawrent_id
    INTO v_role, v_dokter_id, v_pawrent_id
    FROM User_Login
    WHERE user_id = p_user_id
      AND deleted_at IS NULL
    LIMIT 1;

    IF v_role IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'User tidak ditemukan atau sudah dihapus';
    END IF;

    -- Soft-delete the user
    UPDATE User_Login
    SET deleted_at = CURRENT_TIMESTAMP,
        is_active = FALSE
    WHERE user_id = p_user_id
      AND deleted_at IS NULL;

    -- Soft-delete associated Dokter (if any)
    IF v_dokter_id IS NOT NULL THEN
        UPDATE Dokter
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE dokter_id = v_dokter_id
          AND deleted_at IS NULL;
    END IF;

    -- Soft-delete associated Pawrent (if any)
    IF v_pawrent_id IS NOT NULL THEN
        UPDATE Pawrent
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE pawrent_id = v_pawrent_id
          AND deleted_at IS NULL;
    END IF;

    -- Optionally insert audit log
    INSERT INTO AuditLog (table_name, action_type, executed_by, old_data, new_data)
    VALUES ('User_Login', 'DELETE', p_deleted_by,
            CONCAT('user_id=', p_user_id), CONCAT('deleted_at=', CURRENT_TIMESTAMP));

    COMMIT;

    SELECT ROW_COUNT() AS affected_rows;
END$$

DELIMITER ;

-- GRANTS (update to include new SoftDeleteUser proc)
GRANT EXECUTE ON PROCEDURE vet_buddy.CheckUsernameAvailability TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.CheckEmailAvailability TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.CheckPawrentPhoneAvailability TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.CheckDokterPhoneAvailability TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.RegisterPawrent TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.RegisterDokter TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetPublicDokters TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetPublicKliniks TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetPublicSpesialisasi TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.SoftDeleteUser TO 'admin_user'@'localhost';

FLUSH PRIVILEGES;