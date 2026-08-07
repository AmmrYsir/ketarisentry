import { createContext } from 'react';
import type { AuthUser, UserRole } from '../types';

export interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoginModalOpen: boolean;
  isSandboxAllowed: boolean;
  isProduction: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  loginWithSandbox: (role?: UserRole) => void;
  loginWithPassword: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithMagicLink: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setUserRole: (role: UserRole) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
