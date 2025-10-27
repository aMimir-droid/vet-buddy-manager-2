-- Mengatur delimiter kustom ke $$
DELIMITER $$

-- ========================================================
-- LAYANAN MANAGEMENT STORED PROCEDURES (CRUD ONLY)
-- (Disesuaikan: memperhatikan Detail_Layanan.deleted_at, soft-delete,
--  dan menghitung penggunaan hanya dari kunjungan yang tidak deleted)
-- ========================================================

-- ========================================================
-- GET ALL LAYANAN (Detail_Layanan) - hanya yang tidak deleted
-- ========================================================
DROP PROCEDURE IF EXISTS GetAllLayanan$$
CREATE PROCEDURE GetAllLayanan()
BEGIN
    SELECT 
        dl.kode_layanan,
        dl.nama_layanan,
        dl.deskripsi_layanan,
        dl.biaya_layanan,
        COUNT(DISTINCT k.kunjungan_id) AS total_penggunaan
    FROM Detail_Layanan dl
    LEFT JOIN Layanan l ON dl.kode_layanan = l.kode_layanan
    LEFT JOIN Kunjungan k ON l.kunjungan_id = k.kunjungan_id AND k.deleted_at IS NULL
    WHERE dl.deleted_at IS NULL
    GROUP BY dl.kode_layanan
    ORDER BY dl.nama_layanan;
END$$

-- ========================================================
-- GET LAYANAN BY KODE - hanya yang tidak deleted
-- ========================================================
DROP PROCEDURE IF EXISTS GetLayananByKode$$
CREATE PROCEDURE GetLayananByKode(IN p_kode_layanan VARCHAR(20))
BEGIN
    SELECT 
        dl.kode_layanan,
        dl.nama_layanan,
        dl.deskripsi_layanan,
        dl.biaya_layanan,
        COUNT(DISTINCT k.kunjungan_id) AS total_penggunaan
    FROM Detail_Layanan dl
    LEFT JOIN Layanan l ON dl.kode_layanan = l.kode_layanan
    LEFT JOIN Kunjungan k ON l.kunjungan_id = k.kunjungan_id AND k.deleted_at IS NULL
    WHERE dl.kode_layanan = p_kode_layanan
      AND dl.deleted_at IS NULL
    GROUP BY dl.kode_layanan;
END$$

-- ========================================================
-- CREATE LAYANAN (Detail_Layanan)
-- - menolak jika kode sudah ada dan belum di-soft-delete
-- ========================================================
DROP PROCEDURE IF EXISTS CreateLayanan$$
CREATE PROCEDURE CreateLayanan(
    IN p_kode_layanan VARCHAR(20),
    IN p_nama_layanan VARCHAR(100),
    IN p_deskripsi_layanan VARCHAR(255),
    IN p_biaya_layanan DECIMAL(12,2)
)
BEGIN
    DECLARE duplicate_check INT;
    
    -- Check for duplicate kode_layanan among non-deleted rows
    SELECT COUNT(*) INTO duplicate_check
    FROM Detail_Layanan
    WHERE kode_layanan = p_kode_layanan
      AND deleted_at IS NULL;
    
    IF duplicate_check > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Kode layanan sudah terdaftar';
    END IF;
    
    -- Validate biaya_layanan tidak negatif
    IF p_biaya_layanan < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Biaya layanan tidak boleh negatif';
    END IF;
    
    -- Validate nama_layanan tidak kosong
    IF p_nama_layanan IS NULL OR TRIM(p_nama_layanan) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Nama layanan wajib diisi';
    END IF;
    
    -- Insert new layanan
    INSERT INTO Detail_Layanan (
        kode_layanan,
        nama_layanan,
        deskripsi_layanan,
        biaya_layanan,
        deleted_at
    )
    VALUES (
        p_kode_layanan,
        p_nama_layanan,
        p_deskripsi_layanan,
        p_biaya_layanan,
        NULL
    );
    
    -- Return the new layanan
    SELECT 
        kode_layanan,
        nama_layanan,
        deskripsi_layanan,
        biaya_layanan,
        0 AS total_penggunaan
    FROM Detail_Layanan
    WHERE kode_layanan = p_kode_layanan
      AND deleted_at IS NULL;
