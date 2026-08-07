import React, { useState } from 'react';
import { Shield, Lock, UserCheck, AlertCircle, Mail, KeyRound, Wand2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex items-center justify-center p-4 font-sans selection:bg-emerald-500 selection:text-slate-900">
      
      {/* Background Decorative Gradient Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-[8px_8px_32px_rgba(0,0,0,0.8)] relative backdrop-blur-xl z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-6 select-none">
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-emerald-500 to-indigo-600 p-0.5 mx-auto mb-3 shadow-[4px_4px_16px_rgba(0,0,0,0.4)]">
            <div className="w-full h-full bg-slate-900 rounded-[22px] flex items-center justify-center">
              <Shield className="w-7 h-7 text-emerald-400" />
            </div>
          </div>

          <h1 className="text-xl font-bold text-slate-100 tracking-tight mb-1">Ketarisentry</h1>
          <p className="text-xs text-slate-400 font-medium">Central Health & Queue Telemetry Hub</p>
        </div>

        {/* Tab Switcher: Password vs Magic Link */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/80 border border-slate-800/80 rounded-2xl mb-6 select-none">
          <button
            type="button"
            onClick={() => {
              setActiveTab('password');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`py-2 text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'password'
                ? 'bg-slate-800 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            aria-label="Switch to Email & Password Tab"
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
            className={`py-2 text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'magic-link'
                ? 'bg-slate-800 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            aria-label="Switch to Magic Link Tab"
          >
            <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Magic Link</span>
          </button>
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs flex items-center space-x-2">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Tab 1: Password Form */}
        {activeTab === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-slate-300 mb-1.5 cursor-pointer">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="superadmin@ketarisentry.io"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4)]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold text-slate-300 mb-1.5 cursor-pointer">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4)]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-[4px_4px_12px_rgba(0,0,0,0.3)] active:scale-[0.98] cursor-pointer disabled:opacity-50"
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
              <label htmlFor="magic-email" className="block text-xs font-semibold text-slate-300 mb-1.5 cursor-pointer">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="magic-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="superadmin@ketarisentry.io"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4)]"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Magic Link authorization is available exclusively for registered, verified email accounts.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-[4px_4px_12px_rgba(0,0,0,0.3)] active:scale-[0.98] cursor-pointer disabled:opacity-50"
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
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                <span className="bg-slate-900 px-3 text-slate-400">Development Sandbox Demo</span>
              </div>
            </div>

            <div className="space-y-2 select-none">
              <button
                type="button"
                onClick={() => loginWithSandbox('admin')}
                className="w-full py-2.5 px-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-semibold text-xs transition-all flex items-center justify-between border border-slate-700/60 active:scale-[0.98] cursor-pointer"
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
                className="w-full py-2.5 px-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-semibold text-xs transition-all flex items-center justify-between border border-slate-700/60 active:scale-[0.98] cursor-pointer"
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
        
        <p className="mt-6 text-[11px] text-slate-400 text-center select-none">
          Protected System &bull; Ketarisentry Telemetry Hub
        </p>
      </div>
    </div>
  );
};
