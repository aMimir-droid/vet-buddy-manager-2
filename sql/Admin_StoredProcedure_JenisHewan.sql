DELIMITER $$

DROP PROCEDURE IF EXISTS GetAllJenisHewan$$
CREATE PROCEDURE GetAllJenisHewan()
BEGIN
    SELECT 
        jh.jenis_hewan_id,
        jh.nama_jenis_hewan,
        jh.deskripsi_jenis_hewan,
        jh.deleted_at,
        (jh.deleted_at IS NOT NULL) AS is_deleted,
        COUNT(h.hewan_id) AS jumlah_hewan
    FROM Jenis_Hewan jh
    LEFT JOIN Hewan h 
        ON jh.jenis_hewan_id = h.jenis_hewan_id
        AND h.deleted_at IS NULL
    WHERE jh.deleted_at IS NULL
    GROUP BY jh.jenis_hewan_id
    ORDER BY jh.nama_jenis_hewan;
END$$

DROP PROCEDURE IF EXISTS GetJenisHewanById$$
CREATE PROCEDURE GetJenisHewanById(IN p_jenis_hewan_id INT)
BEGIN
    SELECT 
        jh.jenis_hewan_id,
        jh.nama_jenis_hewan,
        jh.deskripsi_jenis_hewan,
        jh.deleted_at,
        (jh.deleted_at IS NOT NULL) AS is_deleted,
        COUNT(h.hewan_id) AS jumlah_hewan
    FROM Jenis_Hewan jh
    LEFT JOIN Hewan h 
        ON jh.jenis_hewan_id = h.jenis_hewan_id
        AND h.deleted_at IS NULL
    WHERE jh.jenis_hewan_id = p_jenis_hewan_id
      AND jh.deleted_at IS NULL
    GROUP BY jh.jenis_hewan_id;
END$$

DROP PROCEDURE IF EXISTS CreateJenisHewan$$
CREATE PROCEDURE CreateJenisHewan(
    IN p_nama_jenis_hewan VARCHAR(50),
    IN p_deskripsi_jenis_hewan VARCHAR(255)
)
BEGIN
    -- Validasi nama tidak kosong
    IF p_nama_jenis_hewan IS NULL OR TRIM(p_nama_jenis_hewan) = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Nama jenis hewan wajib diisi';
    END IF;

    INSERT INTO Jenis_Hewan (nama_jenis_hewan, deskripsi_jenis_hewan, deleted_at)
    VALUES (p_nama_jenis_hewan, p_deskripsi_jenis_hewan, NULL);

    SELECT 
        jenis_hewan_id,
        nama_jenis_hewan,
        deskripsi_jenis_hewan,
        deleted_at
    FROM Jenis_Hewan
    WHERE jenis_hewan_id = LAST_INSERT_ID()
      AND deleted_at IS NULL;
END$$

DROP PROCEDURE IF EXISTS UpdateJenisHewan$$
CREATE PROCEDURE UpdateJenisHewan(
    IN p_jenis_hewan_id INT,
    IN p_nama_jenis_hewan VARCHAR(50),
    IN p_deskripsi_jenis_hewan VARCHAR(255)
)
BEGIN
    DECLARE exists_active INT DEFAULT 0;

    -- Pastikan record ada dan belum di-soft-delete
    SELECT COUNT(*) INTO exists_active
    FROM Jenis_Hewan
    WHERE jenis_hewan_id = p_jenis_hewan_id
      AND deleted_at IS NULL;

    IF exists_active = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Jenis hewan tidak ditemukan atau sudah dihapus';
    END IF;

    -- Validasi nama tidak kosong
    IF p_nama_jenis_hewan IS NULL OR TRIM(p_nama_jenis_hewan) = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Nama jenis hewan wajib diisi';
    END IF;

    UPDATE Jenis_Hewan
    SET nama_jenis_hewan = p_nama_jenis_hewan,
        deskripsi_jenis_hewan = p_deskripsi_jenis_hewan
    WHERE jenis_hewan_id = p_jenis_hewan_id
      AND deleted_at IS NULL;

    -- Kembalikan data yang telah diupdate (hanya jika tidak soft-deleted)
    SELECT 
        jh.jenis_hewan_id,
        jh.nama_jenis_hewan,
        jh.deskripsi_jenis_hewan,
        jh.deleted_at,
        (jh.deleted_at IS NOT NULL) AS is_deleted,
        COUNT(h.hewan_id) AS jumlah_hewan
    FROM Jenis_Hewan jh
    LEFT JOIN Hewan h 
        ON jh.jenis_hewan_id = h.jenis_hewan_id
        AND h.deleted_at IS NULL
    WHERE jh.jenis_hewan_id = p_jenis_hewan_id
    GROUP BY jh.jenis_hewan_id;
END$$

DROP PROCEDURE IF EXISTS DeleteJenisHewan$$
CREATE PROCEDURE DeleteJenisHewan(IN p_jenis_hewan_id INT)
BEGIN
    DECLARE exists_active INT DEFAULT 0;

    -- Pastikan record ada dan belum di-soft-delete
    SELECT COUNT(*) INTO exists_active
    FROM Jenis_Hewan
    WHERE jenis_hewan_id = p_jenis_hewan_id
      AND deleted_at IS NULL;

    IF exists_active = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Jenis hewan tidak ditemukan atau sudah dihapus';
    END IF;

    -- Soft delete
    UPDATE Jenis_Hewan
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE jenis_hewan_id = p_jenis_hewan_id
      AND deleted_at IS NULL;

    SELECT ROW_COUNT() AS affected_rows;
END$$

DELIMITER ;