import React from 'react';
import { Shield, Lock, UserCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { 
    loginWithSandbox, 
    loginWithGoogleToken, 
    isSandboxAllowed, 
    googleClientId 
  } = useAuth();

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex items-center justify-center p-4 font-sans selection:bg-emerald-500 selection:text-slate-900">
      
      {/* Background Decorative Gradient Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-[8px_8px_32px_rgba(0,0,0,0.8)] relative text-center backdrop-blur-xl z-10">
        
        {/* Brand Icon */}
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-indigo-600 p-0.5 mx-auto mb-6 shadow-[4px_4px_16px_rgba(0,0,0,0.4)]">
          <div className="w-full h-full bg-slate-900 rounded-[22px] flex items-center justify-center">
            <Shield className="w-8 h-8 text-emerald-400" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-slate-100 tracking-tight mb-1">KetariSentry</h1>
        <p className="text-xs text-slate-400 mb-8 font-medium">Central Health & Queue Telemetry Hub</p>

        {/* Google OAuth Login Button */}
        <div className="mb-6 space-y-3">
          <button
            onClick={() => {
              if (isSandboxAllowed && !googleClientId) {
                loginWithSandbox('admin');
              } else {
                loginWithGoogleToken({
                  credential: '',
                });
              }
            }}
            className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center space-x-3 transition-all shadow-[4px_4px_12px_rgba(0,0,0,0.2)] active:scale-[0.98] cursor-pointer"
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

          {!googleClientId && !isSandboxAllowed && (
            <p className="text-[11px] text-rose-400 flex items-center justify-center space-x-1.5 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>VITE_GOOGLE_CLIENT_ID must be configured in .env</span>
            </p>
          )}

          {!googleClientId && isSandboxAllowed && (
            <p className="text-[11px] text-slate-400 flex items-center justify-center space-x-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Development mode detected. Sandbox Demo available below.</span>
            </p>
          )}
        </div>

        {/* Sandbox Demo Roles Section (Only rendered in non-production environments) */}
        {isSandboxAllowed && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                <span className="bg-slate-900 px-3 text-slate-400">Development Sandbox Demo</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => loginWithSandbox('admin')}
                className="w-full py-3 px-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-semibold text-xs transition-all flex items-center justify-between border border-slate-700/60 active:scale-[0.98] cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>Enter Sandbox as Admin</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">Full Access</span>
              </button>

              <button
                onClick={() => loginWithSandbox('viewer')}
                className="w-full py-3 px-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-semibold text-xs transition-all flex items-center justify-between border border-slate-700/60 active:scale-[0.98] cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-indigo-400" />
                  <span>Enter Sandbox as Viewer</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono font-bold">Read Only</span>
              </button>
            </div>
          </>
        )}
        
        <p className="mt-8 text-[11px] text-slate-400">
          Protected System &bull; KetariSentry Telemetry Hub
        </p>
      </div>
    </div>
  );
};
