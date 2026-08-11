import React from 'react';
import { Activity, CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { useHealth } from '../hooks/useHealth';
import type { HealthStatus, Incident } from '../types';

export const IncidentTimeline: React.FC = () => {
  const { incidents } = useHealth();

  const getStatusIcon = (status: HealthStatus) => {
    switch (status) {
      case 'operational':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'degraded':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'outage':
        return <XCircle className="w-4 h-4 text-rose-400" />;
      case 'maintenance':
        return <Clock className="w-4 h-4 text-indigo-400" />;
      default:
        return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusBorder = (status: HealthStatus) => {
    switch (status) {
      case 'operational':
        return 'border-l-emerald-500';
      case 'degraded':
        return 'border-l-amber-500';
      case 'outage':
        return 'border-l-rose-500';
      case 'maintenance':
        return 'border-l-indigo-500';
      default:
        return 'border-l-slate-700';
    }
  };

  return (
    <div className="rounded-2xl p-5 linear-card select-none">
      {/* Timeline Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3.5 mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-800/40 flex items-center justify-center text-indigo-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Incident & Health Event Log</h3>
            <p className="text-xs text-slate-400">Chronological telemetry transitions & alerts</p>
          </div>
        </div>
      </div>

      {/* Timeline Event List */}
      {incidents.length === 0 ? (
        <div className="p-6 text-center linear-well rounded-xl">
          <p className="text-xs font-semibold text-slate-400">No recent health status transitions recorded.</p>
          <p className="text-[11px] text-slate-500 mt-1 font-mono">System telemetry is stable across all endpoints.</p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {incidents.map((log: Incident) => (
            <div
              key={log.id}
              className={`p-3 rounded-xl linear-well border-l-4 ${getStatusBorder(log.new_status)} flex items-center justify-between gap-3 text-xs`}
            >
              <div className="flex items-center space-x-3 truncate">
                {getStatusIcon(log.new_status)}
                <div className="truncate">
                  <span className="font-bold text-slate-200">{log.service_name}</span>
                  <span className="text-slate-400 font-medium"> transitioned from </span>
                  <span className="font-mono font-bold uppercase text-slate-400">{log.previous_status}</span>
                  <span className="text-slate-400 font-medium"> to </span>
                  <span className="font-mono font-bold capitalize text-slate-100">{log.new_status}</span>
                  {log.reason && (
                    <p className="text-slate-400 text-[11px] truncate mt-0.5 font-mono">{log.reason}</p>
                  )}
                </div>
              </div>

              <span className="text-[11px] font-mono text-slate-400 shrink-0">
                {log.timestamp}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
