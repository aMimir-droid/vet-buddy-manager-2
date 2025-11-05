-- Complete Database Schema for Vet Buddy Manager
-- Urutan yang benar sesuai dependency foreign keys
SET FOREIGN_KEY_CHECKS = 0;
-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS Kunjungan_Obat;
DROP TABLE IF EXISTS Layanan;
DROP TABLE IF EXISTS Stok_Obat;
DROP TABLE IF EXISTS Mutasi_Obat;
DROP TABLE IF EXISTS Shift_Dokter;
DROP TABLE IF EXISTS Booking;
DROP TABLE IF EXISTS Dokter_Review;
DROP TABLE IF EXISTS Klinik_Review;
DROP TABLE IF EXISTS Kunjungan;
DROP TABLE IF EXISTS Hewan;
DROP TABLE IF EXISTS Admin_Klinik;  -- Tambahkan drop untuk Admin_Klinik
DROP TABLE IF EXISTS User_Login;
DROP TABLE IF EXISTS Pawrent;
DROP TABLE IF EXISTS Dokter;
DROP TABLE IF EXISTS Obat;
DROP TABLE IF EXISTS Detail_Layanan;
DROP TABLE IF EXISTS Jenis_Hewan;
DROP TABLE IF EXISTS Spesialisasi;
DROP TABLE IF EXISTS Klinik;
DROP TABLE IF EXISTS Role;

-- ========================================================
-- 1. TABEL INDEPENDEN (Tidak punya foreign key)
-- ========================================================

-- Tabel Role untuk autentikasi
CREATE TABLE Role (
    role_id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Primary Key, identitas unik role',
    role_name VARCHAR(50) NOT NULL UNIQUE COMMENT 'Nama role: Admin, Vet, Pawrent, Admin_Klinik',
    description VARCHAR(255) COMMENT 'Deskripsi role'
);

-- Tabel Klinik
CREATE TABLE Klinik (
    klinik_id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Primary Key, identitas unik klinik',
    nama_klinik VARCHAR(100) NOT NULL COMMENT 'Nama klinik',
    alamat_klinik VARCHAR(200) NOT NULL COMMENT 'Alamat klinik',
    telepon_klinik VARCHAR(15) UNIQUE COMMENT 'Nomor telepon klinik',
    deleted_at DATETIME NULL COMMENT 'Soft delete timestamp untuk klinik'
);

-- Tabel Spesialisasi
CREATE TABLE Spesialisasi (
    spesialisasi_id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Primary Key, identitas unik spesialisasi',
    nama_spesialisasi VARCHAR(100) NOT NULL COMMENT 'Nama bidang spesialisasi dokter',
    deskripsi_spesialisasi VARCHAR(255) COMMENT 'Deskripsi tambahan mengenai spesialisasi'
);

-- Tabel Jenis_Hewan
CREATE TABLE Jenis_Hewan (
    jenis_hewan_id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Primary Key, identitas unik jenis hewan',
    nama_jenis_hewan VARCHAR(50) NOT NULL COMMENT 'Nama jenis hewan, contoh: Kucing, Anjing',
    deskripsi_jenis_hewan VARCHAR(255) COMMENT 'Deskripsi tambahan mengenai jenis hewan',
    deleted_at DATETIME NULL COMMENT 'Soft delete timestamp'
);
-- Tabel Obat
CREATE TABLE Obat (
    obat_id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Primary Key, identitas unik obat',
    nama_obat VARCHAR(100) NOT NULL COMMENT 'Nama obat',
    kegunaan VARCHAR(255) COMMENT 'Kegunaan obat',
    harga_obat DECIMAL(12,2) NOT NULL COMMENT 'Harga satuan obat',
    deleted_at DATETIME NULL COMMENT 'Soft delete timestamp'
);

-- Tabel Detail_Layanan
CREATE TABLE Detail_Layanan (
    kode_layanan VARCHAR(20) PRIMARY KEY COMMENT 'Primary Key, identitas unik layanan',
    nama_layanan VARCHAR(100) NOT NULL COMMENT 'Nama layanan',
    deskripsi_layanan VARCHAR(255) COMMENT 'Deskripsi layanan',
    biaya_layanan DECIMAL(12,2) NOT NULL COMMENT 'Biaya layanan (Harga Master)',
    deleted_at DATETIME NULL COMMENT 'MODIFIKASI: Soft delete untuk menonaktifkan layanan'
);

-- ========================================================
-- 2. TABEL DENGAN FOREIGN KEY LEVEL 1
-- ========================================================

