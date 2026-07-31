import json
import os
from src.core.models import Message, Scenario, SentimentLabel
from src.core.llm import llm_chat
from src.core.prompts import (
    CUSTOMER_SIMULATOR_SENTIMENT_DESCRIPTIONS,
    build_customer_simulator_system_prompt,
)


class CustomerSimulatorAgent:
    def __init__(self):
        # We load scenarios dynamically to support runtime scenario additions from the Visual Scenario Creator.

        self._fallback_scenarios = {
            "account_login": {
                "issue": "logging into my account",
                "product": "Infosys Springboard",
                "persona": "Frustrated professional who needs urgent access",
            },
            "billing_dispute": {
                "issue": "an incorrect charge on my bill",
                "product": "Infosys Springboard",
                "persona": "Angry customer who feels cheated",
            },
            "technical_glitch": {
                "issue": "the app keeps crashing",
                "product": "Infosys Springboard",
                "persona": "Technical user who has tried basic troubleshooting",
            },
            "cancellation": {
                "issue": "cancelling my subscription",
                "product": "Infosys Springboard",
                "persona": "Disappointed customer who wants a refund",
            },
            "refund_request": {
                "issue": "getting a refund",
                "product": "Infosys Springboard",
                "persona": "Customer who purchased recently and is unsatisfied",
            },
            "data_loss": {
                "issue": "important data is missing",
                "product": "Infosys Springboard",
                "persona": "Panicked customer who lost critical work data",
            },
        }

    def _load_real_scenarios(self) -> list[dict]:
        path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "scenarios.json")
        if not os.path.exists(path):
            return []
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    def generate_first_message(self, scenario: Scenario) -> Message:
        """
        Kicks off the simulated conversation by generating the very first 
        message from the 'customer'.
        """
        if scenario and scenario.problem_description:
            prob = scenario.problem_description.strip()
            if prob.startswith("Customer says:") or "cancel my Gold Membership" in prob or "tree" in scenario.title.lower() or "🗺️" in scenario.title:
                clean_text = prob.replace("Customer says:", "").strip(" '\"")
                if clean_text:
                    return Message(role="customer", content=clean_text)

        # Define the personality and goal of the simulated customer
        real = self._find_real_scenario(scenario)
        if real:
            context_parts = []
            if real.get("context"):
                context_parts.append(f"Background: {real['context']}")
            if real.get("key_issues"):
                context_parts.append(f"Key issues: {', '.join(real['key_issues'])}")

            llm_msg = self._llm_generate(
                persona=real.get("customer_persona", "Customer"),
                product=real.get("product_context", "Zomato Gold VIP"),
                issue=real.get("title", scenario.problem_description),
                context="\n".join(context_parts),
                sentiment=scenario.emotional_start,
                is_first=True,
            )
            if llm_msg:
                return Message(role="customer", content=llm_msg)

        llm_msg = self._llm_generate(
            persona="Customer",
            product=scenario.product_context or "Zomato Gold VIP",
            issue=scenario.problem_description,
            context="",
            sentiment=scenario.emotional_start,
            is_first=True,
        )
        if llm_msg:
            return Message(role="customer", content=llm_msg)

        return Message(role="customer", content="I want to cancel my Gold Membership and get a refund.")

    def generate_reply(
        self,
        scenario: Scenario | None,
        conversation_context: str,
        previous_sentiment: SentimentLabel | None = None,
        agent_response_quality: float = 0.5,
        hinglish_mode: bool = False,
    ) -> Message:
        if scenario is None:
            scenario = Scenario(
                title="generic",
                problem_description="generic",
                customer_persona="Customer",
                product_context="Infosys Springboard",
                emotional_start=SentimentLabel.NEUTRAL,
            )
        previous_sentiment = previous_sentiment or SentimentLabel.NEUTRAL

        if agent_response_quality > 0.7:
            quality_key = "high"
        elif agent_response_quality > 0.4:
            quality_key = "medium"
        else:
            quality_key = "low"

        sentiment_progression = {
            SentimentLabel.NEUTRAL: {"high": SentimentLabel.SATISFIED, "medium": SentimentLabel.NEUTRAL, "low": SentimentLabel.FRUSTRATED},
            SentimentLabel.FRUSTRATED: {"high": SentimentLabel.NEUTRAL, "medium": SentimentLabel.FRUSTRATED, "low": SentimentLabel.ANGRY},
            SentimentLabel.ANGRY: {"high": SentimentLabel.FRUSTRATED, "medium": SentimentLabel.ANGRY, "low": SentimentLabel.ANGRY},
            SentimentLabel.SATISFIED: {"high": SentimentLabel.SATISFIED, "medium": SentimentLabel.SATISFIED, "low": SentimentLabel.NEUTRAL},
            SentimentLabel.NEGATIVE: {"high": SentimentLabel.NEUTRAL, "medium": SentimentLabel.FRUSTRATED, "low": SentimentLabel.ANGRY},
            SentimentLabel.POSITIVE: {"high": SentimentLabel.SATISFIED, "medium": SentimentLabel.POSITIVE, "low": SentimentLabel.NEUTRAL},
        }

        next_sentiment = sentiment_progression.get(
            previous_sentiment, {}
        ).get(quality_key, SentimentLabel.NEUTRAL)

        real = self._find_real_scenario(scenario) if scenario else None
        persona = real.get("customer_persona", "Customer") if real else "Customer"
        product = real.get("product_context", scenario.product_context) if real else (scenario.product_context or "Infosys Springboard")

        llm_msg = self._llm_generate(
            persona=persona,
            product=product,
            issue=scenario.problem_description if scenario else "general issue",
            context=conversation_context,
            sentiment=next_sentiment,
            is_first=False,
            hinglish_mode=hinglish_mode,
        )
        if llm_msg:
            return Message(role="customer", content=llm_msg)

        return Message(role="customer", content="I understand. Please continue helping me with this issue.")

    def _find_real_scenario(self, scenario: Scenario) -> dict | None:
        real_scenarios = self._load_real_scenarios()
        for rs in real_scenarios:
            if rs["id"] == scenario.title or rs["problem_description"] == scenario.problem_description:
                return rs
        return None

    def _llm_generate(
        self,
        persona: str,
        product: str,
        issue: str,
        context: str,
        sentiment: SentimentLabel,
        is_first: bool = False,
        hinglish_mode: bool = False,
    ) -> str:
        sentiment_desc = CUSTOMER_SIMULATOR_SENTIMENT_DESCRIPTIONS.get(
            sentiment.value if hasattr(sentiment, "value") else sentiment, "neutral"
        )

        system = build_customer_simulator_system_prompt(
            persona=persona,
            product=product,
            issue=issue,
            sentiment_desc=sentiment_desc,
            hinglish_mode=hinglish_mode,
        )

        if is_first:
            user = "This is the opening message from the customer. They are contacting support for the first time about their issue."
        else:
            user = f"Conversation history:\n{context}\n\nGenerate the customer's next reply based on what the agent just said:"

        msg = llm_chat(system, user, temperature=0.8)

        # Enforce short, chat-style replies: real customers text one or two lines.
        MAX_LEN = 140
        if msg and len(msg) > MAX_LEN:
            shortened = self._shorten(msg, MAX_LEN)
            if not shortened:
                shortened = llm_chat(
                    system,
                    user + "\n\nYour previous reply was too long. Reply again in ONE short sentence, max 80 characters, like a WhatsApp text.",
                    temperature=0.8,
                )
                shortened = self._shorten(shortened or "", MAX_LEN)
            msg = shortened
        return (msg or "")[:MAX_LEN].strip()

    @staticmethod
    def _shorten(text: str, max_len: int) -> str:
        text = (text or "").strip()
        if len(text) <= max_len:
            return text
        # Cut at the first sentence/line boundary under the limit
        for sep in ("\n", ". ", "! ", "? "):
            if sep in text:
                head = text.split(sep, 1)[0]
                if head and len(head) <= max_len:
                    return (head + sep.rstrip() + "").strip()[:max_len]
        # Emoji-safe truncate
        cut = text[:max_len]
        if cut and cut[-1].isalpha():
            cut = cut.rsplit(" ", 1)[0]
        return cut + "…" if cut else ""

    def list_scenarios(self) -> dict:
        real_scenarios = self._load_real_scenarios()
        scenarios = {}
        for rs in real_scenarios:
            scenarios[rs["id"]] = rs["title"]
        for k, v in self._fallback_scenarios.items():
            if k not in scenarios:
                scenarios[k] = v["issue"]
        return scenarios
