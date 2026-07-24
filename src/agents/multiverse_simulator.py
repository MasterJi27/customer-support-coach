import json
import re
import random
from src.core.models import MultiverseBranch
from src.core.llm import llm_chat

class MultiverseSimulatorAgent:
    """
    Simulates parallel conversation universes (Choice A vs Choice B) to show how different agent choices change the future.
    """

    def simulate_multiverse(
        self,
        customer_message: str,
        turn_number: int = 2
    ) -> MultiverseBranch:

        system_prompt = (
            "You are an AI Multiverse Conversation Simulator. "
            "Given a customer message, generate two contrasting support agent response strategies and simulate the predicted customer outcome for both.\n\n"
            "Return strictly valid JSON with exact keys:\n"
            "- 'option_a_text' (string: Empathetic, proactive resolution reply)\n"
            "- 'option_a_outcome' (string: Customer reaction in Timeline A)\n"
            "- 'option_a_csat' (float: 4.0 to 5.0)\n"
            "- 'option_b_text' (string: Rigid, policy-focused or inquiring reply)\n"
            "- 'option_b_outcome' (string: Customer reaction in Timeline B)\n"
            "- 'option_b_csat' (float: 1.5 to 3.0)\n"
        )

        user_prompt = f"Customer Message: {customer_message}"

        try:
            resp = llm_chat(system_prompt, user_prompt, temperature=0.5)
            resp = resp.strip()
            match = re.search(r'\{.*\}', resp, re.DOTALL)
            raw_json = match.group(0) if match else resp
            data = json.loads(raw_json)

            b_id = f"MULTI-{random.randint(1000, 9999)}"

            return MultiverseBranch(
                branch_id=b_id,
                parent_turn=turn_number,
                option_a_text=data.get("option_a_text", "I'm so sorry for this issue! I have issued an immediate 50% refund to your GPay."),
                option_a_outcome=data.get("option_a_outcome", "Customer feels heard, frustration drops by 60%, CSAT increases to 4.8 ⭐."),
                option_a_csat=float(data.get("option_a_csat", 4.8)),
                option_b_text=data.get("option_b_text", "Please share your order ID, photo of missing dish, and registered phone number."),
                option_b_outcome=data.get("option_b_outcome", "Customer feels interrogated and annoyed, frustration increases by 35%."),
                option_b_csat=float(data.get("option_b_csat", 2.1))
            )

        except Exception:
            return MultiverseBranch(
                branch_id=f"MULTI-{random.randint(1000, 9999)}",
                parent_turn=turn_number,
                option_a_text="I sincerely apologize! Let me immediately issue a refund for the missing main course.",
                option_a_outcome="Timeline A: Customer is relieved and satisfied.",
                option_a_csat=4.7,
                option_b_text="We cannot process refunds without kitchen video verification.",
                option_b_outcome="Timeline B: Customer threatens to tweet and leaves a 1-star review.",
                option_b_csat=1.8
            )

multiverse_simulator_agent = MultiverseSimulatorAgent()