-- Tabel Dokter (depends on: Spesialisasi, Klinik)
CREATE TABLE Dokter (
    dokter_id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Primary Key, identitas unik dokter',
    title_dokter VARCHAR(20) NOT NULL COMMENT 'Gelar atau titel dokter (misal: drh., drh. Sp.KH)',
    nama_dokter VARCHAR(100) NOT NULL COMMENT 'Nama lengkap dokter',
    telepon_dokter VARCHAR(15) UNIQUE COMMENT 'Nomor telepon dokter',
    tanggal_mulai_kerja DATE COMMENT 'Tanggal mulai bekerja',
    spesialisasi_id INT NULL COMMENT 'Foreign Key ke tabel Spesialisasi',
    klinik_id INT NULL COMMENT 'Foreign Key ke tabel Klinik',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Status aktif dokter (true = aktif, false = non-aktif)',
    deleted_at DATETIME NULL COMMENT 'Soft delete dokter',
    CONSTRAINT fk_dokter_spesialisasi FOREIGN KEY (spesialisasi_id) 
        REFERENCES Spesialisasi(spesialisasi_id) ON DELETE SET NULL,
    CONSTRAINT fk_dokter_klinik FOREIGN KEY (klinik_id) 
        REFERENCES Klinik(klinik_id) ON DELETE SET NULL
);

-- ========================================================
-- 3. TABEL DENGAN FOREIGN KEY LEVEL 2
-- ========================================================

-- Tabel Pawrent (depends on: Dokter)
CREATE TABLE Pawrent (
    pawrent_id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Primary Key, identitas unik pemilik hewan',
    nama_depan_pawrent VARCHAR(50) NOT NULL COMMENT 'Nama depan pemilik hewan',
    nama_belakang_pawrent VARCHAR(50) NOT NULL COMMENT 'Nama belakang pemilik hewan',
    alamat_pawrent VARCHAR(200) COMMENT 'Alamat lengkap pemilik hewan',
    kota_pawrent VARCHAR(100) COMMENT 'Kota tempat tinggal pemilik hewan',
    kode_pos_pawrent VARCHAR(10) COMMENT 'Kode pos alamat pemilik',
    dokter_id INT NULL COMMENT 'Foreign Key ke tabel Dokter',
    nomor_hp VARCHAR(15) UNIQUE COMMENT 'Nomor HP pemilik hewan',
    deleted_at DATETIME NULL COMMENT 'Soft delete pawrent',
    CONSTRAINT fk_pawrent_dokter FOREIGN KEY (dokter_id)    
        REFERENCES Dokter(dokter_id) ON DELETE SET NULL
);

-- ========================================================
-- 4. TABEL USER_LOGIN (depends on: Role, Dokter, Pawrent)
-- ========================================================

-- Tabel User_Login untuk autentikasi
CREATE TABLE User_Login (
    user_id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Primary Key, identitas unik user',
    username VARCHAR(50) NOT NULL UNIQUE COMMENT 'Username untuk login',
    email VARCHAR(100) NOT NULL UNIQUE COMMENT 'Email user',
    password_hash VARCHAR(255) NOT NULL COMMENT 'Hashed password',
    role_id INT NOT NULL COMMENT 'Foreign Key ke tabel Role',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Status aktif user',
    dokter_id INT NULL COMMENT 'Foreign Key ke Dokter jika role = Vet',
    pawrent_id INT NULL COMMENT 'Foreign Key ke Pawrent jika role = Pawrent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan user',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu update terakhir',
    last_login TIMESTAMP NULL DEFAULT NULL COMMENT 'Waktu login terakhir user',
    deleted_at DATETIME NULL COMMENT 'Soft delete user',
    CONSTRAINT fk_user_role FOREIGN KEY (role_id) 
        REFERENCES Role(role_id) ON DELETE RESTRICT,
    CONSTRAINT fk_user_dokter FOREIGN KEY (dokter_id) 
        REFERENCES Dokter(dokter_id) ON DELETE SET NULL,
    CONSTRAINT fk_user_pawrent FOREIGN KEY (pawrent_id) 
        REFERENCES Pawrent(pawrent_id) ON DELETE SET NULL
);

-- ========================================================
-- 5. TABEL ADMIN_KLINIK (depends on: User_Login, Klinik)
-- ========================================================

