-- ========================================================
-- STORED PROCEDURES untuk CRUD Operations
-- Database: vet_buddy
-- ========================================================

DELIMITER $$

-- ========================================================
-- READ PROCEDURES (Yang sudah ada, ditambahkan JOIN)
-- ========================================================

-- Get Riwayat Kunjungan by Hewan (dengan JOIN)
DROP PROCEDURE IF EXISTS GetRiwayatKunjunganByHewan$$
CREATE PROCEDURE GetRiwayatKunjunganByHewan (
    IN p_hewan_id INT
)
BEGIN
    SELECT 
        k.kunjungan_id,
        k.tanggal_kunjungan,
        k.waktu_kunjungan,
        k.catatan,
        k.total_biaya,
        k.metode_pembayaran,
        d.dokter_id,
        d.nama_dokter,
        d.title_dokter,
        s.nama_spesialisasi,
        h.nama_hewan,
        jh.nama_jenis_hewan,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) AS nama_pawrent
    FROM Kunjungan k
    JOIN Dokter d ON k.dokter_id = d.dokter_id
    JOIN Hewan h ON k.hewan_id = h.hewan_id
    JOIN Jenis_Hewan jh ON h.jenis_hewan_id = jh.jenis_hewan_id
    JOIN Pawrent p ON h.pawrent_id = p.pawrent_id
    LEFT JOIN Spesialisasi s ON d.spesialisasi_id = s.spesialisasi_id
    WHERE k.hewan_id = p_hewan_id
    ORDER BY k.tanggal_kunjungan DESC, k.waktu_kunjungan DESC;
END$$

-- Get Hewan by Jenis (dengan JOIN)
DROP PROCEDURE IF EXISTS GetHewanByJenis$$
CREATE PROCEDURE GetHewanByJenis (
    IN p_jenis_hewan_id INT
)
BEGIN
    SELECT 
        h.hewan_id,
        h.nama_hewan,
        h.tanggal_lahir,
        h.jenis_kelamin,
        h.status_hidup,
        jh.nama_jenis_hewan,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) AS nama_pawrent,
        p.nomor_hp,
        p.kota_pawrent,
        TIMESTAMPDIFF(YEAR, h.tanggal_lahir, CURDATE()) AS umur_tahun
    FROM Hewan h
    JOIN Jenis_Hewan jh ON h.jenis_hewan_id = jh.jenis_hewan_id
    JOIN Pawrent p ON h.pawrent_id = p.pawrent_id
    WHERE h.jenis_hewan_id = p_jenis_hewan_id
    ORDER BY h.nama_hewan;
END$$

-- Get Kunjungan by Date Range (dengan JOIN)
DROP PROCEDURE IF EXISTS GetKunjunganByDateRange$$
CREATE PROCEDURE GetKunjunganByDateRange (
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
    SELECT 
        k.kunjungan_id,
        k.tanggal_kunjungan,
        k.waktu_kunjungan,
        k.total_biaya,
        k.metode_pembayaran,
        h.nama_hewan,
        jh.nama_jenis_hewan,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) AS nama_pawrent,
        p.nomor_hp,
        d.nama_dokter,
        d.title_dokter,
        kl.nama_klinik
    FROM Kunjungan k
    JOIN Hewan h ON k.hewan_id = h.hewan_id
    JOIN Jenis_Hewan jh ON h.jenis_hewan_id = jh.jenis_hewan_id
    JOIN Pawrent p ON h.pawrent_id = p.pawrent_id
    JOIN Dokter d ON k.dokter_id = d.dokter_id
    LEFT JOIN Klinik kl ON d.klinik_id = kl.klinik_id
    WHERE k.tanggal_kunjungan BETWEEN p_start_date AND p_end_date
    ORDER BY k.tanggal_kunjungan DESC, k.waktu_kunjungan DESC;
END$$

-- ========================================================
-- CREATE PROCEDURES (Untuk INSERT)
-- ========================================================

-- Create Kunjungan
DROP PROCEDURE IF EXISTS CreateKunjungan$$
CREATE PROCEDURE CreateKunjungan (
    IN p_hewan_id INT,
    IN p_dokter_id INT,
    IN p_tanggal_kunjungan DATE,
    IN p_waktu_kunjungan TIME,
    IN p_catatan TEXT,
    IN p_total_biaya DECIMAL(12,2),
    IN p_metode_pembayaran ENUM('Cash','Transfer','E-Wallet'),
    IN p_kunjungan_sebelumnya INT
)
BEGIN
    DECLARE new_kunjungan_id INT;
    
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
    
    SET new_kunjungan_id = LAST_INSERT_ID();
    
    -- Return the new kunjungan with JOIN data
    SELECT 
        k.kunjungan_id,
        k.tanggal_kunjungan,
        k.waktu_kunjungan,
        k.catatan,
        k.total_biaya,
        k.metode_pembayaran,
        h.nama_hewan,
        d.nama_dokter
    FROM Kunjungan k
    JOIN Hewan h ON k.hewan_id = h.hewan_id
    JOIN Dokter d ON k.dokter_id = d.dokter_id
    WHERE k.kunjungan_id = new_kunjungan_id;
