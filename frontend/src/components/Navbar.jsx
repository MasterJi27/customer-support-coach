import React from 'react';
import { Zap, Target, Headset, Swords, BarChart3, BookOpen, RefreshCw } from 'lucide-react';

export default function Navbar({ activeTab, onTabChange, onReset }) {
  const navItems = [
    { id: 'setup', label: '🎯 Setup', icon: Target },
    { id: 'simulator', label: '📞 Simulator', icon: Headset },
    { id: 'survival', label: '⚔️ Survival Mode', icon: Swords },
    { id: 'analytics', label: '📊 Analytics', icon: BarChart3 },
    { id: 'kb', label: '📚 KB Manager', icon: BookOpen },
  ];

  return (
    <header className="mb-6 space-y-3">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-indigo-500/30 bg-slate-900/80 px-6 py-3.5 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/30">
            <Zap className="h-5 w-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="font-['Outfit'] text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-purple-300 bg-clip-text text-transparent">
              CoachAI Enterprise
            </h1>
            <p className="text-xs font-semibold text-slate-400">
              Real-Time AI Copilot & Quality Auditing Engine
            </p>
          </div>
          <span className="ml-2 rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-1 text-[11px] font-bold text-indigo-300">
            v2.0 REACT
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold">
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span className="font-mono">GROQ 70B & GEMINI: ONLINE</span>
          </div>

          <button
            onClick={onReset}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-1.5 text-slate-300 hover:bg-indigo-600 hover:text-white transition-all shadow-md"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Navigation Pill Bar */}
      <div className="flex overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80 p-1.5 space-x-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
