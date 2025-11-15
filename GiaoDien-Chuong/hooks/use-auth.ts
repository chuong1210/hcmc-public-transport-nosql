import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { User } from '@/types';
import { deleteCookie, setCookie } from '@/lib/cookies';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      setLoading(false);
      router.push('/login');
      return;
    }

    try {
      const response = await api.getCurrentUser();
      if (response.success) {
        setUser(response.data);
      }
    } catch (error) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
          deleteCookie("access_token", {
            secure: process.env.NODE_ENV === "production",
          });
          deleteCookie("refresh_token", {
            secure: process.env.NODE_ENV === "production",
          });
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    const response = await api.login({ username, password });
    if (response.success) {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);

              setCookie("access_token", response.data.access_token, 0.01, {
                secure: process.env.NODE_ENV === "production",
              });
              // Refresh token: dài hạn (7 ngày)
              setCookie("refresh_token", response.data.refresh_token, 7, {
                secure: process.env.NODE_ENV === "production",
              });
      setUser(response.data.user);
      router.push('/dashboard');
    }
    return response;
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
          deleteCookie("access_token", {
      secure: process.env.NODE_ENV === "production",
    });
    deleteCookie("refresh_token", {
      secure: process.env.NODE_ENV === "production",
    });
      setUser(null);
      router.push('/login');
    }
  };

  return { user, loading, login, logout };
}