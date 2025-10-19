-- TRUNCATE ALL TABLES (urut reverse dependency)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE Kunjungan_Obat;
TRUNCATE TABLE Layanan;
TRUNCATE TABLE Obat;
TRUNCATE TABLE Detail_Layanan;
TRUNCATE TABLE Kunjungan;
TRUNCATE TABLE Hewan;
TRUNCATE TABLE Jenis_Hewan;
TRUNCATE TABLE User_Login;
TRUNCATE TABLE Pawrent;
TRUNCATE TABLE Dokter;
TRUNCATE TABLE Spesialisasi;
TRUNCATE TABLE Klinik;
TRUNCATE TABLE Role;
TRUNCATE TABLE AuditLog;
SET FOREIGN_KEY_CHECKS = 1;

-- ======================
-- INSERT DATA SESUAI SCHEMA BARU
-- ======================

-- Role
INSERT INTO Role (role_id, role_name, description) VALUES
(1, 'admin', 'Administrator dengan akses penuh ke seluruh sistem'),
(2, 'vet', 'Dokter hewan yang dapat menangani kunjungan dan rekam medis'),
(3, 'pawrent', 'Pemilik hewan yang dapat melihat data hewan dan riwayat kunjungan');

-- Klinik
INSERT INTO Klinik (nama_klinik, alamat_klinik, telepon_klinik) VALUES
('Pet Care Clinic', 'Jl. Sudirman No. 123, Jakarta', '021-12345678'),
('Animal Hospital Plus', 'Jl. Gatot Subroto No. 45, Bandung', '022-87654321'),
('Happy Pet Veterinary', 'Jl. Ahmad Yani No. 78, Surabaya', '031-11223344');

-- Spesialisasi
INSERT INTO Spesialisasi (nama_spesialisasi, deskripsi_spesialisasi) VALUES
('Bedah Umum', 'Bedah Umum - Spesialisasi dalam operasi dan pembedahan hewan'),
('Penyakit Dalam', 'Penyakit Dalam - Spesialisasi dalam diagnosis dan pengobatan penyakit internal hewan');

-- Dokter
INSERT INTO Dokter (title_dokter, nama_dokter, telepon_dokter, tanggal_mulai_kerja, spesialisasi_id, klinik_id) VALUES
('drh.', 'Ahmad Suharto', '081234567890', '2020-01-15', 1, 1),
('drh. Sp.KH', 'Siti Nurhaliza', '081234567891', '2019-03-20', 2, 1),
('drh.', 'Budi Santoso', '081234567892', '2021-06-10', 1, 2),
('drh. Sp.KH', 'Maya Indira', '081234567893', '2020-09-05', 2, 2),
('drh.', 'Rizky Pratama', '081234567894', '2022-02-28', 1, 3);

-- Pawrent
INSERT INTO Pawrent (nama_depan_pawrent, nama_belakang_pawrent, alamat_pawrent, kota_pawrent, kode_pos_pawrent, dokter_id, nomor_hp) VALUES
('Andi', 'Wijaya', 'Jl. Merdeka No. 15', 'Jakarta', '12345', 1, '081234567890'),
('Sari', 'Dewi', 'Jl. Pahlawan No. 22', 'Jakarta', '12346', 1, '082134567891'),
('Bima', 'Sakti', 'Jl. Diponegoro No. 8', 'Bandung', '40123', 3, '083134567892'),
('Linda', 'Sari', 'Jl. Veteran No. 31', 'Bandung', '40124', 4, '084134567893'),
('Roni', 'Hartono', 'Jl. Pemuda No. 17', 'Surabaya', '60111', 5, '085134567894'),
('Dian', 'Pratiwi', 'Jl. Kenangan No. 9', 'Surabaya', '60112', 5, '086134567895');

-- Jenis Hewan
INSERT INTO Jenis_Hewan (nama_jenis_hewan, deskripsi_jenis_hewan) VALUES
('Kucing', 'Hewan peliharaan keluarga kucing (Felidae)'),
('Anjing', 'Hewan peliharaan keluarga anjing (Canidae)'),
('Kelinci', 'Hewan mamalia kecil keluarga Leporidae'),
('Hamster', 'Hewan pengerat kecil yang populer sebagai hewan peliharaan');

-- Hewan
INSERT INTO Hewan (nama_hewan, tanggal_lahir, jenis_kelamin, status_hidup, jenis_hewan_id, pawrent_id) VALUES
('Mimi', '2022-05-15', 'Betina', 'Hidup', 1, 1),
('Bobby', '2021-08-20', 'Jantan', 'Hidup', 2, 1),
('Fluffy', '2023-01-10', 'Betina', 'Hidup', 1, 2),
('Rex', '2020-12-05', 'Jantan', 'Hidup', 2, 3),
('Snowball', '2022-09-18', 'Jantan', 'Hidup', 3, 3),
('Luna', '2023-03-22', 'Betina', 'Hidup', 1, 4),
('Max', '2021-11-30', 'Jantan', 'Hidup', 2, 4),
('Coco', '2023-07-14', 'Betina', 'Hidup', 4, 5),
('Buddy', '2022-02-28', 'Jantan', 'Hidup', 2, 5),
('Princess', '2023-04-05', 'Betina', 'Hidup', 1, 6);

