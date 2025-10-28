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
CREATE ROLE IF NOT EXISTS 'admin_klinik_role';  -- TAMBAHKAN: Role untuk Admin Klinik

-- ========================================================
-- 2. CREATE USERS
-- ========================================================
-- Gunakan password yang aman, ini hanya contoh
CREATE USER IF NOT EXISTS 'admin_user'@'localhost' IDENTIFIED BY 'admin_password';
CREATE USER IF NOT EXISTS 'vet_user'@'localhost' IDENTIFIED BY 'vet_password';
CREATE USER IF NOT EXISTS 'pawrent_user'@'localhost' IDENTIFIED BY 'pawrent_password';
CREATE USER IF NOT EXISTS 'admin_klinik_user'@'localhost' IDENTIFIED BY 'admin_klinik_password';  -- TAMBAHKAN: User untuk Admin Klinik

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

-- 3d. Role Admin Klinik (Akses Terbatas ke Klinik Tertentu) - TAMBAHKAN
-- Hak baca master data (global untuk read-only)
GRANT SELECT ON vet_buddy.Klinik TO 'admin_klinik_role';
GRANT SELECT ON vet_buddy.Spesialisasi TO 'admin_klinik_role';
GRANT SELECT ON vet_buddy.Dokter TO 'admin_klinik_role';
GRANT SELECT ON vet_buddy.Pawrent TO 'admin_klinik_role';
GRANT SELECT ON vet_buddy.Jenis_Hewan TO 'admin_klinik_role';
GRANT SELECT ON vet_buddy.Hewan TO 'admin_klinik_role';
GRANT SELECT ON vet_buddy.Detail_Layanan TO 'admin_klinik_role';
GRANT SELECT ON vet_buddy.Obat TO 'admin_klinik_role';
GRANT SELECT ON vet_buddy.Stok_Obat TO 'admin_klinik_role';
GRANT SELECT ON vet_buddy.Mutasi_Obat TO 'admin_klinik_role';
GRANT SELECT ON vet_buddy.Booking TO 'admin_klinik_role';
GRANT SELECT ON vet_buddy.Shift_Dokter TO 'admin_klinik_role';

-- Hak khusus untuk Kunjungan dan relasi (dengan filter klinik di aplikasi)
GRANT SELECT, INSERT, UPDATE ON vet_buddy.Kunjungan TO 'admin_klinik_role';
GRANT SELECT, INSERT, UPDATE ON vet_buddy.Layanan TO 'admin_klinik_role';
GRANT SELECT, INSERT, UPDATE ON vet_buddy.Kunjungan_Obat TO 'admin_klinik_role';
GRANT SELECT, INSERT, UPDATE ON vet_buddy.Booking TO 'admin_klinik_role';
GRANT SELECT, INSERT, UPDATE ON vet_buddy.Stok_Obat TO 'admin_klinik_role';
GRANT SELECT, INSERT, UPDATE ON vet_buddy.Mutasi_Obat TO 'admin_klinik_role';

-- Hak akses User_Login (read only untuk data sendiri)
GRANT SELECT ON vet_buddy.User_Login TO 'admin_klinik_role';
GRANT SELECT ON vet_buddy.Role TO 'admin_klinik_role';
GRANT SELECT ON vet_buddy.Admin_Klinik TO 'admin_klinik_role';  -- TAMBAHKAN: Akses ke tabel Admin_Klinik

-- Hak akses AuditLog (read only)
GRANT SELECT ON vet_buddy.AuditLog TO 'admin_klinik_role';

