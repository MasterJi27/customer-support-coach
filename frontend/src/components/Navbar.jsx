import React from 'react';
import { Zap, Target, Headset, Swords, BarChart3, BookOpen, RefreshCw } from 'lucide-react';

export default function Navbar({ activeTab, onTabChange, onReset }) {
  const navItems = [
    { id: 'setup', label: 'Setup', icon: Target },
    { id: 'simulator', label: 'Coaching Simulator', icon: Headset },
    { id: 'survival', label: 'Survival Mode', icon: Swords },
    { id: 'analytics', label: 'Analytics & Vault', icon: BarChart3 },
    { id: 'kb', label: 'Knowledge Base', icon: BookOpen },
  ];

  return (
    <header className="mb-6 space-y-3">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/90 px-5 py-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700 text-white shadow">
            <Zap className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <h1 className="font-['Outfit'] text-lg font-bold tracking-tight text-white">
              CoachAI Enterprise
            </h1>
            <p className="text-xs font-medium text-zinc-400">
              Real-Time Agent Copilot & Quality Auditing Engine
            </p>
          </div>
          <span className="ml-2 rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-300">
            v2.0 Linear Obsidian
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold">
          <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-mono">GROQ 70B & GEMINI: ONLINE</span>
          </div>

          <button
            onClick={onReset}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all shadow-sm"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Navigation Pill Bar */}
      <div className="flex overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900 p-1 space-x-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <Icon className="h-4 w-4 text-zinc-400" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
