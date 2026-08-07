import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { HealthProvider, useHealth } from './context/HealthContext';
import { Header } from './components/Header';
import { ServiceCard } from './components/ServiceCard';
import { ServiceModal } from './components/ServiceModal';
import { LoginModal } from './components/LoginModal';
import { QueueInspectorModal } from './components/QueueInspectorModal';
import { IncidentTimeline } from './components/IncidentTimeline';
import { 
  Search, 
  SlidersHorizontal, 
  Server, 
  Activity, 
  Layers, 
  AlertOctagon, 
  Lock,
  Plus
} from 'lucide-react';
import type { HealthStatus } from './types';

const DashboardContent: React.FC = () => {
  const { services, results, openAddModal } = useHealth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEnv, setSelectedEnv] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Compute fleet wide metrics
  const totalServices = services.length;
  let totalPendingJobs = 0;
  let totalFailedJobs24h = 0;
  let totalLatencyMs = 0;
  let polledCount = 0;
  let sslWarningCount = 0;

  services.forEach((s) => {
    const res = results[s.id];
    if (res) {
      polledCount++;
      totalLatencyMs += res.latency_ms || 0;
      totalPendingJobs += res.queue?.pending_jobs || 0;
      totalFailedJobs24h += res.queue?.failed_jobs_24h || 0;
      if (res.ssl?.days_remaining && res.ssl.days_remaining < 14) {
        sslWarningCount++;
      }
    }
  });

  const avgLatency = polledCount > 0 ? Math.round(totalLatencyMs / polledCount) : 0;

  // Filtered Services
  const filteredServices = services.filter((s) => {
    const res = results[s.id];
    const status: HealthStatus = s.muted ? 'maintenance' : res?.status || 'operational';

    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.url.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesEnv = selectedEnv === 'all' || s.environment === selectedEnv;
    const matchesStatus = selectedStatus === 'all' || status === selectedStatus;

    return matchesSearch && matchesEnv && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-900 font-sans">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Fleet Metrics Summary Banner */}
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Total Monitored Services */}
          <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800/80 shadow-[6px_6px_16px_rgba(0,0,0,0.4)] flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center text-indigo-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 block">Services Fleet</span>
              <span className="text-lg font-bold text-slate-100">{totalServices}</span>
            </div>
          </div>

          {/* Average Latency */}
          <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800/80 shadow-[6px_6px_16px_rgba(0,0,0,0.4)] flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 block">Avg Response</span>
              <span className="text-lg font-mono font-bold text-emerald-400">{avgLatency} ms</span>
            </div>
          </div>

          {/* Total Pending Queue Jobs */}
          <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800/80 shadow-[6px_6px_16px_rgba(0,0,0,0.4)] flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-950/80 border border-amber-800/60 flex items-center justify-center text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 block">Pending Queue Jobs</span>
              <span className="text-lg font-mono font-bold text-amber-300">{totalPendingJobs}</span>
            </div>
          </div>

          {/* Failed Jobs (24h) */}
          <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800/80 shadow-[6px_6px_16px_rgba(0,0,0,0.4)] flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-950/80 border border-rose-800/60 flex items-center justify-center text-rose-400">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 block">Failed Jobs (24h)</span>
              <span className={`text-lg font-mono font-bold ${totalFailedJobs24h > 0 ? 'text-rose-400' : 'text-slate-200'}`}>
                {totalFailedJobs24h}
              </span>
            </div>
          </div>

          {/* SSL Expiry Warnings */}
          <div className="col-span-2 lg:col-span-1 p-4 rounded-3xl bg-slate-900/90 border border-slate-800/80 shadow-[6px_6px_16px_rgba(0,0,0,0.4)] flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 block">SSL Warnings</span>
              <span className={`text-lg font-bold ${sslWarningCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {sslWarningCount > 0 ? `${sslWarningCount} Expiring` : 'All Valid'}
              </span>
            </div>
          </div>
        </section>

        {/* Search & Filter Controls Toolbar */}
        <section className="bg-slate-900/90 rounded-3xl p-4 border border-slate-800/80 shadow-[6px_6px_16px_rgba(0,0,0,0.4)] flex flex-wrap items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search services by name or endpoint URL..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4)]"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-2.5">
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedEnv}
                onChange={(e) => setSelectedEnv(e.target.value)}
                className="bg-transparent text-slate-300 focus:outline-none font-medium cursor-pointer"
              >
                <option value="all" className="bg-slate-900">Env: All</option>
                <option value="production" className="bg-slate-900">Production</option>
                <option value="staging" className="bg-slate-900">Staging</option>
                <option value="local" className="bg-slate-900">Local</option>
              </select>
            </div>

            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent text-slate-300 focus:outline-none font-medium cursor-pointer"
              >
                <option value="all" className="bg-slate-900">Status: All</option>
                <option value="operational" className="bg-slate-900">Operational</option>
                <option value="degraded" className="bg-slate-900">Degraded</option>
                <option value="outage" className="bg-slate-900">Outage</option>
                <option value="maintenance" className="bg-slate-900">Muted</option>
              </select>
            </div>
          </div>
        </section>

        {/* Services Grid */}
        <section>
          {filteredServices.length === 0 ? (
            <div className="bg-slate-900/90 rounded-3xl p-12 border border-slate-800/80 shadow-[6px_6px_16px_rgba(0,0,0,0.4)] text-center">
              <Server className="w-10 h-10 text-slate-400 mx-auto mb-3 opacity-60" />
              <h3 className="text-base font-bold text-slate-200">No Services Found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No services matched your search filters. Try clearing filters or add a new Laravel health endpoint.
              </p>
              <button
                onClick={() => openAddModal()}
                className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Target Service</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {filteredServices.map((serviceConfig) => (
                <ServiceCard
                  key={serviceConfig.id}
                  config={serviceConfig}
                  result={results[serviceConfig.id]}
                />
              ))}
            </div>
          )}
        </section>

        {/* Real-time Incident Event Log */}
        <section>
          <IncidentTimeline />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-400">
        <p>KetariSentry &copy; {new Date().getFullYear()} &bull; Bun + Vite + React Compiler Health Hub</p>
      </footer>

      {/* Modals & Drawers */}
      <ServiceModal />
      <LoginModal />
      <QueueInspectorModal />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <HealthProvider>
        <DashboardContent />
      </HealthProvider>
    </AuthProvider>
  );
}
