DELIMITER $$

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

DROP PROCEDURE IF EXISTS CreateJenisHewan$$
CREATE PROCEDURE CreateJenisHewan(
    IN p_nama_jenis_hewan VARCHAR(50),
    IN p_deskripsi_jenis_hewan VARCHAR(255)
)
BEGIN
    INSERT INTO Jenis_Hewan (nama_jenis_hewan, deskripsi_jenis_hewan)
    VALUES (p_nama_jenis_hewan, p_deskripsi_jenis_hewan);
    SELECT * FROM Jenis_Hewan WHERE jenis_hewan_id = LAST_INSERT_ID();
END$$

DROP PROCEDURE IF EXISTS UpdateJenisHewan$$
CREATE PROCEDURE UpdateJenisHewan(
    IN p_jenis_hewan_id INT,
    IN p_nama_jenis_hewan VARCHAR(50),
    IN p_deskripsi_jenis_hewan VARCHAR(255)
)
BEGIN
    UPDATE Jenis_Hewan
    SET nama_jenis_hewan = p_nama_jenis_hewan,
        deskripsi_jenis_hewan = p_deskripsi_jenis_hewan
    WHERE jenis_hewan_id = p_jenis_hewan_id;
    SELECT * FROM Jenis_Hewan WHERE jenis_hewan_id = p_jenis_hewan_id;
END$$

DROP PROCEDURE IF EXISTS DeleteJenisHewan$$
CREATE PROCEDURE DeleteJenisHewan(
    IN p_jenis_hewan_id INT
)
BEGIN
    DELETE FROM Jenis_Hewan WHERE jenis_hewan_id = p_jenis_hewan_id;
END$$

DELIMITER ;