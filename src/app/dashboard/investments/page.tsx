'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import {
  Wallet,
  Search,
  ChevronRight,
  TrendingUp,
  Award,
  Calendar,
  Layers,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Briefcase,
  X,
  Download,
  Percent
} from 'lucide-react';

interface PortfolioUser {
  user_id: string;
  name: string;
  email: string;
  total_invested: number;
  total_current: number;
  investment_count: number;
}

interface InvestmentItem {
  _id: string;
  investment_type: string;
  category_id: { _id: string; name: string; color?: string } | null;
  policy_number?: string;
  name: string;
  scheme_name?: string;
  stock_symbol?: string;
  invested_amount: number;
  current_value: number;
  start_date: string;
  investment_date?: string;
  status: string;
}

interface UserPortfolioStats {
  total_invested: number;
  total_current: number;
  return_amount: number;
  return_percentage: number;
}

export default function InvestmentsPage() {
  const { user } = useAuth();
  
  // List of users having investments
  const [portfolios, setPortfolios] = useState<PortfolioUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  // Selected User Portfolio
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState('');
  const [selectedUserEmail, setSelectedUserEmail] = useState('');
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [investments, setInvestments] = useState<InvestmentItem[]>([]);
  const [portfolioStats, setPortfolioStats] = useState<UserPortfolioStats | null>(null);

  // Single Investment Detail
  const [selectedInvestmentId, setSelectedInvestmentId] = useState<string | null>(null);
  const [investmentDetail, setInvestmentDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchPortfolios = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiFetch('/api/admin/investments', {
        params: { search: search || undefined }
      });
      if (data.success) {
        setPortfolios(data.portfolios || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load portfolios list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedUserId) {
      fetchPortfolios();
    }
  }, [search, selectedUserId]);

  const handleSelectUser = async (userId: string, userName: string, userEmail: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setSelectedUserEmail(userEmail);
    setPortfolioLoading(true);
    setError('');

    try {
      const data = await apiFetch(`/api/admin/investments/user/${userId}`);
      if (data.success) {
        setInvestments(data.investments || []);
        if (data.stats) {
          setPortfolioStats({
            total_invested: data.stats.total_invested || 0,
            total_current: data.stats.total_current || 0,
            return_amount: typeof data.stats.total_return === 'number' ? data.stats.total_return : (data.stats.total_current - data.stats.total_invested),
            return_percentage: data.stats.return_percentage || 0
          });
        } else {
          setPortfolioStats(null);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load user portfolio.');
    } finally {
      setPortfolioLoading(false);
    }
  };

  const handleSelectInvestment = async (id: string) => {
    setSelectedInvestmentId(id);
    setDetailLoading(true);
    try {
      const data = await apiFetch(`/api/admin/investments/detail/${id}`);
      if (data.success) {
        setInvestmentDetail(data.investment);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to load investment details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleExportAll = () => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    window.open(`/api/admin/investments/export${query}`, '_blank');
  };

  const handleExportUser = () => {
    if (selectedUserId) {
      window.open(`/api/admin/investments/user/${selectedUserId}/export`, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Overview stats list */}
      {!selectedUserId ? (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-outfit font-extrabold text-3xl bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-white dark:to-zinc-400 bg-clip-text">
                Client Investment Portfolios
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Review active assets and absolute returns across clients.</p>
            </div>
            <div>
              <button
                onClick={handleExportAll}
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-purple-600 hover:from-sky-400 hover:to-purple-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-sky-500/10 hover:shadow-sky-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export Data</span>
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex gap-4 items-center bg-zinc-100/50 dark:bg-zinc-900/30 p-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
            <div className="flex-1 relative">
              <Search className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search portfolios by client name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 glass-input rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Portfolios list table */}
          <div className="glass-panel border border-zinc-200 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-sky-500 mb-2" />
                <p className="text-zinc-500 text-sm">Aggregating client portfolios...</p>
              </div>
            ) : portfolios.length === 0 ? (
              <div className="py-20 text-center">
                <Wallet className="w-12 h-12 text-zinc-400 dark:text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">No investment portfolios found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800/80 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest bg-zinc-100/50 dark:bg-zinc-950/20">
                      <th className="py-3.5 px-6">Client Name</th>
                      <th className="py-3.5 px-6 text-right">Total Invested</th>
                      <th className="py-3.5 px-6 text-right">Current Value</th>
                      <th className="py-3.5 px-6 text-right font-bold">Total Gain / Yield</th>
                      <th className="py-3.5 px-6 text-center">Assets count</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900 text-sm">
                    {portfolios.map((p) => {
                      const gain = p.total_current - p.total_invested;
                      const yieldPct = p.total_invested > 0 ? (gain / p.total_invested) * 100 : 0;
                      return (
                        <tr key={p.user_id} className="hover:bg-zinc-100/50 dark:hover:bg-zinc-800/10 transition-colors">
                          <td className="py-4 px-6 font-semibold text-zinc-900 dark:text-white">
                            <div>
                              <p className="text-zinc-900 dark:text-white text-sm font-bold">{p.name}</p>
                              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-normal mt-0.5">{p.email}</p>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right text-zinc-700 dark:text-zinc-300 font-semibold font-mono">
                            ₹{p.total_invested.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-6 text-right text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                            ₹{p.total_current.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className={`py-4 px-6 text-right font-bold font-mono ${gain >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-500'}`}>
                            {gain >= 0 ? '+' : ''}₹{gain.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            <span className="text-[10px] block font-semibold">
                              {gain >= 0 ? '+' : ''}{yieldPct.toFixed(2)}%
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                              {p.investment_count} Assets
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => handleSelectUser(p.user_id, p.name, p.email)}
                              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500 text-sky-600 dark:text-sky-400 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                            >
                              <span>View Portfolio</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Selected User Portfolio View */
        <div className="space-y-6">
          {/* Back Navigation Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  setSelectedUserId(null);
                  setInvestments([]);
                  setPortfolioStats(null);
                }}
                className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white rounded-xl transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="font-outfit font-extrabold text-2xl text-zinc-900 dark:text-white">
                  {selectedUserName}'s Portfolio
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5">{selectedUserEmail}</p>
              </div>
            </div>
            <div>
              <button
                onClick={handleExportUser}
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-purple-600 hover:from-sky-400 hover:to-purple-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-sky-500/10 hover:shadow-sky-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export User Report</span>
              </button>
            </div>
          </div>

          {portfolioLoading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-sky-500 mb-2" />
              <p className="text-zinc-500 text-sm">Retrieving portfolio assets...</p>
            </div>
          ) : (
            <>
              {/* Portfolio Stats Summary Cards */}
              {portfolioStats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: Total Amount Invested */}
                  <div className="glass-panel p-5 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[135px]">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-sky-500/10 text-sky-500 dark:text-sky-400 rounded-lg">
                        <Wallet className="w-4 h-4" />
                      </div>
                      <span className="text-[9px] font-extrabold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        Invested
                      </span>
                    </div>
                    <div className="mt-3">
                      <p className="text-zinc-500 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Total Amount Invested</p>
                      <h3 className="text-xl font-bold font-mono text-zinc-900 dark:text-white mt-1">
                        ₹{portfolioStats.total_invested.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </h3>
                    </div>
                  </div>

                  {/* Card 2: Current Portfolio Value */}
                  <div className="glass-panel p-5 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[135px]">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-blue-500/10 text-blue-500 dark:text-blue-400 rounded-lg">
                        <Layers className="w-4 h-4" />
                      </div>
                      <span className="text-[9px] font-extrabold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        Portfolio
                      </span>
                    </div>
                    <div className="mt-3">
                      <p className="text-zinc-500 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Current Portfolio Value</p>
                      <h3 className="text-xl font-bold font-mono text-zinc-900 dark:text-white mt-1">
                        ₹{portfolioStats.total_current.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </h3>
                    </div>
                  </div>

                  {/* Card 3: Total Profit / Loss */}
                  <div className="glass-panel p-5 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[135px]">
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-lg ${
                        portfolioStats.return_amount >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                      }`}>
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <span className="text-[9px] font-extrabold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        Returns
                      </span>
                    </div>
                    <div className="mt-3">
                      <p className="text-zinc-500 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Total Profit / Loss</p>
                      <h3 className={`text-xl font-bold font-mono mt-1 ${
                        portfolioStats.return_amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-500'
                      }`}>
                        {portfolioStats.return_amount >= 0 ? '+' : ''}₹{portfolioStats.return_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </h3>
                    </div>
                  </div>

                  {/* Card 4: Return on Investment */}
                  <div className="glass-panel p-5 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[135px]">
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-lg ${
                        portfolioStats.return_amount >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                      }`}>
                        <Percent className="w-4 h-4" />
                      </div>
                      <span className="text-[9px] font-extrabold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        ROI
                      </span>
                    </div>
                    <div className="mt-3">
                      <p className="text-zinc-500 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Return on Investment</p>
                      <h3 className={`text-xl font-bold font-mono mt-1 ${
                        portfolioStats.return_amount >= 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-rose-600 dark:text-rose-500 font-semibold'
                      }`}>
                        {portfolioStats.return_amount >= 0 ? '+' : ''}{portfolioStats.return_percentage.toFixed(2)}%
                      </h3>
                    </div>
                  </div>
                </div>
              )}

              {/* Investments Grid List */}
              <div className="glass-panel border border-zinc-200 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800/80 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest bg-zinc-100/50 dark:bg-zinc-950/20">
                      <th className="py-3.5 px-6">Asset Details</th>
                      <th className="py-3.5 px-6">Type</th>
                      <th className="py-3.5 px-6 text-right">Invested Value</th>
                      <th className="py-3.5 px-6 text-right">Current Value</th>
                      <th className="py-3.5 px-6 text-right">Net Return</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900 text-sm">
                    {investments.map((inv) => {
                      const net = inv.current_value - inv.invested_amount;
                      const returnPct = inv.invested_amount > 0 ? (net / inv.invested_amount) * 100 : 0;
                      const dateStr = inv.start_date || inv.investment_date || '';
                      const dateDisplay = dateStr ? new Date(dateStr).toLocaleDateString() : 'N/A';
                      return (
                        <tr key={inv._id} className="hover:bg-zinc-100/50 dark:hover:bg-zinc-800/10 transition-colors">
                          <td className="py-4 px-6">
                            <p className="text-zinc-900 dark:text-white text-sm font-bold">
                              {inv.name || inv.scheme_name || inv.stock_symbol || 'Standard Investment'}
                            </p>
                            {inv.policy_number && (
                              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">Policy: {inv.policy_number}</p>
                            )}
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                              Date: {dateDisplay}
                            </p>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-[10px] font-extrabold px-2.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-md uppercase tracking-wider">
                              {inv.investment_type}
                            </span>
                            {inv.category_id && (
                              <span className="block text-[9.5px] text-zinc-500 dark:text-zinc-400 mt-1 capitalize">
                                Cat: {inv.category_id.name}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right text-zinc-700 dark:text-zinc-300 font-semibold font-mono">
                            ₹{inv.invested_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-6 text-right text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                            ₹{inv.current_value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className={`py-4 px-6 text-right font-bold font-mono ${net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-500'}`}>
                            {net >= 0 ? '+' : ''}₹{net.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            <span className="text-[10px] block font-semibold">
                              {net >= 0 ? '+' : ''}{returnPct.toFixed(2)}%
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => handleSelectInvestment(inv._id)}
                              className="px-3 py-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Investment details modal */}
      {selectedInvestmentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-md flex flex-col overflow-hidden shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-md font-bold text-zinc-900 dark:text-white font-outfit">Asset Investment Details</h2>
              <button
                onClick={() => {
                  setSelectedInvestmentId(null);
                  setInvestmentDetail(null);
                }}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {detailLoading || !investmentDetail ? (
                <div className="py-12 flex flex-col items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-sky-500 mb-2" />
                  <p className="text-zinc-500 text-xs">Loading asset metrics...</p>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="bg-zinc-50 dark:bg-zinc-950/40 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/85">
                    <p className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[9px]">Asset Name / Scheme</p>
                    <p className="text-zinc-900 dark:text-white mt-1 text-sm font-bold">
                      {investmentDetail.name || investmentDetail.scheme_name || investmentDetail.stock_symbol || 'Standard Investment'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-50 dark:bg-zinc-950/40 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800/85">
                      <p className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[9px]">Asset Class</p>
                      <p className="text-zinc-800 dark:text-zinc-200 mt-1 font-semibold uppercase">{investmentDetail.investment_type}</p>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-950/40 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800/85">
                      <p className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[9px]">Status</p>
                      <p className="text-emerald-600 dark:text-emerald-400 mt-1 font-semibold capitalize">{investmentDetail.status}</p>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-950/40 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800/85">
                      <p className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[9px]">Invested Value</p>
                      <p className="text-zinc-850 dark:text-zinc-200 mt-1 font-semibold font-mono">
                        ₹{investmentDetail.invested_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-950/40 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800/85">
                      <p className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[9px]">Current Value</p>
                      <p className="text-emerald-600 dark:text-emerald-400 mt-1 font-semibold font-mono">
                        ₹{investmentDetail.current_value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  {investmentDetail.policy_number && (
                    <div className="bg-zinc-50 dark:bg-zinc-950/40 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800/85">
                      <p className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[9px]">Policy Number</p>
                      <p className="text-zinc-850 dark:text-zinc-200 mt-1 font-mono font-semibold">{investmentDetail.policy_number}</p>
                    </div>
                  )}

                  <div className="bg-zinc-50 dark:bg-zinc-950/40 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800/85">
                    <p className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[9px]">Investment Date</p>
                    <p className="text-zinc-800 dark:text-zinc-200 mt-1 font-semibold">
                      {(() => {
                        const dateStr = investmentDetail.start_date || investmentDetail.investment_date || '';
                        return dateStr ? new Date(dateStr).toLocaleDateString() : 'N/A';
                      })()}
                    </p>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      onClick={() => {
                        setSelectedInvestmentId(null);
                        setInvestmentDetail(null);
                      }}
                      className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-750 dark:text-white rounded-xl font-semibold transition-colors cursor-pointer"
                    >
                      Close Details
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
