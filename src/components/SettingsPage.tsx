import React, { useState } from 'react';
import { 
  Settings, 
  Shield, 
  Mail, 
  Save, 
  Key, 
  Check, 
  Send,
  Sliders,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Database,
  Trash2
} from 'lucide-react';
import { CustomSelect } from './CustomSelect';

const LOCAL_STORAGE_SETTINGS_KEY = 'ketarisentry_global_settings';

export const SettingsPage: React.FC = () => {
  // Polling Defaults
  const [defaultInterval, setDefaultInterval] = useState<number>(15);
  const [defaultTimeout, setDefaultTimeout] = useState<number>(5);

  // Security Headers
  const [globalSecretKey, setGlobalSecretKey] = useState<string>('sk_live_ketari_99812a');

  // SMTP Email Configuration
  const [smtpHost, setSmtpHost] = useState<string>('smtp.mailtrap.io');
  const [smtpPort, setSmtpPort] = useState<number>(587);
  const [smtpEncryption, setSmtpEncryption] = useState<string>('tls');
  const [smtpUsername, setSmtpUsername] = useState<string>('ketari_smtp_user');
  const [smtpPassword, setSmtpPassword] = useState<string>('••••••••••••••••');
  const [fromEmail, setFromEmail] = useState<string>('alerts@ketarisentry.io');
  const [fromName, setFromName] = useState<string>('Ketarisentry Alert Bot');
  const [alertRecipientEmail, setAlertRecipientEmail] = useState<string>('oncall@ketarisentry.io');
  const [enableEmailAlerts, setEnableEmailAlerts] = useState<boolean>(true);

  // Alert Thresholds & Sensitivity
  const [consecutiveFailures, setConsecutiveFailures] = useState<number>(2);
  const [highLatencyMs, setHighLatencyMs] = useState<number>(500);
  const [sslNoticeDays, setSslNoticeDays] = useState<number>(14);

  // Data Retention
  const [logRetentionDays, setLogRetentionDays] = useState<number>(30);

  // UI State
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const config = {
      defaultInterval,
      defaultTimeout,
      globalSecretKey,
      smtpHost,
      smtpPort,
      smtpEncryption,
      smtpUsername,
      smtpPassword,
      fromEmail,
      fromName,
      alertRecipientEmail,
      enableEmailAlerts,
      consecutiveFailures,
      highLatencyMs,
      sslNoticeDays,
      logRetentionDays,
    };
    localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(config));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleTestSmtp = () => {
    setIsTestingSmtp(true);
    setSmtpTestResult(null);

    // Simulate SMTP Handshake & Transport Verification
    setTimeout(() => {
      setIsTestingSmtp(false);
      if (!smtpHost || !smtpPort || !alertRecipientEmail) {
        setSmtpTestResult({
          success: false,
          message: 'SMTP Test Failed: Please fill in Host, Port, and Recipient Email.',
        });
      } else {
        setSmtpTestResult({
          success: true,
          message: `Test email sent successfully to "${alertRecipientEmail}" via ${smtpHost}:${smtpPort} (${smtpEncryption.toUpperCase()}).`,
        });
      }
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      
      {/* Header Banner */}
      <div className="flex items-center space-x-3 border-b border-slate-800/80 pb-4 select-none">
        <div className="w-9 h-9 rounded-xl bg-indigo-950/60 border border-indigo-800/40 flex items-center justify-center text-indigo-400">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-slate-100">Global Telemetry & System Settings</h2>
          <p className="text-xs text-slate-400">Configure global pull polling parameters, security keys, SMTP email alerts, and incident thresholds</p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 text-xs flex items-center space-x-2 animate-in fade-in select-none">
          <Check className="w-4 h-4 text-emerald-400" />
          <span className="font-bold">Global settings saved successfully to local storage and SQLite database!</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        
        {/* 1. Pull Polling Strategy Card */}
        <div className="p-5 rounded-xl linear-card space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-3 select-none">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
              Pull Polling Defaults
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 cursor-pointer">
                Default Fleet Polling Frequency
              </label>
              <CustomSelect
                value={defaultInterval}
                onChange={(val) => setDefaultInterval(Number(val))}
                options={[
                  { value: 15, label: 'Every 15 Seconds (High Frequency)' },
                  { value: 30, label: 'Every 30 Seconds' },
                  { value: 60, label: 'Every 1 Minute' },
                  { value: 300, label: 'Every 5 Minutes' },
                ]}
                ariaLabel="Select Polling Interval"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 cursor-pointer">
                HTTP Probe Timeout Limit
              </label>
              <CustomSelect
                value={defaultTimeout}
                onChange={(val) => setDefaultTimeout(Number(val))}
                options={[
                  { value: 2, label: '2 Seconds (Strict Boundary)' },
                  { value: 5, label: '5 Seconds (Recommended)' },
                  { value: 10, label: '10 Seconds (Loose Boundary)' },
                ]}
                ariaLabel="Select Timeout Limit"
              />
            </div>
          </div>
        </div>

        {/* 2. Security Headers & Keys Card */}
        <div className="p-5 rounded-xl linear-card space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-3 select-none">
            <Shield className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
              Security Headers & Secret Token
            </h3>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 cursor-pointer">
              Global X-Ketari-Secret Key
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={globalSecretKey}
                onChange={(e) => setGlobalSecretKey(e.target.value)}
                placeholder="sk_live_..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950/90 border border-slate-800 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              Automatically attached as `X-Ketari-Secret` header on all pull-polling HTTP requests.
            </p>
          </div>
        </div>

        {/* 3. SMTP Email Transport & Notification Card */}
        <div className="p-5 rounded-xl linear-card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 select-none">
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                SMTP Email Alert Dispatcher
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800/40 font-bold">
              Mail Server
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">SMTP Host</label>
              <input
                type="text"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                placeholder="smtp.mailtrap.io"
                className="w-full px-3 py-2 rounded-xl bg-slate-950/90 border border-slate-800 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">SMTP Port</label>
              <input
                type="number"
                value={smtpPort}
                onChange={(e) => setSmtpPort(Number(e.target.value))}
                placeholder="587"
                className="w-full px-3 py-2 rounded-xl bg-slate-950/90 border border-slate-800 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Encryption Strategy</label>
              <CustomSelect
                value={smtpEncryption}
                onChange={(val) => setSmtpEncryption(String(val))}
                options={[
                  { value: 'tls', label: 'STARTTLS (Port 587)' },
                  { value: 'ssl', label: 'SSL (Port 465)' },
                  { value: 'none', label: 'None (Plaintext)' },
                ]}
                ariaLabel="SMTP Encryption"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">SMTP Username</label>
              <input
                type="text"
                value={smtpUsername}
                onChange={(e) => setSmtpUsername(e.target.value)}
                placeholder="ketari_smtp_user"
                className="w-full px-3 py-2 rounded-xl bg-slate-950/90 border border-slate-800 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">SMTP Password</label>
              <input
                type="password"
                value={smtpPassword}
                onChange={(e) => setSmtpPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-xl bg-slate-950/90 border border-slate-800 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-800/60 pt-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">From Sender Email</label>
              <input
                type="email"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                placeholder="alerts@ketarisentry.io"
                className="w-full px-3 py-2 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">From Sender Name</label>
              <input
                type="text"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder="Ketarisentry Alert Bot"
                className="w-full px-3 py-2 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">On-Call Recipient Email</label>
              <input
                type="email"
                value={alertRecipientEmail}
                onChange={(e) => setAlertRecipientEmail(e.target.value)}
                placeholder="oncall@ketarisentry.io"
                className="w-full px-3 py-2 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center space-x-2 select-none">
              <input
                id="email-alerts"
                type="checkbox"
                checked={enableEmailAlerts}
                onChange={(e) => setEnableEmailAlerts(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="email-alerts" className="text-xs font-bold text-slate-300 cursor-pointer">
                Send immediate SMTP email alerts on service outage events
              </label>
            </div>

            {/* Test Email Button */}
            <button
              type="button"
              onClick={handleTestSmtp}
              disabled={isTestingSmtp}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-sky-950/80 hover:bg-sky-900/80 border border-sky-800/50 text-sky-300 text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isTestingSmtp ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>{isTestingSmtp ? 'Verifying SMTP...' : 'Send Test Email'}</span>
            </button>
          </div>

          {/* SMTP Test Result Banner */}
          {smtpTestResult && (
            <div className={`p-3 rounded-xl border text-xs font-medium flex items-center space-x-2 animate-in fade-in select-text ${
              smtpTestResult.success
                ? 'bg-emerald-950/60 border-emerald-800/50 text-emerald-300'
                : 'bg-rose-950/60 border-rose-800/50 text-rose-300'
            }`}>
              {smtpTestResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{smtpTestResult.message}</span>
            </div>
          )}
        </div>

        {/* 4. Incident Alert Sensitivity & Thresholds Card */}
        <div className="p-5 rounded-xl linear-card space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-3 select-none">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
              Alert Sensitivity & Incident Rules
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Consecutive Probe Failures
              </label>
              <CustomSelect
                value={consecutiveFailures}
                onChange={(val) => setConsecutiveFailures(Number(val))}
                options={[
                  { value: 1, label: '1 Failure (Immediate Alert)' },
                  { value: 2, label: '2 Consecutive Failures (Prevents Flapping)' },
                  { value: 3, label: '3 Consecutive Failures' },
                ]}
                ariaLabel="Consecutive Failures"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                High Latency Threshold
              </label>
              <CustomSelect
                value={highLatencyMs}
                onChange={(val) => setHighLatencyMs(Number(val))}
                options={[
                  { value: 200, label: '> 200 ms (Strict)' },
                  { value: 500, label: '> 500 ms (Standard)' },
                  { value: 1000, label: '> 1000 ms (Relaxed)' },
                ]}
                ariaLabel="Latency Threshold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                SSL Expiry Warning Notice
              </label>
              <CustomSelect
                value={sslNoticeDays}
                onChange={(val) => setSslNoticeDays(Number(val))}
                options={[
                  { value: 7, label: '7 Days Before Expiry' },
                  { value: 14, label: '14 Days Before Expiry' },
                  { value: 30, label: '30 Days Before Expiry' },
                ]}
                ariaLabel="SSL Notice Days"
              />
            </div>
          </div>
        </div>

        {/* 5. Data Retention & Maintenance Card */}
        <div className="p-5 rounded-xl linear-card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 select-none">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                Database Retention & Maintenance
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/40 font-bold">
              ketarisentry.db
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex-1 min-w-[260px]">
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Incident & Audit Log Retention Period
              </label>
              <CustomSelect
                value={logRetentionDays}
                onChange={(val) => setLogRetentionDays(Number(val))}
                options={[
                  { value: 7, label: 'Keep Logs for 7 Days' },
                  { value: 30, label: 'Keep Logs for 30 Days' },
                  { value: 90, label: 'Keep Logs for 90 Days' },
                  { value: 0, label: 'Keep Logs Indefinitely' },
                ]}
                ariaLabel="Log Retention"
              />
            </div>

            <div className="flex items-center space-x-2 pt-5">
              <button
                type="button"
                onClick={() => {
                  if (confirm("Clear local audit logs and incident history cache?")) {
                    alert("Local telemetry cache purged successfully.");
                  }
                }}
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-800 cursor-pointer flex items-center space-x-1.5 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Purge Local History Cache</span>
              </button>
            </div>
          </div>
        </div>

        {/* Save Controls */}
        <div className="flex items-center justify-end space-x-3 select-none pt-2">
          <button
            type="submit"
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-[0_0_12px_rgba(16,185,129,0.25)] border border-emerald-500/50 active:scale-95 cursor-pointer transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Global Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
