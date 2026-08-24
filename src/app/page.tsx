// ─── Razorpay RecoverAI Dashboard & Batch Recovery Command Center ────────────────

'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import HeroScenarioCards from '@/components/HeroScenarioCards';
import ProviderStatus from '@/components/ProviderStatus';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { StatusBadge, PriorityBadge, ActionBadge } from '@/components/Badges';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Activity,
  ChevronRight,
  Zap,
  Sparkles,
  AlertCircle,
  Play,
  RefreshCw,
  BarChart2,
  Layers,
  StopCircle,
} from 'lucide-react';
import Link from 'next/link';

interface DashboardCase {
  id: string;
  status: string;
  priority: string | null;
  recommendedAction: string | null;
  payment: {
    externalId: string;
    amount: number;
    failureReason: string | null;
  };
  customer: {
    name: string;
    email: string;
  };
}

interface DashboardData {
  revenueAtRisk: number;
  recoveredRevenue: number;
  recoveryRate: number;
  activeCases: number;
  humanEscalations: number;
  totalPayments: number;
  failedPayments: number;
  funnel: {
    failed: number;
    atRisk: number;
    eligible: number;
    interventions: number;
    recovered: number;
  };
  failureReasons: { reason: string; count: number; amount: number }[];
  recoveryActions: { action: string; count: number }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [recentCases, setRecentCases] = useState<DashboardCase[]>([]);
  const [loading, setLoading] = useState(true);

