// ─── Selection-Grade Metallic Status Badges ──────────────────────────────────────────

import { getStatusColor, getPriorityColor, getActionLabel } from '@/lib/utils';

export function StatusBadge({ status }: { status: string }) {
  const formatted = status.replace(/_/g, ' ');

  const customColors: Record<string, { bg: string; dot: string }> = {
    AT_RISK: { bg: 'bg-amber-500/10 text-amber-700 border-amber-500/30', dot: 'bg-amber-500' },
    DIAGNOSING: { bg: 'bg-blue-500/10 text-blue-700 border-blue-500/30', dot: 'bg-blue-500' },
    ELIGIBLE: { bg: 'bg-cyan-500/10 text-cyan-700 border-cyan-500/30', dot: 'bg-cyan-500' },
    ACTION_SELECTED: { bg: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/30', dot: 'bg-indigo-500' },
    ACTION_EXECUTED: { bg: 'bg-blue-500/10 text-blue-700 border-blue-500/30', dot: 'bg-blue-500' },
    AWAITING_OUTCOME: { bg: 'bg-purple-500/10 text-purple-700 border-purple-500/30', dot: 'bg-purple-500' },
    RECOVERED: { bg: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/40 shadow-xs shadow-emerald-500/10', dot: 'bg-emerald-500' },
    ESCALATED: { bg: 'bg-orange-500/10 text-orange-700 border-orange-500/30', dot: 'bg-orange-500' },
    STOPPED: { bg: 'bg-slate-500/10 text-slate-700 border-slate-300', dot: 'bg-slate-500' },
    FAILED: { bg: 'bg-rose-500/10 text-rose-700 border-rose-500/30', dot: 'bg-rose-500' },
  };

  const styleObj = customColors[status] || { bg: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${styleObj.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${styleObj.dot} ${status === 'RECOVERED' ? 'animate-ping' : ''}`}></span>
      {formatted}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string | null }) {
  if (!priority) return null;

  const priorityColors: Record<string, string> = {
    LOW: 'bg-slate-100 text-slate-600 border-slate-200',
    MEDIUM: 'bg-blue-50 text-blue-700 border-blue-200',
    HIGH: 'bg-amber-50 text-amber-700 border-amber-300 font-extrabold',
    CRITICAL: 'bg-rose-50 text-rose-700 border-rose-300 font-black shadow-xs shadow-rose-500/10',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black border uppercase tracking-wider ${
        priorityColors[priority] || getPriorityColor(priority)
      }`}
    >
      {priority}
    </span>
  );
}

export function ActionBadge({ action }: { action: string | null }) {
  if (!action) return <span className="text-slate-400 text-xs">—</span>;
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-500/10 text-blue-700 border border-blue-500/30">
      {getActionLabel(action)}
    </span>
  );
}
