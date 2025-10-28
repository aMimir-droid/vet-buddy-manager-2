-- ========================================================
-- GRANT TABLE PERMISSIONS untuk setiap ROLE
-- Database: vet_buddy
-- ========================================================

USE vet_buddy;

-- ========================================================
-- GRANT untuk ADMIN_USER (Full Access)
-- ========================================================

-- Full access on all tables
GRANT ALL PRIVILEGES ON vet_buddy.* TO 'admin_user'@'localhost';

-- ========================================================
-- GRANT untuk VET_USER
-- ========================================================

-- Kunjungan - Full CRUD
GRANT SELECT, INSERT, UPDATE, DELETE ON vet_buddy.Kunjungan TO 'vet_user'@'localhost';

-- Hewan - Full CRUD
GRANT SELECT, INSERT, UPDATE, DELETE ON vet_buddy.Hewan TO 'vet_user'@'localhost';

-- Obat - Full CRUD
GRANT SELECT, INSERT, UPDATE, DELETE ON vet_buddy.Obat TO 'vet_user'@'localhost';

-- Kunjungan_Obat - Full CRUD
GRANT SELECT, INSERT, UPDATE, DELETE ON vet_buddy.Kunjungan_Obat TO 'vet_user'@'localhost';

-- Layanan - Read Only
GRANT SELECT ON vet_buddy.Layanan TO 'vet_user'@'localhost';

-- Pawrent - Read Only
GRANT SELECT ON vet_buddy.Pawrent TO 'vet_user'@'localhost';

-- Dokter - Read Only
GRANT SELECT ON vet_buddy.Dokter TO 'vet_user'@'localhost';



-- Dokter - Read Only, tapi tambahkan UPDATE untuk toggle is_active

GRANT SELECT, UPDATE ON vet_buddy.Dokter TO 'vet_user'@'localhost';


-- Klinik - Read Only
GRANT SELECT ON vet_buddy.Klinik TO 'vet_user'@'localhost';

-- Spesialisasi - Read Only
GRANT SELECT ON vet_buddy.Spesialisasi TO 'vet_user'@'localhost';

-- Jenis_Hewan - Read Only
GRANT SELECT ON vet_buddy.Jenis_Hewan TO 'vet_user'@'localhost';

-- Role - Read Only
GRANT SELECT ON vet_buddy.Role TO 'vet_user'@'localhost';

-- Mutasi_Obat: INSERT, SELECT (stok in/out & log)
GRANT SELECT, INSERT ON vet_buddy.Mutasi_Obat TO 'vet_user'@'localhost';

-- Stok_Obat: SELECT, UPDATE (lihat & update stok saat kunjungan)
GRANT SELECT, UPDATE ON vet_buddy.Stok_Obat TO 'vet_user'@'localhost';

-- Dokter_Review & Klinik_Review: SELECT (lihat review)
GRANT SELECT ON vet_buddy.Dokter_Review TO 'vet_user'@'localhost';
GRANT SELECT ON vet_buddy.Klinik_Review TO 'vet_user'@'localhost';

-- Shift_Dokter: SELECT, INSERT, UPDATE (lihat, buat, ubah shift sendiri)
GRANT SELECT, INSERT, UPDATE ON vet_buddy.Shift_Dokter TO 'vet_user'@'localhost';

-- Booking: SELECT, UPDATE (lihat, approve/edit status booking)
GRANT SELECT, UPDATE ON vet_buddy.Booking TO 'vet_user'@'localhost';

-- ========================================================
-- GRANT untuk PAWRENT_USER
-- ========================================================

-- Kunjungan - Read Only (akan di-filter by pawrent_id di application layer)
GRANT SELECT ON vet_buddy.Kunjungan TO 'pawrent_user'@'localhost';

-- Hewan - Read Only (akan di-filter by pawrent_id)
GRANT SELECT ON vet_buddy.Hewan TO 'pawrent_user'@'localhost';

-- Kunjungan_Obat - Read Only
GRANT SELECT ON vet_buddy.Kunjungan_Obat TO 'pawrent_user'@'localhost';

-- Obat - Read Only (untuk melihat detail obat)
GRANT SELECT ON vet_buddy.Obat TO 'pawrent_user'@'localhost';

-- Layanan - Read Only
GRANT SELECT ON vet_buddy.Layanan TO 'pawrent_user'@'localhost';

-- Pawrent - Select and Update (untuk update profil sendiri)
GRANT SELECT, UPDATE ON vet_buddy.Pawrent TO 'pawrent_user'@'localhost';

-- Dokter - Read Only
GRANT SELECT ON vet_buddy.Dokter TO 'pawrent_user'@'localhost';

