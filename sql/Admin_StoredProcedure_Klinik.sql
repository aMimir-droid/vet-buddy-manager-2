DELIMITER $$

-- ========================================================
-- KLINIK MANAGEMENT STORED PROCEDURES (CRUD ONLY) - SOFT DELETE AWARE
-- ========================================================

-- ========================================================
-- GET ALL KLINIK (hanya aktif)
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
    LEFT JOIN Dokter d ON k.klinik_id = d.klinik_id AND d.deleted_at IS NULL
    WHERE k.deleted_at IS NULL
    GROUP BY k.klinik_id
    ORDER BY k.nama_klinik;
END$$

-- ========================================================
-- GET KLINIK BY ID (hanya aktif)
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
    LEFT JOIN Dokter d ON k.klinik_id = d.klinik_id AND d.deleted_at IS NULL
    WHERE k.deleted_at IS NULL
      AND k.klinik_id = p_klinik_id
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
    
    -- Check for duplicate telepon_klinik among aktif (deleted_at IS NULL)
    IF p_telepon_klinik IS NOT NULL THEN
        SELECT COUNT(*) INTO duplicate_check
        FROM Klinik
        WHERE telepon_klinik = p_telepon_klinik
          AND deleted_at IS NULL;
        
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
    
    -- Insert new klinik (soft-delete explicit NULL)
    INSERT INTO Klinik (
        nama_klinik,
        alamat_klinik,
        telepon_klinik,
        deleted_at
    )
    VALUES (
        p_nama_klinik,
        p_alamat_klinik,
        p_telepon_klinik,
        NULL
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
-- (hanya bisa update klinik aktif; cek unik telepon hanya antar aktif)
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
    
    -- Check if klinik exists and is active
    SELECT COUNT(*) INTO klinik_exists
    FROM Klinik
    WHERE klinik_id = p_klinik_id
      AND deleted_at IS NULL;
    
    IF klinik_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Klinik tidak ditemukan atau sudah dihapus';
    END IF;
    
    -- Check for duplicate telepon_klinik (excluding current klinik) among aktif
    IF p_telepon_klinik IS NOT NULL THEN
        SELECT COUNT(*) INTO duplicate_check
        FROM Klinik
        WHERE telepon_klinik = p_telepon_klinik 
          AND klinik_id != p_klinik_id
          AND deleted_at IS NULL;
        
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
    WHERE klinik_id = p_klinik_id
      AND deleted_at IS NULL;
    
    -- Return updated klinik
    SELECT 
        k.klinik_id,
        k.nama_klinik,
        k.alamat_klinik,
        k.telepon_klinik,
        COUNT(DISTINCT d.dokter_id) as jumlah_dokter
    FROM Klinik k
    LEFT JOIN Dokter d ON k.klinik_id = d.klinik_id AND d.deleted_at IS NULL
    WHERE k.klinik_id = p_klinik_id
      AND k.deleted_at IS NULL
    GROUP BY k.klinik_id;
END$$

-- ========================================================
-- DELETE KLINIK (soft delete, informatif jika ada relasi aktif)
-- ========================================================
DROP PROCEDURE IF EXISTS DeleteKlinik$$
CREATE PROCEDURE DeleteKlinik(IN p_klinik_id INT)
BEGIN
    DECLARE rows_affected INT;
    DECLARE dokter_count INT;
    DECLARE klinik_exists INT DEFAULT 0;
    DECLARE v_message VARCHAR(500);
    DECLARE has_relations BOOLEAN DEFAULT FALSE;
    
    -- Check klinik exists and not already deleted
    SELECT COUNT(*) INTO klinik_exists
    FROM Klinik
    WHERE klinik_id = p_klinik_id
      AND deleted_at IS NULL;
      
    IF klinik_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Klinik tidak ditemukan atau sudah dihapus';
    END IF;
    
    -- Check active dokter terkait (but do NOT block delete)
    SELECT COUNT(*) INTO dokter_count
    FROM Dokter
    WHERE klinik_id = p_klinik_id
      AND deleted_at IS NULL;
    
    IF dokter_count > 0 THEN
        SET has_relations = TRUE;
        SET v_message = CONCAT('Klinik memiliki ', dokter_count, ' dokter aktif. Melakukan soft delete. Hubungi admin untuk penghapusan permanen.');
    ELSE
        SET v_message = 'Klinik berhasil dihapus';
    END IF;
    
    -- Soft delete klinik
    UPDATE Klinik
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE klinik_id = p_klinik_id
      AND deleted_at IS NULL;
    
    SET rows_affected = ROW_COUNT();
    
    -- Return informative result
    SELECT 
        rows_affected as affected_rows,
        dokter_count,
        has_relations,
        v_message as message;
END$$

-- ========================================================
-- GET DOKTERS BY KLINIK (Helper untuk detail klinik) - hanya dokter aktif dan hitung relasi aktif
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
    LEFT JOIN Pawrent p ON d.dokter_id = p.dokter_id AND p.deleted_at IS NULL
    LEFT JOIN Kunjungan k ON d.dokter_id = k.dokter_id AND k.deleted_at IS NULL
    WHERE d.klinik_id = p_klinik_id
      AND d.deleted_at IS NULL
    GROUP BY d.dokter_id
    ORDER BY d.nama_dokter;
END$$

DELIMITER ;