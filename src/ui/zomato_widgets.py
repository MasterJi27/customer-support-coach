import streamlit as st
from src.core.models import OrderHeaderCard, RiderStatusCard

def render_zomato_order_banner(order: OrderHeaderCard | None = None):
    """
    Renders an authentic Zomato Order Header Card at the top of the chat.
    """
    if not order:
        order = OrderHeaderCard()

    st.markdown(
        f"""
        <div style="
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            border: 1px solid rgba(203, 32, 45, 0.4);
            border-left: 4px solid #cb202d;
            border-radius: 12px;
            padding: 14px 16px;
            margin-bottom: 14px;
            font-family: system-ui, -apple-system, sans-serif;
            color: white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <div style="font-weight: 700; font-size: 1.1rem; color: #f87171;">
                    🍱 {order.restaurant_name} <span style="font-size: 0.8rem; color: #94a3b8; font-weight: normal;">({order.order_id})</span>
                </div>
                <div style="background: rgba(203, 32, 45, 0.2); color: #fca5a5; padding: 2px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700;">
                    {order.order_status}
                </div>
            </div>
            <div style="font-size: 0.85rem; color: #cbd5e1; margin-bottom: 6px;">
                <b>Items:</b> {order.items_summary}
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #94a3b8; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 6px;">
                <span>Total: <b style="color:white">₹{int(order.order_amount)}</b> ({order.payment_method})</span>
                <span>📍 {order.delivery_address}</span>
            </div>
        </div>
        """,
        unsafe_allow_html=True
    )

def render_rider_status_widget(rider: RiderStatusCard | None = None):
    """
    Renders an authentic live delivery rider tracking card.
    """
    if not rider:
        rider = RiderStatusCard()

    col1, col2 = st.columns([3, 1])
    with col1:
        st.markdown(
            f"""
            <div style="
                background: rgba(30, 41, 59, 0.7);
                border: 1px solid rgba(16, 185, 129, 0.3);
                border-radius: 10px;
                padding: 10px 14px;
                margin-bottom: 10px;
                font-family: system-ui, -apple-system, sans-serif;
            ">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-weight:700; color:#34d399; font-size:0.9rem">🚴 Delivery Partner Status</span>
                    <span style="color:white; font-size:0.8rem; font-weight:600">ETA: {rider.eta_mins} mins ({rider.distance_km} km away)</span>
                </div>
                <div style="font-size:0.8rem; color:#94a3b8; margin-top:4px">
                    Rider: <b style="color:white">{rider.rider_name}</b> | Phone: <b style="color:white">{rider.rider_phone}</b>
                </div>
            </div>
            """,
            unsafe_allow_html=True
        )
    with col2:
        if st.button("📞 Call Rider", use_container_width=True):
            st.toast(f"📞 Dialing Ramesh Kumar ({rider.rider_phone})...", icon="📞")

def render_agent_quick_actions():
    """Agent-side quick actions.

    Each button pre-fills the AGENT's reply box with a ready-made professional
    message the agent can review, edit, and then send. These replace the old
    customer-side "quick issue" chips + photo uploader, which used to inject a
    brand-new customer complaint on every click and disrupt the conversation.
    """
    st.markdown("**⚡ Quick Agent Replies**")
    st.caption("Click to pre-fill your reply box below — then edit and hit *Submit Response*.")

    quick = [
        ("🙏 Empathize",
         "I'm really sorry for the trouble this has caused. I completely understand how "
         "frustrating this must be, and I'll personally make sure we get it resolved for you right away."),
        ("🔎 Ask Order ID",
         "To help you as quickly as possible, could you please share your Order ID and registered "
         "phone number so I can pull up the details?"),
        ("📸 Request Photo",
         "Could you please share a quick photo of the item or issue? It will help me verify and "
         "process your resolution much faster."),
        ("💳 Offer Refund",
         "I've looked into your order and I'm initiating a refund for the affected amount right away. "
         "You'll see it credited back to your original payment method shortly."),
    ]
    cols = st.columns(len(quick))
    for i, (label, text) in enumerate(quick):
        if cols[i].button(label, use_container_width=True, key=f"agent_quick_{i}"):
            st.session_state["pending_agent_text"] = text
            st.toast(f"Filled reply box: {label}", icon="⚡")
            st.rerun()


def render_zomato_bot_escalation_card():
    """
    Renders an authentic Zomato AI Bot Prior Chat History & Escalation Banner.
    Shows the automated steps attempted by the bot before transferring to the live human agent.
    """
    bot_mode = st.session_state.get("bot_mode", "zomato_bot")
    
    with st.expander("🤖 Zomato Assist Bot (Prior Chat Transcript & Escalation Log)", expanded=True):
        st.markdown(
            """
            <div style="background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(248, 113, 113, 0.3); border-radius: 10px; padding: 12px; font-size: 0.85rem;">
                <div style="color: #f87171; font-weight: 700; margin-bottom: 6px;">
                    🤖 Zomato AI Bot (First-Line Automated Assistant)
                </div>
                <div style="color: #e2e8f0; margin-bottom: 4px;">
                    <b>Bot:</b> <i>"Namaste! I am Zomato Assist. How can I help with your order ORD-8142K today?"</i>
                </div>
                <div style="color: #94a3b8; margin-bottom: 4px; padding-left: 12px; border-left: 2px solid #38bdf8;">
                    <b>Customer selected:</b> <code>1️⃣ Delivery Delay / Missing Biryani</code>
                </div>
                <div style="color: #e2e8f0; margin-bottom: 4px;">
                    <b>Bot:</b> <i>"Checking live status... Rider Ramesh Kumar is 1.2 km away. ETA 8 mins. Would you like to wait or speak to a live human agent?"</i>
                </div>
                <div style="color: #ef4444; font-weight: 600; margin-top: 6px; padding-left: 12px; border-left: 2px solid #ef4444;">
                    <b>Customer reply:</b> <i>"WHERE IS MY CHICKEN BIRYANI?! I paid ₹250 45 mins ago! Connect me to a human right now!"</i> (Frustration: 90%)
                </div>
                <div style="margin-top: 8px; font-size: 0.75rem; color: #fca5a5; background: rgba(239, 68, 68, 0.15); padding: 4px 8px; border-radius: 6px;">
                    ⚠️ Frustration threshold exceeded (90% > 70% limit). Ticket escalated from <b>Zomato AI Bot</b> ➔ <b>Live Agent</b>.
                </div>
            </div>
            """,
            unsafe_allow_html=True
        )

        st.caption("⚡ **Test Zomato AI Bot Interactive Options:**")
        opt_cols = st.columns(3)
        if opt_cols[0].button("1️⃣ Check Refund", use_container_width=True, key="bot_opt_1"):
            st.info("🤖 **Zomato Bot:** Order ORD-8142K is currently out for delivery. Refund is applicable if delay exceeds 60 mins.")
        if opt_cols[1].button("2️⃣ Double Charge", use_container_width=True, key="bot_opt_2"):
            st.info("🤖 **Zomato Bot:** Found 1 successful transaction ₹250 on GPay. If duplicate deduction occurred, bank will auto-reverse in 3-5 days.")
        if opt_cols[2].button("3️⃣ Escalation to Agent", use_container_width=True, key="bot_opt_3"):
            st.success("🤖 **Zomato Bot:** Connecting you to Ramesh from Live Customer Support...")

