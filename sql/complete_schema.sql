-- Complete Database Schema for Vet Buddy Manager
-- Urutan yang benar sesuai dependency foreign keys

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS Kunjungan_Obat;
DROP TABLE IF EXISTS Obat;
DROP TABLE IF EXISTS Layanan;
DROP TABLE IF EXISTS Detail_Layanan;
DROP TABLE IF EXISTS Kunjungan;
DROP TABLE IF EXISTS Hewan;
DROP TABLE IF EXISTS Jenis_Hewan;
DROP TABLE IF EXISTS User_Login;
DROP TABLE IF EXISTS Pawrent;
DROP TABLE IF EXISTS Dokter;
DROP TABLE IF EXISTS Spesialisasi;
DROP TABLE IF EXISTS Klinik;
DROP TABLE IF EXISTS Role;
DROP TABLE IF EXISTS AuditLog;

-- ========================================================
-- 1. TABEL INDEPENDEN (Tidak punya foreign key)
-- ========================================================

-- Tabel Role untuk autentikasi
CREATE TABLE Role (
    role_id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Primary Key, identitas unik role',
    role_name VARCHAR(50) NOT NULL UNIQUE COMMENT 'Nama role: Admin, Vet, Pawrent',
    description VARCHAR(255) COMMENT 'Deskripsi role'
);

-- Tabel Klinik
CREATE TABLE Klinik (
    klinik_id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Primary Key, identitas unik klinik',
    nama_klinik VARCHAR(100) NOT NULL COMMENT 'Nama klinik',
    alamat_klinik VARCHAR(200) NOT NULL COMMENT 'Alamat klinik',
    telepon_klinik VARCHAR(15) UNIQUE COMMENT 'Nomor telepon klinik'
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
    deskripsi_jenis_hewan VARCHAR(255) COMMENT 'Deskripsi tambahan mengenai jenis hewan'
);

-- Tabel Obat
CREATE TABLE Obat (
    obat_id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Primary Key, identitas unik obat',
    nama_obat VARCHAR(100) NOT NULL COMMENT 'Nama obat',
    kegunaan VARCHAR(255) COMMENT 'Kegunaan obat',
    harga_obat DECIMAL(12,2) NOT NULL COMMENT 'Harga satuan obat'
);

-- Tabel Detail_Layanan
CREATE TABLE Detail_Layanan (
    kode_layanan VARCHAR(20) PRIMARY KEY COMMENT 'Primary Key, identitas unik layanan',
    nama_layanan VARCHAR(100) NOT NULL COMMENT 'Nama layanan',
    deskripsi_layanan VARCHAR(255) COMMENT 'Deskripsi layanan',
    biaya_layanan DECIMAL(12,2) NOT NULL COMMENT 'Biaya layanan'
);

-- Tabel AuditLog untuk tracking perubahan
CREATE TABLE AuditLog (
    log_id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Primary Key, identitas unik log',
    table_name VARCHAR(50) COMMENT 'Nama tabel yang diubah',
    action_type ENUM('INSERT', 'UPDATE', 'DELETE') COMMENT 'Jenis aksi',
    executed_by VARCHAR(50) COMMENT 'User yang menjalankan',
    old_data TEXT NULL COMMENT 'Data lama (untuk UPDATE dan DELETE)',
    new_data TEXT NULL COMMENT 'Data baru (untuk INSERT dan UPDATE)',
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu eksekusi'
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
    spesialisasi_id INT COMMENT 'Foreign Key ke tabel Spesialisasi',
    klinik_id INT COMMENT 'Foreign Key ke tabel Klinik',
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
    dokter_id INT NOT NULL COMMENT 'Foreign Key ke tabel Dokter',
    nomor_hp VARCHAR(15) UNIQUE COMMENT 'Nomor HP pemilik hewan',
    CONSTRAINT fk_pawrent_dokter FOREIGN KEY (dokter_id) 
        REFERENCES Dokter(dokter_id) ON DELETE CASCADE
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
    db_user VARCHAR(50) COMMENT 'MySQL database user untuk akses',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Status aktif user',
    dokter_id INT NULL COMMENT 'Foreign Key ke Dokter jika role = Vet',
    pawrent_id INT NULL COMMENT 'Foreign Key ke Pawrent jika role = Pawrent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan user',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu update terakhir',
    last_login TIMESTAMP NULL DEFAULT NULL COMMENT 'Waktu login terakhir user',
    CONSTRAINT fk_user_role FOREIGN KEY (role_id) 
        REFERENCES Role(role_id) ON DELETE CASCADE,
    CONSTRAINT fk_user_dokter FOREIGN KEY (dokter_id) 
        REFERENCES Dokter(dokter_id) ON DELETE CASCADE,
    CONSTRAINT fk_user_pawrent FOREIGN KEY (pawrent_id) 
        REFERENCES Pawrent(pawrent_id) ON DELETE CASCADE
);

-- ========================================================
-- 5. TABEL DENGAN FOREIGN KEY LEVEL 3
-- ========================================================

