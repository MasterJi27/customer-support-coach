import json
import re
from src.core.models import PredictiveCSATResult, SentimentLabel, IntentAnalysis
from src.core.llm import llm_chat

class PredictiveCSATAgent:
    """
    Evaluates real-time customer sentiment, agent tone, and actions taken to forecast CSAT (1-5) and Churn Risk (%).
    """

    def evaluate(
        self,
        customer_message: str,
        agent_message: str | None,
        intent_analysis: IntentAnalysis | None,
        previous_csat: float = 3.0,
        previous_churn: float = 50.0,
        tool_results: list[dict] | None = None
    ) -> PredictiveCSATResult:
        
        tool_info = ""
        if tool_results:
            tool_info = f"\nAgent Tools Used This Turn: {json.dumps(tool_results)}"

        sentiment_str = intent_analysis.sentiment.value if intent_analysis else "neutral"
        frustration_str = f"{intent_analysis.frustration_level * 100:.0f}%" if intent_analysis else "30%"

        system_prompt = (
            "You are an expert Customer Satisfaction (CSAT) and Churn Risk forecasting engine. "
            "Analyze the ongoing customer support exchange and forecast the predicted CSAT score (1.0 to 5.0) and Customer Churn Risk percentage (0.0% to 100.0%).\n\n"
            "Output strictly valid JSON with no markdown wrapping, containing exact keys:\n"
            "- 'predicted_csat' (float 1.0 to 5.0)\n"
            "- 'churn_risk_pct' (float 0.0 to 100.0)\n"
            "- 'key_drivers' (list of strings, 2-3 main reasons for this score)\n"
            "- 'recommended_action_to_boost' (string, 1 short recommendation to raise CSAT by at least +0.5 points)\n"
        )

        user_prompt = (
            f"Customer Message: {customer_message}\n"
            f"Customer Sentiment: {sentiment_str} (Frustration: {frustration_str})\n"
            f"Agent Response: {agent_message or '(No agent response yet)'}\n"
            f"{tool_info}\n"
            f"Previous CSAT: {previous_csat:.1f} | Previous Churn Risk: {previous_churn:.0f}%"
        )

        try:
            resp = llm_chat(system_prompt, user_prompt, temperature=0.1)
            resp = resp.strip()
            match = re.search(r'\{.*\}', resp, re.DOTALL)
            raw_json = match.group(0) if match else resp
            data = json.loads(raw_json)

            new_csat = float(data.get("predicted_csat", 3.0))
            new_csat = max(1.0, min(5.0, new_csat))
            
            new_churn = float(data.get("churn_risk_pct", 40.0))
            new_churn = max(0.0, min(100.0, new_churn))

            csat_delta = round(new_csat - previous_csat, 2)
            churn_delta = round(new_churn - previous_churn, 2)

            return PredictiveCSATResult(
                predicted_csat=round(new_csat, 1),
                churn_risk_pct=round(new_churn, 1),
                csat_delta=csat_delta,
                churn_delta=churn_delta,
                key_drivers=data.get("key_drivers", ["Active customer engagement"]),
                recommended_action_to_boost=data.get("recommended_action_to_boost", "Acknowledge frustration and offer resolution.")
            )

        except Exception as e:
            return PredictiveCSATResult(
                predicted_csat=previous_csat,
                churn_risk_pct=previous_churn,
                csat_delta=0.0,
                churn_delta=0.0,
                key_drivers=["Standard response pattern"],
                recommended_action_to_boost="Provide empathetic update."
            )

predictive_csat_agent = PredictiveCSATAgent()
