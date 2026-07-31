import json
import re
from src.core.models import CompetitorDefectionResult
from src.core.llm import llm_chat
from src.core.prompts import COMPETITOR_DEFECTION_SYSTEM_PROMPT

class CompetitorDefectionAgent:
    """
    Detects competitor threats (e.g. Swiggy, UberEats, Amazon, DoorDash) and suggests retention counter-offers.
    """

    def evaluate_defection(
        self,
        customer_message: str,
        context: str = ""
    ) -> CompetitorDefectionResult:

        msg_lower = customer_message.lower()
        competitors = ["swiggy", "ubereats", "zepto", "blinkit", "instamart", "dunzo", "amazon"]
        mentioned = [c for c in competitors if c in msg_lower]

        system_prompt = COMPETITOR_DEFECTION_SYSTEM_PROMPT

        user_prompt = f"Chat Context:\n{context}\n\nCustomer Message:\n{customer_message}"

        try:
            resp = llm_chat(system_prompt, user_prompt, temperature=0.1)
            resp = resp.strip()
            match = re.search(r'\{.*\}', resp, re.DOTALL)
            raw_json = match.group(0) if match else resp
            data = json.loads(raw_json)

            is_threat = bool(data.get("is_defection_threat", bool(mentioned)))
            comp_name = data.get("competitor_mentioned", mentioned[0].capitalize() if mentioned else "Swiggy")

            return CompetitorDefectionResult(
                is_defection_threat=is_threat,
                defection_risk_pct=float(data.get("defection_risk_pct", 85.0 if mentioned else 15.0)),
                competitor_mentioned=comp_name,
                retention_counter_offer=data.get("retention_counter_offer", "Offer 1-Month Free Zomato Gold Membership + ₹100 Coupon.")
            )

        except Exception:
            return CompetitorDefectionResult(
                is_defection_threat=bool(mentioned),
                defection_risk_pct=75.0 if mentioned else 10.0,
                competitor_mentioned=mentioned[0].capitalize() if mentioned else "Swiggy",
                retention_counter_offer="Grant ₹100 Retention Discount Code."
            )

competitor_defection_agent = CompetitorDefectionAgent()
