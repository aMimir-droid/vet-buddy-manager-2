DELIMITER $$

-- ========================================================
-- STOK OBAT MANAGEMENT STORED PROCEDURES
-- Mengelola stok fisik obat per klinik (berbeda dari master Obat)
-- ========================================================

-- ========================================================
-- GET ALL STOK OBAT (dengan join ke Obat dan Klinik untuk detail)
-- ========================================================
DROP PROCEDURE IF EXISTS GetAllStokObat$$
CREATE PROCEDURE GetAllStokObat()
BEGIN
    SELECT 
        so.stok_id,
        so.obat_id,
        o.nama_obat,
        so.klinik_id,
        k.nama_klinik,
        so.jumlah_stok,
        so.updated_at
    FROM Stok_Obat so
    INNER JOIN Obat o ON so.obat_id = o.obat_id
    INNER JOIN Klinik k ON so.klinik_id = k.klinik_id
    WHERE o.deleted_at IS NULL  -- Hanya obat aktif
    ORDER BY o.nama_obat, k.nama_klinik;
END$$

-- ========================================================
-- GET STOK BY OBAT ID (untuk semua klinik)
-- ========================================================
DROP PROCEDURE IF EXISTS GetStokByObatId$$
CREATE PROCEDURE GetStokByObatId(IN p_obat_id INT)
BEGIN
    SELECT 
        so.stok_id,
        so.obat_id,
        o.nama_obat,
        so.klinik_id,
        k.nama_klinik,
        so.jumlah_stok,
        so.updated_at
    FROM Stok_Obat so
    INNER JOIN Obat o ON so.obat_id = o.obat_id
    INNER JOIN Klinik k ON so.klinik_id = k.klinik_id
    WHERE so.obat_id = p_obat_id
      AND o.deleted_at IS NULL
    ORDER BY k.nama_klinik;
END$$

-- ========================================================
-- CREATE STOK OBAT (inisialisasi stok untuk obat di klinik tertentu)
-- ========================================================
DROP PROCEDURE IF EXISTS CreateStokObat$$
CREATE PROCEDURE CreateStokObat(
    IN p_obat_id INT,
    IN p_klinik_id INT,
    IN p_jumlah_stok INT
)
BEGIN
    DECLARE obat_exists INT DEFAULT 0;
    DECLARE klinik_exists INT DEFAULT 0;
    DECLARE stok_exists INT DEFAULT 0;

    -- Validasi obat ada dan aktif
    SELECT COUNT(*) INTO obat_exists
    FROM Obat
    WHERE obat_id = p_obat_id AND deleted_at IS NULL;

    IF obat_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Obat tidak ditemukan atau sudah dihapus';
    END IF;

    -- Validasi klinik ada
    SELECT COUNT(*) INTO klinik_exists
    FROM Klinik
    WHERE klinik_id = p_klinik_id;

    IF klinik_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Klinik tidak ditemukan';
    END IF;

    -- Validasi stok tidak negatif
    IF p_jumlah_stok < 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Jumlah stok tidak boleh negatif';
    END IF;

    -- Cek apakah stok sudah ada
    SELECT COUNT(*) INTO stok_exists
    FROM Stok_Obat
    WHERE obat_id = p_obat_id AND klinik_id = p_klinik_id;

    IF stok_exists > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Stok untuk obat di klinik ini sudah ada';
    END IF;

    -- Insert stok baru
    INSERT INTO Stok_Obat (obat_id, klinik_id, jumlah_stok)
    VALUES (p_obat_id, p_klinik_id, p_jumlah_stok);

    -- Return data stok yang baru dibuat
    SELECT 
        so.stok_id,
        so.obat_id,
        o.nama_obat,
        so.klinik_id,
        k.nama_klinik,
        so.jumlah_stok,
        so.updated_at
    FROM Stok_Obat so
    INNER JOIN Obat o ON so.obat_id = o.obat_id
    INNER JOIN Klinik k ON so.klinik_id = k.klinik_id
    WHERE so.stok_id = LAST_INSERT_ID();
END$$

-- ========================================================
-- UPDATE STOK OBAT (manual update stok untuk obat di klinik tertentu)
-- ========================================================
DROP PROCEDURE IF EXISTS UpdateStokObat$$
CREATE PROCEDURE UpdateStokObat(
    IN p_obat_id INT,
    IN p_klinik_id INT,
    IN p_jumlah_stok INT
)
BEGIN
    DECLARE stok_exists INT DEFAULT 0;

    -- Validasi stok ada
    SELECT COUNT(*) INTO stok_exists
    FROM Stok_Obat
    WHERE obat_id = p_obat_id AND klinik_id = p_klinik_id;

    IF stok_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Stok untuk obat di klinik ini belum ada';
    END IF;

    -- Validasi stok tidak negatif
    IF p_jumlah_stok < 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Jumlah stok tidak boleh negatif';
    END IF;

    -- Update stok
    UPDATE Stok_Obat
    SET jumlah_stok = p_jumlah_stok
    WHERE obat_id = p_obat_id AND klinik_id = p_klinik_id;

    -- Return data stok yang diupdate
    SELECT 
        so.stok_id,
        so.obat_id,
        o.nama_obat,
        so.klinik_id,
        k.nama_klinik,
        so.jumlah_stok,
        so.updated_at
    FROM Stok_Obat so
    INNER JOIN Obat o ON so.obat_id = o.obat_id
    INNER JOIN Klinik k ON so.klinik_id = k.klinik_id
    WHERE so.obat_id = p_obat_id AND so.klinik_id = p_klinik_id;
END$$

