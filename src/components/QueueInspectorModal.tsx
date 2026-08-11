import React, { useState } from 'react';
import { 
  X, 
  Layers, 
  AlertOctagon, 
  Copy, 
  Check, 
  RefreshCw, 
  ChevronDown, 
  ChevronRight,
  Terminal,
  Activity,
  ShieldCheck
} from 'lucide-react';
import { useHealth } from '../hooks/useHealth';
import type { FailedJobTrace } from '../types';

export const QueueInspectorModal: React.FC = () => {
  const { selectedServiceForInspector, closeQueueInspector, triggerPollSingle } = useHealth();
  
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [filterQueue, setFilterQueue] = useState<string>('all');

  if (!selectedServiceForInspector) return null;

  const { config, lastResult } = selectedServiceForInspector;
  const queue = lastResult?.queue;
  const failedJobs: FailedJobTrace[] = queue?.recent_failed_jobs || [];

  const handleCopyTrace = (jobId: string, trace: string) => {
    navigator.clipboard.writeText(trace);
    setCopiedId(jobId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredFailedJobs = failedJobs.filter((j: FailedJobTrace) => {
    if (filterQueue === 'all') return true;
    return j.queue === filterQueue;
  });

  const uniqueQueues = Array.from(new Set(failedJobs.map((j: FailedJobTrace) => j.queue)));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#090d16] border-l border-slate-800/80 h-full flex flex-col shadow-2xl overflow-hidden">
        
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between select-none bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-800/40 flex items-center justify-center text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-extrabold text-slate-100">{config.name}</h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60 uppercase">
                  Queue Telemetry
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">{config.url}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => triggerPollSingle(config.id)}
              className="p-2 rounded-xl linear-btn text-slate-300 hover:text-white cursor-pointer"
              title="Refresh Queue Telemetry"
              aria-label="Refresh Telemetry"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={closeQueueInspector}
              className="p-2 rounded-xl linear-btn text-slate-400 hover:text-white cursor-pointer"
              aria-label="Close Inspector Drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Telemetry Stats Grid */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          
          {/* Horizon Worker Status Card */}
          <div className="p-4 rounded-xl linear-card select-none">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-200">Laravel Horizon & Supervisor Status</h3>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                queue?.horizon_active
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40'
                  : 'bg-amber-950/60 text-amber-400 border-amber-800/40'
              }`}>
                {queue?.horizon_active ? 'RUNNING' : 'INACTIVE'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2.5 rounded-xl linear-well">
                <span className="text-[11px] text-slate-400 font-semibold block">Workers</span>
                <span className="text-sm font-mono font-bold text-slate-100">{queue?.horizon_active ? 'Active' : 'Standby'}</span>
              </div>
              <div className="p-2.5 rounded-xl linear-well">
                <span className="text-[11px] text-slate-400 font-semibold block">Pending Jobs</span>
                <span className="text-sm font-mono font-bold text-amber-300">{queue?.pending_jobs || 0}</span>
              </div>
              <div className="p-2.5 rounded-xl linear-well">
                <span className="text-[11px] text-slate-400 font-semibold block">Failed (24h)</span>
                <span className={`text-sm font-mono font-bold ${(queue?.failed_jobs_24h || 0) > 0 ? 'text-rose-400' : 'text-slate-200'}`}>
                  {queue?.failed_jobs_24h || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Active Queues Breakdown */}
          {queue?.queues && Object.keys(queue.queues).length > 0 && (
            <div className="select-none">
              <h3 className="text-xs font-bold text-slate-300 mb-2.5">Active Queue Connections</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(queue.queues).map(([qName, count]) => (
                  <div key={qName} className="p-2.5 rounded-xl linear-well flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-slate-300">{qName}</span>
                    <span className="text-xs font-mono font-bold text-indigo-400">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Failed Jobs List */}
          <div>
            <div className="flex items-center justify-between mb-3 select-none">
              <div className="flex items-center space-x-2">
                <AlertOctagon className="w-4 h-4 text-rose-400" />
                <h3 className="text-xs font-bold text-slate-200">Failed Job Exceptions</h3>
                <span className="text-xs font-mono font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-800/40">
                  {failedJobs.length}
                </span>
              </div>

              {/* Queue Filter */}
              {uniqueQueues.length > 1 && (
                <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                  <span>Queue:</span>
                  <select
                    value={filterQueue}
                    onChange={(e) => setFilterQueue(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="all">All Queues</option>
                    {uniqueQueues.map((q) => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {filteredFailedJobs.length === 0 ? (
              <div className="p-8 text-center linear-card select-none">
                <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                <p className="text-xs font-bold text-slate-200">Zero Failed Jobs</p>
                <p className="text-[11px] text-slate-400 mt-1">All queue workers are executing jobs cleanly without exceptions.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFailedJobs.map((job: FailedJobTrace) => {
                  const isExpanded = expandedJobId === job.id;
                  return (
                    <div key={job.id} className="rounded-xl linear-card overflow-hidden">
                      {/* Job Header */}
                      <div
                        onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                        className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-800/30 transition-colors select-none"
                      >
                        <div className="flex items-center space-x-3 truncate">
                          <button className="text-slate-400">
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-emerald-400" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                          <div className="truncate">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-bold text-rose-300 font-mono truncate">{job.exception_class}</span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/50">
                                {job.queue}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 truncate mt-0.5 font-medium">{job.message}</p>
                          </div>
                        </div>

                        <span className="text-[11px] font-mono text-slate-400 shrink-0 ml-3">
                          {new Date(job.failed_at).toLocaleTimeString()}
                        </span>
                      </div>

                      {/* Expandable Trace Viewport */}
                      {isExpanded && (
                        <div className="p-4 border-t border-slate-800/80 bg-slate-950/90 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-mono text-slate-400 flex items-center space-x-1.5">
                              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                              <span>Job: {job.job_name} &bull; ID: {job.id}</span>
                            </span>
                            <button
                              onClick={() => handleCopyTrace(job.id, job.trace)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer border border-slate-700/60"
                            >
                              {copiedId === job.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedId === job.id ? 'Copied' : 'Copy Trace'}</span>
                            </button>
                          </div>

                          {/* Exception Trace Code Block */}
                          <pre className="p-3 rounded-xl bg-[#030712] border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-56 leading-relaxed select-text">
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

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-800/80 select-none bg-slate-950/60 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>Target: {config.name}</span>
          <button
            onClick={closeQueueInspector}
            className="px-4 py-2 rounded-xl linear-btn text-slate-200 font-semibold cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
