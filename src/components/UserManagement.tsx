import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit3, 
  Trash2, 
  Power, 
  PowerOff, 
  X,
  Mail,
  User as UserIcon,
  CheckCircle,
  AlertCircle,
  Send,
  Lock
} from 'lucide-react';
import type { AuthUser, UserRole } from '../types';
import { CustomSelect } from './CustomSelect';
import { useAuth } from '../hooks/useAuth';
import { generateInitialsSvgDataUrl } from '../utils/avatar';

const INITIAL_USERS: AuthUser[] = [
  {
    id: 'usr_1',
    name: 'Ammar Yasir (You)',
    email: 'ammar@ketarisentry.io',
    avatar: generateInitialsSvgDataUrl('Ammar Yasir', 'superadmin'),
    role: 'superadmin',
    active: true,
    email_verified: true,
    created_at: '2026-01-15T08:30:00Z',
    last_login: 'Just now',
  },
  {
    id: 'usr_2',
    name: 'Sarah Jenkins',
    email: 'sarah.devops@ketarisentry.io',
    avatar: generateInitialsSvgDataUrl('Sarah Jenkins', 'admin'),
    role: 'admin',
    active: true,
    email_verified: true,
    created_at: '2026-02-01T10:15:00Z',
    last_login: '2 hours ago',
  },
  {
    id: 'usr_3',
    name: 'Marcus Chen',
    email: 'marcus.ops@ketarisentry.io',
    avatar: generateInitialsSvgDataUrl('Marcus Chen', 'operator'),
    role: 'operator',
    active: true,
    email_verified: true,
    created_at: '2026-03-10T14:20:00Z',
    last_login: '1 day ago',
  },
  {
    id: 'usr_4',
    name: 'Elena Rostova',
    email: 'elena.qa@ketarisentry.io',
    avatar: generateInitialsSvgDataUrl('Elena Rostova', 'viewer'),
    role: 'viewer',
    active: false,
    email_verified: false,
    created_at: '2026-04-05T09:00:00Z',
    last_login: '5 days ago',
  },
];

const LOCAL_STORAGE_USERS_KEY = 'ketarisentry_managed_users';

