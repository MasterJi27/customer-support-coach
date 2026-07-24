import React from 'react';
import { Send, Zap, Gift, RefreshCw, AlertOctagon } from 'lucide-react';

export default function ActionToolbar({ onQuickTemplate, onMockTool }) {
  const templates = [
    { label: '🙏 Empathize', text: 'I am really sorry for the delay. I completely understand how frustrating this is, and I will resolve it for you right away.' },
    { label: '🔎 Check Order', text: 'Let me check live status for order ORD-8142K with our logistics dispatch team.' },
    { label: '💳 Full Refund', text: 'I have initiated a 100% full refund of ₹250 to your original GPay payment method.' },
  ];

  return (
    <div className="space-y-3">
      {/* Quick Template Chips */}
      <div>
        <div className="text-xs font-bold text-slate-400 mb-1.5 flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-amber-400" />
          <span>Quick Response Template Chips</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {templates.map((tpl, i) => (
            <button
              key={i}
              onClick={() => onQuickTemplate(tpl.text)}
              className="rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-indigo-500 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
            >
              {tpl.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mock Backend Agentic Tools */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
        <div className="text-[11px] font-bold text-slate-400 mb-2">🛠️ Agentic Mock Backend Tools</div>
        <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => onMockTool('OMS Lookup', 'Order ORD-8142K status: Rider 1.2km away')}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 p-2 text-slate-300 hover:bg-indigo-600 hover:text-white transition-all"
          >
            📦 OMS Lookup Order
          </button>
          <button
            onClick={() => onMockTool('Process Refund', 'Refund ₹250 processed successfully to GPay (Txn: TXN94812)')}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 p-2 text-slate-300 hover:bg-indigo-600 hover:text-white transition-all"
          >
            💳 100% Refund
          </button>
        </div>
      </div>
    </div>
  );
}
