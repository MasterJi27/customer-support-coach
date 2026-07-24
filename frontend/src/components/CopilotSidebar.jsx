import React, { useState } from 'react';
import { Star, Flame, Sparkles, Send, ShieldCheck, CheckCircle2, Lightbulb, BookOpen } from 'lucide-react';

export default function CopilotSidebar({ turn, onSendAutopilot, onFillText, onManagerTakeover }) {
  const [activeTab, setActiveTab] = useState('copilot');

  const csat = turn ? (turn.quality_score * 5).toFixed(1) : '2.3';
  const churn = turn ? turn.frustration_pct : 65;

  return (
    <div className="space-y-4">
      {/* Predictive CSAT & Churn Radar Widget */}
      <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-slate-900/90 to-slate-950/95 p-4.5 backdrop-blur-xl shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 font-['Outfit'] font-bold text-sm text-white">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <span>Predictive CSAT & Churn Radar</span>
          </div>
          <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[10px] font-bold text-indigo-300 border border-indigo-500/30">
            LIVE FORECAST
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Predicted CSAT</div>
            <div className="font-['Outfit'] text-2xl font-extrabold text-amber-400 my-0.5">
              ⭐ {csat} <span className="text-xs text-slate-500 font-normal">/ 5.0</span>
            </div>
            <div className="text-[10px] font-bold text-emerald-400">+0.4 trend</div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Churn Risk</div>
            <div className={`font-['Outfit'] text-2xl font-extrabold my-0.5 ${churn > 50 ? 'text-red-400' : 'text-emerald-400'}`}>
              🔥 {churn}%
            </div>
            <div className="text-[10px] font-bold text-red-400">+15% risk shift</div>
          </div>
        </div>

        <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-2.5 text-xs text-slate-200 font-medium">
          💡 <b>Action to Boost CSAT:</b> Issue immediate ₹250 refund for missing item + ₹100 apology voucher.
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex rounded-xl border border-slate-800 bg-slate-950/60 p-1">
        <button
          onClick={() => setActiveTab('copilot')}
          className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${activeTab === 'copilot' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
        >
          💡 Copilot & Autopilot
        </button>
        <button
          onClick={() => setActiveTab('rag')}
          className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${activeTab === 'rag' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
        >
          📚 RAG Knowledge
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'copilot' ? (
        <div className="space-y-3">
          {/* Autopilot 3-Tier Reply Cards */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-200">⚡ 3-Tier Autopilot Smart Cards</span>
              <button 
                onClick={onSendAutopilot}
                className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1 text-xs font-bold text-white hover:bg-indigo-500 transition-all shadow-md animate-glow"
              >
                <Send className="h-3 w-3" />
                1-Click Auto-Pilot
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/30 p-3">
                <div className="font-bold text-indigo-300 mb-1">🟢 Empathetic Resolution:</div>
                <p className="text-slate-300 mb-2">
                  "I completely understand your frustration regarding the delay of order ORD-8142K. Let me take ownership and resolve this right away."
                </p>
                <button
                  onClick={() => onFillText("I completely understand your frustration regarding the delay of order ORD-8142K. Let me take ownership and resolve this right away.")}
                  className="rounded bg-indigo-600/80 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-indigo-500"
                >
                  Fill Box
                </button>
              </div>

              <div className="rounded-xl border border-amber-500/30 bg-amber-950/30 p-3">
                <div className="font-bold text-amber-300 mb-1">🟡 Direct Refund & Voucher:</div>
                <p className="text-slate-300 mb-2">
                  "I have authorized a full 100% refund of ₹250 to your GPay + credited a ₹100 goodwill voucher to your Zomato Wallet."
                </p>
                <button
                  onClick={() => onFillText("I have authorized a full 100% refund of ₹250 to your GPay + credited a ₹100 goodwill voucher to your Zomato Wallet.")}
                  className="rounded bg-amber-600/80 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-amber-500"
                >
                  Fill Box
                </button>
              </div>
            </div>
          </div>

          {/* Manager Takeover Banner */}
          <button
            onClick={onManagerTakeover}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-purple-500/40 bg-gradient-to-r from-purple-900/80 to-indigo-900/80 py-2.5 text-xs font-bold text-white hover:from-purple-800 hover:to-indigo-800 transition-all shadow-lg"
          >
            <ShieldCheck className="h-4 w-4 text-purple-300" />
            🛡️ AI Manager Supervisor Takeover
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
          <div className="flex items-center gap-2 font-bold text-xs text-sky-400">
            <BookOpen className="h-4 w-4" />
            <span>Sub-5ms BM25 Retrieved Policy Cards</span>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-xs text-slate-300 space-y-1.5">
            <div className="font-bold text-white">📜 KB Article #814: Food Delay & Refund Eligibility</div>
            <p>
              Orders delayed beyond 45 minutes are eligible for full <mark className="bg-amber-500/30 text-amber-200 px-1 rounded">100% refund</mark> + 
              goodwill voucher up to <mark className="bg-amber-500/30 text-amber-200 px-1 rounded">₹150</mark>.
            </p>
            <div className="text-[10px] text-slate-500 font-mono">Relevance Score: 94.8% | Retrieval Latency: 3.2ms</div>
          </div>
        </div>
      )}
    </div>
  );
}
