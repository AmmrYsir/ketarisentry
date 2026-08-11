import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  AlertTriangle, 
  AlertOctagon, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Check, 
  Download, 
  ShieldAlert, 
  Terminal, 
  Wrench
} from 'lucide-react';
import type { Incident } from '../types';

interface IncidentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  incident: Incident | null;
}

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  isOpen,
  onClose,
  incident,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !incident) return null;

  const handleCopyJson = () => {
    const payload = JSON.stringify(incident, null, 2);
    navigator.clipboard.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadReport = () => {
    const payload = JSON.stringify(incident, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incident_report_${incident.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'outage':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-800/50">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
            <span className="uppercase">Outage</span>
          </span>
        );
      case 'degraded':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-800/50">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="uppercase">Degraded</span>
          </span>
        );
      case 'operational':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/50">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="uppercase">Operational</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
            <span className="uppercase">{status}</span>
          </span>
        );
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative my-8 font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6 select-none">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-800/60 flex items-center justify-center text-rose-400 shadow-md">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-100">Incident Diagnostic & Event Log</h3>
              <p className="text-xs text-slate-400 font-mono">Incident Ref: {incident.id}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700/80 active:scale-95 transition-all border border-slate-700/60 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="space-y-5">
          
          {/* Service & State Transition Summary */}
          <div className="p-4 rounded-2xl linear-well border border-slate-800/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Target Service</span>
                <strong className="text-sm text-slate-100 font-extrabold">{incident.service_name}</strong>
              </div>
              <div className="flex items-center space-x-2 text-xs font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-300">{incident.timestamp}</span>
              </div>
            </div>

            {/* Transition Flow */}
            <div className="flex items-center justify-between pt-1 select-none">
              <div>
                <span className="text-[10px] text-slate-400 font-mono block mb-1">Previous Status</span>
                {getStatusBadge(incident.previous_status)}
              </div>

              <div className="text-slate-500 font-mono text-xs px-2 font-bold">➔</div>

              <div>
                <span className="text-[10px] text-slate-400 font-mono block mb-1">Current Status</span>
                {getStatusBadge(incident.new_status)}
              </div>
            </div>
          </div>

          {/* Root Cause Reason Monospace Inspector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between select-none">
              <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5 font-mono">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                <span>Error Reason & Stack Diagnostic</span>
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-rose-300 break-all select-text leading-relaxed">
              {incident.reason || 'No detailed diagnostic payload available.'}
            </div>
          </div>

          {/* Recommended Actionable Developer Guidance */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <span className="text-xs font-bold text-slate-200 flex items-center space-x-1.5 font-mono">
              <Wrench className="w-3.5 h-3.5 text-amber-400" />
              <span>Recommended Remediation Protocol</span>
            </span>
            <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside font-sans">
              {incident.new_status === 'outage' ? (
                <>
                  <li>Verify HTTP health endpoint connectivity and web server listener (`Nginx / Apache / PHP-FPM`).</li>
                  <li>Check target service CORS headers and `X-Ketari-Secret` key configuration.</li>
                  <li>Inspect application log files for unhandled exceptions or memory limit overflow.</li>
                </>
              ) : incident.new_status === 'degraded' ? (
                <>
                  <li>Check database query execution time and connection pool saturation.</li>
                  <li>Inspect Horizon queue worker latency and pending job backlog volume.</li>
                </>
              ) : (
                <>
                  <li>Service has recovered to Operational status. Continue monitoring telemetry curves.</li>
                </>
              )}
            </ul>
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between select-none">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleCopyJson}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700/60 active:scale-95 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copied ? 'Copied JSON!' : 'Copy Incident JSON'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadReport}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700/60 active:scale-95 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>Export Report</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all border border-emerald-500/50 cursor-pointer"
            >
              Done
            </button>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
};
