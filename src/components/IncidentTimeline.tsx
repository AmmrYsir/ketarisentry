import React from 'react';
import { Activity, Clock } from 'lucide-react';
import { useHealth } from '../hooks/useHealth';

export const IncidentTimeline: React.FC = () => {
  const { incidents } = useHealth();

  if (incidents.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-[6px_6px_16px_rgba(0,0,0,0.4)] text-center select-none">
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
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 mb-4 select-none">
        <Activity className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-bold text-slate-200">Incident Event Timeline</h3>
      </div>

      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {incidents.map((inc) => {
          const isOutage = inc.new_status === 'outage';
          const isDegraded = inc.new_status === 'degraded';

          const badgeBg = isOutage
            ? 'bg-rose-950 text-rose-300 border-rose-800'
            : isDegraded
            ? 'bg-amber-950 text-amber-300 border-amber-800'
            : 'bg-emerald-950 text-emerald-300 border-emerald-800';

          return (
            <div
              key={inc.id}
              className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-start space-x-3">
                <div className="w-7 h-7 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-[10px] flex-shrink-0 mt-0.5 select-none">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div>
                  <div className="flex items-center space-x-2 select-none">
                    <span className="font-bold text-slate-200">{inc.service_name}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${badgeBg}`}>
                      {inc.previous_status} → {inc.new_status}
                    </span>
                  </div>
                  <p className="text-slate-400 mt-1">{inc.reason}</p>
                </div>
              </div>

              <span className="text-[11px] font-mono text-slate-400 flex-shrink-0 self-end sm:self-center select-none">
                {inc.timestamp}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
