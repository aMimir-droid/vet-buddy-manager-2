DELIMITER $$

-- ========================================================
-- HEWAN MANAGEMENT STORED PROCEDURES
-- ========================================================

-- ========================================================
-- GET ALL HEWANS
-- ========================================================
DROP PROCEDURE IF EXISTS GetAllHewans$$
CREATE PROCEDURE GetAllHewans()
BEGIN
    SELECT 
        h.hewan_id,
        h.nama_hewan,
        h.tanggal_lahir,
        h.jenis_kelamin,
        h.status_hidup,
        h.jenis_hewan_id,
        h.pawrent_id,
        jh.nama_jenis_hewan,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) as nama_pawrent,
        p.nomor_hp as telepon_pawrent,
        h.deleted_at,
        (h.deleted_at IS NOT NULL) AS is_deleted,
        TIMESTAMPDIFF(YEAR, h.tanggal_lahir, CURDATE()) as umur_tahun,
        TIMESTAMPDIFF(MONTH, h.tanggal_lahir, CURDATE()) % 12 as umur_bulan
    FROM Hewan h
    INNER JOIN Jenis_Hewan jh ON h.jenis_hewan_id = jh.jenis_hewan_id
    INNER JOIN Pawrent p ON h.pawrent_id = p.pawrent_id
    WHERE h.deleted_at IS NULL
    ORDER BY h.nama_hewan;
END$$

-- ========================================================
-- GET HEWAN BY ID
-- ========================================================
DROP PROCEDURE IF EXISTS GetHewanById$$
CREATE PROCEDURE GetHewanById(IN p_hewan_id INT)
BEGIN
    SELECT 
        h.hewan_id,
        h.nama_hewan,
        h.tanggal_lahir,
        h.jenis_kelamin,
        h.status_hidup,
        h.jenis_hewan_id,
        h.pawrent_id,
        jh.nama_jenis_hewan,
        jh.deskripsi_jenis_hewan,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) as nama_pawrent,
        p.nomor_hp as telepon_pawrent,
        p.alamat_pawrent,
        p.kota_pawrent,
        h.deleted_at,
        (h.deleted_at IS NOT NULL) AS is_deleted,
        TIMESTAMPDIFF(YEAR, h.tanggal_lahir, CURDATE()) as umur_tahun,
        TIMESTAMPDIFF(MONTH, h.tanggal_lahir, CURDATE()) % 12 as umur_bulan
    FROM Hewan h
    INNER JOIN Jenis_Hewan jh ON h.jenis_hewan_id = jh.jenis_hewan_id
    INNER JOIN Pawrent p ON h.pawrent_id = p.pawrent_id
    WHERE h.hewan_id = p_hewan_id
      AND h.deleted_at IS NULL;
END$$

-- ========================================================
-- GET ALL JENIS HEWAN
-- ========================================================
DROP PROCEDURE IF EXISTS GetAllJenisHewan$$
CREATE PROCEDURE GetAllJenisHewan()
BEGIN
    SELECT 
        jh.jenis_hewan_id,
        jh.nama_jenis_hewan,
        jh.deskripsi_jenis_hewan,
        COUNT(h.hewan_id) as jumlah_hewan
    FROM Jenis_Hewan jh
    LEFT JOIN Hewan h ON jh.jenis_hewan_id = h.jenis_hewan_id AND h.deleted_at IS NULL
    GROUP BY jh.jenis_hewan_id
    ORDER BY jh.nama_jenis_hewan;
END$$

-- ========================================================
-- GET AVAILABLE PAWRENTS (for hewan assignment)
-- ========================================================
DROP PROCEDURE IF EXISTS GetAvailablePawrentsForHewan$$
CREATE PROCEDURE GetAvailablePawrentsForHewan()
BEGIN
    SELECT 
        p.pawrent_id,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) as nama_lengkap,
        p.nomor_hp,
        p.kota_pawrent,
        COUNT(h.hewan_id) as jumlah_hewan,
        CONCAT(d.title_dokter, ' ', d.nama_dokter) as nama_dokter
    FROM Pawrent p
    LEFT JOIN Hewan h ON p.pawrent_id = h.pawrent_id AND h.deleted_at IS NULL
    LEFT JOIN Dokter d ON p.dokter_id = d.dokter_id
    GROUP BY p.pawrent_id
    ORDER BY p.nama_depan_pawrent, p.nama_belakang_pawrent;
