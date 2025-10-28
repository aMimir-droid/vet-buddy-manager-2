# Vet Buddy Manager 2

Sistem Manajemen Klinik Hewan Sahabat Satwa  
Frontend: React + TypeScript + Vite + Shadcn/UI + Tailwind CSS  
Backend: Node.js + Express + TypeScript + MySQL + Stored Procedures  
Package Managers: npm / pnpm / bun (sesuai preferensi)

## Fitur Utama

- **Manajemen User**: Admin, Dokter (Vet), Pawrent dengan hak akses berbasis role
- **CRUD Lengkap**: Kunjungan, Hewan, Obat, Layanan, Klinik, Booking, Stok Obat
- **Dashboard & Statistik**: Analytics untuk admin, vet, dan pawrent
- **Audit Log**: Tracking perubahan data untuk compliance
- **Riwayat Medis**: Rekam medis lengkap dengan layanan dan resep obat
- **Booking System**: Janji temu online dengan notifikasi
- **Multi-Klinik Support**: Admin klinik dapat mengelola klinik masing-masing
- **Responsive UI**: Antarmuka modern dengan dark mode support

---

## 1. Persiapan Database

1. **Install MySQL** (versi 8.0+) dan buat database baru:
   ```sql
   CREATE DATABASE vet_buddy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. **Import schema dan prosedur** (jalankan secara berurutan):
   - `sql/complete_schema.sql` - Schema database utama
   - `sql/Admin_HakAkses.sql` - Konfigurasi akses role
   - `sql/Admin_StoredProcedure_*.sql` - Semua stored procedures
   - `sql/Admin_Trigger.sql` - Database triggers
   - `sql/Admin_GrantTables.sql` - Hak akses tabel
   - `sql/Admin_GrantExecute.sql` - Hak eksekusi procedures


3. **Isi data demo** (opsional, untuk testing):
   - Gunakan data yang ada di `sql/seed_data.sql`
   - atau Tambahkan minimal 1 admin, 1 dokter, 1 pawrent, beberapa hewan, dan data master lainnya
   

---

## 2. Konfigurasi Backend

1. Masuk folder backend:
   ```bash
   cd backend
   ```

2. Install dependencies (pilih salah satu package manager):
   ```bash
   # npm
   npm install
   
   # atau pnpm
   pnpm install
   
   # atau bun
   bun install
   ```

3. Konfigurasi environment (file `.env` sudah tersedia):
   ```env
   DB_HOST=localhost
   DB_NAME=vet_buddy
   DB_ADMIN_USER=admin_user
   DB_ADMIN_PASSWORD=your_admin_password
   DB_VET_USER=vet_user
   DB_VET_PASSWORD=your_vet_password
   DB_PAWRENT_USER=pawrent_user
   DB_PAWRENT_PASSWORD=your_pawrent_password
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   PORT=3000
   NODE_ENV=development
   ```

4. Jalankan backend:
   ```bash
   # npm
   npm run dev
   
   # atau pnpm
   pnpm run dev
   
   # atau bun
   bun run dev
   ```
   - Server berjalan di: [http://localhost:3000](http://localhost:3000)
   - API documentation tersedia di endpoint `/api/docs` (jika menggunakan Swagger)

---

## 3. Konfigurasi Frontend

1. Kembali ke root project:
   ```bash
   cd ..
   ```

2. Install dependencies (pilih salah satu package manager):
   ```bash
   # npm
   npm install
   
   # atau pnpm
   pnpm install
   
   # atau bun
   bun install
   ```

3. Pastikan file `.env` frontend sudah ada:
   ```env
   VITE_API_BASE_URL=http://localhost:3000
   ```

4. Jalankan frontend:
   ```bash
   # npm
   npm run dev
   
   # atau pnpm
   pnpm run dev
   
   # atau bun
   bun run dev
   ```
   - Web berjalan di: [http://localhost:8080](http://localhost:8080)

---

## 4. Akun Demo

- **Admin Sistem**:  
  username: `admin`  
  password: `password123`
- **Admin klinik 1 (contoh)**:  
  username: `admin_klinik1`  
  password: `password123`
- **Dokter/Vet**:  
  username: `siti`  
  password: `password123`
- **Pawrent**:  
  username: `pawrent1`  
  password: `password123`

---

## 5. Testing & Development

- **Unit Tests**: Jalankan `npm test` di folder frontend/backend
- **Linting**: `npm run lint` untuk memeriksa kode
- **Build Production**: `npm run build` untuk frontend, `npm run build` untuk backend
- **Database Migration**: Gunakan script di `backend/scripts/` untuk update schema

---

## 6. Troubleshooting

- **Gagal Login**: Periksa koneksi database dan kredensial MySQL
- **Error Permission**: Pastikan semua GRANT SQL sudah dijalankan
- **Port Conflict**: Ubah PORT di `.env` jika 3000/8080 sudah digunakan
- **Reset Password Demo**: Jalankan `node backend/scripts/update-passwords.js`
- **CORS Issues**: Pastikan VITE_API_BASE_URL mengarah ke backend yang benar
- **Database Connection**: Periksa konfigurasi DB_* di `.env` backend

---

## 7. Struktur Folder

```
vet-buddy-manager-2/
├── src/                    # Frontend React/TypeScript
│   ├── components/         # Komponen UI reusable
│   ├── contexts/           # React contexts (Auth, dll)
│   ├── lib/                # Utilities dan API calls
│   ├── pages/              # Halaman per role (admin/, vet/, pawrent/)
│   └── ...
├── backend/                # Backend Node.js/Express
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── middleware/     # Auth, validation, dll
│   │   └── ...
│   ├── scripts/            # Utility scripts
│   └── ...
├── sql/                    # Database files
│   ├── complete_schema.sql
│   ├── Admin_StoredProcedure_*.sql
│   └── ...
├── public/                 # Static assets
├── components.json         # Shadcn/UI config
├── tailwind.config.ts      # Tailwind CSS config
├── vite.config.ts          # Vite config
├── tsconfig*.json          # TypeScript configs
└── package.json            # Dependencies dan scripts
```

---

## 8. Teknologi & Dependencies

### Frontend
- **React 18** dengan hooks dan functional components
- **TypeScript** untuk type safety
- **Vite** sebagai build tool
- **Shadcn/UI + Tailwind CSS** untuk styling
- **React Query** untuk state management dan API calls
- **React Router** untuk routing
- **Lucide React** untuk icons
- **Sonner** untuk toast notifications

### Backend
- **Node.js + Express** sebagai web framework
- **TypeScript** untuk type safety
- **MySQL2** untuk database connection
- **JWT** untuk authentication
- **bcrypt** untuk password hashing
- **CORS** untuk cross-origin requests

### Database
- **MySQL 8.0+** dengan stored procedures
- **Connection pooling** berdasarkan role user
- **Soft delete** dengan `deleted_at`
- **Audit logging** untuk tracking changes

---

## 9. Kontribusi

1. Fork repository ini
2. Buat branch fitur baru (`git checkout -b feature/nama-fitur`)
3. Commit perubahan (`git commit -m 'Add some feature'`)
4. Push ke branch (`git push origin feature/nama-fitur`)
5. Buat Pull Request

**Panduan Kontribusi:**
- Ikuti conventional commits
- Pastikan semua tests pass
- Update dokumentasi jika diperlukan
- Gunakan TypeScript dengan strict mode
- Ikuti ESLint rules

---

## 10. License

MIT License - lihat file [LICENSE](LICENSE) untuk detail lebih lanjut

---

## 11. Support

Jika ada pertanyaan atau issues:
- Buat issue di GitHub repository ini
- Pastikan menyertakan error logs dan langkah reproduksi
- Untuk pertanyaan umum, lihat dokumentasi API di backend

**Happy coding! 🐾**
