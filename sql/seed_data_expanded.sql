-- Reduced Seed Data for Vet Buddy Manager (Fixed Version 4)
-- Based on complete_schema.sql - More compact data for testing
-- TRUNCATE ALL TABLES (urut reverse dependency)
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE Kunjungan_Obat;
TRUNCATE TABLE Layanan;
TRUNCATE TABLE Stok_Obat;
TRUNCATE TABLE Mutasi_Obat;
TRUNCATE TABLE Shift_Dokter;
TRUNCATE TABLE Booking;
TRUNCATE TABLE Dokter_Review;
TRUNCATE TABLE Klinik_Review;
TRUNCATE TABLE Kunjungan;
TRUNCATE TABLE Hewan;
TRUNCATE TABLE Admin_Klinik;
TRUNCATE TABLE User_Login;
TRUNCATE TABLE Pawrent;
TRUNCATE TABLE Dokter;
TRUNCATE TABLE Obat;
TRUNCATE TABLE Detail_Layanan;
TRUNCATE TABLE Jenis_Hewan;
TRUNCATE TABLE Spesialisasi;
TRUNCATE TABLE Klinik;
TRUNCATE TABLE Role;
TRUNCATE TABLE AuditLog;

SET FOREIGN_KEY_CHECKS = 1;

-- ======================
-- INSERT REDUCED DATA SESUAI SCHEMA BARU (menggunakan id eksplisit untuk konsistensi FK)
-- ======================

-- Role (tetap sama)
INSERT INTO Role (role_id, role_name, description) VALUES
(1, 'admin', 'Administrator dengan akses penuh ke seluruh sistem'),
(2, 'vet', 'Dokter hewan yang dapat menangani kunjungan dan rekam medis'),
(3, 'pawrent', 'Pemilik hewan yang dapat melihat data hewan dan riwayat kunjungan'),
(4, 'admin_klinik', 'Admin Klinik yang hanya bisa mengelola data terkait klinik tertentu');

-- Klinik (dikurangi menjadi 3)
INSERT INTO Klinik (klinik_id, nama_klinik, alamat_klinik, telepon_klinik) VALUES
(1, 'Pet Care Clinic', 'Jl. Sudirman No. 123, Jakarta', '021-12345678'),
(2, 'Animal Hospital Plus', 'Jl. Gatot Subroto No. 45, Bandung', '022-87654321'),
(3, 'Happy Pet Veterinary', 'Jl. Ahmad Yani No. 78, Surabaya', '031-11223344');

-- Spesialisasi (dikurangi menjadi 3)
INSERT INTO Spesialisasi (spesialisasi_id, nama_spesialisasi, deskripsi_spesialisasi) VALUES
(1, 'Bedah Umum', 'Bedah Umum - Spesialisasi dalam operasi dan pembedahan hewan'),
(2, 'Penyakit Dalam', 'Penyakit Dalam - Spesialisasi dalam diagnosis dan pengobatan penyakit internal hewan'),
(3, 'Kesehatan Reproduksi', 'Spesialisasi dalam kesehatan reproduksi dan obstetri hewan');

-- Jenis Hewan (dikurangi menjadi 3)
INSERT INTO Jenis_Hewan (jenis_hewan_id, nama_jenis_hewan, deskripsi_jenis_hewan) VALUES
(1, 'Kucing', 'Hewan peliharaan keluarga kucing (Felidae)'),
(2, 'Anjing', 'Hewan peliharaan keluarga anjing (Canidae)'),
(3, 'Kelinci', 'Hewan mamalia kecil keluarga Leporidae');