END$$

-- ========================================================
-- CREATE HEWAN
-- ========================================================
DROP PROCEDURE IF EXISTS CreateHewan$$
CREATE PROCEDURE CreateHewan(
    IN p_nama_hewan VARCHAR(50),
    IN p_tanggal_lahir DATE,
    IN p_jenis_kelamin ENUM('Jantan','Betina'),
    IN p_jenis_hewan_id INT,
    IN p_pawrent_id INT,
    IN p_status_hidup ENUM('Hidup', 'Mati')  -- ✅ ADDED: Parameter ke-6
)
BEGIN
    DECLARE new_hewan_id INT;
    DECLARE duplicate_check INT;
    
    -- MANDATORY: Validate pawrent_id is provided
    IF p_pawrent_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Pawrent wajib dipilih. Setiap hewan harus memiliki pemilik (pawrent)';
    END IF;
    
    -- Validate pawrent exists and not soft-deleted
    SELECT COUNT(*) INTO duplicate_check
    FROM Pawrent
    WHERE pawrent_id = p_pawrent_id
      AND (deleted_at IS NULL);
    
    IF duplicate_check = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Pawrent tidak ditemukan atau sudah dihapus. Silakan pilih pawrent yang valid';
    END IF;
    
    -- MANDATORY: Validate jenis_hewan_id is provided
    IF p_jenis_hewan_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Jenis hewan wajib dipilih';
    END IF;
    
    -- Validate jenis hewan exists
    SELECT COUNT(*) INTO duplicate_check
    FROM Jenis_Hewan
    WHERE jenis_hewan_id = p_jenis_hewan_id;
    
    IF duplicate_check = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Jenis hewan tidak ditemukan';
    END IF;
    
    -- Validate nama_hewan is provided
    IF p_nama_hewan IS NULL OR TRIM(p_nama_hewan) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Nama hewan wajib diisi';
    END IF;
    
    -- Validate jenis_kelamin is provided
    IF p_jenis_kelamin IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Jenis kelamin hewan wajib dipilih';
    END IF;
    
    -- Validate tanggal lahir tidak di masa depan
    IF p_tanggal_lahir IS NOT NULL AND p_tanggal_lahir > CURDATE() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Tanggal lahir tidak boleh di masa depan';
    END IF;
    
    -- ✅ Set default status_hidup if NULL
    IF p_status_hidup IS NULL THEN
        SET p_status_hidup = 'Hidup';
    END IF;
    
    -- Insert new hewan (explicit soft-delete null)
    INSERT INTO Hewan (
        nama_hewan,
        tanggal_lahir,
        jenis_kelamin,
        jenis_hewan_id,
        pawrent_id,
        status_hidup,
        deleted_at
    )
    VALUES (
        p_nama_hewan,
        p_tanggal_lahir,
        p_jenis_kelamin,
        p_jenis_hewan_id,
        p_pawrent_id,
        p_status_hidup,
        NULL
    );
    
    SET new_hewan_id = LAST_INSERT_ID();
    
    -- Return the new hewan with joined data
    SELECT 
        h.hewan_id,
        h.nama_hewan,
        h.tanggal_lahir,
        h.jenis_kelamin,
        h.status_hidup,
        h.jenis_hewan_id,
        h.pawrent_id,
        jh.nama_jenis_hewan,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) as nama_pawrent,
        h.deleted_at,
        (h.deleted_at IS NOT NULL) AS is_deleted,
        TIMESTAMPDIFF(YEAR, h.tanggal_lahir, CURDATE()) as umur_tahun,
        TIMESTAMPDIFF(MONTH, h.tanggal_lahir, CURDATE()) % 12 as umur_bulan
    FROM Hewan h
    INNER JOIN Jenis_Hewan jh ON h.jenis_hewan_id = jh.jenis_hewan_id
    INNER JOIN Pawrent p ON h.pawrent_id = p.pawrent_id
    WHERE h.hewan_id = new_hewan_id;
END$$

