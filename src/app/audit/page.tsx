// ─── RecoverAI Global Audit Log Page ──────────────────────────────────────────
// Responsive audit trail with desktop table & mobile timeline views

'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { ShieldAlert, Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function AuditPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [actor, setActor] = useState('');
  const [action, setAction] = useState('');
  const [search, setSearch] = useState('');

  const fetchAudit = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(actor ? { actor } : {}),
        ...(action ? { action } : {}),
        ...(search ? { search } : {}),
      });

      const res = await fetch(`/api/audit?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAudit();
  }, [page, actor, action, search]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
              <ShieldAlert className="w-7 h-7 text-blue-600" />
              <span>Immutable Audit Trail</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Complete, unalterable event log of all AI decisions, policy checks, recovery actions & system events ({total.toLocaleString()} total events).
            </p>
          </div>

          <button
            onClick={() => fetchAudit()}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-xs self-start sm:self-center"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Audit Log</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search audit trail..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/50"
            />
          </div>

          <select
            value={actor}
            onChange={(e) => {
              setActor(e.target.value);
              setPage(1);
            }}
            className="py-2 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50/50 text-slate-700 font-medium"
          >
            <option value="">All Actors</option>
            <option value="recoverai-agent">recoverai-agent</option>
            <option value="merchant-user">merchant-user</option>
            <option value="policy-engine">policy-engine</option>
          </select>

          <select
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
            className="py-2 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50/50 text-slate-700 font-medium"
          >
            <option value="">All Action Types</option>
            <option value="AI_DIAGNOSIS">AI_DIAGNOSIS</option>
            <option value="POLICY_CHECK">POLICY_CHECK</option>
            <option value="ACTION_EXECUTED">ACTION_EXECUTED</option>
            <option value="ESCALATE">ESCALATE</option>
            <option value="STOP">STOP</option>
            <option value="RECOVER_PAYMENT">RECOVER_PAYMENT</option>
          </select>
        </div>

        {/* Audit Log Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5">Actor</th>
                  <th className="px-5 py-3.5">Action</th>
                  <th className="px-5 py-3.5">Case / Payment ID</th>
                  <th className="px-5 py-3.5">Reason / Description</th>
                  <th className="px-5 py-3.5">State Transition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white font-mono text-[11px]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400 font-sans">
                      Loading audit events...
                    </td>
                  </tr>
                ) : events.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500 font-sans">
                      No audit events recorded.
                    </td>
                  </tr>
                ) : (
                  events.map((evt) => (
                    <tr key={evt.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 text-slate-500 font-sans text-xs">
                        {new Date(evt.timestamp).toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-blue-600">{evt.actor}</td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">{evt.action}</td>
                      <td className="px-5 py-3.5">
                        {evt.recoveryCase ? (
                          <Link
                            href={`/cases/${evt.recoveryCase.id}`}
                            className="hover:underline text-blue-600 font-bold"
                          >
                            {evt.recoveryCase.payment.externalId}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-sans text-xs text-slate-800 max-w-xs truncate">
                        {evt.reason || 'Executed'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 font-sans text-xs">
                        {evt.previousState ? (
                          <span>
                            {evt.previousState} → <span className="font-bold">{evt.nextState}</span>
                          </span>
                        ) : (
                          evt.nextState || '—'
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden divide-y divide-slate-200">
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading audit events...</div>
            ) : events.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">No events found.</div>
            ) : (
              events.map((evt) => (
                <div key={evt.id} className="p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-blue-600">{evt.action}</span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(evt.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="text-slate-800">{evt.reason || 'Executed'}</div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 font-mono">
                    <span>Actor: {evt.actor}</span>
                    {evt.recoveryCase && (
                      <Link href={`/cases/${evt.recoveryCase.id}`} className="text-blue-600 font-bold">
                        {evt.recoveryCase.payment.externalId}
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/80 text-xs text-slate-600">
            <div>
              Showing <span className="font-semibold">{events.length}</span> of{' '}
              <span className="font-semibold">{total.toLocaleString()}</span> audit records
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
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
