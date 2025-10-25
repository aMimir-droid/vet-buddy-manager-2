DELIMITER $$

-- ========================================================
-- USER MANAGEMENT STORED PROCEDURES
-- ========================================================

-- ========================================================
-- GET ALL USERS (exclude soft-deleted)
-- ========================================================
DROP PROCEDURE IF EXISTS GetAllUsers$$
CREATE PROCEDURE GetAllUsers()
BEGIN
    SELECT 
        u.user_id,
        u.username,
        u.email,
        u.role_id,
        r.role_name,
        u.is_active,
        u.last_login,
        u.created_at,
        u.dokter_id,
        u.pawrent_id,
        d.nama_dokter,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) as nama_pawrent,
        p.nomor_hp as telepon_pawrent
    FROM User_Login u
    LEFT JOIN Role r ON u.role_id = r.role_id
    LEFT JOIN Dokter d ON u.dokter_id = d.dokter_id
    LEFT JOIN Pawrent p ON u.pawrent_id = p.pawrent_id
    WHERE u.deleted_at IS NULL
    ORDER BY u.created_at DESC;
END$$

-- ========================================================
-- GET USER BY ID (exclude soft-deleted)
-- ========================================================
DROP PROCEDURE IF EXISTS GetUserById$$
CREATE PROCEDURE GetUserById(IN p_user_id INT)
BEGIN
    SELECT 
        u.user_id,
        u.username,
        u.email,
        u.role_id,
        r.role_name,
        u.is_active,
        u.last_login,
        u.created_at,
        u.dokter_id,
        u.pawrent_id,
        d.nama_dokter,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) as nama_pawrent,
        p.nomor_hp as telepon_pawrent
    FROM User_Login u
    LEFT JOIN Role r ON u.role_id = r.role_id
    LEFT JOIN Dokter d ON u.dokter_id = d.dokter_id
    LEFT JOIN Pawrent p ON u.pawrent_id = p.pawrent_id
    WHERE u.user_id = p_user_id
      AND u.deleted_at IS NULL;
END$$

-- ========================================================
-- GET ALL ROLES
-- ========================================================
DROP PROCEDURE IF EXISTS GetAllRoles$$
CREATE PROCEDURE GetAllRoles()
BEGIN
    SELECT 
        role_id, 
        role_name,
        description 
    FROM Role 
    ORDER BY role_id;
END$$

-- ========================================================
-- GET AVAILABLE DOCTORS (exclude users that are soft-deleted)
-- ========================================================
DROP PROCEDURE IF EXISTS GetAvailableDoctors$$
CREATE PROCEDURE GetAvailableDoctors(IN p_current_dokter_id INT)
BEGIN
    SELECT 
        d.dokter_id,
        CONCAT(d.title_dokter, ' ', d.nama_dokter) as nama_dokter,
        d.telepon_dokter,
        u.user_id
    FROM Dokter d
    LEFT JOIN User_Login u ON d.dokter_id = u.dokter_id AND u.deleted_at IS NULL
    WHERE u.user_id IS NULL 
       OR (p_current_dokter_id IS NOT NULL AND d.dokter_id = p_current_dokter_id)
    ORDER BY d.nama_dokter;
END$$

-- ========================================================
-- GET AVAILABLE PAWRENTS (exclude users that are soft-deleted)
-- ========================================================
DROP PROCEDURE IF EXISTS GetAvailablePawrents$$
CREATE PROCEDURE GetAvailablePawrents(IN p_current_pawrent_id INT)
BEGIN
    SELECT 
        p.pawrent_id,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) as nama_pawrent,
        p.nomor_hp,
        u.user_id
    FROM Pawrent p
    LEFT JOIN User_Login u ON p.pawrent_id = u.pawrent_id AND u.deleted_at IS NULL
    WHERE u.user_id IS NULL 
       OR (p_current_pawrent_id IS NOT NULL AND p.pawrent_id = p_current_pawrent_id)
    ORDER BY p.nama_depan_pawrent, p.nama_belakang_pawrent;
