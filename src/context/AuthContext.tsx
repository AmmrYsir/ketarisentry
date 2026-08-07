import React, { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { AuthUser, UserRole } from '../types';
import { syncUserLoginWithApi } from '../services/apiClient';
import { AuthContext } from './AuthContextObject';

const LOCAL_STORAGE_KEY = 'ketarisentry_auth_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // Determine environment mode from VITE_APP_ENV or Vite MODE
  const envMode = (
    import.meta.env.VITE_APP_ENV ||
    import.meta.env.MODE ||
    'development'
  ).toLowerCase().trim();
  const isProduction = envMode === 'production' || envMode === 'prod';
  const isSandboxAllowed = !isProduction;

  const saveUserToState = useCallback((newUser: AuthUser | null) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newUser));
      syncUserLoginWithApi(newUser);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, []);

  const loginWithSandbox = useCallback((role: UserRole = 'admin') => {
    if (!isSandboxAllowed) {
      alert('Sandbox Mode is disabled in production environment.');
      return;
    }

    const demoUser: AuthUser = {
      id: 'usr_sandbox_superadmin',
      name: 'System Superadmin',
      email: 'superadmin@ketarisentry.io',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Superadmin',
      role,
      email_verified: true,
      is_sandbox: true,
    };
    saveUserToState(demoUser);
    setIsLoginModalOpen(false);
  }, [isSandboxAllowed, saveUserToState]);

  useEffect(() => {
    const savedUser = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.is_sandbox && !isSandboxAllowed) {
          localStorage.removeItem(LOCAL_STORAGE_KEY);
          setUser(null);
          setIsLoginModalOpen(true);
        } else {
          setUser(parsed);
          setIsLoginModalOpen(false);
        }
      } catch {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        setUser(null);
        setIsLoginModalOpen(true);
      }
    } else {
      setUser(null);
      setIsLoginModalOpen(true);
    }
  }, [isSandboxAllowed]);

  const loginWithPassword = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        // Non-JSON body
      }

      if (res.ok && data.user) {
        saveUserToState(data.user);
        setIsLoginModalOpen(false);
        return { success: true };
      }
      return { success: false, error: data.error || `HTTP ${res.status}: ${res.statusText || 'Authentication failed'}` };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error / API server unreachable' };
    }
  };

  const loginWithMagicLink = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        // Non-JSON body
      }

      if (res.ok && data.user) {
        saveUserToState(data.user);
        setIsLoginModalOpen(false);
        return { success: true };
      }
      return { success: false, error: data.error || `HTTP ${res.status}: ${res.statusText || 'Magic link authorization failed'}` };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error / API server unreachable' };
    }
  };

  const logout = () => {
    saveUserToState(null);
    setIsLoginModalOpen(true);
  };

  const setUserRole = (role: UserRole) => {
    if (user) {
      const updated = { ...user, role };
      saveUserToState(updated);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoginModalOpen,
        isSandboxAllowed,
        isProduction,
        openLoginModal: () => setIsLoginModalOpen(true),
        closeLoginModal: () => setIsLoginModalOpen(false),
        loginWithSandbox,
        loginWithPassword,
        loginWithMagicLink,
        logout,
        setUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
