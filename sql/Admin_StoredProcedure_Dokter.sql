DELIMITER $$

-- ========================================================
-- DOKTER MANAGEMENT STORED PROCEDURES (disesuaikan dengan soft-delete)
-- ========================================================

-- ========================================================
-- GET ALL DOKTERS (hanya yang aktif — hidden soft-deleted)
-- ========================================================
DROP PROCEDURE IF EXISTS GetAllDokters$$
CREATE PROCEDURE GetAllDokters()
BEGIN
    SELECT 
        d.dokter_id,
        d.title_dokter,
        d.nama_dokter,
        d.telepon_dokter,
        d.tanggal_mulai_kerja,
        d.spesialisasi_id,
        d.klinik_id,
        d.is_active,
        s.nama_spesialisasi,
        k.nama_klinik,
        TIMESTAMPDIFF(YEAR, d.tanggal_mulai_kerja, CURDATE()) as lama_bekerja_tahun,
        TIMESTAMPDIFF(MONTH, d.tanggal_mulai_kerja, CURDATE()) % 12 as lama_bekerja_bulan,
        COUNT(DISTINCT p.pawrent_id) as total_pawrent
    FROM Dokter d
    LEFT JOIN Spesialisasi s ON d.spesialisasi_id = s.spesialisasi_id
    LEFT JOIN Klinik k ON d.klinik_id = k.klinik_id
    LEFT JOIN Pawrent p ON d.dokter_id = p.dokter_id AND p.deleted_at IS NULL
    WHERE d.deleted_at IS NULL AND d.is_active = 1  -- Pastikan hanya ambil aktif
    GROUP BY d.dokter_id
    ORDER BY d.nama_dokter;
END$$

-- ========================================================
-- GET DOKTER BY ID (hanya yang aktif — hidden soft-deleted)
-- ========================================================
DROP PROCEDURE IF EXISTS GetDokterById$$
CREATE PROCEDURE GetDokterById(IN p_dokter_id INT)
BEGIN
    SELECT 
        d.dokter_id,
        d.title_dokter,
        d.nama_dokter,
        d.telepon_dokter,
        d.tanggal_mulai_kerja,
        d.spesialisasi_id,
        d.klinik_id,
        s.nama_spesialisasi,
        k.nama_klinik,
        TIMESTAMPDIFF(YEAR, d.tanggal_mulai_kerja, CURDATE()) as lama_bekerja_tahun,
        TIMESTAMPDIFF(MONTH, d.tanggal_mulai_kerja, CURDATE()) % 12 as lama_bekerja_bulan
    FROM Dokter d
    LEFT JOIN Spesialisasi s ON d.spesialisasi_id = s.spesialisasi_id
    LEFT JOIN Klinik k ON d.klinik_id = k.klinik_id
    WHERE d.dokter_id = p_dokter_id
      AND d.deleted_at IS NULL
    GROUP BY d.dokter_id;
END$$

-- ========================================================
-- GET ALL SPESIALISASI (hanya menghitung dokter aktif)
-- ========================================================
DROP PROCEDURE IF EXISTS GetAllSpesialisasi$$
CREATE PROCEDURE GetAllSpesialisasi()
BEGIN
    SELECT 
        s.spesialisasi_id,
        s.nama_spesialisasi,
        s.deskripsi_spesialisasi,
        COUNT(d.dokter_id) as jumlah_dokter
    FROM Spesialisasi s
    LEFT JOIN Dokter d ON s.spesialisasi_id = d.spesialisasi_id AND d.deleted_at IS NULL
    GROUP BY s.spesialisasi_id
    ORDER BY s.nama_spesialisasi;
END$$

-- ========================================================
-- GET AVAILABLE KLINIKS (for doctor assignment) — menghitung dokter aktif
-- ========================================================
DROP PROCEDURE IF EXISTS GetAvailableKliniks$$
CREATE PROCEDURE GetAvailableKliniks()
BEGIN
    SELECT 
        k.klinik_id,
        k.nama_klinik,
        k.alamat_klinik,
        k.telepon_klinik,
        COUNT(d.dokter_id) as jumlah_dokter
    FROM Klinik k
    LEFT JOIN Dokter d ON k.klinik_id = d.klinik_id AND d.deleted_at IS NULL
    GROUP BY k.klinik_id
    ORDER BY k.nama_klinik;
END$$

