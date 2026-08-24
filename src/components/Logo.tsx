// ─── Razorpay RecoverAI Brand Logo Component ─────────────────────────────────────
// Official Razorpay AI Buildathon 2026 Co-Branded Logo

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

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  }[size];

  return (
    <div className={`flex items-center space-x-3 group cursor-pointer ${className}`}>
      {/* Razorpay Electric Blue Blade Icon */}
      <div className={`relative flex items-center justify-center ${iconSizes} rounded-xl bg-gradient-to-br from-[#0052FF] via-[#0B72E7] to-[#0A2540] shadow-md shadow-blue-500/25 group-hover:scale-105 transition-all duration-300 p-2 border border-blue-400/30`}>
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
          {/* Razorpay Signature Geometric Forward Blade */}
          <path d="M 82 8 L 56 92 L 40 92 L 52 56 L 32 62 L 36 48 L 58 37 L 82 8 Z" fill="#FFFFFF" />
          <path d="M 18 92 L 42 92 L 52 56 L 22 72 Z" fill="#00C4FF" opacity="0.9" />
        </svg>
      </div>

      {/* Razorpay | RecoverAI Co-Branded Typography */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center space-x-1.5">
            <span className="font-black tracking-tight text-[#0052FF] font-sans text-sm sm:text-base uppercase tracking-wider">
              Razorpay
            </span>
            <span className={`text-slate-400 font-light text-sm ${theme === 'dark' ? 'text-slate-600' : 'text-slate-300'}`}>|</span>
            <span
              className={`font-black tracking-tight font-sans ${textSizes} ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}
            >
              Recover<span className="text-[#0052FF]">AI</span>
            </span>
          </div>
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 -mt-1">
            AI Revenue Recovery Agent
          </span>
        </div>
      )}
    </div>
  );
}
