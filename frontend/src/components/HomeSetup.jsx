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
    { icon: Target, title: 'Simulator', desc: 'AI customer persona simulator', mode: 'simulator' },
    { icon: Swords, title: 'Survival Arcade', desc: '4-ticket high stakes HP mode', mode: 'survival' },
    { icon: Keyboard, title: 'Manual Input', desc: 'Paste real customer text', mode: 'manual' },
    { icon: RotateCcw, title: 'Replay Mode', desc: 'Step through transcripts', mode: 'replay' },
    { icon: BarChart3, title: 'Analytics', desc: 'Performance & Hall of Fame', mode: 'analytics' }
  ];

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="rounded-md bg-zinc-800 px-2.5 py-0.5 text-xs font-semibold text-zinc-300 border border-zinc-700">
                ENTERPRISE V2.0
              </span>
              <span className="text-xs font-semibold text-emerald-400">🟢 AI Engine Ready</span>
            </div>
            <h2 className="font-['Outfit'] text-2xl font-bold text-white">
              AI Customer Support Coach & Simulator
            </h2>
            <p className="text-xs text-zinc-400 max-w-2xl mt-1">
              Select a customer issue, dynamic food order persona, and emotion level to launch a real-time AI coaching session.
            </p>
          </div>
          <button
            onClick={() => onStartSession(currentSc, emotion, agentName)}
            className="flex items-center gap-2 rounded-lg bg-zinc-100 px-5 py-2.5 font-['Outfit'] font-bold text-xs text-zinc-900 hover:bg-white transition-all shadow-md"
          >
            <Play className="h-4 w-4 fill-zinc-900 text-zinc-900" />
            Launch Live Session
          </button>
        </div>
      </div>

      {/* Quick Launch Cards Bento Grid */}
      <div>
        <h3 className="font-['Outfit'] font-bold text-sm text-zinc-300 mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-zinc-400" />
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
                className="flex flex-col items-start rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 text-left hover:border-zinc-700 hover:bg-zinc-800/80 transition-all group"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-zinc-200 mb-3 border border-zinc-700 group-hover:bg-zinc-700">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="font-['Outfit'] font-bold text-sm text-white">{item.title}</div>
                <div className="text-[11px] text-zinc-400 mt-1">{item.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scenario & Config Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Dynamic Scenario Picker */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
          <div className="flex items-center gap-2 font-['Outfit'] font-bold text-sm text-white">
            <ShoppingBag className="h-4 w-4 text-zinc-400" />
            <span>Select Customer Issue & Order Scenario</span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400">Customer Order Scenario:</label>
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2.5 text-xs text-white focus:border-zinc-500 focus:outline-none"
            >
              {scenarios.map((sc) => (
                <option key={sc.id} value={sc.id}>{sc.title}</option>
              ))}
            </select>
          </div>

          {/* Selected Order Summary Preview Card */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3.5 space-y-2 text-xs">
            <div className="font-bold text-zinc-200">📦 Order Preview: {currentSc.restaurant}</div>
            <div className="text-zinc-300"><b>Items:</b> {currentSc.items}</div>
            <div className="flex justify-between text-zinc-400 pt-1 border-t border-zinc-800">
              <span>Amount: <b className="text-white">{currentSc.amount}</b> ({currentSc.payment})</span>
              <span>ID: <code className="text-zinc-300">{currentSc.orderId}</code></span>
            </div>
          </div>
        </div>

        {/* Right Column: Agent & Model Tier Config */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
          <div className="flex items-center gap-2 font-['Outfit'] font-bold text-sm text-white">
            <Settings className="h-4 w-4 text-zinc-400" />
            <span>Session & AI Model Parameters</span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400">Your Support Agent Name:</label>
            <input
              type="text"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2.5 text-xs text-white focus:border-zinc-500 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400">Starting Customer Emotion:</label>
            <select
              value={emotion}
              onChange={(e) => setEmotion(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2.5 text-xs text-white focus:border-zinc-500 focus:outline-none"
            >
              <option value="angry">😡 Angry (Critical Escalation)</option>
              <option value="frustrated">😤 Frustrated (Delayed Order)</option>
              <option value="neutral">😐 Neutral (General Query)</option>
              <option value="satisfied">😊 Satisfied (Feedback)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400">LLM Model Gateway Tier:</label>
            <select
              value={modelTier}
              onChange={(e) => setModelTier(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2.5 text-xs text-white focus:border-zinc-500 focus:outline-none"
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
