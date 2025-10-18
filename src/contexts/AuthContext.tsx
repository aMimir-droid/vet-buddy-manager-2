import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserLogin } from '@/types/database';

interface AuthContextType {
  user: UserLogin | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isVet: boolean;
  isPawrent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserLogin | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Check for stored auth on mount
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (username: string, password: string) => {
    try {
      // For demo purposes, we'll use mock authentication
      // Replace this with actual API call to your MySQL backend
      
      // Mock users for demonstration
      const mockUsers: Record<string, UserLogin> = {
        admin: {
          user_id: 1,
          username: 'admin',
          email: 'admin@hewania.com',
          password_hash: '',
          role_id: 1,
          db_user: 'admin_user',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        'drh.budi': {
          user_id: 2,
          username: 'drh.budi',
          email: 'budi@hewania.com',
          password_hash: '',
          role_id: 2,
          db_user: 'vet_user',
          is_active: true,
          dokter_id: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        pawrent1: {
          user_id: 3,
          username: 'pawrent1',
          email: 'pawrent1@example.com',
          password_hash: '',
          role_id: 3,
          db_user: 'pawrent_user',
          is_active: true,
          pawrent_id: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };

      // Simple mock authentication (password: password123 for all)
      if (mockUsers[username] && password === 'password123') {
        const mockToken = `mock_token_${username}_${Date.now()}`;
        const userData = mockUsers[username];
        
        setToken(mockToken);
        setUser(userData);
        
        localStorage.setItem('auth_token', mockToken);
        localStorage.setItem('auth_user', JSON.stringify(userData));
      } else {
        throw new Error('Username atau password salah');
      }
      
      // When you connect to real backend, use this:
      // const response = await authApi.login(username, password);
      // setToken(response.token);
      // setUser(response.user);
      // localStorage.setItem('auth_token', response.token);
      // localStorage.setItem('auth_user', JSON.stringify(response.user));
      
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  const isAuthenticated = !!user && !!token;
  const isAdmin = user?.role_id === 1;
  const isVet = user?.role_id === 2;
  const isPawrent = user?.role_id === 3;

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        token, 
        login, 
        logout, 
        isAuthenticated,
        isAdmin,
        isVet,
        isPawrent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
