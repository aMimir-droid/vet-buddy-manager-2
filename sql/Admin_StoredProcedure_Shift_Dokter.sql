DELIMITER $$

-- ========================================================
-- SHIFT_DOKTER MANAGEMENT STORED PROCEDURES (CRUD via is_active)
-- ========================================================

-- GET ALL SHIFT (hanya aktif, dengan join lengkap)
DROP PROCEDURE IF EXISTS GetAllShiftDokter$$
CREATE PROCEDURE GetAllShiftDokter()
BEGIN
    SELECT 
        s.shift_id,
        s.dokter_id,
        s.hari_minggu,
        s.jam_mulai,
        s.jam_selesai,
        s.is_active,
        d.nama_dokter,
        d.title_dokter,
        k.klinik_id,
        k.nama_klinik
    FROM Shift_Dokter s
    LEFT JOIN Dokter d ON s.dokter_id = d.dokter_id AND d.deleted_at IS NULL
    LEFT JOIN Klinik k ON d.klinik_id = k.klinik_id AND k.deleted_at IS NULL
    WHERE s.is_active = TRUE
    ORDER BY s.dokter_id, s.hari_minggu, s.jam_mulai;
END$$

-- GET SHIFT BY ID (hanya aktif, dengan join lengkap)
DROP PROCEDURE IF EXISTS GetShiftDokterById$$
CREATE PROCEDURE GetShiftDokterById(IN p_shift_id INT)
BEGIN
    SELECT 
        s.shift_id,
        s.dokter_id,
        s.hari_minggu,
        s.jam_mulai,
        s.jam_selesai,
        s.is_active,
        d.nama_dokter,
        d.title_dokter,
        k.klinik_id,
        k.nama_klinik
    FROM Shift_Dokter s
    LEFT JOIN Dokter d ON s.dokter_id = d.dokter_id AND d.deleted_at IS NULL
    LEFT JOIN Klinik k ON d.klinik_id = k.klinik_id AND k.deleted_at IS NULL
    WHERE s.shift_id = p_shift_id
      AND s.is_active = TRUE;
END$$

-- CREATE SHIFT (insert lengkap)
DROP PROCEDURE IF EXISTS CreateShiftDokter$$
CREATE PROCEDURE CreateShiftDokter(
    IN p_dokter_id INT,
    IN p_hari_minggu TINYINT,
    IN p_jam_mulai TIME,
    IN p_jam_selesai TIME,
    IN p_is_active BOOLEAN
)
BEGIN
    DECLARE dokter_exists INT DEFAULT 0;

    -- Validasi hari_minggu 1..7  -- UPDATE: Ubah dari 0..6 ke 1..7
    IF p_hari_minggu < 1 OR p_hari_minggu > 7 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Hari minggu harus diantara 1 dan 7';
    END IF;

    -- Validasi jam
    IF p_jam_mulai IS NULL OR p_jam_selesai IS NULL OR p_jam_selesai <= p_jam_mulai THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Jam selesai harus lebih besar dari jam mulai';
    END IF;

    -- Cek dokter ada dan aktif
    SELECT COUNT(*) INTO dokter_exists FROM Dokter WHERE dokter_id = p_dokter_id AND deleted_at IS NULL;
    IF dokter_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Dokter tidak ditemukan atau tidak aktif';
    END IF;

    INSERT INTO Shift_Dokter (
        dokter_id,
        hari_minggu,
        jam_mulai,
        jam_selesai,
        is_active
    ) VALUES (
        p_dokter_id,
        p_hari_minggu,
        p_jam_mulai,
        p_jam_selesai,
        COALESCE(p_is_active, TRUE)
    );

    SELECT 
        s.shift_id,
        s.dokter_id,
        s.hari_minggu,
        s.jam_mulai,
        s.jam_selesai,
        s.is_active,
        d.nama_dokter,
        d.title_dokter,
        k.klinik_id,
        k.nama_klinik
    FROM Shift_Dokter s
    LEFT JOIN Dokter d ON s.dokter_id = d.dokter_id
    LEFT JOIN Klinik k ON d.klinik_id = k.klinik_id
    WHERE s.shift_id = LAST_INSERT_ID();
