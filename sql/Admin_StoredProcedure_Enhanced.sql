DELIMITER $$

-- ========================================================
-- KUNJUNGAN CRUD
-- ========================================================

DROP PROCEDURE IF EXISTS CreateKunjungan$$
CREATE PROCEDURE CreateKunjungan (
    IN p_hewan_id INT,
    IN p_dokter_id INT,
    IN p_tanggal_kunjungan DATE,
    IN p_waktu_kunjungan TIME,
    IN p_catatan TEXT,
    IN p_total_biaya DECIMAL(10,2),
    IN p_metode_pembayaran ENUM('Cash','Transfer','E-Wallet'),
    IN p_kunjungan_sebelumnya INT
)
BEGIN
    DECLARE new_id INT;
    
    INSERT INTO Kunjungan (
        hewan_id, 
        dokter_id, 
        tanggal_kunjungan, 
        waktu_kunjungan, 
        catatan, 
        total_biaya, 
        metode_pembayaran,
        kunjungan_sebelumnya
    )
    VALUES (
        p_hewan_id, 
        p_dokter_id, 
        p_tanggal_kunjungan, 
        p_waktu_kunjungan, 
        p_catatan, 
        p_total_biaya, 
        p_metode_pembayaran,
        p_kunjungan_sebelumnya
    );
    
    SET new_id = LAST_INSERT_ID();
    
    SELECT 
        k.kunjungan_id,
        k.hewan_id,
        k.dokter_id,
        k.tanggal_kunjungan,
        k.waktu_kunjungan,
        k.catatan,
        k.total_biaya,
        k.metode_pembayaran,
        k.kunjungan_sebelumnya,
        h.nama_hewan,
        CONCAT(d.title_dokter, ' ', d.nama_dokter) as nama_dokter,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) as nama_pawrent
    FROM Kunjungan k
    JOIN Hewan h ON k.hewan_id = h.hewan_id
    JOIN Dokter d ON k.dokter_id = d.dokter_id
    JOIN Pawrent p ON h.pawrent_id = p.pawrent_id
    WHERE k.kunjungan_id = new_id;
END$$

DROP PROCEDURE IF EXISTS UpdateKunjungan$$
CREATE PROCEDURE UpdateKunjungan (
    IN p_kunjungan_id INT,
    IN p_hewan_id INT,
    IN p_dokter_id INT,
    IN p_tanggal_kunjungan DATE,
    IN p_waktu_kunjungan TIME,
    IN p_catatan TEXT,
    IN p_total_biaya DECIMAL(10,2),
    IN p_metode_pembayaran ENUM('Cash','Transfer','E-Wallet'),
    IN p_kunjungan_sebelumnya INT
)
BEGIN
    UPDATE Kunjungan
    SET 
        hewan_id = p_hewan_id,
        dokter_id = p_dokter_id,
        tanggal_kunjungan = p_tanggal_kunjungan,
        waktu_kunjungan = p_waktu_kunjungan,
        catatan = p_catatan,
        total_biaya = p_total_biaya,
        metode_pembayaran = p_metode_pembayaran,
        kunjungan_sebelumnya = p_kunjungan_sebelumnya
    WHERE kunjungan_id = p_kunjungan_id;
    
    SELECT 
        k.kunjungan_id,
        k.hewan_id,
        k.dokter_id,
        k.tanggal_kunjungan,
        k.waktu_kunjungan,
        k.catatan,
        k.total_biaya,
        k.metode_pembayaran,
        k.kunjungan_sebelumnya,
        h.nama_hewan,
        CONCAT(d.title_dokter, ' ', d.nama_dokter) as nama_dokter,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) as nama_pawrent
    FROM Kunjungan k
    JOIN Hewan h ON k.hewan_id = h.hewan_id
    JOIN Dokter d ON k.dokter_id = d.dokter_id
    JOIN Pawrent p ON h.pawrent_id = p.pawrent_id
    WHERE k.kunjungan_id = p_kunjungan_id;
END$$

-- ========================================================
-- GET ALL KUNJUNGAN
-- ========================================================
DROP PROCEDURE IF EXISTS GetAllKunjungan$$
CREATE PROCEDURE GetAllKunjungan()
BEGIN
    SELECT 
        k.kunjungan_id,
        k.hewan_id,
        k.dokter_id,
        k.tanggal_kunjungan,
        k.waktu_kunjungan,
        k.catatan,
        k.total_biaya,
        k.metode_pembayaran,
        k.kunjungan_sebelumnya,
        h.nama_hewan,
        CONCAT(d.title_dokter, ' ', d.nama_dokter) as nama_dokter,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) as nama_pawrent
    FROM Kunjungan k
    JOIN Hewan h ON k.hewan_id = h.hewan_id
    JOIN Dokter d ON k.dokter_id = d.dokter_id
    JOIN Pawrent p ON h.pawrent_id = p.pawrent_id
    ORDER BY k.tanggal_kunjungan DESC, k.waktu_kunjungan DESC;
END$$

-- ========================================================
-- GET KUNJUNGAN BY ID
-- ========================================================
DROP PROCEDURE IF EXISTS GetKunjunganById$$
CREATE PROCEDURE GetKunjunganById(IN p_kunjungan_id INT)
BEGIN
    SELECT 
        k.kunjungan_id,
        k.hewan_id,
        k.dokter_id,
        k.tanggal_kunjungan,
        k.waktu_kunjungan,
        k.catatan,
        k.total_biaya,
        k.metode_pembayaran,
        k.kunjungan_sebelumnya,
        h.nama_hewan,
        CONCAT(d.title_dokter, ' ', d.nama_dokter) as nama_dokter,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) as nama_pawrent
    FROM Kunjungan k
    JOIN Hewan h ON k.hewan_id = h.hewan_id
    JOIN Dokter d ON k.dokter_id = d.dokter_id
    JOIN Pawrent p ON h.pawrent_id = p.pawrent_id
    WHERE k.kunjungan_id = p_kunjungan_id;
END$$

-- ========================================================
-- GET HEWAN HISTORY
-- ========================================================
DROP PROCEDURE IF EXISTS GetHewanKunjunganHistory$$
CREATE PROCEDURE GetHewanKunjunganHistory(IN p_hewan_id INT)
BEGIN
    SELECT 
        k.kunjungan_id,
        k.tanggal_kunjungan,
        k.waktu_kunjungan,
        k.catatan,
        k.total_biaya,
        k.metode_pembayaran,
        k.kunjungan_sebelumnya,
        CONCAT(d.title_dokter, ' ', d.nama_dokter) as nama_dokter
    FROM Kunjungan k
    JOIN Dokter d ON k.dokter_id = d.dokter_id
    WHERE k.hewan_id = p_hewan_id
    ORDER BY k.tanggal_kunjungan DESC, k.waktu_kunjungan DESC
    LIMIT 10;
END$$

-- ========================================================
-- DELETE KUNJUNGAN
-- ========================================================
DROP PROCEDURE IF EXISTS DeleteKunjungan$$
CREATE PROCEDURE DeleteKunjungan(IN p_kunjungan_id INT)
BEGIN
    DECLARE rows_affected INT;
    
    DELETE FROM Kunjungan 
    WHERE kunjungan_id = p_kunjungan_id;
    
    SET rows_affected = ROW_COUNT();
    
    SELECT rows_affected as affected_rows;
END$$

DELIMITER ;