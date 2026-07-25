import streamlit as st
from src.core.models import OrderHeaderCard, RiderStatusCard

def render_live_sla_ticker():
    """
    Renders an authentic Enterprise Contact Center Floor SLA Alert Marquee Ticker.
    """
    st.markdown(
        """
        <div style="
            background: #18181b;
            border: 1px solid #27272a;
            border-radius: 10px;
            padding: 10px 16px;
            margin-bottom: 14px;
            font-size: 0.8rem;
            color: #f4f4f5;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-family: 'Plus Jakarta Sans', monospace;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        ">
            <div>
                <span style="background: #dc2626; color: white; padding: 3px 8px; border-radius: 6px; font-weight: 800; margin-right: 10px; font-size: 0.72rem; letter-spacing: 0.05em;">🚨 SLA MONITOR</span>
                <span>Active Desk Queue: <b>4 Tickets</b> | Avg Response Time: <b style="color: #34d399;">14.2s</b> | CSAT Target: <b style="color: #fbbf24;">4.8 ⭐</b></span>
            </div>
            <div>
                <span style="background: #27272a; border: 1px solid #3f3f46; color: #a1a1aa; padding: 3px 10px; border-radius: 20px; font-weight: 700; font-size: 0.75rem;">🟢 System Health: 99.9%</span>
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
            background: #18181b;
            border: 1px solid #27272a;
            border-radius: 12px;
            padding: 16px 18px;
            margin-bottom: 14px;
            font-family: 'Plus Jakarta Sans', sans-serif;
            color: white;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
        ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="font-weight: 800; font-size: 1.15rem; color: #f87171; display: flex; align-items: center; gap: 8px;">
                    🍱 {order.restaurant_name} <span style="font-size: 0.82rem; color: #a1a1aa; font-weight: 500;">({order.order_id})</span>
                </div>
                <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #fca5a5; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; letter-spacing: 0.03em;">
                    {order.order_status}
                </div>
            </div>
            <div style="font-size: 0.88rem; color: #e4e4e7; margin-bottom: 10px; font-weight: 500;">
                <b>Items:</b> {order.items_summary}
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.78rem; color: #a1a1aa; border-top: 1px solid #27272a; padding-top: 10px;">
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
                background: #18181b;
                border: 1px solid #27272a;
                border-radius: 12px;
                padding: 12px 16px;
                margin-bottom: 12px;
                font-family: 'Plus Jakarta Sans', sans-serif;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 800; color: #34d399; font-size: 0.92rem; display: flex; align-items: center; gap: 6px;">🚴 Delivery Partner Status</span>
                    <span style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #6ee7b7; padding: 2px 10px; border-radius: 20px; font-size: 0.78rem; font-weight: 700;">ETA: {rider.eta_mins} mins ({rider.distance_km} km away)</span>
                </div>
                <div style="font-size: 0.82rem; color: #a1a1aa; margin-top: 6px;">
                    Rider: <b style="color: white">{rider.rider_name}</b> | Phone: <b style="color: white">{rider.rider_phone}</b>
                </div>
            </div>
            """,
            unsafe_allow_html=True
        )
    with col2:
        if st.button("📞 Call Rider", use_container_width=True):
            st.toast(f"📞 Dialing Ramesh Kumar ({rider.rider_phone})...", icon="📞")

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
