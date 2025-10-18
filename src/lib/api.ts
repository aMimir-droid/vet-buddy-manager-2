import { API_BASE_URL } from './config';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
}

export const authApi = {
  login: (username: string, password: string) => 
    apiCall({ 
      endpoint: '/auth/login', 
      method: 'POST', 
      body: { username, password } 
    }),
};

export const usersApi = {
  getAll: (token: string): Promise<any[]> => 
    apiCall({ endpoint: '/users', token }),
  getById: (id: number, token: string) => 
    apiCall({ endpoint: `/users/${id}`, token }),
  create: (data: any, token: string) => 
    apiCall({ endpoint: '/users', method: 'POST', body: data, token }),
  update: (id: number, data: any, token: string) => 
    apiCall({ endpoint: `/users/${id}`, method: 'PUT', body: data, token }),
  delete: (id: number, token: string) => 
    apiCall({ endpoint: `/users/${id}`, method: 'DELETE', token }),
};

export const dokterApi = {
  getAll: (token: string): Promise<any[]> => 
    apiCall({ endpoint: '/dokter', token }),
  getById: (id: number, token: string) => 
    apiCall({ endpoint: `/dokter/${id}`, token }),
  create: (data: any, token: string) => 
    apiCall({ endpoint: '/dokter', method: 'POST', body: data, token }),
  update: (id: number, data: any, token: string) => 
    apiCall({ endpoint: `/dokter/${id}`, method: 'PUT', body: data, token }),
  delete: (id: number, token: string) => 
    apiCall({ endpoint: `/dokter/${id}`, method: 'DELETE', token }),
};

export const pawrentApi = {
  getAll: (token: string): Promise<any[]> => 
    apiCall({ endpoint: '/pawrent', token }),
  getById: (id: number, token: string) => 
    apiCall({ endpoint: `/pawrent/${id}`, token }),
  create: (data: any, token: string) => 
    apiCall({ endpoint: '/pawrent', method: 'POST', body: data, token }),
  update: (id: number, data: any, token: string) => 
    apiCall({ endpoint: `/pawrent/${id}`, method: 'PUT', body: data, token }),
  delete: (id: number, token: string) => 
    apiCall({ endpoint: `/pawrent/${id}`, method: 'DELETE', token }),
};

export const hewanApi = {
  getAll: (token: string): Promise<any[]> => 
    apiCall({ endpoint: '/hewan', token }),
  getById: (id: number, token: string) => 
    apiCall({ endpoint: `/hewan/${id}`, token }),
  getByJenis: (jenisId: number, token: string) => 
    apiCall({ endpoint: `/hewan/jenis/${jenisId}`, token }),
  create: (data: any, token: string) => 
    apiCall({ endpoint: '/hewan', method: 'POST', body: data, token }),
  update: (id: number, data: any, token: string) => 
    apiCall({ endpoint: `/hewan/${id}`, method: 'PUT', body: data, token }),
  delete: (id: number, token: string) => 
    apiCall({ endpoint: `/hewan/${id}`, method: 'DELETE', token }),
};

export const kunjunganApi = {
  getAll: (token: string): Promise<any[]> => 
    apiCall({ endpoint: '/kunjungan', token }),
  getByDateRange: (startDate: string, endDate: string, token: string) => 
    apiCall({ endpoint: `/kunjungan/date-range?start_date=${startDate}&end_date=${endDate}`, token }),
  getByHewan: (hewanId: number, token: string) => 
    apiCall({ endpoint: `/kunjungan/hewan/${hewanId}`, token }),
  create: (data: any, token: string) => 
    apiCall({ endpoint: '/kunjungan', method: 'POST', body: data, token }),
  update: (id: number, data: any, token: string) => 
    apiCall({ endpoint: `/kunjungan/${id}`, method: 'PUT', body: data, token }),
  delete: (id: number, token: string) => 
    apiCall({ endpoint: `/kunjungan/${id}`, method: 'DELETE', token }),
};

export const obatApi = {
  getAll: (token: string): Promise<any[]> => 
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

export const klinikApi = {
  getAll: async (token: string): Promise<any[]> => {
    const response = await fetch(`${API_URL}/klinik`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch' }));
      throw new Error(error.message || 'Failed to fetch kliniks');
    }
    return response.json();
  },

  getById: async (id: number, token: string) => {
    const response = await fetch(`${API_URL}/klinik/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch klinik');
    return response.json();
  },

  create: async (data: any, token: string) => {
    const response = await fetch(`${API_URL}/klinik`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to create' }));
      throw new Error(error.message || 'Failed to create klinik');
    }
    return response.json();
  },

  update: async (id: number, data: any, token: string) => {
    const response = await fetch(`${API_URL}/klinik/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to update' }));
      throw new Error(error.message || 'Failed to update klinik');
    }
    return response.json();
  },

  delete: async (id: number, token: string) => {
    const response = await fetch(`${API_URL}/klinik/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to delete' }));
      throw new Error(error.message || 'Failed to delete klinik');
    }
    return response.json();
  },

  getDokters: async (id: number, token: string) => {
    const response = await fetch(`${API_URL}/klinik/${id}/dokters`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch clinic doctors');
    return response.json();
  },
};

export const dashboardApi = {
  getStats: (token: string) => 
    apiCall({ endpoint: '/dashboard/stats', token }),
};

export const auditlogApi = {
  getAll: async (token: string, params?: {
    start_date?: string;
    end_date?: string;
    table_name?: string;
    action_type?: string;
    executed_by?: string;
    limit?: number;
    offset?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const url = `${API_URL}/auditlog${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch audit logs');
    return response.json();
  },

  getStats: async (token: string) => {
    const response = await fetch(`${API_URL}/auditlog/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  },

  getByTable: async (token: string) => {
    const response = await fetch(`${API_URL}/auditlog/by-table`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch by table');
    return response.json();
  },

  getByUser: async (token: string) => {
    const response = await fetch(`${API_URL}/auditlog/by-user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch by user');
    return response.json();
  },

  getById: async (id: number, token: string) => {
    const response = await fetch(`${API_URL}/auditlog/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch log detail');
    return response.json();
  },
};