END$$

-- ========================================================
-- UPDATE LAYANAN (Detail_Layanan)
-- - hanya memperbarui layanan yang belum di-soft-delete
-- ========================================================
DROP PROCEDURE IF EXISTS UpdateLayanan$$
CREATE PROCEDURE UpdateLayanan(
    IN p_kode_layanan VARCHAR(20),
    IN p_nama_layanan VARCHAR(100),
    IN p_deskripsi_layanan VARCHAR(255),
    IN p_biaya_layanan DECIMAL(12,2)
)
BEGIN
    DECLARE layanan_exists INT;
    
    -- Check if layanan exists and is not deleted
    SELECT COUNT(*) INTO layanan_exists
    FROM Detail_Layanan
    WHERE kode_layanan = p_kode_layanan
      AND deleted_at IS NULL;
    
    IF layanan_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Layanan tidak ditemukan atau sudah dihapus';
    END IF;
    
    -- Validate biaya_layanan tidak negatif
    IF p_biaya_layanan < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Biaya layanan tidak boleh negatif';
    END IF;
    
    -- Validate nama_layanan tidak kosong
    IF p_nama_layanan IS NULL OR TRIM(p_nama_layanan) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Nama layanan wajib diisi';
    END IF;
    
    -- Update layanan (only non-deleted)
    UPDATE Detail_Layanan
    SET 
        nama_layanan = p_nama_layanan,
        deskripsi_layanan = p_deskripsi_layanan,
        biaya_layanan = p_biaya_layanan
    WHERE kode_layanan = p_kode_layanan
      AND deleted_at IS NULL;
    
    -- Return updated layanan with penggunaan (menghitung kunjungan yang tidak deleted)
    SELECT 
        dl.kode_layanan,
        dl.nama_layanan,
        dl.deskripsi_layanan,
        dl.biaya_layanan,
        COUNT(DISTINCT k.kunjungan_id) AS total_penggunaan
    FROM Detail_Layanan dl
    LEFT JOIN Layanan l ON dl.kode_layanan = l.kode_layanan
    LEFT JOIN Kunjungan k ON l.kunjungan_id = k.kunjungan_id AND k.deleted_at IS NULL
    WHERE dl.kode_layanan = p_kode_layanan
      AND dl.deleted_at IS NULL
    GROUP BY dl.kode_layanan;
END$$

-- ========================================================
-- DELETE LAYANAN (Detail_Layanan) - soft-delete
-- - tidak menghapus jika layanan sudah dipakai di kunjungan aktif
-- ========================================================
DROP PROCEDURE IF EXISTS DeleteLayanan$$
CREATE PROCEDURE DeleteLayanan(IN p_kode_layanan VARCHAR(20))
BEGIN
    DECLARE usage_count INT;
    DECLARE rows_affected INT;
    
    -- Check if layanan is being used in any Kunjungan that is not deleted
    SELECT COUNT(*) INTO usage_count
    FROM Layanan l
    JOIN Kunjungan k ON l.kunjungan_id = k.kunjungan_id
    WHERE l.kode_layanan = p_kode_layanan
      AND k.deleted_at IS NULL;
    
    IF usage_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Tidak dapat menghapus layanan yang sudah digunakan dalam kunjungan aktif';
    END IF;
    
    -- Soft-delete layanan (set deleted_at) only if not already deleted
    UPDATE Detail_Layanan
    SET deleted_at = NOW()
    WHERE kode_layanan = p_kode_layanan
      AND deleted_at IS NULL;
    
    SET rows_affected = ROW_COUNT();
    
    SELECT rows_affected AS affected_rows;
END$$