-- Dokter (dikurangi menjadi 6)
INSERT INTO Dokter (dokter_id, title_dokter, nama_dokter, telepon_dokter, tanggal_mulai_kerja, spesialisasi_id, klinik_id) VALUES
(1, 'drh.', 'Ahmad Suharto', '081234567890', '2020-01-15', 1, 1),
(2, 'drh. Sp.KH', 'Siti Nurhaliza', '081234567891', '2019-03-20', 2, 1),
(3, 'drh.', 'Budi Santoso', '081234567892', '2021-06-10', 1, 2),
(4, 'drh. Sp.KH', 'Maya Indira', '081234567893', '2020-09-05', 2, 2),
(5, 'drh.', 'Rizky Pratama', '081234567894', '2022-02-28', 1, 3),
(6, 'drh.', 'Dewi Lestari', '081234567895', '2021-11-12', 3, 3);

-- Pawrent (dikurangi menjadi 10)
INSERT INTO Pawrent (pawrent_id, nama_depan_pawrent, nama_belakang_pawrent, alamat_pawrent, kota_pawrent, kode_pos_pawrent, dokter_id, nomor_hp) VALUES
(1, 'Andi', 'Wijaya', 'Jl. Merdeka No. 15', 'Jakarta', '12345', 1, '081234567890'),
(2, 'Sari', 'Dewi', 'Jl. Pahlawan No. 22', 'Jakarta', '12346', 1, '082134567891'),
(3, 'Bima', 'Sakti', 'Jl. Diponegoro No. 8', 'Bandung', '40123', 3, '083134567892'),
(4, 'Linda', 'Sari', 'Jl. Veteran No. 31', 'Bandung', '40124', 4, '084134567893'),
(5, 'Roni', 'Hartono', 'Jl. Pemuda No. 17', 'Surabaya', '60111', 5, '085134567894'),
(6, 'Dian', 'Pratiwi', 'Jl. Kenangan No. 9', 'Surabaya', '60112', 5, '086134567895'),
(7, 'Eko', 'Susanto', 'Jl. Malioboro No. 45', 'Yogyakarta', '55281', 6, '087134567896'),
(8, 'Maya', 'Rahmawati', 'Jl. Malioboro No. 67', 'Yogyakarta', '55282', 6, '088134567897'),
(9, 'Fajar', 'Aditya', 'Jl. Sudirman No. 89', 'Medan', '20111', 1, '089134567898'),
(10, 'Nina', 'Kurnia', 'Jl. Thamrin No. 12', 'Medan', '20112', 2, '080134567899');