END$$

-- UPDATE SHIFT (update lengkap)
DROP PROCEDURE IF EXISTS UpdateShiftDokter$$
CREATE PROCEDURE UpdateShiftDokter(
    IN p_shift_id INT,
    IN p_dokter_id INT,
    IN p_hari_minggu TINYINT,
    IN p_jam_mulai TIME,
    IN p_jam_selesai TIME,
    IN p_is_active BOOLEAN
)
BEGIN
    DECLARE shift_exists INT DEFAULT 0;
    DECLARE dokter_exists INT DEFAULT 0;

    -- Cek shift ada
    SELECT COUNT(*) INTO shift_exists FROM Shift_Dokter WHERE shift_id = p_shift_id;
    IF shift_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Shift tidak ditemukan';
    END IF;

    -- Validasi hari_minggu
    IF p_hari_minggu < 1 OR p_hari_minggu > 7 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Hari minggu harus diantara 1 dan 7';
    END IF;

    -- Validasi jam
    IF p_jam_mulai IS NULL OR p_jam_selesai IS NULL OR p_jam_selesai <= p_jam_mulai THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Jam selesai harus lebih besar dari jam mulai';
    END IF;

    -- Cek dokter ada dan aktif
    SELECT COUNT(*) INTO dokter_exists FROM Dokter WHERE dokter_id = p_dokter_id AND deleted_at IS NULL;
    IF dokter_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Dokter tidak ditemukan atau tidak aktif';
    END IF;

    UPDATE Shift_Dokter
    SET
        dokter_id = p_dokter_id,
        hari_minggu = p_hari_minggu,
        jam_mulai = p_jam_mulai,
        jam_selesai = p_jam_selesai,
        is_active = COALESCE(p_is_active, is_active)
    WHERE shift_id = p_shift_id;

    SELECT 
        s.shift_id,
        s.dokter_id,
        s.hari_minggu,
        s.jam_mulai,
        s.jam_selesai,
        s.is_active,
        d.nama_dokter,
        d.title_dokter,
        k.klinik_id,
        k.nama_klinik
    FROM Shift_Dokter s
    LEFT JOIN Dokter d ON s.dokter_id = d.dokter_id
    LEFT JOIN Klinik k ON d.klinik_id = k.klinik_id
    WHERE s.shift_id = p_shift_id;
END$$

-- DELETE SHIFT (soft delete)
DROP PROCEDURE IF EXISTS DeleteShiftDokter$$
CREATE PROCEDURE DeleteShiftDokter(IN p_shift_id INT)
BEGIN
    DECLARE shift_exists INT DEFAULT 0;

    SELECT COUNT(*) INTO shift_exists FROM Shift_Dokter WHERE shift_id = p_shift_id AND is_active = TRUE;
    IF shift_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Shift tidak ditemukan atau sudah non-aktif';
    END IF;

    UPDATE Shift_Dokter
    SET is_active = FALSE
    WHERE shift_id = p_shift_id;

    SELECT ROW_COUNT() AS affected_rows;
END$$

-- GET SHIFT BY DOKTER (untuk vet melihat shift sendiri)
DROP PROCEDURE IF EXISTS GetShiftDokterByDokter$$
CREATE PROCEDURE GetShiftDokterByDokter(IN p_dokter_id INT)
BEGIN
    SELECT 
        s.shift_id,
        d.title_dokter,
        d.nama_dokter,
        s.hari_minggu,
        s.jam_mulai,
        s.jam_selesai,
        s.is_active,
        k.klinik_id,
        k.nama_klinik
    FROM Shift_Dokter s
    LEFT JOIN Dokter d ON s.dokter_id = d.dokter_id AND d.deleted_at IS NULL
    LEFT JOIN Klinik k ON d.klinik_id = k.klinik_id AND k.deleted_at IS NULL
    WHERE s.dokter_id = p_dokter_id
      AND s.is_active = TRUE
    ORDER BY s.hari_minggu, s.jam_mulai;
