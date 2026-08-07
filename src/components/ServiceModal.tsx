import React, { useState, useEffect } from 'react';
import { X, Server } from 'lucide-react';
import { useHealth } from '../hooks/useHealth';
import { CustomSelect } from './CustomSelect';

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
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5 select-none">
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
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 active:scale-95 transition-all cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Service Name */}
          <div>
            <label htmlFor="service-name" className="block text-xs font-semibold text-slate-300 mb-1.5 cursor-pointer">
              Service Name <span className="text-rose-400">*</span>
            </label>
            <input
              id="service-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Laravel E-Commerce API"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4)]"
              required
            />
          </div>

          {/* Health Endpoint URL */}
          <div>
            <label htmlFor="service-url" className="block text-xs font-semibold text-slate-300 mb-1.5 cursor-pointer">
              Health Endpoint URL <span className="text-rose-400">*</span>
            </label>
            <input
              id="service-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.example.com/ketari/health"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4)]"
              required
            />
          </div>

          {/* Environment & Poll Interval Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="service-env" className="block text-xs font-semibold text-slate-300 mb-1.5 cursor-pointer">Environment</label>
              <CustomSelect
                value={environment}
                onChange={(val) => setEnvironment(val as any)}
                options={[
                  { value: 'production', label: 'Production' },
                  { value: 'staging', label: 'Staging' },
                  { value: 'local', label: 'Local / Dev' },
                ]}
                ariaLabel="Select Environment"
              />
            </div>

            <div>
              <label htmlFor="poll-interval" className="block text-xs font-semibold text-slate-300 mb-1.5 cursor-pointer">Polling Frequency</label>
              <CustomSelect
                value={pollInterval}
                onChange={(val) => setPollInterval(Number(val))}
                options={[
                  { value: 15, label: 'Every 15 seconds (High Frequency)' },
                  { value: 30, label: 'Every 30 seconds' },
                  { value: 60, label: 'Every 1 minute' },
                  { value: 300, label: 'Every 5 minutes' },
                ]}
                ariaLabel="Select Polling Frequency"
              />
            </div>
          </div>

          {/* Timeout & Secret Key */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="timeout-limit" className="block text-xs font-semibold text-slate-300 mb-1.5 cursor-pointer">Timeout Limit</label>
              <CustomSelect
                value={timeoutSec}
                onChange={(val) => setTimeoutSec(Number(val))}
                options={[
                  { value: 2, label: '2 Seconds' },
                  { value: 5, label: '5 Seconds (Recommended)' },
                  { value: 10, label: '10 Seconds' },
                ]}
                ariaLabel="Select Timeout Limit"
              />
            </div>

            <div>
              <label htmlFor="secret-key" className="block text-xs font-semibold text-slate-300 mb-1.5 cursor-pointer">
                X-Ketari-Secret Key (Optional)
              </label>
              <input
                id="secret-key"
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="sk_live_..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4)]"
              />
            </div>
          </div>

          {/* Authorization Bearer Header */}
          <div>
            <label htmlFor="auth-header" className="block text-xs font-semibold text-slate-300 mb-1.5 cursor-pointer">
              Custom Authorization Header (Optional)
            </label>
            <input
              id="auth-header"
              type="text"
              value={authHeader}
              onChange={(e) => setAuthHeader(e.target.value)}
              placeholder="Bearer your-api-token"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4)]"
            />
          </div>

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3 select-none">
            <button
              type="button"
              onClick={closeAddModal}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-[3px_3px_8px_rgba(16,185,129,0.3)] active:scale-95 cursor-pointer"
            >
              {editingService ? 'Save Changes' : 'Register Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