-- Tabel Admin_Klinik untuk admin klinik
CREATE TABLE Admin_Klinik (
    admin_klinik_id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Primary Key, identitas unik admin klinik',
    user_id INT NOT NULL COMMENT 'Foreign Key ke tabel User_Login',
    klinik_id INT NOT NULL COMMENT 'Foreign Key ke tabel Klinik',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu update terakhir',
    CONSTRAINT fk_admin_klinik_user FOREIGN KEY (user_id) 
        REFERENCES User_Login(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_admin_klinik_klinik FOREIGN KEY (klinik_id) 
        REFERENCES Klinik(klinik_id) ON DELETE CASCADE,
    UNIQUE KEY unique_admin_klinik (user_id, klinik_id) COMMENT 'Satu user hanya admin di satu klinik'
);

-- Tambahkan tabel Mutasi_Obat setelah User_Login (butuh referensi ke user_id)
CREATE TABLE Mutasi_Obat (
    mutasi_id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Primary Key mutasi',
    obat_id INT NOT NULL COMMENT 'FK ke Obat',
    klinik_id INT NOT NULL COMMENT 'FK ke Klinik',
    qty INT NOT NULL COMMENT 'Jumlah obat dalam mutasi (positif integer)',
    tipe_mutasi ENUM('Masuk', 'Keluar') NOT NULL COMMENT 'Jenis Mutasi',
    sumber_mutasi ENUM('Pembelian', 'Pemakaian', 'Retur', 'Penyesuaian') NOT NULL COMMENT 'Sumber mutasi',
    tanggal_mutasi TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu mutasi',
    user_id INT NOT NULL COMMENT 'User yang melakukan mutasi (FK ke User_Login)',
    keterangan VARCHAR(255) NULL COMMENT 'Catatan opsional',
    deleted_at DATETIME NULL COMMENT 'Soft delete mutasi (jika perlu revert but keep history)',
    CONSTRAINT fk_mutasi_obat FOREIGN KEY (obat_id) 
        REFERENCES Obat(obat_id) ON DELETE RESTRICT,
    CONSTRAINT fk_mutasi_klinik FOREIGN KEY (klinik_id) 
        REFERENCES Klinik(klinik_id) ON DELETE RESTRICT,
    CONSTRAINT fk_mutasi_user FOREIGN KEY (user_id)
        REFERENCES User_Login(user_id) ON DELETE RESTRICT
);

-- ========================================================
-- 6. TABEL DENGAN FOREIGN KEY LEVEL 3
-- ========================================================

-- Tabel Hewan (depends on: Jenis_Hewan, Pawrent)
CREATE TABLE Hewan (
    hewan_id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Primary Key, identitas unik hewan',
    nama_hewan VARCHAR(50) NOT NULL COMMENT 'Nama panggilan hewan',
    tanggal_lahir DATE COMMENT 'Tanggal lahir hewan',
    jenis_kelamin ENUM('Jantan','Betina') COMMENT 'Jenis kelamin hewan',
    status_hidup ENUM('Hidup','Mati') DEFAULT 'Hidup' COMMENT 'Status hidup hewan',
    jenis_hewan_id INT NOT NULL COMMENT 'Foreign Key ke tabel Jenis_Hewan',
    pawrent_id INT NULL COMMENT 'Foreign Key ke tabel Pawrent',
    deleted_at DATETIME NULL COMMENT 'Soft delete hewan',
    CONSTRAINT fk_hewan_jenis FOREIGN KEY (jenis_hewan_id) 
        REFERENCES Jenis_Hewan(jenis_hewan_id) ON DELETE RESTRICT,
    CONSTRAINT fk_hewan_pawrent FOREIGN KEY (pawrent_id) 
        REFERENCES Pawrent(pawrent_id) ON DELETE SET NULL
);


-- Tabel Shift_Dokter (jadwal mingguan)
CREATE TABLE Shift_Dokter (
    shift_id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Primary Key shift',
    dokter_id INT NOT NULL COMMENT 'FK ke tabel Dokter',
    hari_minggu TINYINT NOT NULL COMMENT '0=Sun ... 6=Sat',
    jam_mulai TIME NOT NULL COMMENT 'Jam mulai shift',
    jam_selesai TIME NOT NULL COMMENT 'Jam selesai shift',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Status shift aktif/tidak',
    
    CONSTRAINT fk_shift_dokter FOREIGN KEY (dokter_id) 
        REFERENCES Dokter(dokter_id) ON DELETE CASCADE
);


-- Tabel Booking Janji Temu
CREATE TABLE Booking (
    booking_id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Primary Key Booking',
    klinik_id INT NOT NULL COMMENT 'FK Klinik TEMPAT booking',
    dokter_id INT NOT NULL COMMENT 'FK Dokter',
    pawrent_id INT NULL COMMENT 'FK Pawrent jika sudah terdaftar',
    hewan_id INT NULL COMMENT 'FK Hewan yang dibooking (pengganti nama_pengunjung)', -- GANTI: Dari nama_pengunjung ke hewan_id
    tanggal_booking DATE NOT NULL COMMENT 'Tanggal booking',
    waktu_booking TIME NOT NULL COMMENT 'Jam booking',
    status ENUM('pending','booked','cancelled','done') DEFAULT 'pending' COMMENT 'Status appointment',
    catatan TEXT NULL COMMENT 'Catatan keluhan awal',
    
    CONSTRAINT fk_booking_klinik FOREIGN KEY (klinik_id)
        REFERENCES Klinik(klinik_id) ON DELETE RESTRICT,
        
    CONSTRAINT fk_booking_dokter FOREIGN KEY (dokter_id)
        REFERENCES Dokter(dokter_id) ON DELETE CASCADE,
    
    CONSTRAINT fk_booking_pawrent FOREIGN KEY (pawrent_id)
        REFERENCES Pawrent(pawrent_id) ON DELETE SET NULL,
        
    CONSTRAINT fk_booking_hewan FOREIGN KEY (hewan_id) -- TAMBAHKAN: FK ke Hewan
        REFERENCES Hewan(hewan_id) ON DELETE SET NULL,
        
    -- Modifikasi UQ: Booking unik per dokter, per waktu, DAN per klinik
    CONSTRAINT uq_booking UNIQUE (klinik_id, dokter_id, tanggal_booking, waktu_booking)
);

-- ========================================================
-- 7. TABEL DENGAN FOREIGN KEY LEVEL 4
-- ========================================================

-- Tabel Kunjungan (depends on: Hewan, Dokter)
CREATE TABLE Kunjungan (
    kunjungan_id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Primary Key, identitas unik kunjungan',
    klinik_id INT NOT NULL COMMENT 'FK Klinik TEMPAT kunjungan',
    hewan_id INT NULL COMMENT 'Foreign Key ke tabel Hewan',
    dokter_id INT NULL COMMENT 'Foreign Key ke tabel Dokter',
    tanggal_kunjungan DATE NOT NULL COMMENT 'Tanggal kunjungan',
    waktu_kunjungan TIME NOT NULL COMMENT 'Waktu kunjungan',
    catatan TEXT COMMENT 'Catatan atau keluhan',
    metode_pembayaran ENUM('Cash','Transfer','E-Wallet') NOT NULL COMMENT 'Metode pembayaran',
    kunjungan_sebelumnya INT NULL COMMENT 'Relasi ke kunjungan sebelumnya (jika ada)',
    booking_id INT NULL COMMENT 'FK ke Booking jika kunjungan berasal dari booking',
    deleted_at DATETIME NULL COMMENT 'Soft delete kunjungan (rekam medis tetap ada)',
    
    CONSTRAINT fk_kunjungan_klinik FOREIGN KEY (klinik_id)
        REFERENCES Klinik(klinik_id) ON DELETE RESTRICT,
        
    CONSTRAINT fk_kunjungan_hewan FOREIGN KEY (hewan_id) 
        REFERENCES Hewan(hewan_id) ON DELETE SET NULL,
    CONSTRAINT fk_kunjungan_dokter FOREIGN KEY (dokter_id) 
        REFERENCES Dokter(dokter_id) ON DELETE SET NULL,
    CONSTRAINT fk_kunjungan_self FOREIGN KEY (kunjungan_sebelumnya) 
        REFERENCES Kunjungan(kunjungan_id) ON DELETE SET NULL,
    CONSTRAINT fk_kunjungan_booking FOREIGN KEY (booking_id)
        REFERENCES Booking(booking_id) ON DELETE SET NULL,
        
    -- Modifikasi UQ: Kunjungan unik per hewan, dokter, waktu, DAN klinik
    CONSTRAINT uq_kunjungan_natural UNIQUE (klinik_id, hewan_id, dokter_id, tanggal_kunjungan, waktu_kunjungan)
);
-- ========================================================
-- 8. TABEL JUNCTION/RELASI (depends on: Kunjungan, Detail_Layanan, Obat)
-- ========================================================

-- Tabel Stok_Obat (stok per obat per klinik)
CREATE TABLE Stok_Obat (
    stok_id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Primary Key stok obat',
    obat_id INT NOT NULL COMMENT 'FK ke tabel Obat',
    klinik_id INT NOT NULL COMMENT 'FK ke Klinik',
    jumlah_stok INT NOT NULL DEFAULT 0 COMMENT 'Jumlah stok saat ini',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu update stok terakhir',

    CONSTRAINT fk_stok_obat FOREIGN KEY (obat_id) 
        REFERENCES Obat(obat_id) ON DELETE RESTRICT,

    CONSTRAINT fk_stok_klinik FOREIGN KEY (klinik_id) 
        REFERENCES Klinik(klinik_id) ON DELETE CASCADE,

    UNIQUE (obat_id, klinik_id) -- 1 baris stok per obat per klinik
);

-- Tabel Layanan (junction table: Detail_Layanan + Kunjungan)
CREATE TABLE Layanan (
    layanan_id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Primary Key unik untuk rincian layanan',
    kunjungan_id INT NOT NULL COMMENT 'Foreign Key ke tabel Kunjungan',
    kode_layanan VARCHAR(20) NOT NULL COMMENT 'Foreign Key ke Detail_Layanan',
    qty INT NOT NULL DEFAULT 1 COMMENT 'Jumlah layanan yang diberikan (misal: 2x suntik)',
    biaya_saat_itu DECIMAL(12,2) NOT NULL COMMENT 'Harga layanan PADA SAAT transaksi',
    
    CONSTRAINT fk_layanan_kunjungan FOREIGN KEY (kunjungan_id) 
        REFERENCES Kunjungan(kunjungan_id) ON DELETE CASCADE,
    CONSTRAINT fk_layanan_detail FOREIGN KEY (kode_layanan) 
        REFERENCES Detail_Layanan(kode_layanan) ON DELETE RESTRICT
);
-- Tabel Kunjungan_Obat (junction table: Kunjungan + Obat)
CREATE TABLE Kunjungan_Obat (
    kunjungan_obat_id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Primary Key unik untuk rincian obat',
    kunjungan_id INT NOT NULL COMMENT 'Foreign Key ke tabel Kunjungan',
    obat_id INT NOT NULL COMMENT 'Foreign Key ke tabel Obat',
    qty INT NOT NULL COMMENT 'Jumlah obat yang diberikan',
    harga_saat_itu DECIMAL(12,2) NOT NULL COMMENT 'Harga obat PADA SAAT transaksi',
    dosis VARCHAR(50) COMMENT 'Dosis obat',
    frekuensi VARCHAR(50) COMMENT 'Frekuensi pemakaian obat',
    
    CONSTRAINT fk_kunjunganobat_kunjungan FOREIGN KEY (kunjungan_id) 
        REFERENCES Kunjungan(kunjungan_id) ON DELETE CASCADE,
    CONSTRAINT fk_kunjunganobat_obat FOREIGN KEY (obat_id) 
        REFERENCES Obat(obat_id) ON DELETE RESTRICT
);






-- -- Review dokter
-- CREATE TABLE Dokter_Review (
--     review_id INT AUTO_INCREMENT PRIMARY KEY,
--     dokter_id INT NOT NULL,
--     pawrent_id INT NOT NULL,
--     rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5), -- 1 sampai 5
--     komentar TEXT,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY (dokter_id) REFERENCES Dokter(dokter_id) ON DELETE CASCADE,
--     FOREIGN KEY (pawrent_id) REFERENCES Pawrent(pawrent_id) ON DELETE CASCADE
-- );

