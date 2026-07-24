import json
import re
from src.core.models import CustomerMindReadResult
from src.core.llm import llm_chat

class CustomerMindReaderAgent:
    """
    Reveals the customer's true internal thoughts and hidden expectations vs what they typed in chat.
    """

    def read_customer_mind(
        self,
        customer_message: str,
        context: str = ""
    ) -> CustomerMindReadResult:

        system_prompt = (
            "You are a Customer Psychology & Mind Reading AI Engine. "
            "Analyze the customer's message and chat history. Reveal what the customer is REALLY thinking in their head (internal monologue) versus what they typed in chat.\n\n"
            "Return strictly valid JSON with exact keys:\n"
            "- 'internal_monologue' (string: 1-2 sentence secret thoughts in customer's head)\n"
            "- 'true_intent' (string: what they secretly want right now, e.g., 'Wants ₹100 refund or will switch to Swiggy')\n"
            "- 'risk_level' (string: 'Low', 'Medium', 'High', or 'Extreme')\n"
        )

        user_prompt = f"Chat Context:\n{context}\n\nCustomer Typed Message:\n{customer_message}"

        try:
            resp = llm_chat(system_prompt, user_prompt, temperature=0.3)
            resp = resp.strip()
            match = re.search(r'\{.*\}', resp, re.DOTALL)
            raw_json = match.group(0) if match else resp
            data = json.loads(raw_json)

            return CustomerMindReadResult(
                internal_monologue=data.get("internal_monologue", "If this isn't fixed immediately, I will never order from here again."),
                true_intent=data.get("true_intent", "Demanding fast resolution or full refund."),
                risk_level=data.get("risk_level", "Medium")
            )

        except Exception:
            return CustomerMindReadResult(
                internal_monologue="I am very frustrated and just want a quick refund.",
                true_intent="Seeking immediate refund and apology.",
                risk_level="Medium"
            )

customer_mind_reader_agent = CustomerMindReaderAgent()
