// ─── RecoverAI Translucent iOS Executive Header ─────────────────────────────────────

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShieldAlert, Activity, FileText, CheckCircle2, RefreshCw, Play, Cpu, AlertTriangle, Menu, X, ChevronRight, Sparkles } from 'lucide-react';
import { useState } from 'react';
import Logo from '@/components/Logo';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', href: '/', icon: Activity },
    { name: 'Recovery Cases', href: '/cases', icon: FileText },
    { name: 'Escalations', href: '/escalations', icon: AlertTriangle },
    { name: 'Agent Trace', href: '/agent', icon: Cpu },
    { name: 'Audit Trail', href: '/audit', icon: ShieldAlert },
    { name: 'Evaluation', href: '/evaluation', icon: CheckCircle2 },
  ];

  const handleRunAgent = async () => {
    setIsRunning(true);
    setMessage('Running RecoverAI Agent on eligible cases...');
    try {
      const res = await fetch('/api/demo/run-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 10 }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Agent processed ${data.processedCount} cases successfully!`);
        router.refresh();
      } else {
        setMessage(`Error: ${data.error || 'Failed to run agent'}`);
      }
    } catch {
      setMessage('Error running agent');
    } finally {
      setIsRunning(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const handleResetDemo = async () => {
    if (!confirm('Re-seed demo dataset to initial state (seed 42)?')) return;
    setIsResetting(true);
    setMessage('Resetting demo dataset...');
    try {
      const res = await fetch('/api/demo/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed: 42 }),
      });
      if (res.ok) {
        setMessage('Demo dataset reset successfully!');
        router.refresh();
      } else {
        setMessage('Failed to reset dataset');
      }
    } catch {
      setMessage('Error resetting dataset');
    } finally {
      setIsResetting(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  return (
    <>
      {/* Top Notification Bar */}
      <div className="bg-[#090D16] border-b border-slate-800/80 text-slate-300 px-4 py-1.5 text-[11px] font-medium">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-950/90 text-emerald-400 border border-emerald-800/80 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
              Controlled Synthetic Demo Mode
            </span>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800/90 text-slate-300 border border-slate-700">
              Razorpay Test Mode APIs Active
            </span>
          </div>

          <div className="flex items-center space-x-3 text-[11px] font-semibold">
            <span className="text-slate-400 hidden md:inline">Track 03: AI Revenue Recovery</span>
            <span className="text-blue-400 font-extrabold flex items-center">
              <Sparkles className="w-3 h-3 mr-1 text-blue-400" />
              Buildathon 2026
            </span>
          </div>
        </div>
      </div>

      {/* Main Glass Header */}
      <header className="sticky top-0 z-50 bg-[#0F172A]/90 backdrop-blur-2xl border-b border-slate-800 shadow-2xl shadow-slate-950/40">
        {message && (
          <div className="bg-blue-600 text-white text-xs px-4 py-1.5 text-center font-bold animate-fadeIn shadow-inner">
            {message}
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            {/* Logo */}
            <Link href="/" className="flex items-center hover:opacity-90 transition-opacity">
              <Logo size="md" theme="dark" />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center p-1 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-inner">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02]'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Quick Actions */}
            <div className="hidden sm:flex items-center space-x-2">
              <button
                onClick={handleRunAgent}
                disabled={isRunning}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-500 active:scale-95 text-white disabled:opacity-50 transition-all shadow-lg shadow-blue-600/30"
                title="Run Recovery Agent on 10 eligible cases"
              >
                <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
                <span>{isRunning ? 'Running...' : 'Run Agent'}</span>
              </button>

              <button
                onClick={handleResetDemo}
                disabled={isResetting}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800/80 hover:bg-slate-700/80 active:scale-95 text-slate-300 border border-slate-700/80 disabled:opacity-50 transition-all"
                title="Re-seed demo dataset (Seed 42)"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                <span>Reset</span>
              </button>
            </div>

            {/* Mobile Menu Trigger */}
            <div className="flex lg:hidden items-center space-x-2">
              <button
                onClick={handleRunAgent}
                disabled={isRunning}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 text-white shadow-sm"
              >
                <Play className={`w-3 h-3 ${isRunning ? 'animate-spin' : ''}`} />
                <span>Agent</span>
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#0F172A] border-b border-slate-800 px-4 pt-3 pb-5 space-y-3 shadow-2xl">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-40" />
                  </Link>
                );
              })}
            </nav>

            <div className="pt-2 border-t border-slate-800 flex items-center space-x-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleResetDemo();
                }}
                disabled={isResetting}
                className="w-full flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                <span>Reset Demo Dataset (Seed 42)</span>
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
