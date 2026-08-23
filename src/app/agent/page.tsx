// ─── RecoverAI Agent Workflow Trace & Architectural Console ─────────────────────
// Selection-Grade AI Engineering Console (12-Step Agent Loop + Responsibility Matrix)

'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { formatCurrency } from '@/lib/utils';
import { Cpu, ArrowRight, CheckCircle2, ShieldCheck, Play, Activity, Code, Terminal, Clock, FileJson, Layers, ShieldAlert, Wrench, Lock } from 'lucide-react';
import Link from 'next/link';

export default function AgentTracePage() {
  const [cases, setCases] = useState<any[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [trace, setTrace] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeStepTab, setActiveStepTab] = useState<number>(1);

  useEffect(() => {
    async function loadCases() {
      const res = await fetch('/api/recovery-cases?limit=10');
      if (res.ok) {
        const data = await res.json();
        setCases(data.cases || []);
        if (data.cases?.length > 0) {
          setSelectedCaseId(data.cases[0].id);
        }
      }
    }
    loadCases();
  }, []);

  const handleRunTrace = async () => {
    if (!selectedCaseId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/recovery-cases/${selectedCaseId}/analyze`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setTrace(data.trace);
        setActiveStepTab(1);
      }
    } catch (err) {
      console.error('Error running trace:', err);
    } finally {
      setLoading(false);
    }
  };

  const stepsList = [
    { title: '1. Event Received', desc: 'Failed payment webhook' },
    { title: '2. Context Retrieval', desc: 'Customer stats & LTV' },
    { title: '3. Risk Scoring', desc: '0-100 Risk formula' },
    { title: '4. Failure Diagnosis', desc: 'Semantic reason analysis' },
    { title: '5. Candidate Gen', desc: 'Generate candidate actions' },
    { title: '6. Expected Value', desc: 'Calculate recovery values' },
    { title: '7. AI Strategy Selection', desc: 'Contextual selection' },
    { title: '8. Policy Validation', desc: 'Deterministic guardrails' },
    { title: '9. Tool Execution', desc: 'Typed tool action' },
    { title: '10. Outcome Observed', desc: 'Payment link / retry result' },
    { title: '11. Next Decision', desc: 'Evaluate state transition' },
    { title: '12. Final State', desc: 'Recovered / Escalated / Stop' },
  ];

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Header Title Banner */}
        <div className="bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2 relative z-10">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 text-xs font-bold">
              <Cpu className="w-3.5 h-3.5" />
              <span>AI Engineering Console</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Agentic Workflow & Architecture Console
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              12-step stateful decision loop with clear separation between AI reasoning, Policy guardrails, and Bounded tool execution.
            </p>
          </div>

          {/* Selector & Run Button */}
          <div className="flex flex-wrap items-center gap-3 bg-white/10 p-2.5 rounded-2xl border border-white/15 backdrop-blur-md self-start md:self-center shrink-0">
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="py-2 px-3.5 rounded-xl border border-white/20 text-xs font-mono font-bold text-white bg-slate-900/80 focus:outline-none cursor-pointer"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                  {c.payment.externalId} — {formatCurrency(c.payment.amount)}
                </option>
              ))}
            </select>

            <button
              onClick={handleRunTrace}
              disabled={loading}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 transition-all shadow-lg shadow-blue-500/25 active:scale-95"
            >
              <Play className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Executing...' : 'Trace Case'}</span>
            </button>
          </div>
        </div>

        {/* RESPONSIBILITY MATRIX CARD */}
        <div className="bg-white rounded-3xl border border-slate-200/60 p-6 sm:p-7 shadow-xl shadow-slate-200/40 space-y-4">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center space-x-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Architecture Responsibility Matrix</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium">
            {/* AI Layer */}
            <div className="bg-blue-50/60 p-5 rounded-2xl border border-blue-200/80 space-y-2">
              <div className="flex items-center space-x-2 text-blue-800 font-extrabold text-sm">
                <Cpu className="w-4 h-4 text-blue-600" />
                <span>1. AI Reasoning Layer</span>
              </div>
              <ul className="space-y-1.5 text-slate-700 leading-relaxed text-[11px]">
                <li>• Diagnoses failure semantics</li>
                <li>• Interprets customer context & history</li>
                <li>• Evaluates candidate recovery strategies</li>
                <li>• Recommends action with confidence</li>
                <li>• Generates customer communication</li>
              </ul>
            </div>

            {/* Policy Layer */}
            <div className="bg-amber-50/60 p-5 rounded-2xl border border-amber-200/80 space-y-2">
              <div className="flex items-center space-x-2 text-amber-800 font-extrabold text-sm">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>2. Deterministic Policy Layer</span>
              </div>
              <ul className="space-y-1.5 text-slate-700 leading-relaxed text-[11px]">
                <li>• Enforces monetary thresholds (≥ ₹50k)</li>
                <li>• Enforces maximum retry limits (3/3)</li>
                <li>• Validates customer contact cooldown</li>
                <li>• Enforces fraud safety rules</li>
                <li>• Final authority over execution</li>
              </ul>
            </div>

            {/* Tool Layer */}
            <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-200/80 space-y-2">
              <div className="flex items-center space-x-2 text-emerald-800 font-extrabold text-sm">
                <Wrench className="w-4 h-4 text-emerald-600" />
                <span>3. Typed Tool Layer</span>
              </div>
              <ul className="space-y-1.5 text-slate-700 leading-relaxed text-[11px]">
                <li>• Executes payment link creation</li>
                <li>• Dispatches payment retries</li>
                <li>• Transfers to human escalation queue</li>
                <li>• Halts execution on stopping rules</li>
                <li>• Logs immutable audit events</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Conceptual Workflow Stepper */}
        <div className="bg-white rounded-3xl border border-slate-200/60 p-6 sm:p-7 shadow-xl shadow-slate-200/40 space-y-4">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">
            12-Step Stateful Control Loop Pipeline
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {stepsList.map((s, idx) => {
              const stepNum = idx + 1;
              const hasStep = trace?.steps?.some((st: any) => st.stepNumber === stepNum);
              const isActive = activeStepTab === stepNum;

              return (
                <button
                  key={idx}
                  onClick={() => hasStep && setActiveStepTab(stepNum)}
                  className={`flex flex-col justify-between p-3.5 rounded-2xl border text-left transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/25 scale-[1.02]'
                      : hasStep
                      ? 'bg-blue-50/70 border-blue-200 text-slate-800 hover:border-blue-300'
                      : 'bg-slate-50 border-slate-200/70 text-slate-400 opacity-60'
                  }`}
                >
                  <div className={`font-extrabold text-xs mb-1.5 ${isActive ? 'text-white' : 'text-blue-600'}`}>
                    {s.title}
                  </div>
                  <p className={`text-[10px] leading-snug font-medium ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                    {s.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Execution Trace Output */}
        {trace ? (
          <div className="bg-white rounded-3xl border border-slate-200/60 p-6 sm:p-8 shadow-xl shadow-slate-200/40 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center space-x-2 text-xs text-slate-400 font-semibold mb-1">
                  <Terminal className="w-4 h-4 text-blue-600" />
                  <span>Agent Execution Trace Logs</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Run ID: <span className="font-mono text-blue-600">{trace.runId}</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Total Execution Time: {trace.totalDurationMs} ms · Policy Evaluation: <span className="font-mono font-bold text-slate-800">{trace.policyResult}</span>
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-xs text-slate-500 font-bold">Final Decision:</span>
                <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {trace.decision} ({trace.finalStatus})
                </span>
              </div>
            </div>

            {/* Individual Agent Steps */}
            <div className="space-y-4">
              {trace.steps.map((step: any) => (
                <div
                  key={step.stepNumber}
                  className={`border rounded-2xl p-5 transition-all font-mono text-xs ${
                    activeStepTab === step.stepNumber
                      ? 'border-blue-500 bg-blue-50/20 ring-2 ring-blue-500/20 shadow-md'
                      : 'border-slate-200/80 bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-200/60 pb-3 mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-extrabold">
                        {step.stepNumber}
                      </span>
                      <span className="text-slate-900 font-extrabold font-sans text-sm">
                        Tool Invocation: <span className="font-mono text-blue-600 font-bold">{step.tool}</span>
                      </span>
                    </div>
                    <span className="text-slate-400 font-semibold font-sans text-xs flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1" /> {step.durationMs} ms
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
                    <div>
                      <span className="text-slate-500 block mb-1.5 font-bold font-sans text-[11px] uppercase tracking-wider">
                        Tool Input Context:
                      </span>
                      <pre className="bg-[#0B1426] text-slate-200 p-4 rounded-xl overflow-x-auto text-[11px] leading-relaxed shadow-inner">
                        {JSON.stringify(step.input, null, 2)}
                      </pre>
                    </div>

                    <div>
                      <span className="text-slate-500 block mb-1.5 font-bold font-sans text-[11px] uppercase tracking-wider">
                        Tool Output Result:
                      </span>
                      <pre className="bg-[#0B1426] text-emerald-400 p-4 rounded-xl overflow-x-auto text-[11px] leading-relaxed shadow-inner">
                        {JSON.stringify(step.output, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200/60 p-12 text-center shadow-xl shadow-slate-200/40 space-y-3">
            <Cpu className="w-12 h-12 text-blue-500 mx-auto" />
            <h3 className="text-base font-extrabold text-slate-900">Select a Case to Inspect Trace</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">
              Select any recovery case from the dropdown above and click &quot;Trace Case&quot; to inspect the step-by-step agentic control loop.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
