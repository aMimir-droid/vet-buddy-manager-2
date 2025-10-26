DELIMITER $$

-- ========================================================
-- STORED PROCEDURES KUNJUNGAN_OBAT (DISESUAIKAN DENGAN SCHEMA BARU)
-- - Primary key: kunjungan_obat_id
-- - Menyertakan qty dan harga_saat_itu (dapat di-set otomatis dari Obat.harga_obat)
-- - Mengembalikan baris yang dibuat / diupdate dengan total_biaya = qty * harga_saat_itu
-- ========================================================

-- ========================================================
-- GET OBAT BY KUNJUNGAN
-- ========================================================
DROP PROCEDURE IF EXISTS GetObatByKunjungan$$
CREATE PROCEDURE GetObatByKunjungan(
    IN p_kunjungan_id INT
)
BEGIN
    SELECT 
        ko.kunjungan_obat_id,
        ko.kunjungan_id,
        ko.obat_id,
        o.nama_obat,
        o.kegunaan,
        ko.qty,
        ko.harga_saat_itu,
        ko.dosis,
        ko.frekuensi,
        (ko.qty * ko.harga_saat_itu) AS total_biaya
    FROM Kunjungan_Obat ko
    INNER JOIN Obat o ON ko.obat_id = o.obat_id
    WHERE ko.kunjungan_id = p_kunjungan_id
    ORDER BY o.nama_obat;
END$$

-- ========================================================
-- CREATE KUNJUNGAN OBAT
-- ========================================================
DROP PROCEDURE IF EXISTS CreateKunjunganObat$$
CREATE PROCEDURE CreateKunjunganObat(
    IN p_kunjungan_id INT,
    IN p_obat_id INT,
    IN p_qty INT,
    IN p_harga_saat_itu DECIMAL(12,2), -- boleh NULL untuk ambil harga master
    IN p_dosis VARCHAR(100),
    IN p_frekuensi VARCHAR(100)
)
BEGIN
    DECLARE v_harga DECIMAL(12,2);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Validasi dasar
    IF p_kunjungan_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Parameter kunjungan_id wajib diisi';
    END IF;

    IF p_obat_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Parameter obat_id wajib diisi';
    END IF;

    IF p_qty IS NULL OR p_qty <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Qty harus lebih dari 0';
    END IF;

    -- Pastikan kunjungan & obat ada
    IF NOT EXISTS (SELECT 1 FROM Kunjungan WHERE kunjungan_id = p_kunjungan_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Kunjungan tidak ditemukan';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM Obat WHERE obat_id = p_obat_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Obat tidak ditemukan';
    END IF;

    -- Cegah duplikat obat pada satu kunjungan (jika kebijakan proyek demikian)
    IF EXISTS (SELECT 1 FROM Kunjungan_Obat WHERE kunjungan_id = p_kunjungan_id AND obat_id = p_obat_id) THEN
        SIGNAL SQLSTATE '23000' SET MESSAGE_TEXT = 'Obat sudah ada dalam kunjungan ini';
    END IF;

    -- Tentukan harga saat itu: parameter > master harga obat
    IF p_harga_saat_itu IS NOT NULL THEN
        SET v_harga = p_harga_saat_itu;
    ELSE
        SELECT harga_obat INTO v_harga FROM Obat WHERE obat_id = p_obat_id LIMIT 1;
        IF v_harga IS NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Tidak dapat menentukan harga obat';
        END IF;
    END IF;

    INSERT INTO Kunjungan_Obat (
        kunjungan_id,
        obat_id,
        qty,
        harga_saat_itu,
        dosis,
        frekuensi
    ) VALUES (
        p_kunjungan_id,
        p_obat_id,
        p_qty,
        v_harga,
        p_dosis,
        p_frekuensi
    );

    -- Kembalikan baris yang baru dibuat
    SELECT 
        ko.kunjungan_obat_id,
        ko.kunjungan_id,
        ko.obat_id,
        o.nama_obat,
        o.kegunaan,
        ko.qty,
        ko.harga_saat_itu,
        ko.dosis,
        ko.frekuensi,
        (ko.qty * ko.harga_saat_itu) AS total_biaya
    FROM Kunjungan_Obat ko
    INNER JOIN Obat o ON ko.obat_id = o.obat_id
    WHERE ko.kunjungan_obat_id = LAST_INSERT_ID();

    COMMIT;
END$$

-- ========================================================
-- UPDATE KUNJUNGAN OBAT
-- ========================================================
DROP PROCEDURE IF EXISTS UpdateKunjunganObat$$
CREATE PROCEDURE UpdateKunjunganObat(
    IN p_kunjungan_obat_id INT,
    IN p_qty INT,
    IN p_harga_saat_itu DECIMAL(12,2), -- boleh NULL untuk tidak mengubah harga
    IN p_dosis VARCHAR(100),
    IN p_frekuensi VARCHAR(100)
)
BEGIN
    DECLARE v_exists INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    IF p_kunjungan_obat_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Parameter kunjungan_obat_id wajib diisi';
    END IF;

    SELECT COUNT(*) INTO v_exists FROM Kunjungan_Obat WHERE kunjungan_obat_id = p_kunjungan_obat_id;
    IF v_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Data obat kunjungan tidak ditemukan';
    END IF;

    -- Validasi qty bila diberikan
    IF p_qty IS NOT NULL AND p_qty <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Qty harus lebih dari 0';
    END IF;

    UPDATE Kunjungan_Obat
    SET
        qty = COALESCE(p_qty, qty),
        harga_saat_itu = COALESCE(p_harga_saat_itu, harga_saat_itu),
        dosis = COALESCE(p_dosis, dosis),
        frekuensi = COALESCE(p_frekuensi, frekuensi)
    WHERE kunjungan_obat_id = p_kunjungan_obat_id;

    -- Kembalikan data yang diupdate
    SELECT 
        ko.kunjungan_obat_id,
        ko.kunjungan_id,
        ko.obat_id,
        o.nama_obat,
        o.kegunaan,
        ko.qty,
        ko.harga_saat_itu,
        ko.dosis,
        ko.frekuensi,
        (ko.qty * ko.harga_saat_itu) AS total_biaya
    FROM Kunjungan_Obat ko
    INNER JOIN Obat o ON ko.obat_id = o.obat_id
    WHERE ko.kunjungan_obat_id = p_kunjungan_obat_id;

    COMMIT;
END$$

-- ========================================================
-- DELETE KUNJUNGAN OBAT
-- ========================================================
DROP PROCEDURE IF EXISTS DeleteKunjunganObat$$
CREATE PROCEDURE DeleteKunjunganObat(
    IN p_kunjungan_obat_id INT
)
BEGIN
    DECLARE v_exists INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    IF p_kunjungan_obat_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Parameter kunjungan_obat_id wajib diisi';
    END IF;

    SELECT COUNT(*) INTO v_exists FROM Kunjungan_Obat WHERE kunjungan_obat_id = p_kunjungan_obat_id;
    IF v_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Data obat kunjungan tidak ditemukan';
    END IF;

    DELETE FROM Kunjungan_Obat WHERE kunjungan_obat_id = p_kunjungan_obat_id;

    SELECT ROW_COUNT() AS affected_rows;

    COMMIT;
END$$

DELIMITER ;