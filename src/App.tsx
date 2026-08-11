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
import { UserManagement } from './components/UserManagement';
import { SettingsPage } from './components/SettingsPage';
import { ProfilePage } from './components/ProfilePage';
import { CustomSelect } from './components/CustomSelect';
import { 
  Search, 
  Server, 
  Activity, 
  Layers, 
  AlertOctagon, 
  Lock,
  Plus,
  LayoutGrid,
  List,
  Zap,
  Globe
} from 'lucide-react';
import type { HealthStatus, NavTab } from './types';

const DashboardContent: React.FC<{
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
}> = ({ activeTab, onChangeTab }) => {
  const { services, results, isPollingActive, triggerPollAll, openAddModal } = useHealth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEnv, setSelectedEnv] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // Compute fleet wide metrics
  const totalServices = services.length;
  let totalPendingJobs = 0;
  let totalFailedJobs24h = 0;
  let totalLatencyMs = 0;
  let polledCount = 0;
  let sslWarningCount = 0;

  // Environment counts
  let prodCount = 0;
  let stagingCount = 0;
  let localCount = 0;

  services.forEach((s) => {
    if (s.environment === 'production') prodCount++;
    else if (s.environment === 'staging') stagingCount++;
    else if (s.environment === 'local') localCount++;

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

  // Group services by environment for structured display
  const prodServices = filteredServices.filter((s) => s.environment === 'production');
  const stagingServices = filteredServices.filter((s) => s.environment === 'staging');
  const localServices = filteredServices.filter((s) => s.environment === 'local');

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-900 font-sans">
      <Header
        activeTab={activeTab}
        onChangeTab={onChangeTab}
        onOpenAuditLog={() => setIsAuditModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* RENDER VIEW ACCORDING TO NAV TAB */}
        {activeTab === 'users' ? (
          <UserManagement />
        ) : activeTab === 'settings' ? (
          <SettingsPage />
        ) : activeTab === 'profile' ? (
          <ProfilePage />
        ) : (
          /* DASHBOARD VIEW */
          <div className="space-y-6">
            {/* Fleet Metrics Summary Row */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 select-none">
              <div className="rounded-xl p-4 linear-card flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-950/60 border border-indigo-800/40 flex items-center justify-center text-indigo-400">
                    <Server className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block">Monitored Fleet</span>
                    <span className="text-lg font-extrabold text-slate-100">{totalServices} Services</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/40">
                  Active
                </span>
              </div>

              <div className="rounded-xl p-4 linear-card flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
                    <Activity className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block">Avg Latency</span>
                    <span className="text-lg font-mono font-extrabold text-emerald-400">{avgLatency} ms</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                  Fast
                </span>
              </div>

              <div className="rounded-xl p-4 linear-card flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-950/60 border border-amber-800/40 flex items-center justify-center text-amber-400">
                    <Layers className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block">Pending Queue</span>
                    <span className="text-lg font-mono font-extrabold text-amber-300">{totalPendingJobs} Jobs</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/40">
                  Redis
                </span>
              </div>

              <div className="rounded-xl p-4 linear-card flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-rose-950/60 border border-rose-800/40 flex items-center justify-center text-rose-400">
                    <AlertOctagon className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block">Failed Jobs (24h)</span>
                    <span className={`text-lg font-mono font-extrabold ${totalFailedJobs24h > 0 ? 'text-rose-400' : 'text-slate-200'}`}>
                      {totalFailedJobs24h}
                    </span>
                  </div>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  totalFailedJobs24h > 0 ? 'bg-rose-950 text-rose-300 border-rose-800/40' : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}>
                  Horizon
                </span>
              </div>
            </section>

            {/* Environment Filter Segmented Switcher & Search Bar */}
            <section className="space-y-3">
              {/* Top Environment Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3 select-none">
                <div className="flex items-center space-x-1.5 p-1 rounded-xl linear-well text-xs font-semibold">
                  <button
                    onClick={() => setSelectedEnv('all')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
                      selectedEnv === 'all'
                        ? 'bg-slate-800 text-slate-100 border border-slate-700/60'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>All Envs ({services.length})</span>
                  </button>

                  <button
                    onClick={() => setSelectedEnv('production')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
                      selectedEnv === 'production'
                        ? 'bg-rose-950/80 text-rose-300 border border-rose-800/50'
                        : 'text-slate-400 hover:text-rose-300'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <span>Production ({prodCount})</span>
                  </button>

                  <button
                    onClick={() => setSelectedEnv('staging')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
                      selectedEnv === 'staging'
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-800/50'
                        : 'text-slate-400 hover:text-amber-300'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>Staging ({stagingCount})</span>
                  </button>

                  <button
                    onClick={() => setSelectedEnv('local')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
                      selectedEnv === 'local'
                        ? 'bg-slate-800 text-slate-200 border border-slate-700/60'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span>Local ({localCount})</span>
                  </button>
                </div>

                {/* View Mode Toggle Switcher */}
                <div className="flex items-center space-x-1 p-1 rounded-xl linear-well text-xs">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                      viewMode === 'grid'
                        ? 'bg-slate-800 text-emerald-400 border border-slate-700/60'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Grid Card View"
                    aria-label="Grid Card View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                      viewMode === 'table'
                        ? 'bg-slate-800 text-emerald-400 border border-slate-700/60'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Compact List View"
                    aria-label="Compact List View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Search & Status Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[280px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search services by name or health URL..."
                    className="w-full pl-10 pr-12 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all font-sans"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-slate-400 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 pointer-events-none">
                    ⌘K
                  </span>
                </div>

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
            </section>

            {/* Main Dashboard Body (2-Column Command Layout) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Primary Column: Fleet Service Cards (8 cols) */}
              <div className="lg:col-span-8 space-y-6">
                {filteredServices.length === 0 ? (
                  <div className="rounded-2xl p-12 linear-card text-center select-none">
                    <Server className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-60" />
                    <h3 className="text-base font-extrabold text-slate-200">No Monitored Endpoints Found</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto font-medium">
                      No service endpoints matched your search filter criteria. Try adjusting your query or add a new target service.
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
                ) : selectedEnv === 'all' ? (
                  /* Grouped Environment Display when 'all' is selected */
                  <div className="space-y-6">
                    {/* Production Section */}
                    {prodServices.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 select-none border-b border-slate-800/60 pb-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 glow-dot-rose" />
                          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                            Production Fleet ({prodServices.length})
                          </h3>
                        </div>
                        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-2'}>
                          {prodServices.map((s) => (
                            <ServiceCard key={s.id} config={s} result={results[s.id]} viewMode={viewMode} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Staging Section */}
                    {stagingServices.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 select-none border-b border-slate-800/60 pb-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 glow-dot-amber" />
                          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                            Staging Fleet ({stagingServices.length})
                          </h3>
                        </div>
                        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-2'}>
                          {stagingServices.map((s) => (
                            <ServiceCard key={s.id} config={s} result={results[s.id]} viewMode={viewMode} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Local Section */}
                    {localServices.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 select-none border-b border-slate-800/60 pb-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                            Local / Dev Fleet ({localServices.length})
                          </h3>
                        </div>
                        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-2'}>
                          {localServices.map((s) => (
                            <ServiceCard key={s.id} config={s} result={results[s.id]} viewMode={viewMode} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Single list when a specific environment filter is selected */
                  <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-2'}>
                    {filteredServices.map((serviceConfig) => (
                      <ServiceCard
                        key={serviceConfig.id}
                        config={serviceConfig}
                        result={results[serviceConfig.id]}
                        viewMode={viewMode}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Secondary Column: Telemetry Sidebar Panel (4 cols) */}
              <div className="lg:col-span-4 space-y-6 sticky top-20">
                
                {/* Polling Engine & System Status Card */}
                <div className="rounded-2xl p-5 linear-card select-none space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-xs font-bold text-slate-200">Pull Polling Engine</h3>
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      isPollingActive
                        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40'
                        : 'bg-amber-950/60 text-amber-400 border-amber-800/40'
                    }`}>
                      {isPollingActive ? 'ACTIVE' : 'PAUSED'}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Polling Strategy:</span>
                      <strong className="text-slate-200 font-mono">Pure HTTP Pull</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>CORS & Timeout Guard:</span>
                      <strong className="text-emerald-400 font-mono">Enforced (5s)</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Security Headers:</span>
                      <strong className="text-slate-200 font-mono">X-Ketari-Secret</strong>
                    </div>
                  </div>

                  <button
                    onClick={triggerPollAll}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700/60 active:scale-95 cursor-pointer"
                  >
                    Trigger Immediate Fleet Re-Poll
                  </button>
                </div>

                {/* SSL Certificate Warnings Widget */}
                {sslWarningCount > 0 && (
                  <div className="rounded-2xl p-4 bg-amber-950/40 border border-amber-800/50 text-amber-300 text-xs select-none">
                    <div className="flex items-center space-x-2 font-bold mb-1">
                      <Lock className="w-4 h-4 text-amber-400" />
                      <span>SSL Expiration Warning</span>
                    </div>
                    <p className="text-[11px] text-amber-300/80 font-medium">
                      {sslWarningCount} service endpoint(s) have SSL certificates expiring within 14 days. Please renew certificates.
                    </p>
                  </div>
                )}

                {/* Live Incident Event Timeline Widget */}
                <IncidentTimeline />
              </div>

            </div>
          </div>
        )}
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
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <HealthProvider>
      <DashboardContent activeTab={activeTab} onChangeTab={setActiveTab} />
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
