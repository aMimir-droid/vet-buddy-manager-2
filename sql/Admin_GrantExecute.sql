-- ========================================================
-- GRANT EXECUTE PERMISSIONS untuk STORED PROCEDURES
-- Database: vet_buddy
-- ========================================================

USE vet_buddy;

-- ========================================================
-- GRANT EXECUTE untuk VET_USER
-- ========================================================

-- Layanan Procedures
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllLayanan TO 'vet_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetLayananByKunjungan TO 'vet_user'@'localhost';  -- TAMBAHKAN: Grant untuk GetLayananByKunjungan

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
GRANT EXECUTE ON PROCEDURE vet_buddy.GetLayananByKunjungan TO 'vet_user'@'localhost';  -- TAMBAHKAN: Grant untuk GetLayananByKunjungan

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



-- ========================================================
-- GRANT EXECUTE untuk PAWRENT_USER
-- ========================================================

-- Layanan Procedures (Read Only)
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllLayanan TO 'pawrent_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetLayananByKunjungan TO 'pawrent_user'@'localhost';  -- TAMBAHKAN: Grant untuk GetLayananByKunjungan

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
GRANT EXECUTE ON PROCEDURE vet_buddy.GetLayananByKunjungan TO 'pawrent_user'@'localhost';  -- TAMBAHKAN: Grant untuk GetLayananByKunjungan

-- Obat Procedures (Read Only untuk melihat detail)
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllObat TO 'pawrent_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetObatById TO 'pawrent_user'@'localhost';

-- Dokter Procedures (Read Only untuk melihat detail)
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllDoktersForPawrent TO 'pawrent_user'@'localhost';

-- Shift_Dokter Procedures (Read Only untuk melihat jadwal)
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllShiftDokter TO 'pawrent_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetShiftDokterById TO 'pawrent_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetShiftDokterByDokter TO 'pawrent_user'@'localhost';  -- TAMBAHKAN: Grant untuk GetShiftDokterByDokter
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllShiftDokterAktif TO 'pawrent_user'@'localhost';

-- ========================================================
-- GRANT EXECUTE untuk ADMIN_KLINIK_USER (Akses Terbatas ke Klinik Tertentu)
-- ========================================================

-- Kunjungan Procedures (dengan filter klinik)
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllKunjungan TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetKunjunganById TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetHewanKunjunganHistory TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.CreateKunjungan TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.UpdateKunjungan TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.DeleteKunjungan TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetKunjunganByKlinik TO 'admin_klinik_user'@'localhost';  -- TAMBAHKAN: Grant untuk GetKunjunganByKlinik

-- Hewan Procedures (dengan filter klinik)
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllHewans TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetHewanById TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.CreateHewan TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.UpdateHewan TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.DeleteHewan TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetHewansByKlinik TO 'admin_klinik_user'@'localhost';  -- TAMBAHKAN: Grant untuk GetHewansByKlinik
GRANT EXECUTE ON PROCEDURE vet_buddy.UpdateHewanByAdminKlinik TO 'admin_klinik_user'@'localhost';
-- Obat Procedures (dengan filter klinik)
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllObat TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetObatById TO 'admin_klinik_user'@'localhost';

-- Stok Obat Procedures (dengan filter klinik)
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllStokObat TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetStokByObatId TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.UpdateStokObat TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.AddMutasiObat TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllMutasiObat TO 'admin_klinik_user'@'localhost';

-- Procedures Baru untuk Admin Klinik (khusus klinik mereka)
GRANT EXECUTE ON PROCEDURE vet_buddy.GetObatWithStokByKlinik TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetMutasiByKlinik TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllObatWithStokByKlinik TO 'admin_klinik_user'@'localhost';

-- Dokter Procedures (read-only, filter klinik)ap
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllDokters TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetDokterById TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetDoktersByKlinik TO 'admin_klinik_user'@'localhost';  -- TAMBAHKAN: Grant untuk GetDoktersByKlinik


-- Dokter Procedures (read-only, filter klinik)
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllDokters TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetDokterById TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetDoktersByKlinik TO 'admin_klinik_user'@'localhost';  -- TAMBAHKAN: Grant untuk GetDoktersByKlinik
GRANT EXECUTE ON PROCEDURE vet_buddy.UpdateDokter TO 'admin_klinik_user'@'localhost';  -- TAMBAHKAN: Grant untuk UpdateDokter


-- Kunjungan Obat Procedures (dengan filter klinik)
GRANT EXECUTE ON PROCEDURE vet_buddy.GetObatByKunjungan TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.CreateKunjunganObat TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.UpdateKunjunganObat TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.DeleteKunjunganObat TO 'admin_klinik_user'@'localhost';

