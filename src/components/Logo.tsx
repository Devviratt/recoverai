// ─── Razorpay RecoverAI Co-Branded Logo ──────────────────────────────────────────

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
      {/* Official Razorpay Geometric Forward Slash Blade Icon */}
      <div className={`relative flex items-center justify-center ${iconSizes} rounded-xl bg-gradient-to-br from-[#0052FF] via-[#0B72E7] to-[#0A2540] shadow-md shadow-blue-500/20 group-hover:scale-105 transition-all duration-300 p-2 border border-blue-400/30 shrink-0`}>
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
          <path d="M 82 8 L 56 92 L 40 92 L 52 56 L 32 62 L 36 48 L 58 37 L 82 8 Z" fill="#FFFFFF" />
          <path d="M 18 92 L 42 92 L 52 56 L 22 72 Z" fill="#00C4FF" opacity="0.9" />
        </svg>
      </div>

      {/* Clean Co-Branded Brand Mark */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center space-x-2">
            <span className={`font-black tracking-tight text-lg sm:text-xl ${isDark ? 'text-white' : 'text-[#02042B]'}`}>
              Razorpay
            </span>
            <span className="w-1 h-1 rounded-full bg-[#0052FF]"></span>
            <span className="font-black tracking-tight text-lg sm:text-xl text-[#0052FF]">
              Recover<span className={isDark ? 'text-white' : 'text-[#02042B]'}>AI</span>
            </span>
          </div>
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">
            AI Revenue Recovery Agent
          </span>
        </div>
      )}
    </div>
  );
}
