import React, { useState } from 'react';
import {
  Users,
  Search,
  RotateCcw,
  Plus,
  Eye,
  Pencil,
  Trash2,
  X,
  Shield,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Phone,
  Building,
  Lock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { matchesUniversalSearch } from '../../utils/searchUtils';
import { User, PermissionKey, UserRoleName } from '../../types';

export const UsersRolesView: React.FC = () => {
  const {
    users,
    currentUser,
    addUser,
    updateUser,
    deleteUser,
    roles,
    updateRolePermissions,
    addToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('');

  // Modals
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    department: 'Operations',
    roleName: 'Store Officer' as UserRoleName,
    status: 'active' as 'active' | 'inactive',
  });

  // Selected Role for Role Permissions tab
  const [selectedRoleId, setSelectedRoleId] = useState<string>(roles[0]?.id || 'role-manager');

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedRoleFilter('');
    addToast('User filters reset', 'info');
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = matchesUniversalSearch(u, searchTerm, [
      u.fullName || u.name,
      u.email,
      u.phone,
      u.roleName || (u.role as string),
      u.department,
    ]);
    const matchesRole = selectedRoleFilter
      ? (u.roleName || (u.role as string)) === selectedRoleFilter
      : true;
    return matchesSearch && matchesRole;
  });

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      department: 'Operations',
      roleName: 'Store Officer',
      status: 'active',
    });
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      fullName: user.fullName || user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      department: user.department || 'Operations',
      roleName: (user.roleName || user.role || 'Store Officer') as UserRoleName,
      status: (user.status || 'active') as 'active' | 'inactive',
    });
    setIsAddEditModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      addToast('Full name is required', 'warning');
      return;
    }
    if (!formData.email.trim()) {
      addToast('Email address is required', 'warning');
      return;
    }

    const matchedRole = roles.find((r) => r.roleName === formData.roleName);
    const roleId = matchedRole ? matchedRole.id : undefined;

    if (editingUser) {
      updateUser(editingUser.id, {
        fullName: formData.fullName.trim(),
        name: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        department: formData.department,
        roleName: formData.roleName,
        role: formData.roleName,
        roleId,
        status: formData.status,
      });
      addToast(`Updated user account "${formData.fullName}"!`, 'success');
    } else {
      addUser({
        fullName: formData.fullName.trim(),
        name: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        department: formData.department,
        roleName: formData.roleName,
        role: formData.roleName,
        roleId,
        status: formData.status,
      });
      addToast(`Created user account for "${formData.fullName}"!`, 'success');
    }

    setIsAddEditModalOpen(false);
    setEditingUser(null);
  };

  const confirmDelete = () => {
    if (!deletingUser) return;
    if (deletingUser.id === currentUser.id) {
      addToast('Cannot delete currently logged-in account', 'error');
      setDeletingUser(null);
      return;
    }
    deleteUser(deletingUser.id);
    addToast(`User "${deletingUser.fullName || deletingUser.name}" removed`, 'info');
    setDeletingUser(null);
  };

  // Permissions list for Roles tab
  const ALL_SYSTEM_PERMISSIONS: { key: PermissionKey; label: string; group: string }[] = [
    { key: 'view_dashboard', label: 'View Dashboard & Analytics', group: 'Dashboard' },
    { key: 'view_stock', label: 'View Stock In Records', group: 'Stock Inward' },
    { key: 'add_stock', label: 'Create New Stock In Entries', group: 'Stock Inward' },
    { key: 'edit_stock', label: 'Edit Stock In Records', group: 'Stock Inward' },
    { key: 'delete_stock', label: 'Delete Stock In Records', group: 'Stock Inward' },
    { key: 'approve_stock', label: 'Approve Stock In Entries', group: 'Stock Inward' },
    { key: 'view_delivery', label: 'View Delivery Records', group: 'Delivery Dispatches' },
    { key: 'add_delivery', label: 'Create Delivery Dispatches', group: 'Delivery Dispatches' },
    { key: 'edit_delivery', label: 'Edit Delivery Records', group: 'Delivery Dispatches' },
    { key: 'delete_delivery', label: 'Delete Delivery Records', group: 'Delivery Dispatches' },
    { key: 'approve_delivery', label: 'Approve Delivery Orders', group: 'Delivery Dispatches' },
    { key: 'view_cold_storage', label: 'View Cold Storage Units', group: 'Cold Storage' },
    { key: 'add_cold_storage', label: 'Register New Facilities', group: 'Cold Storage' },
    { key: 'edit_cold_storage', label: 'Edit Facilities', group: 'Cold Storage' },
    { key: 'delete_cold_storage', label: 'Delete Facilities', group: 'Cold Storage' },
    { key: 'manage_cold_storage', label: 'Manage All Facilities', group: 'Cold Storage' },
    { key: 'view_reports', label: 'View Reports & Registers', group: 'Reports' },
    { key: 'export_excel', label: 'Export Data to Excel', group: 'Reports' },
    { key: 'export_pdf', label: 'Export Data to PDF', group: 'Reports' },
    { key: 'print_reports', label: 'Print Reports & Tables', group: 'Reports' },
    { key: 'view_users', label: 'View Users & Roles', group: 'Security & Admin' },
    { key: 'add_users', label: 'Create User Accounts', group: 'Security & Admin' },
    { key: 'edit_users', label: 'Edit User Accounts', group: 'Security & Admin' },
    { key: 'delete_users', label: 'Delete User Accounts', group: 'Security & Admin' },
    { key: 'manage_users', label: 'Manage Roles & Access', group: 'Security & Admin' },
    { key: 'view_settings', label: 'View Organization Profile', group: 'System Settings' },
    { key: 'manage_settings', label: 'Update System Settings', group: 'System Settings' },
    { key: 'view_audit_logs', label: 'View Audit Logs & Trail', group: 'System Settings' },
  ];

  const currentRole = roles.find((r) => r.id === selectedRoleId) || roles[0];

  const togglePermission = (permKey: PermissionKey) => {
    if (!currentRole) return;
    const currentPerms = currentRole.permissions || [];
    let updated: PermissionKey[];
    if (currentPerms.includes(permKey)) {
      updated = currentPerms.filter((p) => p !== permKey);
    } else {
      updated = [...currentPerms, permKey];
    }
    updateRolePermissions(currentRole.id, updated);
  };

  return (
    <div className="space-y-3.5">
      {/* 1. Page Title Card strictly matching Dashboard layout */}
      <div className="flex items-center justify-between gap-3 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-slate-50/90 dark:bg-slate-900/90 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-5 bg-indigo-600 dark:bg-indigo-500 rounded-xs shadow-xs" />
          <h2 className="text-xs sm:text-sm font-black tracking-wider text-slate-800 dark:text-slate-100 uppercase">
            USERS & ROLES
          </h2>
          <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-mono">
            {users.length} OPERATORS
          </span>
        </div>

        {/* Action Button: Add User */}
        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all cursor-pointer uppercase active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>ADD USER</span>
        </button>
      </div>

      {/* 2. Sub Tabs: Users vs Roles */}
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 text-[11px] rounded-md transition-all cursor-pointer uppercase font-bold ${
              activeTab === 'users'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            SYSTEM USERS ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('roles')}
            className={`px-3 py-1.5 text-[11px] rounded-md transition-all cursor-pointer uppercase font-bold ${
              activeTab === 'roles'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            ROLES & PERMISSIONS ({roles.length})
          </button>
        </div>
      </div>

      {/* --- TAB 1: USERS --- */}
      {activeTab === 'users' && (
        <div className="space-y-3.5">
          {/* Search Toolbar */}
          <div className="bg-slate-200/85 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 text-slate-800 dark:text-slate-100 no-print">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="py-1.5 px-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold uppercase cursor-pointer shadow-2xs"
              >
                <option value="">ALL ROLES</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.roleName}>
                    {r.roleName.toUpperCase()}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={resetFilters}
                className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-650 border border-slate-300 dark:border-slate-600 shadow-2xs transition-colors cursor-pointer shrink-0 inline-flex items-center justify-center gap-1.5 px-3 text-xs font-bold uppercase"
                title="Reset search and filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>RESET</span>
              </button>
            </div>
          </div>

          {/* Users List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredUsers.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 shadow-xs">
                <Users className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                  No matching user accounts found.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs uppercase cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>ADD OPERATOR</span>
                </button>
              </div>
            ) : (
              filteredUsers.map((u) => {
                const isCurrent = u.id === currentUser.id;
                const displayName = u.fullName || u.name || 'User';
                const roleLabel = u.roleName || (u.role as string) || 'Operator';
                const initial = displayName.slice(0, 2).toUpperCase();

                return (
                  <div
                    key={u.id}
                    className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-indigo-500/50 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-sky-600 text-white font-bold flex items-center justify-center font-mono text-sm shadow-xs shrink-0">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase truncate flex items-center gap-1.5">
                              <span>{displayName}</span>
                              {isCurrent && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-mono font-bold border border-indigo-200 dark:border-indigo-800">
                                  YOU
                                </span>
                              )}
                            </h3>
                            <p className="text-[11px] font-mono text-slate-500 truncate">{u.email}</p>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                            (u.status || 'active') === 'active'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/40'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {u.status || 'ACTIVE'}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[10px] uppercase text-slate-400">ROLE:</span>
                          <span className="font-bold text-[11px] text-indigo-600 dark:text-indigo-400 uppercase">
                            {roleLabel}
                          </span>
                        </div>
                        {u.department && (
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[10px] uppercase text-slate-400">DEPARTMENT:</span>
                            <span className="font-medium text-[11px] text-slate-700 dark:text-slate-300">
                              {u.department}
                            </span>
                          </div>
                        )}
                        {u.phone && (
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[10px] uppercase text-slate-400">PHONE:</span>
                            <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                              {u.phone}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Toolbar */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5">
                      <button
                        type="button"
                        onClick={() => setViewingUser(u)}
                        className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 text-xs font-bold rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer uppercase"
                        title="View profile details"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>VIEW</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(u)}
                        className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 text-xs font-bold rounded-lg text-indigo-700 dark:text-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/70 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer uppercase"
                        title="Edit user profile"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>EDIT</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingUser(u)}
                        disabled={isCurrent}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer shrink-0 ${
                          isCurrent
                            ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                            : 'text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 border-rose-200 dark:border-rose-900'
                        }`}
                        title={isCurrent ? 'Cannot delete current account' : 'Delete user account'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* --- TAB 2: ROLES & PERMISSIONS --- */}
      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Roles Selector Column */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              SELECT ROLE TO MANAGE
            </h3>
            {roles.map((r) => {
              const isSelected = r.id === currentRole.id;
              const count = users.filter((u) => (u.roleName || (u.role as string)) === r.roleName).length;

              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRoleId(r.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-400 text-indigo-900 dark:text-indigo-200 shadow-xs ring-1 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wide">{r.roleName}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{r.description}</p>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {count} users
                  </span>
                </button>
              );
            })}
          </div>

          {/* Permissions Matrix Column */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>{currentRole.roleName} PERMISSIONS</span>
                </h3>
                <p className="text-xs text-slate-500">{currentRole.description}</p>
              </div>

              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {(currentRole.permissions || []).length} / {ALL_SYSTEM_PERMISSIONS.length} ACTIVE
              </span>
            </div>

            {/* Grouped Permissions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {ALL_SYSTEM_PERMISSIONS.map((perm) => {
                const isEnabled = (currentRole.permissions || []).includes(perm.key);

                return (
                  <label
                    key={perm.key}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer select-none ${
                      isEnabled
                        ? 'bg-indigo-50/50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-slate-900 dark:text-white'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-500'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => togglePermission(perm.key)}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-[11px] uppercase tracking-wide">{perm.label}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-mono">{perm.group}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* --- ADD / EDIT USER MODAL --- */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850/50">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {editingUser ? 'EDIT USER ACCOUNT' : 'ADD NEW USER ACCOUNT'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Department
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                  >
                    <option value="Operations">Operations</option>
                    <option value="Warehouse">Warehouse</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Management">Management</option>
                    <option value="Accounts">Accounts</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    System Role *
                  </label>
                  <select
                    value={formData.roleName}
                    onChange={(e) => setFormData({ ...formData, roleName: e.target.value as any })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold uppercase focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.roleName}>
                        {r.roleName.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold uppercase focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                  >
                    <option value="active">ACTIVE</option>
                    <option value="inactive">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold uppercase transition-colors cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase shadow-xs transition-all cursor-pointer"
                >
                  {editingUser ? 'UPDATE USER' : 'CREATE USER'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- VIEW USER MODAL --- */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-sky-600 text-white font-bold flex items-center justify-center font-mono">
                  {(viewingUser.fullName || viewingUser.name || 'U').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase">
                    {viewingUser.fullName || viewingUser.name}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-500">{viewingUser.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingUser(null)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-bold uppercase">ROLE:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                  {viewingUser.roleName || (viewingUser.role as string)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-bold uppercase">DEPARTMENT:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {viewingUser.department || 'Operations'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-bold uppercase">PHONE:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {viewingUser.phone || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-bold uppercase">STATUS:</span>
                <span className="font-bold text-emerald-600 uppercase">
                  {viewingUser.status || 'ACTIVE'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-bold uppercase">JOINED:</span>
                <span className="font-mono text-slate-500 text-[11px]">
                  {viewingUser.createdAt ? new Date(viewingUser.createdAt).toLocaleDateString() : 'Active Member'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-between">
              <button
                type="button"
                onClick={() => setViewingUser(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold uppercase text-xs cursor-pointer"
              >
                CLOSE
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = viewingUser;
                  setViewingUser(null);
                  handleOpenEdit(target);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase text-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>EDIT USER</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE USER CONFIRMATION MODAL --- */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  DELETE OPERATOR
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to remove <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">"{deletingUser.fullName || deletingUser.name}"</span>?
                </p>
                <p className="text-[11px] text-rose-500 mt-1">
                  Their access credentials will be revoked immediately.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold uppercase transition-colors cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold uppercase shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>CONFIRM DELETE</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
