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
        TIMESTAMPDIFF(YEAR, h.tanggal_lahir, CURDATE()) as umur_tahun,
        TIMESTAMPDIFF(MONTH, h.tanggal_lahir, CURDATE()) % 12 as umur_bulan
    FROM Hewan h
    INNER JOIN Jenis_Hewan jh ON h.jenis_hewan_id = jh.jenis_hewan_id
    INNER JOIN Pawrent p ON h.pawrent_id = p.pawrent_id
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
        TIMESTAMPDIFF(YEAR, h.tanggal_lahir, CURDATE()) as umur_tahun,
        TIMESTAMPDIFF(MONTH, h.tanggal_lahir, CURDATE()) % 12 as umur_bulan
    FROM Hewan h
    INNER JOIN Jenis_Hewan jh ON h.jenis_hewan_id = jh.jenis_hewan_id
    INNER JOIN Pawrent p ON h.pawrent_id = p.pawrent_id
    WHERE h.hewan_id = p_hewan_id;
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
    LEFT JOIN Hewan h ON jh.jenis_hewan_id = h.jenis_hewan_id
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
    LEFT JOIN Hewan h ON p.pawrent_id = h.pawrent_id
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
    
    -- Validate pawrent exists
    SELECT COUNT(*) INTO duplicate_check
    FROM Pawrent
    WHERE pawrent_id = p_pawrent_id;
    
    IF duplicate_check = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Pawrent tidak ditemukan. Silakan pilih pawrent yang valid';
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
    
    -- ✅ Set default status_hidup if NULL
    IF p_status_hidup IS NULL THEN
        SET p_status_hidup = 'Hidup';
    END IF;
    
    -- Insert new hewan
    INSERT INTO Hewan (
        nama_hewan,
        tanggal_lahir,
        jenis_kelamin,
        jenis_hewan_id,
        pawrent_id,
        status_hidup  -- ✅ ADDED
    )
    VALUES (
        p_nama_hewan,
        p_tanggal_lahir,
        p_jenis_kelamin,
        p_jenis_hewan_id,
        p_pawrent_id,
        p_status_hidup  -- ✅ ADDED
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
    
    -- Check if hewan exists
    SELECT COUNT(*) INTO hewan_exists
    FROM Hewan
    WHERE hewan_id = p_hewan_id;
    
    IF hewan_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Hewan tidak ditemukan';
    END IF;
    
    -- PERBAIKAN: Validate pawrent exists (hanya jika p_pawrent_id diberikan)
    IF p_pawrent_id IS NOT NULL THEN
        SELECT COUNT(*) INTO duplicate_check
        FROM Pawrent
        WHERE pawrent_id = p_pawrent_id;
        
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
    
    -- Update hewan
    UPDATE Hewan
    SET 
        nama_hewan = p_nama_hewan,
        tanggal_lahir = p_tanggal_lahir,
        jenis_kelamin = p_jenis_kelamin,
        jenis_hewan_id = p_jenis_hewan_id,
        pawrent_id = p_pawrent_id,
        status_hidup = p_status_hidup
    WHERE hewan_id = p_hewan_id;
    
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
        TIMESTAMPDIFF(YEAR, h.tanggal_lahir, CURDATE()) as umur_tahun,
        TIMESTAMPDIFF(MONTH, h.tanggal_lahir, CURDATE()) % 12 as umur_bulan
    FROM Hewan h
    INNER JOIN Jenis_Hewan jh ON h.jenis_hewan_id = jh.jenis_hewan_id
    INNER JOIN Pawrent p ON h.pawrent_id = p.pawrent_id
    WHERE h.hewan_id = p_hewan_id;
END$$

-- ========================================================
-- DELETE HEWAN
-- ========================================================
DROP PROCEDURE IF EXISTS DeleteHewan$$
CREATE PROCEDURE DeleteHewan(IN p_hewan_id INT)
BEGIN
    DECLARE rows_affected INT;
    DECLARE kunjungan_count INT;
    
    -- Check if hewan has kunjungan records
    SELECT COUNT(*) INTO kunjungan_count
    FROM Kunjungan
    WHERE hewan_id = p_hewan_id;
    
    IF kunjungan_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Tidak dapat menghapus hewan yang memiliki riwayat kunjungan';
    END IF;
    
    -- Delete hewan
    DELETE FROM Hewan 
    WHERE hewan_id = p_hewan_id;
    
    SET rows_affected = ROW_COUNT();
    
    SELECT rows_affected as affected_rows;
END$$

-- ========================================================
-- UPDATE HEWAN BY PAWRENT (Pawrent hanya bisa update hewan miliknya sendiri)
-- ========================================================
DROP PROCEDURE IF EXISTS UpdateHewanByPawrent$$
CREATE PROCEDURE UpdateHewanByPawrent(
    IN p_hewan_id INT,
    IN p_nama_hewan VARCHAR(50),
    IN p_tanggal_lahir DATE,
    IN p_jenis_kelamin ENUM('Jantan','Betina'),
    IN p_jenis_hewan_id INT,
    IN p_status_hidup ENUM('Hidup', 'Mati')
)
BEGIN
    DECLARE v_owner_pawrent_id INT;
    DECLARE duplicate_check INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Validate hewan exists and get owner
    SELECT pawrent_id INTO v_owner_pawrent_id
    FROM Hewan
    WHERE hewan_id = p_hewan_id;
    
    IF v_owner_pawrent_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Hewan tidak ditemukan';
    END IF;
    
    -- Note: Ownership check dilakukan di aplikasi layer (backend)
    -- karena pawrent_id diambil dari session user yang login
    
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
    
    -- Update hewan data
    UPDATE Hewan
    SET 
        nama_hewan = p_nama_hewan,
        tanggal_lahir = p_tanggal_lahir,
        jenis_kelamin = p_jenis_kelamin,
        jenis_hewan_id = p_jenis_hewan_id,
        status_hidup = p_status_hidup
    WHERE hewan_id = p_hewan_id;
    
    -- Return the updated hewan with joined data
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
        TIMESTAMPDIFF(YEAR, h.tanggal_lahir, CURDATE()) as umur_tahun,
        TIMESTAMPDIFF(MONTH, h.tanggal_lahir, CURDATE()) % 12 as umur_bulan
    FROM Hewan h
    INNER JOIN Jenis_Hewan jh ON h.jenis_hewan_id = jh.jenis_hewan_id
    INNER JOIN Pawrent p ON h.pawrent_id = p.pawrent_id
    WHERE h.hewan_id = p_hewan_id;
    
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
    
    -- Validate pawrent exists
    SELECT COUNT(*) INTO duplicate_check
    FROM Pawrent
    WHERE pawrent_id = p_pawrent_id;
    
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
    
    -- Insert new hewan
    INSERT INTO Hewan (
        nama_hewan,
        tanggal_lahir,
        jenis_kelamin,
        jenis_hewan_id,
        pawrent_id,
        status_hidup
    )
    VALUES (
        p_nama_hewan,
        p_tanggal_lahir,
        p_jenis_kelamin,
        p_jenis_hewan_id,
        p_pawrent_id,
        p_status_hidup
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
        TIMESTAMPDIFF(YEAR, h.tanggal_lahir, CURDATE()) as umur_tahun,
        TIMESTAMPDIFF(MONTH, h.tanggal_lahir, CURDATE()) % 12 as umur_bulan
    FROM Hewan h
    INNER JOIN Jenis_Hewan jh ON h.jenis_hewan_id = jh.jenis_hewan_id
    INNER JOIN Pawrent p ON h.pawrent_id = p.pawrent_id
    WHERE h.hewan_id = new_hewan_id;
    
    COMMIT;
END$$

-- ========================================================
-- DELETE HEWAN BY PAWRENT (Pawrent hanya bisa hapus hewan miliknya sendiri)
-- ========================================================
DROP PROCEDURE IF EXISTS DeleteHewanByPawrent$$
CREATE PROCEDURE DeleteHewanByPawrent(
    IN p_hewan_id INT,
    IN p_pawrent_id INT
)
BEGIN
    DECLARE v_owner_pawrent_id INT;
    DECLARE v_has_kunjungan INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Validate hewan exists and get owner
    SELECT pawrent_id INTO v_owner_pawrent_id
    FROM Hewan
    WHERE hewan_id = p_hewan_id;
    
    IF v_owner_pawrent_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Hewan tidak ditemukan';
    END IF;
    
    -- Validate ownership
    IF v_owner_pawrent_id != p_pawrent_id THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Anda tidak memiliki izin untuk menghapus hewan ini';
    END IF;
    
    -- Check if hewan has kunjungan history
    SELECT COUNT(*) INTO v_has_kunjungan
    FROM Kunjungan
    WHERE hewan_id = p_hewan_id;
    
    IF v_has_kunjungan > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Tidak dapat menghapus hewan yang memiliki riwayat kunjungan. Hubungi admin untuk bantuan.';
    END IF;
    
    -- Delete the hewan
    DELETE FROM Hewan
    WHERE hewan_id = p_hewan_id;
    
    COMMIT;
    
    -- Return success message
    SELECT 
        p_hewan_id as hewan_id,
        'Hewan berhasil dihapus' as message;
END$$

DELIMITER ;