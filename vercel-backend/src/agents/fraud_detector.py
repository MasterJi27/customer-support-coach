import json
import re
from src.core.models import FraudDetectionResult
from src.core.llm import llm_chat
from src.core.prompts import FRAUD_DETECTOR_SYSTEM_PROMPT

class FraudDetectorAgent:
    """
    Detects customer refund fraud, scam attempts, or policy exploitation.
    """

    def evaluate_fraud_risk(
        self,
        customer_message: str,
        context: str = ""
    ) -> FraudDetectionResult:

        system_prompt = FRAUD_DETECTOR_SYSTEM_PROMPT

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
