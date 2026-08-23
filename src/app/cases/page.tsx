// ─── RecoverAI Recovery Cases Searchable Directory ──────────────────────────────
// Ultra-Clean iOS + Razorpay Fintech UI (Zero Clipping, Super Clear)

'use client';

import { useEffect, useState, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import { formatCurrency } from '@/lib/utils';
import { StatusBadge, PriorityBadge, ActionBadge } from '@/components/Badges';
import { Search, ArrowRight, Play, RefreshCw, ChevronLeft, ChevronRight, Filter, DollarSign, Activity, TrendingUp, CheckCircle2, Eye, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface CaseItem {
  id: string;
  status: string;
  priority: string | null;
  recommendedAction: string | null;
  aiConfidence: number | null;
  revenueAtRisk: number | null;
  payment: {
    externalId: string;
    amount: number;
    failureReason: string | null;
    paymentMethod: string | null;
  };
  customer: {
    name: string;
    email: string;
    successRate: number;
  };
}

export default function CasesPage() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [failureReason, setFailureReason] = useState('');

  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...(search ? { search } : {}),
        ...(status ? { status } : {}),
        ...(priority ? { priority } : {}),
        ...(failureReason ? { failureReason } : {}),
      });

      const res = await fetch(`/api/recovery-cases?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCases(data.cases || []);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Error fetching cases:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, status, priority, failureReason]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const handleRunAgentOnCase = async (caseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProcessingId(caseId);
    try {
      const res = await fetch(`/api/recovery-cases/${caseId}/analyze`, { method: 'POST' });
      if (res.ok) {
        fetchCases();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatus('');
    setPriority('');
    setFailureReason('');
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Top Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                <Activity className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Payment Failure Cases
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
              View and manage failed payment events, AI risk scoring, policy guardrails, and recovery actions.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchCases()}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-2xl text-xs font-bold bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-700 shadow-xs transition-all active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Quick Filter & Search Bar */}
        <div className="bg-white rounded-3xl border border-slate-200/60 p-4 sm:p-5 shadow-xl shadow-slate-200/40 space-y-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Payment ID (e.g. pay_hero_scenario_a), Customer Name, or Email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/80"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="py-2.5 px-3.5 rounded-2xl border border-slate-200 text-xs font-bold bg-slate-50/80 text-slate-700 cursor-pointer focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="AT_RISK">AT_RISK</option>
                <option value="DIAGNOSING">DIAGNOSING</option>
                <option value="ELIGIBLE">ELIGIBLE</option>
                <option value="ACTION_EXECUTED">ACTION_EXECUTED</option>
                <option value="RECOVERED">RECOVERED</option>
                <option value="ESCALATED">ESCALATED</option>
                <option value="STOPPED">STOPPED</option>
              </select>

              <select
                value={priority}
                onChange={(e) => {
                  setPriority(e.target.value);
                  setPage(1);
                }}
                className="py-2.5 px-3.5 rounded-2xl border border-slate-200 text-xs font-bold bg-slate-50/80 text-slate-700 cursor-pointer focus:outline-none"
              >
                <option value="">All Priorities</option>
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>

              <select
                value={failureReason}
                onChange={(e) => {
                  setFailureReason(e.target.value);
                  setPage(1);
                }}
                className="py-2.5 px-3.5 rounded-2xl border border-slate-200 text-xs font-bold bg-slate-50/80 text-slate-700 cursor-pointer focus:outline-none"
              >
                <option value="">All Failure Modes</option>
                <option value="insufficient_funds">Insufficient Funds</option>
                <option value="card_declined">Card Declined</option>
                <option value="bank_timeout">Bank Timeout</option>
                <option value="authentication_failed">Auth Failed</option>
                <option value="network_error">Network Error</option>
                <option value="daily_limit_exceeded">Daily Limit Exceeded</option>
                <option value="suspected_fraud">Suspected Fraud</option>
                <option value="card_expired">Card Expired</option>
              </select>

              {(search || status || priority || failureReason) && (
                <button
                  onClick={handleResetFilters}
                  className="px-3 py-2.5 rounded-2xl text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Clean, Non-Clipped Data Table Container */}
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden">
          {/* Desktop Streamlined Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200/70">
                <tr>
                  <th className="px-6 py-4">Payment ID & Customer</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Failure Reason & Priority</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">AI Recommendation</th>
                  <th className="px-6 py-4 text-right min-w-[200px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-slate-400 font-medium">
                      Loading payment cases...
                    </td>
                  </tr>
                ) : cases.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-slate-500 font-medium">
                      No payment failure cases match the selected filters.
                    </td>
                  </tr>
                ) : (
                  cases.map((c) => {
                    const isProc = processingId === c.id;
                    return (
                      <tr key={c.id} className="hover:bg-blue-50/30 transition-colors group">
                        {/* Column 1: ID & Customer */}
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 font-black flex items-center justify-center text-xs shrink-0 border border-blue-100">
                              {c.customer.name.charAt(0)}
                            </div>
                            <div>
                              <Link href={`/cases/${c.id}`} className="font-mono font-bold text-blue-600 hover:underline block text-xs">
                                {c.payment.externalId}
                              </Link>
                              <div className="font-bold text-slate-900 text-xs mt-0.5">{c.customer.name}</div>
                              <div className="text-[11px] text-slate-400 font-medium">{c.customer.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Column 2: Amount */}
                        <td className="px-6 py-4 font-black text-slate-900 text-sm">
                          {formatCurrency(c.payment.amount)}
                        </td>

                        {/* Column 3: Reason & Priority */}
                        <td className="px-6 py-4 space-y-1">
                          <div className="text-slate-800 capitalize font-bold text-xs">
                            {c.payment.failureReason ? c.payment.failureReason.replace(/_/g, ' ') : '—'}
                          </div>
                          <PriorityBadge priority={c.priority} />
                        </td>

                        {/* Column 4: Status */}
                        <td className="px-6 py-4">
                          <StatusBadge status={c.status} />
                        </td>

                        {/* Column 5: AI Recommendation */}
                        <td className="px-6 py-4 space-y-1">
                          <ActionBadge action={c.recommendedAction} />
                          {c.aiConfidence && (
                            <div className="text-[11px] text-slate-400 font-bold">
                              Confidence: <span className="text-blue-600">{(c.aiConfidence * 100).toFixed(0)}%</span>
                            </div>
                          )}
                        </td>

                        {/* Column 6: Action Buttons Group (Guaranteed NO Clipping) */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2 shrink-0">
                            <button
                              onClick={(e) => handleRunAgentOnCase(c.id, e)}
                              disabled={isProc}
                              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-[#0B1426] hover:bg-blue-600 text-white disabled:opacity-50 transition-all shadow-sm active:scale-95 shrink-0"
                            >
                              <Play className={`w-3.5 h-3.5 ${isProc ? 'animate-spin' : ''}`} />
                              <span>{isProc ? 'Running...' : 'Run Agent'}</span>
                            </button>

                            <Link
                              href={`/cases/${c.id}`}
                              className="inline-flex items-center space-x-1 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all shrink-0"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Tablet & Mobile Card List View */}
          <div className="lg:hidden divide-y divide-slate-100">
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400 font-medium">Loading cases...</div>
            ) : cases.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 font-medium">No cases match the selected filters.</div>
            ) : (
              cases.map((c) => {
                const isProc = processingId === c.id;
                return (
                  <div key={c.id} className="p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <Link href={`/cases/${c.id}`} className="font-mono text-xs font-bold text-blue-600">
                        {c.payment.externalId}
                      </Link>
                      <span className="font-black text-sm text-slate-900">
                        {formatCurrency(c.payment.amount)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{c.customer.name}</div>
                        <div className="text-[11px] text-slate-400 capitalize font-medium">
                          {c.payment.failureReason?.replace(/_/g, ' ')}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <PriorityBadge priority={c.priority} />
                        <StatusBadge status={c.status} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                      <ActionBadge action={c.recommendedAction} />
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => handleRunAgentOnCase(c.id, e)}
                          disabled={isProc}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-black bg-[#0B1426] text-white disabled:opacity-50"
                        >
                          <Play className={`w-3 h-3 ${isProc ? 'animate-spin' : ''}`} />
                          <span>{isProc ? '...' : 'Run Agent'}</span>
                        </button>
                        <Link
                          href={`/cases/${c.id}`}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-slate-100 text-slate-800"
                        >
                          <span>View</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/80 text-xs text-slate-600 font-medium">
            <div>
              Showing <span className="font-bold text-slate-900">{cases.length}</span> of{' '}
              <span className="font-bold text-slate-900">{total.toLocaleString()}</span> cases
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 shadow-xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-slate-900">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 shadow-xs"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
