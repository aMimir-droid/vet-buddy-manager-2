DELIMITER $$

-- ========================================================
-- USER MANAGEMENT STORED PROCEDURES
-- ========================================================

-- ========================================================
-- GET ALL USERS
-- ========================================================
DROP PROCEDURE IF EXISTS GetAllUsers$$
CREATE PROCEDURE GetAllUsers()
BEGIN
    SELECT 
        u.user_id,
        u.username,
        u.email,
        u.role_id,
        u.is_active,
        u.last_login,
        u.created_at,
        u.updated_at,
        u.dokter_id,
        u.pawrent_id,
        COALESCE(r.role_name, 'Unknown') as role_name,
        COALESCE(r.description, '') as role_description,
        d.nama_dokter,
        d.title_dokter,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) as nama_pawrent,
        p.nomor_hp as telepon_pawrent
    FROM User_Login u
    LEFT JOIN Role r ON u.role_id = r.role_id
    LEFT JOIN Dokter d ON u.dokter_id = d.dokter_id
    LEFT JOIN Pawrent p ON u.pawrent_id = p.pawrent_id
    ORDER BY u.created_at DESC;
END$$

-- ========================================================
-- GET USER BY ID
-- ========================================================
DROP PROCEDURE IF EXISTS GetUserById$$
CREATE PROCEDURE GetUserById(IN p_user_id INT)
BEGIN
    SELECT 
        u.user_id,
        u.username,
        u.email,
        u.role_id,
        u.is_active,
        u.last_login,
        u.created_at,
        u.updated_at,
        u.dokter_id,
        u.pawrent_id,
        COALESCE(r.role_name, 'Unknown') as role_name,
        COALESCE(r.description, '') as role_description,
        d.nama_dokter,
        d.title_dokter,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) as nama_pawrent,
        p.nomor_hp as telepon_pawrent
    FROM User_Login u
    LEFT JOIN Role r ON u.role_id = r.role_id
    LEFT JOIN Dokter d ON u.dokter_id = d.dokter_id
    LEFT JOIN Pawrent p ON u.pawrent_id = p.pawrent_id
    WHERE u.user_id = p_user_id;
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
-- GET AVAILABLE DOCTORS (for linking to user)
-- ========================================================
DROP PROCEDURE IF EXISTS GetAvailableDoctors$$
CREATE PROCEDURE GetAvailableDoctors(IN p_current_dokter_id INT)
BEGIN
    SELECT 
        d.dokter_id,
        d.nama_dokter,
        d.title_dokter,
        u.user_id
    FROM Dokter d
    LEFT JOIN User_Login u ON d.dokter_id = u.dokter_id
    WHERE u.user_id IS NULL 
       OR (p_current_dokter_id IS NOT NULL AND d.dokter_id = p_current_dokter_id)
    ORDER BY d.nama_dokter;
END$$

-- ========================================================
-- GET AVAILABLE PAWRENTS (for linking to user)
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
    LEFT JOIN User_Login u ON p.pawrent_id = u.pawrent_id
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
    
    -- Check for duplicate dokter_id
    IF p_dokter_id IS NOT NULL THEN
        SELECT COUNT(*) INTO duplicate_check
        FROM User_Login
        WHERE dokter_id = p_dokter_id;
        
        IF duplicate_check > 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Dokter ini sudah terhubung dengan user lain';
        END IF;
    END IF;
    
    -- Check for duplicate pawrent_id
    IF p_pawrent_id IS NOT NULL THEN
        SELECT COUNT(*) INTO duplicate_check
        FROM User_Login
        WHERE pawrent_id = p_pawrent_id;
        
        IF duplicate_check > 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Pawrent ini sudah terhubung dengan user lain';
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
        u.is_active,
        u.created_at,
        u.dokter_id,
        u.pawrent_id,
        COALESCE(r.role_name, 'Unknown') as role_name,
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
    
    -- Check for duplicate dokter_id (excluding current user)
    IF p_dokter_id IS NOT NULL THEN
        SELECT COUNT(*) INTO duplicate_check
        FROM User_Login
        WHERE dokter_id = p_dokter_id AND user_id != p_user_id;
        
        IF duplicate_check > 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Dokter ini sudah terhubung dengan user lain';
        END IF;
    END IF;
    
    -- Check for duplicate pawrent_id (excluding current user)
    IF p_pawrent_id IS NOT NULL THEN
        SELECT COUNT(*) INTO duplicate_check
        FROM User_Login
        WHERE pawrent_id = p_pawrent_id AND user_id != p_user_id;
        
        IF duplicate_check > 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Pawrent ini sudah terhubung dengan user lain';
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
            pawrent_id = p_pawrent_id,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = p_user_id;
    ELSE
        UPDATE User_Login
        SET 
            username = p_username,
            email = p_email,
            role_id = p_role_id,
            is_active = p_is_active,
            dokter_id = p_dokter_id,
            pawrent_id = p_pawrent_id,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = p_user_id;
    END IF;
    
    -- Return updated user with joined data
    SELECT 
        u.user_id,
        u.username,
        u.email,
        u.role_id,
        u.is_active,
        u.updated_at,
        u.dokter_id,
        u.pawrent_id,
        COALESCE(r.role_name, 'Unknown') as role_name,
        d.nama_dokter,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) as nama_pawrent
    FROM User_Login u
    LEFT JOIN Role r ON u.role_id = r.role_id
    LEFT JOIN Dokter d ON u.dokter_id = d.dokter_id
    LEFT JOIN Pawrent p ON u.pawrent_id = p.pawrent_id
    WHERE u.user_id = p_user_id;
END$$

-- ========================================================
-- DELETE USER
-- ========================================================
DROP PROCEDURE IF EXISTS DeleteUser$$
CREATE PROCEDURE DeleteUser(IN p_user_id INT)
BEGIN
    DECLARE rows_affected INT;
    
    DELETE FROM User_Login 
    WHERE user_id = p_user_id;
    
    SET rows_affected = ROW_COUNT();
    
    SELECT rows_affected as affected_rows;
END$$

-- ========================================================
-- TOGGLE USER ACTIVE STATUS
-- ========================================================
DROP PROCEDURE IF EXISTS ToggleUserActiveStatus$$
CREATE PROCEDURE ToggleUserActiveStatus(IN p_user_id INT)
BEGIN
    UPDATE User_Login
    SET is_active = NOT is_active,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = p_user_id;
    
    -- Return updated user
    SELECT 
        u.user_id,
        u.username,
        u.is_active,
        u.updated_at
    FROM User_Login u
    WHERE u.user_id = p_user_id;
END$$

-- ========================================================
-- GET USER STATISTICS
-- ========================================================
DROP PROCEDURE IF EXISTS GetUserStatistics$$
CREATE PROCEDURE GetUserStatistics()
BEGIN
    SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_users,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_users,
        SUM(CASE WHEN role_id = 1 THEN 1 ELSE 0 END) as admin_count,
        SUM(CASE WHEN role_id = 2 THEN 1 ELSE 0 END) as vet_count,
        SUM(CASE WHEN role_id = 3 THEN 1 ELSE 0 END) as pawrent_count,
        COUNT(CASE WHEN DATE(last_login) = CURDATE() THEN 1 END) as today_logins,
        COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today_registrations
    FROM User_Login;
END$$

DELIMITER ;