-- ========================================================
-- UPDATE HEWAN
-- ========================================================
DROP PROCEDURE IF EXISTS UpdateHewan$$
CREATE PROCEDURE UpdateHewan(
    IN p_hewan_id INT,
    IN p_nama_hewan VARCHAR(50),
    IN p_tanggal_lahir DATE,
    IN p_jenis_kelamin ENUM('Jantan','Betina'),
    IN p_jenis_hewan_id INT,
    IN p_pawrent_id INT,
    IN p_status_hidup ENUM('Hidup', 'Mati')
)
BEGIN
    DECLARE duplicate_check INT;
    DECLARE hewan_exists INT;
    
    -- Check if hewan exists and not soft-deleted
    SELECT COUNT(*) INTO hewan_exists
    FROM Hewan
    WHERE hewan_id = p_hewan_id
      AND deleted_at IS NULL;
    
    IF hewan_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Hewan tidak ditemukan atau sudah dihapus';
    END IF;
    
    -- PERBAIKAN: Validate pawrent exists (hanya jika p_pawrent_id diberikan)
    IF p_pawrent_id IS NOT NULL THEN
        SELECT COUNT(*) INTO duplicate_check
        FROM Pawrent
        WHERE pawrent_id = p_pawrent_id
          AND (deleted_at IS NULL);
        
        IF duplicate_check = 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Pawrent tidak ditemukan. Silakan pilih pawrent yang valid';
        END IF;
    END IF;
    
    -- PERBAIKAN: Validate jenis hewan exists (hanya jika p_jenis_hewan_id diberikan)
    IF p_jenis_hewan_id IS NOT NULL THEN
        SELECT COUNT(*) INTO duplicate_check
        FROM Jenis_Hewan
        WHERE jenis_hewan_id = p_jenis_hewan_id;
        
        IF duplicate_check = 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Jenis hewan tidak ditemukan';
        END IF;
    END IF;
    
    -- Validate nama_hewan tidak kosong
    IF p_nama_hewan IS NULL OR TRIM(p_nama_hewan) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Nama hewan wajib diisi';
    END IF;
    
    -- Validate tanggal lahir tidak di masa depan
    IF p_tanggal_lahir IS NOT NULL AND p_tanggal_lahir > CURDATE() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Tanggal lahir tidak boleh di masa depan';
    END IF;
    
    -- Update hewan (only if not soft-deleted)
    UPDATE Hewan
    SET 
        nama_hewan = p_nama_hewan,
        tanggal_lahir = p_tanggal_lahir,
        jenis_kelamin = p_jenis_kelamin,
        jenis_hewan_id = p_jenis_hewan_id,
        pawrent_id = p_pawrent_id,
        status_hidup = p_status_hidup
    WHERE hewan_id = p_hewan_id
      AND deleted_at IS NULL;
    
    -- Return updated hewan with joined data
    SELECT 
        h.hewan_id,
        h.nama_hewan,
        h.tanggal_lahir,
        h.jenis_kelamin,
        h.status_hidup,
        h.jenis_hewan_id,
        jh.nama_jenis_hewan,
        h.pawrent_id,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) as nama_pawrent,
        h.deleted_at,
        (h.deleted_at IS NOT NULL) AS is_deleted,
        TIMESTAMPDIFF(YEAR, h.tanggal_lahir, CURDATE()) as umur_tahun,
        TIMESTAMPDIFF(MONTH, h.tanggal_lahir, CURDATE()) % 12 as umur_bulan
    FROM Hewan h
    INNER JOIN Jenis_Hewan jh ON h.jenis_hewan_id = jh.jenis_hewan_id
    INNER JOIN Pawrent p ON h.pawrent_id = p.pawrent_id
    WHERE h.hewan_id = p_hewan_id
      AND h.deleted_at IS NULL;
END$$

