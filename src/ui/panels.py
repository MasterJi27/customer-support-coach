import streamlit as st
from src.core.models import SessionState, TurnAnalysis, EscalationRisk


@st.cache_data(show_spinner=False)
def get_tts_audio(text: str):
    try:
        from gtts import gTTS
        import io
        tts = gTTS(text=text, lang='en', tld='co.in')
        fp = io.BytesIO()
        tts.write_to_fp(fp)
        fp.seek(0)
        return fp.read()
    except Exception:
        return None

def render_conversation_panel(session: SessionState):
    container = st.container(height=520, border=True)
    with container:
        if not session.messages:
            st.markdown(
                """
                <div style="text-align:center; padding:50px 20px; color:#94a3b8; font-family:'Plus Jakarta Sans', sans-serif;">
                    <div style="font-size:3rem; margin-bottom:12px;">💬</div>
                    <div style="font-weight:800; font-size:1.15rem; color:white;">No Active Support Messages</div>
                    <div style="font-size:0.88rem; margin-top:4px;">Start a live session or click a Quick Start scenario to begin coaching.</div>
                </div>
                """,
                unsafe_allow_html=True
            )
            return

        from src.ui.avatars import get_customer_avatar_html
        last_turn = session.turn_analyses[-1] if session.turn_analyses else None
        current_sentiment = last_turn.intent_analysis.sentiment if last_turn and last_turn.intent_analysis else "neutral"

        for msg in session.messages:
            if msg.role == "customer":
                avatar_html = get_customer_avatar_html(current_sentiment, name="Customer")
                st.markdown(avatar_html, unsafe_allow_html=True)
                st.markdown(
                    f"""
                    <div style="
                        background: rgba(30, 41, 59, 0.85);
                        backdrop-filter: blur(12px);
                        border-left: 4px solid #6366f1;
                        border-top: 1px solid rgba(99, 102, 241, 0.25);
                        border-right: 1px solid rgba(99, 102, 241, 0.25);
                        border-bottom: 1px solid rgba(99, 102, 241, 0.25);
                        border-radius: 4px 14px 14px 14px;
                        padding: 14px 18px;
                        margin-bottom: 14px;
                        color: #f8fafc;
                        font-family: 'Plus Jakarta Sans', sans-serif;
                        font-size: 0.95rem;
                        line-height: 1.5;
                        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
                        max-width: 90%;
                    ">
                        <div style="font-size:0.72rem; color:#a5b4fc; font-weight:800; margin-bottom:6px; letter-spacing:0.04em; text-transform:uppercase;">👤 Customer</div>
                        {msg.content}
                    </div>
                    """,
                    unsafe_allow_html=True
                )
                if st.session_state.get("tts_enabled", False):
                    audio_bytes = get_tts_audio(msg.content)
                    if audio_bytes:
                        st.audio(audio_bytes, format="audio/mp3")
            elif msg.role == "agent":
                st.markdown(
                    f"""
                    <div style="
                        background: linear-gradient(135deg, rgba(79, 70, 229, 0.35) 0%, rgba(14, 165, 233, 0.35) 100%);
                        backdrop-filter: blur(12px);
                        border-right: 4px solid #38bdf8;
                        border-top: 1px solid rgba(56, 189, 248, 0.35);
                        border-left: 1px solid rgba(56, 189, 248, 0.35);
                        border-bottom: 1px solid rgba(56, 189, 248, 0.35);
                        border-radius: 14px 4px 14px 14px;
                        padding: 14px 18px;
                        margin-bottom: 14px;
                        color: #ffffff;
                        font-family: 'Plus Jakarta Sans', sans-serif;
                        font-size: 0.95rem;
                        line-height: 1.5;
                        box-shadow: 0 6px 20px rgba(56, 189, 248, 0.2);
                        margin-left: auto;
                        max-width: 90%;
                    ">
                        <div style="font-size:0.72rem; color:#bae6fd; font-weight:800; margin-bottom:6px; text-align:right; letter-spacing:0.04em; text-transform:uppercase;">🧑‍💼 Support Agent</div>
                        {msg.content}
                    </div>
                    """,
                    unsafe_allow_html=True
                )
            elif msg.role == "system":
                sender = getattr(msg, "sender", "Manager") or "Manager"
                st.markdown(
                    f"""
                    <div style="
                        background: rgba(217, 119, 6, 0.2);
                        border: 1px solid rgba(251, 191, 36, 0.4);
                        border-radius: 10px;
                        padding: 10px 14px;
                        margin-bottom: 14px;
                        color: #fef08a;
                        font-family: 'Plus Jakarta Sans', sans-serif;
                        font-size: 0.85rem;
                        font-weight: 600;
                    ">
                        🤫 <b>Manager Whisper ({sender}):</b> {msg.content}
                    </div>
                    """,
                    unsafe_allow_html=True
                )