-- User_Login (sesuai pawrent dan dokter baru, plus admin_klinik) - Unique emails
INSERT INTO User_Login (user_id, username, email, password_hash, role_id, is_active, dokter_id, pawrent_id, created_at, updated_at) VALUES
(1, 'admin', 'admin@vetbuddy.com', '$2b$10$GB6PgZyfOr3uUPraPuDvb.rdisu9QajFDP738RBCjV6cJJ9xV.QLO', 1, TRUE, NULL, NULL, NOW(), NOW()),
(2, 'ahmad', 'ahmad@vetbuddy.com', '$2b$10$GB6PgZyfOr3uUPraPuDvb.rdisu9QajFDP738RBCjV6cJJ9xV.QLO', 2, TRUE, 1, NULL, NOW(), NOW()),
(3, 'siti', 'siti@vetbuddy.com', '$2b$10$GB6PgZyfOr3uUPraPuDvb.rdisu9QajFDP738RBCjV6cJJ9xV.QLO', 2, TRUE, 2, NULL, NOW(), NOW()),
(4, 'andi', 'andi@vetbuddy.com', '$2b$10$GB6PgZyfOr3uUPraPuDvb.rdisu9QajFDP738RBCjV6cJJ9xV.QLO', 3, TRUE, NULL, 1, NOW(), NOW()),
(5, 'pawrent1', 'sari@vetbuddy.com', '$2b$10$GB6PgZyfOr3uUPraPuDvb.rdisu9QajFDP738RBCjV6cJJ9xV.QLO', 3, TRUE, NULL, 2, NOW(), NOW()),
(6, 'admin_klinik1', 'admin_klinik1@vetbuddy.com', '$2b$10$GB6PgZyfOr3uUPraPuDvb.rdisu9QajFDP738RBCjV6cJJ9xV.QLO', 4, TRUE, NULL, NULL, NOW(), NOW()),
(7, 'budi', 'budi@vetbuddy.com', '$2b$10$GB6PgZyfOr3uUPraPuDvb.rdisu9QajFDP738RBCjV6cJJ9xV.QLO', 2, TRUE, 3, NULL, NOW(), NOW()),
(8, 'maya_vet', 'maya_vet@vetbuddy.com', '$2b$10$GB6PgZyfOr3uUPraPuDvb.rdisu9QajFDP738RBCjV6cJJ9xV.QLO', 2, TRUE, 4, NULL, NOW(), NOW()),
(9, 'rizky', 'rizky@vetbuddy.com', '$2b$10$GB6PgZyfOr3uUPraPuDvb.rdisu9QajFDP738RBCjV6cJJ9xV.QLO', 2, TRUE, 5, NULL, NOW(), NOW()),
(10, 'dewi', 'dewi@vetbuddy.com', '$2b$10$GB6PgZyfOr3uUPraPuDvb.rdisu9QajFDP738RBCjV6cJJ9xV.QLO', 2, TRUE, 6, NULL, NOW(), NOW()),
(11, 'eko', 'eko@vetbuddy.com', '$2b$10$GB6PgZyfOr3uUPraPuDvb.rdisu9QajFDP738RBCjV6cJJ9xV.QLO', 3, TRUE, NULL, 7, NOW(), NOW()),
(12, 'pawrent2', 'maya_pawrent@vetbuddy.com', '$2b$10$GB6PgZyfOr3uUPraPuDvb.rdisu9QajFDP738RBCjV6cJJ9xV.QLO', 3, TRUE, NULL, 8, NOW(), NOW()),
(13, 'pawrent3', 'pawrent3@vetbuddy.com', '$2b$10$GB6PgZyfOr3uUPraPuDvb.rdisu9QajFDP738RBCjV6cJJ9xV.QLO', 3, TRUE, NULL, 9, NOW(), NOW()),
(14, 'pawrent4', 'pawrent4@vetbuddy.com', '$2b$10$GB6PgZyfOr3uUPraPuDvb.rdisu9QajFDP738RBCjV6cJJ9xV.QLO', 3, TRUE, NULL, 10, NOW(), NOW()),
(15, 'admin_klinik2', 'admin_klinik2@vetbuddy.com', '$2b$10$GB6PgZyfOr3uUPraPuDvb.rdisu9QajFDP738RBCjV6cJJ9xV.QLO', 4, TRUE, NULL, NULL, NOW(), NOW());

-- Admin_Klinik
INSERT INTO Admin_Klinik (user_id, klinik_id) VALUES
(6, 1),  -- admin_klinik1 -> Klinik 1
(15, 2); -- admin_klinik2 -> Klinik 2

-- Hewan (dikurangi menjadi 15)
INSERT INTO Hewan (hewan_id, nama_hewan, tanggal_lahir, jenis_kelamin, status_hidup, jenis_hewan_id, pawrent_id) VALUES
(1, 'Mimi', '2022-05-15', 'Betina', 'Hidup', 1, 1),
(2, 'Bobby', '2021-08-20', 'Jantan', 'Hidup', 2, 1),
(3, 'Fluffy', '2023-01-10', 'Betina', 'Hidup', 1, 2),
(4, 'Rex', '2020-12-05', 'Jantan', 'Hidup', 2, 3),
(5, 'Snowball', '2022-09-18', 'Jantan', 'Hidup', 3, 3),
(6, 'Luna', '2023-03-22', 'Betina', 'Hidup', 1, 4),
(7, 'Max', '2021-11-30', 'Jantan', 'Hidup', 2, 4),
(8, 'Coco', '2023-07-14', 'Betina', 'Hidup', 3, 5),
(9, 'Buddy', '2022-02-28', 'Jantan', 'Hidup', 2, 5),
(10, 'Princess', '2023-04-05', 'Betina', 'Hidup', 1, 6),
(11, 'Tiger', '2021-06-12', 'Jantan', 'Hidup', 1, 7),
(12, 'Bella', '2022-11-08', 'Betina', 'Hidup', 2, 8),
(13, 'Charlie', '2020-04-20', 'Jantan', 'Hidup', 2, 9),
(14, 'Daisy', '2023-08-15', 'Betina', 'Hidup', 3, 10),
(15, 'Oscar', '2021-12-01', 'Jantan', 'Hidup', 3, 10);

