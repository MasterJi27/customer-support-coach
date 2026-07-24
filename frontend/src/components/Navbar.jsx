import React from 'react';
import { Zap, ShieldCheck, Cpu, RefreshCw } from 'lucide-react';

export default function Navbar({ onReset }) {
  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-indigo-500/30 bg-slate-900/80 px-6 py-3.5 backdrop-blur-xl shadow-2xl shadow-indigo-950/40">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/30">
          <Zap className="h-5 w-5 text-white animate-pulse" />
        </div>
        <div>
          <h1 className="font-['Outfit'] text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-purple-300 bg-clip-text text-transparent">
            CoachAI Enterprise
          </h1>
          <p className="text-xs font-semibold text-slate-400">
            Real-Time Agent Copilot & Quality Auditing Engine
          </p>
        </div>
        <span className="ml-2 rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-1 text-[11px] font-bold text-indigo-300">
          v2.0 REACT
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs font-semibold">
        <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          <span className="font-mono">GROQ 70B: ONLINE</span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-amber-400">
          <ShieldCheck className="h-4 w-4" />
          <span>ISO-9001 QA</span>
        </div>

        <div className="hidden md:flex items-center gap-1.5 text-sky-400">
          <Cpu className="h-4 w-4" />
          <span>SUB-5MS BM25</span>
        </div>

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-1.5 text-slate-300 hover:bg-indigo-600 hover:text-white transition-all duration-200 shadow-md"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>New Session</span>
        </button>
      </div>
    </header>
  );
}
