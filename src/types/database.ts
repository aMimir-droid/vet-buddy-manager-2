// Database types based on MySQL schema
export interface Role {
  role_id: number;
  role_name: 'admin' | 'vet' | 'pawrent';
  role_description?: string;
  created_at: string;
}

export interface UserLogin {
  user_id: number;
  username: string;
  email: string;
  password_hash: string;
  role_id: number;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  dokter_id?: number;
  pawrent_id?: number;
}

export interface Klinik {
  klinik_id: number;
  nama_klinik: string;
  alamat_klinik: string;
  telepon_klinik?: string;
}

export interface Spesialisasi {
  spesialisasi_id: number;
  nama_spesialisasi: string;
  deskripsi_spesialisasi?: string;
}

export interface Dokter {
  dokter_id: number;
  title_dokter: string;
  nama_dokter: string;
  telepon_dokter?: string;
  tanggal_mulai_kerja?: string;
  spesialisasi_id?: number;
  klinik_id?: number;
  nama_spesialisasi?: string;
  nama_klinik?: string;
}

export interface Pawrent {
  pawrent_id: number;
  nama_depan_pawrent: string;
  nama_belakang_pawrent: string;
  alamat_pawrent?: string;
  kota_pawrent?: string;
  kode_pos_pawrent?: string;
  dokter_id: number;
  nomor_hp?: string;
  nama_dokter?: string;
}

export interface JenisHewan {
  jenis_hewan_id: number;
  nama_jenis_hewan: string;
  deskripsi_jenis_hewan?: string;
}

export interface Hewan {
  hewan_id: number;
  nama_hewan: string;
  tanggal_lahir?: string;
  jenis_kelamin?: 'Jantan' | 'Betina';
  status_hidup: 'Hidup' | 'Mati';
  jenis_hewan_id: number;
  pawrent_id: number;
  nama_jenis_hewan?: string;
  nama_pawrent?: string;
}

export interface Kunjungan {
  kunjungan_id: number;
  hewan_id: number;
  dokter_id: number;
  tanggal_kunjungan: string;
  waktu_kunjungan: string;
  catatan?: string;
  total_biaya: number;
  metode_pembayaran: 'Cash' | 'Transfer' | 'E-Wallet';
  kunjungan_sebelumnya?: number;
  nama_hewan?: string;
  nama_dokter?: string;
  nama_pawrent?: string;
}

export interface DetailLayanan {
  kode_layanan: string;
  nama_layanan: string;
  deskripsi_layanan?: string;
  biaya_layanan: number;
}

export interface Layanan {
  kode_layanan: string;
  kunjungan_id: number;
}

export interface Obat {
  obat_id: number;
  nama_obat: string;
  kegunaan?: string;
  harga_obat: number;
}

export interface KunjunganObat {
  kunjungan_id: number;
  obat_id: number;
  dosis?: string;
  frekuensi?: string;
  nama_obat?: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Stored Procedure Response Types
export interface RiwayatKunjungan {
  ID_Kunjungan: number;
  Tanggal: string;
  Dokter: string;
  Diagnosa?: string;
}

export interface HewanByJenis {
  Nama_Hewan: string;
  Nama_Pemilik: string;
}

export interface KunjunganByDateRange {
  ID_Kunjungan: number;
  Tanggal_Kunjungan: string;
  Nama_Hewan: string;
  Nama_Pemilik: string;
  Nama_Dokter: string;
}

export interface AdminKlinik {
  admin_klinik_id: number;
  user_id: number;
  klinik_id: number;
  created_at: string;
  updated_at: string;
}