END$$

-- ========================================================
-- CREATE USER
-- ========================================================
DROP PROCEDURE IF EXISTS CreateUser$$
CREATE PROCEDURE CreateUser(
    IN p_username VARCHAR(50),
    IN p_email VARCHAR(100),
    IN p_password_hash VARCHAR(255),
    IN p_role_id INT,
    IN p_is_active BOOLEAN,
    IN p_dokter_id INT,
    IN p_pawrent_id INT
)
BEGIN
    DECLARE new_user_id INT;
    DECLARE duplicate_check INT;
    
    -- Validate username tidak duplikat
    SELECT COUNT(*) INTO duplicate_check
    FROM User_Login
    WHERE username = p_username;
    
    IF duplicate_check > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Username sudah digunakan';
    END IF;
    
    -- Validate email tidak duplikat
    SELECT COUNT(*) INTO duplicate_check
    FROM User_Login
    WHERE email = p_email;
    
    IF duplicate_check > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Email sudah terdaftar';
    END IF;
    
    -- Check for duplicate dokter_id
    IF p_dokter_id IS NOT NULL THEN
        SELECT COUNT(*) INTO duplicate_check
        FROM User_Login
        WHERE dokter_id = p_dokter_id;
        
        IF duplicate_check > 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Dokter sudah memiliki akun login';
        END IF;
    END IF;
    
    -- Check for duplicate pawrent_id
    IF p_pawrent_id IS NOT NULL THEN
        SELECT COUNT(*) INTO duplicate_check
        FROM User_Login
        WHERE pawrent_id = p_pawrent_id;
        
        IF duplicate_check > 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Pawrent sudah memiliki akun login';
        END IF;
    END IF;
    
    -- Insert new user
    INSERT INTO User_Login (
        username, 
        email, 
        password_hash, 
        role_id, 
        is_active,
        dokter_id,
        pawrent_id
    )
    VALUES (
        p_username, 
        p_email, 
        p_password_hash, 
        p_role_id, 
        p_is_active,
        p_dokter_id,
        p_pawrent_id
    );
    
    SET new_user_id = LAST_INSERT_ID();
    
    -- Return the new user with joined data
    SELECT 
        u.user_id,
        u.username,
        u.email,
        u.role_id,
        r.role_name,
        u.is_active,
        u.dokter_id,
        u.pawrent_id,
        d.nama_dokter,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) as nama_pawrent
    FROM User_Login u
    LEFT JOIN Role r ON u.role_id = r.role_id
    LEFT JOIN Dokter d ON u.dokter_id = d.dokter_id
    LEFT JOIN Pawrent p ON u.pawrent_id = p.pawrent_id
    WHERE u.user_id = new_user_id;
END$$