-- Layanan Procedures (dengan filter klinik)
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllLayanan TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetLayananByKunjungan TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.DeleteLayananFromKunjungan TO 'admin_klinik_user'@'localhost';  -- TAMBAHKAN: Grant untuk DeleteLayananFromKunjungan

-- Stok Obat Procedures (dengan filter klinik)
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllStokObat TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetStokByObatId TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.AddMutasiObat TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllMutasiObat TO 'admin_klinik_user'@'localhost';


-- Shift_Dokter Procedures (dengan filter klinik)
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllShiftDokter TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetShiftDokterById TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetShiftDokterByDokter TO 'admin_klinik_user'@'localhost';  -- TAMBAHKAN: Grant untuk GetShiftDokterByDokter
GRANT EXECUTE ON PROCEDURE vet_buddy.GetShiftDokterByKlinik TO 'admin_klinik_user'@'localhost';  -- TAMBAHKAN: Grant untuk GetShiftDokterByKlinik (baru)
GRANT EXECUTE ON PROCEDURE vet_buddy.CreateShiftDokter TO 'admin_klinik_user'@'localhost';  -- TAMBAHKAN: Grant untuk CreateShiftDokter
GRANT EXECUTE ON PROCEDURE vet_buddy.UpdateShiftDokter TO 'admin_klinik_user'@'localhost';  -- TAMBAHKAN: Grant untuk UpdateShiftDokter
GRANT EXECUTE ON PROCEDURE vet_buddy.DeleteShiftDokter TO 'admin_klinik_user'@'localhost';  -- TAMBAHKAN: Grant untuk DeleteShiftDokter
GRANT EXECUTE ON PROCEDURE vet_buddy.GetBookingsByDokter TO 'admin_klinik_user'@'localhost';

GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllShiftDokterByKlinik TO 'admin_klinik_user'@'localhost';

-- Pawrent Procedures (read-only, global)
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllPawrents TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetPawrentById TO 'admin_klinik_user'@'localhost';

-- Dokter Procedures (read-only, filter klinik)
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllDokters TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetDokterById TO 'admin_klinik_user'@'localhost';

-- Klinik Procedures (read-only, filter klinik)
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllKlinik TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetKlinikById TO 'admin_klinik_user'@'localhost';

-- Jenis Hewan Procedures (read-only, global)
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllJenisHewan TO 'admin_klinik_user'@'localhost';

-- Spesialisasi Procedures (read-only, global)
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllSpesialisasi TO 'admin_klinik_user'@'localhost';

-- Booking Procedures (dengan filter klinik)
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllBookings TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetBookingById TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.CreateBooking TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.UpdateBooking TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.DeleteBooking TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAvailableBookingsForKunjungan TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetBookingsByKlinik TO 'admin_klinik_user'@'localhost';  -- TAMBAHKAN: Grant untuk GetBookingsByKlinik

-- Shift_Dokter Procedures (read-only, filter klinik)
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllShiftDokter TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetShiftDokterById TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetShiftDokterByDokter TO 'admin_klinik_user'@'localhost';  -- TAMBAHKAN: Grant untuk GetShiftDokterByDokter
GRANT EXECUTE ON PROCEDURE vet_buddy.GetBookingsByDokter TO 'admin_klinik_user'@'localhost';
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

-- Booking
GRANT EXECUTE ON PROCEDURE vet_buddy.GetBookingById TO 'vet_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetBookingsByDokter TO 'vet_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.CreateBooking TO 'vet_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.UpdateBooking TO 'vet_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.DeleteBooking TO 'vet_user'@'localhost';

-- PAWRENT_USER: baca dan buat booking (tidak diizinkan hapus/update global)
GRANT EXECUTE ON PROCEDURE vet_buddy.GetBookingById TO 'pawrent_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.CreateBooking TO 'pawrent_user'@'localhost';

-- ADMIN_USER: akses penuh untuk booking
GRANT EXECUTE ON PROCEDURE vet_buddy.GetBookingById TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetBookingsByDokter TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.CreateBooking TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.UpdateBooking TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.DeleteBooking TO 'admin_user'@'localhost';

-- TAMBAHKAN: Grant untuk GetAllBookings (admin only)
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllBookings TO 'admin_user'@'localhost';

-- TAMBAHKAN: Grant untuk GetAvailableBookingsForKunjungan (admin dan vet)
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAvailableBookingsForKunjungan TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAvailableBookingsForKunjungan TO 'vet_user'@'localhost';

