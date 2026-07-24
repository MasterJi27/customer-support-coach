import json
import re
from src.core.models import ManagerIntervention, IntentAnalysis, EscalationAssessment
from src.core.llm import llm_chat

class ManagerSupervisorAgent:
    """
    Simulates a live contact center supervisor monitoring conversations.
    Triggers private whisper notes or manager takeover popups when risk is extreme.
    """

    def evaluate_intervention(
        self,
        customer_message: str,
        agent_message: str | None,
        intent_analysis: IntentAnalysis | None,
        escalation_assessment: EscalationAssessment | None
    ) -> ManagerIntervention:
        
        frustration = intent_analysis.frustration_level if intent_analysis else 0.3
        risk_score = escalation_assessment.risk_score if escalation_assessment else 0.3

        # Immediate threshold rule check
        if frustration < 0.5 and risk_score < 0.5:
            return ManagerIntervention(
                requires_intervention=False,
                intervention_type="none",
                whisper_note="",
                reasoning="Call is progressing normally under safe parameters.",
                suggested_action=""
            )

        system_prompt = (
            "You are an Operations Shift Manager supervising a live support call. "
            "Evaluate if manager intervention is required. "
            "Return strictly JSON with keys:\n"
            "- 'requires_intervention' (boolean)\n"
            "- 'intervention_type' (string: 'whisper', 'takeover', or 'auto_approve_voucher')\n"
            "- 'whisper_note' (string: short 1-sentence private hint from manager to agent)\n"
            "- 'reasoning' (string: why manager is stepping in or watching)\n"
            "- 'suggested_action' (string: immediate recommended resolution action)\n"
        )

        user_prompt = (
            f"Customer Message: {customer_message}\n"
            f"Frustration Level: {frustration * 100:.0f}%\n"
            f"Escalation Risk Score: {risk_score * 100:.0f}%\n"
            f"Agent Reply: {agent_message or '(Pending)'}"
        )

        try:
            resp = llm_chat(system_prompt, user_prompt, temperature=0.1)
            resp = resp.strip()
            match = re.search(r'\{.*\}', resp, re.DOTALL)
            raw_json = match.group(0) if match else resp
            data = json.loads(raw_json)

            req = bool(data.get("requires_intervention", frustration >= 0.7))
            itype = str(data.get("intervention_type", "whisper" if frustration < 0.85 else "takeover"))

            return ManagerIntervention(
                requires_intervention=req,
                intervention_type=itype,
                whisper_note=data.get("whisper_note", "De-escalate immediately and offer a compensation voucher."),
                reasoning=data.get("reasoning", "High customer frustration detected."),
                suggested_action=data.get("suggested_action", "Issue ₹200 apology voucher and re-assign rider.")
            )
        except Exception:
            return ManagerIntervention(
                requires_intervention=frustration >= 0.75,
                intervention_type="whisper" if frustration < 0.85 else "takeover",
                whisper_note="Keep calm, apologize for the delay, and offer a full refund.",
                reasoning="Elevated customer frustration.",
                suggested_action="Process full refund."
            )

    def generate_manager_takeover_response(
        self,
        order_id: str = "ORD-8142K",
        customer_name: str = "Customer",
        issue: str = "Order Delay & Refund Request"
    ) -> str:
        """Generates an official Senior Operations Manager takeover statement."""
        return (
            f"🛡️ **MANAGER TAKEOVER STATEMENT** *(Ramesh Kumar — Senior Operations Manager)*:\n"
            f"\"Namaste {customer_name}, I am Ramesh Kumar, Senior Customer Support Operations Manager. "
            f"I have personally taken over ticket **{order_id}** regarding your issue. "
            f"I sincerely apologize for the unacceptable delay. I have overridden standard limits and authorized a **100% full refund of ₹250** "
            f"directly back to your original payment method + credited a **₹100 goodwill voucher** to your account wallet. "
            f"Your satisfaction is our highest priority.\""
        )

manager_supervisor_agent = ManagerSupervisorAgent()

