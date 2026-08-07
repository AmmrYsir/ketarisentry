import React, { useState } from 'react';
import { X, Layers, AlertOctagon, CheckCircle2, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import { useHealth } from '../hooks/useHealth';
import type { FailedJobTrace } from '../types';

export const QueueInspectorModal: React.FC = () => {
  const { selectedServiceForInspector, closeQueueInspector } = useHealth();
  const [expandedTraceId, setExpandedTraceId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!selectedServiceForInspector) return null;

  const { config, lastResult } = selectedServiceForInspector;
  const queue = lastResult?.queue;
  const failedJobs = queue?.recent_failed_jobs || [];

  const handleCopyTrace = (trace: string, id: string) => {
    navigator.clipboard.writeText(trace);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-[8px_8px_24px_rgba(0,0,0,0.6)] relative my-8">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800/80 pb-4 mb-5 select-none">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-950/80 border border-amber-800/60 flex items-center justify-center text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">{config.name} Queue & Horizon Inspector</h2>
              <p className="text-xs text-slate-400">Redis Connection Queues & Failed Job Telemetry</p>
            </div>
          </div>

          <button
            onClick={closeQueueInspector}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 active:scale-95 transition-all cursor-pointer"
            aria-label="Close Inspector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Horizon Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 select-none">
          {/* Horizon Status */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/60 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4)]">
            <span className="text-xs text-slate-400 font-semibold block mb-1">Laravel Horizon</span>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-bold text-emerald-400">Workers Active</span>
            </div>
          </div>

          {/* Pending Queue Count */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/60 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4)]">
            <span className="text-xs text-slate-400 font-semibold block mb-1">Pending Jobs</span>
            <span className="text-lg font-mono font-bold text-slate-100">
              {queue?.pending_jobs || 0}
            </span>
          </div>

          {/* Failed Jobs Count */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/60 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4)]">
            <span className="text-xs text-slate-400 font-semibold block mb-1">Failed Jobs (24h)</span>
            <span className={`text-lg font-mono font-bold ${(queue?.failed_jobs_24h || 0) > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {queue?.failed_jobs_24h || 0}
            </span>
          </div>
        </div>

        {/* Queues Breakdown */}
        {queue?.queues && Object.keys(queue.queues).length > 0 && (
          <div className="mb-6 select-none">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Active Queue Connections</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(queue.queues).map(([qName, count]) => (
                <div key={qName} className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/50 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-300 font-semibold">{qName}</span>
                  <span className="text-xs font-mono font-bold text-indigo-400">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Failed Job Traces Section */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between select-none">
            <span>Recent Failed Job Exception Traces ({failedJobs.length})</span>
            {failedJobs.length > 0 && <span className="text-rose-400 text-[10px] lowercase font-normal">click to expand stack trace</span>}
          </h3>

          {failedJobs.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800/50 select-none">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-200">No Failed Jobs Recorded!</p>
              <p className="text-xs text-slate-400 mt-1">Laravel Horizon workers are processing all queue connections cleanly.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {failedJobs.map((job: FailedJobTrace) => {
                const isExpanded = expandedTraceId === job.id;
                return (
                  <div
                    key={job.id}
                    className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 hover:border-slate-700 transition-colors"
                  >
                    <div
                      className="flex items-start justify-between cursor-pointer select-none"
                      onClick={() => setExpandedTraceId(isExpanded ? null : job.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <AlertOctagon className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold font-mono text-slate-200">{job.job_name}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300">
                              queue: {job.queue}
                            </span>
                          </div>
                          <p className="text-xs text-rose-300 mt-1 font-semibold">{job.exception_class}</p>
                          <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">{job.message}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 text-slate-400">
                        <span className="text-[11px] font-mono">{job.failed_at}</span>
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </div>
                    </div>

                    {/* Expanded Stack Trace */}
                    {isExpanded && (
                      <div className="mt-4 pt-3 border-t border-slate-800/80">
                        <div className="flex items-center justify-between mb-2 select-none">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Full Exception Trace</span>
                          <button
                            onClick={() => handleCopyTrace(job.trace, job.id)}
                            className="flex items-center space-x-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                          >
                            {copiedId === job.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedId === job.id ? 'Copied!' : 'Copy Trace'}</span>
                          </button>
                        </div>
                        <pre className="p-3 bg-slate-900 rounded-xl text-[11px] font-mono text-slate-300 overflow-x-auto border border-slate-800 leading-relaxed whitespace-pre-wrap max-h-48">
                          {job.trace}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
