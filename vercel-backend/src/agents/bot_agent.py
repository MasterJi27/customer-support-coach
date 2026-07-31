from src.core.models import IntentAnalysis


class ZomatoBotAgent:
    """Automated first-line chatbot (the '🤖 Zomato Assist Bot').

    In a real support flow the customer first hits an automated bot that offers
    scripted self-service options. If the bot can't resolve the issue — or the
    customer is angry / explicitly asks for a person — the chat is escalated to a
    live human agent (the trainee), where real coaching begins.

    Replies are intentionally scripted/menu-style (not free LLM text) so the bot
    feels like a real deflection bot and responds instantly.
    """

    ESCALATION_KEYWORDS = [
        "agent", "human", "representative", "person", "speak to", "talk to someone",
        "supervisor", "manager", "real person", "customer care", "executive",
    ]

    def should_escalate(self, customer_message: str, intent: IntentAnalysis | None) -> bool:
        text = (customer_message or "").lower()
        if any(kw in text for kw in self.ESCALATION_KEYWORDS):
            return True
        if intent and intent.frustration_level >= 0.7:
            return True
        if intent and intent.sentiment.value in ("angry",):
            return True
        return False

    def escalation_reason(self, customer_message: str, intent: IntentAnalysis | None) -> str:
        text = (customer_message or "").lower()
        if any(kw in text for kw in self.ESCALATION_KEYWORDS):
            return "Customer explicitly asked for a human agent."
        if intent and intent.sentiment.value == "angry":
            return "Customer is angry — automated replies will make it worse."
        if intent and intent.frustration_level >= 0.7:
            return f"High frustration ({intent.frustration_level:.0%}) — beyond the bot's scope."
        return "Issue is beyond the bot's self-service options."

    def generate_bot_reply(self, customer_message: str, intent: IntentAnalysis | None) -> str:
        text = (customer_message or "").lower()

        if any(w in text for w in ["refund", "money", "charged", "deduct", "paid", "payment"]):
            return (
                "🤖 I can help with your payment. Please pick an option:\n\n"
                "1️⃣ Check refund status\n"
                "2️⃣ Report a wrong/double charge\n"
                "3️⃣ Talk to a human agent"
            )
        if any(w in text for w in ["missing", "not received", "didn't get", "did not get", "item", "dish"]):
            return (
                "🤖 Sorry about the missing item! I can:\n\n"
                "1️⃣ Reorder the missing item for free\n"
                "2️⃣ Start a partial refund\n"
                "3️⃣ Connect you to a human agent"
            )
        if any(w in text for w in ["late", "delay", "where", "rider", "track", "eta"]):
            return (
                "🤖 Let me help track your order:\n\n"
                "1️⃣ Share live rider location\n"
                "2️⃣ Show updated delivery time\n"
                "3️⃣ Talk to a human agent"
            )
        if any(w in text for w in ["cancel", "cancellation"]):
            return (
                "🤖 I can help with cancellation:\n\n"
                "1️⃣ Cancel and refund (if not yet prepared)\n"
                "2️⃣ Modify the order instead\n"
                "3️⃣ Talk to a human agent"
            )
        return (
            "🤖 Hi! I'm the Zomato Assist Bot. I can help with orders, refunds, "
            "and delivery tracking.\n\nPlease choose an option above, or type "
            "'agent' to talk to a human specialist."
        )


bot_agent = ZomatoBotAgent()