  // Batch Recovery Execution State
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchMetrics, setBatchMetrics] = useState<any>(null);
  const [batchProgressText, setBatchProgressText] = useState<string | null>(null);

  const loadDashboard = async () => {
    try {
      const [dashRes, casesRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/recovery-cases?limit=6'),
      ]);

      if (dashRes.ok) {
        const dashData = await dashRes.json();
        setData(dashData);
      }

      if (casesRes.ok) {
        const casesData = await casesRes.json();
        setRecentCases(casesData.cases || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleRunBatchRecovery = async () => {
    setBatchLoading(true);
    setBatchProgressText('Executing Batch Agent Workflow across Demo Cases...');
    try {
      const res = await fetch('/api/demo/run-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 50 }),
      });

      if (res.ok) {
        const batchData = await res.json();
        setBatchMetrics(batchData.metrics);
        setBatchProgressText(`Batch Run Complete! Processed ${batchData.processedInThisBatch} cases.`);
        await loadDashboard();
      } else {
        setBatchProgressText('Batch execution error.');
      }
    } catch (err) {
      console.error(err);
      setBatchProgressText('Batch execution failed.');
    } finally {
      setBatchLoading(false);
      setTimeout(() => setBatchProgressText(null), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-[#0052FF] selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Top Razorpay System Status Pill */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50/80 border border-blue-200/70 p-3.5 px-5 rounded-2xl text-xs text-slate-700 font-medium shadow-2xs">
          <div className="flex items-center space-x-2.5">
            <div className="p-1 rounded-full bg-[#0052FF]/10 text-[#0052FF]">
              <AlertCircle className="w-4 h-4" />
            </div>
            <span>
              <strong className="font-extrabold text-slate-900">Controlled Evaluation Mode:</strong> Evaluation on synthetic held-out dataset. System demonstrates bounded AI decision-making on Razorpay rails.
            </span>
          </div>
          <ProviderStatus />
        </div>

        {/* Ambient Razorpay Midnight Hero Banner */}
        <div className="relative rounded-3xl bg-gradient-to-br from-[#02042B] via-[#0A192C] to-[#02042B] text-white p-6 sm:p-9 shadow-2xl shadow-blue-950/20 border border-slate-800/80 overflow-hidden">
          {/* Ambient Razorpay Glow Effects */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#0052FF]/30 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#00C4FF]/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3.5 max-w-2xl">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#0052FF]/20 border border-[#0052FF]/40 text-[#00C4FF] text-xs font-extrabold backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Razorpay AI Buildathon 2026 — Track 03: AI Revenue Recovery</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                AI Revenue Recovery Agent
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                Autonomous risk detection, Strategy Engine expected value estimation, bounded policy guardrails, and automated recovery on Razorpay rails.
              </p>
            </div>

            {/* Primary & Secondary Action CTAs */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleRunBatchRecovery}
                disabled={batchLoading}
                className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-2xl text-xs font-black bg-[#0052FF] hover:bg-[#0046DA] text-white transition-all shadow-xl shadow-blue-600/30 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              >
                <Play className={`w-4 h-4 ${batchLoading ? 'animate-spin' : ''}`} />
                <span>{batchLoading ? 'Executing Batch Agent...' : 'Run Batch Recovery'}</span>
              </button>

              <Link
                href="/evaluation"
                className="inline-flex items-center space-x-2 px-5 py-3.5 rounded-2xl text-xs font-bold bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15 transition-all backdrop-blur-md hover:scale-[1.02] active:scale-95"
              >
                <BarChart2 className="w-4 h-4" />
                <span>Run Benchmark Evaluation</span>
              </Link>
            </div>
          </div>

          {/* Batch Progress Text Status */}
          {batchProgressText && (
            <div className="mt-4 pt-3 border-t border-slate-800 text-xs font-mono font-bold text-[#00C4FF] animate-pulse">
              {batchProgressText}
            </div>
          )}
        </div>

        {/* Hero Pitch Scenarios Launcher */}
        <HeroScenarioCards />

        {/* Top Executive Metric Cards */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200/70 rounded-3xl"></div>
            ))}
          </div>
        ) : data ? (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Metric 1: Revenue at Risk */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xl shadow-slate-200/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>Revenue at Risk</span>
                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {formatCurrency(data.revenueAtRisk)}
                </div>
                <div className="text-[11px] text-slate-400 font-medium mt-1">
                  From {data.failedPayments.toLocaleString()} failed payments
                </div>
              </div>
            </div>

            {/* Metric 2: Recovered Revenue */}
            <div className="bg-white rounded-3xl p-5 border border-emerald-200/80 shadow-xl shadow-emerald-500/5 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>Recovered Revenue</span>
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-xl sm:text-2xl font-black text-emerald-600 tracking-tight">
                  {formatCurrency(data.recoveredRevenue)}
                </div>
                <div className="text-[11px] text-emerald-600 font-extrabold mt-1 flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-ping"></span>
                  Money won back
                </div>
              </div>
            </div>

            {/* Metric 3: Recovery Rate */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xl shadow-slate-200/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>Recovery Rate</span>
                <div className="p-2.5 rounded-2xl bg-[#0052FF]/10 text-[#0052FF]">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {formatPercentage(data.recoveryRate)}
                </div>
                <div className="text-[11px] text-slate-400 font-medium mt-1">
                  Cases successfully recovered
                </div>
              </div>
            </div>

            {/* Metric 4: Active Cases */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xl shadow-slate-200/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>Active Cases</span>
                <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {data.activeCases.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400 font-medium mt-1">
                  In recovery pipeline
                </div>
              </div>
            </div>

            {/* Metric 5: Human Escalations */}
            <div className="col-span-2 lg:col-span-1 bg-white rounded-3xl p-5 border border-orange-200/80 shadow-xl shadow-orange-500/5 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>Human Escalations</span>
                <div className="p-2.5 rounded-2xl bg-orange-500/10 text-orange-600">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-xl sm:text-2xl font-black text-orange-600 tracking-tight">
                  {data.humanEscalations}
                </div>
                <div className="text-[11px] text-orange-600 font-extrabold mt-1">
                  Policy-blocked for review
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* BATCH RECOVERY COMMAND CENTER & EXPECTED VS REALIZED WIDGET */}
        {batchMetrics && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xl shadow-slate-200/40 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center space-x-2 text-[#0052FF] font-black text-xs uppercase tracking-wider">
                  <Zap className="w-4 h-4" />
                  <span>Batch Recovery Results (Real DB Measured)</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Batch Execution Measured Money Recovery
                </h3>
              </div>
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {batchMetrics.totalEvaluated} Total Demo Cases Evaluated
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-medium">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <span className="text-slate-400 block font-bold">Realized Recovered Money</span>
                <div className="text-xl font-black text-emerald-600 mt-1">
                  {formatCurrency(batchMetrics.totalRealizedRecovery)}
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <span className="text-slate-400 block font-bold">Expected Recovery (Strategy Engine)</span>
                <div className="text-xl font-black text-[#0052FF] mt-1">
                  {formatCurrency(batchMetrics.totalExpectedRecovery)}
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <span className="text-slate-400 block font-bold">Human Escalations</span>
                <div className="text-xl font-black text-orange-600 mt-1">
                  {batchMetrics.escalatedCount} cases
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <span className="text-slate-400 block font-bold">Stopped Safely</span>
                <div className="text-xl font-black text-slate-700 mt-1">
                  {batchMetrics.stoppedCount} cases
                </div>
              </div>
            </div>

            {/* Strategy Distribution */}
            {batchMetrics.strategyDistribution && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs font-extrabold text-slate-700 block mb-2">
                  Batch Recovery Strategy Distribution:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center text-xs">
                  {batchMetrics.strategyDistribution.map((item: any) => (
                    <div key={item.action} className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
                      <div className="font-black text-slate-900">{item.count} cases</div>
                      <div className="text-slate-500 font-bold text-[11px]">{item.action} ({item.percentage}%)</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Visual Revenue Recovery Funnel */}
        {data && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xl shadow-slate-200/40 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Dynamic Revenue Recovery Funnel
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Click any stage to filter payment cases in the directory
                </p>
              </div>
              <span className="text-xs font-extrabold text-slate-400">Database Live Stream</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <Link
                href="/cases?status=AT_RISK"
                className="bg-slate-50 hover:bg-blue-50/60 p-4 rounded-2xl border border-slate-200/80 transition-all hover:border-blue-300 block"
              >
                <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">1. Failed Payments</span>
                <div className="text-lg font-black text-slate-900 mt-1">{data.funnel.failed.toLocaleString()}</div>
              </Link>

              <Link
                href="/cases?status=AT_RISK"
                className="bg-slate-50 hover:bg-blue-50/60 p-4 rounded-2xl border border-slate-200/80 transition-all hover:border-blue-300 block"
              >
                <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">2. Revenue At Risk</span>
                <div className="text-lg font-black text-slate-900 mt-1">{formatCurrency(data.revenueAtRisk)}</div>
              </Link>

              <Link
                href="/cases?status=ELIGIBLE"
                className="bg-slate-50 hover:bg-blue-50/60 p-4 rounded-2xl border border-slate-200/80 transition-all hover:border-blue-300 block"
              >
                <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">3. Eligible</span>
                <div className="text-lg font-black text-[#0052FF] mt-1">{data.funnel.eligible.toLocaleString()}</div>
              </Link>

              <Link
                href="/cases?status=ACTION_EXECUTED"
                className="bg-slate-50 hover:bg-blue-50/60 p-4 rounded-2xl border border-slate-200/80 transition-all hover:border-blue-300 block"
              >
                <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">4. Executed</span>
                <div className="text-lg font-black text-indigo-600 mt-1">{data.funnel.interventions.toLocaleString()}</div>
              </Link>

              <Link
                href="/cases?status=RECOVERED"
                className="bg-emerald-50/60 hover:bg-emerald-100/60 p-4 rounded-2xl border border-emerald-200/80 transition-all block"
              >
                <span className="text-emerald-800 font-bold block text-[10px] uppercase tracking-wider">5. Recovered</span>
                <div className="text-lg font-black text-emerald-600 mt-1">{data.funnel.recovered.toLocaleString()}</div>
              </Link>

              <Link
                href="/escalations"
                className="bg-orange-50/60 hover:bg-orange-100/60 p-4 rounded-2xl border border-orange-200/80 transition-all block"
              >
                <span className="text-orange-800 font-bold block text-[10px] uppercase tracking-wider">6. Escalated</span>
                <div className="text-lg font-black text-orange-600 mt-1">{data.humanEscalations.toLocaleString()}</div>
              </Link>
            </div>
          </div>
        )}

        {/* Recent Cases Preview */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xl shadow-slate-200/40 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900 tracking-tight">Recent Failed Payments & Interventions</h3>
            <Link href="/cases" className="text-xs font-extrabold text-[#0052FF] hover:underline flex items-center">
              <span>View All Cases</span>
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentCases.map((c) => (
              <div key={c.id} className="py-3.5 flex items-center justify-between text-xs hover:bg-slate-50/60 px-2 rounded-2xl transition-colors">
                <div className="flex items-center space-x-3">
                  <span className="font-mono font-bold text-[#0052FF]">{c.payment.externalId}</span>
                  <span className="font-bold text-slate-900">{c.customer.name}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="font-black text-slate-900">{formatCurrency(c.payment.amount)}</span>
                  <StatusBadge status={c.status} />
                  <Link href={`/cases/${c.id}`} className="font-extrabold text-[#0052FF] hover:underline">
                    Inspect
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