END$$

-- Create Hewan
DROP PROCEDURE IF EXISTS CreateHewan$$
CREATE PROCEDURE CreateHewan (
    IN p_nama_hewan VARCHAR(50),
    IN p_tanggal_lahir DATE,
    IN p_jenis_kelamin ENUM('Jantan','Betina'),
    IN p_jenis_hewan_id INT,
    IN p_pawrent_id INT
)
BEGIN
    DECLARE new_hewan_id INT;
    
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
        'Hidup'
    );
    
    SET new_hewan_id = LAST_INSERT_ID();
    
    -- Return the new hewan with JOIN data
    SELECT 
        h.hewan_id,
        h.nama_hewan,
        h.tanggal_lahir,
        h.jenis_kelamin,
        h.status_hidup,
        jh.nama_jenis_hewan,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) AS nama_pawrent
    FROM Hewan h
    JOIN Jenis_Hewan jh ON h.jenis_hewan_id = jh.jenis_hewan_id
    JOIN Pawrent p ON h.pawrent_id = p.pawrent_id
    WHERE h.hewan_id = new_hewan_id;
END$$

-- Create Pawrent
DROP PROCEDURE IF EXISTS CreatePawrent$$
CREATE PROCEDURE CreatePawrent (
    IN p_nama_depan VARCHAR(50),
    IN p_nama_belakang VARCHAR(50),
    IN p_alamat VARCHAR(200),
    IN p_kota VARCHAR(100),
    IN p_kode_pos VARCHAR(10),
    IN p_dokter_id INT,
    IN p_nomor_hp VARCHAR(15)
)
BEGIN
    DECLARE new_pawrent_id INT;
    
    INSERT INTO Pawrent (
        nama_depan_pawrent,
        nama_belakang_pawrent,
        alamat_pawrent,
        kota_pawrent,
        kode_pos_pawrent,
        dokter_id,
        nomor_hp
    )
    VALUES (
        p_nama_depan,
        p_nama_belakang,
        p_alamat,
        p_kota,
        p_kode_pos,
        p_dokter_id,
        p_nomor_hp
    );
    
    SET new_pawrent_id = LAST_INSERT_ID();
    
    SELECT 
        p.*,
        d.nama_dokter,
        d.title_dokter
    FROM Pawrent p
    JOIN Dokter d ON p.dokter_id = d.dokter_id
    WHERE p.pawrent_id = new_pawrent_id;
END$$

-- ========================================================
-- UPDATE PROCEDURES
-- ========================================================

-- Update Kunjungan
DROP PROCEDURE IF EXISTS UpdateKunjungan$$
CREATE PROCEDURE UpdateKunjungan (
    IN p_kunjungan_id INT,
    IN p_tanggal_kunjungan DATE,
    IN p_waktu_kunjungan TIME,
    IN p_catatan TEXT,
    IN p_total_biaya DECIMAL(12,2),
    IN p_metode_pembayaran ENUM('Cash','Transfer','E-Wallet')
)
BEGIN
    UPDATE Kunjungan
    SET 
        tanggal_kunjungan = p_tanggal_kunjungan,
        waktu_kunjungan = p_waktu_kunjungan,
        catatan = p_catatan,
        total_biaya = p_total_biaya,
        metode_pembayaran = p_metode_pembayaran
    WHERE kunjungan_id = p_kunjungan_id;
    
    -- Return updated data with JOIN
    SELECT 
        k.*,
        h.nama_hewan,
        d.nama_dokter
    FROM Kunjungan k
    JOIN Hewan h ON k.hewan_id = h.hewan_id
    JOIN Dokter d ON k.dokter_id = d.dokter_id
    WHERE k.kunjungan_id = p_kunjungan_id;
END$$

-- Update Hewan
DROP PROCEDURE IF EXISTS UpdateHewan$$
CREATE PROCEDURE UpdateHewan (
    IN p_hewan_id INT,
    IN p_nama_hewan VARCHAR(50),
    IN p_status_hidup ENUM('Hidup','Mati')
)
BEGIN
    UPDATE Hewan
    SET 
        nama_hewan = p_nama_hewan,
        status_hidup = p_status_hidup
    WHERE hewan_id = p_hewan_id;
    
    -- Return updated data with JOIN
    SELECT 
        h.*,
        jh.nama_jenis_hewan,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) AS nama_pawrent
    FROM Hewan h
    JOIN Jenis_Hewan jh ON h.jenis_hewan_id = jh.jenis_hewan_id
    JOIN Pawrent p ON h.pawrent_id = p.pawrent_id
    WHERE h.hewan_id = p_hewan_id;
END$$

