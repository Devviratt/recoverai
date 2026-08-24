// ─── Razorpay RecoverAI Futuristic Co-Branded AI Logo ─────────────────────────────

import { Sparkles, Cpu } from 'lucide-react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  theme?: 'dark' | 'light';
}

export default function Logo({
  className = '',
  size = 'md',
  showText = true,
  theme = 'light',
}: LogoProps) {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  }[size];

  const isDark = theme === 'dark';

  return (
    <div className={`flex items-center space-x-2.5 group cursor-pointer ${className}`}>
      {/* Official Razorpay Blade + AI Neural Glow Icon */}
      <div className="relative shrink-0">
        <div className={`relative flex items-center justify-center ${iconSizes} rounded-xl bg-gradient-to-br from-[#0052FF] via-[#0066FF] to-[#0A192F] shadow-md shadow-blue-600/30 group-hover:scale-105 transition-all duration-300 p-1.5 border border-blue-400/40 overflow-hidden`}>
          {/* Background Ambient AI Matrix Glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-transparent pointer-events-none"></div>

          {/* Razorpay Blade Icon SVG */}
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full relative z-10">
            <path d="M 82 8 L 56 92 L 40 92 L 52 56 L 32 62 L 36 48 L 58 37 L 82 8 Z" fill="#FFFFFF" />
            <path d="M 18 92 L 42 92 L 52 56 L 22 72 Z" fill="#00C4FF" opacity="0.95" />
          </svg>
        </div>

        {/* Pulsing AI Spark Badge on Top Corner */}
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00C4FF] opacity-80"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-gradient-to-r from-[#0052FF] to-[#00C4FF] border border-white/80 items-center justify-center">
            <Sparkles className="w-1.5 h-1.5 text-white" />
          </span>
        </span>
      </div>

      {/* Clean Co-Branded AI Brand Mark */}
      {showText && (
        <div className="flex flex-col shrink-0">
          <div className="flex items-center space-x-1.5">
            <span className={`font-black tracking-tight text-base sm:text-lg ${isDark ? 'text-white' : 'text-[#02042B]'}`}>
              Razorpay
            </span>
            <span className="w-1 h-1 rounded-full bg-[#0052FF]"></span>
            <span className="font-black tracking-tight text-base sm:text-lg text-[#0052FF]">
              Recover<span className="bg-gradient-to-r from-[#0052FF] via-[#00C4FF] to-[#38BDF8] bg-clip-text text-transparent font-extrabold">AI</span>
            </span>

            {/* Compact Neon AI Badge */}
            <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-md bg-[#0052FF]/20 border border-[#0052FF]/50 text-[#00C4FF] text-[8px] font-black tracking-wider uppercase">
              <Cpu className="w-2 h-2 text-[#00C4FF] animate-pulse" />
              <span>AI AGENT</span>
            </span>
          </div>

          <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            Autonomous Revenue Recovery Engine
          </span>
        </div>
      )}
    </div>
  );
}
