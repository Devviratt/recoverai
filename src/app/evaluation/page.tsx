// ─── RecoverAI Evaluation & Benchmark Metrics Page ──────────────────────────────
// Ultra-Premium iOS + Razorpay Fintech Design System

'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { CheckCircle2, RefreshCw, AlertCircle, TrendingUp, Cpu, BarChart2, ShieldCheck, Terminal, Sparkles, Copy, Check } from 'lucide-react';

export default function EvaluationPage() {
  const [evalData, setEvalData] = useState<any>(null);
  const [seed, setSeed] = useState(42);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);

  const fetchEvaluation = async (seedVal: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/evaluation?seed=${seedVal}`);
      if (res.ok) {
        const data = await res.json();
        setEvalData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluation(seed);
  }, [seed]);

  const cliCommand = `npm run evaluate -- --seed=${seed}`;

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Title Bar */}
        <div className="bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2 relative z-10">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 text-xs font-bold">
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Reproducible Benchmark Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Evaluation & Benchmark Report
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Reproducible evaluation on held-out test dataset comparing baseline natural recovery vs RecoverAI.
            </p>
          </div>

          <div className="flex items-center space-x-2.5 bg-white/10 p-2.5 rounded-2xl border border-white/15 backdrop-blur-md self-start md:self-center shrink-0">
            <span className="text-xs font-bold text-slate-200 pl-2">Seed:</span>
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(parseInt(e.target.value, 10) || 42)}
              className="w-16 py-1.5 px-2.5 border border-white/20 rounded-xl text-xs font-mono font-bold text-center bg-slate-900 text-white focus:outline-none"
            />
            <button
              onClick={() => fetchEvaluation(seed)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-500/25 active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Run Benchmark</span>
            </button>
          </div>
        </div>

        {/* Mandatory Synthetic Evaluation Label Banner */}
        <div className="bg-amber-50 border border-amber-200/80 rounded-3xl p-5 shadow-sm flex items-start space-x-3 text-amber-900 text-xs">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-extrabold text-slate-900 block text-sm">
              Evaluation Methodology & Transparency Notice
            </span>
            <p className="text-amber-900 leading-relaxed font-medium">
              Evaluation performed on held-out synthetic test dataset (300 payment events, seed {seed}). Metrics represent simulated deterministic outcomes for benchmark reproducibility. No live Razorpay money or production merchant results are fabricated.
            </p>
          </div>
        </div>

        {loading || !evalData ? (
          <div className="py-20 text-center text-slate-500 text-sm font-medium">
            Calculating reproducible evaluation metrics...
          </div>
        ) : (
          <>
            {/* Top Comparative KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total At Risk */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-xl shadow-slate-200/40">
                <div className="text-xs font-bold text-slate-500">Evaluation Revenue At Risk</div>
                <div className="text-2xl font-black text-slate-900 mt-3 tracking-tight">
                  {formatCurrency(evalData.totalRevenueAtRisk)}
                </div>
                <div className="text-xs text-slate-400 font-medium mt-1">300 Held-out Test Cases</div>
              </div>

              {/* Card 2: RecoverAI Recovered Revenue */}
              <div className="bg-white rounded-3xl p-6 border border-emerald-200/80 shadow-xl shadow-emerald-500/5">
                <div className="text-xs font-bold text-emerald-700">RecoverAI Total Recovered</div>
                <div className="text-2xl font-black text-emerald-600 mt-3 tracking-tight">
                  {formatCurrency(evalData.recoveredRevenue)}
                </div>
                <div className="text-xs text-emerald-700 font-extrabold mt-1">
                  {formatPercentage(evalData.recoveryValueRate)} Value Recovery Rate
                </div>
              </div>

              {/* Card 3: Baseline Natural Recovery */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-xl shadow-slate-200/40">
                <div className="text-xs font-bold text-slate-500">Baseline (No Intervention)</div>
                <div className="text-2xl font-black text-slate-700 mt-3 tracking-tight">
                  {formatCurrency(evalData.baselineRecoveryAmount)}
                </div>
                <div className="text-xs text-slate-400 font-medium mt-1">12% Natural customer retry rate</div>
              </div>

              {/* Card 4: Net Recovery Lift */}
              <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 rounded-3xl p-6 border border-blue-200/80 shadow-xl shadow-blue-500/10">
                <div className="text-xs font-black text-blue-800 uppercase tracking-wider">Net Value Lift (RecoverAI)</div>
                <div className="text-2xl font-black text-blue-600 mt-3 tracking-tight">
                  +{formatCurrency(evalData.additionalRecovery)}
                </div>
                <div className="text-xs text-blue-700 font-extrabold mt-1">
                  +{evalData.recoveryValueLift.toFixed(1)}% Value Lift over Baseline
                </div>
              </div>
            </div>

            {/* Detailed Benchmark Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Action Type Success Rates */}
              <div className="bg-white rounded-3xl border border-slate-200/60 p-6 sm:p-7 shadow-xl shadow-slate-200/40 space-y-4">
                <h3 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3 tracking-tight">
                  Intervention Action Success Rates
                </h3>

                <div className="space-y-3.5 text-xs">
                  {evalData.actionSuccessRates.map((act: any) => (
                    <div key={act.action} className="space-y-1.5">
                      <div className="flex justify-between font-extrabold">
                        <span className="text-slate-800 uppercase">{act.action}</span>
                        <span className="text-slate-900">
                          {act.successful} / {act.total} ({formatPercentage(act.rate)})
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3 p-0.5">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.round(act.rate * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Confidence Distribution */}
              <div className="bg-white rounded-3xl border border-slate-200/60 p-6 sm:p-7 shadow-xl shadow-slate-200/40 space-y-4">
                <h3 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3 tracking-tight">
                  AI Confidence & Guardrail Performance
                </h3>

                <div className="space-y-3.5 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-50 font-medium">
                    <span className="text-slate-500">Average AI Confidence</span>
                    <span className="font-extrabold text-blue-600">
                      {(evalData.averageConfidence * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-50 font-medium">
                    <span className="text-slate-500">Human Escalation Rate</span>
                    <span className="font-extrabold text-orange-600">
                      {formatPercentage(evalData.escalationRate)}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-50 font-medium">
                    <span className="text-slate-500">Stopping Rule Rate</span>
                    <span className="font-extrabold text-slate-700">
                      {formatPercentage(evalData.stopRate)}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 font-medium">
                    <span className="text-slate-500">False Intervention Rate</span>
                    <span className="font-extrabold text-emerald-600">
                      {formatPercentage(evalData.falseInterventionRate)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 block mb-2">
                    Confidence Score Distribution:
                  </span>
                  <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                    {evalData.confidenceDistribution.map((cd: any) => (
                      <div key={cd.bucket} className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
                        <div className="font-black text-slate-900 text-sm">{cd.count}</div>
                        <div className="text-slate-400 text-[10px] font-semibold">{cd.bucket}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* CLI Reproducibility Box */}
            <div className="bg-[#0B1426] text-slate-100 rounded-3xl p-6 sm:p-7 shadow-xl space-y-3 font-mono text-xs border border-slate-800">
              <div className="flex items-center justify-between font-sans">
                <div className="flex items-center space-x-2 text-blue-400 font-extrabold text-sm">
                  <Terminal className="w-4 h-4" />
                  <span>CLI Benchmark Reproducibility Command</span>
                </div>
                <span className="text-xs text-slate-400 font-bold">Seed: {evalData.seed}</span>
              </div>
              <p className="text-slate-400 font-sans text-xs">
                To independently verify these evaluation metrics, run the CLI script from the project root:
              </p>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-emerald-400 font-bold flex items-center justify-between">
                <span>{cliCommand}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(cliCommand);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center space-x-1"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="font-sans text-[11px]">{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