-- Tabel Hewan (depends on: Jenis_Hewan, Pawrent)
CREATE TABLE Hewan (
    hewan_id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Primary Key, identitas unik hewan',
    nama_hewan VARCHAR(50) NOT NULL COMMENT 'Nama panggilan hewan',
    tanggal_lahir DATE COMMENT 'Tanggal lahir hewan',
    jenis_kelamin ENUM('Jantan','Betina') COMMENT 'Jenis kelamin hewan',
    status_hidup ENUM('Hidup','Mati') DEFAULT 'Hidup' COMMENT 'Status hidup hewan',
    jenis_hewan_id INT NOT NULL COMMENT 'Foreign Key ke tabel Jenis_Hewan',
    pawrent_id INT NOT NULL COMMENT 'Foreign Key ke tabel Pawrent',
    CONSTRAINT fk_hewan_jenis FOREIGN KEY (jenis_hewan_id) 
        REFERENCES Jenis_Hewan(jenis_hewan_id) ON DELETE CASCADE,
    CONSTRAINT fk_hewan_pawrent FOREIGN KEY (pawrent_id) 
        REFERENCES Pawrent(pawrent_id) ON DELETE CASCADE
);

-- ========================================================
-- 6. TABEL DENGAN FOREIGN KEY LEVEL 4
-- ========================================================

-- Tabel Kunjungan (depends on: Hewan, Dokter)
CREATE TABLE Kunjungan (
    kunjungan_id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Primary Key, identitas unik kunjungan',
    hewan_id INT NOT NULL COMMENT 'Foreign Key ke tabel Hewan',
    dokter_id INT NOT NULL COMMENT 'Foreign Key ke tabel Dokter',
    tanggal_kunjungan DATE NOT NULL COMMENT 'Tanggal kunjungan',
    waktu_kunjungan TIME NOT NULL COMMENT 'Waktu kunjungan',
    catatan TEXT COMMENT 'Catatan atau keluhan',
    total_biaya DECIMAL(12,2) NOT NULL COMMENT 'Total biaya kunjungan',
    metode_pembayaran ENUM('Cash','Transfer','E-Wallet') NOT NULL COMMENT 'Metode pembayaran',
    kunjungan_sebelumnya INT NULL COMMENT 'Relasi ke kunjungan sebelumnya (jika ada)',
    CONSTRAINT fk_kunjungan_hewan FOREIGN KEY (hewan_id) 
        REFERENCES Hewan(hewan_id) ON DELETE CASCADE,
    CONSTRAINT fk_kunjungan_dokter FOREIGN KEY (dokter_id) 
        REFERENCES Dokter(dokter_id) ON DELETE CASCADE,
    CONSTRAINT fk_kunjungan_self FOREIGN KEY (kunjungan_sebelumnya) 
        REFERENCES Kunjungan(kunjungan_id) ON DELETE SET NULL,
    CONSTRAINT uq_kunjungan_natural UNIQUE (hewan_id, dokter_id, tanggal_kunjungan, waktu_kunjungan)
);

-- ========================================================
-- 7. TABEL JUNCTION/RELASI (depends on: Kunjungan, Detail_Layanan, Obat)
-- ========================================================

-- Tabel Layanan (junction table: Detail_Layanan + Kunjungan)
CREATE TABLE Layanan (
    kode_layanan VARCHAR(20) NOT NULL COMMENT 'Foreign Key ke Detail_Layanan',
    kunjungan_id INT NOT NULL COMMENT 'Foreign Key ke tabel Kunjungan',
    PRIMARY KEY (kode_layanan, kunjungan_id),
    CONSTRAINT fk_layanan_detail FOREIGN KEY (kode_layanan) 
        REFERENCES Detail_Layanan(kode_layanan) ON DELETE CASCADE,
    CONSTRAINT fk_layanan_kunjungan FOREIGN KEY (kunjungan_id) 
        REFERENCES Kunjungan(kunjungan_id) ON DELETE CASCADE
);

-- Tabel Kunjungan_Obat (junction table: Kunjungan + Obat)
CREATE TABLE Kunjungan_Obat (
    kunjungan_id INT NOT NULL COMMENT 'Foreign Key ke tabel Kunjungan',
    obat_id INT NOT NULL COMMENT 'Foreign Key ke tabel Obat',
    dosis VARCHAR(50) COMMENT 'Dosis obat',
    frekuensi VARCHAR(50) COMMENT 'Frekuensi pemakaian obat',
    PRIMARY KEY (kunjungan_id, obat_id),
    CONSTRAINT fk_kunjunganobat_kunjungan FOREIGN KEY (kunjungan_id) 
        REFERENCES Kunjungan(kunjungan_id) ON DELETE CASCADE,
    CONSTRAINT fk_kunjunganobat_obat FOREIGN KEY (obat_id) 
        REFERENCES Obat(obat_id) ON DELETE CASCADE
);

-- ========================================================
-- 8. CREATE INDEXES untuk performa
-- ========================================================

CREATE INDEX idx_user_login_username ON User_Login(username);
CREATE INDEX idx_user_login_email ON User_Login(email);
CREATE INDEX idx_dokter_nama ON Dokter(nama_dokter);
CREATE INDEX idx_pawrent_nama ON Pawrent(nama_depan_pawrent, nama_belakang_pawrent);
CREATE INDEX idx_hewan_nama ON Hewan(nama_hewan);
CREATE INDEX idx_kunjungan_tanggal ON Kunjungan(tanggal_kunjungan);
CREATE INDEX idx_kunjungan_hewan ON Kunjungan(hewan_id);
CREATE INDEX idx_kunjungan_dokter ON Kunjungan(dokter_id);