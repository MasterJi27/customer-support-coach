import random
from datetime import datetime
from src.core.models import ToolCallResult

class MockBackendService:
    """
    Simulates real-world support backend API endpoints (OMS, Payment Gateway, Loyalty, Operations).
    """

    def lookup_order(self, order_id: str) -> ToolCallResult:
        if not order_id:
            order_id = "ORD-8142K"
            
        restaurants = ["Biryani Blues", "Haldiram's", "Dominos Pizza", "Burger King", "Punjab Grill"]
        dishes = ["Chicken Biryani & Paneer Tikka", "Thali Deluxe", "Pepperoni Pizza", "Whopper Combo"]
        payment_methods = ["UPI (GPay)", "Credit Card", "Paytm Wallet", "Cash on Delivery"]
        statuses = ["Out for Delivery (Rider delayed 15 mins)", "Delivered (Missing Main Course)", "Preparing in Kitchen", "Rider assigned"]
        
        rest = random.choice(restaurants)
        dish = random.choice(dishes)
        pm = random.choice(payment_methods)
        st = random.choice(statuses)
        amount = random.randint(250, 850)

        res = (
            f"📦 [OMS LOOKUP] Order ID: {order_id}\n"
            f"• Merchant: {rest}\n"
            f"• Items Ordered: {dish}\n"
            f"• Order Amount: ₹{amount} (Paid via {pm})\n"
            f"• Current Status: {st}\n"
            f"• Delivery Address: Flat 402, Block B, Green Glen Layout, Bengaluru\n"
            f"• Rider Contact: +91-9876543210 (Rider Name: Ramesh Kumar)"
        )
        return ToolCallResult(
            tool_name="lookup_order",
            arguments={"order_id": order_id},
            success=True,
            result_text=res
        )

    def process_refund(self, order_id: str, amount: float, reason: str) -> ToolCallResult:
        if amount > 500:
            return ToolCallResult(
                tool_name="process_refund",
                arguments={"order_id": order_id, "amount": amount, "reason": reason},
                success=False,
                result_text=f"⚠️ [REFUND GATEWAY REJECTED] Amount ₹{amount} exceeds standard agent auto-approval limit (Max ₹500). Needs Supervisor approval!"
            )

        tx_id = f"TXN-REF-{random.randint(100000, 999999)}"
        res = (
            f"💳 [REFUND SUCCESS] Order ID: {order_id}\n"
            f"• Refund Amount: ₹{amount}\n"
            f"• Refund Reason: {reason}\n"
            f"• Refund Txn ID: {tx_id}\n"
            f"• Status: Processed. Funds credited back to customer's original payment method in 2-4 hours."
        )
        return ToolCallResult(
            tool_name="process_refund",
            arguments={"order_id": order_id, "amount": amount, "reason": reason},
            success=True,
            result_text=res
        )

    def grant_loyalty_voucher(self, user_phone: str, amount: float) -> ToolCallResult:
        code = f"SORRY{int(amount)}-{random.randint(1000, 9999)}"
        res = (
            f"🎁 [LOYALTY VOUCHER ISSUED] Phone: {user_phone}\n"
            f"• Promo Code: {code}\n"
            f"• Voucher Value: ₹{int(amount)} OFF next order\n"
            f"• Validity: 30 Days\n"
            f"• SMS Notification: Sent to customer."
        )
        return ToolCallResult(
            tool_name="grant_loyalty_voucher",
            arguments={"user_phone": user_phone, "amount": amount},
            success=True,
            result_text=res
        )

    def escalate_to_supervisor(self, order_id: str, priority: str, notes: str) -> ToolCallResult:
        ticket_id = f"SUP-TICK-{random.randint(10000, 99999)}"
        res = (
            f"🚨 [SUPERVISOR ESCALATION CREATED] Order ID: {order_id}\n"
            f"• Ticket ID: {ticket_id}\n"
            f"• Priority: {priority.upper()}\n"
            f"• Escalation Notes: {notes}\n"
            f"• Assigned To: Shift Manager On-Duty\n"
            f"• SLA Target: Callback within 15 minutes."
        )
        return ToolCallResult(
            tool_name="escalate_to_supervisor",
            arguments={"order_id": order_id, "priority": priority, "notes": notes},
            success=True,
            result_text=res
        )

mock_backend = MockBackendService()
