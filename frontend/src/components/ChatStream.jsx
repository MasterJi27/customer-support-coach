import React from 'react';
import { User, Headset, ShieldAlert, MessageSquare } from 'lucide-react';

export default function ChatStream({ messages, sentiment = 'angry' }) {
  const getEmotionBadge = (s) => {
    switch (s?.toLowerCase()) {
      case 'angry':
        return { emoji: '😡', label: 'ANGRY (CRITICAL)', bg: 'from-red-600 to-red-900', border: 'border-red-500/50' };
      case 'frustrated':
        return { emoji: '😤', label: 'FRUSTRATED', bg: 'from-amber-600 to-amber-900', border: 'border-amber-500/50' };
      case 'satisfied':
        return { emoji: '😊', label: 'SATISFIED', bg: 'from-emerald-600 to-emerald-900', border: 'border-emerald-500/50' };
      default:
        return { emoji: '😐', label: 'NEUTRAL', bg: 'from-slate-700 to-slate-800', border: 'border-slate-600/50' };
    }
  };

  const badge = getEmotionBadge(sentiment);

  if (!messages || messages.length === 0) {
    return (
      <div className="flex h-[420px] flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center backdrop-blur-md">
        <MessageSquare className="mb-3 h-12 w-12 text-slate-600 animate-bounce" />
        <h3 className="font-['Outfit'] text-lg font-bold text-white">No Active Support Messages</h3>
        <p className="max-w-md text-xs text-slate-400">
          Start a live coaching session or click one of the quick scenario templates to begin.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-[480px] flex-col space-y-4 overflow-y-auto rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4.5 backdrop-blur-xl shadow-2xl">
      {/* Emotion Header Avatar Card */}
      <div className={`flex items-center gap-3 rounded-xl border ${badge.border} bg-gradient-to-r ${badge.bg} p-3 text-white shadow-lg`}>
        <span className="text-3xl">{badge.emoji}</span>
        <div>
          <div className="font-bold text-sm tracking-wide">Customer Persona</div>
          <div className="text-[11px] font-semibold opacity-90">LIVE MOOD: {badge.label}</div>
        </div>
      </div>

      {/* Messages Stream */}
      {messages.map((msg, idx) => {
        if (msg.role === 'customer') {
          return (
            <div key={idx} className="flex flex-col items-start max-w-[88%]">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 mb-1">
                <User className="h-3 w-3 text-red-400" />
                <span>CUSTOMER</span>
              </div>
              <div className="rounded-2xl rounded-tl-sm border border-slate-700/60 bg-gradient-to-br from-slate-800/90 to-slate-900/95 p-3.5 text-sm text-slate-100 shadow-md">
                {msg.content}
              </div>
            </div>
          );
        } else if (msg.role === 'agent') {
          return (
            <div key={idx} className="flex flex-col items-end max-w-[88%] ml-auto">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-300 mb-1">
                <Headset className="h-3 w-3 text-indigo-400" />
                <span>SUPPORT AGENT</span>
              </div>
              <div className="rounded-2xl rounded-tr-sm border border-indigo-500/40 bg-gradient-to-br from-indigo-900/70 to-indigo-950/80 p-3.5 text-sm text-white shadow-lg shadow-indigo-950/30">
                {msg.content}
              </div>
            </div>
          );
        } else if (msg.role === 'system') {
          return (
            <div key={idx} className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-950/40 p-3 text-xs font-semibold text-amber-200">
              <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0" />
              <div>
                <b>Manager Whisper:</b> {msg.content}
              </div>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
