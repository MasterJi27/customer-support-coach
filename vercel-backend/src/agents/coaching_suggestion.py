from src.core.models import CoachingFeedback, IntentAnalysis, Message
from src.core.llm import llm_chat
from src.core.prompts import build_coaching_suggestion_system_prompt


import json
import os

class CoachingSuggestionAgent:
    def __init__(self):
        self.library = {"actions": [], "macros": []}
        try:
            lib_path = os.path.join("data", "macros_actions_library.json")
            if os.path.exists(lib_path):
                with open(lib_path, "r", encoding="utf-8") as f:
                    self.library = json.load(f)
        except Exception:
            pass

    def analyze_response(
        self,
        customer_message: Message,
        agent_message: Message | None,
        intent: IntentAnalysis | None,
        humor_mode: bool = False,
        knowledge_items: list | None = None,
        escalation_pct: int = 0,
        deep: dict | None = None,
    ) -> CoachingFeedback:
        agent_text = agent_message.content if agent_message else ""

        kb_policy = self._kb_policy_text(knowledge_items)
        deep_summary = self._deep_summary_text(deep)

        if agent_text.strip():
            llm_result = self._llm_evaluate(customer_message.content, agent_text, intent, humor_mode, kb_policy, escalation_pct, deep_summary)
        else:
            llm_result = None

        tone_quality, clarity_score = self._evaluate_tone(agent_text)

        if llm_result:
            suggested_response = llm_result.get("suggested", self._suggest_response(customer_message.content, intent))
            communication_tips = llm_result.get("tips", self._generate_tips(agent_text, intent))
            llm_clarity = llm_result.get("clarity", clarity_score)
            clarity_score = (clarity_score + llm_clarity) / 2
            raw_actions = llm_result.get("actions", [])
            suggested_actions = []
            for a in raw_actions:
                if isinstance(a, dict):
                    suggested_actions.append(a)
                elif isinstance(a, str):
                    suggested_actions.append({"label": a, "api_endpoint": ""})

            raw_macros = llm_result.get("macros", [])
            suggested_macros = []
            for m in raw_macros:
                if isinstance(m, dict):
                    suggested_macros.append(m.get("text") or m.get("content") or str(m))
                elif isinstance(m, str):
                    suggested_macros.append(m)
        else:
            suggested_response = self._suggest_response(customer_message.content, intent, kb_policy, deep)
            communication_tips = self._generate_tips(agent_text, intent, deep)
            suggested_actions = []
            suggested_macros = []

        if deep and deep.get("preapproved_pr_statement") and communication_tips:
            pr_tip = f"📣 PR Statement (viral risk {deep.get('viral_risk_pct', 0)}%): {deep['preapproved_pr_statement']}"
            if pr_tip not in communication_tips:
                communication_tips.append(pr_tip)

        quality_score = round(clarity_score * 0.7 + self._empathy_score(agent_text) * 0.3, 2)

        if humor_mode:
            if llm_result and "humor" in llm_result:
                communication_tips.insert(0, llm_result["humor"])
            elif not agent_text.strip():
                import random
                waiting_roasts = [
                    "Still waiting... even a 'hold on' would be progress.",
                    "The customer is staring at their screen. Any day now.",
                    "Crickets. The customer is typing 'hello?' as we speak.",
                    "Radio silence. The customer is filing a complaint in their mind.",
                    "The void stares back. Type something, anything.",
                ]
                communication_tips.insert(0, random.choice(waiting_roasts))

        # Feature 15: Customer Churn & Concession Nudge
        churn_keywords = ["cancel", "refund", "leaving", "close account", "unacceptable", "terminate", "switch", "lawyer", "worst service"]
        customer_text = customer_message.content.lower() if customer_message else ""
        has_churn_intent = any(k in customer_text for k in churn_keywords) or (intent and intent.frustration_level > 0.65)
        
        if has_churn_intent:
            retention_tip = "🎁 Retention Concession Nudge: High escalation/churn risk! Authorized to offer 15% Discount Code 'STAY15' or 1-Month Free Extension."
            if retention_tip not in communication_tips:
                communication_tips.insert(0, retention_tip)
            if not any(a.get("label") == "Offer 15% Retention Voucher" for a in suggested_actions if isinstance(a, dict)):
                suggested_actions.append({
                    "label": "🎁 Offer 15% Retention Voucher (Code: STAY15)",
                    "api_endpoint": "/api/v1/coupons/apply_stay15"
                })

        return CoachingFeedback(
            tone_quality=tone_quality,
            clarity_score=round(clarity_score, 2),
            communication_tips=communication_tips,
            suggested_response=suggested_response,
            suggested_actions=suggested_actions,
            suggested_macros=suggested_macros,
            response_quality_score=quality_score,
        )

    def _llm_evaluate(self, customer_text: str, agent_text: str, intent: IntentAnalysis | None, humor_mode: bool = False,
                      kb_policy: str = "", escalation_pct: int = 0, deep_summary: str = "") -> dict:
        intent_str = intent.intent.value if intent else "general"
        sentiment_str = intent.sentiment.value if intent else "neutral"
        frustration = intent.frustration_level if intent else 0

        system = build_coaching_suggestion_system_prompt(
            library_json=json.dumps(self.library, indent=2),
            intent_str=intent_str,
            sentiment_str=sentiment_str,
            frustration_pct=int(frustration * 100),
            humor_mode=humor_mode,
            kb_policy=kb_policy,
            escalation_pct=escalation_pct,
            deep_summary=deep_summary,
        )

        user = f"Customer said: {customer_text}\nAgent responded: {agent_text}"
        raw = llm_chat(system, user, temperature=0.3)

        if not raw:
            return {}

        import re
        try:
            raw = raw.strip()
            # Try to find JSON block using regex if it's wrapped in markdown or conversational text
            match = re.search(r'\{.*\}', raw, re.DOTALL)
            if match:
                raw_json = match.group(0)
            else:
                raw_json = raw
            return json.loads(raw_json)
        except Exception as e:
            print(f"JSON Parsing Error: {e}\nRaw LLM output:\n{raw}")
            return {}

    def _evaluate_tone(self, text: str) -> tuple[str, float]:
        if not text.strip():
            return "No response yet", 0.0

        text_lower = text.lower()

        empathy_words = ["understand", "sorry", "apologize", "sympathize", "appreciate",
                         "frustrating", "know how you feel", "help", "assist"]
        empathy_count = sum(1 for w in empathy_words if w in text_lower)

        closing_words = ["does that help", "let me know", "anything else", "happy to help",
                         "is there anything", "please let me know"]
        has_closing = any(w in text_lower for w in closing_words)

        sentences = [s.strip() for s in text.replace("!", ".").replace("?", ".").split(".") if s.strip()]
        avg_sentence_len = sum(len(s.split()) for s in sentences) / max(len(sentences), 1)

        if empathy_count >= 2:
            tone_quality = "Empathetic and Professional"
        elif empathy_count == 1:
            tone_quality = "Professional with some empathy"
        else:
            tone_quality = "Neutral"

        clarity_score = 0.5
        if 8 <= avg_sentence_len <= 20:
            clarity_score += 0.2
        if has_closing:
            clarity_score += 0.15
        clarity_score += min(empathy_count * 0.1, 0.15)

        return tone_quality, min(clarity_score, 1.0)

    def _empathy_score(self, text: str) -> float:
        empathy_phrases = ["understand", "frustrat", "sorry", "apologize",
                           "help", "assist", "resolve", "sort out"]
        matches = sum(1 for p in empathy_phrases if p in text.lower())
        return min(matches * 0.2, 1.0)

    def _kb_policy_text(self, knowledge_items: list | None) -> str:
        if not knowledge_items:
            return ""
        parts = []
        for item in knowledge_items[:2]:
            title = getattr(item, "title", "") or ""
            content = getattr(item, "content", "") or ""
            if title and content:
                parts.append(f"- {title}: {content[:400]}")
        return "\n".join(parts)

    def _deep_summary_text(self, deep: dict | None) -> str:
        if not deep:
            return ""
        parts = []
        if deep.get("predicted_csat"):
            parts.append(f"CSAT {deep['predicted_csat']}/5")
        if deep.get("churn_risk_pct"):
            parts.append(f"churn {deep['churn_risk_pct']}%")
        if deep.get("viral_risk_pct"):
            parts.append(f"viral {deep['viral_risk_pct']}%")
        if deep.get("fraud_risk_pct"):
            parts.append(f"fraud {deep['fraud_risk_pct']}%")
        if deep.get("internal_monologue"):
            parts.append(f"customer thinking: {deep['internal_monologue'][:120]}")
        if deep.get("true_intent"):
            parts.append(f"true intent: {deep['true_intent'][:120]}")
        if deep.get("retention_counter_offer"):
            parts.append(f"retention offer: {deep['retention_counter_offer'][:120]}")
        if deep.get("preapproved_pr_statement"):
            parts.append(f"PR statement: {deep['preapproved_pr_statement'][:160]}")
        return "; ".join(parts)

    def _generate_tips(self, agent_text: str, intent: IntentAnalysis | None, deep: dict | None = None) -> list[str]:
        tips = []
        text_lower = agent_text.lower()

        if not agent_text.strip():
            tips.append("Respond to the customer's message promptly to acknowledge their concern.")
            return tips

        empathy_phrases = ["understand", "sorry", "apologize", "frustrat"]
        if not any(p in text_lower for p in empathy_phrases):
            tips.append("Consider using empathetic language to acknowledge the customer's feelings.")

        words = agent_text.split()
        avg_word_len = sum(len(w) for w in words) / max(len(words), 1)
        if avg_word_len > 7:
            tips.append("Use simpler language — avoid jargon or overly complex terms.")

        if len(text_lower) > 300:
            tips.append("Keep responses concise. Customers prefer brief, direct answers.")

        question_count = agent_text.count("?")
        if question_count > 2:
            tips.append("Avoid asking too many questions at once. Ask one at a time.")

        if intent and intent.frustration_level > 0.5:
            tips.append("Stay calm and avoid being defensive. Focus on solutions, not explanations.")

        if deep:
            if deep.get("churn_risk_pct", 0) >= 50:
                tips.append(f"🚨 Churn risk {deep['churn_risk_pct']}% — offer the retention action: {deep.get('retention_counter_offer') or 'loyalty credit'} immediately.")
            if deep.get("viral_risk_pct", 0) >= 40:
                tips.append(f"📣 Public blast risk {deep['viral_risk_pct']}% ({deep.get('platform_risk')}) — use the PR statement and apologize with a concrete fix.")
            if deep.get("fraud_risk_pct", 0) >= 60:
                tips.append(f"🛡️ Fraud alert ({deep.get('fraud_category')}) — follow protocol: {deep.get('fraud_protocol') or 'verify order ID and payment proof before refunding'}.")
            if deep.get("defection_risk_pct", 0) >= 40:
                tips.append(f"🏃 Customer may switch to {deep.get('competitor_mentioned')} — counter with {deep.get('retention_counter_offer') or 'a goodwill offer'}.")
            if deep.get("true_intent"):
                tips.append(f"🧠 Mind-reader: {deep['true_intent']}")

        if not tips:
            tips.append("Consider adding a closing question to invite further discussion.")

        return tips

    def _detect_roast_category(self, agent_text: str, intent: IntentAnalysis | None) -> str:
        text_lower = agent_text.lower()
        if intent and intent.frustration_level > 0.6 and not any(w in text_lower for w in ["understand", "sorry", "apologize"]):
            return "no_empathy"
        if len(agent_text) > 300:
            return "too_long"
        if agent_text.count("?") > 2:
            return "too_many_questions"
        if any(w in text_lower for w in ["unfortunately", "policy", "cannot", "can't do"]):
            return "defensive"
        return "low_quality"

    def _suggest_response(self, customer_message: str, intent: IntentAnalysis | None,
                          kb_policy: str = "", deep: dict | None = None) -> str:
        # Deep signals first — the most specific, non-generic guidance wins.
        if deep and deep.get("retention_counter_offer"):
            return (
                f"I completely understand — this is on us, and I am fixing it right now. "
                f"{deep['retention_counter_offer']}. "
                f"{deep.get('true_intent', '') or 'This will reflect in 2-4 hours, and I will personally confirm.'}"
            )
        if deep and deep.get("preapproved_pr_statement") and deep.get("viral_risk_pct", 0) >= 40:
            return f"{deep['preapproved_pr_statement']}"

        if intent:
            intent_map = {
                "technical_issue": ("I understand you're experiencing a technical issue. "
                    "Let me help you troubleshoot this step by step. "
                    "Could you tell me when this issue first started?"),
                "billing": ("I apologize for the billing confusion. "
                    "Let me look into your account to verify the charges. "
                    "Could you share your account details so I can investigate?"),
                "account": ("I can help you with your account issue. "
                    "Let me verify your identity first. "
                    "Could you provide your registered email address?"),
                "cancellation": ("I understand you're considering cancellation. "
                    "I'd like to help address your concerns first. "
                    "Could you tell me what prompted this decision?"),
                "refund": ("I sincerely apologize for this. Let me immediately process your refund to the original "
                    "payment method — it reflects within 2-4 hours. I am also adding a goodwill credit as a token of apology."),
                "complaint": ("I sincerely apologize for your experience. "
                    "I want to make this right. "
                    "Let me investigate what happened and find the best solution for you."),
            }
            if intent.intent.value in intent_map:
                return intent_map[intent.intent.value]

        if intent and intent.frustration_level > 0.5:
            return ("I completely understand your frustration, and I apologize for the inconvenience. "
                    "Let me personally take ownership of this issue and find a resolution for you.")

        return ("Thank you for reaching out. "
                "I'd be happy to help you with your request. "
                "Could you provide a bit more detail so I can assist you better?")
