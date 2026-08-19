# CoachAI — AI-Powered Customer Support Assistant with Live Response Guidance

An AI **coaching cockpit** for customer-support agents. It sits next to the agent
during a live chat and, after every customer message, tells the agent:

- **what the customer is feeling** — intent, sentiment, frustration, satisfaction trend
- **which knowledge-base article applies** — RAG over the support KB
- **how to phrase the reply** — suggested reply + tone/clarity/compliance feedback
- **whether the conversation is at risk** — escalation %, predicted CSAT, churn, fraud, viral/PR
- **when a manager should intervene** — whisper / takeover on extreme risk

After the session it produces a **performance report** (resolution score, sentiment
journey, coaching tips, knowledge gaps) and feeds cross-session analytics.

Built as a **multi-agent system**: 25+ specialized AI agents, one responsibility
each, coordinated by an orchestrator. Demo data is Zomato-flavored (orders,
refunds in ₹, Hinglish customers) but the engine is product-agnostic.

---

## 1. Quick Start

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

### Environment keys

Copy `.env.example` → `.env`. All keys are **optional except an LLM key** —
everything degrades gracefully to heuristic fallbacks instead of crashing:

```env
GROQ_API_KEY=...                          # LLM fallback chain (llama-3.3-70b-versatile → ...)
OPENROUTER_API_KEY=...                    # free semantic embeddings + neural TTS
OPENROUTER_EMBED_MODEL=nvidia/nemotron-3-embed-1b:free
OPENROUTER_TTS_MODEL=fish-audio/s2.1-pro-free:free
AZURE_OPENAI_ENDPOINT=...                 # primary LLM when set
AZURE_OPENAI_KEY=...
AZURE_OPENAI_DEPLOYMENT=...
DATABASE_URL=...                          # Postgres; SQLite used when absent
COMPOSIO_API_KEY=...                      # real integrations: Jira / Gmail / Slack
COMPOSIO_USER_ID=default
COMPOSIO_JIRA_PROJECT_KEY=COACH
COMPOSIO_REFUND_EMAIL=customer@example.com
COMPOSIO_SLACK_CHANNEL=#support-ops
```

---

## 2. Tech Stack

| Layer | What's used |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS, react-router, framer-motion, lucide icons, @tanstack/react-query, jsPDF → **Vercel** |
| Backend (current) | Node.js ≥18 + Express + ESM + `pg` → **Vercel** |
| Backend (research) | Python FastAPI (`src/api/server.py`) + Streamlit (`src/ui/app.py`) |
| LLM chain | **Azure OpenAI** (primary) → **OpenRouter** free models → **Groq** (`llama-3.3-70b-versatile` → `llama-3.1-8b-instant` → `gemma2-9b-it` → `llama3-8b-8192`) |
| Embeddings / TTS | OpenRouter `nemotron-3-embed-1b:free` (2048-dim) / `fish-audio/s2.1-pro-free:free` (gTTS fallback) |
| RAG | **Hybrid**: semantic embeddings (cosine) primary + BM25/keyword overlap offline fallback; embeddings cached as JSONB |
| Database | PostgreSQL (`pg`, JSONB session state, cross-instance rehydration) with SQLite fallback |
| Data models | Pydantic (Python) |
| Integrations | Composio v3 SDK — real Jira tickets, Gmail refund emails, Slack alerts |
| Testing | pytest (`tests/`), vitest (`frontend/src/test/`), node --test (`backend/tests/`) |

---

## 3. Repository Layout

