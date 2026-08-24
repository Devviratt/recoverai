// ─── Razorpay RecoverAI System Status Capsule Component ─────────────────────────────

import { Cpu, ShieldCheck, Database } from 'lucide-react';

interface ProviderStatusProps {
  aiProvider?: string;
  paymentProvider?: string;
  isTestMode?: boolean;
  variant?: 'light' | 'dark';
}

export default function ProviderStatus({
  aiProvider = process.env.NEXT_PUBLIC_AI_PROVIDER || 'mock',
  paymentProvider = process.env.NEXT_PUBLIC_PAYMENT_PROVIDER || 'mock',
  isTestMode = true,
  variant = 'dark',
}: ProviderStatusProps) {
  const isDark = variant === 'dark';

  return (
    <div
      className={`hidden sm:flex items-center space-x-2.5 text-[11px] font-bold px-3.5 py-1.5 rounded-full backdrop-blur-md transition-all ${
        isDark
          ? 'bg-[#050D1A]/90 text-slate-200 border border-slate-800 shadow-md'
          : 'bg-white text-slate-700 border border-slate-200 shadow-2xs'
      }`}
    >
      <div className="flex items-center space-x-1.5 text-[#00C4FF]">
        <Cpu className="w-3.5 h-3.5" />
        <span>AI: {aiProvider.toUpperCase()}</span>
      </div>

      <span className={isDark ? 'text-slate-700' : 'text-slate-300'}>•</span>

      <div className="flex items-center space-x-1.5 text-emerald-500">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>Provider: {paymentProvider === 'razorpay' ? 'Razorpay Test' : 'Mock Mode'}</span>
      </div>

      <span className={isDark ? 'text-slate-700' : 'text-slate-300'}>•</span>

      <div className="flex items-center space-x-1.5 text-slate-400 font-mono text-[10px]">
        <Database className="w-3 h-3 text-slate-400" />
        <span>SQLite DB</span>
      </div>
    </div>
  );
}