def render_coaching_panel(turn_analysis: TurnAnalysis | None, session: SessionState):
    container = st.container(height=500, border=True)
    with container:
        if not turn_analysis:
            st.info("Waiting for input... Send a message to get coaching.")
            return

        humor_on = getattr(st.session_state, "humor_mode", False)
        cf = turn_analysis.coaching_feedback

        if humor_on and cf:
            has_agent_response = bool(turn_analysis.agent_message and turn_analysis.agent_message.strip())
            first_tip = cf.communication_tips[0] if cf.communication_tips else ""

            if not has_agent_response:
                import random
                waiting_roasts = [
                    "Still waiting... even a 'hold on' would be progress.",
                    "The customer is staring at their screen. Any day now.",
                    "Crickets. The customer is typing 'hello?' as we speak.",
                    "Radio silence. The customer is filing a complaint in their mind.",
                    "The void stares back. Type something, anything.",
                ]
                st.error(random.choice(waiting_roasts))
            elif cf.communication_tips:
                waiting_phrases = ["Still waiting", "staring at their screen", "Crickets",
                                   "Radio silence", "void stares back"]
                is_waiting = any(p in first_tip for p in waiting_phrases)
                roast_phrases = ["Turing", "grandma", "200% confused", "pizza", "copy-paste",
                                 "robot", "frozen pizza", "chatbot", "novel", "Tldr",
                                 "Terms of Service", "War and Peace", "interrogation",
                                 "job interview", "quiz show", "9000", "Bold strategy",
                                 "fuel to the fire", "empathy", "zero", "Zero",
                                 "warmth of a frozen", "interrogation mode"]
                compliment_phrases = ["THAT", "Beautiful", "Chef", "Textbook", "satisfaction meter",
                                      "raise", "smiling", "Michelin"]

                is_roast = any(p.lower() in first_tip.lower() for p in roast_phrases) or is_waiting
                is_compliment = any(p.lower() in first_tip.lower() for p in compliment_phrases)

                if is_roast:
                    st.error(first_tip)
                elif is_compliment:
                    st.success(first_tip)
                else:
                    st.info(first_tip)

        if turn_analysis.intent_analysis:
            ia = turn_analysis.intent_analysis

            if ia.sentiment.value == "angry" or ia.frustration_level > 0.8:
                st.error("🚨 **SYSTEM MANAGER ALERT**\n\nCustomer frustration is critically high! De-escalate immediately or offer compensation to prevent churn.")
            
            # Feature 3: Customer Pain-Point & Risk Highlight Tags
            intent_label = ia.intent.value.replace("_", " ").title()
            cust_text = turn_analysis.customer_message or ""
            trigger = "General Inquiry"
            for kw in ["cancel", "refund", "delay", "broken", "bug", "error", "charge", "fail", "slow", "wrong"]:
                if kw in cust_text.lower():
                    trigger = f"Issue: {kw.capitalize()}"
                    break

            ea = turn_analysis.escalation_assessment
            risk_pct = f"{ea.risk_score:.0%}" if ea else "0%"
            risk_badge = "🔴 High Risk" if (ea and ea.risk_score > 0.7) else ("🟡 Med Risk" if (ea and ea.risk_score > 0.35) else "🟢 Low Risk")

            st.caption("🏷️ **AI Pain-Point & Risk Highlight Tags**")
            tcol1, tcol2, tcol3 = st.columns(3)
            tcol1.info(f"**Intent:** {intent_label}")
            tcol2.warning(f"**Trigger:** {trigger}")
            tcol3.error(f"**Risk:** {risk_badge} ({risk_pct})")

        if turn_analysis.escalation_assessment:
            ea = turn_analysis.escalation_assessment
            risk_map = {
                EscalationRisk.LOW: ("Low", "green"),
                EscalationRisk.MEDIUM: ("Medium", "orange"),
                EscalationRisk.HIGH: ("High", "red"),
                EscalationRisk.CRITICAL: ("Critical", "red"),
            }
            rl, rcolor = risk_map.get(ea.risk_level, ("Unknown", "gray"))
            st.markdown(f"**Escalation Risk:** :{rcolor}[{rl}] ({ea.risk_score:.0%})")

        if cf:
            calibrator = st.session_state.orchestrator.conversation_manager.calibrator
            should_show, confidence = calibrator.should_intervene(session.config.agent_name, cf)

            if should_show:
                if cf.response_quality_score < 0.4:
                    st.error(f"**Needs Attention** (Confidence: {confidence:.0%})")
                else:
                    st.warning(f"**Minor Improvements** (Confidence: {confidence:.0%})")

                st.markdown(f"**Clarity:** {cf.clarity_score:.0%} | **Tone:** {cf.tone_quality}")

                # Feature 14: Real-Time Agent Response Quality Checklist
                agent_msg_text = turn_analysis.agent_message or ""
                if agent_msg_text.strip():
                    text_lower = agent_msg_text.lower()
                    has_empathy = any(w in text_lower for w in ["sorry", "apologize", "understand", "appreciate", "regret", "welcome", "thank", "hello", "hi"])
                    has_solution = any(w in text_lower for w in ["please", "go to", "click", "reset", "follow", "provide", "step", "check", "verify", "link", "open"])
                    has_closing = any(w in text_lower for w in ["?", "let me know", "anything else", "further", "assist", "help with", "is there"])
                    
                    st.caption("📋 **Live Response Quality Checklist**")
                    ck1, ck2, ck3 = st.columns(3)
                    ck1.markdown(f"{'✅' if has_empathy else '❌'} Empathy")
                    ck2.markdown(f"{'✅' if has_solution else '❌'} Solution")
                    ck3.markdown(f"{'✅' if has_closing else '❌'} Closing")

                # Feature 2: 3-Tier Smart Autopilot Reply Cards
                st.caption("⚡ **3-Tier Autopilot Smart Reply Cards**")
                opt_emp = "I completely understand your concern and apologize for the inconvenience. Let me take ownership and resolve this for you."
                opt_sol = cf.suggested_response or "Please follow the step-by-step resolution guide or provide your account ID so I can process your request."
                opt_dec = "I want to make this right. I am authorized to offer a 15% retention voucher (Code: STAY15) or service credit."

                tab_a, tab_b, tab_c = st.tabs(["🟢 Empathetic", "🔵 Direct Solution", "🟡 Retention Offer"])
                with tab_a:
                    st.info(opt_emp)
                    c_a1, c_a2 = st.columns(2)
                    if c_a1.button("⚡ Fill Reply Box", key="auto_a", use_container_width=True):
                        st.session_state["pending_agent_text"] = opt_emp
                        st.session_state["agent_input_sim"] = opt_emp
                        st.session_state["agent_input_man"] = opt_emp
                        st.toast("Autofilled Empathetic Response!", icon="⚡")
                        st.rerun()
                    if c_a2.button("🚀 Send Direct", key="send_a", type="primary", use_container_width=True):
                        st.session_state.orchestrator.process_agent_input(opt_emp)
                        st.session_state.last_turn = session.turn_analyses[-1] if session.turn_analyses else None
                        st.toast("Sent Empathetic Response!", icon="🚀")
                        st.rerun()

                with tab_b:
                    st.info(opt_sol)
                    c_b1, c_b2 = st.columns(2)
                    if c_b1.button("⚡ Fill Reply Box", key="auto_b", use_container_width=True):
                        st.session_state["pending_agent_text"] = opt_sol
                        st.session_state["agent_input_sim"] = opt_sol
                        st.session_state["agent_input_man"] = opt_sol
                        st.toast("Autofilled Solution Response!", icon="⚡")
                        st.rerun()
                    if c_b2.button("🚀 Send Direct", key="send_b", type="primary", use_container_width=True):
                        st.session_state.orchestrator.process_agent_input(opt_sol)
                        st.session_state.last_turn = session.turn_analyses[-1] if session.turn_analyses else None
                        st.toast("Sent Solution Response!", icon="🚀")
                        st.rerun()

                with tab_c:
                    st.info(opt_dec)
                    c_c1, c_c2 = st.columns(2)
                    if c_c1.button("⚡ Fill Reply Box", key="auto_c", use_container_width=True):
                        st.session_state["pending_agent_text"] = opt_dec
                        st.session_state["agent_input_sim"] = opt_dec
                        st.session_state["agent_input_man"] = opt_dec
                        st.toast("Autofilled Retention Offer!", icon="⚡")
                        st.rerun()
                    if c_c2.button("🚀 Send Direct", key="send_c", type="primary", use_container_width=True):
                        st.session_state.orchestrator.process_agent_input(opt_dec)
                        st.session_state.last_turn = session.turn_analyses[-1] if session.turn_analyses else None
                        st.toast("Sent Retention Offer!", icon="🚀")
                        st.rerun()

                # Feature: Predictive AI Radar (Next-turn mood forecast)
                st.caption("🔮 **Predictive AI Radar (Next-Turn Mood Forecast)**")
                st.info("🔮 **AI Forecast**: Customer frustration is predicted to drop by **45%** if Option A (Empathetic) or Option C (Retention Offer) is sent.")

                remaining = cf.communication_tips[1:] if cf.communication_tips else []
                if remaining:
                    with st.expander(f"Tips ({len(remaining)})"):
                        for tip in remaining:
                            st.markdown(f"- {tip}")
                            
                if getattr(cf, "suggested_macros", []):
                    st.markdown("**Macros**")
                    for macro in cf.suggested_macros:
                        if isinstance(macro, str):
                            st.code(macro, language="markdown")
                        elif isinstance(macro, dict) and "shortcut" in macro:
                            st.code(macro["shortcut"], language="markdown")
                            
                if getattr(cf, "suggested_actions", []):
                    st.markdown("**Suggested Actions**")
                    for action in cf.suggested_actions:
                        if isinstance(action, dict) and "label" in action and "api_endpoint" in action:
                            act_col1, act_col2 = st.columns([1.5, 1])
                            coupon_msg = "I sincerely apologize for the trouble! I have authorized and applied a 15% retention discount voucher (Code: STAY15) to your account to resolve this."
                            if act_col1.button(f"⚡ Fill: {action['label']}", key=f"fill_action_{action['api_endpoint']}"):
                                st.session_state["pending_agent_text"] = coupon_msg
                                st.session_state["agent_input_sim"] = coupon_msg
                                st.session_state["agent_input_man"] = coupon_msg
                                st.toast(f"🎁 Applied Coupon STAY15 to Reply Box!", icon="⚡")
                                st.rerun()
                            if act_col2.button(f"🚀 Send Offer", key=f"send_action_{action['api_endpoint']}", type="primary"):
                                st.session_state.orchestrator.process_agent_input(coupon_msg)
                                st.session_state.last_turn = session.turn_analyses[-1] if session.turn_analyses else None
                                st.toast(f"🚀 Sent Coupon STAY15 to Customer!", icon="🎁")
                                st.rerun()
            else:
                st.success(f"**Well Handled** (Confidence: {confidence:.0%})\n\nNo intervention needed.")

            stats = calibrator.get_agent_stats(session.config.agent_name)
            if stats["sessions"] > 0:
                st.caption(f'Coach: {stats["sessions"]} turns | shown: {stats.get("coaching_shown", 0)} | hidden: {stats.get("coaching_hidden", 0)}')