```
customer-support-coach/
├── run.py / streamlit_app.py     # Streamlit launchers
├── requirements.txt              # Python dependencies
├── .env.example                  # env key template
│
├── frontend/                     # React UI (the real product UI)
│   ├── src/pages/                # Dashboard, Setup, Reports, Analytics, Knowledge, ...
│   ├── src/components/           # FeatureLab, AuthContext, ToastContext, ...
│   └── src/lib/api.js            # single fetch wrapper (bearer token)
│
├── backend/                      # Node Express API (auth + chat + agents mirror)
│   └── src/                      # app.js, agents.js, llm.js, rag.js, auth.js, ...
│
├── src/                          # Python implementation (research / richest feature set)
│   ├── core/                     # orchestrator.py, llm.py, prompts.py ★, models.py, database.py
│   ├── modules/                  # conversation_manager.py, survival_game.py, ...
│   ├── agents/                   # 25+ agents, one class per responsibility
│   ├── rag/                      # knowledge_base.py (hybrid retrieval), ingest.py
│   ├── tools/                    # mock_backend.py, composio_backend.py
│   ├── ui/                       # Streamlit app, panels, zomato widgets
│   └── api/                      # FastAPI server.py + features.py
│
├── vercel-backend/               # byte-for-byte copy of src/ for the Vercel Python API (legacy)
│
├── data/
│   ├── knowledge_base/           # 19+ FAQ JSON docs ingested by RAG
│   ├── scenarios.json            # simulator scenario library
│   ├── transcripts/              # replay-mode transcripts
│   └── coach.db                  # local SQLite (dev)
│
├── Doc/                          # ★ knowledge-transfer deliverables
│   ├── CoachAI_Presentation.pptx         # 10-slide final presentation
│   ├── CoachAI_Knowledge_Transfer.md      # complete KT guide + Q&A prep
│   ├── CoachAI_Project_Documentation.html# browser-viewable documentation
│   ├── CoachAI_Deep_Dive.md              # deep architecture dive
│   └── CoachAI_Meeting_CheatSheet.pdf    # quick cheat sheet
│
└── tests/                        # pytest suite
```

---

## 4. Per-Turn Flow

1. Customer message arrives (typed, simulated, or replayed).
2. `Orchestrator` hands it to `ConversationManager`.
3. `IntentSentimentAgent` → LLM call → intent, sentiment, frustration, trend.
4. `KnowledgeRecommendationAgent` → hybrid KB search (retrieval) → LLM tip
   (generation) — this retrieval-then-generation pair **is the RAG step**.
5. `CoachingSuggestionAgent` → suggested reply + tone/clarity feedback.
6. `EscalationMonitorAgent` → rule-based risk score + strategy.
7. `DeepAnalysisAgent` (parallel) → predicted CSAT, churn %, viral/PR, fraud
   protocol, mind-reader monologue.
8. All results merge into one `TurnAnalysis`, rendered in the coaching console.
9. At session end, `PostInteractionSummaryAgent` builds the performance report.

---

## 5. System Prompts

Every agent that calls the LLM imports its system prompt from
[`src/core/prompts.py`](src/core/prompts.py) — 15+ prompt constants + builder
functions. That file is the **single place to read or edit any agent's
instructions** (the Node mirror lives in `backend/src/agents.js`). Agents return
JSON contracts and every failure falls back to hard-coded heuristics — the app
**never crashes on LLM errors, it degrades**.

---

## 6. Deployment

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

## 7. Tests

```bash
python -m pytest tests/           # Python suite
cd frontend && npm test           # vitest
cd backend && npm test            # node --test
```

---

## 8. Documentation & KT Deliverables

| Deliverable | File |
|---|---|
| Final presentation (exactly 10 slides) | [`Doc/CoachAI_Presentation.pptx`](Doc/CoachAI_Presentation.pptx) |
| Knowledge-transfer guide + Q&A prep | [`Doc/CoachAI_Knowledge_Transfer.md`](Doc/CoachAI_Knowledge_Transfer.md) |
| Browser-viewable documentation | [`Doc/CoachAI_Project_Documentation.html`](Doc/CoachAI_Project_Documentation.html) |
| Deep architecture dive | [`Doc/CoachAI_Deep_Dive.md`](Doc/CoachAI_Deep_Dive.md) |
| Meeting cheat sheet (PDF) | [`Doc/CoachAI_Meeting_CheatSheet.pdf`](Doc/CoachAI_Meeting_CheatSheet.pdf) |

Project title: **Development of AI-Powered Customer Support Assistant with Live
Response Guidance**. Team repo: `github.com/MasterJi27/coachai-infosys-final`.

---

## License

[MIT](LICENSE) © 2026 MasterJi27