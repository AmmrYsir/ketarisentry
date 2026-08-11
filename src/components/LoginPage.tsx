import React, { useState } from 'react';
import { Shield, Lock, Mail, KeyRound, Wand2, ArrowRight, UserCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const LoginPage: React.FC = () => {
  const { 
    loginWithSandbox, 
    loginWithPassword, 
    loginWithMagicLink, 
    isSandboxAllowed 
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'password' | 'magic-link'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setIsLoading(true);
    const result = await loginWithPassword(email, password);
    setIsLoading(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Authentication failed. Please check your credentials.');
    }
  };

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    setIsLoading(true);
    const result = await loginWithMagicLink(email);
    setIsLoading(false);

    if (!result.success) {
      setErrorMessage(result.error || 'No verified account found for this email address.');
    } else {
      setSuccessMessage('Magic link authorized! Authenticating session...');
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-slate-900 font-sans">
      <div className="w-full max-w-md bg-[#090d16] border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
        
        {/* Header Branding */}
        <div className="text-center mb-6 select-none">
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/60 flex items-center justify-center text-emerald-400 mx-auto mb-3 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <Shield className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-extrabold tracking-tight text-slate-100 font-sans">Ketarisentry</h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">Laravel Fleet Health & Telemetry Hub</p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl linear-well mb-6 select-none">
          <button
            type="button"
            onClick={() => {
              setActiveTab('password');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`py-1.5 text-xs font-bold rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'password'
                ? 'bg-slate-800 text-slate-100 border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Email & Password</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('magic-link');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`py-1.5 text-xs font-bold rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'magic-link'
                ? 'bg-slate-800 text-slate-100 border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Magic Link</span>
          </button>
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-center space-x-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs flex items-center space-x-2.5">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Tab 1: Password Form */}
        {activeTab === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-bold text-slate-300 mb-1.5 cursor-pointer">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="superadmin@ketarisentry.io"
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all font-sans"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-bold text-slate-300 mb-1.5 cursor-pointer">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-[0_0_12px_rgba(16,185,129,0.25)] border border-emerald-500/50 active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              <span>{isLoading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Tab 2: Magic Link Form */}
        {activeTab === 'magic-link' && (
          <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
            <div>
              <label htmlFor="magic-email" className="block text-xs font-bold text-slate-300 mb-1.5 cursor-pointer">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="magic-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="superadmin@ketarisentry.io"
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all font-sans"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 font-medium">
                Magic Link authorization is available exclusively for registered, verified email accounts.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-[0_0_12px_rgba(99,102,241,0.25)] border border-indigo-500/50 active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              <Wand2 className="w-4 h-4 text-indigo-200" />
              <span>{isLoading ? 'Authorizing Magic Link...' : 'Authorize Magic Link'}</span>
            </button>
          </form>
        )}

        {/* Development Sandbox Demo Roles Section */}
        {isSandboxAllowed && (
          <>
            <div className="relative my-6 select-none">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-mono font-bold tracking-wider">
                <span className="bg-[#090d16] px-3 text-slate-400">Sandbox Demo Modes</span>
              </div>
            </div>

            <div className="space-y-2 select-none">
              <button
                type="button"
                onClick={() => loginWithSandbox('admin')}
                className="w-full py-2 px-3.5 rounded-xl linear-btn text-slate-200 font-semibold text-xs transition-all flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>Enter Sandbox as Superadmin</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">Full Access</span>
              </button>

              <button
                type="button"
                onClick={() => loginWithSandbox('viewer')}
                className="w-full py-2 px-3.5 rounded-xl linear-btn text-slate-200 font-semibold text-xs transition-all flex items-center justify-between cursor-pointer"
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
        
        <p className="mt-6 text-[11px] text-slate-400 text-center select-none font-medium">
          Protected System &bull; Ketarisentry Telemetry Hub
        </p>
      </div>
    </div>
  );
};
