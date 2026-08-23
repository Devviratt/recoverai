// ─── RecoverAI Premium iOS/Razorpay Brand Logo ─────────────────────────────────

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
    <div className={`flex items-center space-x-2.5 group cursor-pointer ${className}`}>
      {/* iOS Squircle Icon Badge with Ambient Blue Glow */}
      <div className={`relative flex items-center justify-center ${iconSizes} rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform duration-300 p-1.5`}>
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
          {/* Dark Navy Base Geometry */}
          <path d="M 18 85 L 48 85 L 60 42 L 24 62 Z" fill="#0B132B" opacity="0.95" />
          {/* Vibrant Electric Blue Forward Blade / 1 Shape */}
          <path d="M 88 5 L 65 87 L 51 87 L 60 55 L 43 60 L 47 48 L 67 37 L 88 5 Z" fill="#FFFFFF" />
        </svg>
      </div>

      {/* Brand Typography */}
      {showText && (
        <span
          className={`font-black tracking-tight font-sans ${textSizes} ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}
        >
          Recover<span className="text-blue-600">AI</span>
        </span>
      )}
    </div>
  );
}
