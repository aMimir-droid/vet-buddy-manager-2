-- ========================================================
-- ENHANCED AUDIT LOG SYSTEM
-- Comprehensive audit trail for critical operations
-- ========================================================

USE vet_buddy;

-- ========================================================
-- 1. DROP EXISTING AUDIT LOG TABLE AND RECREATE WITH ENHANCED STRUCTURE
-- ========================================================

DROP TABLE IF EXISTS AuditLog;

CREATE TABLE AuditLog (
    log_id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Primary Key, identitas unik log',
    table_name VARCHAR(50) NOT NULL COMMENT 'Nama tabel yang dimodifikasi',
    action_type ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL COMMENT 'Jenis aksi (INSERT, UPDATE, DELETE)',
    record_id INT NULL COMMENT 'ID record yang dimodifikasi',
    klinik_id INT NULL COMMENT 'ID klinik terkait (untuk filter admin klinik)',
    executed_by VARCHAR(100) NULL COMMENT 'Username yang melakukan aksi',
    user_id INT NULL COMMENT 'ID user yang melakukan aksi',
    role_name VARCHAR(50) NULL COMMENT 'Role user yang melakukan aksi',
    old_data JSON NULL COMMENT 'Data lama sebelum perubahan (JSON)',
    new_data JSON NULL COMMENT 'Data baru setelah perubahan (JSON)',
    changes_summary TEXT NULL COMMENT 'Ringkasan perubahan yang dilakukan',
    ip_address VARCHAR(45) NULL COMMENT 'IP address user (untuk tracking)',
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu eksekusi',
    
    INDEX idx_table_action (table_name, action_type),
    INDEX idx_executed_by (executed_by),
    INDEX idx_executed_at (executed_at),
    INDEX idx_klinik_id (klinik_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB COMMENT='Enhanced audit log table untuk tracking perubahan data';

-- ========================================================
-- 2. HELPER FUNCTION - Get Current User Info
-- ========================================================

DELIMITER $$

DROP FUNCTION IF EXISTS GetCurrentUserInfo$$

CREATE FUNCTION GetCurrentUserInfo(info_type VARCHAR(20))
RETURNS VARCHAR(100)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE result VARCHAR(100);
    DECLARE db_user VARCHAR(100);

    -- Ambil nama user MySQL (misal: 'root' dari 'root@localhost')
    SET db_user = SUBSTRING_INDEX(USER(), '@', 1);

    CASE info_type
        WHEN 'username' THEN
            SELECT username INTO result
            FROM User_Login
            WHERE username = db_user
            LIMIT 1;

            IF result IS NULL THEN
                SET result = db_user;
            END IF;

        WHEN 'user_id' THEN
            SELECT CAST(user_id AS CHAR) INTO result
            FROM User_Login
            WHERE username = db_user
            LIMIT 1;

        WHEN 'role_name' THEN
            SELECT r.role_name INTO result
            FROM User_Login u
            JOIN Role r ON u.role_id = r.role_id
            WHERE u.username = db_user
            LIMIT 1;

        ELSE
            SET result = NULL;
    END CASE;

    IF info_type = 'user_id' THEN
        RETURN result;
    END IF;

    RETURN COALESCE(result, db_user);
END$$

DELIMITER ;


-- ========================================================
-- 3. TRIGGERS FOR KUNJUNGAN (CRITICAL TABLE)
-- ========================================================

DELIMITER $$

-- Trigger INSERT Kunjungan
DROP TRIGGER IF EXISTS trg_audit_kunjungan_insert$$
CREATE TRIGGER trg_audit_kunjungan_insert
AFTER INSERT ON Kunjungan
FOR EACH ROW
BEGIN
    DECLARE v_klinik_id INT;
    
    -- Get klinik_id from new record
    SET v_klinik_id = NEW.klinik_id;
    
    INSERT INTO AuditLog (
        table_name,
        action_type,
        record_id,
        klinik_id,
        executed_by,
        user_id,
        role_name,
        new_data,
        changes_summary
    ) VALUES (
        'Kunjungan',
        'INSERT',
        NEW.kunjungan_id,
        v_klinik_id,
        GetCurrentUserInfo('username'),
        GetCurrentUserInfo('user_id'),
        GetCurrentUserInfo('role_name'),
        JSON_OBJECT(
            'kunjungan_id', NEW.kunjungan_id,
            'klinik_id', NEW.klinik_id,
            'hewan_id', NEW.hewan_id,
            'dokter_id', NEW.dokter_id,
            'tanggal_kunjungan', NEW.tanggal_kunjungan,
            'waktu_kunjungan', NEW.waktu_kunjungan,
            'catatan', NEW.catatan,
            'metode_pembayaran', NEW.metode_pembayaran,
            'booking_id', NEW.booking_id
        ),
        CONCAT('Kunjungan baru dibuat untuk hewan ID: ', NEW.hewan_id, ' oleh dokter ID: ', NEW.dokter_id)
    );
END$$

-- Trigger UPDATE Kunjungan
DROP TRIGGER IF EXISTS trg_audit_kunjungan_update$$
CREATE TRIGGER trg_audit_kunjungan_update
AFTER UPDATE ON Kunjungan
FOR EACH ROW
BEGIN
    DECLARE v_klinik_id INT;
    DECLARE v_changes TEXT DEFAULT '';
    
    SET v_klinik_id = NEW.klinik_id;
    
    -- Build changes summary
    IF OLD.tanggal_kunjungan != NEW.tanggal_kunjungan THEN
        SET v_changes = CONCAT(v_changes, 'Tanggal: ', OLD.tanggal_kunjungan, ' -> ', NEW.tanggal_kunjungan, '; ');
    END IF;
    
    IF OLD.waktu_kunjungan != NEW.waktu_kunjungan THEN
        SET v_changes = CONCAT(v_changes, 'Waktu: ', OLD.waktu_kunjungan, ' -> ', NEW.waktu_kunjungan, '; ');
    END IF;
    
    IF OLD.catatan != NEW.catatan OR (OLD.catatan IS NULL AND NEW.catatan IS NOT NULL) OR (OLD.catatan IS NOT NULL AND NEW.catatan IS NULL) THEN
        SET v_changes = CONCAT(v_changes, 'Catatan diubah; ');
    END IF;
    
    IF OLD.metode_pembayaran != NEW.metode_pembayaran THEN
        SET v_changes = CONCAT(v_changes, 'Metode Pembayaran: ', OLD.metode_pembayaran, ' -> ', NEW.metode_pembayaran, '; ');
    END IF;
    
    INSERT INTO AuditLog (
        table_name,
        action_type,
        record_id,
        klinik_id,
        executed_by,
        user_id,
        role_name,
        old_data,
        new_data,
        changes_summary
    ) VALUES (
        'Kunjungan',
        'UPDATE',
        NEW.kunjungan_id,
        v_klinik_id,
        GetCurrentUserInfo('username'),
        GetCurrentUserInfo('user_id'),
        GetCurrentUserInfo('role_name'),
        JSON_OBJECT(
            'kunjungan_id', OLD.kunjungan_id,
            'klinik_id', OLD.klinik_id,
            'hewan_id', OLD.hewan_id,
            'dokter_id', OLD.dokter_id,
            'tanggal_kunjungan', OLD.tanggal_kunjungan,
            'waktu_kunjungan', OLD.waktu_kunjungan,
            'catatan', OLD.catatan,
            'metode_pembayaran', OLD.metode_pembayaran
        ),
        JSON_OBJECT(
            'kunjungan_id', NEW.kunjungan_id,
            'klinik_id', NEW.klinik_id,
            'hewan_id', NEW.hewan_id,
            'dokter_id', NEW.dokter_id,
            'tanggal_kunjungan', NEW.tanggal_kunjungan,
            'waktu_kunjungan', NEW.waktu_kunjungan,
            'catatan', NEW.catatan,
            'metode_pembayaran', NEW.metode_pembayaran
        ),
        IF(v_changes = '', 'Kunjungan diupdate', v_changes)
    );
END$$

-- Trigger DELETE Kunjungan (Soft Delete)
DROP TRIGGER IF EXISTS trg_audit_kunjungan_delete$$
CREATE TRIGGER trg_audit_kunjungan_delete
AFTER UPDATE ON Kunjungan
FOR EACH ROW
BEGIN
    DECLARE v_klinik_id INT;
    
    -- Only log if deleted_at changed from NULL to a timestamp (soft delete)
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
        SET v_klinik_id = OLD.klinik_id;
        
        INSERT INTO AuditLog (
            table_name,
            action_type,
            record_id,
            klinik_id,
            executed_by,
            user_id,
            role_name,
            old_data,
            changes_summary
        ) VALUES (
            'Kunjungan',
            'DELETE',
            OLD.kunjungan_id,
            v_klinik_id,
            GetCurrentUserInfo('username'),
            GetCurrentUserInfo('user_id'),
            GetCurrentUserInfo('role_name'),
            JSON_OBJECT(
                'kunjungan_id', OLD.kunjungan_id,
                'klinik_id', OLD.klinik_id,
                'hewan_id', OLD.hewan_id,
                'dokter_id', OLD.dokter_id,
                'tanggal_kunjungan', OLD.tanggal_kunjungan,
                'deleted_at', NEW.deleted_at
            ),
            CONCAT('Kunjungan ID: ', OLD.kunjungan_id, ' dihapus (soft delete)')
        );
    END IF;
END$$

-- ========================================================
-- 4. TRIGGERS FOR BOOKING
-- ========================================================

-- Trigger INSERT Booking
DROP TRIGGER IF EXISTS trg_audit_booking_insert$$
CREATE TRIGGER trg_audit_booking_insert
AFTER INSERT ON Booking
FOR EACH ROW
BEGIN
    INSERT INTO AuditLog (
        table_name,
        action_type,
        record_id,
        klinik_id,
        executed_by,
        user_id,
        role_name,
        new_data,
        changes_summary
    ) VALUES (
        'Booking',
        'INSERT',
        NEW.booking_id,
        NEW.klinik_id,
        GetCurrentUserInfo('username'),
        GetCurrentUserInfo('user_id'),
        GetCurrentUserInfo('role_name'),
        JSON_OBJECT(
            'booking_id', NEW.booking_id,
            'klinik_id', NEW.klinik_id,
            'dokter_id', NEW.dokter_id,
            'pawrent_id', NEW.pawrent_id,
            'hewan_id', NEW.hewan_id,
            'tanggal_booking', NEW.tanggal_booking,
            'waktu_booking', NEW.waktu_booking,
            'status', NEW.status
        ),
        CONCAT('Booking baru dibuat untuk tanggal: ', NEW.tanggal_booking, ' jam: ', NEW.waktu_booking)
    );
END$$

-- Trigger UPDATE Booking
DROP TRIGGER IF EXISTS trg_audit_booking_update$$
CREATE TRIGGER trg_audit_booking_update
AFTER UPDATE ON Booking
FOR EACH ROW
BEGIN
    DECLARE v_changes TEXT DEFAULT '';
    
    IF OLD.status != NEW.status THEN
        SET v_changes = CONCAT('Status: ', OLD.status, ' -> ', NEW.status, '; ');
    END IF;
    
    IF OLD.tanggal_booking != NEW.tanggal_booking THEN
        SET v_changes = CONCAT(v_changes, 'Tanggal: ', OLD.tanggal_booking, ' -> ', NEW.tanggal_booking, '; ');
    END IF;
    
    IF OLD.waktu_booking != NEW.waktu_booking THEN
        SET v_changes = CONCAT(v_changes, 'Waktu: ', OLD.waktu_booking, ' -> ', NEW.waktu_booking, '; ');
    END IF;
    
    INSERT INTO AuditLog (
        table_name,
        action_type,
        record_id,
        klinik_id,
        executed_by,
        user_id,
        role_name,
        old_data,
        new_data,
        changes_summary
    ) VALUES (
        'Booking',
        'UPDATE',
        NEW.booking_id,
        NEW.klinik_id,
        GetCurrentUserInfo('username'),
        GetCurrentUserInfo('user_id'),
        GetCurrentUserInfo('role_name'),
        JSON_OBJECT(
            'booking_id', OLD.booking_id,
            'status', OLD.status,
            'tanggal_booking', OLD.tanggal_booking,
            'waktu_booking', OLD.waktu_booking
        ),
        JSON_OBJECT(
            'booking_id', NEW.booking_id,
            'status', NEW.status,
            'tanggal_booking', NEW.tanggal_booking,
            'waktu_booking', NEW.waktu_booking
        ),
        IF(v_changes = '', 'Booking diupdate', v_changes)
    );
END$$

-- ========================================================
-- 5. TRIGGERS FOR HEWAN
-- ========================================================

DROP TRIGGER IF EXISTS trg_audit_hewan_insert$$
CREATE TRIGGER trg_audit_hewan_insert
AFTER INSERT ON Hewan
FOR EACH ROW
BEGIN
    INSERT INTO AuditLog (
        table_name,
        action_type,
        record_id,
        executed_by,
        user_id,
        role_name,
        new_data,
        changes_summary
    ) VALUES (
        'Hewan',
        'INSERT',
        NEW.hewan_id,
        GetCurrentUserInfo('username'),
        GetCurrentUserInfo('user_id'),
        GetCurrentUserInfo('role_name'),
        JSON_OBJECT(
            'hewan_id', NEW.hewan_id,
            'nama_hewan', NEW.nama_hewan,
            'jenis_hewan_id', NEW.jenis_hewan_id,
            'pawrent_id', NEW.pawrent_id,
            'tanggal_lahir', NEW.tanggal_lahir,
            'jenis_kelamin', NEW.jenis_kelamin,
            'status_hidup', NEW.status_hidup
        ),
        CONCAT('Hewan baru ditambahkan: ', NEW.nama_hewan, ' (ID: ', NEW.hewan_id, ')')
    );
END$$

DROP TRIGGER IF EXISTS trg_audit_hewan_update$$
CREATE TRIGGER trg_audit_hewan_update
AFTER UPDATE ON Hewan
FOR EACH ROW
BEGIN
    DECLARE v_changes TEXT DEFAULT '';
    
    IF OLD.status_hidup != NEW.status_hidup THEN
        SET v_changes = CONCAT('Status Hidup: ', OLD.status_hidup, ' -> ', NEW.status_hidup, '; ');
    END IF;
    
    IF OLD.nama_hewan != NEW.nama_hewan THEN
        SET v_changes = CONCAT(v_changes, 'Nama: ', OLD.nama_hewan, ' -> ', NEW.nama_hewan, '; ');
    END IF;
    
    INSERT INTO AuditLog (
        table_name,
        action_type,
        record_id,
        executed_by,
        user_id,
        role_name,
        old_data,
        new_data,
        changes_summary
    ) VALUES (
        'Hewan',
        'UPDATE',
        NEW.hewan_id,
        GetCurrentUserInfo('username'),
        GetCurrentUserInfo('user_id'),
        GetCurrentUserInfo('role_name'),
        JSON_OBJECT(
            'hewan_id', OLD.hewan_id,
            'nama_hewan', OLD.nama_hewan,
            'status_hidup', OLD.status_hidup,
            'tanggal_lahir', OLD.tanggal_lahir
        ),
        JSON_OBJECT(
            'hewan_id', NEW.hewan_id,
            'nama_hewan', NEW.nama_hewan,
            'status_hidup', NEW.status_hidup,
            'tanggal_lahir', NEW.tanggal_lahir
        ),
        IF(v_changes = '', 'Hewan diupdate', v_changes)
    );
END$$

-- ========================================================
-- 6. TRIGGERS FOR DOKTER (Important staff changes)
-- ========================================================

DROP TRIGGER IF EXISTS trg_audit_dokter_update$$
CREATE TRIGGER trg_audit_dokter_update
AFTER UPDATE ON Dokter
FOR EACH ROW
BEGIN
    DECLARE v_changes TEXT DEFAULT '';
    
    IF OLD.is_active != NEW.is_active THEN
        SET v_changes = CONCAT('Status Aktif: ', OLD.is_active, ' -> ', NEW.is_active, '; ');
    END IF;
    
    IF OLD.klinik_id != NEW.klinik_id OR (OLD.klinik_id IS NULL AND NEW.klinik_id IS NOT NULL) OR (OLD.klinik_id IS NOT NULL AND NEW.klinik_id IS NULL) THEN
        SET v_changes = CONCAT(v_changes, 'Klinik: ', COALESCE(OLD.klinik_id, 'NULL'), ' -> ', COALESCE(NEW.klinik_id, 'NULL'), '; ');
    END IF;
    
    INSERT INTO AuditLog (
        table_name,
        action_type,
        record_id,
        klinik_id,
        executed_by,
        user_id,
        role_name,
        old_data,
        new_data,
        changes_summary
    ) VALUES (
        'Dokter',
        'UPDATE',
        NEW.dokter_id,
        NEW.klinik_id,
        GetCurrentUserInfo('username'),
        GetCurrentUserInfo('user_id'),
        GetCurrentUserInfo('role_name'),
        JSON_OBJECT(
            'dokter_id', OLD.dokter_id,
            'nama_dokter', OLD.nama_dokter,
            'klinik_id', OLD.klinik_id,
            'is_active', OLD.is_active
        ),
        JSON_OBJECT(
            'dokter_id', NEW.dokter_id,
            'nama_dokter', NEW.nama_dokter,
            'klinik_id', NEW.klinik_id,
            'is_active', NEW.is_active
        ),
        IF(v_changes = '', 'Dokter diupdate', v_changes)
    );
END$$

-- ========================================================
-- 7. TRIGGERS FOR MUTASI_OBAT (Stock movements)
-- ========================================================

DROP TRIGGER IF EXISTS trg_audit_mutasi_obat_insert$$
CREATE TRIGGER trg_audit_mutasi_obat_insert
AFTER INSERT ON Mutasi_Obat
FOR EACH ROW
BEGIN
    INSERT INTO AuditLog (
        table_name,
        action_type,
        record_id,
        klinik_id,
        executed_by,
        user_id,
        role_name,
        new_data,
        changes_summary
    ) VALUES (
        'Mutasi_Obat',
        'INSERT',
        NEW.mutasi_id,
        NEW.klinik_id,
        GetCurrentUserInfo('username'),
        NEW.user_id,
        GetCurrentUserInfo('role_name'),
        JSON_OBJECT(
            'mutasi_id', NEW.mutasi_id,
            'obat_id', NEW.obat_id,
            'klinik_id', NEW.klinik_id,
            'tipe_mutasi', NEW.tipe_mutasi,
            'qty', NEW.qty,
            'sumber_mutasi', NEW.sumber_mutasi
        ),
        CONCAT('Mutasi obat: ', NEW.tipe_mutasi, ' - Qty: ', NEW.qty, ' - Sumber: ', NEW.sumber_mutasi)
    );
END$$

DELIMITER ;

-- ========================================================
-- 8. STORED PROCEDURES FOR AUDIT LOG QUERIES
-- ========================================================

DELIMITER $$

-- Get all audit logs with filters
DROP PROCEDURE IF EXISTS GetAuditLogs$$
CREATE PROCEDURE GetAuditLogs(
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_table_name VARCHAR(50),
    IN p_action_type VARCHAR(20),
    IN p_klinik_id INT,
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    SELECT 
        log_id,
        table_name,
        action_type,
        record_id,
        klinik_id,
        executed_by,
        user_id,
        role_name,
        old_data,
        new_data,
        changes_summary,
        executed_at
    FROM AuditLog
    WHERE 1=1
      AND (p_start_date IS NULL OR DATE(executed_at) >= p_start_date)
      AND (p_end_date IS NULL OR DATE(executed_at) <= p_end_date)
      AND (p_table_name IS NULL OR table_name = p_table_name)
      AND (p_action_type IS NULL OR action_type = p_action_type)
      AND (p_klinik_id IS NULL OR klinik_id = p_klinik_id)
    ORDER BY executed_at DESC
    LIMIT p_limit OFFSET p_offset;
END$$

-- Get audit logs for Admin Klinik (filtered by klinik_id)
DROP PROCEDURE IF EXISTS GetAuditLogsByKlinik$$
CREATE PROCEDURE GetAuditLogsByKlinik(
    IN p_klinik_id INT,
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    SELECT 
        log_id,
        table_name,
        action_type,
        record_id,
        executed_by,
        role_name,
        changes_summary,
        executed_at
    FROM AuditLog
    WHERE klinik_id = p_klinik_id
      AND (p_start_date IS NULL OR DATE(executed_at) >= p_start_date)
      AND (p_end_date IS NULL OR DATE(executed_at) <= p_end_date)
    ORDER BY executed_at DESC
    LIMIT p_limit OFFSET p_offset;
END$$

-- Get audit log statistics
DROP PROCEDURE IF EXISTS GetAuditLogStats$$
CREATE PROCEDURE GetAuditLogStats(IN p_klinik_id INT)
BEGIN
    SELECT 
        COUNT(*) as total_logs,
        SUM(CASE WHEN action_type = 'INSERT' THEN 1 ELSE 0 END) as total_inserts,
        SUM(CASE WHEN action_type = 'UPDATE' THEN 1 ELSE 0 END) as total_updates,
        SUM(CASE WHEN action_type = 'DELETE' THEN 1 ELSE 0 END) as total_deletes,
        COUNT(DISTINCT table_name) as total_tables,
        COUNT(DISTINCT executed_by) as total_users,
        COUNT(CASE WHEN DATE(executed_at) = CURDATE() THEN 1 END) as today_logs,
        COUNT(CASE WHEN DATE(executed_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as week_logs
    FROM AuditLog
    WHERE p_klinik_id IS NULL OR klinik_id = p_klinik_id;
END$$

-- Get logs by table
DROP PROCEDURE IF EXISTS GetAuditLogsByTable$$
CREATE PROCEDURE GetAuditLogsByTable(IN p_klinik_id INT)
BEGIN
    SELECT 
        table_name,
        COUNT(*) as count,
        SUM(CASE WHEN action_type = 'INSERT' THEN 1 ELSE 0 END) as inserts,
        SUM(CASE WHEN action_type = 'UPDATE' THEN 1 ELSE 0 END) as updates,
        SUM(CASE WHEN action_type = 'DELETE' THEN 1 ELSE 0 END) as deletes,
        MAX(executed_at) as last_activity
    FROM AuditLog
    WHERE p_klinik_id IS NULL OR klinik_id = p_klinik_id
    GROUP BY table_name
    ORDER BY count DESC;
END$$

-- Get logs by user
DROP PROCEDURE IF EXISTS GetAuditLogsByUser$$
CREATE PROCEDURE GetAuditLogsByUser(IN p_klinik_id INT)
BEGIN
    SELECT 
        executed_by,
        role_name,
        COUNT(*) as count,
        MAX(executed_at) as last_activity
    FROM AuditLog
    WHERE p_klinik_id IS NULL OR klinik_id = p_klinik_id
    GROUP BY executed_by, role_name
    ORDER BY count DESC;
END$$

-- Get log detail by ID
DROP PROCEDURE IF EXISTS GetAuditLogById$$
CREATE PROCEDURE GetAuditLogById(IN p_log_id INT)
BEGIN
    SELECT 
        log_id,
        table_name,
        action_type,
        record_id,
        klinik_id,
        executed_by,
        user_id,
        role_name,
        old_data,
        new_data,
        changes_summary,
        executed_at
    FROM AuditLog
    WHERE log_id = p_log_id;
END$$

DELIMITER ;

-- ========================================================
-- 9. GRANT EXECUTE PERMISSIONS
-- ========================================================

GRANT EXECUTE ON PROCEDURE vet_buddy.GetAuditLogs TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAuditLogsByKlinik TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAuditLogStats TO 'admin_user'@'localhost', 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAuditLogsByTable TO 'admin_user'@'localhost', 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAuditLogsByUser TO 'admin_user'@'localhost', 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAuditLogById TO 'admin_user'@'localhost', 'admin_klinik_user'@'localhost';

FLUSH PRIVILEGES;

-- ========================================================
-- VERIFICATION
-- ========================================================
-- SHOW TRIGGERS;
-- SELECT * FROM AuditLog ORDER BY executed_at DESC LIMIT 10;