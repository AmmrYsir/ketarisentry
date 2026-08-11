import React from 'react';
import { 
  Shield, 
  RefreshCw, 
  Plus, 
  Power, 
  Download, 
  Upload, 
  LogOut, 
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  FileText
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useHealth } from '../hooks/useHealth';

interface HeaderProps {
  onOpenAuditLog?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAuditLog }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { 
    services, 
    results, 
    isPollingActive, 
    togglePolling, 
    triggerPollAll, 
    openAddModal, 
    exportConfigJson,
    importConfigJson 
  } = useHealth();

  // Fleet stats computation
  let operationalCount = 0;
  let degradedCount = 0;
  let outageCount = 0;
  let maintenanceCount = 0;

  services.forEach((s) => {
    if (s.muted) {
      maintenanceCount++;
      return;
    }
    const status = results[s.id]?.status || 'operational';
    if (status === 'operational') operationalCount++;
    else if (status === 'degraded') degradedCount++;
    else if (status === 'outage') outageCount++;
    else if (status === 'maintenance') maintenanceCount++;
  });

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
    <header className="w-full bg-[#030712]/90 border-b border-slate-800/80 sticky top-0 z-30 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        
        {/* Brand & Logo */}
        <div className="flex items-center space-x-3 select-none">
          <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700/60 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-extrabold tracking-tight text-slate-100 font-sans">Ketarisentry</h1>
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-400 border border-emerald-800/50">
                Hub
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Laravel Fleet Health & Telemetry</p>
          </div>
        </div>

        {/* Fleet Quick Status Pills */}
        <div className="hidden lg:flex items-center space-x-2 bg-slate-950/80 p-1 rounded-full border border-slate-800/80 select-none">
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse glow-dot-emerald" />
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{operationalCount} Operational</span>
          </div>

          {degradedCount > 0 && (
            <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-950/40 border border-amber-800/40 text-amber-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse glow-dot-amber" />
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{degradedCount} Degraded</span>
            </div>
          )}

          {outageCount > 0 && (
            <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-950/40 border border-rose-800/40 text-rose-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse glow-dot-rose" />
              <XCircle className="w-3.5 h-3.5" />
              <span>{outageCount} Outage</span>
            </div>
          )}

          {maintenanceCount > 0 && (
            <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-950/40 border border-indigo-800/40 text-indigo-400 text-xs font-semibold">
              <Clock className="w-3.5 h-3.5" />
              <span>{maintenanceCount} Muted</span>
            </div>
          )}
        </div>

        {/* Action Controls & User Account */}
        <div className="flex items-center space-x-2">
          {/* Re-poll All Button */}
          <button
            onClick={triggerPollAll}
            className="p-2 rounded-xl linear-btn text-slate-300 hover:text-white cursor-pointer select-none"
            title="Poll Fleet Now"
            aria-label="Poll Fleet Now"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Toggle Auto Polling */}
          <button
            onClick={togglePolling}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer select-none active:scale-95 ${
              isPollingActive
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
            title="Toggle Auto Polling"
            aria-label="Toggle Auto Polling"
          >
            <Power className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isPollingActive ? 'Polling Active' : 'Polling Paused'}</span>
          </button>

          {/* Add Service Button (Admin/Operator only) */}
          {user?.role !== 'viewer' && (
            <button
              onClick={() => openAddModal()}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-[0_0_12px_rgba(16,185,129,0.25)] active:scale-95 cursor-pointer select-none border border-emerald-500/50"
              aria-label="Add Target Service Endpoint"
            >
              <Plus className="w-4 h-4" />
              <span>Add Service</span>
            </button>
          )}

          {/* Audit Logs Button */}
          {onOpenAuditLog && (
            <button
              onClick={onOpenAuditLog}
              className="p-2 rounded-xl linear-btn text-slate-300 hover:text-white cursor-pointer select-none"
              title="View SQLite Audit Logs"
              aria-label="View SQLite Audit Logs"
            >
              <FileText className="w-4 h-4 text-indigo-400" />
            </button>
          )}

          {/* Export / Import Buttons */}
          <button
            onClick={exportConfigJson}
            className="p-2 rounded-xl linear-btn text-slate-300 hover:text-white cursor-pointer select-none"
            title="Export Fleet Config JSON"
            aria-label="Export Fleet Config JSON"
          >
            <Download className="w-4 h-4" />
          </button>

          <label
            className="p-2 rounded-xl linear-btn text-slate-300 hover:text-white cursor-pointer select-none"
            title="Import Fleet Config JSON"
            aria-label="Import Fleet Config JSON"
          >
            <Upload className="w-4 h-4" />
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>

          {/* User Account Menu */}
          {isAuthenticated && (
            <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-800 select-none">
              <img
                src={user?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=Admin'}
                alt={user?.name}
                className="w-7 h-7 rounded-lg ring-1 ring-emerald-500/40 object-cover"
              />
              <div className="hidden md:block text-left">
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-bold text-slate-200">{user?.name}</span>
                  {user?.is_sandbox && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-400 font-mono font-bold border border-amber-800/40">Demo</span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 capitalize block font-mono">
                  Role: {user?.role || 'Admin'}
                </span>
              </div>
              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-400 active:scale-95 transition-colors cursor-pointer select-none"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};


