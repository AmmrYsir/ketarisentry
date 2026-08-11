import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { HealthProvider } from './context/HealthContext';
import { useAuth } from './hooks/useAuth';
import { useHealth } from './hooks/useHealth';
import { Header } from './components/Header';
import { ServiceCard } from './components/ServiceCard';
import { ServiceModal } from './components/ServiceModal';
import { LoginPage } from './components/LoginPage';
import { QueueInspectorModal } from './components/QueueInspectorModal';
import { AuditLogModal } from './components/AuditLogModal';
import { IncidentTimeline } from './components/IncidentTimeline';
import { CustomSelect } from './components/CustomSelect';
import { 
  Search, 
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
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

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
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-900 font-sans">
      <Header onOpenAuditLog={() => setIsAuditModalOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Fleet Metrics Summary Banner */}
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-4 select-none">
          {/* Total Monitored Services */}
          <div className="rounded-2xl p-5 linear-card">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-950/60 border border-indigo-800/40 flex items-center justify-center text-indigo-400">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 block">Services Fleet</span>
                <span className="text-xl font-extrabold text-slate-100">{totalServices}</span>
              </div>
            </div>
          </div>

          {/* Average Latency */}
          <div className="rounded-2xl p-5 linear-card">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 block">Avg Response</span>
                <span className="text-xl font-mono font-extrabold text-emerald-400">{avgLatency} ms</span>
              </div>
            </div>
          </div>

          {/* Total Pending Queue Jobs */}
          <div className="rounded-2xl p-5 linear-card">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-800/40 flex items-center justify-center text-amber-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 block">Pending Queue Jobs</span>
                <span className="text-xl font-mono font-extrabold text-amber-300">{totalPendingJobs}</span>
              </div>
            </div>
          </div>

          {/* Failed Jobs (24h) */}
          <div className="rounded-2xl p-5 linear-card">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-800/40 flex items-center justify-center text-rose-400">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 block">Failed Jobs (24h)</span>
                <span className={`text-xl font-mono font-extrabold ${totalFailedJobs24h > 0 ? 'text-rose-400' : 'text-slate-200'}`}>
                  {totalFailedJobs24h}
                </span>
              </div>
            </div>
          </div>

          {/* SSL Expiry Warnings */}
          <div className="col-span-2 lg:col-span-1 rounded-2xl p-5 linear-card">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 block">SSL Warnings</span>
                <span className={`text-xl font-extrabold ${sslWarningCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {sslWarningCount > 0 ? `${sslWarningCount} Expiring` : 'All Valid'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Search & Filter Controls Toolbar */}
        <div className="rounded-2xl p-3.5 linear-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[280px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search services by name or endpoint URL..."
                className="w-full pl-10 pr-12 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all font-sans"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-slate-400 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 pointer-events-none">
                ⌘K
              </span>
            </div>

            {/* Environment & Status Filter Dropdowns */}
            <div className="flex items-center space-x-2.5 select-none">
              <CustomSelect
                value={selectedEnv}
                onChange={(val) => setSelectedEnv(String(val))}
                options={[
                  { value: 'all', label: 'Env: All' },
                  { value: 'production', label: 'Production' },
                  { value: 'staging', label: 'Staging' },
                  { value: 'local', label: 'Local' },
                ]}
                ariaLabel="Filter by Environment"
              />

              <CustomSelect
                value={selectedStatus}
                onChange={(val) => setSelectedStatus(String(val))}
                options={[
                  { value: 'all', label: 'Status: All' },
                  { value: 'operational', label: 'Operational' },
                  { value: 'degraded', label: 'Degraded' },
                  { value: 'outage', label: 'Outage' },
                  { value: 'maintenance', label: 'Muted' },
                ]}
                ariaLabel="Filter by Health Status"
              />
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <section>
          {filteredServices.length === 0 ? (
            <div className="rounded-2xl p-12 linear-card text-center select-none">
              <Server className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-60" />
              <h3 className="text-base font-extrabold text-slate-200">No Services Monitored</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto font-medium">
                Your monitoring fleet is empty. Add your first Laravel /ketari/health endpoint to start tracking service status.
              </p>
              <div className="mt-5 flex justify-center">
                <button
                  onClick={() => openAddModal()}
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-[0_0_12px_rgba(16,185,129,0.25)] active:scale-95 cursor-pointer transition-all border border-emerald-500/50"
                  aria-label="Add Target Service Endpoint"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Target Service</span>
                </button>
              </div>
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
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-400 select-none">
        <p>Ketarisentry &copy; {new Date().getFullYear()} &bull; Central Health & Queue Telemetry Hub</p>
      </footer>

      {/* Modals & Drawers */}
      <ServiceModal />
      <QueueInspectorModal />
      <AuditLogModal isOpen={isAuditModalOpen} onClose={() => setIsAuditModalOpen(false)} />
    </div>
  );
};


const MainContent: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <HealthProvider>
      <DashboardContent />
    </HealthProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}