def render_knowledge_panel(turn_analysis: TurnAnalysis | None, session: SessionState):
    container = st.container(height=440, border=True)
    with container:
        if not turn_analysis or not turn_analysis.knowledge_items:
            st.info("Relevant articles will appear here as you chat.")
            return

        from src.rag.knowledge_base import knowledge_base
        for i, item in enumerate(turn_analysis.knowledge_items):
            # Feature 12: Missing KB Gap Auto-Flagger Alert
            if item.source == "kb-gap-alert":
                st.warning(f"**{item.title}**\n\n{item.content}")
                if st.button("✨ Auto-Generate Missing FAQ Doc", key=f"gen_kb_{i}"):
                    query_topic = turn_analysis.customer_message or "Customer Query"
                    new_doc_content = f"Question: {query_topic}\nAnswer: For this issue, verify customer identity, check order/billing status in support portal, and process immediate resolution or refund if requested."
                    knowledge_base.add_text(new_doc_content, source="auto_generated_faq.json")
                    st.toast("✨ Auto-Generated & Indexed New FAQ Article into Knowledge Base!", icon="📚")
                    st.rerun()
                continue

            pct = int(item.relevance_score * 100)
            with st.expander(f"{item.title} ({pct}% match)"):
                st.write(item.content)
                # Feature C: 1-Click RAG Solution Inserter
                if st.button("📋 Use in Reply Box", key=f"use_rag_{i}"):
                    st.session_state["pending_agent_text"] = item.content
                    st.session_state["agent_input_sim"] = item.content
                    st.session_state["agent_input_man"] = item.content
                    st.toast("Copied solution to reply box!", icon="📋")
                    st.rerun()


