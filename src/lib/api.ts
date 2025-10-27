import { API_BASE_URL } from './config';

export interface ApiConfig {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  token?: string;
  isPublic?: boolean;
}

export async function apiCall<T>(config: ApiConfig): Promise<T> {
  const { endpoint, method = 'GET', body, token, isPublic = false } = config;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token && !isPublic) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}/api${endpoint}`;
  
  console.log(`📡 API Call: ${method} ${url}`);

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ API Response: ${method} ${url}`, data);
    return data;
  } catch (error: any) {
    console.error(`❌ API Error: ${method} ${url}`, error);
    throw error;
  }
}

// ========================================================
// AUTH API
// ========================================================
export const authApi = {
  login: (username: string, password: string) => 
    apiCall({ 
      endpoint: '/auth/login', 
      method: 'POST', 
      body: { username, password },
      isPublic: true
    }),

  register: (data: {
    username: string;
    email: string;
    password: string;
    role_id: number;
    pawrent_data?: {
      nama_depan_pawrent: string;
      nama_belakang_pawrent: string;
      alamat_pawrent: string;
      kota_pawrent: string;
      kode_pos_pawrent: string;
      nomor_hp: string;
      dokter_id: number;
    };
    dokter_data?: {
      title_dokter: string;
      nama_dokter: string;
      telepon_dokter: string;
      tanggal_mulai_kerja: string;
      spesialisasi_id: number;
      klinik_id: number;
    };
  }) =>
    apiCall({
      endpoint: '/auth/register',
      method: 'POST',
      body: data,
      isPublic: true
    }),

  checkUsername: (username: string) =>
    apiCall<{ available: boolean }>({
      endpoint: '/auth/check-username',
      method: 'POST',
      body: { username },
      isPublic: true
    }),

  checkEmail: (email: string) =>
    apiCall<{ available: boolean }>({
      endpoint: '/auth/check-email',
      method: 'POST',
      body: { email },
      isPublic: true
    }),

  getPublicDokters: () =>
    apiCall({
      endpoint: '/auth/public/dokters',
      method: 'GET',
      isPublic: true
    }),

  getPublicKliniks: () =>
    apiCall({
      endpoint: '/auth/public/kliniks',
      method: 'GET',
      isPublic: true
    }),

  getPublicSpesialisasi: () =>
    apiCall({
      endpoint: '/auth/public/spesialisasi',
      method: 'GET',
      isPublic: true
    }),
};

// ========================================================
// USERS API
// ========================================================
export const usersApi = {
  getAll: (token: string) => 
    apiCall({ endpoint: '/users', token }),
  
  getById: (id: number, token: string) => 
    apiCall({ endpoint: `/users/${id}`, token }),
  
  create: (data: any, token: string) => 
    apiCall({ endpoint: '/users', method: 'POST', body: data, token }),
  
  update: (id: number, data: any, token: string) => 
    apiCall({ endpoint: `/users/${id}`, method: 'PUT', body: data, token }),
  
  delete: (id: number, token: string) => 
    apiCall({ endpoint: `/users/${id}`, method: 'DELETE', token }),

  getRoles: (token: string) =>
    apiCall({ endpoint: '/users/roles', token }),
};

