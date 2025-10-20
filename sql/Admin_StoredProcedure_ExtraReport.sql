-- ========================================================
-- BAGIAN 1: GetRiwayatKunjunganByHewan
-- ========================================================
DELIMITER $$

DROP PROCEDURE IF EXISTS GetRiwayatKunjunganByHewan$$
CREATE PROCEDURE GetRiwayatKunjunganByHewan (
    IN p_hewan_id INT
)
BEGIN
    SELECT 
        k.kunjungan_id AS ID_Kunjungan,
        k.tanggal_kunjungan AS Tanggal,
        d.nama_dokter AS Dokter,
        k.catatan AS Diagnosa
    FROM Kunjungan k
    JOIN Dokter d ON k.dokter_id = d.dokter_id
    WHERE k.hewan_id = p_hewan_id
    ORDER BY k.tanggal_kunjungan DESC;
END$$

DELIMITER ;

-- Cara Pakai:
-- CALL GetRiwayatKunjunganByHewan(1);

-- ========================================================
-- BAGIAN 2: GetHewanByJenis
-- ========================================================
DELIMITER $$

DROP PROCEDURE IF EXISTS GetHewanByJenis$$
CREATE PROCEDURE GetHewanByJenis (
    IN p_jenis_hewan_id INT
)
BEGIN
    SELECT 
        h.nama_hewan AS Nama_Hewan,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) AS Nama_Pemilik
    FROM Hewan h
    JOIN Pawrent p ON h.pawrent_id = p.pawrent_id
    WHERE h.jenis_hewan_id = p_jenis_hewan_id
    ORDER BY Nama_Hewan;
END$$

DELIMITER ;

-- Cara Pakai:
-- CALL GetHewanByJenis(2);

-- ========================================================
-- BAGIAN 3: GetKunjunganByDateRange
-- ========================================================
DELIMITER $$

DROP PROCEDURE IF EXISTS GetKunjunganByDateRange$$
CREATE PROCEDURE GetKunjunganByDateRange (
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
    SELECT 
        k.kunjungan_id AS ID_Kunjungan,
        k.tanggal_kunjungan AS Tanggal_Kunjungan,
        h.nama_hewan AS Nama_Hewan,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) AS Nama_Pemilik,
        d.nama_dokter AS Nama_Dokter
    FROM Kunjungan k
    JOIN Hewan h ON k.hewan_id = h.hewan_id
    JOIN Pawrent p ON h.pawrent_id = p.pawrent_id
    JOIN Dokter d ON k.dokter_id = d.dokter_id
    WHERE k.tanggal_kunjungan BETWEEN p_start_date AND p_end_date
    ORDER BY k.tanggal_kunjungan ASC;
END$$

DELIMITER ;

-- Cara Pakai:
-- CALL GetKunjunganByDateRange('2025-01-01', '2025-03-31');

-- ========================================================
-- GRANT EXECUTE untuk semua prosedur di atas
-- ========================================================
GRANT EXECUTE ON PROCEDURE vet_buddy.GetRiwayatKunjunganByHewan TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetRiwayatKunjunganByHewan TO 'vet_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetRiwayatKunjunganByHewan TO 'pawrent_user'@'localhost';

GRANT EXECUTE ON PROCEDURE vet_buddy.GetHewanByJenis TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetHewanByJenis TO 'vet_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetHewanByJenis TO 'pawrent_user'@'localhost';

GRANT EXECUTE ON PROCEDURE vet_buddy.GetKunjunganByDateRange TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetKunjunganByDateRange TO 'vet_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetKunjunganByDateRange TO 'pawrent_user'@'localhost';

FLUSH PRIVILEGES;