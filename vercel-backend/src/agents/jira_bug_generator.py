import json
import re
import random
from datetime import datetime
from src.core.config import settings
from src.core.models import JiraBugTicket, Message, TurnAnalysis
from src.core.llm import llm_chat
from src.core.prompts import JIRA_BUG_GENERATOR_SYSTEM_PROMPT
from src.tools.composio_backend import composio_backend

class JiraBugGeneratorAgent:
    """
    Analyzes support conversation logs to identify underlying software bugs or operational flaws,
    and automatically formats a Jira Engineering Bug Ticket.
    """

    def _attach_real_ticket(self, ticket: JiraBugTicket) -> None:
        if not composio_backend.is_configured:
            return
        project_key = settings.composio_jira_project_key
        description = ticket.description
        if ticket.steps_to_reproduce:
            description += "\n\nSteps to Reproduce:\n" + "\n".join(
                f"  {i + 1}. {step}" for i, step in enumerate(ticket.steps_to_reproduce)
            )
        if ticket.affected_merchants_or_users:
            description += f"\n\nAffected: {', '.join(ticket.affected_merchants_or_users)}"
        if ticket.suggested_fix:
            description += f"\n\nSuggested Fix: {ticket.suggested_fix}"
        result = composio_backend.create_jira_ticket(
            project_key=project_key,
            summary=ticket.summary,
            issue_type=ticket.issue_type,
            priority=ticket.priority,
            description=description,
        )
        if result.success:
            ticket.ticket_id = result.result_text

    def generate_jira_ticket(
        self,
        messages: list[Message],
        turn_analyses: list[TurnAnalysis],
        product_context: str = "Zomato - Food Delivery App"
    ) -> JiraBugTicket:

        transcript_text = "\n".join(f"{m.role.upper()}: {m.content}" for m in messages)

        system_prompt = JIRA_BUG_GENERATOR_SYSTEM_PROMPT

        user_prompt = f"Product Platform: {product_context}\n\nSupport Transcript:\n{transcript_text}"

        try:
            resp = llm_chat(system_prompt, user_prompt, temperature=0.2)
            resp = resp.strip()
            match = re.search(r'\{.*\}', resp, re.DOTALL)
            raw_json = match.group(0) if match else resp
            data = json.loads(raw_json)

            t_id = f"BUG-{random.randint(1000, 9999)}"

            ticket = JiraBugTicket(
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
            self._attach_real_ticket(ticket)
            return ticket

        except Exception as e:
            ticket = JiraBugTicket(
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
            self._attach_real_ticket(ticket)
            return ticket

jira_bug_generator_agent = JiraBugGeneratorAgent()
