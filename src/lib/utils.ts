import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num);
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    AT_RISK: 'bg-amber-100 text-amber-800',
    DIAGNOSING: 'bg-blue-100 text-blue-800',
    ELIGIBLE: 'bg-cyan-100 text-cyan-800',
    ACTION_SELECTED: 'bg-indigo-100 text-indigo-800',
    ACTION_EXECUTED: 'bg-violet-100 text-violet-800',
    AWAITING_OUTCOME: 'bg-purple-100 text-purple-800',
    RECOVERED: 'bg-emerald-100 text-emerald-800',
    ESCALATED: 'bg-orange-100 text-orange-800',
    STOPPED: 'bg-slate-100 text-slate-700',
    FAILED: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    LOW: 'bg-slate-100 text-slate-700',
    MEDIUM: 'bg-blue-100 text-blue-800',
    HIGH: 'bg-amber-100 text-amber-800',
    CRITICAL: 'bg-red-100 text-red-800',
  };
  return colors[priority] || 'bg-gray-100 text-gray-800';
}

export function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    RETRY: 'Retry Payment',
    PAYMENT_LINK: 'Payment Link',
    REMINDER: 'Send Reminder',
    ALT_METHOD: 'Alt. Method',
    ESCALATE: 'Human Escalation',
    STOP: 'Stop Recovery',
  };
  return labels[action] || action;
}