-- ========================================================
-- ADD MUTASI OBAT (IN/OUT, otomatis update stok per klinik, dengan history)
-- ========================================================
DROP PROCEDURE IF EXISTS AddMutasiObat$$
CREATE PROCEDURE AddMutasiObat(
    IN p_obat_id INT,
    IN p_klinik_id INT,
    IN p_tipe_mutasi VARCHAR(10),
    IN p_qty INT,
    IN p_sumber_mutasi VARCHAR(50),
    IN p_keterangan VARCHAR(255),
    IN p_user_id INT
)
BEGIN
    DECLARE current_stok INT;
    DECLARE stok_exists INT DEFAULT 0;

    -- Validasi: Pastikan tipe_mutasi valid
    IF p_tipe_mutasi NOT IN ('Masuk', 'Keluar') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Tipe mutasi harus Masuk atau Keluar';
    END IF;

    -- Validasi: Pastikan qty positif
    IF p_qty <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Qty harus positif';
    END IF;

    -- Cek apakah stok ada untuk obat di klinik ini
    SELECT COUNT(*) INTO stok_exists
    FROM Stok_Obat
    WHERE obat_id = p_obat_id AND klinik_id = p_klinik_id;

    -- Jika stok belum ada, buat otomatis dengan jumlah_stok = 0
    IF stok_exists = 0 THEN
        INSERT INTO Stok_Obat (obat_id, klinik_id, jumlah_stok)
        VALUES (p_obat_id, p_klinik_id, 0);
    END IF;

    -- Ambil stok saat ini (setelah pembuatan jika diperlukan)
    SELECT jumlah_stok INTO current_stok 
    FROM Stok_Obat 
    WHERE obat_id = p_obat_id AND klinik_id = p_klinik_id;

    -- Jika Keluar, pastikan stok cukup
    IF p_tipe_mutasi = 'Keluar' AND current_stok < p_qty THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Stok tidak cukup untuk mutasi Keluar';
    END IF;

    -- Insert ke Mutasi_Obat
    INSERT INTO Mutasi_Obat (obat_id, klinik_id, qty, tipe_mutasi, sumber_mutasi, keterangan, user_id, tanggal_mutasi)
    VALUES (p_obat_id, p_klinik_id, p_qty, p_tipe_mutasi, p_sumber_mutasi, p_keterangan, p_user_id, NOW());

    -- Update Stok_Obat
    IF p_tipe_mutasi = 'Masuk' THEN
        UPDATE Stok_Obat SET jumlah_stok = jumlah_stok + p_qty, updated_at = NOW() 
        WHERE obat_id = p_obat_id AND klinik_id = p_klinik_id;
    ELSE
        UPDATE Stok_Obat SET jumlah_stok = jumlah_stok - p_qty, updated_at = NOW() 
        WHERE obat_id = p_obat_id AND klinik_id = p_klinik_id;
    END IF;

    -- Return data mutasi yang baru dibuat
    SELECT 
        mo.mutasi_id,
        mo.obat_id,
        o.nama_obat,
        mo.klinik_id,
        k.nama_klinik,
        mo.qty,
        mo.tipe_mutasi,
        mo.sumber_mutasi,
        mo.keterangan,
        mo.user_id,
        u.username,
        mo.tanggal_mutasi
    FROM Mutasi_Obat mo
    INNER JOIN Obat o ON mo.obat_id = o.obat_id
    INNER JOIN Klinik k ON mo.klinik_id = k.klinik_id
    INNER JOIN User_Login u ON mo.user_id = u.user_id
    WHERE mo.mutasi_id = LAST_INSERT_ID();

END$$

-- ========================================================
-- GET MUTASI BY OBAT ID (riwayat mutasi per obat, semua klinik)
-- ========================================================
DROP PROCEDURE IF EXISTS GetMutasiByObatId$$
CREATE PROCEDURE GetMutasiByObatId(IN p_obat_id INT)
BEGIN
    SELECT 
        mo.mutasi_id,
        mo.obat_id,
        o.nama_obat,
        mo.klinik_id,
        k.nama_klinik,
        mo.qty,
        mo.tipe_mutasi,
        mo.sumber_mutasi,
        mo.keterangan,
        mo.user_id,
        u.username,
        mo.tanggal_mutasi
    FROM Mutasi_Obat mo
    INNER JOIN Obat o ON mo.obat_id = o.obat_id
    INNER JOIN Klinik k ON mo.klinik_id = k.klinik_id
    INNER JOIN User_Login u ON mo.user_id = u.user_id
    WHERE mo.obat_id = p_obat_id
      AND mo.deleted_at IS NULL
    ORDER BY mo.tanggal_mutasi DESC;
END$$

-- ========================================================
-- GET ALL MUTASI OBAT (untuk admin)
-- ========================================================
DROP PROCEDURE IF EXISTS GetAllMutasiObat$$
CREATE PROCEDURE GetAllMutasiObat()
BEGIN
    SELECT 
        mo.mutasi_id,
        mo.obat_id,
        o.nama_obat,
        mo.klinik_id,
        k.nama_klinik,
        mo.qty,
        mo.tipe_mutasi,
        mo.sumber_mutasi,
        mo.keterangan,
        mo.user_id,
        u.username,
        mo.tanggal_mutasi
    FROM Mutasi_Obat mo
    INNER JOIN Obat o ON mo.obat_id = o.obat_id
    INNER JOIN Klinik k ON mo.klinik_id = k.klinik_id
    INNER JOIN User_Login u ON mo.user_id = u.user_id
    WHERE mo.deleted_at IS NULL
    ORDER BY mo.tanggal_mutasi DESC;
END$$

DELIMITER ;
