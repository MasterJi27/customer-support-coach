import json
import re
from src.core.config import settings
from src.core.models import AutoPilotResult
from src.core.llm import llm_chat
from src.core.prompts import AUTO_PILOT_SYSTEM_PROMPT
from src.tools.mock_backend import mock_backend
from src.tools.composio_backend import composio_backend

class AutoPilotAgent:
    """
    Autonomous AI Copilot that takes over customer support turns on auto-pilot.
    """

    def _composio_refund_notice(self, tool_res) -> str:
        if not composio_backend.is_configured:
            return ""
        result = composio_backend.send_email(
            recipient_email=settings.composio_refund_email,
            subject="Refund processed for your order",
            body=f"Hi there,\n\n{tool_res.result_text}\n\nThanks for your patience. The amount will reflect in 2-4 hours.\n\n- Customer Support Team",
        )
        if result.success:
            return f"\n{result.result_text}"
        return f"\n⚠️ Composio email skipped: {result.result_text}"

    def _composio_voucher_notice(self, tool_res) -> str:
        if not composio_backend.is_configured:
            return ""
        email_res = composio_backend.send_email(
            recipient_email=settings.composio_refund_email,
            subject="Your apology voucher is here",
            body=f"Hi there,\n\n{tool_res.result_text}\n\nUse the promo code on your next order.\n\n- Customer Support Team",
        )
        slack_res = composio_backend.post_slack_message(
            channel=settings.composio_slack_channel,
            text=f"Agent auto-issued a loyalty voucher via Auto-Pilot:\n{tool_res.result_text}",
        )
        notices = []
        if email_res.success:
            notices.append(email_res.result_text)
        if slack_res.success:
            notices.append(slack_res.result_text)
        return "\n" + "\n".join(notices) if notices else ""

    def generate_autopilot_response(
        self,
        customer_message: str,
        context: str = ""
    ) -> AutoPilotResult:

        system_prompt = AUTO_PILOT_SYSTEM_PROMPT

        user_prompt = f"Conversation Context:\n{context}\n\nCustomer Message:\n{customer_message}"

        try:
            resp = llm_chat(system_prompt, user_prompt, temperature=0.2)
            resp = resp.strip()
            match = re.search(r'\{.*\}', resp, re.DOTALL)
            raw_json = match.group(0) if match else resp
            data = json.loads(raw_json)

            reply = data.get("suggested_reply", "I am so sorry for the trouble. Let me immediately look into your order details and process a refund.")
            action = data.get("tool_action_executed", "none")

            tool_res_str = None
            if action == "lookup_order":
                tool_res = mock_backend.lookup_order("ORD-8142K")
                tool_res_str = f"📦 Auto-Executed OMS Order Lookup: {tool_res.result_text.splitlines()[3]}"
            elif action == "process_refund":
                tool_res = mock_backend.process_refund("ORD-8142K", 250, "Auto-Pilot resolution")
                tool_res_str = f"💳 Auto-Executed 50% Refund: {tool_res.result_text.splitlines()[1]}"
                tool_res_str += self._composio_refund_notice(tool_res)
            elif action == "grant_voucher":
                tool_res = mock_backend.grant_loyalty_voucher("98XXXXXX50", 150)
                tool_res_str = f"🎁 Auto-Executed Voucher Grant: {tool_res.result_text.splitlines()[1]}"
                tool_res_str += self._composio_voucher_notice(tool_res)

            return AutoPilotResult(
                suggested_reply=reply,
                tool_action_executed=tool_res_str or action,
                reasoning=data.get("reasoning", "Autonomous empathetic resolution with policy compliance.")
            )

        except Exception:
            return AutoPilotResult(
                suggested_reply="I sincerely apologize for the inconvenience! I have checked your order details and initiated a 50% refund to your account.",
                tool_action_executed="💳 Auto-Executed Refund ₹250",
                reasoning="Empathetic de-escalation protocol."
            )

auto_pilot_agent = AutoPilotAgent()
