import React, { useState, useRef, useEffect } from 'react';
import { 
  Shield, 
  RefreshCw, 
  Plus, 
  Download, 
  Upload, 
  LogOut, 
  FileText,
  ChevronDown,
  LayoutGrid,
  Users,
  Settings,
  User as UserIcon
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useHealth } from '../hooks/useHealth';
import type { NavTab } from '../types';

interface HeaderProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  onOpenAuditLog?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onChangeTab, onOpenAuditLog }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { 
    triggerPollAll, 
    openAddModal, 
    exportConfigJson,
    importConfigJson 
  } = useHealth();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importConfigJson(content);
        if (success) alert('Fleet configuration imported successfully!');
        else alert('Failed to import configuration JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <header className="w-full bg-[#030712]/95 border-b border-slate-800/80 sticky top-0 z-30 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between select-none">
        
        {/* Brand Identity & Navigation Tabs */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => onChangeTab('dashboard')}>
            <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700/60 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              <Shield className="w-4 h-4" />
            </div>
            <span className="text-sm font-extrabold tracking-tight text-slate-100 font-sans">
              Ketarisentry
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800 hidden md:block" />

          {/* Navigation Links Menu */}
          <nav className="flex items-center space-x-1">
            <button
              onClick={() => onChangeTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700/60 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => onChangeTab('users')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700/60 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Users</span>
            </button>

            <button
              onClick={() => onChangeTab('settings')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700/60 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>

            <button
              onClick={() => onChangeTab('profile')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700/60 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Profile</span>
            </button>
          </nav>
        </div>

        {/* Action Toolbar & User Profile */}
        <div className="flex items-center space-x-2">
          
          {/* Primary Action Button (Only on Dashboard) */}
          {activeTab === 'dashboard' && user?.role !== 'viewer' && (
            <button
              onClick={() => openAddModal()}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-[0_0_12px_rgba(16,185,129,0.25)] active:scale-95 cursor-pointer border border-emerald-500/50"
              aria-label="Add Target Service Endpoint"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Endpoint</span>
            </button>
          )}

          {/* Unified Action Button Strip */}
          <div className="flex items-center p-0.5 rounded-lg linear-well">
            <button
              onClick={triggerPollAll}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-md transition-all cursor-pointer"
              title="Re-poll Fleet Now"
              aria-label="Re-poll Fleet"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {onOpenAuditLog && (
              <button
                onClick={onOpenAuditLog}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-md transition-all cursor-pointer"
                title="View Audit Logs"
                aria-label="View Audit Logs"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
              </button>
            )}

            <button
              onClick={exportConfigJson}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-md transition-all cursor-pointer"
              title="Export Fleet Config JSON"
              aria-label="Export Config"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            <label
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-md transition-all cursor-pointer"
              title="Import Fleet Config JSON"
              aria-label="Import Config"
            >
              <Upload className="w-3.5 h-3.5" />
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {/* Compact Refined User Session Menu */}
          {isAuthenticated && (
            <div ref={menuRef} className="relative pl-1">
              <button
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="flex items-center space-x-2 p-1 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all cursor-pointer"
                aria-label="User account menu"
                aria-expanded={isMenuOpen}
              >
                <img
                  src={user?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=Admin'}
                  alt={user?.name}
                  className="w-6 h-6 rounded-md ring-1 ring-emerald-500/40 object-cover"
                />
                <span className="hidden md:inline text-xs font-bold text-slate-200">
                  {user?.name}
                </span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isMenuOpen ? 'rotate-180 text-emerald-400' : ''}`} />
              </button>

              {/* User Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#090d16] border border-slate-800/80 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in duration-100">
                  <div className="px-3.5 py-2 border-b border-slate-800/80">
                    <p className="text-xs font-bold text-slate-200 truncate">{user?.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono capitalize">Role: {user?.role}</p>
                  </div>

                  <button
                    onClick={() => {
                      onChangeTab('profile');
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-3.5 py-2 text-xs text-slate-200 hover:bg-slate-800/80 flex items-center space-x-2 transition-colors cursor-pointer text-left font-semibold"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                    <span>My Profile</span>
                  </button>

                  <button
                    onClick={logout}
                    className="w-full px-3.5 py-2 text-xs text-rose-400 hover:bg-rose-950/40 flex items-center space-x-2 transition-colors cursor-pointer text-left font-semibold border-t border-slate-800/80"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </header>
  );
};
