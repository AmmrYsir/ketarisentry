import React, { useState, useEffect } from 'react';
import { X, Server } from 'lucide-react';
import { useHealth } from '../context/HealthContext';

export const ServiceModal: React.FC = () => {
  const { isAddModalOpen, editingService, closeAddModal, saveService } = useHealth();

  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [environment, setEnvironment] = useState<'production' | 'staging' | 'local'>('production');
  const [pollInterval, setPollInterval] = useState(15);
  const [timeoutSec, setTimeoutSec] = useState(5);
  const [secretKey, setSecretKey] = useState('');
  const [authHeader, setAuthHeader] = useState('');

  useEffect(() => {
    if (editingService) {
      setName(editingService.name);
      setUrl(editingService.url);
      setEnvironment(editingService.environment);
      setPollInterval(editingService.poll_interval_sec);
      setTimeoutSec(editingService.timeout_sec);
      setSecretKey(editingService.secret_key || '');
      setAuthHeader(editingService.auth_header || '');
    } else {
      setName('');
      setUrl('');
      setEnvironment('production');
      setPollInterval(15);
      setTimeoutSec(5);
      setSecretKey('');
      setAuthHeader('');
    }
  }, [editingService, isAddModalOpen]);

  if (!isAddModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url) {
      alert('Please fill in required fields (Name and Health Endpoint URL)');
      return;
    }

    saveService({
      id: editingService?.id,
      name,
      url,
      environment,
      poll_interval_sec: Number(pollInterval),
      timeout_sec: Number(timeoutSec),
      secret_key: secretKey || undefined,
      auth_header: authHeader || undefined,
      muted: editingService?.muted || false,
      enabled: editingService?.enabled ?? true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-[8px_8px_24px_rgba(0,0,0,0.6)] relative">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                {editingService ? 'Edit Target Service' : 'Add New Service Endpoint'}
              </h2>
              <p className="text-xs text-slate-400">Configure Pull Polling parameters & security</p>
            </div>
          </div>

          <button
            onClick={closeAddModal}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Service Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Service Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Laravel E-Commerce API"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 transition-all shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4)]"
              required
            />
          </div>

          {/* Health Endpoint URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Health Endpoint URL <span className="text-rose-400">*</span>
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.example.com/ketari/health"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs font-mono focus:outline-none focus:border-emerald-500 transition-all shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4)]"
              required
            />
          </div>

          {/* Environment & Poll Interval Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Environment</label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 transition-all shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4)]"
              >
                <option value="production">Production</option>
                <option value="staging">Staging</option>
                <option value="local">Local / Dev</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Polling Frequency</label>
              <select
                value={pollInterval}
                onChange={(e) => setPollInterval(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 transition-all shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4)]"
              >
                <option value={15}>Every 15 seconds (High Frequency)</option>
                <option value={30}>Every 30 seconds</option>
                <option value={60}>Every 1 minute</option>
                <option value={300}>Every 5 minutes</option>
              </select>
            </div>
          </div>

          {/* Timeout & Secret Key */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Timeout Limit</label>
              <select
                value={timeoutSec}
                onChange={(e) => setTimeoutSec(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 transition-all shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4)]"
              >
                <option value={2}>2 Seconds</option>
                <option value={5}>5 Seconds (Recommended)</option>
                <option value={10}>10 Seconds</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                X-Ketari-Secret Key (Optional)
              </label>
              <input
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="sk_live_..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs font-mono focus:outline-none focus:border-emerald-500 transition-all shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4)]"
              />
            </div>
          </div>

          {/* Authorization Bearer Header */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Custom Authorization Header (Optional)
            </label>
            <input
              type="text"
              value={authHeader}
              onChange={(e) => setAuthHeader(e.target.value)}
              placeholder="Bearer your-api-token"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs font-mono focus:outline-none focus:border-emerald-500 transition-all shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4)]"
            />
          </div>

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={closeAddModal}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-[3px_3px_8px_rgba(16,185,129,0.3)] active:scale-95"
            >
              {editingService ? 'Save Changes' : 'Register Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
