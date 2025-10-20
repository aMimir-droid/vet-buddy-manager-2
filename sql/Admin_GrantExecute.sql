-- ========================================================
-- GRANT EXECUTE PERMISSIONS untuk STORED PROCEDURES
-- Database: vet_buddy
-- ========================================================

USE vet_buddy;

-- ========================================================
-- GRANT EXECUTE untuk VET_USER
-- ========================================================

-- Kunjungan Procedures
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllKunjungan TO 'vet_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetKunjunganById TO 'vet_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetHewanKunjunganHistory TO 'vet_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetKunjunganByDateRange TO 'vet_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.CreateKunjungan TO 'vet_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.UpdateKunjungan TO 'vet_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.DeleteKunjungan TO 'vet_user'@'localhost';

-- Hewan Procedures
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllHewans TO 'vet_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetHewanById TO 'vet_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.CreateHewan TO 'vet_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.UpdateHewan TO 'vet_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.DeleteHewan TO 'vet_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.UpdateHewanByPawrent TO 'vet_user'@'localhost';


-- Obat Procedures
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllObat TO 'vet_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetObatById TO 'vet_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.CreateObat TO 'vet_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.UpdateObat TO 'vet_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.DeleteObat TO 'vet_user'@'localhost';

-- Kunjungan Obat Procedures
GRANT EXECUTE ON PROCEDURE vet_buddy.GetObatByKunjungan TO 'vet_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.CreateKunjunganObat TO 'vet_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.UpdateKunjunganObat TO 'vet_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.DeleteKunjunganObat TO 'vet_user'@'localhost';

-- Layanan Procedures
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllLayanan TO 'vet_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetLayananById TO 'vet_user'@'localhost';

-- Pawrent Procedures (Read Only)
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllPawrents TO 'vet_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetPawrentById TO 'vet_user'@'localhost';

-- Dokter Procedures (Read Only)
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllDokters TO 'vet_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetDokterById TO 'vet_user'@'localhost';

-- Klinik Procedures (Read Only)
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllKlinik TO 'vet_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetKlinikById TO 'vet_user'@'localhost';

-- spesialisai

GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllSpesialisasi TO 'vet_user'@'localhost';
-- profile dokter
GRANT EXECUTE ON PROCEDURE vet_buddy.UpdateDokter TO 'vet_user'@'localhost';



-- jenis hewan (read only)

GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllJenisHewan TO 'vet_user'@'localhost';

-- Dashboard
GRANT EXECUTE ON PROCEDURE vet_buddy.GetDashboardStats TO 'vet_user'@'localhost';

-- ========================================================
-- GRANT EXECUTE untuk PAWRENT_USER
-- ========================================================

-- Hewan Procedures (Read Only untuk pawrent sendiri)
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllHewans TO 'pawrent_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetHewanById TO 'pawrent_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.UpdateHewanByPawrent TO 'pawrent_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllJenisHewan TO 'pawrent_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.CreateHewanByPawrent TO 'pawrent_user'@'localhost'; -- NEW
GRANT EXECUTE ON PROCEDURE vet_buddy.DeleteHewanByPawrent TO 'pawrent_user'@'localhost'; -- NEW

-- Kunjungan Procedures (Read Only)
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllKunjungan TO 'pawrent_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetKunjunganById TO 'pawrent_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetHewanKunjunganHistory TO 'pawrent_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetKunjunganByDateRange TO 'pawrent_user'@'localhost';

-- Kunjungan Obat Procedures (Read Only)
GRANT EXECUTE ON PROCEDURE vet_buddy.GetObatByKunjungan TO 'pawrent_user'@'localhost';

-- Pawrent Procedures
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllPawrents TO 'pawrent_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetPawrentById TO 'pawrent_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.UpdatePawrent TO 'pawrent_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.UpdatePawrentSelf TO 'pawrent_user'@'localhost'; -- NEW

-- Dokter Procedures (Read Only)
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllDokters TO 'pawrent_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetDokterById TO 'pawrent_user'@'localhost';

-- Klinik Procedures (Read Only)
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllKlinik TO 'pawrent_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetKlinikById TO 'pawrent_user'@'localhost';

