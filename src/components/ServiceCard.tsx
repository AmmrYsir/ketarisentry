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
import type { LucideIcon } from 'lucide-react';
import type { ServiceConfig, PollResult, HealthStatus, DynamicCheck, CheckType } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useHealth } from '../hooks/useHealth';

interface ServiceCardProps {
  config: ServiceConfig;
  result?: PollResult;
  viewMode?: 'grid' | 'table';
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ config, result, viewMode = 'grid' }) => {
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
  let statusBg = 'bg-emerald-950/40 border-emerald-800/40 text-emerald-400';
  let statusDot = 'bg-emerald-400 glow-dot-emerald';
  let statusText = 'Operational';
  let StatusIcon: LucideIcon = CheckCircle2;

  if (!isEnabled) {
    statusBg = 'bg-slate-950/80 border-slate-800 text-slate-400';
    statusDot = 'bg-slate-500';
    statusText = 'Disabled';
    StatusIcon = PowerOff;
  } else if (status === 'degraded') {
    statusBg = 'bg-amber-950/40 border-amber-800/40 text-amber-400';
    statusDot = 'bg-amber-400 glow-dot-amber';
    statusText = 'Degraded';
    StatusIcon = AlertTriangle;
  } else if (status === 'outage') {
    statusBg = 'bg-rose-950/40 border-rose-800/40 text-rose-400';
    statusDot = 'bg-rose-400 glow-dot-rose';
    statusText = 'Outage';
    StatusIcon = XCircle;
  } else if (status === 'maintenance') {
    statusBg = 'bg-indigo-950/40 border-indigo-800/40 text-indigo-400';
    statusDot = 'bg-indigo-400 glow-dot-indigo';
    statusText = 'Muted';
    StatusIcon = Clock;
  }

  // Env styling
  const envBg =
    config.environment === 'production'
      ? 'bg-rose-950/50 text-rose-300 border-rose-800/40'
      : config.environment === 'staging'
      ? 'bg-amber-950/50 text-amber-300 border-amber-800/40'
      : 'bg-slate-800/70 text-slate-400 border-slate-700/50';

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

  // Sparkline latency values
  const history = result?.latency_history || [22, 28, 25, 30, 24, latency || 26];
  const maxVal = Math.max(...history, 100);
  const minVal = Math.min(...history, 0);

  // SVG path calculation
  const svgWidth = 240;
  const svgHeight = 32;
  const points = history.map((val, idx) => {
    const x = (idx / (history.length - 1)) * svgWidth;
    const y = svgHeight - ((val - minVal) / (maxVal - minVal || 1)) * (svgHeight - 6) - 3;
    return `${x},${y}`;
  });
  const pathD = `M ${points.join(' L ')}`;
  const areaD = `M 0,${svgHeight} L ${points.join(' L ')} L ${svgWidth},${svgHeight} Z`;

  // RENDER TABLE ROW VIEW
  if (viewMode === 'table') {
    return (
      <div className={`p-3.5 rounded-xl linear-card flex items-center justify-between gap-4 transition-all ${isEnabled ? '' : 'opacity-70'}`}>
        <div className="flex items-center space-x-3 truncate flex-1 min-w-[200px]">
          <span className={`w-2 h-2 rounded-full shrink-0 ${statusDot}`} />
          <div className="truncate">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-100 truncate">{config.name}</span>
              <span className={`text-[9px] font-mono uppercase px-2 py-0.2 rounded-full border ${envBg}`}>
                {config.environment}
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400 truncate block">{config.url}</span>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${statusBg}`}>
          <StatusIcon className="w-3 h-3" />
          <span>{statusText}</span>
        </div>

        {/* Latency */}
        <div className="text-right shrink-0 w-20">
          <span className={`font-mono text-xs font-bold ${latency > 200 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {latency > 0 ? `${latency} ms` : '--'}
          </span>
          <span className="text-[10px] text-slate-400 block font-mono">latency</span>
        </div>

        {/* Failed jobs badge */}
        {failedJobsCount > 0 && (
          <button
            onClick={() => openQueueInspector({ config, lastResult: result })}
            className="px-2 py-0.5 rounded-lg bg-rose-950/60 border border-rose-800/50 text-rose-300 text-[10px] font-mono font-bold hover:bg-rose-900/60 transition-colors"
          >
            {failedJobsCount} Failed
          </button>
        )}

        {/* Actions Toolbar */}
        <div className="flex items-center space-x-1 shrink-0">
          <button
            onClick={() => triggerPollSingle(config.id)}
            className="p-1.5 rounded-lg linear-btn text-slate-300 hover:text-white cursor-pointer"
            title="Poll Now"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => openQueueInspector({ config, lastResult: result })}
            className="p-1.5 rounded-lg linear-btn text-slate-300 hover:text-white cursor-pointer"
            title="Inspect Queue"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
          {user?.role !== 'viewer' && (
            <button
              onClick={() => toggleEnableService(config.id)}
              className="p-1.5 rounded-lg linear-btn text-slate-300 hover:text-white cursor-pointer"
              title={isEnabled ? 'Disable' : 'Enable'}
            >
              {isEnabled ? <Power className="w-3.5 h-3.5" /> : <PowerOff className="w-3.5 h-3.5 text-rose-400" />}
            </button>
          )}
        </div>
      </div>
    );
  }

  // RENDER GRID CARD VIEW
  return (
    <div className={`rounded-2xl p-5 linear-card flex flex-col justify-between group select-none ${
      isEnabled ? '' : 'opacity-70'
    }`}>
      
      {/* Top Header Row */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div>
            <div className="flex items-center space-x-2 mb-1.5">
              <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${envBg}`}>
                {config.environment}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {config.poll_interval_sec}s poll
              </span>
            </div>
            <h3 className={`text-base font-bold tracking-tight transition-colors ${isEnabled ? 'text-slate-100 group-hover:text-emerald-400' : 'text-slate-400'}`}>
              {config.name}
            </h3>
            <p className="text-xs font-mono text-slate-400 truncate max-w-xs" title={config.url}>
              {config.url}
            </p>
          </div>

          {/* Status Pill Badge */}
          <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full border text-xs font-semibold select-none ${statusBg}`}>
            <span className={`w-2 h-2 rounded-full ${statusDot} ${isEnabled ? 'animate-pulse' : ''}`} />
            <StatusIcon className="w-3.5 h-3.5" />
            <span>{statusText}</span>
          </div>
        </div>

        {/* Error message alert box */}
        {isEnabled && result?.error_message && (
          <div className="my-3 p-3 rounded-xl bg-rose-950/40 border border-rose-900/50 text-rose-300 text-xs font-mono break-all flex items-start gap-2.5 select-text">
            <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-rose-400">Error:</span> {result.error_message}
            </div>
          </div>
        )}

        {/* Latency Sparkline */}
        {isEnabled ? (
          <div className="my-3.5 p-3 rounded-xl linear-well">
            <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
              <span className="flex items-center space-x-1.5 font-medium">
                <Server className="w-3.5 h-3.5 text-slate-400" />
                <span>Response Latency</span>
              </span>
              <span className={`font-mono text-sm font-bold ${latency > 200 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {latency > 0 ? `${latency} ms` : '--'}
              </span>
            </div>

            {/* SVG Curve Sparkline */}
            <div className="w-full h-8 pt-1">
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id={`sparkline-grad-${config.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={latency > 200 ? '#f59e0b' : '#10b981'} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={latency > 200 ? '#f59e0b' : '#10b981'} stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d={areaD} fill={`url(#sparkline-grad-${config.id})`} />
                <path
                  d={pathD}
                  fill="none"
                  stroke={latency > 200 ? '#f59e0b' : '#10b981'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        ) : (
          <div className="my-3.5 p-3 rounded-xl linear-well text-center">
            <p className="text-xs text-slate-400 font-medium">Polling is disabled for this service endpoint.</p>
          </div>
        )}

        {/* Dynamic Health Checks Grid */}
        {isEnabled && (
          <div className="grid grid-cols-2 gap-2 mb-3.5">
            {Object.entries(checks).map(([key, check]: [string, DynamicCheck]) => {
              const isOk = check.status === 'ok';
              const isWarning = check.status === 'warning';
              const isCritical = check.status === 'critical';

              const checkStatusText = isOk ? 'OK' : isWarning ? 'WARN' : isCritical ? 'FAIL' : 'UNKNOWN';
              const textColor = isOk ? 'text-emerald-400' : isWarning ? 'text-amber-400' : 'text-rose-400';

              return (
                <div 
                  key={key} 
                  className={`p-2.5 rounded-xl linear-well flex items-center justify-between ${check.message ? 'cursor-help' : ''}`}
                  title={check.message ? `${check.name}: ${check.message}` : check.name}
                >
                  <div className="flex items-center space-x-2 truncate">
                    {getCheckIcon(check.type)}
                    <span className="text-xs font-semibold text-slate-300 truncate">
                      {check.name}
                    </span>
                  </div>
                  <span className={`text-xs font-bold font-mono ${textColor}`}>
                    {checkStatusText}
                  </span>
                </div>
              );
            })}

            {/* Queue Pending Counter */}
            <div className="p-2.5 rounded-xl linear-well flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-semibold text-slate-300">Pending Jobs</span>
              </div>
              <span className="text-xs font-mono font-bold text-amber-300">
                {pendingJobs}
              </span>
            </div>

            {/* SSL Cert Check */}
            <div className="p-2.5 rounded-xl linear-well flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-300">SSL Cert</span>
              </div>
              <span className={`text-xs font-bold ${ssl?.days_remaining && ssl.days_remaining < 14 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {ssl?.days_remaining ? `${ssl.days_remaining}d left` : 'Valid'}
              </span>
            </div>
          </div>
        )}

        {/* System Telemetry Bar (RAM, CPU, Disk) */}
        {isEnabled && metrics && (
          <div className="mb-3.5 p-2 rounded-xl linear-well flex items-center justify-around text-[11px] text-slate-400 font-mono">
            {metrics.memory_usage_mb && (
              <span title="PHP Memory Usage">RAM: <strong className="text-slate-200">{metrics.memory_usage_mb} MB</strong></span>
            )}
            {metrics.cpu_load_percent && (
              <span title="Server CPU Load">CPU: <strong className="text-slate-200">{metrics.cpu_load_percent}%</strong></span>
            )}
            {metrics.disk_free_gb && (
              <span title="Free Disk Space">Disk: <strong className="text-emerald-400">{metrics.disk_free_gb} GB</strong></span>
            )}
          </div>
        )}

        {/* Failed Jobs Alert Counter & Inspector Trigger */}
        {isEnabled && failedJobsCount > 0 && (
          <button
            onClick={() => openQueueInspector({ config, lastResult: result })}
            className="w-full mb-3.5 p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/50 hover:bg-rose-900/40 active:scale-[0.98] transition-all flex items-center justify-between text-rose-300 group/btn cursor-pointer"
            aria-label="Inspect Failed Job Exception Traces"
          >
            <div className="flex items-center space-x-2 text-xs font-bold">
              <AlertOctagon className="w-4 h-4 text-rose-400 animate-bounce" />
              <span>{failedJobsCount} Failed Jobs (24h)</span>
            </div>
            <span className="text-xs font-bold underline group-hover/btn:text-white">
              Inspect Traces →
            </span>
          </button>
        )}
      </div>

      {/* Card Footer Controls */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <span className="text-[11px] text-slate-400 font-mono">
          {isEnabled ? `Polled: ${result?.polled_at ? new Date(result.polled_at).toLocaleTimeString() : 'Pending'}` : 'Polling Disabled'}
        </span>

        <div className="flex items-center space-x-1.5">
          {/* Enable / Disable Toggle Button */}
          {user?.role !== 'viewer' && (
            <button
              onClick={() => toggleEnableService(config.id)}
              className={`px-2.5 py-1.5 rounded-xl transition-all text-xs font-semibold flex items-center space-x-1 cursor-pointer active:scale-95 border ${
                isEnabled
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50 hover:bg-emerald-900/50'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
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
              className="p-1.5 rounded-xl linear-btn text-slate-300 hover:text-white text-xs font-semibold flex items-center space-x-1 cursor-pointer"
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
              className="p-1.5 rounded-xl linear-btn text-slate-300 hover:text-white cursor-pointer"
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
              className={`p-1.5 rounded-xl transition-all cursor-pointer border active:scale-95 ${
                isMuted
                  ? 'bg-indigo-950 text-indigo-400 border-indigo-800'
                  : 'linear-btn text-slate-300 hover:text-white'
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
                className="p-1.5 rounded-xl linear-btn text-slate-300 hover:text-white cursor-pointer"
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
                className="p-1.5 rounded-xl linear-btn text-slate-400 hover:text-rose-300 cursor-pointer"
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