-- Detail_Layanan (tetap sama)
INSERT INTO Detail_Layanan (kode_layanan, nama_layanan, deskripsi_layanan, biaya_layanan) VALUES
('KON001', 'Konsultasi Umum', 'Pemeriksaan kesehatan umum', 150000.00),
('VAK001', 'Vaksinasi', 'Pemberian vaksin untuk pencegahan penyakit', 200000.00),
('STE001', 'Sterilisasi', 'Operasi sterilisasi untuk hewan', 500000.00),
('GRO001', 'Grooming', 'Perawatan kebersihan dan kecantikan hewan', 100000.00),
('XRA001', 'Rontgen', 'Pemeriksaan radiologi', 300000.00),
('LAB001', 'Tes Laboratorium', 'Pemeriksaan laboratorium darah/urine', 250000.00),
('DEN001', 'Perawatan Gigi', 'Pembersihan dan perawatan gigi hewan', 350000.00),
('EME001', 'Emergency', 'Penanganan kasus darurat', 400000.00);

-- Obat (dikurangi menjadi 10)
INSERT INTO Obat (obat_id, nama_obat, kegunaan, harga_obat) VALUES
(1, 'Amoxicillin', 'Antibiotik untuk infeksi bakteri', 50000.00),
(2, 'Paracetamol', 'Obat penurun panas dan pereda nyeri', 15000.00),
(3, 'Vitamin B Complex', 'Suplemen vitamin B untuk kesehatan umum', 25000.00),
(4, 'Dexamethasone', 'Anti-inflamasi dan imunosupresan', 75000.00),
(5, 'Metronidazole', 'Antibiotik untuk infeksi parasit dan bakteri anaerob', 45000.00),
(6, 'Omeprazole', 'Obat untuk masalah lambung', 60000.00),
(7, 'Chloramphenicol', 'Antibiotik spektrum luas', 40000.00),
(8, 'Furosemide', 'Diuretik untuk masalah jantung dan ginjal', 35000.00),
(9, 'Prednisolone', 'Anti-inflamasi kortikosteroid', 55000.00),
(10, 'Ciprofloxacin', 'Antibiotik fluoroquinolone', 65000.00);