-- User_Login
INSERT INTO User_Login (username, email, password_hash, role_id, is_active, dokter_id, pawrent_id) VALUES
('admin', 'admin@vetbuddy.com', '$2b$10$GB6PgZyfOr3uUPraPuDvb.rdisu9QajFDP738RBCjV6cJJ9xV.QLO', 1, TRUE, NULL, NULL),
('ahmad', 'ahmad@vetbuddy.com', '$2b$10$GB6PgZyfOr3uUPraPuDvb.rdisu9QajFDP738RBCjV6cJJ9xV.QLOd', 2, TRUE, 1, NULL),
('siti', 'siti@vetbuddy.com', '$2b$10$GB6PgZyfOr3uUPraPuDvb.rdisu9QajFDP738RBCjV6cJJ9xV.QLO', 2, TRUE, 2, NULL),
('andi', 'andi@vetbuddy.com', '$2b$10$GB6PgZyfOr3uUPraPuDvb.rdisu9QajFDP738RBCjV6cJJ9xV.QLO', 3, TRUE, NULL, 1),
('pawrent1', 'sari@vetbuddy.com', '$2b$10$GB6PgZyfOr3uUPraPuDvb.rdisu9QajFDP738RBCjV6cJJ9xV.QLO', 3, TRUE, NULL, 2);

-- Detail_Layanan
INSERT INTO Detail_Layanan (kode_layanan, nama_layanan, deskripsi_layanan, biaya_layanan) VALUES
('KON001', 'Konsultasi Umum', 'Pemeriksaan kesehatan umum', 150000.00),
('VAK001', 'Vaksinasi', 'Pemberian vaksin untuk pencegahan penyakit', 200000.00),
('STE001', 'Sterilisasi', 'Operasi sterilisasi untuk hewan', 500000.00),
('GRO001', 'Grooming', 'Perawatan kebersihan dan kecantikan hewan', 100000.00),
('XRA001', 'Rontgen', 'Pemeriksaan radiologi', 300000.00),
('LAB001', 'Tes Laboratorium', 'Pemeriksaan laboratorium darah/urine', 250000.00),
('DEN001', 'Perawatan Gigi', 'Pembersihan dan perawatan gigi hewan', 350000.00),
('EME001', 'Emergency', 'Penanganan kasus darurat', 400000.00);

-- Kunjungan
INSERT INTO Kunjungan (hewan_id, dokter_id, tanggal_kunjungan, waktu_kunjungan, catatan, total_biaya, metode_pembayaran, kunjungan_sebelumnya) VALUES
(1, 1, '2025-03-15', '09:00:00', 'Kucing demam dan lemas', 350000.00, 'Cash', NULL),
(4, 3, '2025-03-25', '11:15:00', 'Anjing mengalami diare', 400000.00, 'Cash', NULL),
(1, 2, '2025-04-05', '15:30:00', 'Rujukan dari kunjungan sebelumnya - kucing masih lemas', 500000.00, 'Transfer', 1),
(4, 4, '2025-04-15', '16:00:00', 'Rujukan follow-up anjing diare - kondisi memburuk', 450000.00, 'E-Wallet', 2),
(2, 1, '2025-04-20', '10:30:00', 'Vaksinasi rutin anjing', 200000.00, 'Transfer', NULL),
(3, 2, '2025-05-10', '14:00:00', 'Pemeriksaan rutin kucing', 150000.00, 'E-Wallet', NULL),
(5, 3, '2025-07-18', '08:45:00', 'Kelinci tidak mau makan', 300000.00, 'Transfer', NULL),
(6, 4, '2025-08-20', '13:20:00', 'Sterilisasi kucing betina', 650000.00, 'Cash', NULL);

-- Layanan
INSERT INTO Layanan (kode_layanan, kunjungan_id) VALUES
('KON001', 1),
('LAB001', 1),
('VAK001', 2),
('KON001', 3),
('KON001', 4),
('EME001', 4),
('KON001', 5),
('XRA001', 5),
('KON001', 6),
('LAB001', 6),
('STE001', 7),
('KON001', 7),
('KON001', 8),
('EME001', 8);

-- Obat
INSERT INTO Obat (nama_obat, kegunaan, harga_obat) VALUES
('Amoxicillin', 'Antibiotik untuk infeksi bakteri', 50000.00),
('Paracetamol', 'Obat penurun panas dan pereda nyeri', 15000.00),
('Vitamin B Complex', 'Suplemen vitamin B untuk kesehatan umum', 25000.00),
('Dexamethasone', 'Anti-inflamasi dan imunosupresan', 75000.00),
('Metronidazole', 'Antibiotik untuk infeksi parasit dan bakteri anaerob', 45000.00),
('Omeprazole', 'Obat untuk masalah lambung', 60000.00),
('Chloramphenicol', 'Antibiotik spektrum luas', 40000.00),
('Furosemide', 'Diuretik untuk masalah jantung dan ginjal', 35000.00),
('Prednisolone', 'Anti-inflamasi kortikosteroid', 55000.00),
('Ciprofloxacin', 'Antibiotik fluoroquinolone', 65000.00),
('Ranitidine', 'Penghambat H2 untuk masalah lambung', 30000.00),
('Ivermectin', 'Obat antiparasit', 80000.00),
('Tramadol', 'Analgesik untuk nyeri sedang hingga berat', 70000.00),
('Ketoconazole', 'Antijamur untuk infeksi jamur', 85000.00);

-- Kunjungan_Obat
INSERT INTO Kunjungan_Obat (kunjungan_id, obat_id, dosis, frekuensi) VALUES
(1, 1, '500mg', '2x sehari'),
(1, 2, '250mg', '3x sehari'),
(1, 3, '1 tablet', '1x sehari'),
(4, 5, '250mg', '2x sehari'),
(4, 6, '20mg', '1x sehari'),
(5, 3, '1 tablet', '1x sehari'),
(5, 11, '150mg', '2x sehari'),
(6, 1, '500mg', '3x sehari'),
(6, 4, '5mg', '1x sehari'),
(8, 13, '50mg', '2x sehari');