-- ========================================================
-- CREATE DOKTER
-- ✅ FIXED: pastikan nomor telepon unik HANYA di antara dokter aktif
-- ✅ FIXED: mengabaikan dokter yang sudah di-delete
-- ========================================================
DROP PROCEDURE IF EXISTS CreateDokter$$
CREATE PROCEDURE CreateDokter(
    IN p_title_dokter VARCHAR(20),
    IN p_nama_dokter VARCHAR(100),
    IN p_telepon_dokter VARCHAR(15),
    IN p_tanggal_mulai_kerja DATE,
    IN p_spesialisasi_id INT,
    IN p_klinik_id INT
)
BEGIN
    DECLARE new_dokter_id INT;
    DECLARE duplicate_check INT;

    -- ✅ Check for duplicate telepon_dokter HANYA among dokter aktif (deleted_at IS NULL)
    IF p_telepon_dokter IS NOT NULL THEN
        SELECT COUNT(*) INTO duplicate_check
        FROM Dokter
        WHERE telepon_dokter = p_telepon_dokter
          AND deleted_at IS NULL;  -- ✅ Mengabaikan yang sudah di-delete
        
        IF duplicate_check > 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Nomor telepon dokter sudah terdaftar';
        END IF;
    END IF;
    
    -- Validate tanggal_mulai_kerja tidak di masa depan (jika tidak null)
    IF p_tanggal_mulai_kerja IS NOT NULL AND p_tanggal_mulai_kerja > CURDATE() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Tanggal mulai kerja tidak boleh di masa depan';
    END IF;
    
    -- ✅ Insert new dokter (explicit soft-delete NULL)
    INSERT INTO Dokter (
        title_dokter,
        nama_dokter,
        telepon_dokter,
        tanggal_mulai_kerja,
        spesialisasi_id,
        klinik_id,
        deleted_at
    )
    VALUES (
        p_title_dokter,
        p_nama_dokter,
        p_telepon_dokter,
        p_tanggal_mulai_kerja,
        p_spesialisasi_id,
        p_klinik_id,
        NULL  -- ✅ Explicit NULL untuk soft-delete
    );
    
    SET new_dokter_id = LAST_INSERT_ID();
    
    -- Return the new dokter with joined data
    SELECT 
        d.dokter_id,
        d.title_dokter,
        d.nama_dokter,
        d.telepon_dokter,
        d.tanggal_mulai_kerja,
        d.spesialisasi_id,
        d.klinik_id,
        s.nama_spesialisasi,
        k.nama_klinik
    FROM Dokter d
    LEFT JOIN Spesialisasi s ON d.spesialisasi_id = s.spesialisasi_id
    LEFT JOIN Klinik k ON d.klinik_id = k.klinik_id
    WHERE d.dokter_id = new_dokter_id
      AND d.deleted_at IS NULL;
END$$

-- ========================================================
-- UPDATE DOKTER
-- ========================================================
DROP PROCEDURE IF EXISTS UpdateDokter$$
CREATE PROCEDURE UpdateDokter (
    IN p_kode_dokter INT,
    IN p_title_dokter VARCHAR(10),
    IN p_nama_dokter VARCHAR(100),
    IN p_telepon_dokter VARCHAR(20),
    IN p_tanggal_mulai_kerja DATE,
    IN p_spesialisasi_id INT,
    IN p_klinik_id INT,
    IN p_is_active BOOLEAN
)
BEGIN
    -- Validate nama_dokter tidak kosong
    IF p_nama_dokter IS NULL OR TRIM(p_nama_dokter) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Nama dokter wajib diisi';
    END IF;
    
    -- Validate spesialisasi_id jika provided
    IF p_spesialisasi_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM Spesialisasi WHERE spesialisasi_id = p_spesialisasi_id) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Spesialisasi tidak valid';
    END IF;
    
    -- Validate klinik_id jika provided
    IF p_klinik_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM Klinik WHERE klinik_id = p_klinik_id) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Klinik tidak valid';
    END IF;
    
    -- Update dokter
    UPDATE Dokter
    SET 
        title_dokter = p_title_dokter,
        nama_dokter = p_nama_dokter,
        telepon_dokter = p_telepon_dokter,
        tanggal_mulai_kerja = p_tanggal_mulai_kerja,
        spesialisasi_id = p_spesialisasi_id,
        klinik_id = p_klinik_id,
        is_active = p_is_active
    WHERE kode_dokter = p_kode_dokter;
    
    -- Return updated dokter
    SELECT * FROM Dokter WHERE kode_dokter = p_kode_dokter;
