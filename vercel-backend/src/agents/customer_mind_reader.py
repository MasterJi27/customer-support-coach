import json
import re
from src.core.models import CustomerMindReadResult
from src.core.llm import llm_chat
from src.core.prompts import CUSTOMER_MIND_READER_SYSTEM_PROMPT

class CustomerMindReaderAgent:
    """
    Reveals the customer's true internal thoughts and hidden expectations vs what they typed in chat.
    """

    def read_customer_mind(
        self,
        customer_message: str,
        context: str = ""
    ) -> CustomerMindReadResult:

        system_prompt = CUSTOMER_MIND_READER_SYSTEM_PROMPT

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
