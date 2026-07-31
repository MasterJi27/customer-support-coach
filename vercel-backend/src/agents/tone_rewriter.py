import json
from src.core.llm import llm_chat
from src.core.prompts import TONE_REWRITER_SYSTEM_PROMPT, build_tone_rewriter_user_prompt


class ToneRewriterAgent:
    def polish_response(self, draft_text: str, customer_message: str) -> str:
        user_prompt = build_tone_rewriter_user_prompt(customer_message, draft_text)
        res = llm_chat(TONE_REWRITER_SYSTEM_PROMPT, user_prompt)
        if res and len(res.strip()) > 10:
            return res.strip(" '\"")
        
        # Fallback if LLM rate limited
        return f"I completely understand your concern regarding this matter, and I truly apologize for any frustration caused. Let me take immediate action to resolve this for you right away."


tone_rewriter_agent = ToneRewriterAgent()
