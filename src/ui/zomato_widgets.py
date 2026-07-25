import streamlit as st
from src.core.models import OrderHeaderCard, RiderStatusCard

def get_dynamic_order_and_rider(session) -> tuple[OrderHeaderCard, RiderStatusCard]:
    """
    Dynamically resolves order header and delivery partner/engineer status cards 
    based on the active scenario and product context.
    """
    if not session or not hasattr(session, "config") or not session.config:
        return OrderHeaderCard(), RiderStatusCard()

    scenario = session.config.scenario
    title = (scenario.title if scenario else session.config.product_context) or ""
    p_ctx = (scenario.product_context if scenario else session.config.product_context) or ""
    t_lower = (title + " " + p_ctx).lower()

    if "zomato" in t_lower or "biryani" in t_lower or "missing items" in t_lower:
        order = OrderHeaderCard(
            order_id="ORD-8142K",
            restaurant_name="Biryani Blues",
            items_summary="Chicken Hyderabadi Biryani (1x), Paneer Tikka (1x), Mirchi Salan",
            order_amount=340.0,
            payment_method="GPay UPI",
            delivery_address="Flat 402, Block B, Green Glen Layout",
            order_status="Out for Delivery (Missing Main Course Claimed)",
        )
        rider = RiderStatusCard(
            rider_name="Ramesh Kumar",
            rider_phone="+91-9876543210",
            distance_km=1.2,
            eta_mins=8,
            rider_status="En-route to Customer Location",
        )
    elif "aws" in t_lower or "ec2" in t_lower or "double charge" in t_lower or "cloud" in t_lower:
        order = OrderHeaderCard(
            order_id="INV-9412EC2",
            restaurant_name="AWS Cloud Infrastructure",
            items_summary="EC2 i3.2xlarge Instance Upgrade (2x), EBS Storage 500GB",
            order_amount=124500.0,
            payment_method="Corporate Visa (Double Charged)",
            delivery_address="AWS Billing Console (us-east-1)",
            order_status="Pending Invoice Audit (Double Charge)",
        )
        rider = RiderStatusCard(
            rider_name="Vikram Singh (Cloud Billing Lead)",
            rider_phone="+91-9812345678",
            distance_km=0.0,
            eta_mins=2,
            rider_status="Reviewing Bank Chargeback Logs",
        )
    elif "stripe" in t_lower or "payment" in t_lower or "api" in t_lower:
        order = OrderHeaderCard(
            order_id="TXN-4029ST",
            restaurant_name="Stripe Payments Gateway",
            items_summary="E-commerce Checkout Charge (HTTP 402 Failed Intent)",
            order_amount=41500.0,
            payment_method="End-User Debit Card",
            delivery_address="API Endpoint: v1/charges",
            order_status="Payment Failed (Authorization Hold Active)",
        )
        rider = RiderStatusCard(
            rider_name="Suresh Patel (Integrations Architect)",
            rider_phone="+91-9899887766",
            distance_km=0.0,
            eta_mins=1,
            rider_status="Tracing Auth Hold ARN",
        )
    elif "vercel" in t_lower or "deploy" in t_lower or "404" in t_lower:
        order = OrderHeaderCard(
            order_id="DPL-9481VC",
            restaurant_name="Vercel Edge Cloud Platform",
            items_summary="Next.js Production Build #482 (Edge Routing Error)",
            order_amount=0.0,
            payment_method="Vercel Pro Plan",
            delivery_address="https://prod.mycompany.com",
            order_status="Production 404 Incident Active",
        )
        rider = RiderStatusCard(
            rider_name="Anita Sharma (Edge Operations Lead)",
            rider_phone="+91-9876112233",
            distance_km=0.0,
            eta_mins=3,
            rider_status="Purging CDN Network Cache",
        )
    elif "swiggy" in t_lower or "grocery" in t_lower or "instamart" in t_lower:
        order = OrderHeaderCard(
            order_id="INSTA-5521",
            restaurant_name="Swiggy Instamart (Indiranagar Store)",
            items_summary="Fresh Royal Apples 1kg, Hass Avocado 2x, Organic Milk 1L",
            order_amount=480.0,
            payment_method="Swiggy Money Wallet",
            delivery_address="Tower 3, Apt 804, Horizon Heights",
            order_status="Delivered (Rotten Produce Claimed)",
        )
        rider = RiderStatusCard(
            rider_name="Rahul Verma",
            rider_phone="+91-9876500112",
            distance_km=0.5,
            eta_mins=5,
            rider_status="Delivered at Guard Gate",
        )
    elif "uber" in t_lower or "ride" in t_lower or "driver" in t_lower:
        order = OrderHeaderCard(
            order_id="TRIP-9982UB",
            restaurant_name="Uber Premier Mobility",
            items_summary="Trip: Airport Terminal 2 -> Sector 54, Gurgaon",
            order_amount=850.0,
            payment_method="Uber Cash Wallet",
            delivery_address="Dropoff: Sector 54",
            order_status="Cancelled by Driver (Driver Cash Demand)",
        )
        rider = RiderStatusCard(
            rider_name="Rajesh Yadav (Uber Driver)",
            rider_phone="+91-9811223344",
            distance_km=0.1,
            eta_mins=0,
            rider_status="Cancelled Trip Abruptly",
        )
    elif "shopify" in t_lower or "discount" in t_lower or "promo" in t_lower:
        order = OrderHeaderCard(
            order_id="SHPFY-8841",
            restaurant_name="Shopify Checkout Engine",
            items_summary="Promo Code BFCM50 (50% Off Holiday Cart)",
            order_amount=12500.0,
            payment_method="Shop Pay",
            delivery_address="Checkout Cart ID #8841",
            order_status="Discount Code Rejected at Checkout",
        )
        rider = RiderStatusCard(
            rider_name="Deepak Sharma (Shopify Merchant Support)",
            rider_phone="+91-9844556677",
            distance_km=0.0,
            eta_mins=2,
            rider_status="Inspecting Discount Rule Logic",
        )
    else:
        h_code = abs(hash(title)) % 8999 + 1000
        order = OrderHeaderCard(
            order_id=f"TICK-{h_code}",
            restaurant_name=p_ctx or "Support Operations Portal",
            items_summary=title or "Customer Support Ticket",
            order_amount=0.0,
            payment_method="Internal Enterprise Portal",
            delivery_address="Customer Account Console",
            order_status="Active Escalation Ticket",
        )
        rider = RiderStatusCard(
            rider_name="Priya Nair (Lead Escalations Officer)",
            rider_phone="+91-9800011122",
            distance_km=0.0,
            eta_mins=1,
            rider_status="Assigned Support Officer Active",
        )

    return order, rider


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
                <span>Active Desk Queue: <b style="color: #ffffff;">4 Tickets</b> | Avg Response Time: <b style="color: #34d399;">14.2s</b> | Target CSAT: <b style="color: #fbbf24;">4.8 ⭐</b></span>
            </div>
            <div>
                <span style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.35); color: #34d399; padding: 4px 12px; border-radius: 20px; font-weight: 700; font-size: 0.75rem;">🔒 PII MASKED & SECURE</span>
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
    Renders an authentic live delivery rider tracking card with PII-masked phone proxy.
    """
    if not rider:
        rider = RiderStatusCard()

    col1, col2 = st.columns([3.2, 1])
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
                    <span style="font-weight: 800; color: #34d399; font-size: 0.95rem; display: flex; align-items: center; gap: 8px;">🚴 Delivery / Support Partner Status</span>
                    <span style="background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.4); color: #6ee7b7; padding: 3px 12px; border-radius: 20px; font-size: 0.78rem; font-weight: 700;">Status: {rider.rider_status} ({rider.eta_mins} mins ETA)</span>
                </div>
                <div style="font-size: 0.85rem; color: #94a3b8; margin-top: 8px; display: flex; align-items: center; gap: 12px;">
                    <span>Assigned Lead: <b style="color: white">{rider.rider_name}</b></span>
                    <span>•</span>
                    <span>Phone: <span style="background: rgba(99, 102, 241, 0.2); border: 1px solid rgba(99, 102, 241, 0.35); color: #a5b4fc; padding: 2px 8px; border-radius: 6px; font-weight: 700; font-size: 0.76rem;">🔒 Masked Proxy (+91-98XXXXXX10)</span></span>
                </div>
            </div>
            """,
            unsafe_allow_html=True
        )
    with col2:
        st.markdown("<div style='height:2px;'></div>", unsafe_allow_html=True)
        if st.button("📞 Proxy IVR Call", use_container_width=True):
            st.toast(f"📞 Initiating Encrypted Computerized Proxy Dial to {rider.rider_name}...", icon="📞")

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
            <span>🤖 <b>Automated AI Bot Handover:</b> Customer escalated to human support executive</span>
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


