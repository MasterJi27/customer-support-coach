import json
from src.core.llm import llm_chat


class ToneRewriterAgent:
    def polish_response(self, draft_text: str, customer_message: str) -> str:
        prompt = f"""
You are an executive AI Communication Coach for a senior customer support agent at Zomato / Enterprise SaaS.
The customer said: "{customer_message}"
The agent wrote this initial rough draft response: "{draft_text}"

Task: Rewrite the agent's draft response so that it is:
1. Highly empathetic, warm, and professional.
2. Clear and direct without being defensive or argumentative.
3. Fully policy-compliant and de-escalating.

Return ONLY the final polished agent response text without any introduction or quotes.
"""
        res = llm_chat(prompt)
        if res and len(res.strip()) > 10:
            return res.strip(" '\"")
        
        # Fallback if LLM rate limited
        return f"I completely understand your concern regarding this matter, and I truly apologize for any frustration caused. Let me take immediate action to resolve this for you right away."


tone_rewriter_agent = ToneRewriterAgent()
