// ─── RecoverAI Human Escalation Queue Page ───────────────────────────────────────
// Ultra-Premium iOS + Razorpay Fintech Design System

'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { formatCurrency } from '@/lib/utils';
import { PriorityBadge } from '@/components/Badges';
import { AlertTriangle, CheckCircle2, XCircle, ArrowRight, ShieldAlert, FileText, User, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function EscalationsPage() {
  const [escalations, setEscalations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeNotes, setActiveNotes] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchEscalations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/escalations?status=PENDING');
      if (res.ok) {
        const data = await res.json();
        setEscalations(data.escalations || []);
      }
    } catch (err) {
      console.error('Error fetching escalations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEscalations();
  }, []);

  const handleResolve = async (caseId: string, action: 'APPROVE' | 'REJECT' | 'RESOLVE') => {
    setProcessingId(caseId);
    const notes = activeNotes[caseId] || '';
    try {
      const res = await fetch(`/api/recovery-cases/${caseId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes }),
      });

      if (res.ok) {
        fetchEscalations();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Header Title Banner */}
        <div className="bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2 relative z-10">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-orange-500/10 border border-orange-400/20 text-orange-400 text-xs font-bold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Human-in-the-Loop Governance</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Human Escalation Queue
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Compliant review queue for high-value transactions (≥ ₹50k), policy guardrail blocks, or ambiguous AI cases.
            </p>
          </div>

          <span className="self-start sm:self-center text-xs font-extrabold px-4 py-2 rounded-full bg-orange-500/20 text-orange-300 border border-orange-400/30 backdrop-blur-md shrink-0">
            {escalations.length} Pending Review Cases
          </span>
        </div>

        {/* Escalation Cards List */}
        {loading ? (
          <div className="py-16 text-center text-slate-500 text-sm font-medium">
            Loading escalation queue...
          </div>
        ) : escalations.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/60 p-12 text-center shadow-xl shadow-slate-200/40 space-y-4">
            <div className="p-4 rounded-full bg-emerald-50 text-emerald-500 w-16 h-16 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Escalation Queue Clear</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              All high-value payments and policy guardrails are currently operating cleanly. No cases require manual human operator intervention.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {escalations.map((item) => {
              const c = item.recoveryCase;
              const isProcessing = processingId === c.id;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl border border-slate-200/60 p-6 sm:p-7 shadow-xl shadow-slate-200/40 space-y-5 hover:border-orange-300 transition-all duration-300"
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <PriorityBadge priority={item.priority} />
                      <Link href={`/cases/${c.id}`} className="font-mono text-base font-black text-blue-600 hover:underline">
                        {c.payment.externalId}
                      </Link>
                      <span className="text-xs text-slate-400 font-medium">
                        {new Date(item.createdAt).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="text-base font-black text-slate-900">
                      Amount: {formatCurrency(c.payment.amount)}
                    </div>
                  </div>

                  {/* Context Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 space-y-1">
                      <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">Customer</span>
                      <div className="font-extrabold text-slate-900">{c.customer.name}</div>
                      <div className="text-slate-500 font-medium">{c.customer.email}</div>
                      <div className="text-emerald-600 font-bold mt-1">
                        {(c.customer.successRate * 100).toFixed(0)}% historical success rate
                      </div>
                    </div>

                    <div className="bg-orange-50/60 p-4 rounded-2xl border border-orange-200/80 space-y-1">
                      <span className="font-bold text-orange-800 uppercase tracking-wider text-[10px] block">Escalation Trigger</span>
                      <div className="font-black text-orange-700">{item.reason}</div>
                      <div className="text-slate-600 font-medium">
                        Failure Mode: <span className="capitalize font-bold text-slate-900">{c.payment.failureReason?.replace(/_/g, ' ')}</span>
                      </div>
                    </div>

                    <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-200/80 space-y-1">
                      <span className="font-bold text-blue-800 uppercase tracking-wider text-[10px] block">AI Recommendation</span>
                      <div className="font-black text-blue-600">{c.recommendedAction || 'ESCALATE'}</div>
                      <div className="text-slate-600 font-medium">
                        AI Confidence: <span className="font-bold text-slate-900">{c.aiConfidence ? `${(c.aiConfidence * 100).toFixed(0)}%` : 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Summary */}
                  {item.aiSummary && (
                    <div className="text-xs text-slate-800 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 leading-relaxed font-medium">
                      <span className="font-bold text-slate-900 block mb-1">AI Context Summary:</span>
                      &quot;{item.aiSummary}&quot;
                    </div>
                  )}

                  {/* Operator Notes Input & Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <input
                      type="text"
                      placeholder="Add internal human operator decision notes..."
                      value={activeNotes[c.id] || ''}
                      onChange={(e) => setActiveNotes({ ...activeNotes, [c.id]: e.target.value })}
                      className="w-full sm:w-1/2 px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/80"
                    />

                    <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => handleResolve(c.id, 'APPROVE')}
                        disabled={isProcessing}
                        className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all active:scale-95"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve Action</span>
                      </button>

                      <button
                        onClick={() => handleResolve(c.id, 'REJECT')}
                        disabled={isProcessing}
                        className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl text-xs font-extrabold bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-500/20 disabled:opacity-50 transition-all active:scale-95"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject & Stop</span>
                      </button>

                      <Link
                        href={`/cases/${c.id}`}
                        className="inline-flex items-center space-x-1 px-4 py-2.5 rounded-2xl text-xs font-extrabold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all"
                      >
                        <span>Inspect Case</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