def render_customer_attachment_card(order: OrderHeaderCard | None = None):
    """
    Renders an authentic live customer uploaded proof / photo evidence attachment card.
    """
    order_id = order.order_id if order else "ORD-8142K"
    st.markdown(
        f"""
        <div style="
            background: rgba(30, 41, 59, 0.75);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(99, 102, 241, 0.3);
            border-radius: 12px;
            padding: 12px 16px;
            margin-bottom: 14px;
            font-family: 'Plus Jakarta Sans', sans-serif;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
        ">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 700; color: #38bdf8; font-size: 0.88rem; display: flex; align-items: center; gap: 8px;">
                    📷 Customer Attached Evidence (1 Photo Verified)
                </span>
                <span style="background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.4); color: #34d399; padding: 2px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 700;">
                    ✅ AI Vision Verified (96% Match)
                </span>
            </div>
            <div style="font-size: 0.82rem; color: #cbd5e1; margin-top: 6px; display: flex; align-items: center; justify-content: space-between;">
                <span>📎 <code>evidence_package_{order_id}.jpg</code> (1.4 MB) — Sealed bag photo attached</span>
                <span style="color: #94a3b8; font-size: 0.75rem;">Verified 2m ago</span>
            </div>
        </div>
        """,
        unsafe_allow_html=True
    )