END$$

-- GET ALL SHIFT AKTIF (untuk pawrent melihat semua shift aktif)
DROP PROCEDURE IF EXISTS GetAllShiftDokterAktif$$
CREATE PROCEDURE GetAllShiftDokterAktif()
BEGIN
    SELECT 
        s.shift_id,
        d.title_dokter,
        d.nama_dokter,
        s.hari_minggu,
        s.jam_mulai,
        s.jam_selesai,
        s.is_active,
        k.klinik_id,
        k.nama_klinik
    FROM Shift_Dokter s
    LEFT JOIN Dokter d ON s.dokter_id = d.dokter_id AND d.deleted_at IS NULL
    LEFT JOIN Klinik k ON d.klinik_id = k.klinik_id AND k.deleted_at IS NULL
    WHERE s.is_active = TRUE
    ORDER BY s.hari_minggu, s.jam_mulai, d.nama_dokter;
END$$

-- GET SHIFT BY KLINIK (untuk Admin Klinik)
DROP PROCEDURE IF EXISTS GetShiftDokterByKlinik$$
CREATE PROCEDURE GetShiftDokterByKlinik(IN p_klinik_id INT)
BEGIN
    SELECT 
        s.shift_id,
        s.dokter_id,
        s.hari_minggu,
        s.jam_mulai,
        s.jam_selesai,
        s.is_active,
        d.nama_dokter,
        d.title_dokter,
        k.klinik_id,
        k.nama_klinik
    FROM Shift_Dokter s
    LEFT JOIN Dokter d ON s.dokter_id = d.dokter_id AND d.deleted_at IS NULL
    LEFT JOIN Klinik k ON d.klinik_id = k.klinik_id AND k.deleted_at IS NULL
    WHERE s.is_active = TRUE
      AND k.klinik_id = p_klinik_id
    ORDER BY s.dokter_id, s.hari_minggu, s.jam_mulai;
END$$

-- GET ALL SHIFT BY KLINIK (aktif dan tidak aktif, untuk Admin Klinik)
DROP PROCEDURE IF EXISTS GetAllShiftDokterByKlinik$$
CREATE PROCEDURE GetAllShiftDokterByKlinik(IN p_klinik_id INT)
BEGIN
    SELECT 
        s.shift_id,
        s.dokter_id,
        s.hari_minggu,
        s.jam_mulai,
        s.jam_selesai,
        s.is_active,
        d.nama_dokter,
        d.title_dokter,
        k.klinik_id,
        k.nama_klinik
    FROM Shift_Dokter s
    LEFT JOIN Dokter d ON s.dokter_id = d.dokter_id AND d.deleted_at IS NULL
    LEFT JOIN Klinik k ON d.klinik_id = k.klinik_id AND k.deleted_at IS NULL
    WHERE k.klinik_id = p_klinik_id
    ORDER BY s.dokter_id, s.hari_minggu, s.jam_mulai;
END$$

-- GET ALL SHIFT FOR ADMIN (aktif dan tidak aktif, untuk Admin Global)
DROP PROCEDURE IF EXISTS GetAllShiftDokterAdmin$$
CREATE PROCEDURE GetAllShiftDokterAdmin()
BEGIN
    SELECT 
        s.shift_id,
        s.dokter_id,
        s.hari_minggu,
        s.jam_mulai,
        s.jam_selesai,
        s.is_active,
        d.nama_dokter,
        d.title_dokter,
        k.klinik_id,
        k.nama_klinik
    FROM Shift_Dokter s
    LEFT JOIN Dokter d ON s.dokter_id = d.dokter_id AND d.deleted_at IS NULL
    LEFT JOIN Klinik k ON d.klinik_id = k.klinik_id AND k.deleted_at IS NULL
    ORDER BY s.dokter_id, s.hari_minggu, s.jam_mulai;
END$$

DELIMITER ;