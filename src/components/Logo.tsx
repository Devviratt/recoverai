// ─── Razorpay RecoverAI Futuristic Co-Branded AI Logo ─────────────────────────────

import { Sparkles, Bot, Cpu } from 'lucide-react';

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
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  }[size];

  const isDark = theme === 'dark';

  return (
    <div className={`flex items-center space-x-3 group cursor-pointer ${className}`}>
      {/* Official Razorpay Blade + AI Neural Glow Icon */}
      <div className="relative">
        <div className={`relative flex items-center justify-center ${iconSizes} rounded-2xl bg-gradient-to-br from-[#0052FF] via-[#0066FF] to-[#0A192F] shadow-lg shadow-blue-600/30 group-hover:scale-105 group-hover:shadow-blue-500/50 transition-all duration-300 p-2 border border-blue-400/40 shrink-0 overflow-hidden`}>
          {/* Background Ambient AI Matrix Glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-transparent pointer-events-none"></div>

          {/* Razorpay Blade Icon SVG */}
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full relative z-10">
            <path d="M 82 8 L 56 92 L 40 92 L 52 56 L 32 62 L 36 48 L 58 37 L 82 8 Z" fill="#FFFFFF" />
            <path d="M 18 92 L 42 92 L 52 56 L 22 72 Z" fill="#00C4FF" opacity="0.95" />
          </svg>
        </div>

        {/* Pulsing AI Spark Badge on Top Corner */}
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00C4FF] opacity-80"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-gradient-to-r from-[#0052FF] to-[#00C4FF] border border-white/80 items-center justify-center">
            <Sparkles className="w-2 h-2 text-white" />
          </span>
        </span>
      </div>

      {/* Clean Co-Branded AI Brand Mark */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center space-x-2">
            <span className={`font-black tracking-tight text-lg sm:text-xl ${isDark ? 'text-white' : 'text-[#02042B]'}`}>
              Razorpay
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#0052FF]"></span>
            <span className="font-black tracking-tight text-lg sm:text-xl text-[#0052FF]">
              Recover<span className="bg-gradient-to-r from-[#0052FF] via-[#00C4FF] to-[#38BDF8] bg-clip-text text-transparent font-extrabold">AI</span>
            </span>

            {/* Neon AI Badge */}
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-[#0052FF]/15 border border-[#0052FF]/40 text-[#00C4FF] text-[9px] font-black tracking-wider uppercase shadow-2xs">
              <Cpu className="w-2.5 h-2.5 text-[#00C4FF] animate-pulse" />
              <span>AI AGENT</span>
            </span>
          </div>

          <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 font-mono">
            Autonomous Revenue Recovery Engine
          </span>
        </div>
      )}
    </div>
  );
}