-- -- Review Klinik

-- CREATE TABLE Klinik_Review (
--     review_id INT AUTO_INCREMENT PRIMARY KEY,
--     klinik_id INT NOT NULL,
--     pawrent_id INT NOT NULL,
--     rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
--     komentar TEXT,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY (klinik_id) REFERENCES Klinik(klinik_id) ON DELETE CASCADE,
--     FOREIGN KEY (pawrent_id) REFERENCES Pawrent(pawrent_id) ON DELETE CASCADE
-- );



-- ========================================================
-- 9. CREATE INDEXES untuk performa
-- ========================================================

CREATE INDEX idx_user_login_username ON User_Login(username);
CREATE INDEX idx_user_login_email ON User_Login(email);
CREATE INDEX idx_dokter_nama ON Dokter(nama_dokter);
CREATE INDEX idx_pawrent_nama ON Pawrent(nama_depan_pawrent, nama_belakang_pawrent);
CREATE INDEX idx_hewan_nama ON Hewan(nama_hewan);
CREATE INDEX idx_kunjungan_tanggal ON Kunjungan(tanggal_kunjungan);
CREATE INDEX idx_kunjungan_hewan ON Kunjungan(hewan_id);
CREATE INDEX idx_kunjungan_dokter ON Kunjungan(dokter_id);
CREATE INDEX idx_booking_date ON Booking(tanggal_booking);
CREATE INDEX idx_shift_dokter_hari ON Shift_Dokter(dokter_id, hari_minggu);
