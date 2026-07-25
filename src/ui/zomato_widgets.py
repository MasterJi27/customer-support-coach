import streamlit as st
from src.core.models import OrderHeaderCard, RiderStatusCard

def render_live_sla_ticker():
    """
    Renders an authentic Enterprise Contact Center Floor SLA Alert Marquee Ticker.
    """
    st.markdown(
        """
        <div style="
            background: rgba(15, 23, 42, 0.75);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(99, 102, 241, 0.3);
            border-radius: 12px;
            padding: 10px 18px;
            margin-bottom: 16px;
            font-size: 0.82rem;
            color: #f8fafc;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-family: 'Plus Jakarta Sans', monospace;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        ">
            <div>
                <span style="background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); color: white; padding: 3px 10px; border-radius: 6px; font-weight: 800; margin-right: 12px; font-size: 0.72rem; letter-spacing: 0.05em; box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);">🚨 SLA MONITOR</span>
                <span>Active Desk Queue: <b style="color: #ffffff;">4 Tickets</b> | Avg Response Time: <b style="color: #34d399;">14.2s</b> | CSAT Target: <b style="color: #fbbf24;">4.8 ⭐</b></span>
            </div>
            <div>
                <span style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.35); color: #34d399; padding: 4px 12px; border-radius: 20px; font-weight: 700; font-size: 0.75rem;">🟢 System Health: 99.9%</span>
            </div>
        </div>
        """,
        unsafe_allow_html=True
    )


def render_zomato_order_banner(order: OrderHeaderCard | None = None):
    """
    Renders an authentic Zomato Order Header Card at the top of the chat.
    """
    if not order:
        order = OrderHeaderCard()

    st.markdown(
        f"""
        <div style="
            background: rgba(17, 24, 39, 0.8);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(99, 102, 241, 0.3);
            border-radius: 14px;
            padding: 16px 20px;
            margin-bottom: 16px;
            font-family: 'Plus Jakarta Sans', sans-serif;
            color: white;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
        ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <div style="font-weight: 800; font-size: 1.15rem; color: #f87171; display: flex; align-items: center; gap: 8px;">
                    🍱 {order.restaurant_name} <span style="font-size: 0.82rem; color: #94a3b8; font-weight: 500;">({order.order_id})</span>
                </div>
                <div style="background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.4); color: #fca5a5; padding: 4px 14px; border-radius: 20px; font-size: 0.78rem; font-weight: 800; letter-spacing: 0.03em; box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2);">
                    {order.order_status}
                </div>
            </div>
            <div style="font-size: 0.9rem; color: #e2e8f0; margin-bottom: 12px; font-weight: 500;">
                <b>Items:</b> {order.items_summary}
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: #94a3b8; border-top: 1px solid rgba(99, 102, 241, 0.2); padding-top: 10px;">
                <span>Total: <b style="color: white; font-weight: 700;">₹{int(order.order_amount)}</b> ({order.payment_method})</span>
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
                background: rgba(17, 24, 39, 0.75);
                backdrop-filter: blur(12px);
                border: 1px solid rgba(99, 102, 241, 0.25);
                border-radius: 14px;
                padding: 14px 18px;
                margin-bottom: 14px;
                font-family: 'Plus Jakarta Sans', sans-serif;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 800; color: #34d399; font-size: 0.95rem; display: flex; align-items: center; gap: 8px;">🚴 Delivery Partner Status</span>
                    <span style="background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.4); color: #6ee7b7; padding: 3px 12px; border-radius: 20px; font-size: 0.78rem; font-weight: 700;">ETA: {rider.eta_mins} mins ({rider.distance_km} km away)</span>
                </div>
                <div style="font-size: 0.85rem; color: #94a3b8; margin-top: 8px;">
                    Rider: <b style="color: white">{rider.rider_name}</b> | Phone: <b style="color: white">{rider.rider_phone}</b>
                </div>
            </div>
            """,
            unsafe_allow_html=True
        )
    with col2:
        if st.button("📞 Call Rider", use_container_width=True):
            st.toast(f"📞 Dialing Ramesh Kumar ({rider.rider_phone})...", icon="📞")

def render_zomato_bot_escalation_card():
    """
    Renders Zomato Bot Escalation Card indicator when automated bot transfers chat to human agent.
    """
    st.markdown(
        """
        <div style="
            background: rgba(30, 41, 59, 0.7);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(99, 102, 241, 0.3);
            border-radius: 12px;
            padding: 12px 16px;
            margin-bottom: 14px;
            font-size: 0.85rem;
            color: #94a3b8;
            display: flex;
            align-items: center;
            justify-content: space-between;
        ">
            <span>🤖 <b>Zomato AI Bot Escalation:</b> Customer requested human support executive</span>
            <span style="background: rgba(99, 102, 241, 0.25); border: 1px solid rgba(99, 102, 241, 0.4); color: #a5b4fc; padding: 3px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 700;">HANDOVER COMPLETE</span>
        </div>
        """,
        unsafe_allow_html=True
    )

def render_agent_quick_actions():
    """Agent-side quick actions."""
    st.markdown("**⚡ Quick Agent Response Templates**")
    st.caption("Click to pre-fill your reply box below — then edit and submit.")

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