-- ========================================================
-- UPDATE USER
-- ========================================================
DROP PROCEDURE IF EXISTS UpdateUser$$
CREATE PROCEDURE UpdateUser(
    IN p_user_id INT,
    IN p_username VARCHAR(50),
    IN p_email VARCHAR(100),
    IN p_password_hash VARCHAR(255),
    IN p_role_id INT,
    IN p_is_active BOOLEAN,
    IN p_dokter_id INT,
    IN p_pawrent_id INT
)
BEGIN
    DECLARE duplicate_check INT;
    
    -- Validate username tidak duplikat (excluding current user)
    SELECT COUNT(*) INTO duplicate_check
    FROM User_Login
    WHERE username = p_username AND user_id != p_user_id;
    
    IF duplicate_check > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Username sudah digunakan';
    END IF;
    
    -- Validate email tidak duplikat (excluding current user)
    SELECT COUNT(*) INTO duplicate_check
    FROM User_Login
    WHERE email = p_email AND user_id != p_user_id;
    
    IF duplicate_check > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Email sudah terdaftar';
    END IF;
    
    -- Check for duplicate dokter_id (excluding current user)
    IF p_dokter_id IS NOT NULL THEN
        SELECT COUNT(*) INTO duplicate_check
        FROM User_Login
        WHERE dokter_id = p_dokter_id AND user_id != p_user_id;
        
        IF duplicate_check > 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Dokter sudah memiliki akun login';
        END IF;
    END IF;
    
    -- Check for duplicate pawrent_id (excluding current user)
    IF p_pawrent_id IS NOT NULL THEN
        SELECT COUNT(*) INTO duplicate_check
        FROM User_Login
        WHERE pawrent_id = p_pawrent_id AND user_id != p_user_id;
        
        IF duplicate_check > 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Pawrent sudah memiliki akun login';
        END IF;
    END IF;
    
    -- Update user (conditional password update)
    IF p_password_hash IS NOT NULL AND p_password_hash != '' THEN
        UPDATE User_Login
        SET 
            username = p_username,
            email = p_email,
            password_hash = p_password_hash,
            role_id = p_role_id,
            is_active = p_is_active,
            dokter_id = p_dokter_id,
            pawrent_id = p_pawrent_id
        WHERE user_id = p_user_id;
    ELSE
        UPDATE User_Login
        SET 
            username = p_username,
            email = p_email,
            role_id = p_role_id,
            is_active = p_is_active,
            dokter_id = p_dokter_id,
            pawrent_id = p_pawrent_id
        WHERE user_id = p_user_id;
    END IF;
    
    -- Return updated user with joined data
    SELECT 
        u.user_id,
        u.username,
        u.email,
        u.role_id,
        r.role_name,
        u.is_active,
        u.dokter_id,
        u.pawrent_id,
        d.nama_dokter,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) as nama_pawrent
    FROM User_Login u
    LEFT JOIN Role r ON u.role_id = r.role_id
    LEFT JOIN Dokter d ON u.dokter_id = d.dokter_id
    LEFT JOIN Pawrent p ON u.pawrent_id = p.pawrent_id
    WHERE u.user_id = p_user_id;
END$$

-- ========================================================
-- DELETE USER (soft delete, mirip dengan DeleteObat)
-- ========================================================
DROP PROCEDURE IF EXISTS DeleteUser$$
CREATE PROCEDURE DeleteUser(IN p_user_id INT)
BEGIN
    DECLARE user_exists INT DEFAULT 0;
    DECLARE rows_affected INT DEFAULT 0;

    -- Check if user exists and not already soft-deleted
    SELECT COUNT(*) INTO user_exists
    FROM User_Login
    WHERE user_id = p_user_id
      AND deleted_at IS NULL;

    IF user_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'User tidak ditemukan atau sudah dihapus';
    END IF;

    -- Soft delete user
    UPDATE User_Login
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE user_id = p_user_id
      AND deleted_at IS NULL;

    SET rows_affected = ROW_COUNT();

    SELECT rows_affected AS affected_rows;
END$$

-- ========================================================
-- TOGGLE USER ACTIVE STATUS (only for non-deleted users)
-- ========================================================
DROP PROCEDURE IF EXISTS ToggleUserActiveStatus$$
CREATE PROCEDURE ToggleUserActiveStatus(IN p_user_id INT)
BEGIN
    DECLARE user_exists INT DEFAULT 0;

    SELECT COUNT(*) INTO user_exists
    FROM User_Login
    WHERE user_id = p_user_id
      AND deleted_at IS NULL;

    IF user_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'User tidak ditemukan atau sudah dihapus';
    END IF;

    UPDATE User_Login
    SET is_active = NOT is_active
    WHERE user_id = p_user_id
      AND deleted_at IS NULL;
    
    -- Return updated user
    SELECT 
        u.user_id,
        u.username,
        u.email,
        u.is_active,
        r.role_name
    FROM User_Login u
    LEFT JOIN Role r ON u.role_id = r.role_id
    WHERE u.user_id = p_user_id
      AND u.deleted_at IS NULL;
END$$

DELIMITER ;