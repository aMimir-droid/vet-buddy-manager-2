-- ========================================================
-- TRIGGERS untuk Validasi dan Audit Trail
-- Database: vet_buddy
-- ========================================================

DELIMITER $$

-- ========================================================
-- 1. TRIGGERS untuk Validasi Kunjungan
-- ========================================================

-- Validate tanggal kunjungan saat INSERT
DROP TRIGGER IF EXISTS trg_validate_tanggal_kunjungan_insert$$
CREATE TRIGGER trg_validate_tanggal_kunjungan_insert
BEFORE INSERT ON Kunjungan
FOR EACH ROW
BEGIN
    -- Pastikan tanggal kunjungan tidak di masa depan
    IF NEW.tanggal_kunjungan > CURDATE() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Error: Tanggal kunjungan tidak boleh di masa depan.';
    END IF;
    
    -- Pastikan waktu kunjungan tidak kosong
    IF NEW.waktu_kunjungan IS NULL THEN
        SET NEW.waktu_kunjungan = CURTIME();
    END IF;
    
    -- Pastikan total biaya tidak negatif
    IF NEW.total_biaya < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Error: Total biaya tidak boleh negatif.';
    END IF;
END$$

-- Validate tanggal kunjungan saat UPDATE
DROP TRIGGER IF EXISTS trg_validate_tanggal_kunjungan_update$$
CREATE TRIGGER trg_validate_tanggal_kunjungan_update
BEFORE UPDATE ON Kunjungan
FOR EACH ROW
BEGIN
    -- Pastikan tanggal kunjungan tidak di masa depan
    IF NEW.tanggal_kunjungan > CURDATE() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Error: Tanggal kunjungan tidak boleh di masa depan.';
    END IF;
    
    -- Pastikan total biaya tidak negatif
    IF NEW.total_biaya < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Error: Total biaya tidak boleh negatif.';
    END IF;
END$$

-- ========================================================
-- 2. TRIGGERS untuk Audit Trail (Kunjungan)
-- ========================================================

-- Audit log untuk INSERT Kunjungan
DROP TRIGGER IF EXISTS trg_audit_kunjungan_insert$$
CREATE TRIGGER trg_audit_kunjungan_insert
AFTER INSERT ON Kunjungan
FOR EACH ROW
BEGIN
    INSERT INTO AuditLog (table_name, action_type, executed_by, new_data)
    VALUES (
        'Kunjungan',
        'INSERT',
        USER(),
        JSON_OBJECT(
            'kunjungan_id', NEW.kunjungan_id,
            'hewan_id', NEW.hewan_id,
            'dokter_id', NEW.dokter_id,
            'tanggal_kunjungan', NEW.tanggal_kunjungan,
            'total_biaya', NEW.total_biaya
        )
    );
END$$

-- Audit log untuk UPDATE Kunjungan
DROP TRIGGER IF EXISTS trg_audit_kunjungan_update$$
CREATE TRIGGER trg_audit_kunjungan_update
AFTER UPDATE ON Kunjungan
FOR EACH ROW
BEGIN
    INSERT INTO AuditLog (table_name, action_type, executed_by, old_data, new_data)
    VALUES (
        'Kunjungan',
        'UPDATE',
        USER(),
        JSON_OBJECT(
            'kunjungan_id', OLD.kunjungan_id,
            'tanggal_kunjungan', OLD.tanggal_kunjungan,
            'catatan', OLD.catatan,
            'total_biaya', OLD.total_biaya
        ),
        JSON_OBJECT(
            'kunjungan_id', NEW.kunjungan_id,
            'tanggal_kunjungan', NEW.tanggal_kunjungan,
            'catatan', NEW.catatan,
            'total_biaya', NEW.total_biaya
        )
    );
END$$

-- Audit log untuk DELETE Kunjungan
DROP TRIGGER IF EXISTS trg_audit_kunjungan_delete$$
CREATE TRIGGER trg_audit_kunjungan_delete
AFTER DELETE ON Kunjungan
FOR EACH ROW
BEGIN
    INSERT INTO AuditLog (table_name, action_type, executed_by, old_data)
    VALUES (
        'Kunjungan',
        'DELETE',
        USER(),
        JSON_OBJECT(
            'kunjungan_id', OLD.kunjungan_id,
            'hewan_id', OLD.hewan_id,
            'dokter_id', OLD.dokter_id,
            'tanggal_kunjungan', OLD.tanggal_kunjungan,
            'total_biaya', OLD.total_biaya
        )
    );
END$$

-- ========================================================
-- 3. TRIGGERS untuk Validasi Hewan
-- ========================================================

-- Validate Hewan saat INSERT
DROP TRIGGER IF EXISTS trg_validate_hewan_insert$$
CREATE TRIGGER trg_validate_hewan_insert
BEFORE INSERT ON Hewan
FOR EACH ROW
BEGIN
    -- Pastikan tanggal lahir tidak di masa depan
    IF NEW.tanggal_lahir > CURDATE() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Error: Tanggal lahir tidak boleh di masa depan.';
    END IF;
    
    -- Set default status_hidup jika NULL
    IF NEW.status_hidup IS NULL THEN
        SET NEW.status_hidup = 'Hidup';
    END IF;
