'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import {
  ShieldAlert,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  X,
  Loader2,
  CheckSquare,
  Square,
  Shield,
  Fingerprint
} from 'lucide-react';

interface Role {
  _id: string;
  name: string;
  permissions: string[];
}

interface Permission {
  _id: string;
  name: string;
  module?: string;
}

export default function RolesPermissionsPage() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Selected Role details
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [syncLoading, setSyncLoading] = useState(false);

  // New Role Form
  const [newRoleName, setNewRoleName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // New Permission Form
  const [newPermissionName, setNewPermissionName] = useState('');
  const [createPermLoading, setCreatePermLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch both roles and all permissions
      const [rolesData, permsData] = await Promise.all([
        apiFetch('/api/admin/roles'),
        apiFetch('/api/admin/permissions')
      ]);

      if (rolesData.success) {
        setRoles(rolesData.roles || []);
      }
      if (permsData.success) {
        setPermissions(permsData.permissions || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch roles & permissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.roles.includes('admin')) {
      loadData();
    }
  }, [user]);

  const handleSelectRole = async (role: Role) => {
    setSelectedRole(role);
    setRolePermissions(role.permissions || []);
    setSyncLoading(true);
    try {
      const data = await apiFetch(`/api/admin/roles/${role._id}/permissions`);
      if (data.success) {
        setRolePermissions(data.permissions || []);
      }
    } catch (err: any) {
      console.error('Failed to load active permissions for role', err);
    } finally {
      setSyncLoading(false);
    }
  };

  const handleTogglePermission = (name: string) => {
    if (rolePermissions.includes(name)) {
      setRolePermissions(rolePermissions.filter((p) => p !== name));
    } else {
      setRolePermissions([...rolePermissions, name]);
    }
  };

  const handleSyncPermissions = async () => {
    if (!selectedRole) return;
    setSyncLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = await apiFetch(`/api/admin/roles/${selectedRole._id}/permissions`, {
        method: 'POST',
        body: JSON.stringify({
          permissions: rolePermissions,
        }),
      });

      if (data.success) {
        setSuccess(`Permissions synced for role "${selectedRole.name}" successfully!`);
        // Refresh local roles list state
        setRoles(roles.map(r => r._id === selectedRole._id ? { ...r, permissions: rolePermissions } : r));
        setSelectedRole(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to synchronize permissions.');
    } finally {
      setSyncLoading(false);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    setCreateLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = await apiFetch('/api/admin/roles', {
        method: 'POST',
        body: JSON.stringify({ name: newRoleName.toLowerCase() }),
      });

      if (data.success && data.role) {
        setSuccess(`Role "${newRoleName}" created successfully!`);
        setRoles([...roles, data.role]);
        setNewRoleName('');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create role.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCreatePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPermissionName.trim()) return;
    setCreatePermLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = await apiFetch('/api/admin/permissions', {
        method: 'POST',
        body: JSON.stringify({ name: newPermissionName.toLowerCase() }),
      });

      if (data.success && data.permission) {
        setSuccess(`Permission "${newPermissionName}" created successfully!`);
        setPermissions([...permissions, data.permission]);
        setNewPermissionName('');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create permission.');
    } finally {
      setCreatePermLoading(false);
    }
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (['admin', 'manager', 'agent', 'user'].includes(roleName)) {
      alert('System reserve roles cannot be deleted.');
      return;
    }
    if (!confirm(`Are you sure you want to delete role: "${roleName}"?`)) return;
    setError('');
    setSuccess('');

    try {
      const data = await apiFetch(`/api/admin/roles/${roleId}`, {
        method: 'DELETE',
      });

      if (data.success) {
        setSuccess(`Role "${roleName}" deleted successfully.`);
        setRoles(roles.filter(r => r._id !== roleId));
        if (selectedRole?._id === roleId) {
          setSelectedRole(null);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete role.');
    }
  };

  if (!user?.roles.includes('admin')) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
        <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Access Denied</h3>
        <p className="text-zinc-500 dark:text-zinc-500 text-sm">Role & permission management is restricted to Administrators only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div>
        <h1 className="font-outfit font-extrabold text-3xl bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
          Roles & Permissions
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Configure RBAC authorizations and grant granular module access.</p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-sm flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Grid container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Roles list & Add role */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Quick Create Role Card */}
          <div className="glass-panel border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm dark:shadow-none">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-zinc-900 dark:text-white">Create New Role</h3>
            <form onSubmit={handleCreateRole} className="space-y-3">
              <input
                type="text"
                required
                placeholder="e.g. supervisor"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-50/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-800 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                disabled={createLoading}
                className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-purple-600 hover:from-sky-400 hover:to-purple-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors disabled:opacity-50 flex items-center justify-center space-x-1 cursor-pointer"
              >
                {createLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Add Role</span>
              </button>
            </form>
          </div>

          {/* Quick Create Permission Card */}
          <div className="glass-panel border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm dark:shadow-none">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-zinc-900 dark:text-white">Create New Permission</h3>
            <form onSubmit={handleCreatePermission} className="space-y-3">
              <input
                type="text"
                required
                placeholder="e.g. manage-users"
                value={newPermissionName}
                onChange={(e) => setNewPermissionName(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-50/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-800 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                disabled={createPermLoading}
                className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-purple-600 hover:from-sky-400 hover:to-purple-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors disabled:opacity-50 flex items-center justify-center space-x-1 cursor-pointer"
              >
                {createPermLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Add Permission</span>
              </button>
            </form>
          </div>

          {/* Roles list Card */}
          <div className="glass-panel border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm dark:shadow-none">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-zinc-900 dark:text-white">System Roles</h3>
            {loading ? (
              <div className="py-10 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-sky-500" />
              </div>
            ) : (
              <div className="space-y-2">
                {roles.map((role) => (
                  <div
                    key={role._id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      selectedRole?._id === role._id
                        ? 'bg-sky-500/10 border-sky-500/40 text-sky-600 dark:text-sky-400'
                        : 'bg-zinc-50 dark:bg-zinc-950/20 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-850'
                    }`}
                  >
                    <button
                      onClick={() => handleSelectRole(role)}
                      className="flex-1 text-left flex items-center space-x-2.5 font-semibold text-xs capitalize cursor-pointer"
                    >
                      <Shield className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                      <span>{role.name}</span>
                    </button>
                    
                    {!['admin', 'manager', 'agent', 'user'].includes(role.name) && (
                      <button
                        onClick={() => handleDeleteRole(role._id, role.name)}
                        className="p-1 text-zinc-400 hover:text-rose-600 dark:text-zinc-500 dark:hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Permissions details grid */}
        <div className="lg:col-span-2">
          {selectedRole ? (
            <div className="glass-panel border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 flex flex-col justify-between h-full min-h-[400px] shadow-sm dark:shadow-none">
              <div>
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4 mb-4">
                  <div>
                    <h3 className="text-md font-bold text-zinc-900 dark:text-white capitalize flex items-center space-x-2">
                      <Fingerprint className="w-5 h-5 text-sky-500 dark:text-sky-400" />
                      <span>Sync Permissions for: {selectedRole.name}</span>
                    </h3>
                    <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5">Toggle checkboxes to assign system operations.</p>
                  </div>
                  <button
                    onClick={() => setSelectedRole(null)}
                    className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-white bg-zinc-100 dark:bg-zinc-950/30 rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {syncLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-sky-500 mb-2" />
                    <p className="text-zinc-500 text-xs">Loading permissions matrix...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[450px] overflow-y-auto pr-2">
                    {permissions.map((perm) => {
                      const isChecked = rolePermissions.includes(perm.name);
                      return (
                        <button
                          key={perm._id}
                          type="button"
                          onClick={() => handleTogglePermission(perm.name)}
                          className={`flex items-center space-x-3 p-3 rounded-xl border text-left transition-all ${
                            isChecked
                              ? 'bg-sky-500/5 border-sky-500/20 text-sky-600 dark:text-sky-400'
                              : 'bg-zinc-50 dark:bg-zinc-950/10 border-zinc-200 dark:border-zinc-800/60 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-950/30'
                          } cursor-pointer`}
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4.5 h-4.5 text-sky-500 dark:text-sky-400 flex-shrink-0" />
                          ) : (
                            <Square className="w-4.5 h-4.5 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
                          )}
                          <div>
                            <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 font-mono">{perm.name}</p>
                            {perm.module && (
                              <p className="text-[9px] text-zinc-500 dark:text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">
                                Module: {perm.module}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setSelectedRole(null)}
                  className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSyncPermissions}
                  disabled={syncLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-purple-600 hover:from-sky-400 hover:to-purple-500 text-white rounded-xl text-xs font-semibold disabled:opacity-50 transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  {syncLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Configuration</span>
                </button>
              </div>

            </div>
          ) : (
            <div className="glass-panel border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 flex flex-col items-center justify-center text-center h-full min-h-[300px] shadow-sm dark:shadow-none">
              <ShieldAlert className="w-12 h-12 text-zinc-400 dark:text-zinc-600 mb-4" />
              <h3 className="text-md font-bold text-zinc-900 dark:text-white mb-1">Select a Role</h3>
              <p className="text-zinc-500 text-xs max-w-xs">
                Choose a role from the left list to review and update its permissions allocation.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
