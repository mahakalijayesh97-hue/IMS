'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import {
  Users,
  UserCheck,
  Shield,
  UserCog,
  Headset,
  Wallet,
  Coins,
  TrendingUp,
  Loader2,
  AlertCircle,
  IndianRupee,
  ArrowUpRight,
} from 'lucide-react';

interface Stats {
  total_users: number;
  active_users: number;
  admins: number;
  managers: number;
  agents: number;
  investors: number;
  total_invested: number;
  total_current_value: number;
}

interface AgentPerformance {
  id: string;
  name: string;
  email: string;
  phone: string;
  clients_count: number;
  status: string;
  user: { last_login_at: string | null } | null;
}

export default function DashboardOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const res = await apiFetch('/api/admin/dashboard');
        if (res.success) {
          setStats(res.stats);
          setAgentPerformance(res.agentPerformance || []);
        } else {
          setError(res.message || 'Failed to fetch dashboard stats.');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred while loading data.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-sky-500 mb-2" />
        <p className="text-zinc-400 text-sm">Aggregating stats...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] p-6 bg-rose-500/5 border border-rose-500/10 rounded-3xl">
        <AlertCircle className="w-12 h-12 text-rose-400 mb-4" />
        <h3 className="text-lg font-bold mb-2">Error Loading Dashboard</h3>
        <p className="text-zinc-400 text-sm text-center max-w-md mb-4">{error || 'Data is unavailable.'}</p>
      </div>
    );
  }

  const isAdminOrManager = user?.roles.some(role => ['admin', 'manager'].includes(role));
  const isInvestor = user?.roles.some(role => ['investor', 'user'].includes(role));

  const returnPercentage = stats.total_invested > 0
    ? ((stats.total_current_value - stats.total_invested) / stats.total_invested) * 100
    : 0;

  // SVG doughnut data
  const doughnutRaw = isAdminOrManager
    ? [
        { label: 'Admins',    value: stats.admins,    color: '#f43f5e' },
        { label: 'Managers',  value: stats.managers,  color: '#f59e0b' },
        { label: 'Agents',    value: stats.agents,    color: '#3b82f6' },
        { label: 'Investors', value: stats.investors, color: '#a855f7' },
      ]
    : [{ label: 'Assigned Clients', value: stats.total_users, color: '#a855f7' }];

  const doughnutData = doughnutRaw.filter(d => d.value > 0);
  const totalDoughnutVal = doughnutData.reduce((acc, d) => acc + d.value, 0) || 1;
  let currentStrokeOffset = 0;

  // Format INR
  const fmt = (n: number) => '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-8 p-4">

      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div>
        <h1 className="font-outfit font-extrabold text-3xl tracking-tight bg-gradient-to-r from-zinc-950 to-zinc-700 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
          Dashboard Overview
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
          {isInvestor ? 'Real-time statistics and portfolio insights.' : 'Real-time statistics and access control insights.'}
        </p>
      </div>

      {/* ── Quick Stats Grid ─────────────────────────────────────────────────── */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isInvestor ? 'lg:grid-cols-2' : 'lg:grid-cols-4'} gap-6`}>

        {/* Card: Total Users */}
        {!isInvestor && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 hover:scale-[1.02] hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider">Total Users</span>
              <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold font-outfit">{stats.total_users}</h3>
              <p className="text-[11px] text-zinc-400 mt-1">System wide registration</p>
            </div>
          </div>
        )}

        {/* Card: Active Users */}
        {!isInvestor && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 hover:scale-[1.02] hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider">Active Users</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold font-outfit text-emerald-600 dark:text-emerald-400">{stats.active_users}</h3>
              <p className="text-[11px] text-zinc-400 mt-1">Active status accounts</p>
            </div>
          </div>
        )}

        {/* Admin/Manager only cards */}
        {isAdminOrManager && (
          <>
            {/* Card: Administrators */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 hover:scale-[1.02] hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider">Administrators</span>
                <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold font-outfit text-rose-600 dark:text-rose-400">{stats.admins}</h3>
                <p className="text-[11px] text-zinc-400 mt-1">Full privilege permissions</p>
              </div>
            </div>

            {/* Card: Managers */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 hover:scale-[1.02] hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider">Managers</span>
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <UserCog className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold font-outfit text-amber-600 dark:text-amber-400">{stats.managers}</h3>
                <p className="text-[11px] text-zinc-400 mt-1">Intermediate permissions</p>
              </div>
            </div>

            {/* Card: Agents */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 hover:scale-[1.02] hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider">Agents</span>
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Headset className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold font-outfit text-blue-600 dark:text-blue-400">{stats.agents}</h3>
                <p className="text-[11px] text-zinc-400 mt-1">Client managers</p>
              </div>
            </div>
          </>
        )}

        {/* Card: Investors */}
        {!isInvestor && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 hover:scale-[1.02] hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider">Investors</span>
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold font-outfit text-purple-600 dark:text-purple-400">{stats.investors}</h3>
              <p className="text-[11px] text-zinc-400 mt-1">Standard clients</p>
            </div>
          </div>
        )}

        {/* Card: Total Portfolio (gradient) */}
        <div className="bg-gradient-to-br from-sky-600 to-purple-600 border border-sky-500 rounded-2xl p-5 hover:scale-[1.02] hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-sky-100 text-xs font-semibold uppercase tracking-wider">Total Portfolio</span>
            <div className="w-8 h-8 rounded-lg bg-white/20 text-white flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold font-outfit text-white">{fmt(stats.total_invested)}</h3>
            <p className="text-[11px] text-sky-200 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Invested Value
            </p>
          </div>
        </div>

        {/* Card: Overall Current Value (emerald gradient) */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 border border-emerald-500 rounded-2xl p-5 hover:scale-[1.02] hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-emerald-100 text-xs font-semibold uppercase tracking-wider">Current Value</span>
            <div className="w-8 h-8 rounded-lg bg-white/20 text-white flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold font-outfit text-white">{fmt(stats.total_current_value)}</h3>
            <p className="text-[11px] text-emerald-200 mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> Overall Current Value
            </p>
          </div>
        </div>

      </div>

      {/* ── Charts & Analytics ───────────────────────────────────────────────── */}
      {!isInvestor && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Roles Allocation Doughnut */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 lg:col-span-1 flex flex-col">
            <h3 className="text-base font-bold font-outfit mb-4">Roles Allocation</h3>
            <div className="relative flex-1 flex items-center justify-center h-64">
              <svg width="180" height="180" viewBox="0 0 42 42" className="transform -rotate-90">
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#e4e4e7" className="dark:stroke-zinc-800" strokeWidth="4.2" />
                {doughnutData.map((d, index) => {
                  const percentage = (d.value / totalDoughnutVal) * 100;
                  const strokeDasharray = `${percentage} ${100 - percentage}`;
                  const offset = 100 - currentStrokeOffset;
                  currentStrokeOffset += percentage;
                  return (
                    <circle
                      key={index}
                      cx="21" cy="21" r="15.915"
                      fill="transparent"
                      stroke={d.color}
                      strokeWidth="4.2"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={offset}
                    />
                  );
                })}
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-bold font-outfit">{totalDoughnutVal}</span>
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Total</span>
              </div>
            </div>
            {/* Legend */}
            <div className="space-y-2.5 mt-2">
              {doughnutData.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-zinc-500 dark:text-zinc-400 font-medium">{d.label}</span>
                  </div>
                  <span className="font-bold">{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Users Activity Bar Chart */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 lg:col-span-2 flex flex-col">
            <h3 className="text-base font-bold font-outfit mb-4">
              {isAdminOrManager ? 'Users Activity & Account Status' : 'Client Activity & Account Status'}
            </h3>

            <div className="flex-1 h-64 flex items-end justify-around border-b border-zinc-200 dark:border-zinc-800/80 pb-2 relative">
              {/* Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                <div className="border-t border-zinc-100 dark:border-zinc-800/30 w-full" />
                <div className="border-t border-zinc-100 dark:border-zinc-800/30 w-full" />
                <div className="border-t border-zinc-100 dark:border-zinc-800/30 w-full" />
              </div>

              {/* Total Accounts Bar */}
              <div className="flex flex-col items-center space-y-2 w-1/3 relative z-10 group">
                <div className="text-xs font-bold text-sky-500 dark:text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {stats.total_users}
                </div>
                <div
                  className="w-16 rounded-t-xl bg-sky-500/80 hover:bg-sky-500 shadow-lg shadow-sky-500/20 transition-all duration-500"
                  style={{ height: `${Math.max((stats.total_users / (stats.total_users || 1)) * 140, 12)}px` }}
                />
                <span className="text-xs text-zinc-400 font-semibold mt-2">
                  {isAdminOrManager ? 'Total Accounts' : 'Total Clients'}
                </span>
              </div>

              {/* Active Accounts Bar */}
              <div className="flex flex-col items-center space-y-2 w-1/3 relative z-10 group">
                <div className="text-xs font-bold text-emerald-500 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {stats.active_users}
                </div>
                <div
                  className="w-16 rounded-t-xl bg-emerald-500/80 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 transition-all duration-500"
                  style={{ height: `${Math.max((stats.active_users / (stats.total_users || 1)) * 140, 12)}px` }}
                />
                <span className="text-xs text-zinc-400 font-semibold mt-2">
                  {isAdminOrManager ? 'Active Accounts' : 'Active Clients'}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs text-zinc-400 mt-3">
              <span>Overall Account Standing</span>
              <span className="text-emerald-500 dark:text-emerald-400 font-bold">
                {stats.total_users > 0 ? ((stats.active_users / stats.total_users) * 100).toFixed(1) : 0}% Active Rate
              </span>
            </div>
          </div>

        </div>
      )}

      {/* ── Agent Performance Table ───────────────────────────────────────────── */}
      {isAdminOrManager && agentPerformance.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold font-outfit">Agent Performance &amp; Client Assignments</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  <th className="py-3 px-4">Agent Name</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4 text-center">Assigned Clients</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Last Login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-sm">
                {agentPerformance.map((agent) => (
                  <tr key={agent.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-all">
                    <td className="py-3 px-4 font-semibold">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs uppercase">
                          {agent.name.substring(0, 2)}
                        </div>
                        <span>{agent.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-zinc-600 dark:text-zinc-300">{agent.email}</p>
                      <p className="text-xs text-zinc-400">{agent.phone}</p>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        agent.clients_count > 0
                          ? 'bg-sky-50 dark:bg-sky-950/20 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800/50'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                      }`}>
                        {agent.clients_count} Clients
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {agent.status === 'active' ? (
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Active</span>
                        </span>
                      ) : agent.status === 'inactive' ? (
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          <span>Inactive</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          <span>Pending</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-zinc-500 dark:text-zinc-400 text-xs">
                      {agent.user?.last_login_at
                        ? new Date(agent.user.last_login_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'short', timeStyle: 'short' })
                        : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
