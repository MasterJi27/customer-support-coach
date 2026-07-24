import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './components/Navbar';
import HomeSetup from './components/HomeSetup';
import ZomatoOrderBanner from './components/ZomatoOrderBanner';
import ChatStream from './components/ChatStream';
import CopilotSidebar from './components/CopilotSidebar';
import ActionToolbar from './components/ActionToolbar';
import SurvivalArcade from './components/SurvivalArcade';
import AnalyticsVault from './components/AnalyticsVault';
import KnowledgeBaseManager from './components/KnowledgeBaseManager';
import { Send } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('setup');
  const [currentScenario, setCurrentScenario] = useState({
    restaurant: 'Biryani Blues',
    orderId: 'ORD-8142K',
    items: '1x Special Chicken Biryani + 1x Extra Raita + 1x ThumsUp',
    amount: '₹250',
    payment: 'GPay',
    address: 'H-42, Sector 62, Noida, UP'
  });

  const [messages, setMessages] = useState([
    { role: 'customer', content: 'WHERE IS MY CHICKEN BIRYANI?! I paid ₹250 45 mins ago! Connect me to a human right now!' }
  ]);

  const [lastTurn, setLastTurn] = useState({
    quality_score: 0.46,
    frustration_pct: 90,
    sentiment: 'angry'
  });

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  const startSessionWithScenario = async (sc, emotion, agentName) => {
    setCurrentScenario(sc);
    setActiveTab('simulator');
    setLoading(true);

    const initialCustMsg = sc.id === 'pizza'
      ? 'I ordered a Cheese Burst Medium Pizza and you guys sent a tiny regular cold pizza! What is this rubbish?!'
      : (sc.id === 'coffee'
        ? 'The Starbucks delivery guy just handed me a bag soaked in spilled Caramel Macchiato! I demand a refund!'
        : (sc.id === 'billing'
          ? 'Why was my credit card charged twice for $199 on the annual Pro tier?! Fix this immediately!'
          : 'WHERE IS MY CHICKEN BIRYANI?! I paid ₹250 45 mins ago! Connect me to a human right now!'));

    setMessages([{ role: 'customer', content: initialCustMsg }]);
    setLastTurn({ quality_score: 0.45, frustration_pct: emotion === 'angry' ? 90 : 65, sentiment: emotion });

    try {
      const res = await axios.post('/api/session/start', {
        mode: 'simulator',
        agent_name: agentName || 'Support Agent',
        product_context: sc.context,
        scenario_choice: sc.title
      });
      if (res.data?.messages) setMessages(res.data.messages);
      if (res.data?.last_turn) setLastTurn(res.data.last_turn);
    } catch (err) {
      console.warn('Backend API using dynamic state fallback', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (textToSend = inputText) => {
    if (!textToSend.trim() || loading) return;

    const newMsg = textToSend.trim();
    setInputText('');
    setLoading(true);

    setMessages((prev) => [...prev, { role: 'agent', content: newMsg }]);

    try {
      const res = await axios.post('/api/chat/message', {
        message: newMsg,
        role: 'agent'
      });
      if (res.data?.messages) setMessages(res.data.messages);
      if (res.data?.last_turn) setLastTurn(res.data.last_turn);
    } catch (err) {
      console.warn('API fallback', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAutopilot = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/api/chat/autopilot');
      if (res.data?.messages) setMessages(res.data.messages);
      if (res.data?.last_turn) setLastTurn(res.data.last_turn);
    } catch (err) {
      handleSendMessage(`I completely understand your concern regarding ${currentScenario.restaurant} (${currentScenario.orderId}). I have authorized a 100% full refund of ${currentScenario.amount} + ₹100 apology voucher.`);
    } finally {
      setLoading(false);
    }
  };

  const handleManagerTakeover = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/api/chat/manager-takeover');
      if (res.data?.messages) setMessages(res.data.messages);
      if (res.data?.last_turn) setLastTurn(res.data.last_turn);
    } catch (err) {
      handleSendMessage(`🛡️ MANAGER TAKEOVER STATEMENT (Ramesh Kumar - Senior Ops Manager):\n"Namaste! I am Ramesh Kumar, Senior Customer Support Operations Manager. I have personally taken over ticket ${currentScenario.orderId}. I sincerely apologize and have authorized a 100% full refund of ${currentScenario.amount} to your payment method + ₹100 goodwill voucher."`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 max-w-[1500px] mx-auto">
      {/* Executive Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onReset={() => setActiveTab('setup')}
      />

      {/* Render Active View */}
      {activeTab === 'setup' && (
        <HomeSetup
          onStartSession={startSessionWithScenario}
          onNavigate={(tab) => setActiveTab(tab)}
        />
      )}

      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Order & Live Chat */}
          <div className="lg:col-span-7 space-y-4">
            <ZomatoOrderBanner scenario={currentScenario} />
            <ChatStream messages={messages} sentiment={lastTurn?.sentiment || 'angry'} />
            <ActionToolbar
              onQuickTemplate={(text) => setInputText(text)}
              onMockTool={(toolName, result) => setInputText(`[Action Executed: ${toolName}] ${result}`)}
            />
            {/* Agent Reply Box */}
            <div className="relative rounded-2xl border border-indigo-500/30 bg-slate-900/80 p-2 backdrop-blur-xl shadow-2xl">
              <textarea
                rows={3}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type your reply as a support agent (Press Enter to submit)..."
                className="w-full resize-none rounded-xl border-none bg-transparent p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
              />
              <div className="flex items-center justify-between border-t border-slate-800/80 px-3 pt-2">
                <span className="text-[11px] font-semibold text-slate-500">
                  💡 Press <kbd className="rounded bg-slate-800 px-1 py-0.5 text-slate-300">Enter</kbd> to Send
                </span>
                <button
                  disabled={loading || !inputText.trim()}
                  onClick={() => handleSendMessage()}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2 text-xs font-bold text-white hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/30 animate-glow"
                >
                  {loading ? 'Processing...' : (
                    <>
                      <span>Submit Response</span>
                      <Send className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Copilot Sidebar */}
          <div className="lg:col-span-5">
            <CopilotSidebar
              turn={lastTurn}
              onSendAutopilot={handleAutopilot}
              onFillText={(text) => setInputText(text)}
              onManagerTakeover={handleManagerTakeover}
            />
          </div>
        </div>
      )}

      {activeTab === 'survival' && <SurvivalArcade />}
      {activeTab === 'analytics' && <AnalyticsVault />}
      {activeTab === 'kb' && <KnowledgeBaseManager />}
    </div>
  );
}
