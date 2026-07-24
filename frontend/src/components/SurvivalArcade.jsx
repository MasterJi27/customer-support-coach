import React, { useState } from 'react';
import { Heart, Flame, ShieldAlert, Zap, Send } from 'lucide-react';

export default function SurvivalArcade() {
  const [hp, setHp] = useState(85);
  const [score, setScore] = useState(1450);
  const [tickets, setTickets] = useState([
    { id: 'TCK-101', customer: 'Ankit M.', issue: 'Food delayed by 50 mins!', hpLoss: '-15 HP', status: 'CRITICAL', text: 'Where is my order?! It has been 50 mins!' },
    { id: 'TCK-102', customer: 'Priya S.', issue: 'Wrong pizza size delivered', hpLoss: '-10 HP', status: 'WARNING', text: 'I ordered Medium Cheese Burst, got Regular!' },
    { id: 'TCK-103', customer: 'Rohit K.', issue: 'Payment debited twice', hpLoss: '-5 HP', status: 'URGENT', text: 'Money debited twice on UPI!' },
    { id: 'TCK-104', customer: 'Sneha R.', issue: 'Rider un-reachable', hpLoss: '-10 HP', status: 'WARNING', text: 'Rider is not picking up phone call!' },
  ]);

  return (
    <div className="space-y-6">
      {/* Survival Mode Header */}
      <div className="rounded-2xl border border-red-500/40 bg-gradient-to-r from-red-950/80 via-purple-950/60 to-slate-950/90 p-6 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="rounded-full bg-red-500/20 px-3 py-0.5 text-xs font-bold text-red-300 border border-red-500/40">
                ARCADE MODE
              </span>
              <span className="text-xs font-semibold text-amber-400">🔥 High-Stakes Multi-Queue</span>
            </div>
            <h2 className="font-['Outfit'] text-2xl font-extrabold text-white">
              ⚔️ Support Survival Arcade Challenge
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl mt-1">
              Handle 4 simultaneous customer queues before team HP runs out! Fast response quality restores HP.
            </p>
          </div>

          <div className="flex items-center gap-6 bg-slate-950/80 px-5 py-3 rounded-xl border border-slate-800">
            <div>
              <div className="text-[10px] font-bold text-slate-400">TEAM HP</div>
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500 fill-red-500 animate-pulse" />
                <span className="font-['Outfit'] text-xl font-extrabold text-red-400">{hp} / 100</span>
              </div>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <div className="text-[10px] font-bold text-slate-400">ARCADE SCORE</div>
              <div className="font-['Outfit'] text-xl font-extrabold text-amber-400">{score} PTS</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Simultaneous Ticket Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tickets.map((tck, idx) => (
          <div key={tck.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4.5 space-y-3 backdrop-blur-md hover:border-red-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="font-['Outfit'] font-bold text-sm text-white">{tck.id}: {tck.customer}</span>
              <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-[10px] font-bold text-red-400 border border-red-500/30">
                {tck.hpLoss}
              </span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs text-slate-200">
              <b>Message:</b> "{tck.text}"
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Quick resolution reply..."
                className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:outline-none"
              />
              <button 
                onClick={() => {
                  setHp(prev => Math.min(100, prev + 5));
                  setScore(prev => prev + 150);
                }}
                className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-500"
              >
                Send
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