-- Klinik - Read Only
GRANT SELECT ON vet_buddy.Klinik TO 'pawrent_user'@'localhost';

-- Spesialisasi - Read Only
GRANT SELECT ON vet_buddy.Spesialisasi TO 'pawrent_user'@'localhost';

-- Jenis_Hewan - Read Only
GRANT SELECT ON vet_buddy.Jenis_Hewan TO 'pawrent_user'@'localhost';

-- Role - Read Only
GRANT SELECT ON vet_buddy.Role TO 'pawrent_user'@'localhost';

-- Mutasi_Obat & Stok_Obat: tidak diberi akses

-- Dokter_Review & Klinik_Review: SELECT, INSERT (lihat & buat review)
GRANT SELECT, INSERT ON vet_buddy.Dokter_Review TO 'pawrent_user'@'localhost';
GRANT SELECT, INSERT ON vet_buddy.Klinik_Review TO 'pawrent_user'@'localhost';

-- Shift_Dokter: SELECT (lihat shift dokter untuk booking)
GRANT SELECT ON vet_buddy.Shift_Dokter TO 'pawrent_user'@'localhost';

-- Booking: SELECT, INSERT, UPDATE (lihat, buat, edit/cancel/reschedule booking sendiri)
GRANT SELECT, INSERT, UPDATE ON vet_buddy.Booking TO 'pawrent_user'@'localhost';

-- ========================================================
-- GRANT TABLE PERMISSIONS untuk STOK OBAT dan MUTASI OBAT
-- ========================================================

-- ========================================================
-- GRANT untuk ADMIN_USER (Full Access)
-- ========================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON vet_buddy.Stok_Obat TO 'admin_user'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON vet_buddy.Mutasi_Obat TO 'admin_user'@'localhost';

-- ========================================================
-- GRANT untuk VET_USER (Read/Write untuk Stok dan Mutasi)
-- ========================================================
GRANT SELECT, INSERT, UPDATE ON vet_buddy.Stok_Obat TO 'vet_user'@'localhost';  -- Vet bisa update stok dan lihat mutasi
GRANT SELECT, INSERT ON vet_buddy.Mutasi_Obat TO 'vet_user'@'localhost';  -- Vet bisa tambah mutasi (IN/OUT), tapi tidak delete

-- ========================================================
-- GRANT untuk PAWRENT_USER (Read-Only untuk Stok)
-- ========================================================

-- Grant EXECUTE untuk procedures yang digunakan oleh pawrent (read-only untuk obat, stok, klinik)
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllObat TO 'pawrent_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllStokObat TO 'pawrent_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllKlinik TO 'pawrent_user'@'localhost';


GRANT SELECT ON vet_buddy.Stok_Obat TO 'pawrent_user'@'localhost';  -- Pawrent hanya bisa lihat stok (public view)
-- Tidak ada grant untuk Mutasi_Obat agar pawrent tidak bisa melihat riwayat mutasi internal
-- Grant EXECUTE untuk procedures yang digunakan oleh vet (read-only untuk obat, stok, klinik)
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllObat TO 'vet_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllStokObat TO 'vet_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllKlinik TO 'vet_user'@'localhost';

-- Jika ada procedure lain yang digunakan oleh vet, tambahkan di sini
-- GRANT EXECUTE ON PROCEDURE vet_buddy.GetStokByObatId TO 'vet_user'@'localhost'; -- Jika diperlukan

-- ========================================================
-- FLUSH PRIVILEGES
-- ========================================================
FLUSH PRIVILEGES;

-- ========================================================
-- VERIFY GRANTS - Show table privileges
-- ========================================================
SHOW GRANTS FOR 'admin_user'@'localhost';
SHOW GRANTS FOR 'vet_user'@'localhost';
SHOW GRANTS FOR 'pawrent_user'@'localhost';

-- Check specific table privileges
SELECT 
    GRANTEE,
    TABLE_SCHEMA,
    TABLE_NAME,
    PRIVILEGE_TYPE
FROM 
    information_schema.TABLE_PRIVILEGES
WHERE 
    TABLE_SCHEMA = 'vet_buddy'
    AND GRANTEE IN (
        "'admin_user'@'localhost'",
        "'vet_user'@'localhost'",
        "'pawrent_user'@'localhost'"
    )
ORDER BY 
    GRANTEE, TABLE_NAME, PRIVILEGE_TYPE;

-- Tambahkan grant EXECUTE untuk stored procedures yang digunakan oleh VET_USER

-- ========================================================
-- GRANT EXECUTE untuk STORED PROCEDURES - VET_USER
-- ========================================================


-- ========================================================
-- FLUSH PRIVILEGES
-- ========================================================
FLUSH PRIVILEGES;