-- Kunjungan (dikurangi menjadi 15)
INSERT INTO Kunjungan (kunjungan_id, klinik_id, hewan_id, dokter_id, tanggal_kunjungan, waktu_kunjungan, catatan, metode_pembayaran, kunjungan_sebelumnya) VALUES
(1, 1, 1, 1, '2025-03-15', '09:00:00', 'Kucing demam dan lemas', 'Cash', NULL),
(2, 2, 4, 3, '2025-03-25', '11:15:00', 'Anjing mengalami diare', 'Cash', NULL),
(3, 1, 1, 2, '2025-04-05', '15:30:00', 'Rujukan dari kunjungan sebelumnya - kucing masih lemas', 'Transfer', 1),
(4, 2, 4, 4, '2025-04-15', '16:00:00', 'Rujukan follow-up anjing diare - kondisi memburuk', 'E-Wallet', 2),
(5, 1, 2, 1, '2025-04-20', '10:30:00', 'Vaksinasi rutin anjing', 'Transfer', NULL),
(6, 1, 3, 2, '2025-05-10', '14:00:00', 'Pemeriksaan rutin kucing', 'E-Wallet', NULL),
(7, 2, 5, 3, '2025-07-18', '08:45:00', 'Kelinci tidak mau makan', 'Transfer', NULL),
(8, 3, 6, 4, '2025-08-20', '13:20:00', 'Sterilisasi kucing betina', 'Cash', NULL),
(9, 1, 11, 1, '2025-09-01', '10:00:00', 'Kucing batuk', 'Cash', NULL),
(10, 2, 12, 3, '2025-09-05', '11:30:00', 'Anjing limping', 'Transfer', NULL),
(11, 3, 13, 5, '2025-09-10', '14:15:00', 'Anjing muntah', 'E-Wallet', NULL),
(12, 1, 14, 2, '2025-09-15', '09:45:00', 'Kelinci lesu', 'Cash', NULL),
(13, 2, 15, 4, '2025-09-20', '13:00:00', 'Kelinci kurus', 'Transfer', NULL),
(14, 3, 7, 6, '2025-09-25', '15:30:00', 'Anjing demam', 'E-Wallet', NULL),
(15, 1, 8, 1, '2025-10-01', '10:15:00', 'Kelinci diare', 'Cash', NULL);

-- Layanan (sesuai kunjungan)
INSERT INTO Layanan (kunjungan_id, kode_layanan, qty, biaya_saat_itu) VALUES
(1, 'KON001', 1, 150000.00),
(1, 'LAB001', 1, 250000.00),
(2, 'VAK001', 1, 200000.00),
(3, 'KON001', 1, 150000.00),
(4, 'KON001', 1, 150000.00),
(4, 'EME001', 1, 400000.00),
(5, 'KON001', 1, 150000.00),
(5, 'XRA001', 1, 300000.00),
(6, 'KON001', 1, 150000.00),
(6, 'LAB001', 1, 250000.00),
(7, 'STE001', 1, 500000.00),
(8, 'KON001', 1, 150000.00),
(9, 'KON001', 1, 150000.00),
(10, 'VAK001', 1, 200000.00),
(11, 'KON001', 1, 150000.00),
(12, 'GRO001', 1, 100000.00),
(13, 'XRA001', 1, 300000.00),
(14, 'LAB001', 1, 250000.00),
(15, 'DEN001', 1, 350000.00);

-- Kunjungan_Obat (sesuai kunjungan)
INSERT INTO Kunjungan_Obat (kunjungan_id, obat_id, qty, harga_saat_itu, dosis, frekuensi) VALUES
(1, 1, 1, 50000.00, '500mg', '2x sehari'),
(1, 2, 1, 15000.00, '250mg', '3x sehari'),
(4, 5, 1, 45000.00, '250mg', '2x sehari'),
(5, 3, 1, 25000.00, '1 tablet', '1x sehari'),
(6, 1, 1, 50000.00, '500mg', '3x sehari'),
(8, 4, 1, 75000.00, '5mg', '1x sehari'),
(9, 7, 1, 40000.00, '250mg', '2x sehari'),
(10, 8, 1, 35000.00, '20mg', '2x sehari'),
(11, 9, 1, 55000.00, '5mg', '1x sehari'),
(12, 10, 1, 65000.00, '500mg', '2x sehari'),
(13, 1, 1, 50000.00, '500mg', '3x sehari'),
(14, 2, 1, 15000.00, '250mg', '3x sehari'),
(15, 3, 1, 25000.00, '1 tablet', '1x sehari');

-- Stok_Obat
INSERT INTO Stok_Obat (obat_id, klinik_id, jumlah_stok) VALUES
(1, 1, 50),
(2, 1, 100),
(3, 2, 75),
(4, 2, 40),
(5, 3, 30);

