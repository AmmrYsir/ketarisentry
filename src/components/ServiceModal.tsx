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
  const [customLatencyMs, setCustomLatencyMs] = useState(200);
  const [secretKey, setSecretKey] = useState('');
  const [authHeader, setAuthHeader] = useState('');

  useEffect(() => {
    if (editingService) {
      setName(editingService.name);
      setUrl(editingService.url);
      setEnvironment(editingService.environment);
      setPollInterval(editingService.poll_interval_sec);
      setTimeoutSec(editingService.timeout_sec);
      setCustomLatencyMs(editingService.custom_latency_threshold_ms || 200);
      setSecretKey(editingService.secret_key || '');
      setAuthHeader(editingService.auth_header || '');
    } else {
      setName('');
      setUrl('');
      setEnvironment('production');
      setPollInterval(15);
      setTimeoutSec(5);
      setCustomLatencyMs(200);
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
      custom_latency_threshold_ms: Number(customLatencyMs),
      secret_key: secretKey || undefined,
      auth_header: authHeader || undefined,
      muted: editingService?.muted || false,
      enabled: editingService?.enabled ?? true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900/95 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-clay-card relative my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6 select-none">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400 shadow-clay-btn">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-100 font-sans">
                {editingService ? 'Edit Target Service' : 'Add New Service Endpoint'}
              </h2>
              <p className="text-xs text-slate-400 font-semibold">Configure Pull Polling parameters & security</p>
            </div>
          </div>

          <button
            onClick={closeAddModal}
            className="p-2.5 rounded-2xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700/80 active:scale-95 transition-all shadow-clay-btn border border-slate-700/60 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4.5">
          {/* Service Name */}
          <div>
            <label htmlFor="service-name" className="block text-xs font-bold text-slate-300 mb-1.5 cursor-pointer">
              Service Name <span className="text-rose-400">*</span>
            </label>
            <input
              id="service-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Laravel E-Commerce API"
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/90 border border-slate-800/80 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 transition-all shadow-clay-inset"
              required
            />
          </div>

          {/* Health Endpoint URL */}
          <div>
            <label htmlFor="service-url" className="block text-xs font-bold text-slate-300 mb-1.5 cursor-pointer">
              Health Endpoint URL <span className="text-rose-400">*</span>
            </label>
            <input
              id="service-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.example.com/ketari/health"
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/90 border border-slate-800/80 text-slate-100 text-xs font-mono focus:outline-none focus:border-emerald-500 transition-all shadow-clay-inset"
              required
            />
          </div>

          {/* Environment & Poll Interval Row */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="service-env" className="block text-xs font-bold text-slate-300 mb-1.5 cursor-pointer">Environment</label>
              <CustomSelect
                value={environment}
                onChange={(val) => setEnvironment(val as 'production' | 'staging' | 'local')}
                options={[
                  { value: 'production', label: 'Production' },
                  { value: 'staging', label: 'Staging' },
                  { value: 'local', label: 'Local / Dev' },
                ]}
                ariaLabel="Select Environment"
              />
            </div>

            <div>
              <label htmlFor="poll-interval" className="block text-xs font-bold text-slate-300 mb-1.5 cursor-pointer">Polling Frequency</label>
              <CustomSelect
                value={pollInterval}
                onChange={(val) => setPollInterval(Number(val))}
                options={[
                  { value: 15, label: 'Every 15s (High Frequency)' },
                  { value: 30, label: 'Every 30 seconds' },
                  { value: 60, label: 'Every 1 minute' },
                  { value: 300, label: 'Every 5 minutes' },
                ]}
                ariaLabel="Select Polling Frequency"
              />
            </div>
          </div>

          {/* Timeout & Latency Warning Threshold */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="timeout-limit" className="block text-xs font-bold text-slate-300 mb-1.5 cursor-pointer">Timeout Limit</label>
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
              <label htmlFor="latency-threshold" className="block text-xs font-bold text-slate-300 mb-1.5 cursor-pointer">
                Latency Warning Threshold
              </label>
              <CustomSelect
                value={customLatencyMs}
                onChange={(val) => setCustomLatencyMs(Number(val))}
                options={[
                  { value: 100, label: '> 100 ms (Strict)' },
                  { value: 200, label: '> 200 ms (Standard)' },
                  { value: 500, label: '> 500 ms (Relaxed)' },
                  { value: 1000, label: '> 1000 ms (High Latency)' },
                ]}
                ariaLabel="Select Latency Threshold"
              />
            </div>
          </div>
          {/* Secret Key & Authorization Header */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="secret-key" className="block text-xs font-bold text-slate-300 mb-1.5 cursor-pointer">
                X-Ketari-Secret Key (Optional)
              </label>
              <input
                id="secret-key"
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="sk_live_..."
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/90 border border-slate-800/80 text-slate-100 text-xs font-mono focus:outline-none focus:border-emerald-500 transition-all shadow-clay-inset"
              />
            </div>

          {/* Authorization Bearer Header */}
          <div>
            <label htmlFor="auth-header" className="block text-xs font-bold text-slate-300 mb-1.5 cursor-pointer">
              Custom Authorization Header (Optional)
            </label>
            <input
              id="auth-header"
              type="text"
              value={authHeader}
              onChange={(e) => setAuthHeader(e.target.value)}
              placeholder="Bearer your-api-token"
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/90 border border-slate-800/80 text-slate-100 text-xs font-mono focus:outline-none focus:border-emerald-500 transition-all shadow-clay-inset"
            />
          </div>
        </div>

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-end space-x-3 select-none">
            <button
              type="button"
              onClick={closeAddModal}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700/80 text-slate-300 text-xs font-bold transition-all active:scale-95 shadow-clay-btn border border-slate-700/60 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition-all shadow-clay-btn border border-emerald-500/50 active:scale-95 cursor-pointer"
            >
              {editingService ? 'Save Changes' : 'Register Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

