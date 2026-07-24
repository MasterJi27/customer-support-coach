import React, { useState } from 'react';
import { Target, Swords, Keyboard, RotateCcw, BarChart3, Settings, Play, Sparkles, ShoppingBag } from 'lucide-react';

export default function HomeSetup({ onStartSession, onNavigate }) {
  const [selectedScenario, setSelectedScenario] = useState('biryani');
  const [emotion, setEmotion] = useState('angry');
  const [agentName, setAgentName] = useState('Support Agent');
  const [modelTier, setModelTier] = useState('Groq Llama 3.3 70B');

  const scenarios = [
    {
      id: 'biryani',
      title: '🍱 Zomato: Biryani Blues (Delayed Delivery)',
      context: 'Zomato Food Delivery',
      orderId: 'ORD-8142K',
      restaurant: 'Biryani Blues',
      items: '1x Special Chicken Biryani + 1x ThumsUp',
      amount: '₹250',
      payment: 'GPay',
      address: 'H-42, Sector 62, Noida'
    },
    {
      id: 'pizza',
      title: '🍕 Pizza Hut: Triple Cheese Melt (Wrong Item)',
      context: 'Pizza Hut Delivery',
      orderId: 'ORD-4192P',
      restaurant: 'Pizza Hut Express',
      items: '1x Cheese Burst Veggie Pizza + 1x Garlic Bread',
      amount: '₹480',
      payment: 'PhonePe',
      address: 'B-12, Cyber City, Gurgaon'
    },
    {
      id: 'coffee',
      title: '☕ Starbucks: Iced Caramel Macchiato (Spilled Drink)',
      context: 'Starbucks Delivery',
      orderId: 'ORD-9912S',
      restaurant: 'Starbucks Coffee',
      items: '2x Iced Caramel Macchiato + 1x Blueberry Muffin',
      amount: '₹620',
      payment: 'Credit Card',
      address: 'Flat 402, Sunshine Apts, Delhi'
    },
    {
      id: 'billing',
      title: '💳 Stripe SaaS: Subscription Double Deducted',
      context: 'SaaS Platform Billing',
      orderId: 'INV-90412',
      restaurant: 'Enterprise Subscription',
      items: 'Pro Tier Annual Plan',
      amount: '$199',
      payment: 'Visa Corporate Card',
      address: 'Acme Corp, San Francisco'
    }
  ];

  const currentSc = scenarios.find(s => s.id === selectedScenario) || scenarios[0];

  const quickModes = [
    { icon: Target, title: 'Simulator', desc: 'AI customer persona simulator', mode: 'simulator', color: 'from-indigo-600 to-purple-600' },
    { icon: Swords, title: 'Survival Arcade', desc: '4-ticket high stakes HP mode', mode: 'survival', color: 'from-red-600 to-amber-600' },
    { icon: Keyboard, title: 'Manual Input', desc: 'Paste real customer text', mode: 'manual', color: 'from-blue-600 to-cyan-600' },
    { icon: RotateCcw, title: 'Replay Mode', desc: 'Step through transcripts', mode: 'replay', color: 'from-emerald-600 to-teal-600' },
    { icon: BarChart3, title: 'Analytics', desc: 'Performance & Hall of Fame', mode: 'analytics', color: 'from-purple-600 to-pink-600' }
  ];

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/80 via-purple-950/60 to-slate-950/90 p-6 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="rounded-full bg-indigo-500/20 px-3 py-0.5 text-xs font-bold text-indigo-300 border border-indigo-500/40">
                ENTERPRISE v2.0
              </span>
              <span className="text-xs font-semibold text-emerald-400">🟢 AI Engine Ready</span>
            </div>
            <h2 className="font-['Outfit'] text-2xl font-extrabold text-white">
              AI Customer Support Coach & Simulator
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl mt-1">
              Select a customer issue, dynamic food order persona, and emotion level to launch a real-time AI coaching session.
            </p>
          </div>
          <button
            onClick={() => onStartSession(currentSc, emotion, agentName)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 font-['Outfit'] font-bold text-sm text-white hover:from-indigo-500 hover:to-purple-500 transition-all shadow-xl shadow-indigo-600/30 animate-glow"
          >
            <Play className="h-4 w-4 fill-white" />
            Launch Live Session
          </button>
        </div>
      </div>

      {/* Quick Launch Cards Bento Grid */}
      <div>
        <h3 className="font-['Outfit'] font-bold text-sm text-slate-300 mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-400" />
          <span>Quick Launch Modes</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {quickModes.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => {
                  if (item.mode === 'survival') onNavigate('survival');
                  else if (item.mode === 'analytics') onNavigate('analytics');
                  else onStartSession(currentSc, emotion, agentName);
                }}
                className="flex flex-col items-start rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-left backdrop-blur-md hover:border-indigo-500/50 hover:bg-slate-900/90 transition-all group"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} text-white mb-3 shadow-md group-hover:scale-105 transition-transform`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="font-['Outfit'] font-bold text-sm text-white">{item.title}</div>
                <div className="text-[11px] text-slate-400 mt-1">{item.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scenario & Config Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Dynamic Scenario Picker */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2 font-['Outfit'] font-bold text-sm text-white">
            <ShoppingBag className="h-4 w-4 text-red-400" />
            <span>Select Customer Issue & Order Scenario</span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400">Customer Order Scenario:</label>
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              {scenarios.map((sc) => (
                <option key={sc.id} value={sc.id}>{sc.title}</option>
              ))}
            </select>
          </div>

          {/* Selected Order Summary Preview Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-2 text-xs">
            <div className="font-bold text-indigo-300">📦 Order Preview: {currentSc.restaurant}</div>
            <div className="text-slate-300"><b>Items:</b> {currentSc.items}</div>
            <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
              <span>Amount: <b className="text-white">{currentSc.amount}</b> ({currentSc.payment})</span>
              <span>ID: <code>{currentSc.orderId}</code></span>
            </div>
          </div>
        </div>

        {/* Right Column: Agent & Model Tier Config */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2 font-['Outfit'] font-bold text-sm text-white">
            <Settings className="h-4 w-4 text-indigo-400" />
            <span>Session & AI Model Parameters</span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400">Your Support Agent Name:</label>
            <input
              type="text"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400">Starting Customer Emotion:</label>
            <select
              value={emotion}
              onChange={(e) => setEmotion(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="angry">😡 Angry (Critical Escalation)</option>
              <option value="frustrated">😤 Frustrated (Delayed Order)</option>
              <option value="neutral">😐 Neutral (General Query)</option>
              <option value="satisfied">😊 Satisfied (Feedback)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400">LLM Model Gateway Tier:</label>
            <select
              value={modelTier}
              onChange={(e) => setModelTier(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="Groq Llama 3.3 70B">⚡ Groq Llama 3.3 70B Versatile (Fastest)</option>
              <option value="Groq Llama 3.1 8B">🚀 Groq Llama 3.1 8B Instant</option>
              <option value="Google Gemini 1.5 Pro">🔮 Google Gemini 1.5 Pro</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
