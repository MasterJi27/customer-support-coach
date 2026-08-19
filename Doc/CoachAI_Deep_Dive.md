# CoachAI — Project Deep Dive (Knowledge Transfer)

**Last updated:** 2026-08-17
**Source of truth:** this document + code. The root `README.md` describes the original
architecture accurately but is **partially stale** — it predates the semantic RAG upgrade,
the Azure-first LLM chain, the Postgres persistence layer, and the Node.js backend.
Where README and code disagree, **trust the code**.

---

## 1. What the project is

CoachAI is an AI **coaching cockpit for customer-support agents**. During a live (or
simulated) chat it analyzes every customer message and tells the agent:

- what the customer is feeling (intent + sentiment + frustration)
- which knowledge-base (KB) article applies (RAG)
- how to phrase the reply (coaching + tone feedback)
- whether the conversation is at risk of escalating (escalation monitor)
- deep risk signals: predicted CSAT, churn, fraud, viral/PR threat, competitor defection,
  "mind-reader" internal monologue
- when a manager should whisper/take over

After the session it produces a performance report (sentiment journey, resolution
quality, coaching tips, knowledge gaps) and feeds analytics.

It is a **demonstrator / training product** with Zomato-flavored demo data (orders,
riders, Biryani Blues, refunds in ₹), but the engine is product-agnostic.

---

## 2. Deployment topology (what runs where)

| Piece | Tech | Where it lives | Deployed to |
|---|---|---|---|
| **React frontend** | Vite + React 18 + Tailwind | `frontend/` | Vercel project `frontend` (`coachai-frontend.vercel.app`) |
| **Python backend (legacy)** | FastAPI (`src/api/server.py`) | `vercel-backend/src/` (copy of root `src/`) | Vercel project `coachai-backend` (`coachai-backend-swart.vercel.app`) |
| **Node backend (current)** | Express + ESM (`backend/`) | `backend/` | **Same** Vercel project `coachai-backend` |
| **Streamlit app** | Streamlit | root `src/ui/app.py` | Streamlit Cloud (`streamlit_app.py` entry) or localhost:8501 |
| **Database** | Postgres (`DATABASE_URL`) w/ SQLite fallback | — | Neon/Supabase/Azure Postgres |

> **Critical:** `backend/` (Node) and `vercel-backend/` (Python) are **both** linked to
> the same Vercel project `coachai-backend`. The Node backend is the newest addition
> (commit `9431569`) and is the one the frontend actually needs — it implements the
> `/api/auth/*` endpoints the frontend calls, which **do not exist in the Python API**.
> Verify at KT time which one is currently deployed from which directory (see §9 Gotchas).

Git history shows the evolution: Streamlit-only → Python FastAPI → Python on Vercel with
Postgres → React frontend → **Node Express backend replacing the Python API for the frontend**.

---

## 3. High-level architecture

```
                        ┌─────────────────────────────────────────────┐
                        │            React frontend (Vite)             │
                        │   frontend/src (Dashboard, Analytics, ...)   │
                        └───────────────┬─────────────────────────────┘
                                        │  fetch → /api/*  (BASE_URL)
                    ┌───────────────────▼────────────────────┐
                    │   Node Express backend  (backend/)      │  ← current API
                    │   src/app.js + agents.js + llm.js + ... │
                    └───┬──────────────┬───────────────┬──────┘
                        │              │               │
              ┌─────────▼───┐   ┌──────▼─────┐   ┌─────▼─────────┐
              │ Postgres    │   │ LLM chain  │   │ RAG (BM25 +  │
              │ (pg, JSONB) │   │ Azure → OR  │   │ embeddings)  │
              └─────────────┘   │ → Groq      │   └──────────────┘
                                └──────┬──────┘
        ┌──────────────────────────────┘
        ▼
   Python FastAPI backend (vercel-backend/src) — legacy but still full-featured:
   Orchestrator → ConversationManager → 25 agents → SQLite/Postgres (sqlalchemy)
   │
   ▼
   Streamlit app (src/ui/app.py) — standalone demo UI, runs the same Python agents
```

