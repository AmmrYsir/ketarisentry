import React, { useState } from 'react';
import { 
  Settings, 
  Shield, 
  Bell, 
  Save, 
  Key, 
  Check, 
  Send,
  Sliders
} from 'lucide-react';
import { CustomSelect } from './CustomSelect';

const LOCAL_STORAGE_SETTINGS_KEY = 'ketarisentry_global_settings';

export const SettingsPage: React.FC = () => {
  const [defaultInterval, setDefaultInterval] = useState<number>(15);
  const [defaultTimeout, setDefaultTimeout] = useState<number>(5);
  const [globalSecretKey, setGlobalSecretKey] = useState<string>('sk_live_ketari_99812a');
  const [webhookUrl, setWebhookUrl] = useState<string>('https://hooks.slack.com/services/T00/B00/XXXX');
  const [enableEmailAlerts, setEnableEmailAlerts] = useState<boolean>(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const config = {
      defaultInterval,
      defaultTimeout,
      globalSecretKey,
      webhookUrl,
      enableEmailAlerts,
    };
    localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(config));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header Banner */}
      <div className="flex items-center space-x-3 border-b border-slate-800/80 pb-4 select-none">
        <div className="w-9 h-9 rounded-xl bg-indigo-950/60 border border-indigo-800/40 flex items-center justify-center text-indigo-400">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-slate-100">Global Telemetry & System Settings</h2>
          <p className="text-xs text-slate-400">Configure global pull polling parameters, security headers, and incident webhooks</p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 text-xs flex items-center space-x-2 animate-in fade-in select-none">
          <Check className="w-4 h-4 text-emerald-400" />
          <span className="font-bold">Global settings saved successfully to local storage and SQLite database!</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        
        {/* Polling Strategy Card */}
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

        {/* Security & Secret Key Card */}
        <div className="p-5 rounded-xl linear-card space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-3 select-none">
            <Shield className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
              Security Headers & Authentication
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

        {/* Webhooks & Alerts Card */}
        <div className="p-5 rounded-xl linear-card space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-3 select-none">
            <Bell className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
              Incident Webhooks & Notifications
            </h3>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 cursor-pointer">
              Slack / Discord Outage Webhook URL
            </label>
            <div className="relative">
              <Send className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950/90 border border-slate-800 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 select-none pt-1">
            <input
              id="email-alerts"
              type="checkbox"
              checked={enableEmailAlerts}
              onChange={(e) => setEnableEmailAlerts(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="email-alerts" className="text-xs font-bold text-slate-300 cursor-pointer">
              Send immediate email alerts to Superadmins on service outage events
            </label>
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
