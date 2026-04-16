// Auth context — manage authentication state
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User, AuthTokens } from '../types';
import { api, setTokens, getAuthToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, captchaToken?: string, captchaAnswer?: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updateAvatar: (file: File) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message?: string; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user on mount if token exists
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      api.get<{ user: User }>('/users/me/profile')
        .then(res => {
          if (res.success && res.data) {
            setUser(res.data.user);
          }
        })
        .catch(() => {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string, captchaToken?: string, captchaAnswer?: string) => {
    const res = await api.post<{ user: User; tokens: AuthTokens }>('/auth/login', {
      email,
      password,
      captchaToken,
      captchaAnswer,
    });
    if (res.success && res.data) {
      setTokens(res.data.tokens);
      setUser(res.data.user);
    } else {
      throw new Error(res.error || 'Login failed');
    }
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    const res = await api.post<{ user: User; tokens: AuthTokens }>('/auth/register', {
      username,
      email,
      password,
    });
    if (res.success && res.data) {
      setTokens(res.data.tokens);
      setUser(res.data.user);
    } else {
      throw new Error(res.error || 'Registration failed');
    }
  }, []);

  const logout = useCallback(() => {
    api.post('/auth/logout', {}).catch(() => {});
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    const res = await api.put<{ user: User }>('/users/me/profile', data);
    if (res.success && res.data) {
      setUser(res.data.user);
    }
  }, []);

  const updateAvatar = useCallback(async (file: File) => {
    console.log('updateAvatar called:', file.name, file.size, file.type);
    const formData = new FormData();
    formData.append('avatar', file);

    const token = getAuthToken();
    console.log('updateAvatar: token exists?', !!token);

    try {
      const response = await fetch('/api/users/me/avatar', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      console.log('upload response status:', response.status);
      const text = await response.text();
      console.log('upload response body:', text);

      if (!response.ok) {
        return false;
      }

      const data = JSON.parse(text);
      if (data.success && data.data) {
        setUser(data.data);
        return true;
      }
      console.error('Upload response:', data);
      return false;
    } catch (err) {
      console.error('updateAvatar fetch error:', err);
      return false;
    }
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const res = await api.put('/users/me/password', { currentPassword, newPassword });
    return { success: res.success, message: res.message, error: res.error };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        updateAvatar,
        changePassword,
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
