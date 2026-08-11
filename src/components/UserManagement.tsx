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
  User as UserIcon
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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('operator');

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
  }, [users]);

  const openCreateModal = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setRole('operator');
    setIsModalOpen(true);
  };

  const openEditModal = (u: AuthUser) => {
    setEditingUser(u);
    setName(u.name);
    setEmail(u.email);
    setRole(u.role);
    setIsModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    if (editingUser) {
      // Update existing user
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? { ...u, name, email, role }
            : u
        )
      );
    } else {
      // Create new user
      const newUser: AuthUser = {
        id: `usr_${Date.now()}`,
        name,
        email,
        avatar: generateInitialsSvgDataUrl(name, role),
        role,
        active: true,
        created_at: new Date().toISOString(),
        last_login: 'Never',
      };
      setUsers((prev) => [newUser, ...prev]);
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

  const handleDeleteUser = (userId: string, userName: string) => {
    if (userId === currentUser?.id) {
      alert("You cannot delete your own active session account.");
      return;
    }

    if (confirm(`Are you sure you want to remove user "${userName}" from Ketarisentry?`)) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
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

    return matchesSearch && matchesRole && matchesStatus;
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
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4 select-none">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-950/60 border border-indigo-800/40 flex items-center justify-center text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-100">User Management & Access Control</h2>
            <p className="text-xs text-slate-400">Manage administrator roles, operator credentials, and active account states</p>
          </div>
        </div>

        {currentUser?.role === 'superadmin' || currentUser?.role === 'admin' ? (
          <button
            onClick={openCreateModal}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-[0_0_12px_rgba(16,185,129,0.25)] active:scale-95 cursor-pointer border border-emerald-500/50"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create New User</span>
          </button>
        ) : null}
      </div>

      {/* Toolbar Controls */}
      <div className="rounded-xl p-3.5 linear-card flex flex-wrap items-center justify-between gap-3">
        {/* Search Well */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by name or email..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all font-sans"
          />
        </div>

        {/* Role & Status Filter Dropdowns */}
        <div className="flex items-center space-x-2.5 select-none">
          <CustomSelect
            value={roleFilter}
            onChange={(val) => setRoleFilter(String(val))}
            options={[
              { value: 'all', label: 'Role: All' },
              { value: 'superadmin', label: 'Superadmin' },
              { value: 'admin', label: 'Admin' },
              { value: 'operator', label: 'Operator' },
              { value: 'viewer', label: 'Viewer' },
            ]}
            ariaLabel="Filter by Role"
          />

          <CustomSelect
            value={statusFilter}
            onChange={(val) => setStatusFilter(String(val))}
            options={[
              { value: 'all', label: 'Status: All' },
              { value: 'active', label: 'Active Only' },
              { value: 'deactivated', label: 'Deactivated Only' },
            ]}
            ariaLabel="Filter by Status"
          />
        </div>
      </div>

      {/* Users Table List */}
      <div className="rounded-xl linear-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-950/60 text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider select-none">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Last Active</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                    No users matched your search criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isActive = u.active !== false;
                  const isCurrent = u.id === currentUser?.id;

                  return (
                    <tr key={u.id} className={`hover:bg-slate-800/30 transition-colors ${!isActive ? 'opacity-60' : ''}`}>
                      {/* User Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={u.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=User'}
                            alt={u.name}
                            className="w-8 h-8 rounded-lg ring-1 ring-slate-700/60 object-cover shrink-0"
                          />
                          <div className="truncate">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-100">{u.name}</span>
                              {isCurrent && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40 font-mono font-bold">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono block truncate">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getRoleBadge(u.role)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap select-none">
                        {isActive ? (
                          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse glow-dot-emerald" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-950 text-slate-400 border border-slate-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                            <span>Deactivated</span>
                          </span>
                        )}
                      </td>

                      {/* Last Active */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {u.last_login || 'Never'}
                      </td>

                      {/* Actions Toolbar */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Activate / Deactivate Toggle Button */}
                          <button
                            onClick={() => toggleUserActiveStatus(u.id)}
                            disabled={isCurrent}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              isActive
                                ? 'bg-slate-900 text-slate-300 hover:text-rose-300 border-slate-800 hover:border-rose-800/50'
                                : 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40 hover:bg-emerald-900/50'
                            } disabled:opacity-30 disabled:cursor-not-allowed`}
                            title={isActive ? 'Deactivate User Account' : 'Activate User Account'}
                          >
                            {isActive ? <PowerOff className="w-3.5 h-3.5 text-rose-400" /> : <Power className="w-3.5 h-3.5 text-emerald-400" />}
                          </button>

                          {/* Edit User Button */}
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 rounded-lg linear-btn text-slate-300 hover:text-white cursor-pointer"
                            title="Edit User Role & Details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete User Button */}
                          <button
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            disabled={isCurrent}
                            className="p-1.5 rounded-lg linear-btn text-slate-400 hover:text-rose-300 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Delete User Account"
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#090d16] border border-slate-800/80 rounded-2xl p-6 shadow-2xl relative select-none">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3.5 mb-5">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-100">
                    {editingUser ? 'Edit User Credentials' : 'Create New Account'}
                  </h3>
                  <p className="text-xs text-slate-400">Configure access role & permissions</p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg linear-btn text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
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
                    placeholder="alex@ketarisentry.io"
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Access Role</label>
                <CustomSelect
                  value={role}
                  onChange={(val) => setRole(val as UserRole)}
                  options={[
                    { value: 'superadmin', label: 'Superadmin (Full System Control)' },
                    { value: 'admin', label: 'Admin (Manage Fleet & Users)' },
                    { value: 'operator', label: 'Operator (Re-poll & Inspect Queues)' },
                    { value: 'viewer', label: 'Viewer (Read-Only Metrics)' },
                  ]}
                  ariaLabel="Select User Role"
                />
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl linear-btn text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-[0_0_12px_rgba(16,185,129,0.25)] border border-emerald-500/50 cursor-pointer"
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