Two parallel implementations exist for the same product concept:

1. **Python** (`src/`) — the "research" implementation, richest feature set (25 agents),
   used by Streamlit and the legacy FastAPI.
2. **Node** (`backend/src/`) — the "production-facing" implementation, mirrors the same
   endpoints/agents in JavaScript, adds auth, talks directly to the frontend.

---

## 4. Python backend deep dive

### 4.1 Session lifecycle (`src/core/orchestrator.py`)

`Orchestrator` is the central brain. One global instance per process (created at import
in `server.py`).

- `start_session(mode, agent_name, product_context, scenario, transcript_path, risk_threshold)`
  → builds `SessionState` via `SessionConfigModule`; in **SIMULATOR** mode it immediately
  generates + processes the customer's first message with `fast=True` (intent + deep
  signals only; coaching/escalation are deferred until the first agent reply).
- `process_customer_input(text)` → runs the per-turn pipeline, persists session.
- `process_agent_input(text)` → records the agent's reply, regenerates coaching feedback
  against the actual reply, records coaching effect into the calibrator.
- `advance_simulator()` → simulator replies to the agent's last message → next turn.
- `end_session()` → `PostInteractionSummaryAgent.generate_report()` → saves report to DB
  + `PerformanceAnalytics`; Hall-of-Fame archiving is done elsewhere (UI/API layer).
