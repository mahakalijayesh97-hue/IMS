'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import {
  Briefcase,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  AlertTriangle,
  X,
  XCircle,
  Eye,
  Loader2,
  Activity
} from 'lucide-react';

interface Agent {
  _id: string;
  name: string;
  email: string;
  phone: string;
  agent_type: 'independent' | 'agency';
  agency_name?: string;
  license_number?: string;
  license_expiry?: string;
  certification_body?: string;
  experience_years?: number;
  bio?: string;
  status: 'pending' | 'active' | 'suspended';
  clients_count: number;
  approved_at?: string;
  createdAt: string;
}

export default function AgentsPage() {
  const { user } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  // Form inputs
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formAgentType, setFormAgentType] = useState<'independent' | 'agency'>('independent');
  const [formAgencyName, setFormAgencyName] = useState('');
  const [formLicenseNumber, setFormLicenseNumber] = useState('');
  const [formLicenseExpiry, setFormLicenseExpiry] = useState('');
  const [formCertificationBody, setFormCertificationBody] = useState('');
  const [formExperienceYears, setFormExperienceYears] = useState(0);
  const [formBio, setFormBio] = useState('');
  const [formStatus, setFormStatus] = useState<'pending' | 'active' | 'suspended'>('pending');
  const [submitting, setSubmitting] = useState(false);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/api/admin/agents', {
        params: {
          search,
          status: statusFilter,
        },
      });
      if (data.success) {
        setAgents(data.agents || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve agents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [search, statusFilter]);

  const handleOpenCreate = () => {
    setSelectedAgent(null);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormPassword('');
    setFormAgentType('independent');
    setFormAgencyName('');
    setFormLicenseNumber('');
    setFormLicenseExpiry('');
    setFormCertificationBody('');
    setFormExperienceYears(0);
    setFormBio('');
    setFormStatus('pending');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (agent: Agent) => {
    setSelectedAgent(agent);
    setFormName(agent.name);
    setFormEmail(agent.email);
    setFormPhone(agent.phone || '');
    setFormPassword(''); // Keep blank to retain existing
    setFormAgentType(agent.agent_type);
    setFormAgencyName(agent.agency_name || '');
    setFormLicenseNumber(agent.license_number || '');
    setFormLicenseExpiry(agent.license_expiry ? agent.license_expiry.substring(0, 10) : '');
    setFormCertificationBody(agent.certification_body || '');
    setFormExperienceYears(agent.experience_years || 0);
    setFormBio(agent.bio || '');
    setFormStatus(agent.status);
    setIsFormOpen(true);
  };

  const handleOpenDetail = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsDetailOpen(true);
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
      agent_type: formAgentType,
      agency_name: formAgentType === 'agency' ? formAgencyName : undefined,
      license_number: formLicenseNumber || undefined,
      license_expiry: formLicenseExpiry || undefined,
      certification_body: formCertificationBody || undefined,
      experience_years: Number(formExperienceYears) || 0,
      bio: formBio || undefined,
      status: formStatus,
    };

    try {
      let data;
      if (selectedAgent) {
        data = await apiFetch(`/api/admin/agents/${selectedAgent._id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        data = await apiFetch('/api/admin/agents', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      if (data.success) {
        setSuccess(data.message || 'Agent saved successfully!');
        setIsFormOpen(false);
        fetchAgents();
      }
    } catch (err: any) {
      setError(err.message || 'Error processing request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (agent: Agent, newStatus: 'pending' | 'active' | 'suspended') => {
    if (!confirm(`Are you sure you want to update status to ${newStatus}?`)) return;
    try {
      const data = await apiFetch(`/api/admin/agents/${agent._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: agent.name,
          email: agent.email,
          agent_type: agent.agent_type,
          status: newStatus,
        }),
      });
      if (data.success) {
        setSuccess(data.message || 'Status updated successfully!');
        fetchAgents();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update agent status.');
    }
  };

  const handleDelete = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return;
    try {
      const data = await apiFetch(`/api/admin/agents/${agentId}`, {
        method: 'DELETE',
      });
      if (data.success) {
        setSuccess(data.message || 'Agent deleted successfully.');
        fetchAgents();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete agent.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-outfit font-extrabold text-3xl bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-white dark:to-zinc-400 bg-clip-text">
            Agent Management
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Approve, monitor, and configure system agents.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-sky-500 to-purple-600 hover:from-sky-400 hover:to-purple-500 rounded-xl text-sm font-semibold transition-all shadow-md shadow-sky-500/10 cursor-pointer text-white"
        >
          <Plus className="w-4 h-4" />
          <span>New Agent</span>
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-sm flex items-center space-x-2 animate-fade-in">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm flex items-center space-x-2 animate-fade-in">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center bg-zinc-100/50 dark:bg-zinc-900/30 p-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
        <div className="flex-1 w-full relative">
          <Search className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by agent name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 glass-input rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-48 px-4 py-2.5 bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-sky-500"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Table grid */}
      <div className="glass-panel border border-zinc-200 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-sky-500 mb-2" />
            <p className="text-zinc-500 text-sm">Loading agents list...</p>
          </div>
        ) : agents.length === 0 ? (
          <div className="py-20 text-center">
            <Briefcase className="w-12 h-12 text-zinc-400 dark:text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">No agents match your criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800/80 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest bg-zinc-100/50 dark:bg-zinc-950/20">
                  <th className="py-3.5 px-6">Name</th>
                  <th className="py-3.5 px-6">License / Type</th>
                  <th className="py-3.5 px-6 text-center">Clients Count</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900 text-sm">
                {agents.map((agent) => (
                  <tr key={agent._id} className="hover:bg-zinc-100/50 dark:hover:bg-zinc-800/10 transition-colors">
                    <td className="py-4 px-6 font-semibold text-zinc-900 dark:text-white">
                      <div>
                        <p className="text-zinc-900 dark:text-white text-sm font-bold">{agent.name}</p>
                        <p className="text-zinc-500 dark:text-zinc-400 text-xs font-normal mt-0.5">{agent.email}</p>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-normal mt-0.5">{agent.phone || 'No phone'}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="capitalize text-zinc-700 dark:text-zinc-300 font-medium text-xs">
                        {agent.agent_type} {agent.agency_name ? `(${agent.agency_name})` : ''}
                      </p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5">
                        License: {agent.license_number || 'N/A'}
                      </p>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-500/5 text-sky-600 dark:text-sky-400 border border-sky-500/10">
                        {agent.clients_count} Clients
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {agent.status === 'active' ? (
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                          <span>Active</span>
                        </span>
                      ) : agent.status === 'suspended' ? (
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          <span>Suspended</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse" />
                          <span>Pending Approval</span>
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2.5">
                        <button
                          onClick={() => handleOpenDetail(agent)}
                          title="View Details"
                          className="p-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {agent.status === 'pending' && (
                          <button
                            onClick={() => handleUpdateStatus(agent, 'active')}
                            title="Approve Agent"
                            className="p-1.5 bg-emerald-500/10 hover:bg-emerald-600 text-emerald-600 dark:text-emerald-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}

                        {agent.status === 'active' && (
                          <button
                            onClick={() => handleUpdateStatus(agent, 'suspended')}
                            title="Suspend Agent"
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}

                        {agent.status === 'suspended' && (
                          <button
                            onClick={() => handleUpdateStatus(agent, 'active')}
                            title="Re-activate Agent"
                            className="p-1.5 bg-emerald-500/10 hover:bg-emerald-600 text-emerald-600 dark:text-emerald-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                          >
                            <Activity className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenEdit(agent)}
                          title="Edit Agent"
                          className="p-1.5 bg-sky-500/10 hover:bg-sky-600 text-sky-600 dark:text-sky-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(agent._id)}
                          title="Delete Agent"
                          className="p-1.5 bg-rose-500/10 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Creation & Modification modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white font-outfit">
                {selectedAgent ? 'Edit Agent Profile' : 'Register New Agent'}
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Agent Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-50/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 focus:border-sky-500 dark:focus:border-sky-500 rounded-xl text-sm text-zinc-800 dark:text-zinc-100 placeholder-zinc-405 dark:placeholder-zinc-500 focus:outline-none transition-all"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-50/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 focus:border-sky-500 dark:focus:border-sky-500 rounded-xl text-sm text-zinc-800 dark:text-zinc-100 placeholder-zinc-405 dark:placeholder-zinc-500 focus:outline-none transition-all"
                    placeholder="john.doe@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Phone Number</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-50/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 focus:border-sky-500 dark:focus:border-sky-500 rounded-xl text-sm text-zinc-800 dark:text-zinc-100 placeholder-zinc-405 dark:placeholder-zinc-500 focus:outline-none transition-all"
                    placeholder="9876543210"
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
                    Password {selectedAgent && '(Leave blank to retain)'}
                  </label>
                  <input
                    type="password"
                    required={!selectedAgent}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-50/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 focus:border-sky-500 dark:focus:border-sky-500 rounded-xl text-sm text-zinc-800 dark:text-zinc-100 placeholder-zinc-405 dark:placeholder-zinc-500 focus:outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Agent Type</label>
                  <select
                    value={formAgentType}
                    onChange={(e) => setFormAgentType(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-sky-500"
                  >
                    <option value="independent">Independent</option>
                    <option value="agency">Agency-Based</option>
                  </select>
                </div>
                {formAgentType === 'agency' && (
                  <div>
                    <label className="block text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Agency Name</label>
                    <input
                      type="text"
                      required
                      value={formAgencyName}
                      onChange={(e) => setFormAgencyName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-zinc-50/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 focus:border-sky-500 dark:focus:border-sky-500 rounded-xl text-sm text-zinc-800 dark:text-zinc-100 placeholder-zinc-405 dark:placeholder-zinc-500 focus:outline-none transition-all"
                      placeholder="Apex Wealth Inc."
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">License Number</label>
                  <input
                    type="text"
                    value={formLicenseNumber}
                    onChange={(e) => setFormLicenseNumber(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-50/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 focus:border-sky-500 dark:focus:border-sky-500 rounded-xl text-sm text-zinc-800 dark:text-zinc-100 placeholder-zinc-405 dark:placeholder-zinc-500 focus:outline-none transition-all"
                    placeholder="LIC-100293"
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">License Expiry</label>
                  <input
                    type="date"
                    value={formLicenseExpiry}
                    onChange={(e) => setFormLicenseExpiry(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-50/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 focus:border-sky-500 dark:focus:border-sky-500 rounded-xl text-sm text-zinc-700 dark:text-zinc-350 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Certification Body</label>
                  <input
                    type="text"
                    value={formCertificationBody}
                    onChange={(e) => setFormCertificationBody(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-50/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 focus:border-sky-500 dark:focus:border-sky-500 rounded-xl text-sm text-zinc-800 dark:text-zinc-100 placeholder-zinc-405 dark:placeholder-zinc-500 focus:outline-none transition-all"
                    placeholder="AMFI / IRDAI"
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Experience (Years)</label>
                  <input
                    type="number"
                    value={formExperienceYears}
                    onChange={(e) => setFormExperienceYears(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-zinc-50/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 focus:border-sky-500 dark:focus:border-sky-500 rounded-xl text-sm text-zinc-800 dark:text-zinc-100 placeholder-zinc-405 dark:placeholder-zinc-500 focus:outline-none transition-all"
                    placeholder="5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Bio / Description</label>
                <textarea
                  value={formBio}
                  onChange={(e) => setFormBio(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-zinc-50/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 focus:border-sky-500 dark:focus:border-sky-500 rounded-xl text-sm text-zinc-800 dark:text-zinc-100 placeholder-zinc-405 dark:placeholder-zinc-500 focus:outline-none transition-all"
                  placeholder="Tell us about the agent..."
                />
              </div>

              <div>
                <label className="block text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Initial Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-sky-500"
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 flex justify-end space-x-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-5 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-purple-600 hover:from-sky-400 hover:to-purple-500 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center space-x-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Agent</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Details View Modal */}
      {isDetailOpen && selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white font-outfit">Agent Details</h2>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-sky-500 to-purple-600 flex items-center justify-center font-bold text-white uppercase">
                  {selectedAgent.name.substring(0, 2)}
                </div>
                <div>
                  <h3 className="text-md font-bold text-zinc-900 dark:text-white">{selectedAgent.name}</h3>
                  <p className="text-xs text-sky-600 dark:text-sky-400 font-semibold capitalize">{selectedAgent.agent_type} Agent</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs mt-4">
                <div className="bg-zinc-50 dark:bg-zinc-950/40 p-3 rounded-xl border border-zinc-200 dark:border-zinc-900">
                  <p className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[9px]">Email</p>
                  <p className="text-zinc-800 dark:text-zinc-200 mt-1 font-semibold break-all">{selectedAgent.email}</p>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-950/40 p-3 rounded-xl border border-zinc-200 dark:border-zinc-900">
                  <p className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[9px]">Phone</p>
                  <p className="text-zinc-800 dark:text-zinc-200 mt-1 font-semibold">{selectedAgent.phone || 'N/A'}</p>
                </div>
                {selectedAgent.agency_name && (
                  <div className="bg-zinc-50 dark:bg-zinc-950/40 p-3 rounded-xl border border-zinc-200 dark:border-zinc-900 col-span-2">
                    <p className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[9px]">Agency Name</p>
                    <p className="text-zinc-800 dark:text-zinc-200 mt-1 font-semibold">{selectedAgent.agency_name}</p>
                  </div>
                )}
                <div className="bg-zinc-50 dark:bg-zinc-950/40 p-3 rounded-xl border border-zinc-200 dark:border-zinc-900">
                  <p className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[9px]">License Number</p>
                  <p className="text-zinc-800 dark:text-zinc-200 mt-1 font-semibold">{selectedAgent.license_number || 'N/A'}</p>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-950/40 p-3 rounded-xl border border-zinc-200 dark:border-zinc-900">
                  <p className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[9px]">License Expiry</p>
                  <p className="text-zinc-800 dark:text-zinc-200 mt-1 font-semibold">
                    {selectedAgent.license_expiry ? new Date(selectedAgent.license_expiry).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-950/40 p-3 rounded-xl border border-zinc-200 dark:border-zinc-900">
                  <p className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[9px]">Experience (Years)</p>
                  <p className="text-zinc-800 dark:text-zinc-200 mt-1 font-semibold">{selectedAgent.experience_years || 0} Years</p>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-950/40 p-3 rounded-xl border border-zinc-200 dark:border-zinc-900">
                  <p className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[9px]">Certifications</p>
                  <p className="text-zinc-800 dark:text-zinc-200 mt-1 font-semibold">{selectedAgent.certification_body || 'None'}</p>
                </div>
              </div>

              {selectedAgent.bio && (
                <div className="bg-zinc-50 dark:bg-zinc-950/40 p-3 rounded-xl border border-zinc-200 dark:border-zinc-900 text-xs">
                  <p className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[9px]">Biography</p>
                  <p className="text-zinc-700 dark:text-zinc-300 mt-1 leading-relaxed">{selectedAgent.bio}</p>
                </div>
              )}

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="px-5 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