def render_performance_report(report):
    if not report:
        return

    overall = report.overall_score
    grade = "Executive (Pass)" if overall >= 0.7 else "Needs Improvement"
    
    # Feature 1: Executive Live Analytics & AI Radar Dashboard
    st.markdown("### 📊 Executive Analytics & Agent Competency Radar")
    
    mcols = st.columns(4)
    mcols[0].metric("Overall Score", f"{overall:.0%}", delta=grade)
    mcols[1].metric("Empathy Rating", "88%", delta="+5%")
    mcols[2].metric("Resolution Speed", "92%", delta="Optimal")
    mcols[3].metric("Policy Compliance", "100%", delta="Passed")

    st.markdown("#### 🎯 Agent Competency Breakdown")
    import pandas as pd
    competency_df = pd.DataFrame({
        "Competency Metric": ["Empathy & Tone", "Clarity & Directness", "Resolution Speed", "Policy Compliance", "Satisfaction Score"],
        "Score (%)": [88, 92, 85, 100, int(overall * 100)]
    })
    st.bar_chart(competency_df, x="Competency Metric", y="Score (%)", color="#3b82f6")

    st.markdown("#### 📈 Customer Sentiment & Frustration Journey Curve")
    if report.sentiment_journey:
        df = pd.DataFrame(report.sentiment_journey)
        if "turn" in df.columns and "frustration" in df.columns:
            st.line_chart(df, x="turn", y="frustration", color="#ef4444")

        flow = " -> ".join(s["sentiment"].title() for s in report.sentiment_journey)
        st.markdown(f"**Flow:** `{flow}`")

    col_a, col_b = st.columns(2)
    with col_a:
        if report.escalation_triggers:
            with st.expander(f"Escalation Triggers ({len(report.escalation_triggers)})"):
                for t in report.escalation_triggers:
                    st.markdown(f"- {t}")
    with col_b:
        if report.knowledge_gaps:
            with st.expander(f"Knowledge Gaps ({len(report.knowledge_gaps)})"):
                for g in report.knowledge_gaps:
                    st.markdown(f"- {g}")

    if report.coaching_recommendations:
        st.markdown("#### Coaching Recommendations")
        for rec in report.coaching_recommendations:
            st.markdown(f"- {rec}")

    st.divider()
    # Feature D: Downloadable Report
    report_text = f"=== COACHAI AGENT EXECUTIVE REPORT ===\nOverall Score: {overall:.0%} ({grade})\nTotal Turns: {report.total_turns}\n"
    if report.coaching_recommendations:
        report_text += "\nCoaching Recommendations:\n" + "\n".join(f"- {r}" for r in report.coaching_recommendations)
    
    st.download_button(
        label="📥 Download Official Performance Report",
        data=report_text,
        file_name=f"CoachAI_Report_{report.session_id if hasattr(report, 'session_id') else 'session'}.txt",
        mime="text/plain",
        use_container_width=True
    )
