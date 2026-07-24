import React, { useState } from 'react';
import { Star, Flame, Sparkles, Send, ShieldCheck, CheckCircle2, Lightbulb, BookOpen } from 'lucide-react';

export default function CopilotSidebar({ turn, onSendAutopilot, onFillText, onManagerTakeover }) {
  const [activeTab, setActiveTab] = useState('copilot');

  const csat = turn ? (turn.quality_score * 5).toFixed(1) : '2.3';
  const churn = turn ? turn.frustration_pct : 65;

  return (
    <div className="space-y-4">
      {/* Predictive CSAT & Churn Radar Widget */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4.5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 font-['Outfit'] font-bold text-sm text-white">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span>Predictive CSAT & Churn Radar</span>
          </div>
          <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-300 border border-zinc-700">
            LIVE FORECAST
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
            <div className="text-[10px] font-bold text-zinc-400 uppercase">Predicted CSAT</div>
            <div className="font-['Outfit'] text-2xl font-extrabold text-amber-400 my-0.5">
              ⭐ {csat} <span className="text-xs text-zinc-500 font-normal">/ 5.0</span>
            </div>
            <div className="text-[10px] font-bold text-emerald-400">+0.4 trend</div>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Churn Risk</div>
            <div className={`font-['Outfit'] text-2xl font-extrabold my-0.5 ${churn > 50 ? 'text-red-400' : 'text-emerald-400'}`}>
              🔥 {churn}%
            </div>
            <div className="text-[10px] font-bold text-red-400">+15% risk shift</div>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-xs text-zinc-300 font-medium">
          💡 <b>Action to Boost CSAT:</b> Issue immediate ₹250 refund for missing item + ₹100 apology voucher.
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex rounded-lg border border-zinc-800 bg-zinc-950 p-1">
        <button
          onClick={() => setActiveTab('copilot')}
          className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all ${activeTab === 'copilot' ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm' : 'text-zinc-400 hover:text-white'}`}
        >
          💡 Copilot & Autopilot
        </button>
        <button
          onClick={() => setActiveTab('rag')}
          className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all ${activeTab === 'rag' ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm' : 'text-zinc-400 hover:text-white'}`}
        >
          📚 RAG Knowledge
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'copilot' ? (
        <div className="space-y-3">
          {/* Autopilot 3-Tier Reply Cards */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-200">⚡ 3-Tier Autopilot Smart Cards</span>
              <button 
                onClick={onSendAutopilot}
                className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-500 transition-all shadow-sm"
              >
                <Send className="h-3 w-3" />
                1-Click Auto-Pilot
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 space-y-2">
                <div className="font-bold text-emerald-400">🟢 Empathetic Resolution:</div>
                <p className="text-zinc-300">
                  "I completely understand your frustration regarding the delay of order. Let me take ownership and resolve this right away."
                </p>
                <button
                  onClick={() => onFillText("I completely understand your frustration regarding the delay of order. Let me take ownership and resolve this right away.")}
                  className="rounded bg-zinc-800 px-2.5 py-1 text-[11px] font-semibold text-zinc-200 hover:bg-zinc-700 border border-zinc-700"
                >
                  Fill Box
                </button>
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 space-y-2">
                <div className="font-bold text-amber-400">🟡 Direct Refund & Voucher:</div>
                <p className="text-zinc-300">
                  "I have authorized a full 100% refund to your original payment method + credited a ₹100 goodwill voucher to your account."
                </p>
                <button
                  onClick={() => onFillText("I have authorized a full 100% refund to your original payment method + credited a ₹100 goodwill voucher to your account.")}
                  className="rounded bg-zinc-800 px-2.5 py-1 text-[11px] font-semibold text-zinc-200 hover:bg-zinc-700 border border-zinc-700"
                >
                  Fill Box
                </button>
              </div>
            </div>
          </div>

          {/* Manager Takeover Banner */}
          <button
            onClick={onManagerTakeover}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 text-xs font-bold text-white hover:bg-zinc-700 transition-all shadow"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            🛡️ AI Manager Supervisor Takeover
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-3">
          <div className="flex items-center gap-2 font-bold text-xs text-emerald-400">
            <BookOpen className="h-4 w-4" />
            <span>Sub-5ms BM25 Retrieved Policy Cards</span>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-300 space-y-1.5">
            <div className="font-bold text-white">📜 KB Article #814: Food Delay & Refund Eligibility</div>
            <p>
              Orders delayed beyond 45 minutes are eligible for full <mark className="bg-amber-500/20 text-amber-300 px-1 rounded">100% refund</mark> + 
              goodwill voucher up to <mark className="bg-amber-500/20 text-amber-300 px-1 rounded">₹150</mark>.
            </p>
            <div className="text-[10px] text-zinc-500 font-mono">Relevance Score: 94.8% | Latency: 3.2ms</div>
          </div>
        </div>
      )}
    </div>
  );
}