END$$

-- Validate Hewan saat UPDATE
DROP TRIGGER IF EXISTS trg_validate_hewan_update$$
CREATE TRIGGER trg_validate_hewan_update
BEFORE UPDATE ON Hewan
FOR EACH ROW
BEGIN
    -- Pastikan tanggal lahir tidak di masa depan
    IF NEW.tanggal_lahir > CURDATE() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Error: Tanggal lahir tidak boleh di masa depan.';
    END IF;
    
    -- Jika status berubah menjadi 'Mati', catat di audit log
    IF OLD.status_hidup = 'Hidup' AND NEW.status_hidup = 'Mati' THEN
        INSERT INTO AuditLog (table_name, action_type, executed_by, old_data, new_data)
        VALUES (
            'Hewan',
            'UPDATE',
            USER(),
            JSON_OBJECT('hewan_id', OLD.hewan_id, 'nama_hewan', OLD.nama_hewan, 'status_hidup', 'Hidup'),
            JSON_OBJECT('hewan_id', NEW.hewan_id, 'nama_hewan', NEW.nama_hewan, 'status_hidup', 'Mati')
        );
    END IF;
END$$

-- ========================================================
-- 4. TRIGGERS untuk Validasi User_Login
-- ========================================================

-- Validate User_Login saat INSERT
DROP TRIGGER IF EXISTS trg_validate_user_insert$$
CREATE TRIGGER trg_validate_user_insert
BEFORE INSERT ON User_Login
FOR EACH ROW
BEGIN
    -- Pastikan email valid (format dasar)
    IF NEW.email NOT REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Error: Format email tidak valid.';
    END IF;
    
    -- Pastikan password hash tidak kosong
    IF LENGTH(NEW.password_hash) < 10 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Error: Password hash terlalu pendek.';
    END IF;
    
    -- Set default is_active jika NULL
    IF NEW.is_active IS NULL THEN
        SET NEW.is_active = TRUE;
    END IF;
END$$

-- Audit log untuk User_Login changes
DROP TRIGGER IF EXISTS trg_audit_user_update$$
CREATE TRIGGER trg_audit_user_update
AFTER UPDATE ON User_Login
FOR EACH ROW
BEGIN
    -- Catat perubahan status active
    IF OLD.is_active != NEW.is_active THEN
        INSERT INTO AuditLog (table_name, action_type, executed_by, old_data, new_data)
        VALUES (
            'User_Login',
            'UPDATE',
            USER(),
            JSON_OBJECT('user_id', OLD.user_id, 'username', OLD.username, 'is_active', OLD.is_active),
            JSON_OBJECT('user_id', NEW.user_id, 'username', NEW.username, 'is_active', NEW.is_active)
        );
    END IF;
END$$

-- ========================================================
-- 5. TRIGGERS untuk Auto-update timestamps
-- ========================================================

-- Auto-update updated_at di User_Login
DROP TRIGGER IF EXISTS trg_user_updated_at$$
CREATE TRIGGER trg_user_updated_at
BEFORE UPDATE ON User_Login
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

-- ========================================================
-- 6. TRIGGERS untuk Audit Trail (Hewan)
-- ========================================================

-- Audit log untuk INSERT Hewan
DROP TRIGGER IF EXISTS trg_audit_hewan_insert$$
CREATE TRIGGER trg_audit_hewan_insert
AFTER INSERT ON Hewan
FOR EACH ROW
BEGIN
    INSERT INTO AuditLog (table_name, action_type, executed_by, new_data)
    VALUES (
        'Hewan',
        'INSERT',
        USER(),
        JSON_OBJECT(
            'hewan_id', NEW.hewan_id,
            'nama_hewan', NEW.nama_hewan,
            'tanggal_lahir', NEW.tanggal_lahir,
            'status_hidup', NEW.status_hidup
        )
    );
END$$

-- Audit log untuk DELETE Hewan
DROP TRIGGER IF EXISTS trg_audit_hewan_delete$$
CREATE TRIGGER trg_audit_hewan_delete
AFTER DELETE ON Hewan
FOR EACH ROW
BEGIN
    INSERT INTO AuditLog (table_name, action_type, executed_by, old_data)
    VALUES (
        'Hewan',
        'DELETE',
        USER(),
        JSON_OBJECT(
            'hewan_id', OLD.hewan_id,
            'nama_hewan', OLD.nama_hewan,
            'tanggal_lahir', OLD.tanggal_lahir,
            'status_hidup', OLD.status_hidup
        )
    );
END$$

DELIMITER ;

-- ========================================================
-- Verification: Show all triggers
-- ========================================================
-- SHOW TRIGGERS WHERE `Table` IN ('Kunjungan', 'Hewan', 'User_Login');