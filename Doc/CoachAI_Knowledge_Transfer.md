# CoachAI — Complete Knowledge Transfer (KT) Guide

**Project:** Development of AI-Powered Customer Support Assistant with Live Response Guidance
**Repo:** https://github.com/MasterJi27/coachai-infosys-final
**Audience:** Every team member who may present, demo, or answer questions about this project
**Last updated:** 2026-08-19

> Read this document once fully, then use the **Q&A Prep** section (Section 10) to
> rehearse. If you can answer those questions, you are ready for the mock and the
> final Infosys presentation.

---

## Table of Contents

1. [Elevator Pitch (30 seconds)](#1-elevator-pitch-30-seconds)
2. [The Problem](#2-the-problem)
3. [The Solution](#3-the-solution)
4. [System Architecture](#4-system-architecture)
5. [The Multi-Agent System (25+ Agents)](#5-the-multi-agent-system-25-agents)
6. [Technology Stack](#6-technology-stack)
7. [System Prompts — How Agents Are Instructed](#7-system-prompts--how-agents-are-instructed)
8. [RAG — Retrieval-Augmented Generation](#8-rag--retrieval-augmented-generation)
9. [How to Run & Demo](#9-how-to-run--demo)
10. [Q&A Prep — Likely Questions & Answers](#10-qa-prep--likely-questions--answers)
11. [Presentation Playbook (Team Roles)](#11-presentation-playbook-team-roles)
12. [Glossary](#12-glossary)

---

## 1. Elevator Pitch (30 seconds)

> "CoachAI is an AI-powered coaching cockpit for customer-support agents. It sits
> next to the agent during a live chat and, after every customer message, tells the
> agent what the customer is feeling, which knowledge-base article applies, how to
> phrase the reply, and whether the conversation is at risk of escalating. It is
> built as a **multi-agent system** — over 25 specialized AI agents, each with a
> single responsibility, coordinated by an orchestrator. After the session it
> produces a performance report with a resolution score and coaching tips, and it
> can even execute real actions like creating Jira tickets, sending refund emails,
> and posting to Slack."

---

## 2. The Problem

| Pain point | Detail |
|---|---|
| Coaching happens too late | QA samples calls *after* they finish; feedback arrives days later |
| Escalations detected late | Managers join only after the customer is already angry |
| Knowledge is scattered | Agents manually search docs and FAQs mid-chat |
| Inconsistent quality | Reply quality depends on the individual agent's experience |
| No structured training | New agents learn by shadowing; no safe, repeatable practice |
| No risk foresight | CSAT, churn, fraud, and viral/PR threats are discovered after the fact |

---

## 3. The Solution

- **Real-time coaching** — every customer message is analyzed in under a second:
  intent, sentiment, frustration %, escalation risk, predicted CSAT, churn risk.
- **Reply guidance** — a suggested reply with tone, clarity, and compliance feedback
  before the agent hits send.
- **Knowledge on tap** — RAG retrieves the right KB article and synthesizes one
  distilled tip per message; missing knowledge auto-drafts new FAQs.
- **Predictive risk signals** — fraud, defection to competitors, viral/PR threats,
  and a "mind-reader" that guesses the customer's true intent.
- **Manager override** — a supervisor agent whispers advice or takes over the chat
  when risk crosses a threshold.
- **Agentic tools** — real actions via Composio: Jira tickets, Gmail refund emails,
  Slack alerts. Auto-Pilot replies and acts in one click.
- **Training modes** — AI Simulator (with a Hinglish-speaking AI customer), Manual,
  Transcript Replay, and a gamified Survival Mode.
- **Reports & analytics** — post-session performance reports (resolution score,
  sentiment journey, coaching tips, knowledge gaps) emailed automatically; cross-
  session analytics for managers.

---

## 4. System Architecture

```
                        ┌─────────────────────────────────────────────┐
                        │            React frontend (Vite)             │
                        │  Landing, Login, Dashboard, Setup, Reports,  │
                        │  Analytics, Knowledge, HallOfFame, Jira...   │
                        └───────────────┬─────────────────────────────┘
                                        │  fetch → /api/* (REST + JSON)
                    ┌───────────────────▼────────────────────┐
                    │   Node Express backend  (backend/)      │  ← current API
                    │   app.js + agents.js + llm.js + rag.js │    (auth + chat +
                    │   + auth.js + coaching.js + reports.js │    25 agents mirror)
                    └───┬──────────────┬───────────────┬──────┘
                        │              │               │
              ┌─────────▼───┐   ┌──────▼─────┐   ┌─────▼─────────┐
              │ Postgres    │   │ LLM chain  │   │ RAG           │
              │ (pg, JSONB) │   │ Azure → OR │   │ BM25 +       │
              │ + SQLite    │   │ → Groq     │   │ embeddings    │
              └─────────────┘   └──────┬──────┘   └──────────────┘
                                       ▼
                  Python FastAPI backend (vercel-backend/src) — legacy
                  Streamlit app (src/ui/app.py) — standalone demo UI,
                  runs the same Python agents (src/agents/*.py)
```

Two parallel implementations exist for the same product concept:

1. **Python** (`src/`) — the "research" implementation, richest feature set
   (25 agents), used by Streamlit and the legacy FastAPI backend.
2. **Node** (`backend/src/`) — the "production-facing" implementation, mirrors
   the same endpoints/agents in JavaScript, adds **auth**, talks directly to the
   React frontend. This is what the demo runs on.

### Per-turn flow (the thing to memorize)

1. Customer message arrives (typed, simulated, or replayed).
2. `Orchestrator` hands it to `ConversationManager`.
3. **IntentSentimentAgent** → LLM call → intent, sentiment, frustration, trend.
4. **KnowledgeRecommendationAgent** → keyword + semantic search over KB chunks
   (retrieval) → LLM call to synthesize one tip (generation). This
   retrieval-then-generation pair is the RAG step.
5. **CoachingSuggestionAgent** → suggested reply + tone/clarity feedback.
6. **EscalationMonitorAgent** → rule-based risk score + strategy.
7. **DeepAnalysisAgent** (in parallel) → one LLM call producing predicted CSAT,
   churn %, viral/PR threat, fraud protocol, mind-reader monologue.
8. All results merge into one `TurnAnalysis`, rendered in the coaching console.
9. At session end, **PostInteractionSummaryAgent** builds the report.

---

## 5. The Multi-Agent System (25+ Agents)

Every agent has **one responsibility**. LLM-based agents call `llm_chat()` and
parse JSON with hard-coded fallbacks — the app never crashes on LLM errors, it
degrades gracefully.

| Agent | LLM? | What it does |
|---|---|---|
| `customer_simulator` | Yes | Generates realistic AI customer messages (Hinglish mode, ≤140 chars) |
| `intent_sentiment` | Yes | Classifies intent, sentiment, frustration 0–1, satisfaction trend |
| `deep_analysis` | Yes | One-call consolidation: CSAT, churn, viral/PR, fraud, defection, mind-read |
| `knowledge_recommendation` | Yes | Agentic RAG: retrieves KB article + synthesizes one tip; detects KB gaps |
| `coaching_suggestion` | Yes | Suggests agent reply; scores tone/clarity; injects macros library |
| `escalation_monitor` | No | Weighted rule-based escalation-risk scoring |
| `post_interaction_summary` | No | End-of-session report: sentiment journey, resolution score, gaps |
| `coach_calibrator` | No | Learns per agent when to actually show coaching tips (adaptive) |
| `predictive_csat` | Yes | Forecasts live CSAT (1–5) and churn risk % |
| `manager_supervisor` | Yes | Simulates supervisor whisper/takeover on extreme risk |
| `compliance_monitor` | Yes | Flags agent replies that contradict KB policy |
| `tone_rewriter` | Yes | Rewrites a rough draft into a polished, empathetic reply |
| `auto_kb_agent` | Yes | Auto-drafts a new FAQ when a knowledge gap is detected |
| `auto_pilot_agent` | Yes | One-click autonomous reply + backend action (refund/voucher) |
| `competitor_defection_agent` | Yes | Detects "I'll switch to X" churn threats |
| `customer_mind_reader` | Yes | Guesses the customer's unstated internal thought |
| `multiverse_simulator` | Yes | "What if the agent replied differently?" branching demo |
| `viral_threat_predictor` | Yes | Flags risk of the customer posting publicly (social/PR) |
| `fraud_detector` | Yes | Flags refund-abuse / scam patterns |
| `jira_bug_generator` | Yes | Turns a transcript into a structured bug ticket |
| `scenario_generator` | Yes | LLM-generates new training scenarios on demand |
| `qa_audit_agent` | No | Rule-based ISO-style pass/fail audit of a report |
| `cognitive_load_agent` | No | Estimates agent mental workload |
| `patience_clock_agent` | No | Estimates "turns until customer drops off" |
| `bot_agent` | No | Scripted first-line chatbot before a human agent joins |

---

## 6. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS + react-router + framer-motion + lucide icons + @tanstack/react-query + jsPDF — deployed on **Vercel** |
| Backend (current) | Node.js ≥18 + Express + ESM + `pg` — port 8000 |
| Backend (research) | Python FastAPI (`src/api/server.py`) + Streamlit (`src/ui/app.py`) |
| LLM chain | **Azure OpenAI** (primary, e.g. gpt-5.4-mini) → **OpenRouter** free models → **Groq** (llama-3.3-70b-versatile → llama-3.1-8b-instant → gemma2-9b-it → llama3-8b-8192) |
| Embeddings | OpenRouter `nvidia/nemotron-3-embed-1b:free` (2048-dim) |
| TTS | OpenRouter `fish-audio/s2.1-pro-free:free` with gTTS fallback |
| RAG | Hybrid: semantic embeddings (cosine) + BM25/keyword fallback; in-memory + JSONB cache |
| Database | PostgreSQL (JSONB session state, cross-instance rehydration) with SQLite fallback |
| Data models | Pydantic (Python) |
| Integrations | Composio v3 SDK — Jira, Gmail, Slack |
| Testing | pytest (14 tests), vitest (7 tests), node --test |
| Deployment | Vercel (frontend + both backends), Streamlit Cloud, Neon/Supabase/Azure Postgres |
---

## 7. System Prompts — How Agents Are Instructed

- **Single source of truth:** every LLM agent imports its system prompt from
  `src/core/prompts.py` (15+ prompt constants + 4 builder functions) instead of
  hard-coding it. The Node backend mirrors the same instructions in
  `backend/src/agents.js`.
- **Builder functions** interpolate per-turn context — persona, valid
  intents/sentiments enum, retrieved KB article, macros library — into the
  instruction at call time.
- **Structured output contracts:** agents respond with JSON
  (e.g. `{"reply": "...", "tone": "empathetic", "clarity": 1-5}`) parsed with
  `tryJson` / regex, with hard-coded fallback values so the app degrades instead
  of crashing when the LLM misbehaves.
- **Example — Customer Simulator:** instructions force short realistic messages
  (≤140 chars), a sentiment state machine, and aggressive Hinglish mixing for
  Tier-2/Tier-3 Indian customers ("mera account chal nahi raha hai").
- **Example — Coaching Suggestion:** injected with the KB article + sentiment
  analysis, must return reply, tone, clarity, key point.

---

## 8. RAG — Retrieval-Augmented Generation

1. **Ingestion:** `ingest_directory()` supports `.txt`, `.pdf` (PyPDF2), `.docx`,
   `.json`, `.md`, `.csv`, `.html`. Chunking: paragraph split → ≤512-char chunks,
   oversized chunks re-split by sentence. 19+ FAQ JSON files ship in
   `data/knowledge_base/` (payment, refund, delivery, GST, UPI, API/webhook cases).
2. **Search (hybrid):**
   - Primary: semantic — `embed_text(query)` via OpenRouter, cosine similarity.
   - Fallback: pure-Python keyword/word-overlap (works offline, always available).
   - Node backend: BM25 keyword fallback, embeddings cached as JSONB in Postgres.
3. **KB-gap detection:** relevance < 0.45 → "⚠️ Knowledge Base Gap Detected" →
   feeds `knowledge_gaps` in reports → triggers Auto-KB agent to draft a new FAQ.

---

## 9. How to Run & Demo

```bash
# A) Streamlit demo UI (Python)
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
python run.py                          # http://localhost:8501

# B) Node backend (current API for the React frontend)
cd backend && npm install && npm run dev   # http://localhost:8000

# C) React frontend
cd frontend && npm install && npm run dev  # http://localhost:5173

# Tests
python -m pytest tests/
cd frontend && npm test
cd backend && npm test
```

**Env keys (all optional except an LLM key — everything degrades gracefully):**
`GROQ_API_KEY`, `OPENROUTER_API_KEY` (+ `OPENROUTER_EMBED_MODEL`,
`OPENROUTER_TTS_MODEL`), `AZURE_OPENAI_ENDPOINT/KEY/DEPLOYMENT`,
`DATABASE_URL`, `COMPOSIO_API_KEY` + `COMPOSIO_USER_ID/JIRA_PROJECT_KEY/
REFUND_EMAIL/SLACK_CHANNEL`.

### Demo script (5 minutes)

1. Open the React app → **Guest Demo** login.
2. **Setup** → pick a scenario (e.g. "Order Not Received") → Launch.
3. Dashboard shows the live chat + Coach Copilot rail: Signals → KB → Reply → Risk.
4. Click **Autopilot** to let the AI reply + advance the customer.
5. Open **Feature Lab**: run Multiverse Simulator, Tone Rewriter, Compliance
   Check, Jira Ticket Generator, Survival Game.
6. End the session → **Reports** page shows the performance report; optionally
   email it.

---

## 10. Q&A Prep — Likely Questions & Answers

**Q1. What problem does this solve?**
Coaching and QA in support teams happen after the call. CoachAI moves coaching
into the moment — every message is analyzed in <1s so the agent knows sentiment,
the right KB article, the best reply, and risk level before sending.

**Q2. Why a multi-agent system? Why not one big prompt?**
One agent = one responsibility (classify, coach, monitor, audit). This makes
prompts small and testable, lets agents run in parallel, allows adaptive
behaviour (calibrator learns per agent), and gives clear fault isolation — if
fraud detection fails, coaching still works.

**Q3. How is the RAG implemented?**
Hybrid retrieval: semantic embeddings (OpenRouter, cosine similarity) as
primary, keyword/BM25 overlap as offline fallback. KB-gap detection below
0.45 relevance triggers Auto-KB drafting. No heavy vector DB is required at
FAQ scale; pgvector/JSONB is the planned scale-up.

**Q4. What happens if the LLM fails or no API key is set?**
Every agent has a hard-coded heuristic fallback. The LLM chain itself falls
back Azure → OpenRouter → Groq. The app never crashes — it degrades.

**Q5. How is state persisted across serverless instances?**
Full session state is stored as JSON in Postgres; a cold instance rehydrates
the session from the DB on the next request.

**Q6. What are the real integrations?**
Composio: Jira (create bug tickets), Gmail (refund confirmation emails),
Slack (channel alerts). If not configured, tool calls fail gracefully.

**Q7. What was the hardest part?**
Keeping two backends (Python + Node) in sync, and session rehydration across
cold serverless instances without losing conversations.

**Q8. How is this different from a chatbot?**
A chatbot replaces the agent. CoachAI empowers the agent — it is a copilot
that coaches, flags risks, and audits quality while the human stays in charge.

**Q9. How is quality measured?**
Per-session overall score = resolution × 0.5 + coaching × 0.3 + clarity/CSAT
× 0.2; QA audit agent runs 21 ISO-style checks; Hall of Fame archives ≥0.85
sessions, Hall of Shame ≤0.45.

**Q10. What's next?**
Vector DB at scale (pgvector), single canonical backend, multilingual + voice
coaching, team leaderboards and HR analytics.

---

## 11. Presentation Playbook (Team Roles)

- **PPT team (2):** finalize the 10 slides in `Doc/CoachAI_Presentation.pptx`;
  add screenshots of the Dashboard (Signals/KB/Reply/Risk rail), Feature Lab,
  and Reports page. Keep bullets short, fonts consistent (Calibri), 10 slides
  exactly.
- **Presenters (2):** Presenter 1 covers slides 1–4 (idea, problem, stack) and
  does the live demo (Section 9 script). Presenter 2 covers slides 5–9
  (features, conclusion, concepts) and closes. Rehearse the handover line.
- **Q&A handlers (2):** memorize Section 10. If unsure, use the "graceful
  degradation" story: *"let me verify in the repo — the code is at
  github.com/MasterJi27/coachai-infosys-final"*. Never invent numbers.

**Timing:** 10 min presentation + 5 min Q&A (adjust to the actual slot).

---

## 12. Glossary

| Term | Meaning |
|---|---|
| Agent | A single-responsibility AI module with its own system prompt |
| Orchestrator | The central controller that runs the per-turn pipeline |
| Turn | One customer message + the resulting analysis |
| TurnAnalysis | Merged output of all agents for one turn |
| RAG | Retrieval-Augmented Generation — retrieve docs, then generate answers |
| KB | Knowledge base — FAQ/policy documents the RAG layer searches |
| CSAT | Customer satisfaction score (1–5) |
| Churn | Customer leaving/switching to a competitor |
| Escalation | Conversation reaching a risk level needing manager intervention |
| Hall of Fame/Shame | Archive of best/worst-scoring sessions |
| Composio | Integration platform (Jira, Gmail, Slack) used for real tool actions |
| Rehydration | Restoring a full session from Postgres on a cold serverless instance |
