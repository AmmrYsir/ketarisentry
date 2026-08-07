import React from 'react';
import { Activity, AlertTriangle, XCircle, CheckCircle2, Clock } from 'lucide-react';
import { useHealth } from '../context/HealthContext';

export const IncidentTimeline: React.FC = () => {
  const { incidents } = useHealth();

  if (incidents.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-[6px_6px_16px_rgba(0,0,0,0.4)] text-center">
        <div className="w-10 h-10 rounded-2xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400 mx-auto mb-3">
          <Activity className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-slate-200">System Fleet Nominal</h3>
        <p className="text-xs text-slate-400 mt-1">No health state transitions or outage incidents recorded during this session.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-[6px_6px_16px_rgba(0,0,0,0.4)]">
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 mb-4">
        <Activity className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-bold text-slate-200">Incident Event Timeline</h3>
      </div>

      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {incidents.map((inc) => {
          const isOutage = inc.new_status === 'outage';
          const isDegraded = inc.new_status === 'degraded';

          let iconColor = 'text-emerald-400';
          let borderAccent = 'border-emerald-800/50';
          let StatusIcon = CheckCircle2;

          if (isOutage) {
            iconColor = 'text-rose-400';
            borderAccent = 'border-rose-800/50';
            StatusIcon = XCircle;
          } else if (isDegraded) {
            iconColor = 'text-amber-400';
            borderAccent = 'border-amber-800/50';
            StatusIcon = AlertTriangle;
          }

          return (
            <div
              key={inc.id}
              className={`p-3.5 rounded-2xl bg-slate-950/60 border ${borderAccent} flex items-start justify-between gap-3 text-xs`}
            >
              <div className="flex items-start space-x-3">
                <StatusIcon className={`w-4 h-4 ${iconColor} mt-0.5 flex-shrink-0`} />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-200">{inc.service_name}</span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {inc.previous_status} → {inc.new_status}
                    </span>
                  </div>
                  <p className="text-slate-400 mt-1">{inc.reason}</p>
                </div>
              </div>

              <span className="text-[11px] font-mono text-slate-400 flex items-center space-x-1 flex-shrink-0">
                <Clock className="w-3 h-3" />
                <span>{inc.timestamp}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
