import type { Metadata } from 'next';
import './globals.css';
import CopilotWidget from '@/components/CopilotWidget';

export const metadata: Metadata = {
  title: 'RecoverAI — AI Revenue Recovery Agent | Razorpay AI Buildathon 2026',
  description: 'Production-grade AI Revenue Recovery Agent built for Razorpay AI Buildathon 2026. Detects revenue at risk, estimates expected recovery values, runs bounded policy guardrails, and executes automated recovery workflows.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased font-sans">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#F8FAFC] text-slate-900 selection:bg-[#0052FF] selection:text-white">
        {children}
        <CopilotWidget />
      </body>
    </html>
  );
}