def render_practical_crm_action_bar(order: OrderHeaderCard | None = None):
    """
    Renders 1-Click Practical CRM Resolution Buttons directly on the support desk.
    """
    if not order:
        order = OrderHeaderCard()

    st.markdown("**⚡ 1-Click Operational CRM Actions (Direct Resolution Execution)**")
    
    col1, col2, col3, col4 = st.columns(4)

    with col1:
        if st.button(f"💳 Process ₹{int(order.order_amount)} Refund", use_container_width=True, type="primary"):
            refund_msg = (
                f"I have authorized and initiated an instant refund of ₹{int(order.order_amount)} "
                f"back to your original payment method ({order.payment_method}). "
                f"Refund Ref ID: #RFD-{hash(order.order_id) % 89999 + 10000}. You will receive a bank SMS shortly."
            )
            st.session_state["pending_agent_text"] = refund_msg
            st.toast(f"💳 Executed Instant Refund of ₹{int(order.order_amount)}!", icon="💳")
            st.rerun()

    with col2:
        if st.button("🍲 Priority Express Re-Order", use_container_width=True):
            reorder_msg = (
                f"I am deeply sorry for the missing item. I have just dispatched a Priority Express "
                f"Replacement Order directly from {order.restaurant_name}. "
                f"Replacement Order ID: #ORD-{hash(order.order_id) % 8999 + 1000}R. Estimated delivery: 20 mins."
            )
            st.session_state["pending_agent_text"] = reorder_msg
            st.toast("🍲 Dispatched Express Priority Replacement Order!", icon="🍲")
            st.rerun()

    with col3:
        if st.button("🎁 ₹100 Goodwill Voucher", use_container_width=True):
            voucher_msg = (
                f"We truly value your relationship with us. To make things right, I have credited a ₹100 "
                f"Goodwill Compensation Voucher (Code: APOLOGY100) to your account wallet for your next order."
            )
            st.session_state["pending_agent_text"] = voucher_msg
            st.toast("🎁 Added ₹100 Goodwill Voucher to Reply Box!", icon="🎁")
            st.rerun()

    with col4:
        if st.button("🚀 Escalate to Supervisor", use_container_width=True):
            esc_msg = (
                f"I have escalated your case ID {order.order_id} directly to our Senior Floor Supervisor. "
                f"A supervisor is taking over your ticket to ensure immediate full resolution."
            )
            st.session_state["pending_agent_text"] = esc_msg
            st.toast("🚀 Ticket Escalated to Senior Supervisor Desk!", icon="🚀")
            st.rerun()


def render_practical_kpi_footer():
    """
    Renders a live operational contact center KPI footer at the bottom of the coaching page.
    """
    st.markdown(
        """
        <div style="
            background: rgba(15, 23, 42, 0.85);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(99, 102, 241, 0.25);
            border-radius: 14px;
            padding: 12px 22px;
            margin-top: 24px;
            margin-bottom: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-family: 'Plus Jakarta Sans', monospace;
            font-size: 0.82rem;
            color: #94a3b8;
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        ">
            <div style="display:flex; gap:20px; align-items:center;">
                <span>⏱️ <b>Live Desk AHT:</b> <span style="color:#38bdf8; font-weight:700;">01:42s</span></span>
                <span>•</span>
                <span>🎯 <b>FCR Score:</b> <span style="color:#34d399; font-weight:700;">98% (Optimal)</span></span>
                <span>•</span>
                <span>⭐ <b>CSAT Forecast:</b> <span style="color:#fbbf24; font-weight:700;">4.8 / 5.0</span></span>
            </div>
            <div style="display:flex; gap:12px; align-items:center;">
                <span style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.35); color: #34d399; padding: 3px 10px; border-radius: 12px; font-weight: 700; font-size: 0.75rem;">
                    🛡️ PII ANONYMIZED
                </span>
                <span style="background: rgba(99, 102, 241, 0.2); border: 1px solid rgba(99, 102, 241, 0.35); color: #c7d2fe; padding: 3px 10px; border-radius: 12px; font-weight: 700; font-size: 0.75rem;">
                    ⚙️ LIVE CRM SYNCED
                </span>
            </div>
        </div>
        """,
        unsafe_allow_html=True
    )