END$$

-- ========================================================
-- DELETE DOKTER (soft delete)
-- ✅ FIXED: TIDAK MEMBLOKIR delete jika ada relasi
-- ✅ FIXED: Tetap lakukan soft delete, hanya beri pesan informatif
-- ========================================================
DROP PROCEDURE IF EXISTS DeleteDokter$$
CREATE PROCEDURE DeleteDokter(IN p_dokter_id INT)
BEGIN
    DECLARE rows_affected INT;
    DECLARE pawrent_count INT;
    DECLARE kunjungan_count INT;
    DECLARE user_count INT;
    DECLARE dokter_exists INT DEFAULT 0;
    DECLARE v_message VARCHAR(500);
    DECLARE has_relations BOOLEAN DEFAULT FALSE;
    
    -- Check dokter exists and not already deleted
    SELECT COUNT(*) INTO dokter_exists
    FROM Dokter
    WHERE dokter_id = p_dokter_id
      AND deleted_at IS NULL;
      
    IF dokter_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Dokter tidak ditemukan atau sudah dihapus';
    END IF;
    
    -- ✅ Check relasi (tapi TIDAK memblokir)
    SELECT COUNT(*) INTO pawrent_count
    FROM Pawrent
    WHERE dokter_id = p_dokter_id
      AND deleted_at IS NULL;
    
    SELECT COUNT(*) INTO kunjungan_count
    FROM Kunjungan
    WHERE dokter_id = p_dokter_id
      AND deleted_at IS NULL;
    
    SELECT COUNT(*) INTO user_count
    FROM User_Login
    WHERE dokter_id = p_dokter_id
      AND deleted_at IS NULL;
    
    -- ✅ Build informative message based on relations
    IF pawrent_count > 0 OR kunjungan_count > 0 OR user_count > 0 THEN
        SET has_relations = TRUE;
        SET v_message = 'Dokter memiliki data terkait: ';
        
        IF pawrent_count > 0 THEN
            SET v_message = CONCAT(v_message, pawrent_count, ' pawrent');
        END IF;
        
        IF kunjungan_count > 0 THEN
            IF pawrent_count > 0 THEN
                SET v_message = CONCAT(v_message, ', ');
            END IF;
            SET v_message = CONCAT(v_message, kunjungan_count, ' riwayat kunjungan');
        END IF;
        
        IF user_count > 0 THEN
            IF pawrent_count > 0 OR kunjungan_count > 0 THEN
                SET v_message = CONCAT(v_message, ', ');
            END IF;
            SET v_message = CONCAT(v_message, user_count, ' akun login');
        END IF;
        
        SET v_message = CONCAT(v_message, '. Melakukan soft delete. Hubungi admin untuk penghapusan permanen.');
    ELSE
        SET v_message = 'Dokter berhasil dihapus';
    END IF;
    
    -- ✅ TETAP LAKUKAN SOFT DELETE (tidak peduli ada relasi atau tidak)
    UPDATE Dokter
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE dokter_id = p_dokter_id
      AND deleted_at IS NULL;
    
    SET rows_affected = ROW_COUNT();
    
    -- Return informative result
    SELECT 
        rows_affected as affected_rows,
        pawrent_count,
        kunjungan_count,
        user_count,
        has_relations,
        v_message as message;
END$$

-- ========================================================
-- GET ALL DOKTERS FOR PAWRENT (hanya dokter aktif)
-- ========================================================
DROP PROCEDURE IF EXISTS GetAllDoktersForPawrent$$
CREATE PROCEDURE GetAllDoktersForPawrent()
BEGIN
    SELECT 
        d.dokter_id,
        d.title_dokter,
        d.nama_dokter,
        d.telepon_dokter,
        s.nama_spesialisasi,
        s.deskripsi_spesialisasi,
        k.nama_klinik
    FROM Dokter d
    LEFT JOIN Spesialisasi s ON d.spesialisasi_id = s.spesialisasi_id
    LEFT JOIN Klinik k ON d.klinik_id = k.klinik_id
    WHERE d.deleted_at IS NULL
    ORDER BY d.nama_dokter;
END$$

DELIMITER ;