-- Update Pawrent
DROP PROCEDURE IF EXISTS UpdatePawrent$$
CREATE PROCEDURE UpdatePawrent (
    IN p_pawrent_id INT,
    IN p_nama_depan VARCHAR(50),
    IN p_nama_belakang VARCHAR(50),
    IN p_alamat VARCHAR(200),
    IN p_kota VARCHAR(100),
    IN p_kode_pos VARCHAR(10),
    IN p_nomor_hp VARCHAR(15)
)
BEGIN
    UPDATE Pawrent
    SET 
        nama_depan_pawrent = p_nama_depan,
        nama_belakang_pawrent = p_nama_belakang,
        alamat_pawrent = p_alamat,
        kota_pawrent = p_kota,
        kode_pos_pawrent = p_kode_pos,
        nomor_hp = p_nomor_hp
    WHERE pawrent_id = p_pawrent_id;
    
    SELECT 
        p.*,
        d.nama_dokter
    FROM Pawrent p
    JOIN Dokter d ON p.dokter_id = d.dokter_id
    WHERE p.pawrent_id = p_pawrent_id;
END$$

-- ========================================================
-- DELETE PROCEDURES
-- ========================================================

-- Delete Kunjungan
DROP PROCEDURE IF EXISTS DeleteKunjungan$$
CREATE PROCEDURE DeleteKunjungan (
    IN p_kunjungan_id INT
)
BEGIN
    DELETE FROM Kunjungan
    WHERE kunjungan_id = p_kunjungan_id;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

-- Delete Hewan (Soft Delete - ubah status menjadi Mati)
DROP PROCEDURE IF EXISTS DeleteHewan$$
CREATE PROCEDURE DeleteHewan (
    IN p_hewan_id INT
)
BEGIN
    UPDATE Hewan
    SET status_hidup = 'Mati'
    WHERE hewan_id = p_hewan_id;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

-- ========================================================
-- UTILITY PROCEDURES (untuk Profile & Dashboard)
-- ========================================================

-- Get Dokter Profile
DROP PROCEDURE IF EXISTS GetDokterProfile$$
CREATE PROCEDURE GetDokterProfile (
    IN p_dokter_id INT
)
BEGIN
    SELECT 
        d.*,
        s.nama_spesialisasi,
        s.deskripsi_spesialisasi,
        kl.nama_klinik,
        kl.alamat_klinik,
        kl.telepon_klinik,
        COUNT(DISTINCT k.kunjungan_id) as total_kunjungan,
        COUNT(DISTINCT p.pawrent_id) as total_pawrent
    FROM Dokter d
    LEFT JOIN Spesialisasi s ON d.spesialisasi_id = s.spesialisasi_id
    LEFT JOIN Klinik kl ON d.klinik_id = kl.klinik_id
    LEFT JOIN Kunjungan k ON d.dokter_id = k.dokter_id
    LEFT JOIN Pawrent p ON d.dokter_id = p.dokter_id
    WHERE d.dokter_id = p_dokter_id
    GROUP BY d.dokter_id;
END$$

-- Get Pawrent Profile
DROP PROCEDURE IF EXISTS GetPawrentProfile$$
CREATE PROCEDURE GetPawrentProfile (
    IN p_pawrent_id INT
)
BEGIN
    SELECT 
        p.*,
        d.nama_dokter,
        d.title_dokter,
        d.telepon_dokter,
        COUNT(DISTINCT h.hewan_id) as total_hewan,
        COUNT(DISTINCT k.kunjungan_id) as total_kunjungan
    FROM Pawrent p
    JOIN Dokter d ON p.dokter_id = d.dokter_id
    LEFT JOIN Hewan h ON p.pawrent_id = h.pawrent_id
    LEFT JOIN Kunjungan k ON h.hewan_id = k.hewan_id
    WHERE p.pawrent_id = p_pawrent_id
    GROUP BY p.pawrent_id;
END$$

-- Get Dashboard Statistics
DROP PROCEDURE IF EXISTS GetDashboardStats$$
CREATE PROCEDURE GetDashboardStats ()
BEGIN
    SELECT 
        (SELECT COUNT(*) FROM Hewan WHERE status_hidup = 'Hidup') as total_hewan_hidup,
        (SELECT COUNT(*) FROM Pawrent) as total_pawrent,
        (SELECT COUNT(*) FROM Dokter) as total_dokter,
        (SELECT COUNT(*) FROM Kunjungan WHERE tanggal_kunjungan = CURDATE()) as kunjungan_hari_ini,
        (SELECT COUNT(*) FROM Kunjungan WHERE MONTH(tanggal_kunjungan) = MONTH(CURDATE())) as kunjungan_bulan_ini,
        (SELECT SUM(total_biaya) FROM Kunjungan WHERE MONTH(tanggal_kunjungan) = MONTH(CURDATE())) as pendapatan_bulan_ini;
END$$

DELIMITER ;

-- ========================================================
-- Verification: Show all procedures
-- ========================================================
-- SHOW PROCEDURE STATUS WHERE Db = 'vet_buddy';