'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle,
  X,
  Loader2,
  CheckSquare,
  Square,
  UserPlus,
  ChevronDown
} from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive';
  roles: string[];
  permissions: string[];
  agent_id?: { _id: string; name: string } | string;
  createdAt: string;
  dob?: string;
  pan_number?: string;
  aadhaar_number?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

interface AgentOption {
  _id: string;
  name: string;
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Bulk assignment state
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [bulkAgentId, setBulkAgentId] = useState('');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form Inputs
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formAgentId, setFormAgentId] = useState('');
  const [formRoles, setFormRoles] = useState<string[]>(['user']);
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  
  // Additional details state
  const [formDob, setFormDob] = useState('');
  const [formPanNumber, setFormPanNumber] = useState('');
  const [formAadhaarNumber, setFormAadhaarNumber] = useState('');
  const [formPincode, setFormPincode] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [showAdditional, setShowAdditional] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/api/admin/users', {
        params: {
          search,
          page,
          limit,
        },
      });
      if (data.success) {
        setUsers(data.users || []);
        setTotal(data.pagination?.total || 0);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users list.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAgentsList = async () => {
    try {
      const data = await apiFetch('/api/admin/agents', { params: { limit: 100 } });
      if (data.success) {
        setAgents(data.agents || []);
      }
    } catch (err) {
      console.error('Failed to load agents list for options', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, page]);

  useEffect(() => {
    fetchAgentsList();
  }, []);

  const handleSelectAll = () => {
    if (selectedUserIds.length === users.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(users.map((u) => u._id));
    }
  };

  const handleSelectUser = (id: string) => {
    if (selectedUserIds.includes(id)) {
      setSelectedUserIds(selectedUserIds.filter((uid) => uid !== id));
    } else {
      setSelectedUserIds([...selectedUserIds, id]);
    }
  };

  const handleBulkAssign = async () => {
    if (selectedUserIds.length === 0) {
      alert('Please select at least one user.');
      return;
    }
    setBulkSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const data = await apiFetch('/api/admin/users/bulk-assign', {
        method: 'POST',
        body: JSON.stringify({
          userIds: selectedUserIds,
          agentId: bulkAgentId || null, // null means unassign
        }),
      });

      if (data.success) {
        setSuccess(data.message || 'Bulk assignment updated successfully!');
        setSelectedUserIds([]);
        setBulkAgentId('');
        fetchUsers();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to complete bulk assignment.');
    } finally {
      setBulkSubmitting(false);
    }
  };

  const handleOpenCreate = () => {
    setSelectedUser(null);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormPassword('');
    setFormAgentId('');
    setFormRoles(['user']);
    setFormStatus('active');
    setFormDob('');
    setFormPanNumber('');
    setFormAadhaarNumber('');
    setFormPincode('');
    setFormCity('');
    setFormState('');
    setFormAddress('');
    setShowAdditional(false);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (target: User) => {
    setSelectedUser(target);
    setFormName(target.name);
    setFormEmail(target.email);
    setFormPhone(target.phone || '');
    setFormPassword('');
    setFormAgentId(typeof target.agent_id === 'object' ? target.agent_id?._id || '' : target.agent_id || '');
    setFormRoles(target.roles || ['user']);
    setFormStatus(target.status);
    setFormDob(target.dob ? new Date(target.dob).toISOString().split('T')[0] : '');
    setFormPanNumber(target.pan_number || '');
    setFormAadhaarNumber(target.aadhaar_number || '');
    setFormPincode(target.pincode || '');
    setFormCity(target.city || '');
    setFormState(target.state || '');
    setFormAddress(target.address || '');
    setShowAdditional(!!(target.dob || target.pan_number || target.aadhaar_number || target.pincode || target.city || target.state || target.address));
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    const payload = {
      name: formName,
      email: formEmail,
      phone: formPhone,
      password: formPassword || undefined,
      agent_id: formAgentId || undefined,
      roles: formRoles,
      status: formStatus,
      dob: formDob || undefined,
      pan_number: formPanNumber || undefined,
      aadhaar_number: formAadhaarNumber || undefined,
      pincode: formPincode || undefined,
      city: formCity || undefined,
      state: formState || undefined,
      address: formAddress || undefined,
    };

    try {
      let data;
      if (selectedUser) {
        data = await apiFetch(`/api/admin/users/${selectedUser._id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        data = await apiFetch('/api/admin/users', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      if (data.success) {
        setSuccess(data.message || 'User profile saved successfully!');
        setIsFormOpen(false);
        fetchUsers();
      }
    } catch (err: any) {
      setError(err.message || 'Error processing request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const data = await apiFetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
      });
      if (data.success) {
        setSuccess(data.message || 'User deleted successfully.');
        fetchUsers();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete user.');
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;
  const isAdminOrManager = currentUser?.roles.some((r) => ['admin', 'manager'].includes(r));

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-outfit font-extrabold text-3xl bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-white dark:to-zinc-400 bg-clip-text">
            User / Client Management
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Manage system clients and synchronize agent portfolios.</p>
        </div>
        {isAdminOrManager && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-sky-500 to-purple-600 hover:from-sky-400 hover:to-purple-500 rounded-xl text-sm font-semibold transition-all shadow-md shadow-sky-500/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Client</span>
          </button>
        )}
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Search & Filters & Bulk actions */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center bg-zinc-100/50 dark:bg-zinc-900/30 p-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
          <div className="flex-1 w-full relative">
            <Search className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search clients by name, email, phone or roles..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 glass-input rounded-xl text-sm focus:outline-none"
            />
          </div>
        </div>

        {/* Bulk Assign Panel */}
        {isAdminOrManager && selectedUserIds.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-sky-500/5 border border-sky-500/20 rounded-2xl gap-4">
            <div className="flex items-center space-x-2.5">
              <UserPlus className="w-5 h-5 text-sky-400" />
              <span className="text-sm font-semibold text-zinc-300">
                Selected {selectedUserIds.length} users for Assignment
              </span>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={bulkAgentId}
                onChange={(e) => setBulkAgentId(e.target.value)}
                className="flex-1 sm:w-56 px-4 py-2 bg-white dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-700 dark:text-zinc-350 focus:outline-none focus:border-sky-500"
              >
                <option value="">Unassign / No Agent</option>
                {agents.map((agent) => (
                  <option key={agent._id} value={agent._id}>
                    Assign to: {agent.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleBulkAssign}
                disabled={bulkSubmitting}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-semibold shadow-md transition-colors disabled:opacity-50 flex items-center space-x-1"
              >
                {bulkSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Apply</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Users table */}
      <div className="glass-panel border border-zinc-200 dark:border-zinc-800/80 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-sky-500 mb-2" />
            <p className="text-zinc-500 text-sm">Loading users list...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="py-20 text-center">
            <Users className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400 text-sm">No users found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800/80 text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-100/50 dark:bg-zinc-950/20">
                  {isAdminOrManager && (
                    <th className="py-3.5 px-6 w-10">
                      <button
                        onClick={handleSelectAll}
                        className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      >
                        {selectedUserIds.length === users.length ? (
                          <CheckSquare className="w-4.5 h-4.5 text-sky-400" />
                        ) : (
                          <Square className="w-4.5 h-4.5" />
                        )}
                      </button>
                    </th>
                  )}
                  <th className="py-3.5 px-6">Name</th>
                  <th className="py-3.5 px-6">Assigned Agent</th>
                  <th className="py-3.5 px-6">Roles</th>
                  <th className="py-3.5 px-6">Status</th>
                  {isAdminOrManager && <th className="py-3.5 px-6 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900 text-sm">
                {users.map((item) => (
                  <tr key={item._id} className="hover:bg-zinc-100/50 dark:hover:bg-zinc-800/10 transition-colors">
                    {isAdminOrManager && (
                      <td className="py-4 px-6">
                        <button
                          onClick={() => handleSelectUser(item._id)}
                          className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
                        >
                          {selectedUserIds.includes(item._id) ? (
                            <CheckSquare className="w-4.5 h-4.5 text-sky-400" />
                          ) : (
                            <Square className="w-4.5 h-4.5" />
                          )}
                        </button>
                      </td>
                    )}
                    <td className="py-4 px-6 font-semibold text-zinc-900 dark:text-white">
                      <div>
                        <p className="text-zinc-900 dark:text-white text-sm font-bold">{item.name}</p>
                        <p className="text-zinc-500 dark:text-zinc-400 text-xs font-normal mt-0.5">{item.email}</p>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-normal mt-0.5">{item.phone || 'No Phone'}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {item.agent_id ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/5 text-blue-400 border border-blue-500/10">
                          {typeof item.agent_id === 'object' ? item.agent_id.name : 'Assigned'}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-500 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1">
                        {item.roles.map((r, i) => (
                          <span key={i} className="text-[10px] font-bold px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-md capitalize">
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {item.status === 'active' ? (
                        <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                          <span>Inactive</span>
                        </span>
                      )}
                    </td>
                    {isAdminOrManager && (
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-2.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="Edit User"
                            className="p-1.5 bg-sky-500/10 hover:bg-sky-500 text-sky-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            title="Delete User"
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 bg-zinc-100/20 dark:bg-zinc-950/20 border-t border-zinc-200 dark:border-zinc-800">
            <span className="text-xs text-zinc-500">
              Total {total} items | Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-350 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                Prev
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-350 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Creation & Editing Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white font-outfit">
                {selectedUser ? 'Edit User Details' : 'Register New client'}
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              <div>
                <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2.5 glass-input rounded-xl text-sm focus:outline-none"
                  placeholder="Jane Smith"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Email address</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-4 py-2.5 glass-input rounded-xl text-sm focus:outline-none"
                  placeholder="jane.smith@example.com"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Phone</label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-4 py-2.5 glass-input rounded-xl text-sm focus:outline-none"
                  placeholder="9876543210"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
                  Password {selectedUser && '(Leave empty to keep current)'}
                </label>
                <input
                  type="password"
                  required={!selectedUser}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full px-4 py-2.5 glass-input rounded-xl text-sm focus:outline-none"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Assigned Agent</label>
                <select
                  value={formAgentId}
                  onChange={(e) => setFormAgentId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-700 dark:text-zinc-350 focus:outline-none"
                >
                  <option value="">No Agent Assigned</option>
                  {agents.map((agent) => (
                    <option key={agent._id} value={agent._id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">System Role</label>
                  <select
                    value={formRoles[0]}
                    onChange={(e) => setFormRoles([e.target.value])}
                    className="w-full px-4 py-2.5 bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-700 dark:text-zinc-350 focus:outline-none"
                  >
                    <option value="user">User / Investor</option>
                    <option value="agent">Agent</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-700 dark:text-zinc-350 focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Collapsible Premium Details Button */}
              <button
                type="button"
                onClick={() => setShowAdditional(!showAdditional)}
                className="w-full py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-2 focus:outline-none cursor-pointer"
              >
                <span>Additional Profile Details</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showAdditional ? 'rotate-180' : ''}`} />
              </button>

              {/* Additional profile fields */}
              <div id="additional-details" className={`space-y-4 animate-fade-in pt-2 ${showAdditional ? '' : 'hidden'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="input-dob" className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      id="input-dob"
                      name="dob"
                      value={formDob}
                      onChange={(e) => setFormDob(e.target.value)}
                      className="w-full px-4 py-2.5 glass-input rounded-xl text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="input-pan" className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
                      PAN Number
                    </label>
                    <input
                      type="text"
                      id="input-pan"
                      name="pan_number"
                      placeholder="ABCDE1234F"
                      maxLength={10}
                      value={formPanNumber}
                      onChange={(e) => setFormPanNumber(e.target.value.toUpperCase())}
                      className="w-full px-4 py-2.5 glass-input rounded-xl text-sm focus:outline-none uppercase"
                    />
                  </div>
                  <div>
                    <label htmlFor="input-aadhaar" className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
                      Aadhaar Number
                    </label>
                    <input
                      type="text"
                      id="input-aadhaar"
                      name="aadhaar_number"
                      placeholder="123456789012"
                      maxLength={12}
                      value={formAadhaarNumber}
                      onChange={(e) => setFormAadhaarNumber(e.target.value)}
                      className="w-full px-4 py-2.5 glass-input rounded-xl text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="input-pincode" className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
                      Pincode
                    </label>
                    <input
                      type="text"
                      id="input-pincode"
                      name="pincode"
                      placeholder="123456"
                      maxLength={6}
                      value={formPincode}
                      onChange={(e) => setFormPincode(e.target.value)}
                      className="w-full px-4 py-2.5 glass-input rounded-xl text-sm focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="input-city" className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      id="input-city"
                      name="city"
                      placeholder="Mumbai"
                      value={formCity}
                      onChange={(e) => setFormCity(e.target.value)}
                      className="w-full px-4 py-2.5 glass-input rounded-xl text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="input-state" className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      id="input-state"
                      name="state"
                      placeholder="Maharashtra"
                      value={formState}
                      onChange={(e) => setFormState(e.target.value)}
                      className="w-full px-4 py-2.5 glass-input rounded-xl text-sm focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="input-address" className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
                    Address
                  </label>
                  <textarea
                    id="input-address"
                    name="address"
                    rows={2}
                    placeholder="Street Address..."
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    className="w-full px-4 py-2.5 glass-input rounded-xl text-sm focus:outline-none"
                  ></textarea>
                </div>
              </div>

              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 flex justify-end space-x-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-5 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-purple-600 hover:from-sky-400 hover:to-purple-500 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center space-x-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Client</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
