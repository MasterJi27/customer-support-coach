import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './components/Navbar';
import ZomatoOrderBanner from './components/ZomatoOrderBanner';
import ChatStream from './components/ChatStream';
import CopilotSidebar from './components/CopilotSidebar';
import ActionToolbar from './components/ActionToolbar';
import { Send, Sparkles } from 'lucide-react';

export default function App() {
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

  // Initialize session on mount
  useEffect(() => {
    startNewSession();
  }, []);

  const startNewSession = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/api/session/start', {
        mode: 'simulator',
        agent_name: 'Support Agent',
        product_context: 'Zomato Food Delivery',
        scenario_choice: 'delivery_delay'
      });
      if (res.data?.messages) {
        setMessages(res.data.messages);
      }
      if (res.data?.last_turn) {
        setLastTurn(res.data.last_turn);
      }
    } catch (err) {
      console.warn('Backend offline or connecting to mock state', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (textToSend = inputText) => {
    if (!textToSend.trim() || loading) return;

    const newMsg = textToSend.trim();
    setInputText('');
    setLoading(true);

    // Optimistic UI update
    setMessages((prev) => [...prev, { role: 'agent', content: newMsg }]);

    try {
      const res = await axios.post('/api/chat/message', {
        message: newMsg,
        role: 'agent'
      });
      if (res.data?.messages) {
        setMessages(res.data.messages);
      }
      if (res.data?.last_turn) {
        setLastTurn(res.data.last_turn);
      }
    } catch (err) {
      console.warn('API error, using fallback state', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAutopilot = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/api/chat/autopilot');
      if (res.data?.messages) {
        setMessages(res.data.messages);
      }
      if (res.data?.last_turn) {
        setLastTurn(res.data.last_turn);
      }
    } catch (err) {
      handleSendMessage("I completely understand your frustration and apologize for the delay. I am authorizing a 100% full refund of ₹250 to your GPay + crediting a ₹100 apology voucher to your account.");
    } finally {
      setLoading(false);
    }
  };

  const handleManagerTakeover = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/api/chat/manager-takeover');
      if (res.data?.messages) {
        setMessages(res.data.messages);
      }
      if (res.data?.last_turn) {
        setLastTurn(res.data.last_turn);
      }
    } catch (err) {
      handleSendMessage("🛡️ MANAGER TAKEOVER STATEMENT (Ramesh Kumar - Senior Ops Manager):\n\"Namaste! I am Ramesh Kumar, Senior Customer Support Operations Manager. I have personally taken over ticket ORD-8142K. I sincerely apologize for the delay and have authorized a 100% full refund of ₹250 to your GPay + ₹100 goodwill voucher.\"");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 max-w-[1500px] mx-auto">
      {/* Top Navbar */}
      <Navbar onReset={startNewSession} />

      {/* Main Grid: Left Chat & Right Copilot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Order Banner & Live Conversation Stream */}
        <div className="lg:col-span-7 space-y-4">
          <ZomatoOrderBanner />
          <ChatStream messages={messages} sentiment={lastTurn?.sentiment || 'angry'} />

          {/* Quick Response Action Chips */}
          <ActionToolbar 
            onQuickTemplate={(text) => setInputText(text)} 
            onMockTool={(toolName, result) => {
              setInputText(`[Action Executed: ${toolName}] ${result}`);
            }}
          />

          {/* Agent Reply Input Console */}
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

        {/* Right 5 Columns: Intelligence & Copilot Sidebar */}
        <div className="lg:col-span-5">
          <CopilotSidebar
            turn={lastTurn}
            onSendAutopilot={handleAutopilot}
            onFillText={(text) => setInputText(text)}
            onManagerTakeover={handleManagerTakeover}
          />
        </div>
      </div>
    </div>
  );
}