-- Hak execute stored procedures untuk admin klinik (sesuai Admin_GrantExecute.sql)
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllKunjungan TO 'admin_klinik_role';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetKunjunganById TO 'admin_klinik_role';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetHewanKunjunganHistory TO 'admin_klinik_role';
GRANT EXECUTE ON PROCEDURE vet_buddy.CreateKunjungan TO 'admin_klinik_role';
GRANT EXECUTE ON PROCEDURE vet_buddy.UpdateKunjungan TO 'admin_klinik_role';
GRANT EXECUTE ON PROCEDURE vet_buddy.DeleteKunjungan TO 'admin_klinik_role';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllHewans TO 'admin_klinik_role';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetHewanById TO 'admin_klinik_role';
GRANT EXECUTE ON PROCEDURE vet_buddy.CreateHewan TO 'admin_klinik_role';
GRANT EXECUTE ON PROCEDURE vet_buddy.UpdateHewan TO 'admin_klinik_role';
GRANT EXECUTE ON PROCEDURE vet_buddy.DeleteHewan TO 'admin_klinik_role';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllObat TO 'admin_klinik_role';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetObatById TO 'admin_klinik_role';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetObatByKunjungan TO 'admin_klinik_role';
GRANT EXECUTE ON PROCEDURE vet_buddy.CreateKunjunganObat TO 'admin_klinik_role';
GRANT EXECUTE ON PROCEDURE vet_buddy.UpdateKunjunganObat TO 'admin_klinik_role';
GRANT EXECUTE ON PROCEDURE vet_buddy.DeleteKunjunganObat TO 'admin_klinik_role';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllLayanan TO 'admin_klinik_role';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetLayananByKunjungan TO 'admin_klinik_role';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllStokObat TO 'admin_klinik_role';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetStokByObatId TO 'admin_klinik_role';
GRANT EXECUTE ON PROCEDURE vet_buddy.AddMutasiObat TO 'admin_klinik_role';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllMutasiObat TO 'admin_klinik_role';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllPawrents TO 'admin_klinik_role';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetPawrentById TO 'admin_klinik_role';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllDokters TO 'admin_klinik_role';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetDokterById TO 'admin_klinik_role';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllKlinik TO 'admin_klinik_role';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetKlinikById TO 'admin_klinik_role';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllJenisHewan TO 'admin_klinik_role';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllSpesialisasi TO 'admin_klinik_role';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllBookings TO 'admin_klinik_role';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetBookingById TO 'admin_klinik_role';
GRANT EXECUTE ON PROCEDURE vet_buddy.CreateBooking TO 'admin_klinik_role';
GRANT EXECUTE ON PROCEDURE vet_buddy.UpdateBooking TO 'admin_klinik_role';
GRANT EXECUTE ON PROCEDURE vet_buddy.DeleteBooking TO 'admin_klinik_role';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAvailableBookingsForKunjungan TO 'admin_klinik_role';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllShiftDokter TO 'admin_klinik_role';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetShiftDokterById TO 'admin_klinik_role';

-- ========================================================
-- 4. ASSIGN ROLES TO USERS
-- ========================================================
GRANT 'admin_role' TO 'admin_user'@'localhost';
GRANT 'vet_role' TO 'vet_user'@'localhost';
GRANT 'pawrent_role' TO 'pawrent_user'@'localhost';
GRANT 'admin_klinik_role' TO 'admin_klinik_user'@'localhost';  -- TAMBAHKAN: Assign role ke user

-- Set default role untuk auto-activate saat login
SET DEFAULT ROLE 'admin_role' FOR 'admin_user'@'localhost';
SET DEFAULT ROLE 'vet_role' FOR 'vet_user'@'localhost';
SET DEFAULT ROLE 'pawrent_role' FOR 'pawrent_user'@'localhost';
SET DEFAULT ROLE 'admin_klinik_role' FOR 'admin_klinik_user'@'localhost';  -- TAMBAHKAN: Set default role

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
-- SHOW GRANTS FOR 'admin_klinik_role';  -- TAMBAHKAN: Verifikasi role baru
-- SHOW GRANTS FOR 'admin_user'@'localhost';
-- SHOW GRANTS FOR 'vet_user'@'localhost';
-- SHOW GRANTS FOR 'pawrent_user'@'localhost';
-- SHOW GRANTS FOR 'admin_klinik_user'@'localhost';  -- TAMBAHKAN: Verifikasi user baru

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
REVOKE 'admin_klinik_role' FROM 'admin_klinik_user'@'localhost';  -- TAMBAHKAN: Revoke role baru

-- Contoh menghapus role
DROP ROLE IF EXISTS 'admin_role';
DROP ROLE IF EXISTS 'vet_role';
DROP ROLE IF EXISTS 'pawrent_role';
DROP ROLE IF EXISTS 'admin_klinik_role';  -- TAMBAHKAN: Drop role baru

-- Contoh menghapus user
DROP USER IF EXISTS 'admin_user'@'localhost';
DROP USER IF EXISTS 'vet_user'@'localhost';
DROP USER IF EXISTS 'pawrent_user'@'localhost';
DROP USER IF EXISTS 'admin_klinik_user'@'localhost';  -- TAMBAHKAN: Drop user baru
*/