import json
import re
from src.core.models import CustomerPatienceResult, IntentAnalysis
from src.core.llm import llm_chat

class PatienceClockAgent:
    """
    Predicts remaining customer patience turns before call drop-off or formal escalation.
    """

    def evaluate_patience(
        self,
        customer_message: str,
        current_turn: int,
        intent_analysis: IntentAnalysis | None = None
    ) -> CustomerPatienceResult:

        frustration = intent_analysis.frustration_level if intent_analysis else 0.5

        if frustration >= 0.8:
            turns_rem = max(1, 4 - current_turn)
            urgency = "CRITICAL - Impending Dropoff"
            dropoff_pct = round(frustration * 100, 0)
        elif frustration >= 0.5:
            turns_rem = max(2, 6 - current_turn)
            urgency = "High Urgency"
            dropoff_pct = round(frustration * 100, 0)
        else:
            turns_rem = 5
            urgency = "Normal Patience"
            dropoff_pct = 15.0

        return CustomerPatienceResult(
            patience_turns_remaining=turns_rem,
            urgency_level=urgency,
            dropoff_risk_pct=dropoff_pct
        )

patience_clock_agent = PatienceClockAgent()
