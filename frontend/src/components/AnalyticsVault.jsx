import React from 'react';
import { Trophy, Award, TrendingUp, AlertTriangle, ShieldCheck, Download } from 'lucide-react';

export default function AnalyticsVault() {
  return (
    <div className="space-y-6">
      {/* Analytics Banner */}
      <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-950/80 via-indigo-950/60 to-slate-950/90 p-6 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="rounded-full bg-purple-500/20 px-3 py-0.5 text-xs font-bold text-purple-300 border border-purple-500/40">
                QUALITY INTELLIGENCE
              </span>
              <span className="text-xs font-semibold text-amber-400">🏆 ISO-9001 Compliant</span>
            </div>
            <h2 className="font-['Outfit'] text-2xl font-extrabold text-white">
              📊 Performance Analytics & Golden Vault
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl mt-1">
              Historical agent resolution scores, ISO-9001 compliance logs, and Hall of Fame training benchmarks.
            </p>
          </div>

          <button 
            onClick={() => alert('Downloading Executive Performance Audit PDF Report...')}
            className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-purple-500 shadow-lg"
          >
            <Download className="h-4 w-4" />
            Export Executive Audit PDF
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4.5">
          <div className="text-xs font-bold text-slate-400">TOTAL SESSIONS COMPLETED</div>
          <div className="font-['Outfit'] text-3xl font-extrabold text-indigo-400 my-1">42</div>
          <div className="text-xs text-emerald-400 font-semibold">+8 this week</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4.5">
          <div className="text-xs font-bold text-slate-400">AVG RESOLUTION QUALITY SCORE</div>
          <div className="font-['Outfit'] text-3xl font-extrabold text-amber-400 my-1">88.4%</div>
          <div className="text-xs text-emerald-400 font-semibold">ISO-9001 PASSED</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4.5">
          <div className="text-xs font-bold text-slate-400">AVG FIRST RESPONSE LATENCY</div>
          <div className="font-['Outfit'] text-3xl font-extrabold text-sky-400 my-1">14.2s</div>
          <div className="text-xs text-emerald-400 font-semibold">Sub-15s SLA Target</div>
        </div>
      </div>

      {/* Golden Vault: Hall of Fame & Shame */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/60 p-5 space-y-3">
          <div className="flex items-center gap-2 font-['Outfit'] font-bold text-sm text-emerald-400">
            <Trophy className="h-4 w-4" />
            <span>🏆 Hall of Fame (Top 1% Masterclasses)</span>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs text-slate-300 space-y-1">
            <div className="font-bold text-white">100% CSAT De-escalation (Stripe Double Deduction)</div>
            <p>Agent de-escalated angry enterprise client in 2 turns using proactive compensation.</p>
            <span className="inline-block rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
              Score: 98%
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-red-500/30 bg-slate-900/60 p-5 space-y-3">
          <div className="flex items-center gap-2 font-['Outfit'] font-bold text-sm text-red-400">
            <AlertTriangle className="h-4 w-4" />
            <span>💀 Hall of Shame (Roast Archive & Training Failures)</span>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs text-slate-300 space-y-1">
            <div className="font-bold text-white">Robotic Template Copy-Paste Failure</div>
            <p>Agent copy-pasted Terms of Service to an angry customer demanding biryani status.</p>
            <span className="inline-block rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-300">
              Score: 12%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