export const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AuthUser[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return INITIAL_USERS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('operator');
  const [emailVerified, setEmailVerified] = useState<boolean>(true);

  // Notification alert state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
  }, [users]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('operator');
    setEmailVerified(true);
    setIsModalOpen(true);
  };

  const openEditModal = (u: AuthUser) => {
    setEditingUser(u);
    setName(u.name);
    setEmail(u.email);
    setPassword('');
    setRole(u.role);
    setEmailVerified(u.email_verified ?? true);
    setIsModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    if (!editingUser && !password) {
      alert('Please provide a password for the new user account.');
      return;
    }

    if (editingUser) {
      // Update existing user
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? { 
                ...u, 
                name, 
                email, 
                role, 
                email_verified: emailVerified,
                avatar: (u.avatar || '').startsWith('data:image/svg+xml') 
                  ? generateInitialsSvgDataUrl(name, role) 
                  : u.avatar || generateInitialsSvgDataUrl(name, role)
              }
            : u
        )
      );
      showToast(`User account "${name}" updated successfully.`);
    } else {
      // Create new user
      const newUser: AuthUser = {
        id: `usr_${Date.now()}`,
        name,
        email,
        avatar: generateInitialsSvgDataUrl(name, role),
        role,
        active: true,
        email_verified: emailVerified,
        created_at: new Date().toISOString(),
        last_login: 'Never',
      };
      setUsers((prev) => [newUser, ...prev]);
      showToast(`New user account "${name}" created with password credentials.`);
    }

    setIsModalOpen(false);
  };

  const toggleUserActiveStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updatedActive = !(u.active ?? true);
          return { ...u, active: updatedActive };
        }
        return u;
      })
    );
  };

  const toggleEmailVerification = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updatedVerified = !(u.email_verified ?? true);
          return { ...u, email_verified: updatedVerified };
        }
        return u;
      })
    );
  };

  const handleSendConfirmationEmail = (u: AuthUser) => {
    // Check if SMTP settings are present in localStorage
    const smtpSettings = localStorage.getItem('ketarisentry_smtp_config');
    let host = 'smtp.sendgrid.net';
    if (smtpSettings) {
      try {
        const parsed = JSON.parse(smtpSettings);
        if (parsed.host) host = parsed.host;
      } catch {
        // fallback
      }
    }

    showToast(`✉️ Verification link sent to ${u.email} via SMTP Server (${host})!`);
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (userId === currentUser?.id) {
      alert("You cannot delete your own active session account.");
      return;
    }

    if (confirm(`Are you sure you want to remove user "${userName}" from Ketarisentry?`)) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      showToast(`User "${userName}" deleted.`);
    }
  };

  // Filtered users list
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    
    const isActive = u.active !== false;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && isActive) ||
      (statusFilter === 'deactivated' && !isActive);

    const isVerified = u.email_verified ?? true;
    const matchesVerification =
      verificationFilter === 'all' ||
      (verificationFilter === 'verified' && isVerified) ||
      (verificationFilter === 'unverified' && !isVerified);

    return matchesSearch && matchesRole && matchesStatus && matchesVerification;
  });

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'superadmin':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-950/80 text-purple-300 border border-purple-800/50">
            Superadmin
          </span>
        );
      case 'admin':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-800/50">
            Admin
          </span>
        );
      case 'operator':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-950/80 text-amber-300 border border-amber-800/50">
            Operator
          </span>
        );
      case 'viewer':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-indigo-950/80 text-indigo-300 border border-indigo-800/50">
            Viewer
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-2xl animate-in fade-in select-none">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 select-none">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-950/60 border border-indigo-800/40 flex items-center justify-center text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-100">User Access & Role Directory</h2>
            <p className="text-xs text-slate-400">Manage team member accounts, login passwords, roles, and email verification status</p>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-[0_0_12px_rgba(16,185,129,0.25)] border border-emerald-500/50 active:scale-95 cursor-pointer transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Create New User</span>
        </button>
      </div>

      {/* Filter & Toolbar Control Card */}
      <div className="p-4 rounded-xl linear-card space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search Field */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user name or email..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-all font-sans"
            />
          </div>

          {/* Role Filter */}
          <CustomSelect
            value={roleFilter}
            onChange={(val) => setRoleFilter(String(val))}
            options={[
              { value: 'all', label: 'All User Roles' },
              { value: 'superadmin', label: 'Superadmin' },
              { value: 'admin', label: 'Admin' },
              { value: 'operator', label: 'Operator' },
              { value: 'viewer', label: 'Viewer' },
            ]}
            ariaLabel="Filter by User Role"
          />

          {/* Account Status Filter */}
          <CustomSelect
            value={statusFilter}
            onChange={(val) => setStatusFilter(String(val))}
            options={[
              { value: 'all', label: 'All Account Statuses' },
              { value: 'active', label: 'Active Only' },
              { value: 'deactivated', label: 'Deactivated Only' },
            ]}
            ariaLabel="Filter by Account Status"
          />

          {/* Verification Status Filter */}
          <CustomSelect
            value={verificationFilter}
            onChange={(val) => setVerificationFilter(String(val))}
            options={[
              { value: 'all', label: 'All Email Statuses' },
              { value: 'verified', label: 'Verified Email' },
              { value: 'unverified', label: 'Unverified Email' },
            ]}
            ariaLabel="Filter by Verification Status"
          />

        </div>
      </div>

      {/* Users Data Directory Table */}
      <div className="rounded-xl linear-card overflow-hidden border border-slate-800/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090d16] text-slate-400 font-mono uppercase tracking-wider text-[10px] border-b border-slate-800/80 select-none">
              <tr>
                <th className="py-3 px-4 font-bold">User Identity</th>
                <th className="py-3 px-4 font-bold">Role</th>
                <th className="py-3 px-4 font-bold">Account Status</th>
                <th className="py-3 px-4 font-bold">Email Verification</th>
                <th className="py-3 px-4 font-bold">Last Login</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-mono">
                    No matching user accounts found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isActive = u.active !== false;
                  const isVerified = u.email_verified ?? true;
                  const isSelf = u.id === currentUser?.id;

                  return (
                    <tr key={u.id} className="hover:bg-slate-900/50 transition-colors">
                      
                      {/* Identity */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="w-8 h-8 rounded-lg ring-1 ring-slate-700/60 object-cover bg-slate-950 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-100 flex items-center space-x-1.5">
                              <span>{u.name}</span>
                              {isSelf && (
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/50">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono flex items-center space-x-1">
                              <Mail className="w-3 h-3 text-slate-500" />
                              <span>{u.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4">{getRoleBadge(u.role)}</td>

                      {/* Account Active Toggle */}
                      <td className="py-3 px-4 select-none">
                        <button
                          onClick={() => toggleUserActiveStatus(u.id)}
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold cursor-pointer transition-all border ${
                            isActive
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40 hover:bg-emerald-900/60'
                              : 'bg-rose-950/60 text-rose-300 border-rose-800/40 hover:bg-rose-900/60'
                          }`}
                          title="Click to toggle account activation"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                          <span>{isActive ? 'Active' : 'Deactivated'}</span>
                        </button>
                      </td>

                      {/* Email Verification Status & Toggle */}
                      <td className="py-3 px-4 select-none">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleEmailVerification(u.id)}
                            className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold cursor-pointer transition-all border ${
                              isVerified
                                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40 hover:bg-emerald-900/60'
                                : 'bg-amber-950/60 text-amber-300 border-amber-800/40 hover:bg-amber-900/60'
                            }`}
                            title="Click to toggle email verification status"
                          >
                            {isVerified ? (
                              <CheckCircle className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <AlertCircle className="w-3 h-3 text-amber-400" />
                            )}
                            <span>{isVerified ? 'Verified' : 'Unverified'}</span>
                          </button>

                          {/* Send Confirmation Email Button */}
                          {!isVerified && (
                            <button
                              onClick={() => handleSendConfirmationEmail(u)}
                              className="p-1 rounded bg-slate-800 hover:bg-indigo-900 text-slate-300 hover:text-indigo-200 border border-slate-700/60 cursor-pointer transition-all flex items-center space-x-1 text-[10px]"
                              title="Send Email Confirmation Link via SMTP"
                            >
                              <Send className="w-3 h-3 text-indigo-400" />
                              <span className="hidden lg:inline">Send Email</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Last Login */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        {u.last_login || 'Never'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right select-none">
                        <div className="flex items-center justify-end space-x-1.5">
                          
                          {/* Edit User Button */}
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                            title="Edit User Details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Send Email Link */}
                          <button
                            onClick={() => handleSendConfirmationEmail(u)}
                            className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                            title="Send Confirmation Email"
                          >
                            <Mail className="w-3.5 h-3.5 text-indigo-400" />
                          </button>

                          {/* Account Toggle */}
                          <button
                            onClick={() => toggleUserActiveStatus(u.id)}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                              isActive
                                ? 'text-amber-400 hover:bg-amber-950/40'
                                : 'text-emerald-400 hover:bg-emerald-950/40'
                            }`}
                            title={isActive ? 'Deactivate User Account' : 'Activate User Account'}
                          >
                            {isActive ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                          </button>

                          {/* Delete User */}
                          <button
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            disabled={isSelf}
                            className={`p-1.5 rounded-lg transition-all ${
                              isSelf
                                ? 'text-slate-600 cursor-not-allowed opacity-40'
                                : 'text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 cursor-pointer'
                            }`}
                            title={isSelf ? 'Cannot delete your own account' : 'Delete User'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative my-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-5 select-none">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-100">
                  {editingUser ? 'Edit User Credentials & Role' : 'Create New User Account'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-sans"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sarah@ketarisentry.io"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-sans"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Account Login Password {!editingUser && <span className="text-rose-400">*</span>}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required={!editingUser}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={editingUser ? "Leave blank to keep current password" : "••••••••"}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/90 border border-slate-800 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {editingUser ? "Only enter a new password if you wish to reset this user's password." : "User will use this password to sign in."}
                </p>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">User Access Role</label>
                <CustomSelect
                  value={role}
                  onChange={(val) => setRole(val as UserRole)}
                  options={[
                    { value: 'superadmin', label: 'Superadmin (Full Access)' },
                    { value: 'admin', label: 'Admin (Manage Fleet & Users)' },
                    { value: 'operator', label: 'Operator (Manage Services)' },
                    { value: 'viewer', label: 'Viewer (Read-Only Telemetry)' },
                  ]}
                  ariaLabel="Select User Role"
                />
              </div>

              {/* Email Verification Toggle */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Email Verification Status</label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="emailVerifiedToggle"
                      checked={emailVerified === true}
                      onChange={() => setEmailVerified(true)}
                      className="accent-emerald-500"
                    />
                    <span className="text-xs text-slate-200 font-semibold flex items-center space-x-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Verified Email</span>
                    </span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="emailVerifiedToggle"
                      checked={emailVerified === false}
                      onChange={() => setEmailVerified(false)}
                      className="accent-amber-500"
                    />
                    <span className="text-xs text-slate-200 font-semibold flex items-center space-x-1">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Unverified Email</span>
                    </span>
                  </label>
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-end space-x-2.5 select-none">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md border border-emerald-500/50 cursor-pointer"
                >
                  {editingUser ? 'Save User Changes' : 'Create User Account'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
