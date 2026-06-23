'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, setCookie, deleteCookie, getCookie } from '@/lib/apiClient';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  roles: string[];
  permissions: string[];
  status: string;
  avatar?: string;
  dob?: string;
  pan_number?: string;
  aadhaar_number?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  last_login_at?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (loginVal: string, passwordVal: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = async () => {
    try {
      const token = getCookie('token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      
      const res = await apiFetch('/api/profile');
      if (res.success && res.user) {
        setUser(res.user);
      } else {
        deleteCookie('token');
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to load user profile:', err);
      deleteCookie('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (loginVal: string, passwordVal: string) => {
    try {
      const res = await apiFetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ login: loginVal, password: passwordVal }),
      });

      if (res.success && res.token && res.user) {
        setCookie('token', res.token);
        setUser(res.user);
        router.push('/dashboard');
        return { success: true, message: res.message || 'Login successful' };
      } else {
        return { success: false, message: res.message || 'Login failed' };
      }
    } catch (err: any) {
      return { success: false, message: err.message || 'An error occurred during login' };
    }
  };

  const logout = () => {
    deleteCookie('token');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
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