-- Layanan Procedures (Read Only)
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllLayanan TO 'pawrent_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetLayananById TO 'pawrent_user'@'localhost';

-- Obat Procedures (Read Only untuk melihat detail)
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllObat TO 'pawrent_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetObatById TO 'pawrent_user'@'localhost';

-- Dokter Procedures (Read Only untuk melihat detail)
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllDoktersForPawrent TO 'pawrent_user'@'localhost';


-- ========================================================
-- GRANT EXECUTE untuk ADMIN_USER (Full Access)
-- ========================================================

-- Admin sudah punya akses penuh melalui grant all privileges
-- Tapi kita tetap grant explicit untuk clarity

-- All Kunjungan
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllKunjungan TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetKunjunganById TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetHewanKunjunganHistory TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetKunjunganByDateRange TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.CreateKunjungan TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.UpdateKunjungan TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.DeleteKunjungan TO 'admin_user'@'localhost';

-- All Hewan
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllHewans TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetHewanById TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.CreateHewan TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.UpdateHewan TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.DeleteHewan TO 'admin_user'@'localhost';

-- All Obat
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllObat TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetObatById TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.CreateObat TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.UpdateObat TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.DeleteObat TO 'admin_user'@'localhost';

-- All Kunjungan Obat
GRANT EXECUTE ON PROCEDURE vet_buddy.GetObatByKunjungan TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.CreateKunjunganObat TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.UpdateKunjunganObat TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.DeleteKunjunganObat TO 'admin_user'@'localhost';

-- All Layanan
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllLayanan TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetLayananById TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.CreateLayanan TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.UpdateLayanan TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.DeleteLayanan TO 'admin_user'@'localhost';

-- All Pawrent
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllPawrents TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetPawrentById TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.CreatePawrent TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.UpdatePawrent TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.DeletePawrent TO 'admin_user'@'localhost';

-- All Dokter
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllDokters TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetDokterById TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.CreateDokter TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.UpdateDokter TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.DeleteDokter TO 'admin_user'@'localhost';

-- All Klinik
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllKlinik TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetKlinikById TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.CreateKlinik TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.UpdateKlinik TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.DeleteKlinik TO 'admin_user'@'localhost';

-- All Users
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllUsers TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetUserById TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.CreateUser TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.UpdateUser TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.DeleteUser TO 'admin_user'@'localhost';

-- All Jenis Hewan
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllJenisHewan TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.CreateJenisHewan TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.UpdateJenisHewan TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.DeleteJenisHewan TO 'admin_user'@'localhost';

-- ========================================================
-- FLUSH PRIVILEGES
-- ========================================================
FLUSH PRIVILEGES;

-- ========================================================
-- VERIFY GRANTS
-- ========================================================
SHOW GRANTS FOR 'admin_user'@'localhost';
SHOW GRANTS FOR 'vet_user'@'localhost';
SHOW GRANTS FOR 'pawrent_user'@'localhost';

-- Check Stored Procedure privileges
SELECT 
    GRANTEE,
    ROUTINE_SCHEMA,
    ROUTINE_NAME,
    PRIVILEGE_TYPE
FROM 
    information_schema.ROUTINE_PRIVILEGES
WHERE 
    GRANTEE IN (
        "'admin_user'@'localhost'",
        "'vet_user'@'localhost'",
        "'pawrent_user'@'localhost'"
    )
ORDER BY 
    GRANTEE, ROUTINE_NAME;

-- Check Table privileges
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

-- Check Column privileges (if any)
SELECT 
    GRANTEE,
    TABLE_SCHEMA,
    TABLE_NAME,
    COLUMN_NAME,
    PRIVILEGE_TYPE
FROM 
    information_schema.COLUMN_PRIVILEGES
WHERE 
    TABLE_SCHEMA = 'vet_buddy'
    AND GRANTEE IN (
        "'admin_user'@'localhost'",
        "'vet_user'@'localhost'",
        "'pawrent_user'@'localhost'"
    )
ORDER BY 
    GRANTEE, TABLE_NAME, COLUMN_NAME;