-- Shift_Dokter Procedures

GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllShiftDokter TO 'vet_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetShiftDokterById TO 'vet_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.CreateShiftDokter TO 'vet_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.UpdateShiftDokter TO 'vet_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.DeleteShiftDokter TO 'vet_user'@'localhost';

-- Tambahkan grant untuk GetShiftDokterByDokter
GRANT EXECUTE ON PROCEDURE vet_buddy.GetShiftDokterByDokter TO 'vet_user'@'localhost';

-- Pawrent: hanya untuk melihat jadwal
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllShiftDokter TO 'pawrent_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetShiftDokterById TO 'pawrent_user'@'localhost';

-- Tambahkan grant untuk GetAllShiftDokterAktif
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllShiftDokterAktif TO 'pawrent_user'@'localhost';

-- Admin: akses penuh untuk shift
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllShiftDokter TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetShiftDokterById TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.CreateShiftDokter TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.UpdateShiftDokter TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.DeleteShiftDokter TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllShiftDokterAdmin TO 'admin_user'@'localhost';  -- TAMBAHKAN: Grant untuk GetAllShiftDokterAdmin

-- TAMBAHKAN: Grant untuk GetBookingsByPawrent
GRANT EXECUTE ON PROCEDURE vet_buddy.GetBookingsByPawrent TO 'pawrent_user'@'localhost';
-- Di Admin_GrantExecute.sql, tambahkan:
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllStokObat TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllStokObat TO 'vet_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllStokObat TO 'pawrent_user'@'localhost';
-- Dan seterusnya untuk semua procedures di atas.



-- ========================================================
-- GRANT EXECUTE untuk STOK OBAT STORED PROCEDURES
-- ========================================================

-- ========================================================
-- GRANT EXECUTE untuk ADMIN_USER (Full Access)
-- ========================================================
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllStokObat TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetStokByObatId TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.CreateStokObat TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.UpdateStokObat TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.AddMutasiObat TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetMutasiByObatId TO 'admin_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllMutasiObat TO 'admin_user'@'localhost';

-- ========================================================
-- GRANT EXECUTE untuk VET_USER (Akses untuk Stok dan Mutasi)
-- ========================================================
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllStokObat TO 'vet_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetStokByObatId TO 'vet_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.UpdateStokObat TO 'vet_user'@'localhost';  -- Vet bisa update stok manual
GRANT EXECUTE ON PROCEDURE vet_buddy.AddMutasiObat TO 'vet_user'@'localhost';  -- Vet bisa tambah mutasi
GRANT EXECUTE ON PROCEDURE vet_buddy.GetMutasiByObatId TO 'vet_user'@'localhost';  -- Vet bisa lihat riwayat mutasi per obat

-- ========================================================
-- GRANT EXECUTE untuk PAWRENT_USER (Read-Only untuk Stok)
-- ========================================================
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllStokObat TO 'pawrent_user'@'localhost';  -- Pawrent bisa lihat semua stok (public)
GRANT EXECUTE ON PROCEDURE vet_buddy.GetStokByObatId TO 'pawrent_user'@'localhost';  -- Pawrent bisa lihat stok per obat


-- Booking Procedures (dengan filter klinik)
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllBookings TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetBookingById TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.CreateBooking TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.UpdateBooking TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.DeleteBooking TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAvailableBookingsForKunjungan TO 'admin_klinik_user'@'localhost';
-- ========================================================
-- GRANT EXECUTE untuk ADMIN_KLINIK_USER (Akses untuk Stok dan Mutasi di Klinik Sendiri)
-- ========================================================
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllStokObat TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetStokByObatId TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.UpdateStokObat TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.AddMutasiObat TO 'admin_klinik_user'@'localhost';
GRANT EXECUTE ON PROCEDURE vet_buddy.GetAllMutasiObat TO 'admin_klinik_user'@'localhost';

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
SHOW GRANTS FOR 'admin_klinik_user'@'localhost';  -- Tambahkan verifikasi untuk admin_klinik

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
        "'pawrent_user'@'localhost'",
        "'admin_klinik_user'@'localhost'"  -- Tambahkan admin_klinik
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
        "'pawrent_user'@'localhost'",
        "'admin_klinik_user'@'localhost'"  -- Tambahkan admin_klinik
    )
ORDER BY 
    GRANTEE, TABLE_NAME, COLUMN_NAME;

USE vet_buddy;


-- Flush privileges untuk menerapkan perubahan
FLUSH PRIVILEGES;