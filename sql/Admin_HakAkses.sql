-- ========================================================
-- HAK AKSES DAN USER MANAGEMENT
-- Untuk Database: vet_buddy (atau db_sahabat_satwa)
-- ========================================================

-- ========================================================
-- 1. CREATE ROLES
-- ========================================================
CREATE ROLE IF NOT EXISTS 'admin_role';
CREATE ROLE IF NOT EXISTS 'vet_role';
CREATE ROLE IF NOT EXISTS 'pawrent_role';

-- ========================================================
-- 2. CREATE USERS
-- ========================================================
-- Gunakan password yang aman, ini hanya contoh
CREATE USER IF NOT EXISTS 'admin_user'@'localhost' ;
CREATE USER IF NOT EXISTS 'vet_user'@'localhost' ;
CREATE USER IF NOT EXISTS 'pawrent_user'@'localhost';

-- ========================================================
-- 3. GRANT PERMISSIONS TO ROLES
-- ========================================================

-- 3a. Role Admin (Full Access)
GRANT ALL PRIVILEGES ON vet_buddy.* TO 'admin_role';
-- Admin juga bisa menjalankan stored procedures
GRANT EXECUTE ON vet_buddy.* TO 'admin_role';

-- 3b. Role Vet (Dokter Hewan)
-- Hak baca master data
GRANT SELECT ON vet_buddy.Klinik TO 'vet_role';
GRANT SELECT ON vet_buddy.Spesialisasi TO 'vet_role';
GRANT SELECT ON vet_buddy.Dokter TO 'vet_role';
GRANT SELECT ON vet_buddy.Pawrent TO 'vet_role';
GRANT SELECT ON vet_buddy.Jenis_Hewan TO 'vet_role';
GRANT SELECT ON vet_buddy.Hewan TO 'vet_role';
GRANT SELECT ON vet_buddy.Detail_Layanan TO 'vet_role';
GRANT SELECT ON vet_buddy.Obat TO 'vet_role';

-- Hak khusus untuk Kunjungan dan relasi
GRANT SELECT, INSERT, UPDATE ON vet_buddy.Kunjungan TO 'vet_role';
GRANT SELECT, INSERT, UPDATE ON vet_buddy.Layanan TO 'vet_role';
GRANT SELECT, INSERT, UPDATE ON vet_buddy.Kunjungan_Obat TO 'vet_role';

-- Hak akses User_Login (read only untuk data sendiri)
GRANT SELECT ON vet_buddy.User_Login TO 'vet_role';
GRANT SELECT ON vet_buddy.Role TO 'vet_role';

-- Hak akses AuditLog (read only)
GRANT SELECT ON vet_buddy.AuditLog TO 'vet_role';

-- Hak execute stored procedures untuk vet
GRANT EXECUTE ON PROCEDURE vet_buddy.GetRiwayatKunjunganByHewan TO 'vet_role';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetHewanByJenis TO 'vet_role';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetKunjunganByDateRange TO 'vet_role';
GRANT EXECUTE ON PROCEDURE vet_buddy.CreateKunjungan TO 'vet_role';
GRANT EXECUTE ON PROCEDURE vet_buddy.UpdateKunjungan TO 'vet_role';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetDokterProfile TO 'vet_role';

-- 3c. Role Pawrent (Pemilik Hewan)
-- Hak baca master data (terbatas)
GRANT SELECT ON vet_buddy.Klinik TO 'pawrent_role';
GRANT SELECT ON vet_buddy.Spesialisasi TO 'pawrent_role';
GRANT SELECT ON vet_buddy.Dokter TO 'pawrent_role';
GRANT SELECT ON vet_buddy.Jenis_Hewan TO 'pawrent_role';
GRANT SELECT ON vet_buddy.Detail_Layanan TO 'pawrent_role';

-- Hak akses data sendiri
GRANT SELECT, UPDATE ON vet_buddy.Pawrent TO 'pawrent_role';
GRANT SELECT, INSERT, UPDATE ON vet_buddy.Hewan TO 'pawrent_role';

-- Hak baca kunjungan (read only)
GRANT SELECT ON vet_buddy.Kunjungan TO 'pawrent_role';
GRANT SELECT ON vet_buddy.Layanan TO 'pawrent_role';
GRANT SELECT ON vet_buddy.Obat TO 'pawrent_role';
GRANT SELECT ON vet_buddy.Kunjungan_Obat TO 'pawrent_role';

-- Hak akses User_Login (untuk update profile sendiri)
GRANT SELECT, UPDATE ON vet_buddy.User_Login TO 'pawrent_role';
GRANT SELECT ON vet_buddy.Role TO 'pawrent_role';

-- Hak execute stored procedures untuk pawrent
GRANT EXECUTE ON PROCEDURE vet_buddy.GetRiwayatKunjunganByHewan TO 'pawrent_role';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetHewanByJenis TO 'pawrent_role';
GRANT EXECUTE ON PROCEDURE vet_buddy.CreateHewan TO 'pawrent_role';
GRANT EXECUTE ON PROCEDURE vet_buddy.UpdateHewan TO 'pawrent_role';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetPawrentProfile TO 'pawrent_role';

-- ========================================================
-- 4. ASSIGN ROLES TO USERS
-- ========================================================
GRANT 'admin_role' TO 'admin_user'@'localhost';
GRANT 'vet_role' TO 'vet_user'@'localhost';
GRANT 'pawrent_role' TO 'pawrent_user'@'localhost';

-- Set default role untuk auto-activate saat login
SET DEFAULT ROLE 'admin_role' FOR 'admin_user'@'localhost';
SET DEFAULT ROLE 'vet_role' FOR 'vet_user'@'localhost';
SET DEFAULT ROLE 'pawrent_role' FOR 'pawrent_user'@'localhost';

-- ========================================================
-- 5. APPLY CHANGES
-- ========================================================
FLUSH PRIVILEGES;

-- ========================================================
-- 6. VERIFICATION QUERIES (Uncomment untuk testing)
-- ========================================================
-- SHOW GRANTS FOR 'admin_role';
-- SHOW GRANTS FOR 'vet_role';
-- SHOW GRANTS FOR 'pawrent_role';
-- SHOW GRANTS FOR 'admin_user'@'localhost';
-- SHOW GRANTS FOR 'vet_user'@'localhost';
-- SHOW GRANTS FOR 'pawrent_user'@'localhost';

-- ========================================================
-- 7. REVOKE EXAMPLES (Jika perlu mencabut hak akses)
-- ========================================================
/*
-- Contoh mencabut hak akses tertentu
REVOKE SELECT ON vet_buddy.Obat FROM 'vet_role';
REVOKE INSERT ON vet_buddy.Hewan FROM 'pawrent_role';
REVOKE ALL PRIVILEGES ON vet_buddy.* FROM 'admin_role';

-- Contoh mencabut role dari user
REVOKE 'admin_role' FROM 'admin_user'@'localhost';
REVOKE 'vet_role' FROM 'vet_user'@'localhost';
REVOKE 'pawrent_role' FROM 'pawrent_user'@'localhost';

-- Contoh menghapus role
DROP ROLE IF EXISTS 'admin_role';
DROP ROLE IF EXISTS 'vet_role';
DROP ROLE IF EXISTS 'pawrent_role';

-- Contoh menghapus user
DROP USER IF EXISTS 'admin_user'@'localhost';
DROP USER IF EXISTS 'vet_user'@'localhost';
DROP USER IF EXISTS 'pawrent_user'@'localhost';
*/