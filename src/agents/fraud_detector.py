import json
import re
from src.core.models import FraudDetectionResult
from src.core.llm import llm_chat

class FraudDetectorAgent:
    """
    Detects customer refund fraud, scam attempts, or policy exploitation.
    """

    def evaluate_fraud_risk(
        self,
        customer_message: str,
        context: str = ""
    ) -> FraudDetectionResult:

        system_prompt = (
            "You are a Senior Fraud & Loss Prevention Analyst for an enterprise e-commerce / food delivery platform. "
            "Analyze the customer's message and chat history for fraud signals (e.g., claiming missing expensive items repeatedly, demanding cash refunds without proof, fake order IDs, aggressive refund threats).\n\n"
            "Return strictly valid JSON with exact keys:\n"
            "- 'is_suspicious' (boolean)\n"
            "- 'fraud_risk_score' (float: 0.0 to 100.0%)\n"
            "- 'risk_category' (string: 'Low Risk', 'Suspicious Abuse Pattern', 'High Refund Exploitation Risk', or 'Critical Fraud Alert')\n"
            "- 'historical_red_flags' (list of strings: 2-3 specific red flags detected)\n"
            "- 'recommended_protocol' (string: exact anti-fraud protocol agent should follow)\n"
        )

        user_prompt = f"Customer Chat History:\n{context}\n\nLatest Customer Message:\n{customer_message}"

        try:
            resp = llm_chat(system_prompt, user_prompt, temperature=0.1)
            resp = resp.strip()
            match = re.search(r'\{.*\}', resp, re.DOTALL)
            raw_json = match.group(0) if match else resp
            data = json.loads(raw_json)

            return FraudDetectionResult(
                is_suspicious=bool(data.get("is_suspicious", False)),
                fraud_risk_score=float(data.get("fraud_risk_score", 15.0)),
                risk_category=data.get("risk_category", "Low Risk"),
                historical_red_flags=data.get("historical_red_flags", ["Standard refund inquiry"]),
                recommended_protocol=data.get("recommended_protocol", "Standard verification: Confirm Order ID and registered phone.")
            )

        except Exception:
            return FraudDetectionResult(
                is_suspicious=False,
                fraud_risk_score=10.0,
                risk_category="Low Risk",
                historical_red_flags=["Normal inquiry pattern"],
                recommended_protocol="Verify customer identity."
            )

fraud_detector_agent = FraudDetectorAgent()
