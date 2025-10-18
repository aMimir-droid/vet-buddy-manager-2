// API configuration and utility functions
// This will connect to your MySQL backend API

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface ApiConfig {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  token?: string;
}

export async function apiCall<T>(config: ApiConfig): Promise<T> {
  const { endpoint, method = 'GET', body, token } = config;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Auth API
export const authApi = {
  login: (username: string, password: string) => 
    apiCall({ endpoint: '/auth/login', method: 'POST', body: { username, password } }),
  
  logout: (token: string) => 
    apiCall({ endpoint: '/auth/logout', method: 'POST', token }),
  
  getCurrentUser: (token: string) => 
    apiCall({ endpoint: '/auth/me', token }),
};

// CRUD API generators
export function createCrudApi<T>(resource: string) {
  return {
    getAll: (token: string) => 
      apiCall<T[]>({ endpoint: `/${resource}`, token }),
    
    getById: (id: number, token: string) => 
      apiCall<T>({ endpoint: `/${resource}/${id}`, token }),
    
    create: (data: Partial<T>, token: string) => 
      apiCall<T>({ endpoint: `/${resource}`, method: 'POST', body: data, token }),
    
    update: (id: number, data: Partial<T>, token: string) => 
      apiCall<T>({ endpoint: `/${resource}/${id}`, method: 'PUT', body: data, token }),
    
    delete: (id: number, token: string) => 
      apiCall<void>({ endpoint: `/${resource}/${id}`, method: 'DELETE', token }),
  };
}

// Stored Procedures API
export const storedProceduresApi = {
  getRiwayatKunjunganByHewan: (hewan_id: number, token: string) =>
    apiCall({ endpoint: `/procedures/riwayat-kunjungan/${hewan_id}`, token }),
  
  getHewanByJenis: (jenis_hewan_id: number, token: string) =>
    apiCall({ endpoint: `/procedures/hewan-by-jenis/${jenis_hewan_id}`, token }),
  
  getKunjunganByDateRange: (start_date: string, end_date: string, token: string) =>
    apiCall({ 
      endpoint: `/procedures/kunjungan-by-date?start=${start_date}&end=${end_date}`, 
      token 
    }),
};