-- Mutasi_Obat
INSERT INTO Mutasi_Obat (obat_id, klinik_id, qty, tipe_mutasi, sumber_mutasi, tanggal_mutasi, user_id, keterangan) VALUES
(1, 1, 50, 'Masuk', 'Pembelian', NOW(), 1, 'Stok awal'),
(2, 1, 100, 'Masuk', 'Pembelian', NOW(), 1, 'Stok awal'),
(3, 2, 75, 'Masuk', 'Pembelian', NOW(), 1, 'Stok awal');

-- Shift_Dokter (sesuai dokter)
INSERT INTO Shift_Dokter (dokter_id, hari_minggu, jam_mulai, jam_selesai, is_active) VALUES
(1, 1, '08:00:00', '12:00:00', TRUE),
(2, 1, '12:00:00', '17:00:00', TRUE),
(3, 2, '08:00:00', '12:00:00', TRUE),
(4, 2, '12:00:00', '17:00:00', TRUE),
(5, 3, '08:00:00', '12:00:00', TRUE),
(6, 3, '12:00:00', '17:00:00', TRUE);

-- Booking (dikurangi menjadi 5)
INSERT INTO Booking (klinik_id, dokter_id, pawrent_id, hewan_id, tanggal_booking, waktu_booking, status, catatan) VALUES
(1, 1, 1, 1, '2025-09-01', '09:30:00', 'booked', 'Kontrol demam untuk Mimi'),
(1, 2, 2, 3, '2025-09-02', '11:00:00', 'booked', 'Vaksinasi rutin untuk Fluffy'),
(2, 3, NULL, NULL, '2025-09-03', '10:00:00', 'booked', 'Konsultasi untuk tamu non-member'),
(3, 4, 4, 6, '2025-09-04', '14:00:00', 'pending', 'Sterilisasi untuk Luna'),
(1, 1, 1, 2, '2025-09-05', '10:30:00', 'done', 'Kontrol untuk Bobby');

-- Dokter_Review (dikurangi menjadi 5)
INSERT INTO Dokter_Review (dokter_id, pawrent_id, rating, komentar) VALUES
(1, 1, 5, 'Pelayanan sangat baik'),
(2, 2, 4, 'Sabar dan informatif'),
(3, 3, 5, 'Dokter hebat'),
(4, 4, 4, 'Ramah sekali'),
(5, 5, 5, 'Profesional');

-- Klinik_Review (dikurangi menjadi 5)
INSERT INTO Klinik_Review (klinik_id, pawrent_id, rating, komentar) VALUES
(1, 1, 5, 'Fasilitas lengkap'),
(2, 3, 4, 'Pelayanan memuaskan'),
(3, 4, 5, 'Bersih dan nyaman'),
(1, 2, 4, 'Staff ramah'),
(2, 5, 5, 'Lokasi strategis');

-- AuditLog
INSERT INTO AuditLog (table_name, action_type, executed_by, old_data, new_data) VALUES
('User_Login', 'INSERT', 'system', NULL, '{"username":"admin"}'),
('Dokter', 'INSERT', 'admin', NULL, '{"nama_dokter":"Ahmad Suharto"}'),
('Kunjungan', 'INSERT', 'siti', NULL, '{"hewan_id":1}');

-- Pastikan auto_increment selanjutnya konsisten
ALTER TABLE Role AUTO_INCREMENT = 5;
ALTER TABLE Klinik AUTO_INCREMENT = 4;
ALTER TABLE Spesialisasi AUTO_INCREMENT = 4;
ALTER TABLE Jenis_Hewan AUTO_INCREMENT = 4;
ALTER TABLE Dokter AUTO_INCREMENT = 7;
ALTER TABLE Pawrent AUTO_INCREMENT = 11;
ALTER TABLE User_Login AUTO_INCREMENT = 16;
ALTER TABLE Admin_Klinik AUTO_INCREMENT = 3;
ALTER TABLE Hewan AUTO_INCREMENT = 16;
ALTER TABLE Obat AUTO_INCREMENT = 11;
ALTER TABLE Kunjungan AUTO_INCREMENT = 16;