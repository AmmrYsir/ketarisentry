import React from 'react';
import { X, Shield, Lock, UserCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, closeLoginModal, loginWithSandbox, googleClientId } = useAuth();

  if (!isLoginModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-[8px_8px_32px_rgba(0,0,0,0.8)] relative text-center">
        
        <button
          onClick={closeLoginModal}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Icon */}
        <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-emerald-500 to-indigo-600 p-0.5 mx-auto mb-4 shadow-[4px_4px_12px_rgba(0,0,0,0.4)]">
          <div className="w-full h-full bg-slate-900 rounded-[22px] flex items-center justify-center">
            <Shield className="w-7 h-7 text-emerald-400" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-100 mb-1">Welcome to KetariSentry</h2>
        <p className="text-xs text-slate-400 mb-6">Central Health & Queue Telemetry Dashboard</p>

        {/* Google OAuth Login Button */}
        <div className="mb-6 space-y-3">
          <button
            onClick={() => {
              // Simulated Google Login trigger when client ID is active or sandbox mode fallback
              loginWithSandbox('admin');
            }}
            className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center space-x-3 transition-all shadow-[4px_4px_10px_rgba(0,0,0,0.2)] active:scale-[0.98]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.23v3.15C3.21 21.32 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.23C.44 8.15 0 9.99 0 12s.44 3.85 1.23 5.42l4.05-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.21 2.68 1.23 6.58l4.05 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Sign in with Google</span>
          </button>

          {!googleClientId && (
            <p className="text-[11px] text-slate-400 flex items-center justify-center space-x-1">
              <AlertCircle className="w-3 h-3 text-amber-400" />
              <span>VITE_GOOGLE_CLIENT_ID not set. Sandbox Mode ready below.</span>
            </p>
          )}
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
            <span className="bg-slate-900 px-3 text-slate-400">Or Offline Demo Sandbox</span>
          </div>
        </div>

        {/* Demo Roles Selection */}
        <div className="space-y-2">
          <button
            onClick={() => loginWithSandbox('admin')}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all flex items-center justify-between border border-slate-700/60"
          >
            <div className="flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Enter Sandbox as Admin</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">Full Access</span>
          </button>

          <button
            onClick={() => loginWithSandbox('viewer')}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all flex items-center justify-between border border-slate-700/60"
          >
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-indigo-400" />
              <span>Enter Sandbox as Viewer</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Read Only</span>
          </button>
        </div>
      </div>
    </div>
  );
};