-- ========================================================
-- ADD LAYANAN TO KUNJUNGAN (FIXED)
-- ========================================================
DROP PROCEDURE IF EXISTS AddLayananToKunjungan$$
CREATE PROCEDURE AddLayananToKunjungan(
    IN p_kunjungan_id INT,
    IN p_kode_layanan VARCHAR(20),
    IN p_qty INT
)
BEGIN
    DECLARE v_biaya DECIMAL(12,2);
    DECLARE v_qty INT; 

    -- Validasi kunjungan dan layanan
    IF NOT EXISTS (SELECT 1 FROM Kunjungan WHERE kunjungan_id = p_kunjungan_id AND deleted_at IS NULL) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Kunjungan tidak ditemukan';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM Detail_Layanan WHERE kode_layanan = p_kode_layanan AND deleted_at IS NULL) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Layanan tidak ditemukan';
    END IF;

    -- Set qty default ke 1 jika p_qty adalah NULL atau <= 0
    IF p_qty IS NULL OR p_qty <= 0 THEN
        SET v_qty = 1;
    ELSE
        SET v_qty = p_qty;
    END IF;

    -- Ambil biaya dari master Detail_Layanan
    SELECT biaya_layanan INTO v_biaya
    FROM Detail_Layanan
    WHERE kode_layanan = p_kode_layanan AND deleted_at IS NULL;

    -- Tambah layanan ke kunjungan dengan biaya saat itu (menggunakan v_qty)
    INSERT INTO Layanan (kunjungan_id, kode_layanan, qty, biaya_saat_itu)
    VALUES (p_kunjungan_id, p_kode_layanan, v_qty, v_biaya); 

    -- Kembalikan data layanan yang baru ditambahkan
    SELECT 
        l.layanan_id,
        l.kunjungan_id,
        l.kode_layanan,
        dl.nama_layanan,
        l.qty,
        l.biaya_saat_itu
    FROM Layanan l
    INNER JOIN Detail_Layanan dl ON l.kode_layanan = dl.kode_layanan
    WHERE l.kunjungan_id = p_kunjungan_id 
      AND l.kode_layanan = p_kode_layanan
      AND dl.deleted_at IS NULL
    ORDER BY l.layanan_id DESC 
    LIMIT 1;
END$$

-- ========================================================
-- GET LAYANAN BY KUNJUNGAN (BARU)
-- (Mengambil detail layanan dari tabel Layanan, termasuk qty dan biaya_saat_itu)
-- ========================================================
DROP PROCEDURE IF EXISTS GetLayananByKunjungan$$
CREATE PROCEDURE GetLayananByKunjungan(
    IN p_kunjungan_id INT
)
BEGIN
    SELECT 
        l.kunjungan_id,
        l.kode_layanan,
        dl.nama_layanan,
        dl.deskripsi_layanan,
        l.qty,
        l.biaya_saat_itu AS harga_saat_itu,
        dl.biaya_layanan AS harga_saat_ini
    FROM Layanan l
    INNER JOIN Detail_Layanan dl ON l.kode_layanan = dl.kode_layanan
    WHERE l.kunjungan_id = p_kunjungan_id
      AND dl.deleted_at IS NULL
    ORDER BY dl.nama_layanan;
END$$

-- ========================================================
-- DELETE LAYANAN FROM KUNJUNGAN (BARU)
-- (Menghapus berdasarkan composite primary key Anda, dengan validasi)
-- ========================================================
DROP PROCEDURE IF EXISTS DeleteLayananFromKunjungan$$
CREATE PROCEDURE DeleteLayananFromKunjungan(
    IN p_kunjungan_id INT,
    IN p_kode_layanan VARCHAR(20)
)
BEGIN
    DECLARE rows_deleted INT;

    -- Validasi apakah kunjungan ada dan tidak deleted
    IF NOT EXISTS (SELECT 1 FROM Kunjungan WHERE kunjungan_id = p_kunjungan_id AND deleted_at IS NULL) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Kunjungan tidak ditemukan';
    END IF;

    -- Validasi apakah layanan ada di kunjungan tersebut
    IF NOT EXISTS (SELECT 1 FROM Layanan WHERE kunjungan_id = p_kunjungan_id AND kode_layanan = p_kode_layanan) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Layanan tidak ditemukan di kunjungan ini';
    END IF;

    -- Hapus layanan dari kunjungan
    DELETE FROM Layanan
    WHERE kunjungan_id = p_kunjungan_id 
      AND kode_layanan = p_kode_layanan;
    
    SET rows_deleted = ROW_COUNT();
    
    SELECT rows_deleted AS affected_rows, p_kunjungan_id AS kunjungan_id, p_kode_layanan AS kode_layanan;
END$$

-- Mengembalikan delimiter ke standar ; di akhir skrip
DELIMITER ;