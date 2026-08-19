# CoachAI — Development of AI-Powered Customer Support Assistant with Live Response Guidance

> **A multi-agent AI coaching cockpit** for customer-support agents. It sits next
> to the agent during a live chat and, after every customer message, tells the
> agent what the customer is feeling, which knowledge-base article applies, how
> to phrase the reply, and whether the conversation is at risk of escalating —
> before the agent hits send.

| | |
|---|---|
| **Project type** | Multi-agent AI system + full-stack web app |
| **Stack** | React 18 · Node.js Express · Python FastAPI · Streamlit · PostgreSQL · Azure OpenAI / OpenRouter / Groq |
| **Deployed** | Vercel (frontend + backends) · Streamlit Cloud · Neon/Supabase/Azure Postgres |
| **License** | [MIT](LICENSE) © 2026 MasterJi27 |
| **Deliverables** | 10-slide PPT · KT guide · HTML docs · deep dive — see [Section 17](#17-documentation--knowledge-transfer-deliverables) |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Key Features](#2-key-features)
3. [The Problem & Solution](#3-the-problem--solution)
4. [System Architecture](#4-system-architecture)
5. [The Multi-Agent System (25+ Agents)](#5-the-multi-agent-system-25-agents)
6. [Per-Turn Flow](#6-per-turn-flow)
7. [RAG — Retrieval-Augmented Generation](#7-rag--retrieval-augmented-generation)
8. [System Prompts](#8-system-prompts)
9. [Technology Stack](#9-technology-stack)
10. [Repository Structure](#10-repository-structure)
11. [Quick Start](#11-quick-start)
12. [Environment Variables](#12-environment-variables)
13. [API Endpoints](#13-api-endpoints)
14. [Integrations — Jira / Gmail / Slack (Composio)](#14-integrations--jira--gmail--slack-composio)
15. [Deployment](#15-deployment)
16. [Testing](#16-testing)
17. [Documentation & Knowledge-Transfer Deliverables](#17-documentation--knowledge-transfer-deliverables)
18. [Known Gotchas & Design Trade-offs](#18-known-gotchas--design-trade-offs)
19. [License](#19-license)

---

## 1. Overview

CoachAI is an **AI coaching cockpit for customer-support agents**. During a live
(or simulated) chat it analyzes every customer message and delivers, per turn:

- **Sentiment & intent** — what the customer feels and wants (frustration %, satisfaction trend)
- **Knowledge recommendation** — the right KB article + one distilled coaching tip (RAG)
- **Reply guidance** — a suggested reply with tone, clarity, and compliance feedback
- **Risk signals** — escalation %, predicted CSAT, churn %, viral/PR threat, fraud protocol
- **Deep signals** — "mind-reader" (true intent), multiverse simulation ("what-if" replies), patience clock, cognitive load
- **Manager override** — supervisor whisper or one-click takeover on extreme risk
- **Auto-Pilot** — one-click autonomous reply + backend action (refund / voucher)
- **Post-session report** — resolution score, sentiment journey, coaching tips, knowledge gaps — emailed automatically

It is a **demonstrator / training product** with Zomato-flavored demo data (orders,
riders, refunds in ₹, Hinglish-speaking AI customers), but the engine is
**product-agnostic** — swap the KB and scenarios and it coaches any support team.

---

## 2. Key Features

### Feature 1 — Live Coaching Console (multi-agent pipeline)
- Per-turn analysis in **< 0.5s** (intent, sentiment, frustration, trend)
- Coaching rail with 4 tabs: **Signals → KB Article → Reply → Risk**
- Predicted CSAT (1–5), churn %, viral/PR threat, fraud protocol, retention counter-offer
- Mind-reader (customer's true intent + internal monologue)
- Multiverse simulator — 3 "what-if" replies with predicted outcomes
- Manager whisper / takeover, compliance monitor, tone rewriter

### Feature 2 — Intelligent Knowledge Base (RAG)
- Multi-format ingestion: `.txt` `.pdf` `.docx` `.json` `.md` `.csv` `.html`
- **Hybrid retrieval**: semantic embeddings (cosine) + BM25/keyword offline fallback
- Agentic RAG synthesis — one distilled tip per message
- **Auto KB-gap detection** → auto-drafted FAQ (pending human review)
- KB admin tabs: search debugger, index new document, chunking simulator
- 19+ demo FAQs (payment, refund, delivery, GST, UPI, API/webhook cases)

### Feature 3 — Agentic Tools & Training Modes
- **Auto-Pilot**: one-click autonomous reply + real action (refund, voucher)
- **Composio integrations**: real Jira bug tickets, Gmail refund emails, Slack alerts
- **Jira bug generator**: transcript → structured ticket (summary, priority, type)
- **Survival Mode**: arcade multi-ticket training — score, streaks, power-ups
- 3 interaction modes: **AI Simulator** (Hinglish customer), **Manual**, **Transcript Replay**
- **Hall of Fame / Shame**: best (≥0.85) and worst (≤0.45) sessions archived
- **Cross-session analytics**: trends, top escalation triggers, knowledge gaps

---

## 3. The Problem & Solution

### Problem
| Pain point | Detail |
|---|---|
| Coaching happens too late | QA samples calls *after* they finish; feedback arrives days later |
| Escalations detected late | Managers join only after the customer is already angry |
| Knowledge is scattered | Agents manually search docs and FAQs mid-chat |
| Inconsistent quality | Reply quality depends on the individual agent's experience |
| No structured training | New agents learn by shadowing; no safe, repeatable practice |
| No risk foresight | CSAT, churn, fraud and viral/PR threats discovered after the fact |

### Solution
- **Coach in the moment, not after the call** — real-time per-message analysis
- **Reply guidance** with tone/clarity/compliance scoring before sending
- **Knowledge on tap** via RAG, with automatic KB-gap closure
- **Predictive risk signals** and manager overrides
- **Gamified training** and post-session reports for continuous improvement

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
              │ (pg, JSONB) │   │ Azure → OR │   │ BM25 +        │
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
   React frontend. **This is what the demo runs on.**

---

## 5. The Multi-Agent System (25+ Agents)

Every agent has **one responsibility**. LLM-based agents parse JSON via
`tryJson`/regex with **hard-coded fallbacks** — the app never crashes on LLM
errors, it degrades gracefully.

| Agent | LLM? | Returns | Notes |
|---|---|---|---|
| `customer_simulator` | ✅ | `Message` | Simulated customer; sentiment state machine; ≤140 chars; Hinglish mode |
| `intent_sentiment` | ✅ | `IntentAnalysis` | Primary turn classifier; valid intents/sentiments injected into prompt |
| `deep_analysis` | ✅ | dict | **One-call consolidation**: predicted CSAT, churn %, viral/PR + PR statement, fraud + protocol, defection + counter-offer, mind-read monologue, escalation trigger |
| `knowledge_recommendation` | ✅ | `list[KnowledgeItem]` | Agentic RAG; KB-gap detection (< 0.45 relevance) |
| `coaching_suggestion` | ✅ | `CoachingFeedback` | Suggested reply + tone/clarity scores; macros library injected; retention-code nudges |
| `escalation_monitor` | ❌ | `EscalationAssessment` | Weighted rule: frustration×0.4 + sentiment +0.2 + trend +0.15 + keywords +0.1 + length +0.1 + repetition +0.05 |
| `post_interaction_summary` | ❌ | `PerformanceReport` | `overall = resolution×0.5 + coaching×0.3 + clarity/CSAT×0.2`; triggers Auto-KB on resolved-but-gapped sessions |
| `coach_calibrator` | ❌ | `(bool, confidence)` | Per-agent adaptive coaching visibility (threshold adapts 0.5–0.8 over last 200 turns) |
| `predictive_csat` | ✅ | `PredictiveCSATResult` | 1–5 CSAT + churn %, deltas vs previous turn |
| `manager_supervisor` | ✅ | `ManagerIntervention` | No-op unless frustration/escalation ≥ 0.5; scripted takeover statement |
| `compliance_monitor` | ✅ | `ComplianceViolation` | Checks agent reply against KB policy |
| `tone_rewriter` | ✅ | `str` | Polishes draft; < 10 chars → canned apology (rate-limit guard) |
| `auto_kb_agent` | ✅ | file path | Writes drafted FAQ to `data/knowledge_base/pending/faq_auto_gen_*.json` |
| `auto_pilot_agent` | ✅ | `AutoPilotResult` | One-click auto-reply + mock tool action (+ real Composio email/Slack if configured) |
| `competitor_defection_agent` | ✅ | `CompetitorDefectionResult` | Keyword pre-scan (swiggy/zepto/…) seeds defaults |
| `customer_mind_reader` | ✅ | `CustomerMindReadResult` | "What the customer thinks but doesn't type" |
| `multiverse_simulator` | ✅ | `MultiverseBranch` | Two/three parallel futures (empathetic vs rigid) with predicted CSAT |
| `viral_threat_predictor` | ✅ | `ViralPRThreatResult` | Keyword pre-scan (twitter/x/consumer court) |
| `fraud_detector` | ✅ | `FraudDetectionResult` | Refund-abuse / scam patterns |
| `jira_bug_generator` | ✅ | `JiraBugTicket` | Transcript → structured bug ticket; real Jira via Composio when configured |
| `scenario_generator` | ✅ | `GeneratedScenario` | On-demand training scenarios (product context + difficulty) |
| `qa_audit_agent` | ❌ | `QAComplianceAudit` | ISO-9001-style pass/fail on `overall_score ≥ 0.75` (21 checks) |
| `cognitive_load_agent` | ❌ | `AgentCognitiveLoad` | Rule buckets on frustration + word count |
| `patience_clock_agent` | ❌ | `CustomerPatienceResult` | "Turns until drop-off" estimate |
| `bot_agent` | ❌ | `str` + bool | Scripted Zomato-bot menu replies; escalates on "agent"/"human", frustration ≥ 0.7 |

---

## 6. Per-Turn Flow

1. Customer message arrives (typed, simulated, or replayed).
2. `Orchestrator` hands it to `ConversationManager`.
3. `IntentSentimentAgent` → LLM call → intent, sentiment, frustration, trend.
4. `KnowledgeRecommendationAgent` → hybrid KB search (retrieval) → LLM tip
   (generation). This retrieval-then-generation pair **is the RAG step**.
5. `CoachingSuggestionAgent` → suggested reply + tone/clarity feedback.
6. `EscalationMonitorAgent` → rule-based risk score + strategy.
7. `DeepAnalysisAgent` (parallel) → predicted CSAT, churn %, viral/PR, fraud
   protocol, mind-reader monologue.
8. All results merge into one `TurnAnalysis`, rendered in the coaching console.
9. At session end, `PostInteractionSummaryAgent` builds the performance report.

---

## 7. RAG — Retrieval-Augmented Generation

### Ingestion
- `ingest_directory()` → per-file `ingest_file()` supports `.txt`, `.pdf`
  (PyPDF2), `.docx`, `.json`, `.md`, `.csv`, `.html`.
- Chunking: paragraph split → merge into ≤512-char chunks; oversized chunks
  re-split by sentence.

### Search (hybrid)
1. **Semantic (primary):** `embed_text(query)` via OpenRouter
   (`nvidia/nemotron-3-embed-1b:free`, 2048-dim), lazy document embedding,
   cosine similarity.
2. **Keyword (fallback):** pure-Python word-overlap / BM25 — always works
   offline. Node backend caches embeddings as JSONB in Postgres.

### KB-gap detection
- Relevance < 0.45 → "⚠️ Knowledge Base Gap Detected" → feeds
  `knowledge_gaps` in reports → triggers **Auto-KB agent** to draft a new FAQ.

---

## 8. System Prompts

Every agent that calls the LLM imports its system prompt from
[`src/core/prompts.py`](src/core/prompts.py) — **15+ prompt constants + 4 builder
functions** — instead of hard-coding it. The Node mirror lives in
`backend/src/agents.js`. That file pair is the single place to read or edit any
agent's instructions.

- **Builder functions** interpolate per-turn context (persona, valid intents
  enum, retrieved KB article, macros library) into the instruction at call time.
- **Structured output contracts** — agents respond with JSON
  (e.g. `{"reply": "...", "tone": "empathetic", "clarity": 1-5}`).
- **Graceful degradation** — every parse failure falls back to heuristics.

---

## 9. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS, react-router 6, framer-motion, lucide icons, @tanstack/react-query, jsPDF |
| Backend (current) | Node.js ≥ 18 + Express (ESM) + `pg` — port 8000 |
| Backend (research) | Python FastAPI (`src/api/server.py`) + Streamlit (`src/ui/app.py`) |
| LLM chain | **Azure OpenAI** (primary) → **OpenRouter** free models → **Groq** (`llama-3.3-70b-versatile` → `llama-3.1-8b-instant` → `gemma2-9b-it` → `llama3-8b-8192`) |
| Embeddings | OpenRouter `nvidia/nemotron-3-embed-1b:free` (2048-dim) |
| TTS | OpenRouter `fish-audio/s2.1-pro-free:free` with gTTS fallback |
| RAG | Hybrid semantic + BM25/keyword; JSONB embedding cache |
| Database | PostgreSQL (`pg`/SQLAlchemy, JSONB session state) with SQLite fallback |
| Data models | Pydantic (Python) |
| Integrations | Composio v3 SDK — Jira, Gmail, Slack |
| Deployment | Vercel (frontend + backends), Streamlit Cloud, Neon/Supabase/Azure Postgres |
| Testing | pytest · vitest · node --test |

---

## 10. Repository Structure

```
customer-support-coach/
├── run.py / streamlit_app.py     # Streamlit launchers
├── requirements.txt              # Python dependencies
├── .env.example                  # env key template
├── LICENSE                       # MIT license
├── README.md                     # this file
│
├── frontend/                     # React UI (the real product UI)
│   ├── src/pages/                # Dashboard, Setup, Reports, Analytics, Knowledge, HallOfFame, JiraBoard, Email, Settings, Landing, Login, Register
│   ├── src/components/           # FeatureLab, AuthContext, ThemeContext, ToastContext, ErrorBoundary, ...
│   ├── src/lib/api.js            # single fetch wrapper (bearer token)
│   └── src/test/                 # vitest tests
│
├── backend/                      # Node Express API (auth + chat + agents mirror)
│   └── src/                      # app.js, agents.js, llm.js, rag.js, auth.js, coaching.js,
│                                 # db.js, integrations.js, paths.js, reports.js, scenarios.js,
│                                 # segmentation.js, sessionStore.js
│
├── src/                          # Python implementation (research / richest feature set)
│   ├── core/                     # orchestrator.py, conversation flow, llm.py, prompts.py ★,
│   │                             # models.py, database.py, config.py
│   ├── modules/                  # conversation_manager.py, session_config.py, performance_analytics.py,
│   │                             # hall_of_fame.py, survival_game.py
│   ├── agents/                   # 25+ agents, one class per responsibility
│   ├── rag/                      # knowledge_base.py (hybrid retrieval), ingest.py
│   ├── tools/                    # mock_backend.py, composio_backend.py
│   ├── ui/                       # Streamlit app, panels, zomato widgets, avatars
│   └── api/                      # FastAPI server.py + features.py
│
├── vercel-backend/               # byte-for-byte copy of src/ for the Vercel Python API (legacy)
│
├── data/
│   ├── knowledge_base/           # 19+ FAQ JSON docs ingested by RAG
│   ├── scenarios.json            # simulator scenario library
│   ├── transcripts/              # replay-mode transcripts
│   ├── reports/                  # generated reports (legacy; DB is authoritative)
│   ├── macros_actions_library.json  # canned macros/actions for coaching prompts
│   └── coach.db                  # local SQLite (dev)
│
├── Doc/                          # ★ knowledge-transfer deliverables
│   ├── CoachAI_Presentation.pptx         # 10-slide final presentation
│   ├── CoachAI_Knowledge_Transfer.md      # complete KT guide + Q&A prep + playbook
│   ├── CoachAI_Project_Documentation.html # browser-viewable documentation
│   ├── CoachAI_Deep_Dive.md              # deep architecture dive
│   └── CoachAI_Meeting_CheatSheet.pdf    # quick cheat sheet
│
└── tests/                        # pytest suite (agents, RAG, load)
```

---

## 11. Quick Start

### A) Streamlit demo UI (Python)

```bash
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
python run.py                   # or: streamlit run src/ui/app.py  → http://localhost:8501
```

### B) Node backend (current API — powers the React frontend)

```bash
cd backend
npm install
npm run dev                     # http://localhost:8000
```

### C) React frontend

```bash
cd frontend
npm install
npm run dev                     # http://localhost:5173
```

### D) One-click Windows launcher

```bat
start.bat                       # activates venv, checks .env, starts Streamlit
```

---

## 12. Environment Variables

Copy `.env.example` → `.env`. All keys are **optional except an LLM key** —
everything degrades gracefully to heuristic fallbacks instead of crashing.

| Variable | Purpose |
|---|---|
| `GROQ_API_KEY` | LLM fallback chain (llama-3.3-70b-versatile → llama-3.1-8b-instant → gemma2-9b-it → llama3-8b-8192) |
| `GEMINI_API_KEY` | Optional extra provider |
| `OPENROUTER_API_KEY` | Free semantic embeddings + neural TTS |
| `OPENROUTER_EMBED_MODEL` | Default `nvidia/nemotron-3-embed-1b:free` |
| `OPENROUTER_TTS_MODEL` | Default `fish-audio/s2.1-pro-free:free` |
| `AZURE_OPENAI_ENDPOINT` / `AZURE_OPENAI_KEY` / `AZURE_OPENAI_DEPLOYMENT` | Primary LLM when set |
| `DATABASE_URL` | Postgres connection string; SQLite used when absent |
| `COMPOSIO_API_KEY` | Real integrations (Jira / Gmail / Slack) |
| `COMPOSIO_USER_ID` | Composio user scope (default `default`) |
| `COMPOSIO_JIRA_PROJECT_KEY` | Jira project for created tickets (e.g. `COACH`) |
| `COMPOSIO_REFUND_EMAIL` | Refund-confirmation recipient |
| `COMPOSIO_SLACK_CHANNEL` | Channel for Slack alerts |
| `PORT` | Node backend port (default 8000) |
| `VITE_API_URL` | React frontend API base URL (prod: `https://coachai-backend-swart.vercel.app`) |

---

## 13. API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account (name, email, password ≥ 6 chars) |
| POST | `/api/auth/login` | Login → user + token |
| POST | `/api/auth/guest` | Instant guest demo account |
| POST | `/api/auth/logout` | Invalidate token |
| GET | `/api/auth/me` | Current user |

### Sessions & chat
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/session/start` | Start session (mode, agent_name, product_context, scenario) |
| POST | `/api/chat/message` | Send agent reply → advances customer + returns coach turn |
| POST | `/api/chat/autopilot` | Autonomous reply + customer advance (2 turns) |
| POST | `/api/chat/manager-takeover` | Manager message + takeover flow |
| POST | `/api/chat/end` | End session → build + save report (optional email) |

### Analysis agents
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/analysis/viral` | Viral/PR threat detection |
| POST | `/api/analysis/fraud` | Fraud detection |
| POST | `/api/analysis/defection` | Competitor-defection detection |
| POST | `/api/analysis/mind-reader` | Customer true intent + monologue |
| POST | `/api/analysis/multiverse` | "What-if" reply branching |
| POST | `/api/analysis/cognitive-load` | Agent mental workload |
| POST | `/api/analysis/patience` | Turns-until-dropoff estimate |
| POST | `/api/analysis/compliance` | Reply-vs-KB policy check |
| POST | `/api/analysis/tone` | Draft polish (tone rewriter) |
| POST | `/api/analysis/scenario` | On-demand training scenario |
| POST | `/api/analysis/qa-audit` | 21-check ISO-style audit |
| POST | `/api/analysis/auto-kb` | Auto-draft FAQ from KB gaps |
| POST | `/api/jira/ticket` | Transcript → Jira bug ticket |
| POST | `/api/bot/reply` | Scripted first-line bot reply |

### Data & misc
| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health + engine/RAG/db status |
| GET | `/api/analytics` | Live sessions, avg score, leaderboard |
| GET | `/api/reports` | All session reports |
| GET | `/api/knowledge` | KB documents list |
| GET | `/api/hall-of-fame` | Best/worst session archive |
| GET | `/api/activity` | Activity feed |
| POST | `/api/survival/start` | Start Survival Mode |
| POST | `/api/survival/turn` | Grade a survival reply |
| POST | `/api/manager/whisper` | Manager whisper text |
| GET | `/api/integrations/status` | Composio config status |
| POST | `/api/gmail/send` | Send email via Composio |
| GET | `/api/cache/reset` | Reset embedding cache |

---

## 14. Integrations — Jira / Gmail / Slack (Composio)

| Agent / action | Mock tool (default) | Real action when connected |
|---|---|---|
| Jira Bug Generator | none — ticket text only | `JIRA_CREATE_ISSUE` — actual Jira ticket in `COMPOSIO_JIRA_PROJECT_KEY` |
| Auto-Pilot | `process_refund` | Gmail refund-confirmation email draft (`GMAIL_CREATE_EMAIL_DRAFT`) |
| Auto-Pilot | `grant_voucher` | Gmail voucher email + Slack post to `COMPOSIO_SLACK_CHANNEL` |

Setup:

1. Add `COMPOSIO_API_KEY` + related vars to `.env` (never commit keys).
2. `pip install -r requirements.txt` (adds `composio>=0.18.1`).
3. Connect accounts (each app has a connect URL — generate it and open in a browser):

```bash
python -c "from src.tools.composio_backend import composio_backend; print(composio_backend.get_connect_url('jira'))"
python -c "from src.tools.composio_backend import composio_backend; print(composio_backend.get_connect_url('gmail'))"
python -c "from src.tools.composio_backend import composio_backend; print(composio_backend.get_connect_url('slack'))"
```

4. Verify: `python -c "from src.tools.composio_backend import composio_backend; print(composio_backend.list_connected_accounts())"`

> Behavior: if the key is missing or the account is not connected, calls return a
> failed `ToolCallResult` with a helpful message — the app keeps working.

---

## 15. Deployment

| Piece | Where |
|---|---|
| React frontend | Vercel — `coachai-frontend.vercel.app` |
| Node backend | Vercel — project `coachai-backend` |
| Python backend (legacy) | Same Vercel project `coachai-backend` (verify which directory is live) |
| Streamlit app | Streamlit Cloud / localhost:8501 |
| Database | Neon / Supabase / Azure Postgres (`DATABASE_URL`) |

> ⚠️ Two backends share the Vercel project `coachai-backend`; the React frontend
> needs the **Node** one (it implements `/api/auth/*`). On Vercel the filesystem
> is ephemeral — always read reports/hall-of-fame from the DB, never from disk.

---

## 16. Testing

```bash
python -m pytest tests/           # Python suite (14 tests + 1 load script)
cd frontend && npm test           # vitest (7 tests)
cd backend && npm test            # node --test
```

---

## 17. Documentation & Knowledge-Transfer Deliverables

| Deliverable | File |
|---|---|
| Final presentation (exactly 10 slides) | [`Doc/CoachAI_Presentation.pptx`](Doc/CoachAI_Presentation.pptx) |
| Knowledge-transfer guide + Q&A prep + playbook | [`Doc/CoachAI_Knowledge_Transfer.md`](Doc/CoachAI_Knowledge_Transfer.md) |
| Browser-viewable documentation | [`Doc/CoachAI_Project_Documentation.html`](Doc/CoachAI_Project_Documentation.html) |
| Deep architecture dive | [`Doc/CoachAI_Deep_Dive.md`](Doc/CoachAI_Deep_Dive.md) |
| Meeting cheat sheet (PDF) | [`Doc/CoachAI_Meeting_CheatSheet.pdf`](Doc/CoachAI_Meeting_CheatSheet.pdf) |
| Project explainer (PDF) | [`Doc/CoachAI_Project_Explainer.pdf`](Doc/CoachAI_Project_Explainer.pdf) |
| File structure reference (PDF) | [`Doc/CoachAI_File_Structure.pdf`](Doc/CoachAI_File_Structure.pdf) |

---

## 18. Known Gotchas & Design Trade-offs

1. **Two backends, one Vercel project** — `backend/` (Node) and `vercel-backend/`
   (Python) both deploy to `coachai-backend`. The frontend needs the Node one (auth).
2. **`vercel-backend/src/` is a byte-for-byte copy of root `src/`** — changes to
   Python code must be manually mirrored (53 files).
3. **Auth gap in Python API** — `/api/auth/*` exists only in the Node backend.
4. **Ephemeral filesystem on Vercel** — never read reports/hall-of-fame from
   serverless handlers; use the DB endpoints.
5. **Every LLM agent silently degrades** to heuristic fallbacks — check logs,
   not just the UI.
6. **Hard-coded demo data** — `ORD-8142K`, ₹250, Biryani Blues, "Ramesh Kumar"
   rider, default `COMPOSIO_REFUND_EMAIL`. Intentional for demo.
7. **Survival game is a global singleton** in the API process — not
   session-scoped; concurrent users share state.
8. **RAG retrieval is hybrid, not pure vector** — no pgvector required at
   FAQ-scale; embedding persistence (pgvector/JSONB) is the planned scale-up.
9. **`.env` files must never be committed** — keys come from env/secrets;
   `.env.example` is the whitelisted template.

---

## 19. License

[MIT](LICENSE) © 2026 MasterJi27