import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  RefreshCw, 
  VolumeX, 
  Volume2, 
  Layers, 
  Lock, 
  AlertOctagon, 
  Edit3, 
  Trash2, 
  Database, 
  Server, 
  HardDrive,
  Zap,
  Cloud,
  Terminal,
  Power,
  PowerOff
} from 'lucide-react';
import type { ServiceConfig, PollResult, HealthStatus, DynamicCheck, CheckType } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useHealth } from '../hooks/useHealth';

interface ServiceCardProps {
  config: ServiceConfig;
  result?: PollResult;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ config, result }) => {
  const { user } = useAuth();
  const { triggerPollSingle, toggleMuteService, toggleEnableService, openAddModal, deleteService, openQueueInspector } = useHealth();

  const isEnabled = config.enabled !== false;
  const isMuted = config.muted;

  let status: HealthStatus = 'operational';
  if (!isEnabled) {
    status = 'maintenance';
  } else if (isMuted) {
    status = 'maintenance';
  } else {
    status = result?.status || 'operational';
  }

  const latency = result?.latency_ms || 0;
  const queue = result?.queue;
  const ssl = result?.ssl;
  const metrics = result?.system_metrics;
  const checks = result?.checks || {};
  const failedJobsCount = queue?.failed_jobs_24h || 0;
  const pendingJobs = queue?.pending_jobs || 0;

  // Status Styling
  let statusBg = 'bg-emerald-950/60 border-emerald-800/60 text-emerald-400';
  let statusDot = 'bg-emerald-500';
  let statusText = 'Operational';
  let StatusIcon: any = CheckCircle2;

  if (!isEnabled) {
    statusBg = 'bg-slate-950/80 border-slate-800 text-slate-400';
    statusDot = 'bg-slate-500';
    statusText = 'Disabled';
    StatusIcon = PowerOff;
  } else if (status === 'degraded') {
    statusBg = 'bg-amber-950/60 border-amber-800/60 text-amber-400';
    statusDot = 'bg-amber-500';
    statusText = 'Degraded';
    StatusIcon = AlertTriangle;
  } else if (status === 'outage') {
    statusBg = 'bg-rose-950/60 border-rose-800/60 text-rose-400';
    statusDot = 'bg-rose-500';
    statusText = 'Outage';
    StatusIcon = XCircle;
  } else if (status === 'maintenance') {
    statusBg = 'bg-indigo-950/60 border-indigo-800/60 text-indigo-400';
    statusDot = 'bg-indigo-500';
    statusText = 'Muted';
    StatusIcon = Clock;
  }

  // Env styling
  const envBg =
    config.environment === 'production'
      ? 'bg-rose-950/50 text-rose-300 border-rose-800/40'
      : config.environment === 'staging'
      ? 'bg-amber-950/50 text-amber-300 border-amber-800/40'
      : 'bg-slate-800 text-slate-400 border-slate-700/50';

  // Check Type Icon mapping
  const getCheckIcon = (type: CheckType) => {
    switch (type) {
      case 'database':
        return <Database className="w-3.5 h-3.5 text-indigo-400" />;
      case 'redis':
        return <HardDrive className="w-3.5 h-3.5 text-rose-400" />;
      case 'cache':
        return <Zap className="w-3.5 h-3.5 text-amber-400" />;
      case 'queue':
        return <Layers className="w-3.5 h-3.5 text-amber-400" />;
      case 'storage':
        return <HardDrive className="w-3.5 h-3.5 text-emerald-400" />;
      case 'scheduler':
        return <Clock className="w-3.5 h-3.5 text-indigo-400" />;
      case 'external_api':
        return <Cloud className="w-3.5 h-3.5 text-sky-400" />;
      default:
        return <Terminal className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className={`rounded-3xl p-5 border transition-all duration-200 flex flex-col justify-between group ${
      isEnabled 
        ? 'bg-slate-900/90 border-slate-800/80 shadow-[6px_6px_16px_rgba(0,0,0,0.4),-4px_-4px_12px_rgba(255,255,255,0.03)] hover:-translate-y-1 hover:border-slate-700/80' 
        : 'bg-slate-950/60 border-slate-800/40 opacity-75 shadow-none'
    }`}>
      
      {/* Top Header Row */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center space-x-2 mb-1 select-none">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${envBg}`}>
                {config.environment}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {config.poll_interval_sec}s poll interval
              </span>
            </div>
            <h3 className={`text-base font-bold transition-colors ${isEnabled ? 'text-slate-100 group-hover:text-emerald-400' : 'text-slate-400'}`}>
              {config.name}
            </h3>
            <p className="text-xs font-mono text-slate-400 truncate max-w-xs" title={config.url}>
              {config.url}
            </p>
          </div>

          {/* Status Pill Badge */}
          <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full border text-xs font-bold shadow-sm select-none ${statusBg}`}>
            <span className={`w-2 h-2 rounded-full ${statusDot} ${isEnabled ? 'animate-pulse' : ''}`} />
            <StatusIcon className="w-3.5 h-3.5" />
            <span>{statusText}</span>
          </div>
        </div>

        {/* Error message alert box */}
        {isEnabled && result?.error_message && (
          <div className="my-3 p-2.5 rounded-2xl bg-rose-950/40 border border-rose-900/50 text-rose-300 text-xs font-mono break-all flex items-start gap-2 select-text shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4)]">
            <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-rose-400">Error:</span> {result.error_message}
            </div>
          </div>
        )}

        {/* Latency History & Metric Bar */}
        {isEnabled ? (
          <div className="my-4 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/60 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4)] select-none">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
              <span className="flex items-center space-x-1">
                <Server className="w-3.5 h-3.5 text-slate-400" />
                <span>Response Latency</span>
              </span>
              <span className={`font-mono ${latency > 200 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {latency > 0 ? `${latency} ms` : '--'}
              </span>
            </div>

            {/* Latency Sparkline Bar Visualization */}
            <div className="flex items-end space-x-1.5 h-7 pt-1">
              {(result?.latency_history || [20, 25, 30, 28, 35, latency || 25]).map((val, idx) => {
                const heightPercent = Math.min(100, Math.max(15, (val / 250) * 100));
                const barColor = val > 200 ? 'bg-amber-500' : val > 350 ? 'bg-rose-500' : 'bg-emerald-500';
                return (
                  <div
                    key={idx}
                    style={{ height: `${heightPercent}%` }}
                    className={`flex-1 rounded-t-sm ${barColor} opacity-80 hover:opacity-100 transition-opacity cursor-pointer`}
                    title={`${val} ms`}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          <div className="my-4 p-3 rounded-2xl bg-slate-950/30 border border-slate-800/30 text-center select-none">
            <p className="text-xs text-slate-400">Polling is disabled for this service.</p>
          </div>
        )}

        {/* Dynamic Checks Grid */}
        {isEnabled && (
          <div className="grid grid-cols-2 gap-2 mb-4 select-none">
            {Object.entries(checks).map(([key, check]: [string, DynamicCheck]) => {
              const isOk = check.status === 'ok';
              const isWarning = check.status === 'warning';
              const isCritical = check.status === 'critical';

              const statusText = isOk ? 'OK' : isWarning ? 'WARN' : isCritical ? 'FAIL' : 'UNKNOWN';
              const textColor = isOk ? 'text-emerald-400' : isWarning ? 'text-amber-400' : 'text-rose-400';

              return (
                <div 
                  key={key} 
                  className={`p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/50 flex items-center justify-between ${check.message ? 'cursor-help' : ''}`}
                  title={check.message ? `${check.name}: ${check.message}` : check.name}
                >
                  <div className="flex items-center space-x-2 truncate">
                    {getCheckIcon(check.type)}
                    <span className="text-xs font-semibold text-slate-300 truncate">
                      {check.name}
                    </span>
                  </div>
                  <span className={`text-xs font-bold font-mono ${textColor}`}>
                    {statusText}
                  </span>
                </div>
              );
            })}

            {/* Queue Pending Counter */}
            <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-semibold text-slate-300">Pending Jobs</span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-200">
                {pendingJobs}
              </span>
            </div>

            {/* SSL Cert Check */}
            <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-300">SSL Cert</span>
              </div>
              <span className={`text-xs font-bold ${ssl?.days_remaining && ssl.days_remaining < 14 ? 'text-amber-400 font-bold' : 'text-emerald-400'}`}>
                {ssl?.days_remaining ? `${ssl.days_remaining}d` : 'Valid'}
              </span>
            </div>
          </div>
        )}

        {/* System Telemetry Bar (RAM, CPU, Disk) */}
        {isEnabled && metrics && (
          <div className="mb-4 p-2.5 rounded-xl bg-slate-950/30 border border-slate-800/40 flex items-center justify-around text-[11px] text-slate-400 font-mono select-none">
            {metrics.memory_usage_mb && (
              <span title="PHP Memory Usage">RAM: <strong className="text-slate-200">{metrics.memory_usage_mb} MB</strong></span>
            )}
            {metrics.cpu_load_percent && (
              <span title="Server CPU Load">CPU: <strong className="text-slate-200">{metrics.cpu_load_percent}%</strong></span>
            )}
            {metrics.disk_free_gb && (
              <span title="Free Disk Space">Free Storage: <strong className="text-emerald-400">{metrics.disk_free_gb} GB</strong></span>
            )}
          </div>
        )}

        {/* Failed Jobs Alert Counter & Inspector Button */}
        {isEnabled && failedJobsCount > 0 && (
          <button
            onClick={() => openQueueInspector({ config, lastResult: result })}
            className="w-full mb-4 p-2.5 rounded-2xl bg-rose-950/50 border border-rose-800/60 hover:bg-rose-900/60 active:scale-[0.98] transition-all flex items-center justify-between text-rose-300 group/btn cursor-pointer select-none"
            aria-label="Inspect Failed Job Exception Traces"
          >
            <div className="flex items-center space-x-2 text-xs font-bold">
              <AlertOctagon className="w-4 h-4 text-rose-400 animate-bounce" />
              <span>{failedJobsCount} Failed Jobs (24h)</span>
            </div>
            <span className="text-xs font-semibold underline group-hover/btn:text-white">
              Inspect Traces →
            </span>
          </button>
        )}
      </div>

      {/* Card Footer Controls */}
      <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between select-none">
        <span className="text-[11px] text-slate-400 font-mono">
          {isEnabled ? `Polled: ${result?.polled_at ? new Date(result.polled_at).toLocaleTimeString() : 'Pending'}` : 'Polling Disabled'}
        </span>

        <div className="flex items-center space-x-1.5">
          {/* Enable / Disable Toggle Button */}
          {user?.role !== 'viewer' && (
            <button
              onClick={() => toggleEnableService(config.id)}
              className={`p-1.5 rounded-lg transition-all text-xs font-semibold flex items-center space-x-1 cursor-pointer active:scale-95 ${
                isEnabled
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 hover:bg-emerald-900/60'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200'
              }`}
              title={isEnabled ? 'Disable Polling for this Service' : 'Enable Polling for this Service'}
              aria-label={isEnabled ? 'Disable Polling' : 'Enable Polling'}
            >
              {isEnabled ? <Power className="w-3.5 h-3.5" /> : <PowerOff className="w-3.5 h-3.5 text-rose-400" />}
              <span className="hidden sm:inline">{isEnabled ? 'Enabled' : 'Disabled'}</span>
            </button>
          )}

          {/* Inspect Horizon / Queue Button */}
          {isEnabled && (
            <button
              onClick={() => openQueueInspector({ config, lastResult: result })}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white active:scale-95 transition-all text-xs font-semibold flex items-center space-x-1 cursor-pointer"
              title="Inspect Queue & Horizon"
              aria-label="Inspect Queue & Horizon"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Queues</span>
            </button>
          )}

          {/* Manual Re-poll */}
          {isEnabled && (
            <button
              onClick={() => triggerPollSingle(config.id)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white active:scale-95 transition-all cursor-pointer"
              title="Poll Service Now"
              aria-label="Poll Service Now"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Toggle Mute / Maintenance */}
          {isEnabled && user?.role !== 'viewer' && (
            <button
              onClick={() => toggleMuteService(config.id)}
              className={`p-1.5 rounded-lg transition-all cursor-pointer active:scale-95 ${
                isMuted
                  ? 'bg-indigo-950 text-indigo-400 border border-indigo-800'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
              }`}
              title={isMuted ? 'Unmute Service' : 'Mute Service (Maintenance)'}
              aria-label={isMuted ? 'Unmute Service' : 'Mute Service'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Edit Service (Admin/Superadmin only) */}
          {(user?.role === 'admin' || user?.role === 'superadmin') && (
            <>
              <button
                onClick={() => openAddModal(config)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white active:scale-95 transition-all cursor-pointer"
                title="Edit Configuration"
                aria-label="Edit Service Configuration"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  if (confirm(`Remove ${config.name} from Ketarisentry monitoring?`)) {
                    deleteService(config.id);
                  }
                }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 active:scale-95 transition-all cursor-pointer"
                title="Delete Service"
                aria-label="Delete Service"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
