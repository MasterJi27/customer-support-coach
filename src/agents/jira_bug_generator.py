import json
import re
import random
from datetime import datetime
from src.core.models import JiraBugTicket, Message, TurnAnalysis
from src.core.llm import llm_chat

class JiraBugGeneratorAgent:
    """
    Analyzes support conversation logs to identify underlying software bugs or operational flaws,
    and automatically formats a Jira Engineering Bug Ticket.
    """

    def generate_jira_ticket(
        self,
        messages: list[Message],
        turn_analyses: list[TurnAnalysis],
        product_context: str = "Zomato - Food Delivery App"
    ) -> JiraBugTicket:

        transcript_text = "\n".join(f"{m.role.upper()}: {m.content}" for m in messages)

        system_prompt = (
            "You are a Senior QA / Product Reliability Engineer. "
            "Analyze the provided customer support interaction transcript to identify any software bug, system glitch, or operational failure mentioned by the customer.\n\n"
            "Generate an engineering Jira Bug Ticket strictly in valid JSON format with keys:\n"
            "- 'summary' (string: clear, technical bug summary title)\n"
            "- 'issue_type' (string: 'Bug', 'Incident', or 'System Flaw')\n"
            "- 'priority' (string: 'High', 'Highest', 'Medium', or 'Low')\n"
            "- 'component' (string: e.g. 'Payment Gateway', 'Order Management System', 'Rider Dispatch Engine', 'Merchant Portal')\n"
            "- 'description' (string: detailed technical explanation of what went wrong and customer impact)\n"
            "- 'steps_to_reproduce' (list of strings: step-by-step reproduction sequence)\n"
            "- 'affected_merchants_or_users' (list of strings: e.g. merchants or payment methods affected)\n"
            "- 'suggested_fix' (string: proposed engineering resolution or API fix)\n"
        )

        user_prompt = f"Product Platform: {product_context}\n\nSupport Transcript:\n{transcript_text}"

        try:
            resp = llm_chat(system_prompt, user_prompt, temperature=0.2)
            resp = resp.strip()
            match = re.search(r'\{.*\}', resp, re.DOTALL)
            raw_json = match.group(0) if match else resp
            data = json.loads(raw_json)

            t_id = f"BUG-{random.randint(1000, 9999)}"

            return JiraBugTicket(
                ticket_id=t_id,
                summary=data.get("summary", "Systemic Delivery / Order Processing Failure"),
                issue_type=data.get("issue_type", "Bug"),
                priority=data.get("priority", "High"),
                component=data.get("component", "Order Management"),
                description=data.get("description", "Customer experienced an unhandled system failure during order fulfillment."),
                steps_to_reproduce=data.get("steps_to_reproduce", [
                    "Place order on mobile platform",
                    "Proceed through payment gateway",
                    "Observe missing main course item upon delivery"
                ]),
                affected_merchants_or_users=data.get("affected_merchants_or_users", ["Biryani Blues", "GPay UPI Users"]),
                suggested_fix=data.get("suggested_fix", "Audit merchant kitchen packing workflow and add item-count verification webhook.")
            )

        except Exception as e:
            return JiraBugTicket(
                ticket_id=f"BUG-{random.randint(1000, 9999)}",
                summary="Fulfillment Disruption - Missing Items & Delivery Delay",
                issue_type="Bug",
                priority="High",
                component="Fulfillment Engine",
                description=f"Auto-generated ticket from support session. Customer reported missing items and tracking errors. Error: {e}",
                steps_to_reproduce=[
                    "Select items from merchant catalog",
                    "Complete payment",
                    "Track delivery progress"
                ],
                affected_merchants_or_users=["Zomato Food Platform"],
                suggested_fix="Enhance real-time rider tracking and merchant item check-off."
            )

jira_bug_generator_agent = JiraBugGeneratorAgent()
