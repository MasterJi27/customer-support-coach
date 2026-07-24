import json
import re
from src.core.models import ViralPRThreatResult
from src.core.llm import llm_chat

class ViralThreatPredictorAgent:
    """
    Predicts public social media exposure risk (Twitter/X, LinkedIn, Consumer Court, App Store 1-Star reviews).
    """

    def evaluate_viral_threat(
        self,
        customer_message: str,
        context: str = ""
    ) -> ViralPRThreatResult:

        # Fast rule check for explicit threat triggers
        msg_lower = customer_message.lower()
        has_social_keywords = any(kw in msg_lower for kw in ["twitter", "x.com", "linkedin", "consumer court", "tagging", "viral", "post this", "review", "instagram"])

        system_prompt = (
            "You are a Brand Reputation & Crisis PR Analyst for an enterprise company. "
            "Analyze the customer's message to determine the risk of them publicly blasting the brand on social media (Twitter/X, LinkedIn, Consumer Court, App Store Reviews).\n\n"
            "Return strictly valid JSON with exact keys:\n"
            "- 'is_viral_threat' (boolean)\n"
            "- 'viral_risk_score' (float: 0.0 to 100.0%)\n"
            "- 'platform_risk' (string: e.g. 'Twitter/X Escalation', 'Google Play 1-Star Review', 'Consumer Court Threat')\n"
            "- 'key_threat_triggers' (list of strings: specific phrases triggering risk)\n"
            "- 'preapproved_pr_statement' (string: official de-escalation response to neutralize public damage)\n"
        )

        user_prompt = f"Chat Context:\n{context}\n\nCustomer Message:\n{customer_message}"

        try:
            resp = llm_chat(system_prompt, user_prompt, temperature=0.1)
            resp = resp.strip()
            match = re.search(r'\{.*\}', resp, re.DOTALL)
            raw_json = match.group(0) if match else resp
            data = json.loads(raw_json)

            is_threat = bool(data.get("is_viral_threat", has_social_keywords))
            risk_score = float(data.get("viral_risk_score", 85.0 if has_social_keywords else 15.0))

            return ViralPRThreatResult(
                is_viral_threat=is_threat,
                viral_risk_score=risk_score,
                platform_risk=data.get("platform_risk", "Twitter / Social Media Escalation"),
                key_threat_triggers=data.get("key_threat_triggers", ["Public escalation phrasing"]),
                preapproved_pr_statement=data.get("preapproved_pr_statement", "We sincerely apologize for this experience. Please allow us to resolve this immediately with top priority.")
            )

        except Exception:
            return ViralPRThreatResult(
                is_viral_threat=has_social_keywords,
                viral_risk_score=75.0 if has_social_keywords else 10.0,
                platform_risk="Social Media Escalation",
                key_threat_triggers=["Escalation language"],
                preapproved_pr_statement="We understand your frustration and are prioritizing your resolution right now."
            )

viral_threat_predictor_agent = ViralThreatPredictorAgent()