-- ========================================================
-- DELETE HEWAN (soft delete)
-- ========================================================
DROP PROCEDURE IF EXISTS DeleteHewan$$
CREATE PROCEDURE DeleteHewan(IN p_hewan_id INT)
BEGIN
    DECLARE rows_affected INT;
    DECLARE kunjungan_count INT;
    DECLARE hewan_exists INT;
    DECLARE v_message VARCHAR(255);
    
    -- Check if hewan exists and not already soft-deleted
    SELECT COUNT(*) INTO hewan_exists
    FROM Hewan
    WHERE hewan_id = p_hewan_id
      AND deleted_at IS NULL;
    
    IF hewan_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Hewan tidak ditemukan atau sudah dihapus';
    END IF;
    
    -- Check if hewan has kunjungan records (only consider non-deleted kunjungan)
    SELECT COUNT(*) INTO kunjungan_count
    FROM Kunjungan
    WHERE hewan_id = p_hewan_id
      AND deleted_at IS NULL;
    
    -- Jika ada riwayat kunjungan, jangan blokir — lakukan soft delete tetapi beri pesan informatif
    IF kunjungan_count > 0 THEN
        SET v_message = 'Hewan memiliki riwayat kunjungan; melakukan soft delete. Hubungi admin untuk penghapusan permanen.';
    ELSE
        SET v_message = 'Hewan berhasil dihapus';
    END IF;
    
    -- Soft delete hewan
    UPDATE Hewan 
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE hewan_id = p_hewan_id
      AND deleted_at IS NULL;
    
    SET rows_affected = ROW_COUNT();
    
    SELECT rows_affected as affected_rows, kunjungan_count AS kunjungan_count, v_message AS message;
END$$

-- ========================================================
-- UPDATE HEWAN BY PAWRENT (Pawrent hanya bisa update hewan miliknya sendiri)
-- ========================================================
DROP PROCEDURE IF EXISTS UpdateHewanByPawrent$$
CREATE PROCEDURE UpdateHewanByPawrent(
  IN p_hewan_id INT,
  IN p_nama_hewan VARCHAR(100),
  IN p_tanggal_lahir DATE,
  IN p_jenis_kelamin VARCHAR(10),
  IN p_jenis_hewan_id INT,
  IN p_pawrent_id INT,
  IN p_status_hidup VARCHAR(10)
)
BEGIN
  DECLARE v_owner_pawrent_id INT;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  -- Pastikan hewan ada (dan tidak soft-deleted) dan ambil owner
  SELECT pawrent_id INTO v_owner_pawrent_id
  FROM Hewan
  WHERE hewan_id = p_hewan_id
    AND deleted_at IS NULL
  FOR UPDATE;

  IF v_owner_pawrent_id IS NULL THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Hewan tidak ditemukan';
  END IF;

  -- Validasi ownership
  IF v_owner_pawrent_id != p_pawrent_id THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Anda tidak memiliki hak untuk mengubah hewan ini';
  END IF;

  -- Validate tanggal lahir tidak di masa depan
  IF p_tanggal_lahir IS NOT NULL AND p_tanggal_lahir > CURDATE() THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Tanggal lahir tidak boleh di masa depan';
  END IF;

  -- Lakukan update
  UPDATE Hewan
  SET
    nama_hewan = p_nama_hewan,
    tanggal_lahir = p_tanggal_lahir,
    jenis_kelamin = p_jenis_kelamin,
    jenis_hewan_id = p_jenis_hewan_id,
    status_hidup = p_status_hidup
  WHERE hewan_id = p_hewan_id
    AND deleted_at IS NULL;

  -- Kembalikan baris yang diupdate
  SELECT hewan_id, nama_hewan, tanggal_lahir, jenis_kelamin, jenis_hewan_id, pawrent_id, status_hidup, deleted_at, (deleted_at IS NOT NULL) AS is_deleted
  FROM Hewan
  WHERE hewan_id = p_hewan_id;

  COMMIT;
END$$

