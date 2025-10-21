# Vet Buddy Manager

Sistem Manajemen Klinik Hewan Sahabat Satwa  
Frontend: React + Vite + Shadcn  
Backend: Express + MySQL + Stored Procedures

## Fitur Utama

- Manajemen user (Admin, Dokter, Pawrent)
- CRUD Kunjungan, Hewan, Obat, Layanan, Klinik
- Hak akses berbasis role (admin/vet/pawrent)
- Audit log & dashboard statistik
- Registrasi dengan validasi unik

---

## 1. Persiapan Database

1. **Install MySQL** dan buat database baru:
   ```sql
   CREATE DATABASE vet_buddy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. **Import schema dan prosedur:**
   - Jalankan file SQL berikut secara berurutan:
     - `sql/complete_schema.sql`
     - `sql/Admin_StoredProcedure_*.sql` (semua file prosedur)
     - `sql/Admin_Trigger.sql`
     - `sql/Admin_GrantTables.sql`
     - `sql/Admin_GrantExecute.sql`
     - `sql/Admin_HakAkses.sql`

3. **Buat user MySQL sesuai .env backend:**
   ```sql
   CREATE USER 'admin_user'@'localhost';
   CREATE USER 'vet_user'@'localhost';
   CREATE USER 'pawrent_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

4. **Isi data demo (opsional):**
   - Tambahkan minimal 1 admin, dokter, pawrent, hewan, dll.

---

## 2. Konfigurasi Backend

1. Masuk folder backend:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Edit file `.env` (sudah tersedia):
   - Pastikan user/password MySQL sesuai dengan user yang dibuat di atas.
   - Contoh:
     ```
     DB_HOST=localhost
     DB_NAME=vet_buddy
     DB_ADMIN_USER=admin_user
     DB_ADMIN_PASSWORD=
     DB_VET_USER=vet_user
     DB_VET_PASSWORD=
     DB_PAWRENT_USER=pawrent_user
     DB_PAWRENT_PASSWORD=
     JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
     PORT=3000
     ```

4. Jalankan backend (dev mode):
   ```bash
   npm run dev
   ```
   - Server berjalan di: [http://localhost:3000](http://localhost:3000)

---

## 3. Konfigurasi Frontend

1. Kembali ke root project:
   ```bash
   cd ..
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Pastikan file `.env` frontend sudah ada:
   ```
   VITE_API_BASE_URL=http://localhost:3000
   ```

4. Jalankan frontend:
   ```bash
   npm run dev
   ```
   - Web berjalan di: [http://localhost:8080](http://localhost:8080)

---

## 4. Akun Demo

- **Admin:**  
  username: `admin`  
  password: `password123`
- **Dokter:**  
  username: `siti`  
  password: `password123`
- **Pawrent:**  
  username: `pawrent1`  
  password: `password123`

---

## 5. Troubleshooting

- Jika gagal login, cek koneksi database dan user MySQL.
- Jika error permission, pastikan GRANT sudah dijalankan di SQL.
- Untuk reset password demo, gunakan script di `backend/scripts/update-passwords.js`.

---

## 6. Struktur Folder

- `src/` : Frontend React
- `backend/` : Backend Express
- `sql/` : Kumpulan file SQL schema, prosedur, trigger, grant

---

## 7. Kontribusi

Pull request & issue sangat diterima!  
Pastikan mengikuti format dan standar yang ada.

---

## License

MIT
