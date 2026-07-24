from src.core.models import AgentCognitiveLoad, IntentAnalysis

class CognitiveLoadAgent:
    """
    Measures support agent mental workload % and focus score based on ticket complexity.
    """

    def evaluate_cognitive_load(
        self,
        customer_message: str,
        intent_analysis: IntentAnalysis | None = None
    ) -> AgentCognitiveLoad:

        frustration = intent_analysis.frustration_level if intent_analysis else 0.4
        msg_len = len(customer_message.split())

        if frustration > 0.7 or msg_len > 40:
            load = 82.0
            complexity = "High Cognitive Complexity"
            focus = 75.0
        elif frustration > 0.4 or msg_len > 20:
            load = 55.0
            complexity = "Moderate Complexity"
            focus = 88.0
        else:
            load = 30.0
            complexity = "Low Complexity"
            focus = 95.0

        return AgentCognitiveLoad(
            cognitive_load_pct=load,
            focus_score=focus,
            ticket_complexity=complexity
        )

cognitive_load_agent = CognitiveLoadAgent()
