// ─── Hero Pitch Scenario Launcher Cards ──────────────────────────────────────────
// One-click demo triggers for the 4 Hero Scenarios required by the Buildathon spec

'use client';

import { useState } from 'react';
import { Play, ShieldAlert, CheckCircle2, AlertOctagon, Zap, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function HeroScenarioCards() {
  const [loadingScenario, setLoadingScenario] = useState<string | null>(null);
  const router = useRouter();

  const heroScenarios = [
    {
      id: 'scenario_a',
      title: 'Scenario A — Payment Link Recovery',
      badge: '₹2,499 Recovered',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
      icon: CheckCircle2,
      iconColor: 'text-emerald-500',
      description:
        'Failed ₹2,499 payment → AI diagnoses temporary failure → recommends Payment Link → policy approves → recovery succeeds → ₹2,499 recovered.',
      actionText: 'Run Scenario A',
      externalId: 'pay_hero_scenario_a',
    },
    {
      id: 'scenario_b',
      title: 'Scenario B — Bounded Autonomy Block',
      badge: '₹75,000 High-Value',
      badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
      icon: ShieldAlert,
      iconColor: 'text-amber-500',
      description:
        'High-value ₹75,000 payment → AI recommends recovery → Policy engine blocks execution (exceeds ₹50k limit) → Escalates to human queue.',
      actionText: 'Run Scenario B',
      externalId: 'pay_hero_scenario_b',
    },
    {
      id: 'scenario_c',
      title: 'Scenario C — Explicit Stopping Rule',
      badge: '3/3 Retries Limit',
      badgeColor: 'bg-slate-500/10 text-slate-700 border-slate-300',
      icon: AlertOctagon,
      iconColor: 'text-slate-600',
      description:
        'Repeated failures → Maximum recovery attempts reached (3/3) → Stopping rule triggers → Automation halts safely with audit log.',
      actionText: 'Run Scenario C',
      externalId: 'pay_hero_scenario_c',
    },
    {
      id: 'scenario_d',
      title: 'Scenario D — Strategy Comparison',
      badge: 'Expected Recovery Value',
      badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
      icon: Zap,
      iconColor: 'text-blue-600',
      description:
        'Failed ₹4,999 payment → Strategy Engine evaluates candidates → Calculates estimated recovery probabilities → Selects Payment Link based on value.',
      actionText: 'Run Scenario D',
      externalId: 'pay_hero_scenario_d',
    },
  ];

  const handleRunHero = async (externalId: string, scenarioId: string) => {
    setLoadingScenario(scenarioId);
    try {
      const res = await fetch(`/api/recovery-cases?search=${externalId}`);
      const data = await res.json();
      if (data.cases && data.cases.length > 0) {
        const caseId = data.cases[0].id;
        await fetch(`/api/recovery-cases/${caseId}/analyze`, { method: 'POST' });

        if (scenarioId === 'scenario_a') {
          await fetch(`/api/recovery-cases/${caseId}/recover`, { method: 'POST' });
        }

        router.push(`/cases/${caseId}`);
      } else {
        alert('Hero scenario case not found. Please click Reset in header.');
      }
    } catch (e) {
      console.error(e);
      alert('Error running hero scenario');
    } finally {
      setLoadingScenario(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/80 p-6 relative overflow-hidden space-y-5">
      {/* Top Accent Stripe */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500"></div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 font-black text-xs uppercase tracking-wider">
            <Zap className="w-4 h-4" />
            <span>Interactive Demo Pitch Scenarios</span>
          </div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight mt-0.5">
            5-Minute Judge Walkthrough Scenarios
          </h2>
        </div>
        <span className="self-start sm:self-center text-xs font-extrabold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          Scenarios A, B, C, D Ready
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {heroScenarios.map((s) => {
          const Icon = s.icon;
          const isLoading = loadingScenario === s.id;

          return (
            <div
              key={s.id}
              className="flex flex-col justify-between p-5 rounded-2xl border border-slate-200/90 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 bg-slate-50/50 hover:bg-white group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs group-hover:border-blue-200 transition-colors">
                    <Icon className={`w-5 h-5 ${s.iconColor}`} />
                  </div>
                  <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${s.badgeColor}`}>
                    {s.badge}
                  </span>
                </div>
                <h3 className="text-sm font-black text-slate-900 mb-2 tracking-tight group-hover:text-blue-600 transition-colors">
                  {s.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium mb-4">{s.description}</p>
              </div>

              <button
                onClick={() => handleRunHero(s.externalId, s.id)}
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black bg-[#0B1426] hover:bg-blue-600 text-white disabled:opacity-50 transition-all shadow-md group-hover:shadow-lg active:scale-95"
              >
                <Play className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? 'Processing...' : s.actionText}</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