- `bind_session(session_id)` / `get_session()` → resolves sessions across serverless
  instances: in-process `_sessions` cache first, then **rehydrates the full
  `SessionState` from Postgres `full_state` column** (this fixes "conversation lost on
  cold instance" — see `database.save_session`).

**Interaction modes** (`InteractionMode` enum): `simulator` (AI customer), `manual`
(human types both sides), `replay` (transcript from `data/transcripts/`).

### 4.2 Per-turn pipeline (`src/modules/conversation_manager.py`)

On each customer message, `process_customer_message()`:

1. Appends message, increments `current_turn`, builds rolling context (last 5 messages).
2. **In parallel** (ThreadPoolExecutor, 2 workers):
   - `IntentSentimentAgent.analyze()` → `IntentAnalysis` (intent, sentiment, frustration 0–1, satisfaction trend −1..1)
   - `DeepAnalysisAgent.analyze()` → **one LLM call** producing the whole "deep signals"
     dict: predicted CSAT, churn %, viral/PR risk + pre-approved PR statement, fraud risk
     + category + protocol, defection risk + competitor + counter-offer, internal
     monologue, escalation trigger. Stored in `TurnAnalysis.deep_analysis`.
3. `KnowledgeRecommendationAgent.recommend()` → RAG retrieval + LLM synthesis (see §4.4).
4. Unless `fast=True`: `CoachingSuggestionAgent.analyze_response()` → `CoachingFeedback`
   (suggested reply, tips, tone/clarity scores, suggested actions/macros) and
   `EscalationMonitorAgent.assess()` → rule-based `EscalationAssessment`.
5. Everything merges into one `TurnAnalysis` appended to `session.turn_analyses`.

When the **agent** replies (`process_agent_response()`), coaching is **regenerated**
against the agent's actual draft (this is the feedback loop the UI shows).

Coaching visibility is gated by `CoachCalibrator` — a per-agent heuristic that learns
(from the last 200 turns, persisted in `coach_calibration.json`) whether this agent
actually follows tips; adapts the intervention threshold between 0.5–0.8.

### 4.3 Agent catalog (25 agents in `src/agents/`)

LLM-based agents all call `llm_chat()` from `src/core/llm.py` and parse JSON via
`re.search(r'\{.*\}', raw, re.DOTALL)` with **hard-coded fallbacks** on any failure —
the app never crashes on LLM errors, it degrades.

| Agent | LLM? | Returns | Notes |
|---|---|---|---|
| `customer_simulator` | ✅ (temp 0.8) | `Message` | Simulated customer; sentiment state machine; ≤140 chars; Hinglish mode; 6 fallback scenarios |
| `intent_sentiment` | ✅ (0.1) | `IntentAnalysis` | Primary turn classifier; enum values injected into prompt |
| `deep_analysis` | ✅ (0.2) | plain dict | **One-call consolidation** of CSAT/churn/viral/fraud/defection/mind-reader/escalation signals |
| `knowledge_recommendation` | ✅ | `list[KnowledgeItem]` | Agentic RAG; KB-gap detection (<0.45 relevance); "✨ Agentic RAG Synthesis" item |
| `coaching_suggestion` | ✅ (0.3) | `CoachingFeedback` | Blends LLM + local tone heuristics; macros library injected; deep-signal nudges (STAY15 retention code) |
| `escalation_monitor` | ❌ | `EscalationAssessment` | Weighted rule: frustration×0.4, sentiment +0.2, trend +0.15, keywords ×0.1, length +0.1, repetition +0.05 |
| `post_interaction_summary` | ❌ | `PerformanceReport` | `overall = resolution×0.5 + coaching×0.3 + 0.2`; triggers Auto-KB on resolved-but-gapped sessions |
| `coach_calibrator` | ❌ | `(bool, confidence)` | Per-agent adaptive coaching visibility |
| `predictive_csat` | ✅ (0.1) | `PredictiveCSATResult` | 1–5 CSAT + churn %, deltas vs previous turn |
| `manager_supervisor` | ✅ (0.1) | `ManagerIntervention` | Fast-path no-op unless frustration/escalation ≥0.5; scripted takeover statement |
| `compliance_monitor` | ✅ (0.0) | `ComplianceViolation` | Checks agent reply against KB policy |
| `tone_rewriter` | ✅ | `str` | Polishes draft; <10 chars → canned apology (rate-limit guard) |
| `auto_kb_agent` | ✅ (0.3) | file path | Writes drafted FAQ to `data/knowledge_base/pending/faq_auto_gen_*.json` |
| `auto_pilot_agent` | ✅ (0.2) | `AutoPilotResult` | One-click auto-reply + mock tool action (+ real Composio email/Slack if configured) |
| `competitor_defection_agent` | ✅ (0.1) | `CompetitorDefectionResult` | Keyword pre-scan (swiggy/zepto/…) seeds defaults |
| `customer_mind_reader` | ✅ (0.3) | `CustomerMindReadResult` | "What the customer thinks but doesn't type" |
| `multiverse_simulator` | ✅ (0.5) | `MultiverseBranch` | Two parallel futures (empathetic vs rigid) with predicted CSAT |
| `viral_threat_predictor` | ✅ (0.1) | `ViralPRThreatResult` | Keyword pre-scan (twitter/x/consumer court) |
| `fraud_detector` | ✅ (0.1) | `FraudDetectionResult` | Refund-abuse / scam patterns |
| `jira_bug_generator` | ✅ (0.2) | `JiraBugTicket` | Transcript → bug ticket; real Jira via Composio when configured |
| `scenario_generator` | ✅ (0.7) | `GeneratedScenario` | On-demand training scenarios |
| `qa_audit_agent` | ❌ | `QAComplianceAudit` | ISO-9001-style pass/fail on `overall_score ≥ 0.75` |
| `cognitive_load_agent` | ❌ | `AgentCognitiveLoad` | Rule buckets on frustration + word count |
| `patience_clock_agent` | ❌ | `CustomerPatienceResult` | "Turns until drop-off" estimate |
| `bot_agent` | ❌ | `str` + bool | Scripted Zomato-bot menu replies; escalates on "agent"/"human", frustration ≥0.7, or angry |

**Every LLM prompt lives in `src/core/prompts.py`** (15 prompt constants + 4 builder
functions) — the single place to edit agent behavior. This file is the de-facto
"prompt config".

### 4.4 RAG (`src/rag/knowledge_base.py`)

- **Ingestion:** `ingest_directory()` → per-file `ingest_file()` supports `.txt`, `.pdf`
  (PyPDF2), `.docx`, `.json`, `.md`, `.csv`, `.html`. Chunking: paragraph split → merge
  into ≤512-char chunks (`chunk_size`), oversized chunks re-split by sentence.
- **In-memory store:** `documents[]` (id, text, token set, embedding, metadata).
- **Search (hybrid):**
  1. Try **semantic**: `embed_text(query)` via OpenRouter (`nvidia/nemotron-3-embed-1b:free`),
     lazily embeds documents, cosine similarity.
  2. **Fallback: pure-Python keyword/word-overlap** (Jaccard-ish overlap / max(query_tokens))
     — always works offline.
- **KB gap alert:** relevance < 0.45 → "⚠️ Knowledge Base Gap Detected" item
  (source `kb-gap-alert`) → feeds `knowledge_gaps` in reports → triggers Auto-KB.
- `knowledge_chunks` DB table exists but the in-memory store is the real one (no vector
  DB, no pgvector in Python backend).
- 19 FAQ JSON files in `data/knowledge_base/` (payment, refund, delivery cases, Infosys
  Pro, GST, UPI, API/webhook issues, etc.).

### 4.5 LLM provider strategy (`src/core/llm.py`)

`llm_chat(system, user, temp)` — **priority order:**

1. **Azure OpenAI** (Responses API, `gpt-5.4-mini`) — if `AZURE_OPENAI_ENDPOINT/KEY` set
   and `azure_openai_enabled`. Fast, no queue.
2. **Race OpenRouter free vs Groq free** in a 2-thread pool — first non-empty winner
   returns. OpenRouter tries a fallback chain of free models
   (`openrouter_chat_fallbacks`); Groq chain: `llama-3.3-70b-versatile` →
   `llama-3.1-8b-instant` → `gemma2-9b-it` → `llama3-8b-8192`.
3. Empty string → callers use their hard-coded heuristics/fallbacks.

Also: `embed_text(s)` (OpenRouter embeddings), `text_to_speech()` (OpenRouter
fish-audio neural TTS with **gTTS fallback**). Keys resolve from `settings` → env →
`st.secrets` (Streamlit Cloud).

### 4.6 Persistence (`src/core/database.py`)

- `DATABASE_URL` set → **Postgres** via SQLAlchemy (pool_pre_ping, small pool,
  `sslmode=require`); else **SQLite** at `runtime_data_dir/coach.db`.
- Tables: `sessions` (with `full_state` JSON for cross-instance rehydration), `reports`,
  `knowledge_chunks`, `agent_calibration`.
- `config.py` auto-detects a writable data dir; on serverless (Vercel) `data/` is
  read-only so it redirects to an ephemeral temp dir (`coachai-runtime`). **Hence
  reports/hall-of-fame must be read from the DB, never from `settings.reports_dir`**
  (a lesson already baked into `server.py`).

### 4.7 Tools layer (`src/tools/`)

- `mock_backend.py` — demo OMS/payment/loyalty: `lookup_order` (randomized demo data),
  `process_refund` (rejects >₹500 without supervisor), `grant_loyalty_voucher`. Returns
  `ToolCallResult`.
- `composio_backend.py` — real-world integration wrapper (Composio v3 SDK): Jira
  (`JIRA_CREATE_ISSUE`), Gmail (`GMAIL_CREATE_EMAIL_DRAFT` / send), Slack post.
  Graceful degradation: missing key/account → failed `ToolCallResult`, no crash.

### 4.8 Python API surface (`src/api/server.py` + `src/api/features.py`)

- `server.py`: `GET /health`, `/api/db/status`, `/api/analytics`, `/api/reports`,
  `/api/knowledge`, `/api/hall-of-fame`; `POST /api/session/start`, `/api/chat/message`,
  `/api/chat/autopilot`, `/api/chat/manager-takeover`. Big `_serialize_turn()` flattens a
  `TurnAnalysis` into the JSON shape the frontend consumes.
- `features.py` (router, ~20 routes): per-analysis endpoints (`/api/analysis/viral`,
  `fraud`, `defection`, `mind-reader`, `multiverse`, `patience`, `cognitive-load`,
  `compliance`, `tone`, `scenario`, `qa-audit`, `auto-kb`), `/api/bot/reply`,
  `/api/jira/ticket`, `/api/survival/start|turn`, `/api/manager/whisper`,
  `/api/integrations/status`, `/api/gmail/send`, `/api/chat/end` (with optional report
  email via Composio). Survival game is a module-level singleton, not session-scoped.

---

## 5. Node backend deep dive (`backend/`)

Express + ESM, Node ≥18, deps: `express`, `cors`, `dotenv`, `pg` only. Runs on port 8000.
This is the **frontend's real backend** and re-implements the product in JS:

- `src/app.js` — all routes incl. **auth** (`/api/auth/register|login|guest|logout|me` —
  the Python API has none of these), analytics, reports, knowledge, hall-of-fame,
  activity feed, sessions/chat, all `/api/analysis/*`, bot, jira, survival, whisper,
  integrations status, gmail send, cache reset. `analysisRoute()` helper + `logActivity`.
- `src/agents.js` — JS mirror of the Python agents (viral/fraud/defection/mind-reader/
  multiverse/cognitive-load/bot/tone/scenario/compliance…), calls `llm.js`.
- `src/llm.js` — same provider strategy: Azure (primary) → OpenRouter free → Groq.
- `src/rag.js` — RAG with OpenRouter embeddings; **BM25 keyword fallback**; stores
  embeddings as JSONB in Postgres, cosine computed in JS (pgvector not required).
- `src/db.js`, `src/sessionStore.js` — Postgres via `pg`; session rehydration across
  instances (same pattern as Python).
- `src/auth.js`, `src/coaching.js`, `src/integrations.js`, `src/reports.js`,
  `src/scenarios.js`, `src/segmentation.js`, `src/paths.js` — auth (JWT-ish token in
  localStorage), coaching, Composio integrations, reports, scenarios, segmentation.
- `index.js` — exports the app (Vercel entry).
- `.env` keys (names only): `AZURE_OPENAI_ENDPOINT/KEY/DEPLOYMENT`, `OPENROUTER_API_KEY`,
  `OPENROUTER_MODEL`, `GROQ_API_KEY`, `OPENROUTER_EMBED_MODEL`, `DATABASE_URL`,
  `COMPOSIO_API_KEY`, `COMPOSIO_USER_ID`, `COMPOSIO_JIRA_PROJECT_KEY`,
  `COMPOSIO_REFUND_EMAIL`, `COMPOSIO_SLACK_CHANNEL`, `PORT`.

> ⚠️ `backend/src/*.js` has **uncommitted changes + untracked files** (auth.js, coaching.js,
> integrations.js, paths.js, reports.js, scenarios.js) — the Node backend is mid-refactor.

---

## 6. Frontends

### 6.1 React frontend (`frontend/`) — the real product UI

- Vite 5 + React 18 + Tailwind 3 + react-router 6, framer-motion, lucide icons,
  @tanstack/react-query, jsPDF. Dev port **5173**, proxies `/api` + `/health` →
  `localhost:8000`.
- **API base:** `VITE_API_URL` or (prod) `https://coachai-backend-swart.vercel.app`.
  Single fetch wrapper in `src/lib/api.js` with bearer token.
- Pages: Landing, Login/Register (auth exists **only** in Node backend), Dashboard
  (Coaching Console — sessions, chat, autopilot, manager takeover), Setup, Analytics,
  Reports, Knowledge, HallOfFame, Leaderboard, JiraBoard, Email, Settings. Route-level
  code-splitting (cuts bundle ~58%).
- Design language: dark navy glassmorphism, emerald primary, `[data-accent]` runtime
  accent remap, animated blobs, `shadow-glow-*`.
- Tests: vitest (`src/test/` — ToastContext, ErrorBoundary, JiraBoard, CSV/PDF export).

### 6.2 Streamlit app (`src/ui/app.py`, ~2200 lines) — demo/research UI

Single-page app with sidebar (mode, scenario, risk threshold, KB controls, session
templates, history) and 5 pages routed via `st.session_state.page`:

1. `setup_page` — scenario library (real + AI-generated), decision-tree builder,
   KB admin tabs (Search Debugger / Index New Document / Chunking Simulator / Indexing
   Admin), auto-KB drafts.
2. `coaching_page` — live 3-panel console: conversation (`panels.py`), coaching,
   knowledge; Zomato widgets (`zomato_widgets.py`: order banner, rider status, bot
   escalation card, SLA ticker, decision tree, supervisor handoff, multiverse
   simulator); autopilot; agentic mock tools; fraud/viral/defection alerts; QA audit;
   Jira ticket generator; TTS toggle; humor mode easter egg.
3. `report_page` — performance report + export.
4. `analytics_page` — cross-session trends.
5. `survival_arcade_page` — arcade mode (see §7).

---

## 7. Fun/extra modules (`src/modules/`)

- `session_config.py` — session/scenario creation, transcript loading (`.json`/`.txt`).
- `performance_analytics.py` — aggregates reports → trends (avg scores, top escalation
  triggers, knowledge gaps, improvement areas, score history).
- `hall_of_fame.py` — archives sessions: score ≥0.85 → "Hall of Fame" (🏆), ≤0.45 →
  "Hall of Shame" (💀); seeds demo entries; stored in `runtime_data_dir/hall_of_fame.json`.
- `survival_game.py` — arcade: 4 random tickets from `SCENARIO_POOL`, keyword-graded
  replies (quality 0.85/0.6/0.35), HP/score/streak/power-ups (Manager Shield at 3-streak,
  Instant Refund Pass at 5), time penalties, all-resolved bonus +500.

---

## 8. Data files (`data/`)

| File | Purpose |
|---|---|
| `knowledge_base/*.json` | FAQ source docs ingested into RAG |
| `scenarios.json`, `templates.json` | Simulator scenarios / session templates |
| `transcripts/` | Replay-mode transcripts |
| `reports/` | Generated reports (JSON) — legacy; **DB is authoritative** |
| `coach.db` | Local SQLite (dev) |
| `coach_calibration.json` | Per-agent coaching calibration state |
| `hall_of_fame.json` | Archive (bundled seed) |
| `macros_actions_library.json` | Canned macros/actions injected into coaching prompts |

---

## 9. Known gotchas & technical debt (read before touching anything)

1. **Two backends, one Vercel project.** `backend/` (Node) and `vercel-backend/`
   (Python) both deploy to `coachai-backend`. The frontend needs the Node one (auth).
   Confirm which directory `vercel --prod` deploys from before shipping.
2. **`vercel-backend/src/` is a byte-for-byte copy of root `src/`.** Changes to Python
   code must be manually mirrored (53 files, verified identical at last check).
3. **README drift.** README claims keyword-only RAG, Groq-primary, no embedding, no
   vector DB — all outdated. Code is now: Azure-first LLM, hybrid semantic+keyword RAG,
   Postgres persistence.
4. **Auth gap.** Python API has no `/api/auth/*` routes; frontend login only works via
   the Node backend.
5. **Ephemeral filesystem on Vercel.** Never read `settings.reports_dir` /
   `hall_of_fame.json` from serverless handlers — use the DB endpoints.
6. **Hard-coded demo data** everywhere: `ORD-8142K`, ₹250, Biryani Blues, "Ramesh Kumar"
   rider, `COMPOSIO_REFUND_EMAIL` default in `config.py`. Intentional for demo, but
   surprising in production contexts.
7. **Every LLM agent silently degrades** to heuristic fallbacks — good resilience, but
   failures print to stdout and can look like "working". Check logs, not just UI.
8. **`deep_analysis.py` returns a plain dict** (not a Pydantic model) — the only agent
   that does; its contract is the JSON schema in `DEEP_ANALYSIS_SYSTEM_PROMPT`.
9. **Survival game is a global singleton** in the API process — not session-scoped;
   concurrent users share state.
10. **Uncommitted Node backend work** (`backend/src/` has modified + untracked files).
    Review `git status` before assuming the committed state is what's deployed.
11. `.env` files exist in `backend/` (`env`, `.env.local`, `.env.vercel`) — never
    commit them; `backend/.env.example` documents the required key names.
12. Streamlit secrets path: keys can come from `st.secrets` (Streamlit Cloud), env, or
    `.env` — three fallback layers for the same keys.

---

## 10. Running & testing

```bash
# Streamlit (demo UI)
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
python run.py                      # or: streamlit run src/ui/app.py
start.bat                          # Windows one-click (activates venv, checks .env)

# Python FastAPI backend
uvicorn src.api.server:app --port 8000     # or python src/api/server.py
# Swagger at http://localhost:8000/docs

# Node backend (current API)
cd backend && npm install && npm run dev  # port 8000

# React frontend
cd frontend && npm install && npm run dev # http://localhost:5173

# Tests
python -m pytest tests/            # 14 pytest tests + 1 load script
cd frontend && npm test            # vitest (7 tests)
cd backend && npm test             # node --test tests/
```

**Env keys:** `GROQ_API_KEY`, `OPENROUTER_API_KEY` (+ `OPENROUTER_EMBED_MODEL`,
`OPENROUTER_TTS_MODEL`), `AZURE_OPENAI_ENDPOINT/KEY/DEPLOYMENT`, `DATABASE_URL`,
`COMPOSIO_API_KEY` + `COMPOSIO_USER_ID/JIRA_PROJECT_KEY/REFUND_EMAIL/SLACK_CHANNEL`.
All optional except an LLM key — everything else degrades gracefully.

---

## 11. Where to make changes (map)

| You want to… | Edit here |
|---|---|
| Change any agent's instructions/prompt | `src/core/prompts.py` (Python) / `backend/src/agents.js` (Node) |
| Add an agent | new file in `src/agents/` + model in `src/core/models.py` + prompt in `prompts.py` + wire in `conversation_manager.py`/API |
| Change LLM provider priority | `src/core/llm.py` / `backend/src/llm.js` |
| Tune RAG (chunk size, search) | `src/rag/knowledge_base.py` + `settings.chunk_size` |
| Add KB docs | drop files into `data/knowledge_base/` (`.txt/.md/.json/.pdf/.docx`) |
| Change session flow | `src/core/orchestrator.py`, `src/modules/conversation_manager.py` |
| Change persistence | `src/core/database.py` (Postgres/SQLite) |
| Add API endpoint | `src/api/server.py` or `src/api/features.py` (Python) / `backend/src/app.js` (Node) |
| Change coaching visibility logic | `src/agents/coach_calibrator.py` |
| Change report scoring | `src/agents/post_interaction_summary.py` |
| Change UI | `frontend/src/` (React) or `src/ui/app.py` + `panels.py` + `zomato_widgets.py` (Streamlit) |
| Change demo tools | `src/tools/mock_backend.py` / `composio_backend.py` |

---

## 12. Suggested next steps (observations from the code)

1. Decide the **canonical backend** — Node vs Python — and retire the other, or wire the
   frontend to Python and delete `backend/`. Duplication is the #1 maintenance risk.
2. Reconcile README with reality (semantic RAG, Azure-first, Postgres, Node backend).
3. Add auth routes to the Python API or delete the login UI if auth isn't required.
4. Add embedding persistence so the semantic index doesn't re-embed on every cold start.
5. Consider moving `deep_analysis` JSON contract into a Pydantic model for type safety.