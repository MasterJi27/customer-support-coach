import React from 'react';
import { Utensils, Bike, MapPin, Phone, AlertTriangle } from 'lucide-react';

export default function ZomatoOrderBanner() {
  return (
    <div className="mb-5 space-y-3">
      {/* SLA Alert Marquee Ticker */}
      <div className="flex items-center justify-between rounded-xl border border-purple-500/30 bg-gradient-to-r from-indigo-950/80 via-purple-950/60 to-slate-950/90 px-4 py-2 text-xs font-mono text-indigo-200 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded bg-red-600 px-2 py-0.5 font-bold text-white text-[10px]">
            <AlertTriangle className="h-3 w-3" />
            SLA MONITOR
          </span>
          <span>Active Queue: <b className="text-white">4 Tickets</b> | Avg Response: <b className="text-emerald-400">14.2s</b> | CSAT Target: <b className="text-amber-400">4.8 ⭐</b></span>
        </div>
        <span className="hidden sm:inline-block rounded-full bg-purple-500/20 px-3 py-0.5 text-[11px] font-semibold text-purple-300 border border-purple-500/30">
          🟢 System Status: 99.9%
        </span>
      </div>

      {/* Zomato Order Header Card */}
      <div className="rounded-2xl border border-red-500/30 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950/90 p-4.5 backdrop-blur-xl shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 font-['Outfit'] font-bold text-lg text-red-400">
            <Utensils className="h-5 w-5 text-red-500" />
            <span>Biryani Blues</span>
            <span className="text-xs font-normal text-slate-400">(ORD-8142K)</span>
          </div>
          <span className="rounded-full border border-red-500/40 bg-red-500/10 px-3 py-0.5 text-xs font-bold text-red-300">
            DELAYED
          </span>
        </div>

        <p className="text-xs text-slate-300 font-medium mb-3">
          <b className="text-slate-200">Items:</b> 1x Special Chicken Biryani + 1x Extra Raita + 1x ThumsUp (750ml)
        </p>

        <div className="flex flex-wrap items-center justify-between border-t border-slate-800/80 pt-2.5 text-xs text-slate-400">
          <span>Total Amount: <b className="text-white font-semibold">₹250</b> (Paid via GPay)</span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-slate-500" />
            H-42, Sector 62, Noida, UP
          </span>
        </div>
      </div>

      {/* Delivery Rider Status Card */}
      <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-gradient-to-r from-slate-900/80 to-slate-950/90 p-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Bike className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-400">Rider Status: Out for Delivery</div>
            <div className="text-xs text-slate-300">
              Partner: <b className="text-white">Ramesh Kumar</b> | Phone: 98XXXXXX50
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/30">
            ETA 8 mins
          </span>
          <button 
            onClick={() => alert('Dialing Ramesh Kumar (98XXXXXX50)...')}
            className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-500 transition-all"
          >
            <Phone className="h-3.5 w-3.5" />
            Call
          </button>
        </div>
      </div>
    </div>
  );
}
