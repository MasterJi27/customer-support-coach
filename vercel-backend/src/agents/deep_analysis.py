import json
import re
from typing import Any

from src.core.llm import llm_chat
from src.core.prompts import DEEP_ANALYSIS_SYSTEM_PROMPT

_EMPTY = {
    "predicted_csat": 4.0,
    "churn_risk_pct": 0,
    "csat_drivers": [],
    "viral_risk_pct": 0,
    "platform_risk": "Low",
    "preapproved_pr_statement": "",
    "fraud_risk_pct": 0,
    "fraud_category": "Low Risk",
    "fraud_protocol": "",
    "defection_risk_pct": 0,
    "competitor_mentioned": "None",
    "retention_counter_offer": "",
    "internal_monologue": "",
    "true_intent": "",
    "escalation_trigger": "None",
}


class DeepAnalysisAgent:
    """
    Runs ONE LLM call per customer turn and returns a rich risk & insight profile:
    predicted CSAT, churn risk, viral/PR threat (with pre-approved statement),
    fraud signals, competitor defection, and a customer "mind reader" monologue.
    Degrades to safe defaults if the LLM is unavailable.
    """

    def analyze(self, customer_message: str, context: str = "") -> dict[str, Any]:
        try:
            user_prompt = (
                f"Conversation context:\n{context or '(none yet)'}\n\n"
                f"Latest customer message:\n{customer_message}"
            )
            raw = llm_chat(DEEP_ANALYSIS_SYSTEM_PROMPT, user_prompt, temperature=0.2)
            if not raw:
                return dict(_EMPTY)
            match = re.search(r"\{.*\}", raw, re.DOTALL)
            data = json.loads(match.group(0) if match else raw)
            if not isinstance(data, dict):
                return dict(_EMPTY)
            merged = dict(_EMPTY)
            merged.update({k: v for k, v in data.items() if v is not None})
            return merged
        except Exception:
            return dict(_EMPTY)


deep_analysis_agent = DeepAnalysisAgent()
