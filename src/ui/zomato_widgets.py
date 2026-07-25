import streamlit as st
from src.core.models import OrderHeaderCard, RiderStatusCard

def render_live_sla_ticker():
    """
    Renders an authentic Enterprise Contact Center Floor SLA Alert Marquee Ticker.
    """
    st.markdown(
        """
        <div style="
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 10px 16px;
            margin-bottom: 14px;
            font-size: 0.8rem;
            color: #0f172a;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-family: 'Plus Jakarta Sans', monospace;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
        ">
            <div>
                <span style="background: #dc2626; color: white; padding: 3px 8px; border-radius: 6px; font-weight: 800; margin-right: 10px; font-size: 0.72rem; letter-spacing: 0.05em;">🚨 SLA MONITOR</span>
                <span>Active Desk Queue: <b>4 Tickets</b> | Avg Response Time: <b style="color: #059669;">14.2s</b> | CSAT Target: <b style="color: #d97706;">4.8 ⭐</b></span>
            </div>
            <div>
                <span style="background: #f1f5f9; border: 1px solid #cbd5e1; color: #475569; padding: 3px 10px; border-radius: 20px; font-weight: 700; font-size: 0.75rem;">🟢 System Health: 99.9%</span>
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
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 16px 18px;
            margin-bottom: 14px;
            font-family: 'Plus Jakarta Sans', sans-serif;
            color: #0f172a;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
        ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="font-weight: 800; font-size: 1.15rem; color: #dc2626; display: flex; align-items: center; gap: 8px;">
                    🍱 {order.restaurant_name} <span style="font-size: 0.82rem; color: #64748b; font-weight: 500;">({order.order_id})</span>
                </div>
                <div style="background: #fef2f2; border: 1px solid #fca5a5; color: #991b1b; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; letter-spacing: 0.03em;">
                    {order.order_status}
                </div>
            </div>
            <div style="font-size: 0.88rem; color: #334155; margin-bottom: 10px; font-weight: 500;">
                <b>Items:</b> {order.items_summary}
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.78rem; color: #64748b; border-top: 1px solid #f1f5f9; padding-top: 10px;">
                <span>Total: <b style="color: #0f172a; font-weight: 700;">₹{int(order.order_amount)}</b> ({order.payment_method})</span>
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
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                padding: 12px 16px;
                margin-bottom: 12px;
                font-family: 'Plus Jakarta Sans', sans-serif;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 800; color: #059669; font-size: 0.92rem; display: flex; align-items: center; gap: 6px;">🚴 Delivery Partner Status</span>
                    <span style="background: #ecfdf5; border: 1px solid #a7f3d0; color: #047857; padding: 2px 10px; border-radius: 20px; font-size: 0.78rem; font-weight: 700;">ETA: {rider.eta_mins} mins ({rider.distance_km} km away)</span>
                </div>
                <div style="font-size: 0.82rem; color: #64748b; margin-top: 6px;">
                    Rider: <b style="color: #0f172a">{rider.rider_name}</b> | Phone: <b style="color: #0f172a">{rider.rider_phone}</b>
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