-- ========================================================
-- CREATE HEWAN BY PAWRENT (Pawrent dapat create hewan untuk diri sendiri)
-- ========================================================
DROP PROCEDURE IF EXISTS CreateHewanByPawrent$$
CREATE PROCEDURE CreateHewanByPawrent(
    IN p_nama_hewan VARCHAR(50),
    IN p_tanggal_lahir DATE,
    IN p_jenis_kelamin ENUM('Jantan','Betina'),
    IN p_jenis_hewan_id INT,
    IN p_pawrent_id INT,
    IN p_status_hidup ENUM('Hidup', 'Mati')
)
BEGIN
    DECLARE new_hewan_id INT;
    DECLARE duplicate_check INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Validate pawrent exists and not soft-deleted
    SELECT COUNT(*) INTO duplicate_check
    FROM Pawrent
    WHERE pawrent_id = p_pawrent_id
      AND deleted_at IS NULL;
    
    IF duplicate_check = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Pawrent tidak ditemukan';
    END IF;
    
    -- Validate jenis hewan exists
    SELECT COUNT(*) INTO duplicate_check
    FROM Jenis_Hewan
    WHERE jenis_hewan_id = p_jenis_hewan_id;
    
    IF duplicate_check = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Jenis hewan tidak ditemukan';
    END IF;
    
    -- Validate nama_hewan is provided
    IF p_nama_hewan IS NULL OR TRIM(p_nama_hewan) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Nama hewan wajib diisi';
    END IF;
    
    -- Validate tanggal lahir tidak di masa depan
    IF p_tanggal_lahir IS NOT NULL AND p_tanggal_lahir > CURDATE() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Tanggal lahir tidak boleh di masa depan';
    END IF;
    
    -- Default status jika null
    IF p_status_hidup IS NULL THEN
        SET p_status_hidup = 'Hidup';
    END IF;
    
    -- Insert new hewan (explicit deleted_at NULL)
    INSERT INTO Hewan (
        nama_hewan,
        tanggal_lahir,
        jenis_kelamin,
        jenis_hewan_id,
        pawrent_id,
        status_hidup,
        deleted_at
    )
    VALUES (
        p_nama_hewan,
        p_tanggal_lahir,
        p_jenis_kelamin,
        p_jenis_hewan_id,
        p_pawrent_id,
        p_status_hidup,
        NULL
    );
    
    SET new_hewan_id = LAST_INSERT_ID();
    
    -- Return the new hewan with joined data
    SELECT 
        h.hewan_id,
        h.nama_hewan,
        h.tanggal_lahir,
        h.jenis_kelamin,
        h.status_hidup,
        h.jenis_hewan_id,
        h.pawrent_id,
        jh.nama_jenis_hewan,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) as nama_pawrent,
        h.deleted_at,
        (h.deleted_at IS NOT NULL) AS is_deleted,
        TIMESTAMPDIFF(YEAR, h.tanggal_lahir, CURDATE()) as umur_tahun,
        TIMESTAMPDIFF(MONTH, h.tanggal_lahir, CURDATE()) % 12 as umur_bulan
    FROM Hewan h
    INNER JOIN Jenis_Hewan jh ON h.jenis_hewan_id = jh.jenis_hewan_id
    INNER JOIN Pawrent p ON h.pawrent_id = p.pawrent_id
    WHERE h.hewan_id = new_hewan_id;
    
    COMMIT;
END$$

-- ========================================================
-- DELETE HEWAN BY PAWRENT (soft delete, hanya owner)
-- ========================================================
DROP PROCEDURE IF EXISTS DeleteHewanByPawrent$$
CREATE PROCEDURE DeleteHewanByPawrent(
    IN p_hewan_id INT,
    IN p_pawrent_id INT
)
BEGIN
    DECLARE v_owner_pawrent_id INT;
    DECLARE v_has_kunjungan INT;
    DECLARE rows_affected INT;
    DECLARE v_message VARCHAR(255);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Validate hewan exists (not soft-deleted) and get owner
    SELECT pawrent_id INTO v_owner_pawrent_id
    FROM Hewan
    WHERE hewan_id = p_hewan_id
      AND deleted_at IS NULL
    FOR UPDATE;
    
    IF v_owner_pawrent_id IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Hewan tidak ditemukan';
    END IF;
    
    -- Validate ownership
    IF v_owner_pawrent_id != p_pawrent_id THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Anda tidak memiliki izin untuk menghapus hewan ini';
    END IF;
    
    -- Check if hewan has kunjungan history (non-deleted kunjungan)
    SELECT COUNT(*) INTO v_has_kunjungan
    FROM Kunjungan
    WHERE hewan_id = p_hewan_id
      AND deleted_at IS NULL;
    
    IF v_has_kunjungan > 0 THEN
        SET v_message = 'Hewan memiliki riwayat kunjungan; melakukan soft delete. Hubungi admin untuk penghapusan permanen.';
    ELSE
        SET v_message = 'Hewan berhasil dihapus';
    END IF;
    
    -- Soft delete the hewan
    UPDATE Hewan
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE hewan_id = p_hewan_id
      AND deleted_at IS NULL;
    
    SET rows_affected = ROW_COUNT();
    
    COMMIT;
    
    -- Return success message
    SELECT 
        p_hewan_id as hewan_id,
        rows_affected AS affected_rows,
        v_has_kunjungan AS kunjungan_count,
        v_message as message;
END$$

DELIMITER ;