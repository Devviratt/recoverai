// ─── RecoverAI Executive Copilot Chat Widget ───────────────────────────────────────
// Selection-Grade AI Assistant & Site Controller Floating Widget

'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sparkles, X, Send, Bot, User, Play, ChevronRight, RefreshCw, Zap, ShieldCheck, ArrowRight, CornerDownLeft } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedActions?: { label: string; prompt: string }[];
}

export default function CopilotWidget() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'assistant',
      text: `👋 **Welcome to RecoverAI Copilot!**\n\nI can answer questions about payment failures or **control the entire website for you via natural language chat**!\n\nTry clicking any quick action below:`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: [
        { label: '⚡ Run 50-Case Batch Recovery', prompt: 'Run batch recovery' },
        { label: '🎯 Run Scenario A (₹2,499 Recovery)', prompt: 'Run Scenario A' },
        { label: '🛡️ Run Scenario B (₹75k Block)', prompt: 'Run Scenario B' },
        { label: '📊 Run Scenario D (Strategy Comp)', prompt: 'Run Scenario D' },
        { label: '📈 Benchmark Lift Report', prompt: 'What is our benchmark lift?' },
      ],
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const promptText = (textToSend || inputPrompt).trim();
    if (!promptText || loading) return;

    const userMsgId = `user_${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputPrompt('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText, currentPath: pathname }),
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: ChatMessage = {
          id: `asst_${Date.now()}`,
          sender: 'assistant',
          text: data.reply || 'Command processed.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedActions: data.suggestedActions,
        };

        setMessages((prev) => [...prev, assistantMsg]);

        // Execute returned action commands
        if (data.actionCommand) {
          const cmd = data.actionCommand;
          if (cmd.type === 'NAVIGATE' && cmd.payload?.url) {
            setTimeout(() => router.push(cmd.payload.url), 1200);
          } else if (cmd.type === 'REFRESH') {
            setTimeout(() => router.refresh(), 1000);
          }
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            sender: 'assistant',
            text: '⚠️ Copilot service encountered an error. Please try again.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Copilot Pill Trigger Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group relative flex items-center space-x-2.5 px-4 py-3 rounded-full bg-[#02042B] text-white border border-[#0052FF]/60 shadow-2xl shadow-blue-600/30 hover:scale-105 active:scale-95 transition-all duration-300 backdrop-blur-xl"
          title="Open RecoverAI Executive Copilot"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00C4FF] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#0052FF]"></span>
          </span>
          <Sparkles className="w-4 h-4 text-[#00C4FF] group-hover:rotate-12 transition-transform" />
          <span className="text-xs font-black tracking-wide">RecoverAI Copilot</span>
        </button>
      </div>

      {/* Copilot Executive Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 w-[92vw] sm:w-[440px] h-[580px] max-h-[85vh] z-50 rounded-3xl bg-[#081020]/95 backdrop-blur-2xl border border-slate-700/80 shadow-2xl shadow-slate-950/90 flex flex-col font-sans text-xs overflow-hidden animate-fadeIn">
          {/* Top Header */}
          <div className="p-4 px-5 bg-[#030712] border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-[#0052FF] to-[#0A2540] border border-blue-400/30 text-white shadow-md">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5 font-black text-white text-sm">
                  <span>Razorpay</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-[#0052FF]">RecoverAI Copilot</span>
                </div>
                <div className="flex items-center space-x-1.5 text-[10px] text-emerald-400 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>AI Agent Engine & Site Controller Active</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}>
                  <div
                    className={`max-w-[88%] p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? 'bg-[#0052FF] text-white font-semibold rounded-br-xs shadow-md'
                        : 'bg-slate-900/90 text-slate-200 border border-slate-800 rounded-bl-xs shadow-sm font-medium'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 px-1">{msg.timestamp}</span>

                  {/* Suggested Action Chips */}
                  {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2 max-w-[95%]">
                      {msg.suggestedActions.map((action, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(action.prompt)}
                          disabled={loading}
                          className="px-3 py-1.5 rounded-full text-[11px] font-extrabold bg-[#0052FF]/10 hover:bg-[#0052FF]/20 text-[#00C4FF] border border-[#0052FF]/40 transition-all flex items-center space-x-1 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                        >
                          <span>{action.label}</span>
                          <ChevronRight className="w-3 h-3 opacity-60" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center space-x-2 text-slate-400 text-xs font-mono p-2">
                <Sparkles className="w-4 h-4 text-[#00C4FF] animate-spin" />
                <span>RecoverAI AI is thinking & executing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Chat Input */}
          <div className="p-3 bg-[#030712] border-t border-slate-800 flex items-center space-x-2">
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask Copilot to explain or execute (e.g. 'Run batch recovery')..."
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#0052FF] transition-colors"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={loading || !inputPrompt.trim()}
              className="p-2.5 rounded-2xl bg-[#0052FF] hover:bg-[#0046DA] text-white disabled:opacity-50 transition-all shadow-md active:scale-95 shrink-0"
              title="Send Command"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
