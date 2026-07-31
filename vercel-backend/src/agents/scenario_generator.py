import json
import re
from src.core.models import GeneratedScenario, SentimentLabel
from src.core.llm import llm_chat
from src.core.prompts import SCENARIO_GENERATOR_SYSTEM_PROMPT

class ScenarioGeneratorAgent:
    """
    Generates realistic, dynamic customer support scenarios on demand using LLM.
    """

    def generate_scenario(
        self,
        product_context: str = "Zomato - Food Delivery App",
        difficulty: str = "challenging",
        compound_issues: list[str] | None = None
    ) -> GeneratedScenario:

        issues_str = ", ".join(compound_issues) if compound_issues else "Missing item and late delivery"

        system_prompt = SCENARIO_GENERATOR_SYSTEM_PROMPT

        user_prompt = (
            f"Industry / Product: {product_context}\n"
            f"Difficulty Level: {difficulty}\n"
            f"Specific Issues to Include: {issues_str}"
        )

        try:
            resp = llm_chat(system_prompt, user_prompt, temperature=0.7)
            resp = resp.strip()
            match = re.search(r'\{.*\}', resp, re.DOTALL)
            raw_json = match.group(0) if match else resp
            data = json.loads(raw_json)

            sentiment_map = {
                "angry": SentimentLabel.ANGRY,
                "frustrated": SentimentLabel.FRUSTRATED,
                "neutral": SentimentLabel.NEUTRAL,
            }
            emo_str = str(data.get("emotional_start", "angry")).lower()
            emo_label = sentiment_map.get(emo_str, SentimentLabel.ANGRY)

            return GeneratedScenario(
                title=data.get("title", f"Dynamic Scenario ({difficulty.capitalize()})"),
                product_context=data.get("product_context", product_context),
                customer_persona=data.get("customer_persona", "Frustrated customer demanding quick resolution."),
                problem_description=data.get("problem_description", f"Issue related to {issues_str}."),
                difficulty=difficulty,
                emotional_start=emo_label
            )

        except Exception as e:
            return GeneratedScenario(
                title=f"{difficulty.capitalize()} Support Scenario",
                product_context=product_context,
                customer_persona="Busy professional facing service disruption.",
                problem_description=f"Customer encountered multiple issues: {issues_str}. Order ORD-9921.",
                difficulty=difficulty,
                emotional_start=SentimentLabel.FRUSTRATED
            )

scenario_generator_agent = ScenarioGeneratorAgent()
