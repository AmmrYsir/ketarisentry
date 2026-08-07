import React, { useState, useEffect } from 'react';
import { X, FileText, User, Clock, RefreshCw, ShieldAlert } from 'lucide-react';
import { fetchAuditLogsFromApi } from '../services/apiClient';
import type { AuditLogEntry } from '../types';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const loadLogs = async () => {
    setLoading(true);
    const data = await fetchAuditLogsFromApi();
    setLogs(data);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-[8px_8px_24px_rgba(0,0,0,0.6)] relative my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">System & Security Audit Logs</h2>
              <p className="text-xs text-slate-400">Persisted in SQLite database (`ketarisentry.db`)</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={loadLogs}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
              title="Refresh Audit Logs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Audit Log Entries List */}
        {logs.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800/50">
            <ShieldAlert className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
            <p className="text-sm font-semibold text-slate-200">No Audit Events Logged Yet</p>
            <p className="text-xs text-slate-400 mt-1">Audit log records will be created automatically as users log in and configure services.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-7 h-7 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-[10px] flex-shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-200">{log.user_name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/40 uppercase">
                        {log.action}
                      </span>
                    </div>
                    <p className="text-slate-300 mt-1">{log.details}</p>
                  </div>
                </div>

                <span className="text-[11px] font-mono text-slate-400 flex items-center space-x-1 flex-shrink-0 self-end sm:self-center">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
