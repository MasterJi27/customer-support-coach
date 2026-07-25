import os
import sys
import json
import random
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import streamlit as st

from src.core.models import InteractionMode, Scenario, SentimentLabel
from src.core.orchestrator import Orchestrator
from src.ui.panels import (
    render_coaching_panel,
    render_conversation_panel,
    render_knowledge_panel,
    render_performance_report,
)
from src.rag.knowledge_base import knowledge_base
from src.rag.ingest import ingest_with_feedback
from src.core.database import database
from src.core.config import settings

TEMPLATES_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "templates.json")


def load_templates() -> dict:
    if not os.path.exists(TEMPLATES_PATH):
        return {}
    try:
        with open(TEMPLATES_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def save_templates(templates: dict):
    os.makedirs(os.path.dirname(TEMPLATES_PATH), exist_ok=True)
    with open(TEMPLATES_PATH, "w", encoding="utf-8") as f:
        json.dump(templates, f, indent=2)





def inject_global_css():
    """Applies an ultra-premium, modern glassmorphic design system to the Streamlit UI."""
    st.markdown(
        """
        <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@600;700;800&display=swap');

        :root {
            --surface: #1e293b;
            --surface-overlay: #1e293b;
            --border: #334155;
            --border-glow: #475569;
            --primary-accent: #3b82f6;
            --secondary-accent: #f59e0b;
            --text-main: #f8fafc;
            --text-sub: #94a3b8;
        }

        /* Hide Streamlit Native Header & Footer Chrome */
        #MainMenu { visibility: hidden; }
        footer { visibility: hidden; }
        header[data-testid="stHeader"] { display: none !important; }
        .stAppHeader { display: none !important; }

        /* Global Typography & App Canvas */
        html, body, [class*="css"] {
            font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif !important;
        }

        .stApp {
            background: #0f172a !important;
            color: var(--text-main) !important;
            padding-top: 1rem !important;
        }

        /* Headings - Crisp White */
        h1, h2, h3, h4 {
            font-family: 'Outfit', 'Plus Jakarta Sans', sans-serif !important;
            font-weight: 700 !important;
            letter-spacing: -0.02em !important;
            color: #ffffff !important;
        }

        /* Streamlit Bordered Container Cards (Dark Slate Graphite Style) */
        [data-testid="stVerticalBlockBorderWrapper"] {
            background: #1e293b !important;
            border: 1px solid #334155 !important;
            border-radius: 12px !important;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25) !important;
            padding: 16px !important;
            transition: border-color 0.2s ease !important;
        }
        [data-testid="stVerticalBlockBorderWrapper"]:hover {
            border-color: #475569 !important;
        }

        /* Buttons - Dark Slate Style */
        .stButton > button, .stDownloadButton > button, .stFormSubmitButton > button {
            border-radius: 8px !important;
            font-weight: 600 !important;
            letter-spacing: 0.01em !important;
            background: #1e293b !important;
            border: 1px solid #334155 !important;
            color: #f8fafc !important;
            transition: all 0.2s ease !important;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2) !important;
        }
        .stButton > button:hover, .stDownloadButton > button:hover {
            background: #334155 !important;
            border-color: #475569 !important;
            color: #ffffff !important;
        }

        /* Primary Type Buttons */
        .stButton > button[kind="primary"] {
            background: #2563eb !important;
            border: 1px solid #1d4ed8 !important;
            color: #ffffff !important;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3) !important;
        }
        .stButton > button[kind="primary"]:hover {
            background: #1d4ed8 !important;
            border-color: #1e40af !important;
            box-shadow: 0 6px 16px rgba(37, 99, 235, 0.45) !important;
        }

        /* Metric Cards */
        [data-testid="stMetric"] {
            background: #1e293b !important;
            border: 1px solid #334155 !important;
            border-radius: 12px !important;
            padding: 14px 18px !important;
        }
        [data-testid="stMetricValue"] {
            font-family: 'Outfit', sans-serif !important;
            font-weight: 700 !important;
            color: #38bdf8 !important;
        }

        /* Tabs - Dark Slate Pill Layout */
        .stTabs [data-baseweb="tab-list"] {
            gap: 6px !important;
            background: #1e293b !important;
            padding: 4px !important;
            border-radius: 10px !important;
            border: 1px solid #334155 !important;
            margin-bottom: 14px !important;
        }
        .stTabs [data-baseweb="tab"] {
            padding: 8px 16px !important;
            border-radius: 6px !important;
            background: transparent !important;
            border: none !important;
            font-weight: 600 !important;
            color: #94a3b8 !important;
            transition: all 0.2s ease !important;
        }
        .stTabs [data-baseweb="tab"]:hover {
            color: #ffffff !important;
            background: #334155 !important;
        }
        .stTabs [aria-selected="true"] {
            background: #334155 !important;
            color: #ffffff !important;
            border: 1px solid #475569 !important;
        }

        /* Inputs & Textareas */
        .stTextInput > div > div > input, .stTextArea > div > div > textarea, .stSelectbox > div > div {
            background: #1e293b !important;
            border: 1px solid #334155 !important;
            border-radius: 8px !important;
            color: #f8fafc !important;
            font-size: 0.92rem !important;
            transition: border-color 0.2s ease !important;
        }
        .stTextInput > div > div > input:focus, .stTextArea > div > div > textarea:focus {
            border-color: #3b82f6 !important;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25) !important;
        }

        /* Expander Headers Dark Polish */
        [data-testid="stExpander"] {
            background: #1e293b !important;
            border: 1px solid #334155 !important;
            border-radius: 10px !important;
        }
        [data-testid="stExpander"] summary {
            font-weight: 700 !important;
            color: #f8fafc !important;
        }

        /* Sidebar Styling */
        section[data-testid="stSidebar"] {
            background: #0f172a !important;
            border-right: 1px solid #334155 !important;
        }

        /* Custom Scrollbar */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0f172a; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #475569; }
        </style>
        """,
        unsafe_allow_html=True,
    )


def init_session_state():
    if "orchestrator" not in st.session_state:
        st.session_state.orchestrator = Orchestrator()
    if "page" not in st.session_state:
        st.session_state.page = "setup"
    if "session" not in st.session_state:
        st.session_state.session = None
    if "last_turn" not in st.session_state:
        st.session_state.last_turn = None
    if "report" not in st.session_state:
        st.session_state.report = None
    if "humor_mode" not in st.session_state:
        st.session_state.humor_mode = False
    if "session_search" not in st.session_state:
        st.session_state.session_search = ""
    if "session_filter_mode" not in st.session_state:
        st.session_state.session_filter_mode = "All"
    if "risk_threshold" not in st.session_state:
        st.session_state.risk_threshold = 70
    if "ui_interaction_mode" not in st.session_state:
        st.session_state.ui_interaction_mode = "simulator"
    if "ui_agent_name" not in st.session_state:
        st.session_state.ui_agent_name = "Agent"
    if "ui_product_context" not in st.session_state:
        st.session_state.ui_product_context = "SaaS Platform"
    if "scenario_choice" not in st.session_state:
        st.session_state.scenario_choice = None
    if "selected_transcript" not in st.session_state:
        st.session_state.selected_transcript = None
    if "template_name" not in st.session_state:
        st.session_state.template_name = ""
    if "templates" not in st.session_state:
        st.session_state.templates = load_templates()
    if "ml_tier" not in st.session_state:
        st.session_state.ml_tier = "Gemini LLM"


def auto_seed_kb():
    if knowledge_base.count() == 0:
        kb_dir = os.path.join(os.path.dirname(__file__), "..", "..", "data", "knowledge_base")
        knowledge_base.ingest_directory(kb_dir)


def reset_session():
    st.session_state.session = None
    st.session_state.last_turn = None
    st.session_state.report = None


def render_sidebar():
    with st.sidebar:
        # Executive Sidebar Header Card
        st.markdown(
            """
            <div style="
                background: #1e293b;
                border: 1px solid #334155;
                border-radius: 12px;
                padding: 14px 16px;
                margin-bottom: 16px;
                text-align: center;
                box-shadow: 0 4px 12px rgba(0,0,0,0.25);
            ">
                <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.35rem; color:white;">⚡ CoachAI Engine</div>
                <div style="font-size:0.75rem; color:#94a3b8; font-weight:600; margin-top:2px; letter-spacing:0.05em; text-transform:uppercase;">Enterprise Copilot & Audit</div>
            </div>
            """,
            unsafe_allow_html=True
        )

        # Humor Status Card (styled cleanly)
        humor_on = st.session_state.get("humor_mode", False)
        if humor_on:
            st.markdown("<div style='background:rgba(239, 68, 68, 0.2); border:1px solid rgba(239, 68, 68, 0.4); color:#fca5a5; padding:8px 12px; border-radius:8px; font-size:0.8rem; font-weight:600; margin-bottom:12px;'>🔥 <b>Humor Mode ON</b> — Roasts enabled</div>", unsafe_allow_html=True)
        else:
            st.markdown("<div style='background:rgba(30, 41, 59, 0.6); border:1px solid rgba(255, 255, 255, 0.1); color:#94a3b8; padding:8px 12px; border-radius:8px; font-size:0.8rem; font-weight:600; margin-bottom:12px;'>😴 <b>Humor Mode OFF</b> — Professional mode</div>", unsafe_allow_html=True)

        # 1. EXPANDER: Manager Shadow Control (Only during coaching)
        if st.session_state.get("page") == "coaching" and st.session_state.get("session"):
            with st.expander("🤫 Manager Shadow Control", expanded=True):
                st.caption("Inject private policy hints/reminders to the agent during this live call.")
                whisper_text = st.text_area("Whisper:", key="whisper_input", height=70, label_visibility="collapsed", placeholder="e.g. Policy: Maximum refund allowed is 50%!")
                col_w1, col_w2 = st.columns([1, 1.2])
                with col_w1:
                    sender_id = st.text_input("Sender ID", value="Manager", label_visibility="collapsed", key="whisper_sender")
                with col_w2:
                    if st.button("Send Hint", use_container_width=True, type="primary") and whisper_text.strip():
                        st.session_state.orchestrator.process_whisper(whisper_text.strip(), sender_id=sender_id)
                        st.rerun()

        # 2. EXPANDER: Knowledge Base
        with st.expander("📚 Knowledge Base", expanded=False):
            kb_count = knowledge_base.count()
            st.markdown(f"**Articles Indexed:** `{kb_count}`")
            uploaded_file = st.file_uploader(
                "Upload document",
                type=["txt", "pdf", "docx", "json", "md", "csv", "html"],
                key="kb_upload",
                label_visibility="collapsed",
            )
            if uploaded_file:
                ext = os.path.splitext(uploaded_file.name)[1].lower()
                if ext in {".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp", ".svg"}:
                    st.error(f"Cannot read '{uploaded_file.name}' (image not supported).")
                else:
                    fpath = os.path.join("data", "knowledge_base", uploaded_file.name)
                    os.makedirs(os.path.dirname(fpath), exist_ok=True)
                    with open(fpath, "wb") as f:
                        f.write(uploaded_file.getbuffer())
                    count, err = ingest_with_feedback(fpath)
                    if err:
                        st.error(err)
                    else:
                        st.success(f"Indexed {count} chunks from '{uploaded_file.name}'")
                        st.rerun()

        # 3. EXPANDER: Session Templates
        with st.expander("💾 Session Templates", expanded=False):
            st.caption("Save/Load platform configuration templates.")
            template_name = st.text_input("Template name", value=st.session_state.template_name, placeholder="e.g. Stripe Billing Test")
            if st.button("Save Current Configuration", type="secondary", use_container_width=True):
                current_templates = st.session_state.templates or {}
                current_templates[template_name or f"Template {len(current_templates)+1}"] = {
                    "mode": st.session_state.ui_interaction_mode,
                    "agent_name": st.session_state.ui_agent_name,
                    "product_context": st.session_state.ui_product_context,
                    "risk_threshold": st.session_state.risk_threshold,
                }
                save_templates(current_templates)
                st.session_state.templates = current_templates
                st.success("Template saved!")
                st.rerun()

            if st.session_state.templates:
                selected_template = st.selectbox(
                    "Select template to load:",
                    options=[f"{k} ({v['mode']})" for k, v in st.session_state.templates.items()],
                )
                if st.button("Apply Template Settings", type="primary", use_container_width=True):
                    name = selected_template.split(" (")[0]
                    template = st.session_state.templates.get(name)
                    if template:
                        st.session_state.ui_interaction_mode = template["mode"]
                        st.session_state.ui_agent_name = template["agent_name"]
                        st.session_state.ui_product_context = template["product_context"]
                        st.session_state.risk_threshold = template["risk_threshold"]
                        st.success(f"Loaded template '{name}'")
                        st.rerun()

        # 4. EXPANDER: Session History
        with st.expander("⏳ Session History", expanded=False):
            st.text_input("Search sessions", key="session_search", placeholder="Search agent, product, or ID...")
            
            # Put filter and clear side by side inside columns
            filter_cols = st.columns([1.5, 1])
            with filter_cols[0]:
                filter_mode = st.selectbox(
                    "Filter mode",
                    options=["All", "Simulator", "Manual", "Replay"],
                    key="session_filter_mode",
                    label_visibility="collapsed",
                )
            with filter_cols[1]:
                clear_history = st.button("Clear All", type="secondary", use_container_width=True)
                
            sessions = database.get_all_sessions()
            if st.session_state.session_search:
                query = st.session_state.session_search.lower()
                sessions = [
                    s for s in sessions
                    if query in s["id"].lower()
                    or query in s["config"].get("agent_name", "").lower()
                    or query in s["config"].get("product_context", "").lower()
                    or query in s["config"].get("mode", "").lower()
                ]
            if filter_mode != "All":
                sessions = [s for s in sessions if s["config"].get("mode", "").title() == filter_mode]
                
            if clear_history:
                database.delete_all_sessions()
                st.rerun()

            if sessions:
                for s in sessions[:5]:
                    config = s.get("config", {})
                    is_active = s.get("is_active", False)
                    status = "🟢 Active" if is_active else "⚪ Completed"
                    created = s.get("created_at", "")[:16]
                    with st.container(border=True):
                        st.markdown(f"**{config.get('mode', '?').title()}** ({status})")
                        st.caption(f"{created} | {config.get('agent_name', 'Agent')}")
            else:
                st.caption("No past sessions found.")

        st.divider()
        st.caption("v2.0 | Powered by Groq LLM + Agentic RAG")


def render_top_nav_bar():
    """Renders a fixed 2026 Executive Spatial Glass Navbar across the top of the app."""
    st.markdown(
        """
        <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #1e293b;
            border: 1px solid #334155;
            border-radius: 14px;
            padding: 12px 22px;
            margin-bottom: 20px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
        ">
            <div style="display:flex; align-items:center; gap:12px;">
                <span style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.35rem; color:#3b82f6;">⚡ COACHAI COPILOT</span>
                <span style="background:rgba(59,130,246,0.15); border:1px solid rgba(59,130,246,0.3); color:#93c5fd; padding:3px 10px; border-radius:12px; font-size:0.72rem; font-weight:700; letter-spacing:0.04em;">ENTERPRISE v2.0</span>
            </div>
            <div style="display:flex; gap:16px; align-items:center; font-size:0.8rem; font-family:'Plus Jakarta Sans', sans-serif;">
                <span style="color:#34d399; font-weight:700; display:flex; align-items:center; gap:6px;">🟢 ENGINE: ONLINE</span>
                <span style="color:#64748b;">•</span>
                <span style="color:#fbbf24; font-weight:700;">🏆 ISO-9001 COMPLIANT</span>
                <span style="color:#64748b;">•</span>
                <span style="color:#38bdf8; font-weight:700;">⚡ SUB-5MS BM25 RAG</span>
            </div>
        </div>
        """,
        unsafe_allow_html=True
    )


def _start_quick(mode_str: str):
    mode = InteractionMode(mode_str)
    scenario_obj = None
    if mode == InteractionMode.SIMULATOR:
        scenarios = st.session_state.orchestrator.list_scenarios()
        real_scenarios = st.session_state.orchestrator.session_config_module.load_real_scenarios()
        selected_real = real_scenarios[0] if real_scenarios else {}
        persona = selected_real.get("customer_persona", "Frustrated customer waiting 55 mins for Biryani") if selected_real else "Customer needs support"
        prob_desc = selected_real.get("context", selected_real.get("title", "Food delivery delayed by 55 minutes")) if selected_real else "Delayed order delivery"
        scenario_obj = Scenario(
            title="Zomato: Biryani Blues (Delayed Delivery)",
            customer_persona=persona,
            problem_description=prob_desc,
            product_context="Zomato Food Delivery",
            emotional_start=SentimentLabel.FRUSTRATED,
        )

    t_path = os.path.join("data", "transcripts", "campaign_video_not_rendering.json") if mode == InteractionMode.REPLAY else None

    sess = st.session_state.orchestrator.start_session(
        mode=mode,
        agent_name=st.session_state.get("ui_agent_name", "Agent"),
        product_context="Zomato Food Delivery" if mode == InteractionMode.SIMULATOR else "SaaS Platform",
        scenario=scenario_obj,
        transcript_path=t_path,
        risk_threshold=0.7,
    )
    st.session_state.session = sess
    st.session_state.page = "coaching"
    st.rerun()


def setup_page():
    auto_seed_kb()
    render_sidebar()
    render_top_nav_bar()

    st.markdown(
        """
        <div style="
            background: #1e293b;
            border: 1px solid #334155;
            border-radius: 14px;
            padding: 20px 24px;
            margin-bottom: 20px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
        ">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                <div>
                    <h1 style="margin:0; font-size: 1.8rem; font-weight: 800; color: #ffffff;">⚡ CoachAI Enterprise</h1>
                    <p style="margin:4px 0 0 0; color:#94a3b8; font-size:0.95rem; font-weight:500;">Real-time AI Copilot, Support Simulator & Quality Auditing Engine</p>
                </div>
                <div>
                    <span style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #34d399; padding:6px 14px; border-radius:20px; font-weight:700; font-size:0.82rem;">🟢 AI Engine Operational</span>
                </div>
            </div>
        </div>
        """,
        unsafe_allow_html=True
    )

    kb_count = knowledge_base.count()

    st.markdown("#### ⚡ Launch Quick Start Mode")
    qcols = st.columns(5)
    quick_modes = [
        ("🎯", "Simulator", "AI generates customers", "simulator"),
        ("⚔️", "Survival Mode", "Arcade HP challenge", "survival"),
        ("⌨️", "Manual", "Paste real messages", "manual"),
        ("🔄", "Replay", "Step through transcripts", "replay"),
        ("📊", "Analytics", "View performance trends", "analytics"),
    ]
    for i, (icon, title, desc, mode) in enumerate(quick_modes):
        with qcols[i]:
            with st.container(border=True):
                st.markdown(f"#### {icon} {title}")
                st.caption(desc)
                if st.button("Start", key=f"quick_{mode}", use_container_width=True,
                              type="primary" if mode in ("simulator", "survival") else "secondary"):
                    if mode == "analytics":
                        st.session_state.page = "analytics"
                        st.rerun()
                    elif mode == "survival":
                        st.session_state.page = "survival"
                        st.rerun()
                    else:
                        _start_quick(mode)

    st.divider()

    tab1, tab2, tab3, tab4, tab5, tab6 = st.tabs([
        "⚙️ Session Config",
        "🔥 Humor & Models",
        "🎬 Manage Scenarios",
        "📚 Knowledge Base",
        "❓ How It Works",
        "⏳ KB Approvals"
    ])
    with tab1:
        mode = st.radio(
            "Interaction mode",
            options=[m.value for m in InteractionMode],
            format_func=lambda x: {
                "simulator": "Simulator (AI customer)",
                "manual": "Manual (Paste messages)",
                "replay": "Replay (Real transcripts)",
            }.get(x, x),
            horizontal=True,
            key="setup_mode",
        )

        st.markdown("<div style='height: 12px'></div>", unsafe_allow_html=True)

        scenario_choice = None
        emotional_start = "neutral"
        selected_transcript = None
        selected_real = None
        ml_tier = st.session_state.get("ml_tier", "Gemini LLM")

        col1, col2 = st.columns(2)

        with col2:
            if mode == "simulator":
                scenarios = st.session_state.orchestrator.list_scenarios()
                scenario_choice = st.selectbox(
                    "Customer issue", options=list(scenarios.keys()),
                    format_func=lambda x: scenarios[x],
                )
                real_scenarios = st.session_state.orchestrator.session_config_module.load_real_scenarios()
                for rs in real_scenarios:
                    if rs["id"] == scenario_choice:
                        selected_real = rs
                        break
                emotional_start = st.selectbox("Starting emotion", ["frustrated", "angry", "neutral", "satisfied"], key="emotional_start")

            elif mode == "replay":
                transcripts = st.session_state.orchestrator.list_transcripts()
                if transcripts:
                    transcript_labels = {
                        "campaign_video_not_rendering.json": "Campaign Video Rendering Failure",
                        "billing_double_deducted.json": "Billing Double Charge",
                        "sample_transcript.json": "Sample - Generic Support Chat",
                    }
                    selected_transcript = st.selectbox(
                        "Select transcript", transcripts,
                        format_func=lambda x: transcript_labels.get(x, x),
                    )
                else:
                    st.info("Place .json or .txt transcripts in data/transcripts/")

        with col1:
            agent_name = st.text_input(
                "Your name",
                value=st.session_state.get("ui_agent_name", "Agent"),
                key="agent_name_input",
            )
            if mode == "simulator":
                default_company = selected_real.get("product_context", "SaaS Platform") if selected_real else "SaaS Platform"
                product_context = st.text_input(
                    "Company / Platform", value=default_company, disabled=True,
                    help="Auto-detected from selected scenario.", key="product_context_input"
                )
            else:
                product_context = st.text_input(
                    "Company / Platform", value="SaaS Platform",
                    help="What company/product are you supporting?",
                    key="product_context_input"
                )

        # Render description boxes outside columns to fix vertical alignment
        if mode == "simulator" and selected_real:
            with st.container(border=True):
                st.markdown(f"**{selected_real['title']}**")
                st.write(selected_real.get("customer_persona", ""))
                st.caption(f"Product: {selected_real.get('product_context', 'Platform')}")
        elif mode == "replay" and selected_transcript:
            with st.container(border=True):
                st.markdown(f"**Real transcript: {transcript_labels.get(selected_transcript, selected_transcript)}**")
                st.caption("Step through message by message with live coaching")

        st.markdown("<div style='height: 10px;'></div>", unsafe_allow_html=True)
        if st.button("🚀 Launch Coaching Session", type="primary", use_container_width=True):
            st.session_state.ui_interaction_mode = mode
            st.session_state.ui_agent_name = agent_name
            st.session_state.ui_product_context = product_context

            scenario_obj = None
            if mode == "simulator":
                scenarios = st.session_state.orchestrator.list_scenarios()
                s_id = scenario_choice or "zomato_biryani_blues"
                s_title = scenarios.get(s_id, "Zomato: Biryani Blues")
                persona = selected_real.get("customer_persona", "Frustrated customer waiting for order") if selected_real else "Customer needs support"
                prob_desc = selected_real.get("context", selected_real.get("title", s_title)) if selected_real else s_title
                p_ctx = selected_real.get("product_context", product_context) if selected_real else product_context

                emo_label = SentimentLabel.FRUSTRATED
                if emotional_start in [e.value for e in SentimentLabel]:
                    emo_label = SentimentLabel(emotional_start)

                scenario_obj = Scenario(
                    title=s_title,
                    customer_persona=persona,
                    problem_description=prob_desc,
                    product_context=p_ctx,
                    emotional_start=emo_label,
                )

            t_path = os.path.join("data", "transcripts", selected_transcript) if selected_transcript else None

            sess = st.session_state.orchestrator.start_session(
                mode=InteractionMode(mode),
                agent_name=agent_name,
                product_context=product_context,
                scenario=scenario_obj,
                transcript_path=t_path,
                risk_threshold=float(st.session_state.risk_threshold) / 100.0 if st.session_state.risk_threshold > 1 else float(st.session_state.risk_threshold),
            )
            st.session_state.session = sess
            st.session_state.page = "coaching"
            st.rerun()

    with tab2:
        col_h, col_hi, col_m = st.columns(3)
        with col_h:
            with st.container(border=True):
                st.markdown("### 🔥 Humor Mode")
                st.write("Bad responses get roasted. Good ones get praised. Roasty tips keep it fun.")
                st.caption("Roasts show in red • Tips in purple • Compliments in green")
                humor_mode = st.toggle("Enable Humor Mode", value=st.session_state.get("humor_mode", False))

        with col_hi:
            with st.container(border=True):
                st.markdown("### 🇮🇳 Hinglish Mode")
                st.write("Simulate authentic Tier-2/Tier-3 customers who actively mix Hindi and English in their chats.")
                st.caption('Expect phrases like "mera account chal nahi raha hai" and "please check karo yaar".')
                hinglish_mode = st.toggle("Enable Hinglish Mode", value=st.session_state.get("hinglish_mode", False))

        with col_m:
            with st.container(border=True):
                st.markdown("### 🎚️ Escalation & Voice")
                threshold = st.slider(
                    "Escalation sensitivity",
                    min_value=0, max_value=100,
                    value=st.session_state.risk_threshold,
                    help="Higher values make the app more sensitive to escalation risk.",
                )
                st.caption(f"Risk threshold: {threshold}%")
                st.session_state.risk_threshold = threshold
                tts_enabled = st.toggle(
                    "🔊 Read customer messages aloud",
                    value=st.session_state.get("tts_enabled", False),
                    help="Uses online text-to-speech. Adds a short delay per message.",
                )

        st.session_state.humor_mode = humor_mode
        st.session_state.hinglish_mode = hinglish_mode
        st.session_state.tts_enabled = tts_enabled

    with tab3:
        st.markdown("### 🎬 Manage Scenarios")
        st.caption("Visually create or update mock customer simulator scenarios.")
        
        real_scenarios = st.session_state.orchestrator.simulator._load_real_scenarios()
        
        with st.expander("➕ Create New Scenario", expanded=False):
            with st.form("new_scenario_form"):
                ns_id = st.text_input("Scenario ID (unique key)", placeholder="e.g. stripe_webhook_error")
                ns_title = st.text_input("Title (visible name)", placeholder="e.g. Stripe Webhook Verification Stuck")
                ns_product = st.text_input("Product Context (Platform)", placeholder="e.g. Stripe API Portal")
                ns_persona = st.text_area("Customer Persona", placeholder="e.g. Panicked web developer who is launching their SaaS...")
                ns_problem = st.text_input("Problem Category (single word)", placeholder="e.g. billing, technical, quality")
                ns_emotion = st.selectbox("Starting Emotion", ["neutral", "frustrated", "angry", "satisfied"])
                ns_context = st.text_area("Detailed Context (Issue details)", placeholder="e.g. Customer upgraded their webhook endpoint but is getting HTTP 500 errors...")
                ns_issues = st.text_input("Key Issues (comma-separated)", placeholder="e.g. webhook HTTP 500, signing secret, production down")
                ns_resolution = st.text_area("Expected Resolution Path", placeholder="e.g. Apologize + check webhook signature + instruct client to clear old secrets...")
                
                submitted = st.form_submit_button("Save Scenario", use_container_width=True)
                if submitted:
                    if not ns_id or not ns_title or not ns_product:
                        st.error("Please fill in Scenario ID, Title, and Product.")
                    else:
                        new_sc = {
                            "id": ns_id.strip(),
                            "title": ns_title.strip(),
                            "customer_persona": ns_persona.strip(),
                            "problem_description": ns_problem.strip(),
                            "product_context": ns_product.strip(),
                            "emotional_start": ns_emotion,
                            "context": ns_context.strip(),
                            "key_issues": [x.strip() for x in ns_issues.split(",") if x.strip()],
                            "resolution_path": ns_resolution.strip()
                        }
                        existing_ids = [sc["id"] for sc in real_scenarios]
                        if new_sc["id"] in existing_ids:
                            real_scenarios = [new_sc if sc["id"] == new_sc["id"] else sc for sc in real_scenarios]
                        else:
                            real_scenarios.append(new_sc)
                        
                        spath = os.path.join(os.path.dirname(__file__), "..", "..", "data", "scenarios.json")
                        os.makedirs(os.path.dirname(spath), exist_ok=True)
                        with open(spath, "w", encoding="utf-8") as f:
                            json.dump(real_scenarios, f, indent=2)
                        st.success(f"Scenario '{ns_title}' saved successfully!")
                        st.rerun()

        # Dynamic AI Scenario Generator
        with st.expander("🎲 Dynamic AI Infinite Scenario Generator", expanded=True):
            st.markdown("Generate custom customer training edge-cases dynamically using LLM.")
            with st.form("gen_ai_scenario_form"):
                gen_product = st.selectbox("Platform Industry:", ["Zomato - Food Delivery", "Stripe - Payments SaaS", "Amazon - E-Commerce", "Zerodha - Fintech"])
                gen_diff = st.select_slider("Difficulty Level:", options=["easy", "challenging", "nightmare"])
                gen_issues = st.text_input("Compound Issues:", value="Missing dish, Rider delay, Payment double charged")
                
                if st.form_submit_button("✨ Generate AI Scenario", use_container_width=True):
                    from src.agents.scenario_generator import scenario_generator_agent
                    with st.spinner("AI is generating custom scenario..."):
                        gen_sc = scenario_generator_agent.generate_scenario(
                            product_context=gen_product,
                            difficulty=gen_diff,
                            compound_issues=[x.strip() for x in gen_issues.split(",") if x.strip()]
                        )
                        new_sc_dict = {
                            "id": f"ai_gen_{random.randint(1000,9999)}",
                            "title": gen_sc.title,
                            "customer_persona": gen_sc.customer_persona,
                            "problem_description": gen_sc.problem_description,
                            "product_context": gen_sc.product_context,
                            "emotional_start": gen_sc.emotional_start.value,
                            "context": f"Generated {gen_diff.upper()} scenario.",
                            "key_issues": [gen_issues],
                            "resolution_path": "Verify order, de-escalate, apply refund/voucher if needed."
                        }
                        real_scenarios.append(new_sc_dict)
                        spath = os.path.join(os.path.dirname(__file__), "..", "..", "data", "scenarios.json")
                        with open(spath, "w", encoding="utf-8") as f:
                            json.dump(real_scenarios, f, indent=2)
                        st.success(f"Generated and saved new scenario '{gen_sc.title}'!")
                        st.rerun()

        # Out-of-the-Box Set 2 Feature 5: Visual Scenario Decision Tree Builder
        with st.expander("🗺️ Visual Scenario Decision Tree Builder", expanded=False):
            st.markdown("Build interactive branching decision-tree pathways for customer support training.")
            with st.form("tree_builder_form"):
                tree_title = st.text_input("Tree Scenario Title:", placeholder="e.g. VIP Subscription Cancellation Request")
                tree_node1 = st.text_input("Node 1 (Opening Customer Trigger):", value="Customer says: 'I want to cancel my Gold Membership and get a refund.'")
                tree_branch_a = st.text_input("Branch A (If Agent Apologizes + Offers Coupon):", value="Customer Outcome: Accepts coupon, stays subscribed. (CSAT 4.8 ⭐)")
                tree_branch_b = st.text_input("Branch B (If Agent Rejects Refund):", value="Customer Outcome: Escalates to supervisor, threatens Twitter. (CSAT 1.5 ⭐)")

                if st.form_submit_button("🌳 Save Decision Tree Scenario", use_container_width=True):
                    tree_sc = {
                        "id": f"tree_{random.randint(1000,9999)}",
                        "title": f"🗺️ Tree: {tree_title.strip() or 'Branching Scenario'}",
                        "customer_persona": "VIP Customer",
                        "problem_description": tree_node1,
                        "product_context": "Zomato Gold",
                        "emotional_start": "frustrated",
                        "context": f"Branch A: {tree_branch_a} | Branch B: {tree_branch_b}",
                        "key_issues": ["cancellation", "branching_tree"],
                        "resolution_path": "Branch A (Empathetic Counter-Offer)"
                    }
                    real_scenarios.append(tree_sc)
                    spath = os.path.join(os.path.dirname(__file__), "..", "..", "data", "scenarios.json")
                    with open(spath, "w", encoding="utf-8") as f:
                        json.dump(real_scenarios, f, indent=2)
                    st.success(f"Saved Decision Tree Scenario '{tree_title}'!")
                    st.rerun()

        st.markdown("#### Existing Scenarios")
        for sc in real_scenarios:
            with st.expander(f"🎬 {sc.get('title', 'No Title')} ({sc.get('id')})"):
                st.markdown(f"**Persona:** {sc.get('customer_persona')}")
                st.markdown(f"**Product:** {sc.get('product_context')} | **Problem:** {sc.get('problem_description')}")
                st.markdown(f"**Emotion:** `{sc.get('emotional_start')}`")
                st.markdown(f"**Context:** {sc.get('context')}")
                st.markdown(f"**Resolution Path:** {sc.get('resolution_path')}")

    with tab4:
        st.markdown("### 📚 Manage Knowledge Base (RAG Console)")
        st.caption("Inspect, query, index, and debug vector-similarity search matches in ChromaDB.")

        sub_tabs = st.tabs(["Search Debugger", "Index New Document", "Chunking Simulator", "Indexing Admin"])
        
        with sub_tabs[0]:
            st.markdown("#### 🔍 Vector Search Debugger")
            st.caption("Search query text against ChromaDB and see relevance matches.")
            q_text = st.text_input("Enter search query:", placeholder="e.g. payment deducted or server crash")
            q_k = st.slider("Max Results (top_k)", 1, 10, 3)
            
            if q_text:
                import re
                results = knowledge_base.search(q_text, top_k=q_k)
                if results:
                    st.success(f"Found {len(results)} matches:")
                    for idx, res in enumerate(results):
                        pct = int(res.relevance_score * 100)
                        highlighted_content = res.content
                        words = [w.strip() for w in re.split(r'\W+', q_text) if len(w.strip()) > 2]
                        for w in words:
                            highlighted_content = re.sub(
                                f"(?i)({re.escape(w)})", 
                                r'<mark style="background-color: rgba(245, 158, 11, 0.4); color: var(--text)">\1</mark>', 
                                highlighted_content
                            )
                        
                        st.markdown(
                            f'<div style="background:var(--surface-overlay);border:1px solid var(--border);border-radius:12px;padding:12px;margin-bottom:12px">'
                            f'<div style="display:flex;justify-content:space-between">'
                            f'<span style="font-weight:700;color:var(--text)">#{idx+1} {res.title}</span>'
                            f'<span style="font-weight:700;color:var(--text-accent)">{pct}% match</span>'
                            f'</div>'
                            f'<div style="font-size:0.75em;color:var(--text-muted);margin:4px 0">Source: {res.source}</div>'
                            f'<div style="font-size:0.85em;color:var(--text);line-height:1.5;margin-top:8px">{highlighted_content}</div>'
                            f'</div>',
                            unsafe_allow_html=True
                        )
                else:
                    st.info("No matching articles found in ChromaDB.")

        with sub_tabs[1]:
            st.markdown("#### ➕ Index New Document")
            st.caption("Write a support document / policy card and write it directly to the knowledge base.")
            
            with st.form("new_doc_form"):
                doc_filename = st.text_input("File Name (must end in .json or .txt)", placeholder="e.g. faq_api_limits.json")
                doc_title = st.text_input("Document Title", placeholder="e.g. API Gateway Rate Limits & Errors")
                doc_content = st.text_area("Document Content (the text to index)", placeholder="e.g. Stripe API rate limit is 100 requests per second. If limit exceeded, it returns HTTP 429 Too Many Requests...")
                doc_keywords = st.text_input("Keywords (comma-separated)", placeholder="e.g. API, rate limit, HTTP 429, throttling")
                doc_category = st.text_input("Category", placeholder="e.g. technical")
                
                doc_submitted = st.form_submit_button("Index Document", use_container_width=True)
                if doc_submitted:
                    if not doc_filename or not doc_title or not doc_content:
                        st.error("Please fill in File Name, Title, and Content.")
                    else:
                        if not doc_filename.endswith((".json", ".txt")):
                            doc_filename += ".json"
                        
                        fpath = os.path.join("data", "knowledge_base", doc_filename)
                        os.makedirs(os.path.dirname(fpath), exist_ok=True)
                        
                        doc_data = {
                            "title": doc_title.strip(),
                            "category": doc_category.strip() or "general",
                            "content": doc_content.strip(),
                            "keywords": [x.strip() for x in doc_keywords.split(",") if x.strip()]
                        }
                        
                        with open(fpath, "w", encoding="utf-8") as f:
                            json.dump(doc_data, f, indent=2)
                        
                        count = knowledge_base.ingest_file(fpath)
                        st.success(f"Successfully indexed document '{doc_title}' ({count} chunks created)!")
                        st.rerun()

        with sub_tabs[2]:
            st.markdown("#### 📑 Document Chunking Simulator")
            st.caption("Preview how raw text will be split into chunks before writing it to vector database.")
            raw_chunk_text = st.text_area("Paste raw text here:", height=150, placeholder="e.g. Paste a long document here to see how it splits...")
            sim_chunk_size = st.slider("Chunk Size Limit (Characters)", 200, 1000, 500)
            
            if st.button("Simulate Chunking", use_container_width=True) and raw_chunk_text.strip():
                orig_size = settings.chunk_size
                settings.chunk_size = sim_chunk_size
                sim_chunks = knowledge_base._split_text(raw_chunk_text)
                settings.chunk_size = orig_size
                
                st.info(f"Generated {len(sim_chunks)} chunks:")
                for idx, chunk in enumerate(sim_chunks):
                    st.markdown(
                        f'<div style="background:var(--surface-overlay);border:1px solid var(--border-glow);border-radius:10px;padding:10px;margin-bottom:8px">'
                        f'<div style="font-weight:700;color:var(--text-accent);font-size:0.85em">CHUNK #{idx+1} ({len(chunk)} characters)</div>'
                        f'<div style="font-size:0.85em;color:var(--text);margin-top:6px;line-height:1.4">{chunk}</div>'
                        f'</div>',
                        unsafe_allow_html=True
                    )

        with sub_tabs[3]:
            st.markdown("#### ⚙️ Indexing & Vector DB Admin")
            st.caption("Manage collection lifecycle and view files indexed.")
            
            kb_dir = os.path.join("data", "knowledge_base")
            if os.path.exists(kb_dir):
                files = os.listdir(kb_dir)
                st.markdown(f"**Files currently on disk (`data/knowledge_base/`):** `{len(files)}` files")
                for f in files:
                    fpath = os.path.join(kb_dir, f)
                    fsize = os.path.getsize(fpath)
                    st.caption(f"- 📄 `{f}` ({fsize} bytes)")
            
            st.divider()
            
            st.warning("⚠️ High Risk Action: Wiping and rebuilding index will reset ChromaDB.")
            col_adm1, col_adm2 = st.columns(2)
            with col_adm1:
                if st.button("Wipe Vector DB Collection", type="secondary", use_container_width=True):
                    knowledge_base.documents = []
                    st.success("Successfully cleared Knowledge Base!")
                    st.rerun()
            with col_adm2:
                if st.button("Full Ingest & Rebuild Index", type="primary", use_container_width=True):
                    knowledge_base.documents = []
                    count = knowledge_base.ingest_directory(kb_dir)
                    st.success(f"Indexed {count} chunks from directory successfully!")
                    st.rerun()

    with tab5:
        st.markdown("## 💡 How CoachAI Works — Complete Platform User Manual")
        st.caption("Comprehensive user guide and technical manual explaining how CoachAI operates, how all 15 specialized AI agents function, how RAG operates, and how to practice live support.")

        st.markdown("<div style='height: 10px;'></div>", unsafe_allow_html=True)

        # 3-Step Visual Cards
        c1, c2, c3 = st.columns(3)
        with c1:
            st.markdown(
                """
                <div style="background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; text-align: center; height: 100%;">
                    <div style="font-size: 2.2rem; margin-bottom: 8px;">1️⃣</div>
                    <div style="font-weight: 800; font-size: 1.1rem; color: #ffffff; margin-bottom: 6px;">Simulate Real Customer Scenarios</div>
                    <p style="font-size: 0.85rem; color: #94a3b8; line-height: 1.4;">
                        Select real-world scenarios across Zomato (Biryani Blues), Pizza Hut, Starbucks, or SaaS platforms to practice handling angry or confused customers.
                    </p>
                </div>
                """,
                unsafe_allow_html=True
            )
        with c2:
            st.markdown(
                """
                <div style="background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; text-align: center; height: 100%;">
                    <div style="font-size: 2.2rem; margin-bottom: 8px;">2️⃣</div>
                    <div style="font-weight: 800; font-size: 1.1rem; color: #ffffff; margin-bottom: 6px;">Real-Time AI Copilot Assistance</div>
                    <div style="font-size: 0.85rem; color: #94a3b8; line-height: 1.4;">
                        Get live CSAT forecasts (⭐ 4.8), 1-click Autopilot smart response recommendations, patience timers, and instant policy search.
                    </div>
                </div>
                """,
                unsafe_allow_html=True
            )
        with c3:
            st.markdown(
                """
                <div style="background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; text-align: center; height: 100%;">
                    <div style="font-size: 2.2rem; margin-bottom: 8px;">3️⃣</div>
                    <div style="font-weight: 800; font-size: 1.1rem; color: #ffffff; margin-bottom: 6px;">Instant Quality Audit & Scoring</div>
                    <div style="font-size: 0.85rem; color: #94a3b8; line-height: 1.4;">
                        Receive automated ISO-9001 quality audit reports, empathy breakdowns, communication tips, and hall of fame entries.
                    </div>
                </div>
                """,
                unsafe_allow_html=True
            )

        st.markdown("<div style='height: 20px;'></div>", unsafe_allow_html=True)
        st.divider()

        # Section 2: Complete Directory of 15 Specialized AI Agents
        st.markdown("### 🌟 Directory of 15 Out-Of-The-Box Specialized AI Agents & Widgets")

        ac1, ac2 = st.columns(2)
        with ac1:
            st.markdown(
                """
                <div style="background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 14px 18px; margin-bottom: 12px;">
                    <b style="color: #38bdf8; font-size: 1rem;">1. 🧠 AI Customer Mind Reader</b>
                    <p style="font-size: 0.85rem; color: #cbd5e1; margin-top: 4px; margin-bottom: 2px;">
                        <b>Function:</b> Analyzes the customer's raw text and reveals what they are secretly thinking in their head vs what they actually typed.
                    </p>
                    <span style="font-size: 0.75rem; color: #94a3b8;">File: <code>src/agents/customer_mind_reader.py</code></span>
                </div>
                <div style="background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 14px 18px; margin-bottom: 12px;">
                    <b style="color: #38bdf8; font-size: 1rem;">2. 🔮 AI Multiverse Time-Travel Simulator</b>
                    <p style="font-size: 0.85rem; color: #cbd5e1; margin-top: 4px; margin-bottom: 2px;">
                        <b>Function:</b> Simulates alternate realities side-by-side (Timeline A: Empathetic vs Timeline B: Policy Refusal) with predicted CSAT outcomes.
                    </p>
                    <span style="font-size: 0.75rem; color: #94a3b8;">File: <code>src/agents/multiverse_simulator.py</code></span>
                </div>
                <div style="background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 14px 18px; margin-bottom: 12px;">
                    <b style="color: #38bdf8; font-size: 1rem;">3. 🤖 1-Click AI Auto-Pilot</b>
                    <p style="font-size: 0.85rem; color: #cbd5e1; margin-top: 4px; margin-bottom: 2px;">
                        <b>Function:</b> Autonomously drafts and submits the perfect empathetic, policy-compliant reply with a single click.
                    </p>
                    <span style="font-size: 0.75rem; color: #94a3b8;">File: <code>src/agents/auto_pilot_agent.py</code></span>
                </div>
                <div style="background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 14px 18px; margin-bottom: 12px;">
                    <b style="color: #38bdf8; font-size: 1rem;">4. 🚨 Competitor Defection Alarm</b>
                    <p style="font-size: 0.85rem; color: #cbd5e1; margin-top: 4px; margin-bottom: 2px;">
                        <b>Function:</b> Detects customer threats to switch to competitors (Swiggy/UberEats) and pairs with retention discount codes (<code>STAY15</code>).
                    </p>
                    <span style="font-size: 0.75rem; color: #94a3b8;">File: <code>src/agents/competitor_defection_agent.py</code></span>
                </div>
                <div style="background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 14px 18px; margin-bottom: 12px;">
                    <b style="color: #38bdf8; font-size: 1rem;">5. 📢 Viral Threat Predictor</b>
                    <p style="font-size: 0.85rem; color: #cbd5e1; margin-top: 4px; margin-bottom: 2px;">
                        <b>Function:</b> Calculates social media escalation risk % (Twitter/X viral potential) and generates pre-approved PR statements.
                    </p>
                    <span style="font-size: 0.75rem; color: #94a3b8;">File: <code>src/agents/viral_threat_predictor.py</code></span>
                </div>
                <div style="background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 14px 18px; margin-bottom: 12px;">
                    <b style="color: #38bdf8; font-size: 1rem;">6. 🕵️ Fraud & Scammer Shield</b>
                    <p style="font-size: 0.85rem; color: #cbd5e1; margin-top: 4px; margin-bottom: 2px;">
                        <b>Function:</b> Flags fake missing item claims, refund abuse patterns, and past scam history.
                    </p>
                    <span style="font-size: 0.75rem; color: #94a3b8;">File: <code>src/agents/fraud_detector.py</code></span>
                </div>
                <div style="background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 14px 18px;">
                    <b style="color: #38bdf8; font-size: 1rem;">7. 📋 ISO-9001 QA Audit Generator</b>
                    <p style="font-size: 0.85rem; color: #cbd5e1; margin-top: 4px; margin-bottom: 2px;">
                        <b>Function:</b> Audits completed transcripts against official contact center quality compliance standards.
                    </p>
                    <span style="font-size: 0.75rem; color: #94a3b8;">File: <code>src/agents/qa_audit_agent.py</code></span>
                </div>
                """,
                unsafe_allow_html=True
            )
        with ac2:
            st.markdown(
                """
                <div style="background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 14px 18px; margin-bottom: 12px;">
                    <b style="color: #38bdf8; font-size: 1rem;">8. 📊 Live Agent Cognitive Load Monitor</b>
                    <p style="font-size: 0.85rem; color: #cbd5e1; margin-top: 4px; margin-bottom: 2px;">
                        <b>Function:</b> Monitors support agent focus score and workload stress levels in real time to prevent agent burnout.
                    </p>
                    <span style="font-size: 0.75rem; color: #94a3b8;">File: <code>src/agents/cognitive_load_agent.py</code></span>
                </div>
                <div style="background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 14px 18px; margin-bottom: 12px;">
                    <b style="color: #38bdf8; font-size: 1rem;">9. ⏱️ Customer Patience Countdown Clock</b>
                    <p style="font-size: 0.85rem; color: #cbd5e1; margin-top: 4px; margin-bottom: 2px;">
                        <b>Function:</b> Live countdown timer showing how many turns remain before the customer hangs up or demands a manager.
                    </p>
                    <span style="font-size: 0.75rem; color: #94a3b8;">File: <code>src/agents/patience_clock_agent.py</code></span>
                </div>
                <div style="background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 14px 18px; margin-bottom: 12px;">
                    <b style="color: #38bdf8; font-size: 1rem;">10. 🎙️ Voice Stress Frequency Meter</b>
                    <p style="font-size: 0.85rem; color: #cbd5e1; margin-top: 4px; margin-bottom: 2px;">
                        <b>Function:</b> Analyzes speech pitch variation (Hz) and audio stress levels for call center reps.
                    </p>
                    <span style="font-size: 0.75rem; color: #94a3b8;">File: <code>src/ui/voice_stress_widget.py</code></span>
                </div>
                <div style="background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 14px 18px; margin-bottom: 12px;">
                    <b style="color: #38bdf8; font-size: 1rem;">11. 🍱 Zomato Order Header Card</b>
                    <p style="font-size: 0.85rem; color: #cbd5e1; margin-top: 4px; margin-bottom: 2px;">
                        <b>Function:</b> Displays live food order summary, item list (Biryani Blues), payment status (GPay), and address.
                    </p>
                    <span style="font-size: 0.75rem; color: #94a3b8;">File: <code>src/ui/zomato_widgets.py</code></span>
                </div>
                <div style="background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 14px 18px; margin-bottom: 12px;">
                    <b style="color: #38bdf8; font-size: 1rem;">12. 🚴 Live Rider Tracking Status</b>
                    <p style="font-size: 0.85rem; color: #cbd5e1; margin-top: 4px; margin-bottom: 2px;">
                        <b>Function:</b> Tracks delivery partner Ramesh Kumar • 1.2 km away • ETA 8 mins + direct call button.
                    </p>
                    <span style="font-size: 0.75rem; color: #94a3b8;">File: <code>src/ui/zomato_widgets.py</code></span>
                </div>
                <div style="background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 14px 18px; margin-bottom: 12px;">
                    <b style="color: #38bdf8; font-size: 1rem;">13. ⚔️ Support Survival Arcade Engine</b>
                    <p style="font-size: 0.85rem; color: #cbd5e1; margin-top: 4px; margin-bottom: 2px;">
                        <b>Function:</b> High-stakes arcade game mode where reps handle 4 simultaneous customer queues before team HP runs out.
                    </p>
                    <span style="font-size: 0.75rem; color: #94a3b8;">File: <code>src/arcade/survival_engine.py</code></span>
                </div>
                <div style="background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 14px 18px;">
                    <b style="color: #38bdf8; font-size: 1rem;">14 & 15. 🏆 Golden Vault & Auto KB Approvals</b>
                    <p style="font-size: 0.85rem; color: #cbd5e1; margin-top: 4px; margin-bottom: 2px;">
                        <b>Function:</b> Archives top 1% benchmark responses in Hall of Fame and manages auto-drafted KB articles.
                    </p>
                    <span style="font-size: 0.75rem; color: #94a3b8;">File: <code>src/vault/golden_vault.py</code></span>
                </div>
                """,
                unsafe_allow_html=True
            )

        st.markdown("<div style='height: 20px;'></div>", unsafe_allow_html=True)
        st.divider()

        # Section 3: Technical Architecture & Algorithms Accordion
        with st.expander("🔬 Technical Deep-Dive: System Architecture & Algorithms", expanded=False):
            st.markdown("#### 🗺️ End-to-End System Architecture")
            st.markdown("""
            - **Frontend**: Streamlit 1.32+ with custom Dark Slate CSS.
            - **AI Gateway**: Groq Llama 3.3 70B Versatile & Google Gemini 1.5 Pro.
            - **RAG Engine**: Sub-5ms Pure Python BM25 / TF-IDF Vector Search.
            - **Backend Framework**: Decoupled Python Orchestrator with 23 Specialized Agents.
            """)
            st.markdown("#### 🧮 Sentiment & Frustration Meter Decay Formula")
            st.latex(r"F_{t+1} = \alpha \cdot F_t + (1 - \alpha) \cdot S_{\text{turn}}")
            st.caption("• α = 0.35 is the decay memory weight for customer emotional smoothing.")
        
    with tab6:
        st.markdown("### 📝 Pending KB Approvals")
        st.caption("Review and approve Knowledge Base articles automatically drafted by the AutoKBAgent.")
        pending_dir = os.path.join("data", "knowledge_base", "pending")
        if not os.path.exists(pending_dir):
            os.makedirs(pending_dir, exist_ok=True)
            
        pending_files = [f for f in os.listdir(pending_dir) if f.endswith(".json")]
        
        if not pending_files:
            st.info("No pending KB articles to review.")
        else:
            for f in pending_files:
                fpath = os.path.join(pending_dir, f)
                try:
                    with open(fpath, "r", encoding="utf-8") as file:
                        kb_data = json.load(file)
                except Exception:
                    continue
                    
                with st.expander(f"Draft: {kb_data.get('title', 'Untitled')} ({f})", expanded=False):
                    st.markdown(f"**Category:** {kb_data.get('category', 'N/A')}")
                    st.markdown(f"**Keywords:** {', '.join(kb_data.get('keywords', []))}")
                    st.markdown(f"**Content:**\n{kb_data.get('content', '')}")
                    
                    col_approve, col_reject = st.columns(2)
                    with col_approve:
                        if st.button("Approve & Index", key=f"approve_{f}", type="primary"):
                            import shutil
                            dest_path = os.path.join("data", "knowledge_base", f)
                            shutil.move(fpath, dest_path)
                            knowledge_base.ingest_file(dest_path)
                            st.success(f"Approved and indexed {f}!")
                            st.rerun()
                    with col_reject:
                        if st.button("Reject & Delete", key=f"reject_{f}", type="secondary"):
                            os.remove(fpath)
                            st.warning(f"Deleted draft {f}.")
                            st.rerun()

    if st.button("Start Session", type="primary", use_container_width=True):
        st.session_state.humor_mode = humor_mode
        st.session_state.ml_tier = ml_tier
        st.session_state.ui_agent_name = agent_name
        st.session_state.ui_product_context = product_context
        st.session_state.ui_interaction_mode = mode
        _start_session(
            mode, agent_name, product_context,
            scenario_choice if mode == "simulator" else None,
            emotional_start if mode == "simulator" else None,
            selected_transcript if mode == "replay" else None,
            st.session_state.risk_threshold / 100.0,
        )
def _start_quick(mode: str):
    orch = st.session_state.orchestrator
    scenarios = orch.list_scenarios()
    choice = list(scenarios.keys())[0] if mode == "simulator" and scenarios else None
    transcript = None
    if mode == "replay":
        transcripts = orch.list_transcripts()
        if not transcripts:
            st.warning("No transcripts found in data/transcripts/. Add one to use Replay mode.")
            return
        transcript = transcripts[0]
    _start_session(mode, "Agent", "SaaS Platform", choice, "neutral", transcript)


def _start_session(mode, agent_name, product_context, scenario_choice, emotional_start, transcript_name, risk_threshold=0.7):
    scenario = None
    transcript_path = None
    if mode == "simulator" and scenario_choice:
        real_scenarios = st.session_state.orchestrator.session_config_module.load_real_scenarios()
        selected_real = None
        for rs in real_scenarios:
            if rs["id"] == scenario_choice:
                selected_real = rs
                break
        if selected_real:
            scenario = st.session_state.orchestrator.session_config_module.create_scenario_from_real(selected_real)
        else:
            scenario = st.session_state.orchestrator.session_config_module.create_scenario(
                title=scenario_choice, problem_description=scenario_choice,
                customer_persona="Customer", product_context=product_context,
                emotional_start=emotional_start or "neutral",
            )
    if mode == "replay" and transcript_name:
        transcript_path = os.path.join("data", "transcripts", transcript_name)

    session = st.session_state.orchestrator.start_session(
        mode=InteractionMode(mode), agent_name=agent_name,
        product_context=product_context, scenario=scenario,
        transcript_path=transcript_path, risk_threshold=risk_threshold,
    )

    cm = st.session_state.orchestrator.conversation_manager
    cm.humor_mode = st.session_state.get("humor_mode", False)
    cm.hinglish_mode = st.session_state.get("hinglish_mode", False)

    if mode == "simulator":
        st.session_state.last_turn = (
            session.turn_analyses[-1] if session.turn_analyses else None
        )
    st.session_state.session = session
    st.session_state.page = "coaching"
    st.rerun()


def compute_copilot_analysis(session, last_turn):
    """Run the LLM-backed copilot agents once per turn and cache the results.

    Without this, every Streamlit rerun (i.e. every button click) would re-fire
    5-6 blocking LLM calls, freezing the UI and burning through the API rate
    limit. We memoise by (session, turn, whether the agent has replied yet) so
    the pipeline only runs when the turn actually changes.
    """
    sig = (session.session_id, last_turn.turn_number, bool(last_turn.agent_message))
    cache = st.session_state.get("_copilot_cache")
    if cache and cache.get("sig") == sig:
        return cache["data"]

    from src.agents.predictive_csat import predictive_csat_agent
    from src.agents.manager_supervisor import manager_supervisor_agent
    from src.agents.patience_clock_agent import patience_clock_agent
    from src.agents.cognitive_load_agent import cognitive_load_agent
    from src.agents.fraud_detector import fraud_detector_agent
    from src.agents.viral_threat_predictor import viral_threat_predictor_agent
    from src.agents.customer_mind_reader import customer_mind_reader_agent
    from src.agents.competitor_defection_agent import competitor_defection_agent

    context = session.get_conversation_context()
    ia = last_turn.intent_analysis
    with st.spinner("🧠 Running AI copilot analysis..."):
        data = {
            "csat": predictive_csat_agent.evaluate(last_turn.customer_message, last_turn.agent_message, ia),
            "mgr": manager_supervisor_agent.evaluate_intervention(
                last_turn.customer_message, last_turn.agent_message, ia, last_turn.escalation_assessment),
            "patience": patience_clock_agent.evaluate_patience(last_turn.customer_message, session.current_turn, ia),
            "cognitive": cognitive_load_agent.evaluate_cognitive_load(last_turn.customer_message, ia),
            "fraud": fraud_detector_agent.evaluate_fraud_risk(last_turn.customer_message, context),
            "viral": viral_threat_predictor_agent.evaluate_viral_threat(last_turn.customer_message, context),
            "mind": customer_mind_reader_agent.read_customer_mind(last_turn.customer_message, context),
            "defection": competitor_defection_agent.evaluate_defection(last_turn.customer_message, context),
        }
    st.session_state["_copilot_cache"] = {"sig": sig, "data": data}
    return data


def coaching_page():
    session = st.session_state.session
    if not session:
        st.session_state.page = "setup"
        st.rerun()
        return

    # Prefill the agent reply box from any quick-action button BEFORE widgets render
    if "pending_agent_text" in st.session_state and st.session_state["pending_agent_text"]:
        val = st.session_state.pop("pending_agent_text")
        st.session_state["agent_input_sim"] = val
        st.session_state["agent_input_man"] = val

    render_sidebar()
    render_top_nav_bar()

    cm = st.session_state.orchestrator.conversation_manager

    mode_label = {
        InteractionMode.SIMULATOR: "Simulator",
        InteractionMode.MANUAL: "Manual",
        InteractionMode.REPLAY: "Replay",
    }.get(session.config.mode, "Unknown")

    humor_on = st.session_state.get("humor_mode", False)
    bot_mode = getattr(cm, "bot_mode", "zomato_bot")

    hdr1, hdr2 = st.columns([3, 1])
    with hdr1:
        st.title(f"📞 {session.config.product_context}")
        chat_state = "🤖 Zomato AI Bot" if bot_mode == "zomato_bot" else "🧑‍💼 Live Human Agent"
        st.caption(f"**Mode:** {mode_label} | **Chat State:** `{chat_state}` | **Turn:** {session.current_turn}")
    with hdr2:
        if st.button("🛑 End Session", use_container_width=True, type="primary"):
            report = st.session_state.orchestrator.end_session()
            st.session_state.report = report
            st.session_state.page = "report"
            st.rerun()

    st.divider()

    # Order context cards (read-only) + agent-side quick actions
    from src.ui.zomato_widgets import (
        render_live_sla_ticker,
        render_zomato_order_banner,
        render_rider_status_widget,
        render_agent_quick_actions,
        render_zomato_bot_escalation_card,
    )
    render_live_sla_ticker()
    render_zomato_order_banner()
    render_rider_status_widget()
    render_zomato_bot_escalation_card()

    main_cols = st.columns([6, 4])

    with main_cols[0]:
        st.markdown("### 💬 Live Conversation")
        st.caption(f"{len(session.messages)} message{'s' if len(session.messages) != 1 else ''}")
        
        with st.container(height=520):
            render_conversation_panel(session)

        st.markdown("---")

        if session.config.mode == InteractionMode.SIMULATOR:
            last_turn = session.turn_analyses[-1] if session.turn_analyses else None

            if last_turn and last_turn.agent_message is None and bot_mode == "zomato_bot":
                # ---- First-line automated bot: deflect with options, else escalate ----
                from src.agents.bot_agent import bot_agent
                _ia = last_turn.intent_analysis
                _escalate = bot_agent.should_escalate(last_turn.customer_message, _ia)
                _bot_reply = bot_agent.generate_bot_reply(last_turn.customer_message, _ia)
                st.markdown("#### 🤖 Zomato Assist Bot (First-Line)")
                if _escalate:
                    st.warning(f"⚠️ **Bot can't resolve this** — {bot_agent.escalation_reason(last_turn.customer_message, _ia)} Please transfer to a live agent.")
                st.info(_bot_reply)
                _bc1, _bc2 = st.columns(2)
                with _bc1:
                    if st.button("🤖 Send Bot Reply", use_container_width=True, disabled=_escalate,
                                 help="Bot answers automatically. Disabled when the customer clearly needs a human."):
                        orch = st.session_state.orchestrator
                        orch.process_agent_input(_bot_reply)
                        orch.advance_simulator()
                        st.session_state.last_turn = session.turn_analyses[-1] if session.turn_analyses else None
                        st.rerun()
                with _bc2:
                    if st.button("🧑‍💼 Transfer to Human Agent", type="primary", use_container_width=True):
                        cm.toggle_bot_mode("live_human_agent")
                        st.toast("Transferred to a live human agent — coaching is now active.", icon="🧑‍💼")
                        st.rerun()

            elif last_turn and last_turn.agent_message is None:
                h_head, h_back = st.columns([4, 1])
                with h_head:
                    st.markdown("#### 🧑‍💼 Your Response (Live Agent)")
                with h_back:
                    if st.button("↩️ Bot", use_container_width=True, help="Hand the chat back to the automated bot."):
                        cm.toggle_bot_mode("zomato_bot")
                        st.rerun()
                render_agent_quick_actions()
                agent_text = st.text_area("Write your reply:", key="agent_input_sim", height=90, label_visibility="collapsed", placeholder="Type your response as a support agent...")
                btn_c1, btn_c2 = st.columns([2, 1])
                with btn_c1:
                    if st.button("Submit Response", type="primary", use_container_width=True) and agent_text.strip():
                        st.session_state.orchestrator.process_agent_input(agent_text.strip())
                        st.session_state.last_turn = (
                            session.turn_analyses[-1] if session.turn_analyses else None
                        )
                        st.rerun()
                with btn_c2:
                    if st.button("🛡️ Manager Takeover", use_container_width=True, help="AI Senior Manager steps in to resolve critical issue directly."):
                        from src.agents.manager_supervisor import manager_supervisor_agent
                        mgr_text = manager_supervisor_agent.generate_manager_takeover_response()
                        st.session_state.orchestrator.process_agent_input(mgr_text)
                        st.session_state.last_turn = (
                            session.turn_analyses[-1] if session.turn_analyses else None
                        )
                        st.toast("🛡️ Senior Manager Ramesh Kumar took over ticket!", icon="🛡️")
                        st.rerun()
                with btn_c2:
                    # Feature Set 3 Feature 1: 1-Click AI Auto-Pilot Mode
                    # Fully hands-free: the AI writes the reply, SENDS it itself, runs any
                    # backend action, then lets the customer respond — no typing/submitting.
                    if st.button("🤖 AI Auto-Pilot", type="secondary", use_container_width=True,
                                 help="AI handles this turn end-to-end: writes + sends the reply, then the customer responds."):
                        from src.agents.auto_pilot_agent import auto_pilot_agent
                        orch = st.session_state.orchestrator
                        with st.spinner("🤖 AI Auto-Pilot is handling the customer..."):
                            ap_res = auto_pilot_agent.generate_autopilot_response(
                                last_turn.customer_message, session.get_conversation_context()
                            )
                            # 1) Send the AI-written reply on the agent's behalf
                            orch.process_agent_input(ap_res.suggested_reply)
                            if ap_res.tool_action_executed:
                                st.toast(ap_res.tool_action_executed, icon="🤖")
                            # 2) Let the customer respond so the conversation advances
                            orch.advance_simulator()
                            st.session_state.last_turn = (
                                session.turn_analyses[-1] if session.turn_analyses else None
                            )
                        st.toast("Auto-Pilot replied and advanced the chat.", icon="✅")
                        st.rerun()

                # Feature 1: Agentic Mock Backend Tool Execution Bar
                with st.expander("🛠️ Agentic Tools (Execute Mock Backend Actions)", expanded=True):
                    t_col1, t_col2 = st.columns(2)
                    with t_col1:
                        if st.button("📦 OMS Lookup Order", use_container_width=True):
                            from src.tools.mock_backend import mock_backend
                            res = mock_backend.lookup_order("ORD-8142K")
                            st.toast(res.result_text, icon="📦")
                            st.session_state["pending_agent_text"] = f"I checked your order details: {res.result_text.splitlines()[3]}"
                            st.rerun()
                        if st.button("🎁 Grant ₹150 Voucher", use_container_width=True):
                            from src.tools.mock_backend import mock_backend
                            res = mock_backend.grant_loyalty_voucher("98XXXXXX50", 150)
                            st.toast(res.result_text, icon="🎁")
                            st.session_state["pending_agent_text"] = f"I have issued a promo voucher for you: {res.result_text.splitlines()[1]}"
                            st.rerun()
                    with t_col2:
                        if st.button("💳 Process 50% Refund", use_container_width=True):
                            from src.tools.mock_backend import mock_backend
                            res = mock_backend.process_refund("ORD-8142K", 250, "Missing main course dish")
                            st.toast(res.result_text, icon="💳")
                            st.session_state["pending_agent_text"] = f"I have processed your refund: {res.result_text.splitlines()[1]} (Txn: {res.result_text.splitlines()[3]})"
                            st.rerun()
                        if st.button("🚨 Supervisor Escalation", use_container_width=True):
                            from src.tools.mock_backend import mock_backend
                            res = mock_backend.escalate_to_supervisor("ORD-8142K", "HIGH", "Customer extremely angry over missing food")
                            st.toast(res.result_text, icon="🚨")
                            st.rerun()

            else:
                st.markdown("#### 👤 Customer's Turn")
                if st.button("Next Customer Message", type="primary", use_container_width=True):
                    with st.spinner("Customer is typing..."):
                        reply = st.session_state.orchestrator.advance_simulator()
                    if reply:
                        st.session_state.last_turn = (
                            session.turn_analyses[-1] if session.turn_analyses else None
                        )
                        st.rerun()

        elif session.config.mode == InteractionMode.MANUAL:
            render_agent_quick_actions()
            col_cust, col_agent = st.columns(2)
            with col_cust:
                st.markdown("#### 👤 Customer Input")
                customer_text = st.text_area("Paste customer message:", key="customer_input_man", height=100, label_visibility="collapsed", placeholder="Paste customer message...")
                if st.button("Process Message", type="secondary", use_container_width=True) and customer_text.strip():
                    turn = st.session_state.orchestrator.process_customer_input(customer_text.strip())
                    st.session_state.last_turn = turn
                    st.rerun()
            with col_agent:
                st.markdown("#### 🤖 Your Response")
                agent_text = st.text_area("Write your reply:", key="agent_input_man", height=100, label_visibility="collapsed", placeholder="Type your response...")
                if st.button("Submit Response", type="primary", use_container_width=True) and agent_text.strip():
                    st.session_state.orchestrator.process_agent_input(agent_text.strip())
                    st.session_state.last_turn = (
                        session.turn_analyses[-1] if session.turn_analyses else None
                    )
                    st.rerun()

        elif session.config.mode == InteractionMode.REPLAY:
            if st.button("Next Message", type="primary", use_container_width=True):
                transcript = session.config.transcript_path
                if transcript and os.path.exists(transcript):
                    msgs = st.session_state.orchestrator.session_config_module.load_transcript(
                        os.path.basename(transcript)
                    )
                    idx = len(session.messages)
                    if idx < len(msgs):
                        msg = msgs[idx]
                        if msg["role"] == "customer":
                            turn = st.session_state.orchestrator.process_customer_input(msg["content"])
                            st.session_state.last_turn = turn
                        elif msg["role"] == "agent":
                            st.session_state.orchestrator.process_agent_input(msg["content"])
                        st.rerun()
                    else:
                        st.info("End of transcript reached.")

    with main_cols[1]:
        st.markdown("### 🎯 Copilot & Analytics")
        st.caption("Live AI Coaching")
        
        # Feature 2: Predictive CSAT & Churn Forecast Card
        last_turn = session.turn_analyses[-1] if session.turn_analyses else None
        if last_turn and last_turn.intent_analysis:
            cp = compute_copilot_analysis(session, last_turn)
            csat_res = cp["csat"]
            mgr_res = cp["mgr"]
            pat_res = cp["patience"]
            cog_res = cp["cognitive"]
            fraud_res = cp["fraud"]
            viral_res = cp["viral"]
            mind_res = cp["mind"]
            def_res = cp["defection"]

            # Feature 3: Manager Intervention Banner
            if mgr_res.requires_intervention:
                st.warning(f"🤫 **Manager Whisper ({mgr_res.intervention_type.upper()}):** {mgr_res.whisper_note}\n\n*Action:* {mgr_res.suggested_action}")

            st.markdown(
                f"""
                <div style="
                    background: linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.85) 100%);
                    backdrop-filter: blur(16px);
                    border: 1px solid rgba(99, 102, 241, 0.35);
                    border-radius: 16px;
                    padding: 16px 18px;
                    margin-bottom: 14px;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
                ">
                    <div style="font-weight: 800; font-size: 1.05rem; color: white; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
                        <span>🔮 Predictive CSAT & Churn Radar</span>
                        <span style="font-size:0.72rem; background:rgba(99, 102, 241, 0.2); color:#a5b4fc; padding:3px 10px; border-radius:20px; font-weight:700;">LIVE AI FORECAST</span>
                    </div>
                    <div style="display: flex; gap: 12px; margin-bottom: 12px;">
                        <div style="flex: 1; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); padding: 12px 14px; border-radius: 12px;">
                            <div style="font-size: 0.72rem; color: #94a3b8; font-weight: 700; text-transform:uppercase;">Predicted CSAT</div>
                            <div style="font-family: 'Outfit', sans-serif; font-size: 1.55rem; font-weight: 800; color: #fbbf24; margin: 4px 0;">⭐ {csat_res.predicted_csat:.1f} <span style="font-size: 0.85rem; color: #94a3b8;">/ 5.0</span></div>
                            <div style="font-size: 0.72rem; color: {'#34d399' if csat_res.csat_delta >= 0 else '#f87171'}; font-weight: 700;">{csat_res.csat_delta:+.1f} trend</div>
                        </div>
                        <div style="flex: 1; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); padding: 12px 14px; border-radius: 12px;">
                            <div style="font-size: 0.72rem; color: #94a3b8; font-weight: 700; text-transform:uppercase;">Churn Risk</div>
                            <div style="font-family: 'Outfit', sans-serif; font-size: 1.55rem; font-weight: 800; color: {'#f87171' if csat_res.churn_risk_pct > 50 else '#34d399'}; margin: 4px 0;">🔥 {csat_res.churn_risk_pct:.0f}%</div>
                            <div style="font-size: 0.72rem; color: {'#f87171' if csat_res.churn_delta > 0 else '#34d399'}; font-weight: 700;">{csat_res.churn_delta:+.0f}% risk shift</div>
                        </div>
                    </div>
                    <div style="font-size: 0.82rem; color: #cbd5e1; background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.3); padding: 8px 12px; border-radius: 8px; font-weight: 600;">
                        💡 <b>Action to Boost CSAT:</b> {csat_res.recommended_action_to_boost}
                    </div>
                </div>
                """,
                unsafe_allow_html=True
            )

            # Out-of-the-Box Set 3 Feature 2 & 4: Patience Clock & Agent Cognitive Load
            pc_c1, pc_c2 = st.columns(2)
            pc_c1.metric("⏳ Patience Clock", f"{pat_res.patience_turns_remaining} Turns Left", delta=pat_res.urgency_level)
            pc_c2.metric("🧠 Agent Load", f"{cog_res.cognitive_load_pct:.0f}%", delta=cog_res.ticket_complexity)

            # Out-of-the-Box Feature 2: Fraud & Scammer Shield
            if fraud_res.fraud_risk_score > 30.0:
                with st.expander(f"🕵️ Fraud Shield Alert ({fraud_res.risk_category})", expanded=True):
                    st.error(f"**Fraud Risk Score:** `{fraud_res.fraud_risk_score:.0f}%`")
                    for flag in fraud_res.historical_red_flags:
                        st.markdown(f"- ⚠️ {flag}")
                    st.caption(f"**Protocol:** {fraud_res.recommended_protocol}")

            # Out-of-the-Box Feature 4: Viral Social Media Threat Predictor
            if viral_res.is_viral_threat or viral_res.viral_risk_score > 50.0:
                with st.expander(f"📢 Viral PR Threat Warning ({viral_res.platform_risk})", expanded=True):
                    st.warning(f"**Viral Escalation Risk:** `{viral_res.viral_risk_score:.0f}%`")
                    st.markdown(f"**Triggers:** {', '.join(viral_res.key_threat_triggers)}")
                    st.info(f"**Preapproved PR Statement:**\n\"{viral_res.preapproved_pr_statement}\"")

            # Out-of-the-Box Set 2 Feature 1: AI Customer Mind Reader
            st.info(f"🧠 **Customer Mind Reader (Internal Monologue):**\n\n💭 *\"{mind_res.internal_monologue}\"*\n\n**True Secret Intent:** {mind_res.true_intent}")

            # Out-of-the-Box Set 2 Feature 2: Competitor Defection Alarm
            if def_res.is_defection_threat or def_res.defection_risk_pct > 40.0:
                with st.expander(f"🚨 Competitor Defection Alarm ({def_res.competitor_mentioned})", expanded=True):
                    st.error(f"**Defection Risk:** `{def_res.defection_risk_pct:.0f}%` (Threatening to switch to {def_res.competitor_mentioned})")
                    st.success(f"**Retention Counter-Offer:** {def_res.retention_counter_offer}")

            # Out-of-the-Box Feature 1: AI Multiverse Parallel Branching
            with st.expander("🔮 Multiverse Parallel Time-Travel", expanded=False):
                st.caption("Simulate two parallel alternate realities (Choice A vs Choice B) for this turn.")
                if st.button("✨ Simulate Alternate Timelines", use_container_width=True):
                    from src.agents.multiverse_simulator import multiverse_simulator_agent
                    with st.spinner("AI is calculating multiverse outcomes..."):
                        branch = multiverse_simulator_agent.simulate_multiverse(last_turn.customer_message, session.current_turn)
                        st.session_state["active_branch"] = branch

                if "active_branch" in st.session_state:
                    b = st.session_state["active_branch"]
                    mb_col1, mb_col2 = st.columns(2)
                    with mb_col1:
                        st.markdown("**Timeline A (Empathetic)**")
                        st.code(b.option_a_text, language="markdown")
                        st.success(f"Outcome: {b.option_a_outcome} (CSAT: {b.option_a_csat:.1f}⭐)")
                    with mb_col2:
                        st.markdown("**Timeline B (Strict Policy)**")
                        st.code(b.option_b_text, language="markdown")
                        st.error(f"Outcome: {b.option_b_outcome} (CSAT: {b.option_b_csat:.1f}⭐)")

        with st.container(border=True):
            if session.turn_analyses:
                import plotly.graph_objects as go
                turns = [t.turn_number for t in session.turn_analyses]
                frustration = [t.intent_analysis.frustration_level * 100 if t.intent_analysis else 0 for t in session.turn_analyses]
                
                fig = go.Figure()
                fig.add_trace(go.Scatter(
                    x=turns, y=frustration, mode='lines+markers', name='Frustration', 
                    line=dict(color='#ef4444', width=3), marker=dict(size=8, color='#dc2626')
                ))
                
                fig.update_layout(
                    title="Customer Heartbeat",
                    height=200,
                    margin=dict(l=20, r=20, t=30, b=20),
                    paper_bgcolor='rgba(0,0,0,0)',
                    plot_bgcolor='rgba(0,0,0,0)',
                    font=dict(color='#94a3b8', size=10),
                    xaxis=dict(showgrid=False, tickmode='linear'),
                    yaxis=dict(showgrid=True, gridcolor='rgba(255,255,255,0.05)', range=[0, 100])
                )
                st.plotly_chart(fig, use_container_width=True)
            
            analyzed = len([t for t in session.turn_analyses if t.coaching_feedback])
            if analyzed > 0:
                render_coaching_panel(st.session_state.last_turn, session)
            else:
                st.info("Waiting for agent response to provide coaching...")
                
        st.markdown("#### 📚 Relevant Articles")
        with st.container(border=True):
            render_knowledge_panel(st.session_state.last_turn, session)


def generate_markdown_report(report, session=None) -> str:
    if not report:
        return "# Session Report\n\nNo report data available."

    rq = report.resolution_quality
    lines = [
        f"# Session Executive Report - {report.session_id}",
        f"**Agent**: {report.agent_name or 'Agent'}",
        f"**Mode**: {report.interaction_mode.value.title()}",
        f"**Generated At**: {report.generated_at}",
        f"**Overall Quality Score**: {round(report.overall_score * 100)}/100",
        f"**Total Turns**: {report.total_turns}",
        "",
        "## Resolution Summary",
    ]
    if rq:
        lines.extend([
            f"- Resolution score: {round(rq.score * 100)}%",
            f"- Issue resolved: {'Yes' if rq.issue_resolved else 'No'}",
            f"- Customer satisfied: {'Yes' if rq.customer_satisfied else 'No'}",
            f"- Escalation needed: {'Yes' if rq.escalation_needed else 'No'}",
        ])
    else:
        lines.append("- Session completed.")

    lines.extend(["", "## Key Recommendations"])
    if report.coaching_recommendations:
        lines.extend([f"- {r}" for r in report.coaching_recommendations])
    else:
        lines.append("- Continue maintaining fast first-response times.")

    if report.escalation_triggers:
        lines.extend(["", "## Escalation Triggers"])
        lines.extend([f"- {t}" for t in report.escalation_triggers])

    if report.knowledge_gaps:
        lines.extend(["", "## Knowledge Gaps"])
        lines.extend([f"- {g}" for g in report.knowledge_gaps])

    return "\n".join(lines)


def report_page():
    render_sidebar()

    st.title("Session Complete")

    if st.session_state.report:
        render_performance_report(st.session_state.report)
        md = generate_markdown_report(st.session_state.report, st.session_state.session)
        st.download_button(
            "Export Report as Markdown",
            data=md,
            file_name=f"session_report_{st.session_state.report.session_id}.md",
            mime="text/markdown",
            use_container_width=True,
        )

        st.markdown("---")
        # Out-of-the-Box Set 3 Feature 3: ISO-9001 QA Compliance Audit Certificate Generator
        from src.agents.qa_audit_agent import qa_audit_agent
        qa_res = qa_audit_agent.audit_session(st.session_state.report)
        with st.expander(f"📋 ISO-9001 QA Audit Certificate ({qa_res.audit_stamp})", expanded=True):
            st.success(f"**Official Audit Stamp:** `{qa_res.audit_stamp}` | **ISO QA Score:** `{qa_res.iso_score}%`")
            qa_c1, qa_c2, qa_c3 = st.columns(3)
            qa_c1.metric("First Contact Resolution", "PASSED" if qa_res.fcr_status else "FAILED")
            qa_c2.metric("Greeting Standards", "PASSED" if qa_res.greeting_passed else "FAILED")
            qa_c3.metric("Empathy Checklist", "PASSED" if qa_res.empathy_passed else "FAILED")

        st.markdown("---")
        # Feature 5: Automated Jira Bug & Root-Cause Generator
        with st.expander("🐞 Auto-Generate Engineering Jira Bug Ticket", expanded=True):
            st.markdown("Analyzes conversation turns to detect system flaws, packing errors, or merchant failures, then formats a ready-to-file Jira ticket.")
            if st.button("✨ Generate Jira Bug Ticket", type="secondary", use_container_width=True):
                from src.agents.jira_bug_generator import jira_bug_generator_agent
                with st.spinner("AI is inspecting conversation for engineering defects..."):
                    sess = st.session_state.session
                    messages = sess.messages if sess else []
                    turns = sess.turn_analyses if sess else []
                    ticket = jira_bug_generator_agent.generate_jira_ticket(
                        messages, turns, product_context=sess.config.product_context if sess else "Zomato"
                    )
                    st.session_state["jira_ticket"] = ticket
                    st.success(f"Generated Ticket {ticket.ticket_id}: {ticket.summary}")

            if "jira_ticket" in st.session_state:
                t = st.session_state["jira_ticket"]
                st.info(
                    f"### 📋 {t.ticket_id}: {t.summary}\n"
                    f"**Type:** `{t.issue_type}` | **Priority:** `{t.priority}` | **Component:** `{t.component}`\n\n"
                    f"**Description:** {t.description}\n\n"
                    f"**Suggested Fix:** {t.suggested_fix}"
                )
                jira_md = f"# [{t.ticket_id}] {t.summary}\n\n**Type:** {t.issue_type}\n**Priority:** {t.priority}\n**Component:** {t.component}\n\n## Description\n{t.description}\n\n## Steps to Reproduce\n" + "\n".join(f"1. {s}" for s in t.steps_to_reproduce) + f"\n\n## Suggested Fix\n{t.suggested_fix}"
                st.download_button("📥 Download Jira Ticket Markdown", data=jira_md, file_name=f"jira_{t.ticket_id}.md", use_container_width=True)
    else:
        st.warning("No report available.")

    st.divider()
    col1, col2, col3 = st.columns(3)
    if col1.button("New Session", use_container_width=True, type="primary"):
        reset_session()
        st.session_state.page = "setup"
        st.rerun()
    if col2.button("Analytics", use_container_width=True):
        st.session_state.page = "analytics"
        st.rerun()


def analytics_page():
    render_sidebar()

    st.markdown(
        """
        <div style="
            background: linear-gradient(135deg, rgba(79, 70, 229, 0.25) 0%, rgba(124, 58, 237, 0.2) 100%);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(165, 180, 252, 0.3);
            border-radius: 18px;
            padding: 20px 24px;
            margin-bottom: 20px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        ">
            <h2 style="margin:0; font-size:1.8rem; font-weight:800; color:white;">📊 Performance Analytics & Golden Vault</h2>
            <p style="margin:4px 0 0 0; color:#cbd5e1; font-size:0.95rem;">Operational quality trends, ISO-9001 compliance scores, and Hall of Fame training benchmarks.</p>
        </div>
        """,
        unsafe_allow_html=True
    )

    trends = st.session_state.orchestrator.get_performance_trends()

    mcols = st.columns(3)
    for i, (label, value) in enumerate([
        ("Total Sessions", str(trends["total_sessions"])),
        ("Avg Resolution", "%d%%" % (trends["avg_resolution_score"] * 100)),
        ("Avg Overall", "%d%%" % (trends["avg_overall_score"] * 100)),
    ]):
        with mcols[i]:
            st.metric(label, value)

    if trends["score_history"]:
        st.markdown("#### Score Trend")
        import pandas as pd
        st.line_chart(pd.DataFrame(trends["score_history"]), x="session", y="score")

    col1, col2 = st.columns(2)
    with col1:
        if trends["common_escalation_triggers"]:
            st.markdown("#### Escalation Triggers")
            for t, c in trends["common_escalation_triggers"]:
                st.markdown(f"- {t} (x{c})")
        if trends["agent_improvement_areas"]:
            st.markdown("#### Improvement Areas")
            for a, c in trends["agent_improvement_areas"]:
                st.markdown(f"- {a}")
        if trends["common_knowledge_gaps"]:
            st.markdown("#### Knowledge Gaps")
            for g, c in trends["common_knowledge_gaps"]:
                st.markdown(f"- {g}")

    st.markdown("---")
    # Out-of-the-Box Set 2 Feature 3: Hall of Fame & Hall of Shame Golden Vault
    st.markdown("### 🏆 Golden Vault: Hall of Fame & Hall of Shame")
    st.caption("Benchmark training library archiving top 1% masterclasses and catastrophic failures.")
    from src.modules.hall_of_fame import hall_of_fame_vault
    entries = hall_of_fame_vault.get_all_entries()
    
    hof_cols = st.columns(2)
    with hof_cols[0]:
        st.markdown("#### 🏆 Hall of Fame (Masterclasses)")
        for e in entries:
            if e.get("category") == "Hall of Fame":
                with st.container(border=True):
                    st.markdown(f"**{e.get('title')}**")
                    st.caption(e.get("summary"))
                    st.success(f"Score: {int(e.get('overall_score', 0)*100)}%")
    with hof_cols[1]:
        st.markdown("#### 💀 Hall of Shame (Roast Archive)")
        for e in entries:
            if e.get("category") == "Hall of Shame":
                with st.container(border=True):
                    st.markdown(f"**{e.get('title')}**")
                    st.caption(e.get("summary"))
                    st.error(f"Score: {int(e.get('overall_score', 0)*100)}%")

    st.divider()
    if st.button("Back to Start", use_container_width=True):
        reset_session()
        st.session_state.page = "setup"
        st.rerun()


def survival_arcade_page():
    render_sidebar()

    st.markdown(
        """
        <div style="
            background: linear-gradient(135deg, rgba(220, 38, 38, 0.25) 0%, rgba(185, 28, 28, 0.2) 100%);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(248, 113, 113, 0.35);
            border-radius: 18px;
            padding: 20px 24px;
            margin-bottom: 20px;
            box-shadow: 0 8px 25px rgba(220, 38, 38, 0.2);
        ">
            <h2 style="margin:0; font-size:1.8rem; font-weight:800; color:#fca5a5;">⚔️ Support Survival Arcade Challenge</h2>
            <p style="margin:4px 0 0 0; color:#fecdd3; font-size:0.95rem;">High-stakes contact center simulation! Manage 4 angry customer tickets simultaneously before team HP runs out!</p>
        </div>
        """,
        unsafe_allow_html=True
    )

    from src.modules.survival_game import survival_game_engine
    state = survival_game_engine.state

    mcols = st.columns(5)
    mcols[0].metric("Health Bar (HP)", f"❤️ {state.health} HP")
    mcols[1].metric("Arcade Score", f"⭐ {state.score} Pts")
    mcols[2].metric("Streak Combo", f"🔥 x{state.streak}")
    mcols[3].metric("Tickets Resolved", f"✅ {survival_game_engine.get_resolved_count()} / 4")
    mcols[4].metric("Active Power-Up", state.active_powerup or "None")

    if state.is_game_over or state.health <= 0:
        st.error("☠️ GAME OVER! Your health reached 0 HP. Customers escalated to CEO!")
        if st.button("🔄 Restart Game & Generate 4 New Customers", type="primary", use_container_width=True):
            survival_game_engine.start_new_game()
            st.session_state.pop("arcade_last_feedback", None)
            st.rerun()
        return

    st.divider()
    st.markdown("### 🚨 Multi-Ticket Support Desk (4 Angry Customers Active)")
    st.caption("Select a customer tab below to review their issue and submit a response before their timer runs out!")

    if "arcade_last_feedback" in st.session_state:
        fb = st.session_state["arcade_last_feedback"]
        if "EXCELLENT" in fb or "GOOD" in fb:
            st.success(fb)
        else:
            st.error(fb)

    # Render Tabs for 4 Active Customers
    tickets = survival_game_engine.active_tickets
    tab_titles = [
        f"{'✅' if t.is_resolved else '👤'} {t.customer_name} ({t.issue_title})"
        for t in tickets
    ]
    tabs = st.tabs(tab_titles)

    for i, (tab, ticket) in enumerate(zip(tabs, tickets)):
        with tab:
            if ticket.is_resolved:
                st.success(f"✅ **Ticket Resolved!** Customer: {ticket.customer_name}")
                st.info(f"**Issue:** {ticket.problem_description}\n\n**Agent Reply Sent:** \"{ticket.agent_reply}\"")
            else:
                st.warning(f"**Customer:** {ticket.customer_name} | **Urgency:** `{ticket.urgency_level}` | ⏳ **Timer:** `{ticket.timer_seconds}s Remaining`")
                st.markdown(f"**Issue Details:** *\"{ticket.problem_description}\"*")

                with st.form(f"arcade_reply_form_{i}", clear_on_submit=True):
                    reply_text = st.text_area(f"Type reply for {ticket.customer_name}:", placeholder="Type an empathetic reply, apology, and resolution...", key=f"tck_input_{i}")
                    b_col1, b_col2 = st.columns([3, 1])
                    with b_col1:
                        submitted = st.form_submit_button("🚀 Submit Resolution", type="primary", use_container_width=True)
                    with b_col2:
                        use_powerup = st.form_submit_button("⚡ Use Power-Up", use_container_width=True) if state.active_powerup else False

                if submitted and reply_text.strip():
                    state, feedback = survival_game_engine.process_ticket_turn(i, reply_text, turn_time_seconds=12)
                    st.session_state["arcade_last_feedback"] = feedback
                    st.rerun()
                elif use_powerup and state.active_powerup:
                    state.health = min(100, state.health + 25)
                    st.session_state["arcade_last_feedback"] = f"⚡ Power-Up Used: {state.active_powerup}! Restored +25 HP!"
                    state.active_powerup = None
                    st.rerun()

    st.markdown("---")
    c1, c2 = st.columns(2)
    with c1:
        if st.button("🔄 Restart & Get 4 Fresh Random Customers", use_container_width=True):
            survival_game_engine.start_new_game()
            st.session_state.pop("arcade_last_feedback", None)
            st.rerun()
    with c2:
        if st.button("🚪 Exit Arcade Mode", use_container_width=True):
            st.session_state.page = "setup"
            st.rerun()


def main():
    st.set_page_config(page_title="CoachAI", layout="wide", initial_sidebar_state="expanded")
    inject_global_css()
    init_session_state()
    page_map = {
        "setup": setup_page,
        "coaching": coaching_page,
        "report": report_page,
        "analytics": analytics_page,
        "survival": survival_arcade_page,
    }
    page_map.get(st.session_state.page, setup_page)()


if __name__ == "__main__":
    main()
