// ─── RecoverAI Provider & System Status Badge ─────────────────────────────────────
// Translucent header badge providing full system transparency

import { Cpu, ShieldCheck, Database, Layers } from 'lucide-react';

interface ProviderStatusProps {
  aiProvider?: string;
  paymentProvider?: string;
  isTestMode?: boolean;
}

export default function ProviderStatus({
  aiProvider = process.env.NEXT_PUBLIC_AI_PROVIDER || 'mock',
  paymentProvider = process.env.NEXT_PUBLIC_PAYMENT_PROVIDER || 'mock',
  isTestMode = true,
}: ProviderStatusProps) {
  return (
    <div className="hidden lg:flex items-center space-x-2 text-[11px] font-bold text-slate-300 bg-slate-900/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-700/60">
      <div className="flex items-center space-x-1 text-blue-400">
        <Cpu className="w-3 h-3" />
        <span>AI: {aiProvider.toUpperCase()}</span>
      </div>
      <span className="text-slate-600">•</span>
      <div className="flex items-center space-x-1 text-emerald-400">
        <ShieldCheck className="w-3 h-3" />
        <span>Provider: {paymentProvider === 'razorpay' ? 'Razorpay Test' : 'Mock Mode'}</span>
      </div>
      <span className="text-slate-600">•</span>
      <div className="flex items-center space-x-1 text-slate-400">
        <Database className="w-3 h-3" />
        <span>DB: SQLite</span>
      </div>
      <span className="text-slate-600">•</span>
      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-400/20 text-[10px]">
        Controlled Demo / Synthetic Mode
      </span>
    </div>
  );
}
