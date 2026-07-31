# CoachAI — Real-Time Customer Support Coaching Assistant

A Streamlit app that sits next to a support agent during a live chat and, after
every customer message, tells the agent what the customer is feeling, which
knowledge-base article applies, how to phrase the reply, and whether the
conversation is at risk of escalating. After the session ends it produces a
performance report (sentiment journey, resolution quality, coaching tips).

This README is deliberately a single, accurate source of truth for the
project — it replaces several older docs that had drifted out of sync with
the actual code.

---

## 1. Quick Start

```bash
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
python run.py                   # or: streamlit run src/ui/app.py
```

Add a Groq key to `.env` (copy `.env.example`) to enable live LLM calls:

```env
GROQ_API_KEY=gsk_your_key_here
```

Without a key, agents fall back to their built-in rule-based/heuristic logic
instead of crashing.

### Composio integration (real tools: Jira / Gmail / Slack)

Agent tool execution can be promoted from the mock backend to **real
integrations** via [Composio](https://composio.dev) (v3 API, `composio` SDK):

| Agent | Mock tool (default) | Real action when connected |
|---|---|---|
| Jira Bug Generator (`src/agents/jira_bug_generator.py`) | none — ticket text only | `JIRA_CREATE_ISSUE` — actual Jira ticket in project `COMPOSIO_JIRA_PROJECT_KEY` |
| Auto-Pilot (`src/agents/auto_pilot_agent.py`) | `process_refund` | Gmail refund-confirmation email draft (`GMAIL_CREATE_EMAIL_DRAFT`) |
| Auto-Pilot | `grant_voucher` | Gmail voucher email + Slack post to `COMPOSIO_SLACK_CHANNEL` |

Setup:

1. Add your key to `.env` (`.env` is gitignored — never commit keys):

   ```env
   COMPOSIO_API_KEY=ak_...
   COMPOSIO_USER_ID=default
   COMPOSIO_JIRA_PROJECT_KEY=COACH
   COMPOSIO_REFUND_EMAIL=customer@example.com
   COMPOSIO_SLACK_CHANNEL=#support-ops
   ```

2. Install: `pip install -r requirements.txt` (adds `composio>=0.18.1`).
3. Connect your Jira / Gmail / Slack accounts. Each app has a connect URL —
   generate it and open it in a browser:

   ```bash
   python -c "from src.tools.composio_backend import composio_backend; print(composio_backend.get_connect_url('jira'))"
   python -c "from src.tools.composio_backend import composio_backend; print(composio_backend.get_connect_url('gmail'))"
   python -c "from src.tools.composio_backend import composio_backend; print(composio_backend.get_connect_url('slack'))"
   ```

   (Or do it in the dashboard: [app.composio.dev](https://app.composio.dev) →
   Connected Accounts.)
   Verify: `python -c "from src.tools.composio_backend import composio_backend; print(composio_backend.list_connected_accounts())"`

Behavior: if the key is missing or the account is not connected yet, calls
return a failed `ToolCallResult` with a helpful message and the app keeps
working exactly as before (no crash, no UI change).

### OpenRouter AI (free: embeddings + neural TTS)

| Feature | Model (free) | Where it plugs in |
|---|---|---|
| Semantic embeddings | `nvidia/nemotron-3-embed-1b:free` (2048-dim) | `src/rag/knowledge_base.py` — `search()` now does real semantic similarity with cosine; falls back to the original keyword overlap when the key is missing or the API fails |
| Neural TTS | `fish-audio/s2.1-pro-free:free` | `src/core/llm.py:text_to_speech()` — used by the TTS toggle in the UI; falls back to gTTS automatically |

```env
OPENROUTER_API_KEY=sk-or-v1-your_key_here
OPENROUTER_EMBED_MODEL=nvidia/nemotron-3-embed-1b:free
OPENROUTER_TTS_MODEL=fish-audio/s2.1-pro-free:free
```

Both are optional and degrade gracefully to the previous behavior.

Run tests:

```bash
python -m pytest tests/
```

### React Frontend (new — Python untouched)

A new React (Vite + Tailwind) frontend lives in `frontend/`, sharing the
PillSync-style "dark glass enterprise" design language. It is a fresh UI
shell for CoachAI with sample data — no PillSync features are included.

```bash
cd frontend
npm install
npm run dev        # http://localhost:5174
```

The Streamlit app and all Python code are unchanged; both can run side by side.

---

## 2. The Real Tech Stack

| Layer | What's actually used |
|---|---|
| UI | Streamlit (`src/ui/`) |
| LLM | Groq API — `llama-3.3-70b-versatile`, with fallback to `llama-3.1-8b-instant`, `gemma2-9b-it`, `llama3-8b-8192` (`src/core/llm.py`) |
| Retrieval (RAG) | Pure-Python **keyword/word-overlap** matching over in-memory text chunks (`src/rag/knowledge_base.py`) — **no embedding model, no vector database** are actually wired in, despite leftover config fields suggesting otherwise |
| Data models | Pydantic (`src/core/models.py`) |
| Storage | SQLite (`data/coach.db`) + JSON files under `data/` |

---

## 3. Directory Structure & What Every File Does

```
customer-support-coach/
├── run.py                    # Local launcher — `python run.py` starts Streamlit
├── streamlit_app.py          # Entry point Streamlit Cloud calls directly
├── requirements.txt          # Python dependencies
├── .env.example              # Template for GROQ_API_KEY
│
├── src/
│   ├── core/                 # Orchestration, config, LLM client, shared models
│   │   ├── orchestrator.py       # Top-level session controller: start → per-turn → end → report
│   │   ├── config.py             # Settings (paths, thresholds, model name) loaded from .env
│   │   ├── llm.py                # Groq client wrapper with model fallback chain
│   │   ├── models.py             # Pydantic schemas (Message, TurnAnalysis, SessionState, reports, ...)
│   │   ├── model_config.py       # Misc model-tier config
│   │   ├── prompts.py            # ★ EVERY agent's LLM system prompt lives here — single source of truth
│   │   └── database.py           # SQLite persistence for sessions/reports
│   │
│   ├── modules/               # Per-turn business logic that sits above the agents
│   │   ├── conversation_manager.py   # Runs the fixed per-turn agent sequence, builds TurnAnalysis
│   │   ├── session_config.py         # Mode selection (Simulator/Manual/Replay), scenario setup
│   │   ├── performance_analytics.py  # Cross-session trend aggregation
│   │   ├── hall_of_fame.py           # Archives best/worst-scoring sessions
│   │   └── survival_game.py          # Multi-ticket "arcade" practice mode
│   │
│   ├── rag/                   # Knowledge base ingestion + retrieval
│   │   ├── knowledge_base.py     # Chunking (paragraph→512 char) + keyword-overlap search
│   │   └── ingest.py             # File-type dispatch/validation for uploads
│   │
│   ├── agents/                 # One class per specialized responsibility
│   │   ├── customer_simulator.py       # Generates realistic AI customer messages per turn
│   │   ├── intent_sentiment.py         # Classifies intent, sentiment, frustration, trend
│   │   ├── knowledge_recommendation.py # RAG: retrieves KB chunks + LLM-synthesizes one tip
│   │   ├── coaching_suggestion.py      # Suggests agent reply, scores tone/clarity
│   │   ├── escalation_monitor.py       # Rule-based escalation-risk scoring (no LLM)
│   │   ├── post_interaction_summary.py # End-of-session report: sentiment journey, resolution score
│   │   ├── coach_calibrator.py         # Learns per-agent when to actually show a coaching tip
│   │   ├── predictive_csat.py          # Forecasts live CSAT (1-5) and churn risk %
│   │   ├── manager_supervisor.py       # Simulates a supervisor whisper/takeover on extreme risk
│   │   ├── compliance_monitor.py       # Flags agent replies that contradict the knowledge base
│   │   ├── tone_rewriter.py            # Rewrites a rough agent draft into a polished reply
│   │   ├── auto_kb_agent.py            # Auto-drafts a new FAQ when a knowledge gap is detected
│   │   ├── auto_pilot_agent.py         # One-click autonomous reply + backend action
│   │   ├── competitor_defection_agent.py # Detects "I'll switch to X" churn threats
│   │   ├── customer_mind_reader.py     # LLM guess at the customer's unstated internal thought
│   │   ├── multiverse_simulator.py     # "What if the agent replied differently?" branching demo
│   │   ├── viral_threat_predictor.py   # Flags risk of the customer posting publicly (social/PR)
│   │   ├── fraud_detector.py           # Flags refund-abuse / scam patterns
│   │   ├── jira_bug_generator.py       # Turns a transcript into a structured bug ticket
│   │   ├── scenario_generator.py       # LLM-generates new training scenarios on demand
│   │   ├── qa_audit_agent.py           # Rule-based ISO-style pass/fail audit of a report
│   │   ├── cognitive_load_agent.py     # Rule-based agent mental-workload estimate
│   │   ├── patience_clock_agent.py     # Rule-based "turns until customer drops off" estimate
│   │   └── bot_agent.py                # Scripted first-line chatbot before a human agent joins
│   │
│   ├── tools/
│   │   └── mock_backend.py       # Fake order lookup / refund / voucher APIs for demo purposes
│   │
│   ├── ui/
│   │   ├── app.py                # Main Streamlit app: page routing, all tabs
│   │   ├── panels.py             # Conversation + coaching panel rendering
│   │   ├── zomato_widgets.py     # Order/rider/bot-chat widget components
│   │   └── avatars.py            # Avatar rendering helpers
│   │
│   └── api/
│       └── server.py             # Optional REST entry point
│
├── data/
│   ├── knowledge_base/            # FAQ/policy source documents the RAG layer ingests
│   ├── scenarios.json             # Customer simulator scenario library
│   ├── transcripts/                # Sample transcripts for Replay Mode
│   ├── reports/                    # Generated post-session performance reports
│   ├── coach.db                    # SQLite session store
│   ├── coach_calibration.json      # Per-agent coaching calibration state
│   ├── hall_of_fame.json           # Best/worst session archive
│   └── macros_actions_library.json # Canned macros/actions the coaching agent can suggest
│
└── tests/                     # Pytest suite covering agents, RAG, and load
```

---

## 4. Per-Turn Flow

1. Customer message arrives (typed, simulated, or replayed).
2. `Orchestrator` hands it to `ConversationManager`.
3. `IntentSentimentAgent` → LLM call → intent, sentiment, frustration, trend.
4. `KnowledgeRecommendationAgent` → keyword search over KB chunks (retrieval) → LLM call to synthesize one tip (generation). This retrieval-then-generation pair is the RAG step.
5. `CoachingSuggestionAgent` → suggested reply + tone/clarity feedback.
6. `EscalationMonitorAgent` → rule-based risk score + strategy.
7. All four results merge into one `TurnAnalysis`, rendered in the 3-panel console.
8. At session end, `PostInteractionSummaryAgent` builds the report.

## 5. Known Design Trade-offs (intentional, not bugs)

- **RAG retrieval is keyword/word-overlap based, not embedding-based.** No
  ChromaDB/FAISS/Pinecone is active; `KnowledgeBase.documents` is a plain
  in-memory Python list, rebuilt from `data/knowledge_base/` on every run.
  This keeps the app dependency-light and instant at FAQ-scale. Swapping in
  a sentence-embedding model + vector index is the natural next iteration
  once the knowledge base grows past FAQ-scale.
- Several config fields (`embedding_model`, `vector_store_path`,
  `openai_api_key`) are leftover placeholders from an earlier design and are
  not read by any active code path.

## 6. Every LLM Prompt, in One Place

Every agent that calls the LLM imports its system prompt from
[`src/core/prompts.py`](src/core/prompts.py) instead of hard-coding it —
that file is the single place to read or edit any agent's instructions.
