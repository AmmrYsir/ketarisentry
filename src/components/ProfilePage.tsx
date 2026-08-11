import React, { useState } from 'react';
import { 
  User as UserIcon, 
  Mail, 
  Upload, 
  Camera, 
  Lock, 
  Save, 
  Check, 
  RefreshCw, 
  Key, 
  Smartphone
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { generateInitialsSvgDataUrl } from '../utils/avatar';

export const ProfilePage: React.FC = () => {
  const { user, updateUserProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatar, setAvatar] = useState(user?.avatar || generateInitialsSvgDataUrl(user?.name || 'Ammar', user?.role));
  
  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Notifications
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Handle local image upload via FileReader
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit. Please upload a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setAvatar(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({ name, email, avatar });
    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 3000);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordSuccess(false), 3000);
  };

  const getRoleBadge = () => {
    const role = user?.role || 'admin';
    switch (role) {
      case 'superadmin':
        return 'bg-purple-950/80 text-purple-300 border-purple-800/50';
      case 'admin':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800/50';
      case 'operator':
        return 'bg-amber-950/80 text-amber-300 border-amber-800/50';
      case 'viewer':
        return 'bg-indigo-950/80 text-indigo-300 border-indigo-800/50';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      
      {/* Header Banner */}
      <div className="flex items-center space-x-3 border-b border-slate-800/80 pb-4 select-none">
        <div className="w-9 h-9 rounded-xl bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
          <UserIcon className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-slate-100">User Account & Profile Management</h2>
          <p className="text-xs text-slate-400">Customize display credentials, upload custom profile photo, and manage security settings</p>
        </div>
      </div>

      {profileSuccess && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 text-xs flex items-center space-x-2 animate-in fade-in select-none">
          <Check className="w-4 h-4 text-emerald-400" />
          <span className="font-bold">Profile details and avatar updated successfully!</span>
        </div>
      )}

      {/* 1. Profile Photo Upload & Customizer Card */}
      <div className="p-5 rounded-xl linear-card space-y-5">
        <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-3 select-none">
          <Camera className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
            Profile Avatar & Photo Upload
          </h3>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar Preview */}
          <div className="relative group shrink-0 select-none">
            <img
              src={avatar}
              alt="Profile Avatar Preview"
              className="w-24 h-24 rounded-2xl ring-2 ring-emerald-500/50 object-cover shadow-[0_0_20px_rgba(16,185,129,0.25)] bg-slate-900"
            />
            <label
              className="absolute inset-0 rounded-2xl bg-slate-950/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold cursor-pointer transition-opacity backdrop-blur-xs"
              title="Upload New Photo"
            >
              <Upload className="w-5 h-5 mb-1 text-emerald-400" />
              <span>Change Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Photo Actions & Presets */}
          <div className="flex-1 space-y-3">
            <div>
              <h4 className="text-xs font-bold text-slate-200 mb-1">Avatar Image</h4>
              <p className="text-[11px] text-slate-400">
                Upload a custom photo (PNG, JPG, WebP, SVG max 5MB) or choose a high-tech avatar preset below.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* File Upload Button */}
              <label className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-[0_0_10px_rgba(16,185,129,0.2)] cursor-pointer select-none active:scale-95 border border-emerald-500/50">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Device Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              {/* Reset / Regenerate Initials Avatar */}
              <button
                type="button"
                onClick={() => setAvatar(generateInitialsSvgDataUrl(name || 'User', user?.role))}
                className="px-3 py-1.5 rounded-lg linear-btn text-slate-300 text-xs font-semibold hover:text-white cursor-pointer select-none flex items-center space-x-1"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                <span>Generate Initials Badge</span>
              </button>
            </div>

            {/* Role Color Theme Presets */}
            <div className="pt-2">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2 select-none">
                Role Theme Badges
              </span>
              <div className="flex items-center space-x-2">
                {[
                  { label: 'Superadmin Theme', roleTheme: 'superadmin' as const },
                  { label: 'Admin Theme', roleTheme: 'admin' as const },
                  { label: 'Operator Theme', roleTheme: 'operator' as const },
                  { label: 'Viewer Theme', roleTheme: 'viewer' as const },
                ].map((preset) => {
                  const presetUrl = generateInitialsSvgDataUrl(name || 'User', preset.roleTheme);
                  return (
                    <button
                      key={preset.roleTheme}
                      type="button"
                      onClick={() => setAvatar(presetUrl)}
                      className={`w-9 h-9 rounded-lg border overflow-hidden transition-all cursor-pointer p-0.5 ${
                        avatar === presetUrl
                          ? 'border-emerald-500 bg-emerald-950/40 ring-1 ring-emerald-500/50'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                      title={preset.label}
                    >
                      <img src={presetUrl} alt={preset.label} className="w-full h-full object-cover rounded-md" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Personal Information & Role Details Card */}
      <form onSubmit={handleSaveProfile} className="p-5 rounded-xl linear-card space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 select-none">
          <div className="flex items-center space-x-2">
            <UserIcon className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
              Account Credentials & Role
            </h3>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${getRoleBadge()}`}>
            {user?.role || 'Admin'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Full Name</label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-sans"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-sans"
              />
            </div>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end">
          <button
            type="submit"
            className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-[0_0_12px_rgba(16,185,129,0.25)] border border-emerald-500/50 active:scale-95 cursor-pointer transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile Info</span>
          </button>
        </div>
      </form>

      {/* 3. Security Credentials Card (Update Password) */}
      <form onSubmit={handleSavePassword} className="p-5 rounded-xl linear-card space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-3 select-none">
          <Lock className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
            Security & Password Update
          </h3>
        </div>

        {passwordError && (
          <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800/50 text-rose-300 text-xs font-medium">
            {passwordError}
          </div>
        )}

        {passwordSuccess && (
          <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 text-xs font-medium flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Password updated successfully!</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950/90 border border-slate-800 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950/90 border border-slate-800 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950/90 border border-slate-800 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end">
          <button
            type="submit"
            className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700/60 active:scale-95 cursor-pointer transition-all"
          >
            <Key className="w-4 h-4 text-amber-400" />
            <span>Update Password</span>
          </button>
        </div>
      </form>

      {/* 4. Active Sessions & Device Security Card */}
      <div className="p-5 rounded-xl linear-card space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 select-none">
          <div className="flex items-center space-x-2">
            <Smartphone className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
              Active Security Session
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40 font-bold">
            Current Device
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-3 rounded-lg linear-well">
            <span className="text-[10px] text-slate-400 block font-sans">IP Address</span>
            <strong className="text-slate-200">127.0.0.1 (Localhost)</strong>
          </div>

          <div className="p-3 rounded-lg linear-well">
            <span className="text-[10px] text-slate-400 block font-sans">User Agent</span>
            <strong className="text-slate-200 truncate block">Chrome / Windows 11</strong>
          </div>

          <div className="p-3 rounded-lg linear-well">
            <span className="text-[10px] text-slate-400 block font-sans">Authentication Mode</span>
            <strong className="text-emerald-400">
              {user?.is_sandbox ? 'Sandbox Demo Session' : 'Email/Password Auth'}
            </strong>
          </div>
        </div>
      </div>

    </div>
  );
};
