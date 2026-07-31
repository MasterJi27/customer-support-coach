import json
import re
from src.core.models import CustomerIntent, IntentAnalysis, SentimentLabel
from src.core.llm import llm_chat
from src.core.prompts import build_intent_sentiment_system_prompt

class IntentSentimentAgent:
    def __init__(self):
        pass

    def analyze(self, message: str, context: str = "") -> IntentAnalysis:
        # Define allowed values for the LLM
        valid_intents = [i.value for i in CustomerIntent]
        valid_sentiments = [s.value for s in SentimentLabel]

        system_prompt = build_intent_sentiment_system_prompt(valid_intents, valid_sentiments)

        user_prompt = f"Conversation History:\n{context}\n\nCustomer Message to Analyze:\n{message}"

        try:
            # Call the LLM API
            response_text = llm_chat(system_prompt, user_prompt, temperature=0.1)
            
            # Clean up response just in case the LLM wrapped it in markdown
            response_text = response_text.strip()
            match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if match:
                raw_json = match.group(0)
            else:
                raw_json = response_text
                
            data = json.loads(raw_json)

            intent_val = data.get("intent", CustomerIntent.GENERAL_INQUIRY.value)
            sentiment_val = data.get("sentiment", SentimentLabel.NEUTRAL.value)

            # Map back to Enums with fallbacks
            try:
                intent = CustomerIntent(intent_val)
            except ValueError:
                intent = CustomerIntent.GENERAL_INQUIRY
                
            try:
                sentiment = SentimentLabel(sentiment_val)
            except ValueError:
                sentiment = SentimentLabel.NEUTRAL

            # Clamp numeric fields so an out-of-range LLM value doesn't force the fallback path
            frustration = max(0.0, min(1.0, float(data.get("frustration_level", 0.0))))
            satisfaction = max(-1.0, min(1.0, float(data.get("satisfaction_trend", 0.0))))

            return IntentAnalysis(
                intent=intent,
                sentiment=sentiment,
                frustration_level=frustration,
                satisfaction_trend=satisfaction,
                reasoning=data.get("reasoning", "Analyzed via Groq API.")
            )

        except Exception as e:
            # Fallback if API fails or parsing fails
            return IntentAnalysis(
                intent=CustomerIntent.GENERAL_INQUIRY,
                sentiment=SentimentLabel.NEUTRAL,
                frustration_level=0.0,
                satisfaction_trend=0.0,
                reasoning=f"Fallback due to API error: {str(e)}"
            )
