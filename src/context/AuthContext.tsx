import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { AuthUser, UserRole } from '../types';
import { syncUserLoginWithApi } from '../services/apiClient';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoginModalOpen: boolean;
  isSandboxAllowed: boolean;
  isProduction: boolean;
  googleClientId: string | null;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  loginWithSandbox: (role?: UserRole) => void;
  loginWithGoogleToken: (credentialResponse: any) => void;
  logout: () => void;
  setUserRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'ketarisentry_auth_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || null;

  // Determine environment mode
  const envMode = (import.meta.env.VITE_NODE_ENV || import.meta.env.MODE || 'development').toLowerCase();
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
      id: 'usr_sandbox_99',
      name: 'Ammar (Demo Admin)',
      email: 'ammar.dev@ketarisentry.io',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      role,
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
        }
      } catch {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        if (!isSandboxAllowed) setIsLoginModalOpen(true);
      }
    } else {
      if (isSandboxAllowed) {
        loginWithSandbox('admin');
      } else {
        setIsLoginModalOpen(true);
      }
    }
  }, [isSandboxAllowed, loginWithSandbox]);

  const loginWithGoogleToken = (credentialResponse: any) => {
    let email = 'user@google.com';
    let name = 'Google User';
    let avatar = 'https://lh3.googleusercontent.com/a/default-user';

    try {
      if (credentialResponse?.credential) {
        const base64Url = credentialResponse.credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const payload = JSON.parse(jsonPayload);
        email = payload.email || email;
        name = payload.name || name;
        avatar = payload.picture || avatar;
      }
    } catch {
      // Fallback
    }

    const domain = email.split('@')[1];
    const allowedDomainsStr = import.meta.env.VITE_ALLOWED_DOMAINS || '';
    if (allowedDomainsStr) {
      const allowedDomains = allowedDomainsStr.split(',').map((d: string) => d.trim().toLowerCase());
      if (domain && !allowedDomains.includes(domain.toLowerCase())) {
        alert(`Access denied. Login is restricted to domains: ${allowedDomainsStr}`);
        return;
      }
    }

    const googleUser: AuthUser = {
      id: `usr_g_${Date.now()}`,
      name,
      email,
      avatar,
      domain,
      role: 'admin',
      is_sandbox: false,
    };

    saveUserToState(googleUser);
    setIsLoginModalOpen(false);
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
        googleClientId,
        openLoginModal: () => setIsLoginModalOpen(true),
        closeLoginModal: () => setIsLoginModalOpen(false),
        loginWithSandbox,
        loginWithGoogleToken,
        logout,
        setUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