// ========================================================
// DOKTER API
// ========================================================
export const dokterApi = {
  getAll: (token: string) => 
    apiCall({ endpoint: '/dokter', token }),
  
  getById: (id: number, token: string) => 
    apiCall({ endpoint: `/dokter/${id}`, token }),
  
  create: (data: any, token: string) => 
    apiCall({ endpoint: '/dokter', method: 'POST', body: data, token }),
  
  update: (id: number, data: any, token: string) => 
    apiCall({ endpoint: `/dokter/${id}`, method: 'PUT', body: data, token }),
  
  delete: (id: number, token: string) => 
    apiCall({ endpoint: `/dokter/${id}`, method: 'DELETE', token }),

  getSpesialisasi: (token: string) =>
    apiCall({ endpoint: '/dokter/spesialisasi/list', token }),

  getKlinikList: async (token: string) => {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/klinik/vet/list`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Gagal mengambil data klinik");
    return res.json();
  },
};

// ========================================================
// PAWRENT API
// ========================================================
export const pawrentApi = {
  getAll: (token: string) => 
    apiCall({ endpoint: '/pawrent', token }),
  
  getById: (id: number, token: string) => 
    apiCall({ endpoint: `/pawrent/${id}`, token }),
  
  create: (data: any, token: string) => 
    apiCall({ endpoint: '/pawrent', method: 'POST', body: data, token }),
  
  update: (id: number, data: any, token: string) => 
    apiCall({ endpoint: `/pawrent/${id}`, method: 'PUT', body: data, token }),
  
  // NEW: Update self (pawrent update own profile)
  updateSelf: (data: any, token: string) =>
    apiCall({ endpoint: '/pawrent/my/profile', method: 'PUT', body: data, token }),
  
  delete: (id: number, token: string) => 
    apiCall({ endpoint: `/pawrent/${id}`, method: 'DELETE', token }),
};

// ========================================================
// HEWAN API
// ========================================================
export const hewanApi = {
  getAll: (token: string) => 
    apiCall({ endpoint: '/hewan', token }),
  
  getById: (id: number, token: string) => 
    apiCall({ endpoint: `/hewan/${id}`, token }),
  
  create: (data: any, token: string) => 
    apiCall({ endpoint: '/hewan', method: 'POST', body: data, token }),
  
  createMy: (data: any, token: string) =>
    apiCall({ endpoint: '/hewan/my', method: 'POST', body: data, token }),
  
  update: (id: number, data: any, token: string) => 
    apiCall({ endpoint: `/hewan/${id}`, method: 'PUT', body: data, token }),
  
  updateMy: (id: number, data: any, token: string) =>
    apiCall({ endpoint: `/hewan/my/${id}`, method: 'PUT', body: data, token }),
  
  delete: (id: number, token: string) => 
    apiCall({ endpoint: `/hewan/${id}`, method: 'DELETE', token }),
  
  // NEW: Delete hewan by pawrent (only their own)
  deleteMy: (id: number, token: string) =>
    apiCall({ endpoint: `/hewan/my/${id}`, method: 'DELETE', token }),

  getJenisHewan: (token: string) =>
    apiCall({ endpoint: '/hewan/jenis/list', token }),

  getByPawrent: (pawrentId: string, token: string) =>
    apiCall({ endpoint: `/hewan/by-pawrent/${pawrentId}`, token }),
};

// ========================================================
// KUNJUNGAN API
// ========================================================
export const kunjunganApi = {
  getAll: (token: string) => 
    apiCall({ endpoint: '/kunjungan', token }),
  
  getById: (id: number, token: string) => 
    apiCall({ endpoint: `/kunjungan/${id}`, token }),
  
  create: (data: {
    hewan_id: string;
    dokter_id: string;
    tanggal_kunjungan: string;
    waktu_kunjungan: string;
    catatan?: string;
    metode_pembayaran: string;
    kunjungan_sebelumnya?: number | null;
    booking_id?: number | null; // Tambahkan
  }, token: string) => 
    apiCall({ endpoint: '/kunjungan', method: 'POST', body: data, token }),
  
  update: (id: number, data: {
    hewan_id: string;
    dokter_id: string;
    tanggal_kunjungan: string;
    waktu_kunjungan: string;
    catatan?: string;
    metode_pembayaran: string;
    kunjungan_sebelumnya?: number | null;
    booking_id?: number | null; // Tambahkan
  }, token: string) => 
    apiCall({ endpoint: `/kunjungan/${id}`, method: 'PUT', body: data, token }),
  
  delete: (id: number, token: string) => 
    apiCall({ endpoint: `/kunjungan/${id}`, method: 'DELETE', token }),

  getHewanHistory: (hewanId: number, token: string) =>
    apiCall({ endpoint: `/kunjungan/hewan/${hewanId}/history`, token }),
};

// ========================================================
// OBAT API
// ========================================================
export const obatApi = {
  getAll: (token: string) => 
    apiCall({ endpoint: '/obat', token }),
  
  getById: (id: number, token: string) => 
    apiCall({ endpoint: `/obat/${id}`, token }),
  
  create: (data: any, token: string) => 
    apiCall({ endpoint: '/obat', method: 'POST', body: data, token }),
  
  update: (id: number, data: any, token: string) => 
    apiCall({ endpoint: `/obat/${id}`, method: 'PUT', body: data, token }),
  
  delete: (id: number, token: string) => 
    apiCall({ endpoint: `/obat/${id}`, method: 'DELETE', token }),
};

// ========================================================
// KLINIK API
// ========================================================
export const klinikApi = {
  getAll: (token: string) => 
    apiCall({ endpoint: '/klinik', token }),
  
  getById: (id: number, token: string) => 
    apiCall({ endpoint: `/klinik/${id}`, token }),
  
  create: (data: any, token: string) => 
    apiCall({ endpoint: '/klinik', method: 'POST', body: data, token }),
  
  update: (id: number, data: any, token: string) => 
    apiCall({ endpoint: `/klinik/${id}`, method: 'PUT', body: data, token }),
  
  delete: (id: number, token: string) => 
    apiCall({ endpoint: `/klinik/${id}`, method: 'DELETE', token }),

  getDoktersByKlinik: (klinikId: number, token: string) =>
    apiCall({ endpoint: `/klinik/${klinikId}/dokters`, token }),
};

// ========================================================
// LAYANAN API
// ========================================================
export const layananApi = {
  getAll: (token: string) => 
    apiCall({ endpoint: '/layanan', token }),
  
  getByKode: (kode: string, token: string) => 
    apiCall({ endpoint: `/layanan/${kode}`, token }),
  
  create: (data: any, token: string) => 
    apiCall({ endpoint: '/layanan', method: 'POST', body: data, token }),
  
  update: (kode: string, data: any, token: string) => 
    apiCall({ endpoint: `/layanan/${kode}`, method: 'PUT', body: data, token }),
  
  delete: (kode: string, token: string) => 
    apiCall({ endpoint: `/layanan/${kode}`, method: 'DELETE', token }),
};

// ========================================================
// KUNJUNGAN OBAT API
// ========================================================
export const kunjunganObatApi = {
  getByKunjungan: (kunjunganId: number, token: string) =>
    apiCall({ endpoint: `/kunjungan-obat/kunjungan/${kunjunganId}`, token }),

  create: (data: any, token: string) =>
    apiCall({ endpoint: '/kunjungan-obat', method: 'POST', body: data, token }),

  update: (kunjunganId: number, obatId: number, data: any, token: string) =>
    apiCall({ 
      endpoint: `/kunjungan-obat/${kunjunganId}/${obatId}`, 
      method: 'PUT', 
      body: data, 
      token 
    }),

  delete: (kunjunganId: number, obatId: number, token: string) =>
    apiCall({ 
      endpoint: `/kunjungan-obat/${kunjunganId}/${obatId}`, 
      method: 'DELETE', 
      token 
    }),
};

// ========================================================
// DASHBOARD API
// ========================================================
export const dashboardApi = {
  getStats: (token: string) =>
    apiCall({ endpoint: '/dashboard/stats', token }),
};

// ========================================================
// AUDIT LOG API
// ========================================================
export const auditLogApi = {
  getAll: (params: any, token: string) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall({ endpoint: `/auditlog?${queryString}`, token });
  },

  getStats: (token: string) =>
    apiCall({ endpoint: '/auditlog/stats', token }),

  getByTable: (tableName: string, token: string) =>
    apiCall({ endpoint: `/auditlog/by-table?table=${tableName}`, token }),

  getByUser: (userId: number, token: string) =>
    apiCall({ endpoint: `/auditlog/by-user?user=${userId}`, token }),

  getById: (id: number, token: string) =>
    apiCall({ endpoint: `/auditlog/${id}`, token }),
};

// ========================================================
// JENIS HEWAN API
// ========================================================
export const jenisHewanApi = {
  getAll: (token: string) =>
    apiCall({ endpoint: '/jenis-hewan', token }),
  create: (data: any, token: string) =>
    apiCall({ endpoint: '/jenis-hewan', method: 'POST', body: data, token }),
  update: (id: number, data: any, token: string) =>
    apiCall({ endpoint: `/jenis-hewan/${id}`, method: 'PUT', body: data, token }),
  delete: (id: number, token: string) =>
    apiCall({ endpoint: `/jenis-hewan/${id}`, method: 'DELETE', token }),
};

export const getDoktersByKlinik = async (klinikId: number, token: string) => {
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/klinik/${klinikId}/dokters`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Gagal mengambil data dokter");
  return res.json();
};

// ========================================================
// BOOKING API
// ========================================================
export const bookingApi = {
  getById: (id: number, token?: string) =>
    apiCall({ endpoint: `/booking/${id}`, token }),
  getByDokter: (dokterId: number, token?: string) =>
    apiCall({ endpoint: `/booking/dokter/${dokterId}`, token }),
  getMy: (token: string) =>
    apiCall({ endpoint: '/booking/my', token }),
  create: (data: any, token: string) =>
    apiCall({ endpoint: '/booking', method: 'POST', body: data, token }),
  update: (id: number, data: any, token: string) =>
    apiCall({ endpoint: `/booking/${id}`, method: 'PUT', body: data, token }),
  delete: (id: number, token: string) =>
    apiCall({ endpoint: `/booking/${id}`, method: 'DELETE', token }),

  // PERBAIKI: Get available slots for a dokter on a date - gunakan apiCall
  getAvailable: (dokterId: number, date: string, token: string) =>
    apiCall<{ availableSlots: string[] }>({
      endpoint: `/booking/available?dokterId=${dokterId}&date=${date}`,
      token
    }),

  // TAMBAHKAN: Query untuk semua bookings (gunakan apiCall)
  getAll: (token: string) =>
    apiCall({ endpoint: '/booking/all', token }),
};

// ========================================================
// SHIFT DOKTER API
// ========================================================
export const shiftDokterApi = {
  getAll: (token: string) => apiCall({ endpoint: '/shift-dokter', token }),
  getPublicList: (token: string) => apiCall({ endpoint: '/shift-dokter/public/list', token }),
  getById: (id: number, token: string) => apiCall({ endpoint: `/shift-dokter/${id}`, token }),
  create: (data: { dokter_id: number; hari_minggu: number; jam_mulai: string; jam_selesai: string; is_active?: boolean }, token: string) =>
    apiCall({ endpoint: '/shift-dokter', method: 'POST', body: data, token }),
  update: (id: number, data: { dokter_id: number; hari_minggu: number; jam_mulai: string; jam_selesai: string; is_active?: boolean }, token: string) =>
    apiCall({ endpoint: `/shift-dokter/${id}`, method: 'PUT', body: data, token }),
  delete: (id: number, token: string) => apiCall({ endpoint: `/shift-dokter/${id}`, method: 'DELETE', token }),
  getByDokter: (dokterId: number, token: string) =>
    apiCall({ endpoint: `/shift-dokter/by-dokter/${dokterId}`, token }),
};