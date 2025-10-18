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

-- Klinik - Read Only
GRANT SELECT ON vet_buddy.Klinik TO 'vet_user'@'localhost';

-- Spesialisasi - Read Only
GRANT SELECT ON vet_buddy.Spesialisasi TO 'vet_user'@'localhost';

-- Jenis_Hewan - Read Only
GRANT SELECT ON vet_buddy.Jenis_Hewan TO 'vet_user'@'localhost';

-- Role - Read Only
GRANT SELECT ON vet_buddy.Role TO 'vet_user'@'localhost';

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