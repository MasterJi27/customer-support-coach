import React from 'react';
import { BookOpen, Upload, FileText, CheckCircle, Clock } from 'lucide-react';

export default function KnowledgeBaseManager() {
  return (
    <div className="space-y-6">
      {/* KB Banner */}
      <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-950/80 via-indigo-950/60 to-slate-950/90 p-6 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="rounded-full bg-sky-500/20 px-3 py-0.5 text-xs font-bold text-sky-300 border border-sky-500/40">
                ZERO-LLAMAINDEX BM25 ENGINE
              </span>
              <span className="text-xs font-semibold text-emerald-400">⚡ Sub-5ms Retrieval</span>
            </div>
            <h2 className="font-['Outfit'] text-2xl font-extrabold text-white">
              📚 Knowledge Base Manager & Auto-KB Approvals
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl mt-1">
              Manage in-memory searchable policy cards and review draft articles automatically created by AutoKBAgent.
            </p>
          </div>
        </div>
      </div>

      {/* KB Stats & Upload */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center gap-2 font-['Outfit'] font-bold text-sm text-white">
            <Upload className="h-4 w-4 text-sky-400" />
            <span>Ingest Document Policy</span>
          </div>
          <p className="text-xs text-slate-400">
            Upload PDF, DOCX, TXT, or JSON policy documents. Automatically indexed into memory in under 10ms.
          </p>
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-8 text-center">
            <FileText className="h-8 w-8 text-slate-500 mb-2" />
            <span className="text-xs font-bold text-slate-300">Drag & Drop policy document here</span>
            <span className="text-[11px] text-slate-500 mt-1">Supports PDF, DOCX, JSON, TXT</span>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="rounded-2xl border border-amber-500/30 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center gap-2 font-['Outfit'] font-bold text-sm text-amber-300">
            <Clock className="h-4 w-4" />
            <span>⏳ AutoKBAgent Pending Draft Approvals</span>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs space-y-2">
            <div className="font-bold text-white">Draft #901: Refunds on Damaged Items</div>
            <p className="text-slate-300">Auto-drafted after query relevance dropped below 45% threshold.</p>
            <div className="flex gap-2">
              <button 
                onClick={() => alert('Article approved and published to Knowledge Base!')}
                className="flex-1 rounded-lg bg-emerald-600 py-1.5 font-bold text-white text-xs"
              >
                Approve & Publish
              </button>
              <button className="rounded-lg bg-slate-800 px-3 py-1.5 font-semibold text-slate-300 text-xs">
                Reject
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
