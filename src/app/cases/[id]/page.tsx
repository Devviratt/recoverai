// ─── RecoverAI Case Detail Hero Screen ──────────────────────────────────────────
// Selection-Grade Fintech Transaction & Strategy Inspector Page

'use client';

import { useEffect, useState, use } from 'react';
import Navbar from '@/components/Navbar';
import { formatCurrency, formatRelativeTime, formatPercentage } from '@/lib/utils';
import { StatusBadge, PriorityBadge, ActionBadge } from '@/components/Badges';
import { evaluateRecoveryStrategies, simulateWhatIfRecovery } from '@/lib/engines/recovery-strategy-engine';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Play,
  ArrowLeft,
  Copy,
  ExternalLink,
  Cpu,
  User,
  History,
  Check,
  StopCircle,
  TrendingUp,
  BarChart2,
  Zap,
  Info,
  DollarSign,
  Lock,
} from 'lucide-react';
import Link from 'next/link';

export default function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchCaseDetails = async () => {
    try {
      const res = await fetch(`/api/recovery-cases/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCaseData(data);
      }
    } catch (err) {
      console.error('Error fetching case detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaseDetails();
  }, [id]);

  const handleRunAgent = async () => {
    setActionLoading(true);
    setActionMessage('Executing Agent Decision Loop...');
    try {
      const res = await fetch(`/api/recovery-cases/${id}/analyze`, { method: 'POST' });
      if (res.ok) {
        setActionMessage('Agent loop completed!');
        fetchCaseDetails();
      } else {
        setActionMessage('Agent execution error');
      }
    } catch {
      setActionMessage('Error running agent');
    } finally {
      setActionLoading(false);
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  const handleRecover = async () => {
    setActionLoading(true);
    setActionMessage('Simulating payment completion...');
    try {
      const res = await fetch(`/api/recovery-cases/${id}/recover`, { method: 'POST' });
      if (res.ok) {
        setActionMessage('Payment recovered successfully!');
        fetchCaseDetails();
      }
    } catch {
      setActionMessage('Error completing recovery');
    } finally {
      setActionLoading(false);
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  const handleEscalate = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/recovery-cases/${id}/escalate`, { method: 'POST' });
      if (res.ok) {
        fetchCaseDetails();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleStop = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/recovery-cases/${id}/stop`, { method: 'POST' });
      if (res.ok) {
        fetchCaseDetails();
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-12 text-center text-slate-500 font-medium">
          Loading recovery case detail...
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-12 text-center text-slate-500 font-medium">
          Case not found.
        </div>
      </div>
    );
  }

  const latestAI = caseData.aiAnalyses?.[0];
  const latestPolicy = caseData.policyDecisions?.[0];
  const reasoningList: string[] = latestAI?.reasoning ? JSON.parse(latestAI.reasoning) : [];

  // Compute live strategy comparison & what-if simulation from Strategy Engine
  const paymentCtx = {
    paymentId: caseData.payment.externalId,
    orderId: caseData.payment.orderId || '',
    amount: caseData.payment.amount,
    currency: caseData.payment.currency || 'INR',
    status: caseData.payment.status,
    failureReason: caseData.payment.failureReason || 'card_declined',
    paymentMethod: caseData.payment.paymentMethod || 'card',
    customerSuccessRate: caseData.customer.successRate || 0.8,
    previousFailures: caseData.customer.failedPayments || 0,
    previousSuccesses: caseData.customer.successfulPayments || 0,
    retryCount: caseData.recoveryAttempts || 0,
    hoursSinceFailure: 2,
    customerSegment: caseData.customer.segment || 'regular',
    customerLifetimeValue: caseData.customer.lifetimeValue || 10000,
    totalTransactions: caseData.customer.totalTransactions || 1,
  };

  const strategyComparison = evaluateRecoveryStrategies(paymentCtx);
  const whatIf = simulateWhatIfRecovery(paymentCtx);

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Top Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/40">
          <div className="flex items-center space-x-3">
            <Link
              href="/cases"
              className="p-2.5 rounded-2xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors shrink-0 border border-slate-200/80"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-lg font-black text-slate-900">
                  {caseData.payment.externalId}
                </span>
                <StatusBadge status={caseData.status} />
                <PriorityBadge priority={caseData.priority} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Created {formatRelativeTime(new Date(caseData.createdAt))} · Merchant Order:{' '}
                <span className="font-mono text-slate-700 font-bold">{caseData.payment.orderId || 'N/A'}</span>
              </p>
            </div>
          </div>

          {/* Interactive Agent Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {actionMessage && (
              <span className="text-xs text-blue-600 font-extrabold animate-pulse mr-2 w-full sm:w-auto">
                {actionMessage}
              </span>
            )}

            <button
              onClick={handleRunAgent}
              disabled={actionLoading}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl text-xs font-black bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 transition-all shadow-md shadow-blue-500/20 active:scale-95"
            >
              <Play className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
              <span>Run Agent Decision</span>
            </button>

            {caseData.status !== 'RECOVERED' && (
              <button
                onClick={handleRecover}
                disabled={actionLoading}
                className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Recovered</span>
              </button>
            )}

            {caseData.status !== 'ESCALATED' && (
              <button
                onClick={handleEscalate}
                disabled={actionLoading}
                className="inline-flex items-center space-x-1 px-3.5 py-2.5 rounded-2xl text-xs font-extrabold bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 transition-all"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Escalate</span>
              </button>
            )}

            {caseData.status !== 'STOPPED' && (
              <button
                onClick={handleStop}
                disabled={actionLoading}
                className="inline-flex items-center space-x-1 px-3.5 py-2.5 rounded-2xl text-xs font-extrabold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-all"
              >
                <StopCircle className="w-3.5 h-3.5" />
                <span>Stop</span>
              </button>
            )}
          </div>
        </div>

        {/* SECTION 1: RECOVERY OPPORTUNITY SUMMARY CARD */}
        <div className="bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-700/50 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
            <div className="flex items-center space-x-2 text-blue-400 font-extrabold text-xs uppercase tracking-wider">
              <Zap className="w-4 h-4" />
              <span>Recovery Opportunity Analysis</span>
            </div>
            <span className="text-xs font-extrabold text-slate-300">
              Strategy Objective: Highest Expected Compliant Recovery Value
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-medium block mb-1">Payment Amount</span>
              <div className="text-xl font-black text-white">{formatCurrency(caseData.payment.amount)}</div>
            </div>

            <div>
              <span className="text-slate-400 font-medium block mb-1">Risk Score</span>
              <div className="text-xl font-black text-amber-400">{caseData.riskScore || 50} / 100</div>
            </div>

            <div>
              <span className="text-slate-400 font-medium block mb-1">Best Strategy</span>
              <div className="text-lg font-black text-blue-400">{strategyComparison.recommendedAction}</div>
            </div>

            <div>
              <span className="text-slate-400 font-medium block mb-1">Estimated Recovery Prob.</span>
              <div className="text-xl font-black text-emerald-400">
                {(strategyComparison.candidates.find((c) => c.action === strategyComparison.recommendedAction)?.estimatedRecoveryProbability! * 100).toFixed(0)}%
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-medium block mb-1">Expected Recovery</span>
              <div className="text-xl font-black text-emerald-400">
                {formatCurrency(strategyComparison.highestExpectedRecovery)}
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-medium block mb-1">Expected Incremental Lift</span>
              <div className="text-xl font-black text-indigo-300">
                +{formatCurrency(whatIf.expectedIncrementalRecovery)} ({whatIf.recoveryValueLiftPercent.toFixed(0)}%)
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: CANDIDATE STRATEGY COMPARISON TABLE */}
        <div className="bg-white rounded-3xl border border-slate-200/60 p-6 sm:p-7 shadow-xl shadow-slate-200/40 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center space-x-2">
                <BarChart2 className="w-5 h-5 text-blue-600" />
                <span>Candidate Strategy Comparison (Strategy Engine)</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Deterministically computed candidate probabilities, expected recovery amounts (INR), and policy eligibility.
              </p>
            </div>
            <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
              Baseline Recovery: {formatCurrency(strategyComparison.baselineExpectedRecovery)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Candidate Strategy</th>
                  <th className="px-4 py-3">Estimated Recovery Prob.</th>
                  <th className="px-4 py-3">Expected Recovery</th>
                  <th className="px-4 py-3">Expected Incremental</th>
                  <th className="px-4 py-3">Operational Cost</th>
                  <th className="px-4 py-3">Policy Eligibility</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-medium">
                {strategyComparison.candidates.map((candidate) => {
                  const isSelected = candidate.action === strategyComparison.recommendedAction;
                  return (
                    <tr
                      key={candidate.action}
                      className={isSelected ? 'bg-blue-50/60 font-bold border-l-4 border-l-blue-600' : 'hover:bg-slate-50'}
                    >
                      <td className="px-4 py-3 font-extrabold text-slate-900">
                        <div className="flex items-center space-x-2">
                          <ActionBadge action={candidate.action} />
                          {isSelected && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black">
                              SELECTED
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-extrabold text-slate-900">
                        {(candidate.estimatedRecoveryProbability * 100).toFixed(0)}%
                      </td>
                      <td className="px-4 py-3 font-black text-slate-900">
                        {formatCurrency(candidate.expectedRecovery)}
                      </td>
                      <td className="px-4 py-3 font-extrabold text-emerald-600">
                        +{formatCurrency(candidate.expectedIncrementalRecovery)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            candidate.operationalCost === 'HIGH'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : candidate.operationalCost === 'MEDIUM'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {candidate.operationalCost}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {candidate.eligible ? (
                          <span className="text-emerald-600 font-bold flex items-center">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Eligible
                          </span>
                        ) : (
                          <span className="text-red-500 font-bold flex items-center" title={candidate.ineligibilityReason || ''}>
                            <Lock className="w-3.5 h-3.5 mr-1" /> Ineligible
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: AI Reasoning & Policy Engine (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI EXPLANATION & DIAGNOSIS HERO CARD */}
            <div className="bg-white rounded-3xl border border-slate-200/60 p-6 sm:p-7 shadow-xl shadow-slate-200/40 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">AI Diagnosis & Reasoning</h2>
                    <p className="text-xs text-slate-500 font-medium">Structured explainable decision support</p>
                  </div>
                </div>
                {latestAI && (
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 font-bold block">Confidence Score</span>
                    <div className="text-lg font-black text-blue-600">
                      {(latestAI.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                )}
              </div>

              {latestAI ? (
                <div className="space-y-4">
                  {/* Diagnosis summary */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Failure Diagnosis
                    </h3>
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 leading-relaxed">
                      {latestAI.diagnosis}
                    </p>
                  </div>

                  {/* Why? Structured Reasoning */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Why this recommendation?
                    </h3>
                    <ul className="space-y-2">
                      {reasoningList.map((reason, idx) => (
                        <li key={idx} className="flex items-start text-xs text-slate-700 space-x-2 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Customer Message */}
                  {latestAI.customerMessage && (
                    <div>
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Personalized Customer Notification Message
                      </h3>
                      <div className="text-xs text-slate-800 bg-blue-50/50 border border-blue-100 p-4 rounded-2xl font-mono leading-relaxed">
                        &quot;{latestAI.customerMessage}&quot;
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500 text-xs font-medium">
                  No AI diagnosis has been generated for this case yet. Click &quot;Run Agent Decision&quot; above to analyze.
                </div>
              )}
            </div>

            {/* POLICY GUARDRAILS ENGINE CARD */}
            <div className="bg-white rounded-3xl border border-slate-200/60 p-6 sm:p-7 shadow-xl shadow-slate-200/40 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-extrabold text-slate-900">Policy & Guardrail Validation</h3>
                </div>
                {latestPolicy && (
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold ${
                      latestPolicy.allowed
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {latestPolicy.allowed ? 'APPROVED BY POLICY' : 'BLOCKED BY GUARDRAIL'}
                  </span>
                )}
              </div>

              {latestPolicy ? (
                <div className="space-y-3 text-xs">
                  <div className="flex items-start space-x-2">
                    <span className="font-bold text-slate-500 min-w-[100px]">Evaluated Rule:</span>
                    <span className="font-mono font-bold text-slate-900">{latestPolicy.rule}</span>
                  </div>

                  <div className="flex items-start space-x-2">
                    <span className="font-bold text-slate-500 min-w-[100px]">Policy Decision:</span>
                    <span className="font-medium text-slate-800">{latestPolicy.reason}</span>
                  </div>

                  {!latestPolicy.allowed && (
                    <div className="bg-red-50 p-4 rounded-2xl border border-red-200 text-red-800 leading-relaxed font-medium">
                      <span className="font-extrabold block mb-1">Human Governance Triggered:</span>
                      The Policy Engine blocked automated execution. The case was transferred to the Human Escalation Queue for manual review.
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-4 text-center text-slate-400 text-xs font-medium">
                  Policy validation pending agent run.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Transaction & Customer Details (1 col) */}
          <div className="space-y-6">
            {/* Customer Profile Card */}
            <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-xl shadow-slate-200/40 space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                <User className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-extrabold text-slate-900">Customer Context</h3>
              </div>

              <div className="space-y-3 text-xs font-medium">
                <div>
                  <span className="text-slate-400 block text-[11px] font-bold">Name & Email</span>
                  <div className="font-extrabold text-slate-900 text-sm">{caseData.customer.name}</div>
                  <div className="text-slate-500">{caseData.customer.email}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[11px] font-bold">Historical Success</span>
                    <span className="font-black text-emerald-600 text-sm">
                      {(caseData.customer.successRate * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] font-bold">Lifetime Value</span>
                    <span className="font-black text-slate-900 text-sm">
                      {formatCurrency(caseData.customer.lifetimeValue)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Link Card */}
            {caseData.paymentLinkUrl && (
              <div className="bg-emerald-50/60 rounded-3xl border border-emerald-200/80 p-6 shadow-xl shadow-emerald-500/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-800 uppercase tracking-wider">
                    Razorpay Payment Link
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800 text-[10px] font-bold">
                    Active
                  </span>
                </div>

                <div className="bg-white p-3 rounded-2xl border border-emerald-200 font-mono text-xs text-emerald-900 truncate">
                  {caseData.paymentLinkUrl}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(caseData.paymentLinkUrl);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition-all shadow-xs flex items-center justify-center space-x-1"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                  </button>

                  <a
                    href={caseData.paymentLinkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-white border border-emerald-200 hover:bg-emerald-100 text-emerald-800 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}

            {/* Audit Trail Timeline */}
            <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-xl shadow-slate-200/40 space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                <History className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-extrabold text-slate-900">Append-Only Audit Trail</h3>
              </div>

              <div className="space-y-3.5 text-xs">
                {caseData.auditEvents?.map((evt: any) => (
                  <div key={evt.id} className="relative pl-4 border-l-2 border-slate-200 space-y-0.5">
                    <div className="font-mono text-[11px] font-black text-blue-600">{evt.action}</div>
                    <div className="text-slate-600 text-[11px] font-medium">{evt.reason || 'State transition'}</div>
                    <div className="text-[10px] text-slate-400 font-semibold">
                      {new Date(evt.timestamp).toLocaleTimeString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
