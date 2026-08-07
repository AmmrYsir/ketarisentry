import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AuthUser, UserRole } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoginModalOpen: boolean;
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

  useEffect(() => {
    const savedUser = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    } else {
      // Default to Sandbox Demo user on initial load for frictionless experience
      loginWithSandbox('admin');
    }
  }, []);

  const saveUserToState = (newUser: AuthUser | null) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newUser));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  };

  const loginWithSandbox = (role: UserRole = 'admin') => {
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
  };

  const loginWithGoogleToken = (credentialResponse: any) => {
    // Standard OAuth token payload parse (or JWT decode)
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
