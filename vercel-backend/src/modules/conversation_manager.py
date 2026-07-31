from src.core.models import (
    CoachingFeedback,
    IntentAnalysis,
    Message,
    SessionState,
    TurnAnalysis,
)

from src.agents.customer_simulator import CustomerSimulatorAgent
from src.agents.intent_sentiment import IntentSentimentAgent
from src.agents.knowledge_recommendation import KnowledgeRecommendationAgent
from src.agents.coaching_suggestion import CoachingSuggestionAgent
from src.agents.escalation_monitor import EscalationMonitorAgent
from src.agents.coach_calibrator import CoachCalibrator
from src.agents.predictive_csat import predictive_csat_agent
from src.agents.manager_supervisor import manager_supervisor_agent
from src.agents.deep_analysis import deep_analysis_agent
from src.tools.mock_backend import mock_backend


class ConversationManager:
    """
    Manages the logic for each turn of the conversation.
    Invokes Intent, RAG, Coaching, Escalation, CSAT Prediction, and Manager Supervision agents.
    """
    def __init__(self):
        # Initialize the specialized agents used during the live conversation
        self.simulator = CustomerSimulatorAgent()
        self.intent_agent = IntentSentimentAgent()
        self.knowledge_agent = KnowledgeRecommendationAgent()
        self.coaching_agent = CoachingSuggestionAgent()
        self.escalation_agent = EscalationMonitorAgent()
        self.calibrator = CoachCalibrator()
        self.csat_agent = predictive_csat_agent
        self.manager_agent = manager_supervisor_agent
        self.mock_tools = mock_backend
        
        # Configuration flag for humor mode (easter egg)
        self.humor_mode = False
        # Authentic Zomato Bot vs Live Agent mode flag
        self.bot_mode = "zomato_bot"  # "zomato_bot" or "live_human_agent"

    def toggle_bot_mode(self, new_mode: str) -> str:
        self.bot_mode = new_mode
        return self.bot_mode

    def process_customer_message(
        self, session: SessionState, customer_message: Message
    ) -> TurnAnalysis:
        """
        Processes an incoming message from the customer.
        Runs the message through our NLP and RAG pipelines to generate coaching tips
        and escalate if necessary.
        """
        session.add_message(customer_message)
        session.current_turn += 1
        context = session.get_conversation_context()

        # 1. Analyze the customer's intent and emotional state
        intent_analysis = self.intent_agent.analyze(customer_message.content, context)
        
        # 2. Retrieve relevant articles using Agentic RAG
        knowledge_items = self.knowledge_agent.recommend(customer_message.content)
        
        # 3. Deep-turn signal engine: CSAT/churn forecast, viral PR threat, fraud,
        #    competitor defection, and customer mind-reader — one efficient LLM call.
        deep = deep_analysis_agent.analyze(customer_message.content, context)

        # 4. Generate proactive coaching advice for the agent (deep-aware)
        coaching = self._generate_coaching(session, customer_message, intent_analysis, knowledge_items, deep)
        
        # 5. Assess if the customer is becoming a flight risk
        escalation = self.escalation_agent.assess(session, intent_analysis)

        # Package the analysis into a single Turn object
        turn_analysis = TurnAnalysis(
            turn_number=session.current_turn,
            customer_message=customer_message.content,
            intent_analysis=intent_analysis,
            knowledge_items=knowledge_items,
            coaching_feedback=coaching,
            escalation_assessment=escalation,
            deep_analysis=deep,
        )
        session.turn_analyses.append(turn_analysis)
        return turn_analysis

    def process_agent_response(
        self, session: SessionState, agent_message: Message, last_turn_analysis: TurnAnalysis
    ):
        session.add_message(agent_message)
        last_turn_analysis.agent_message = agent_message.content
        escalation_pct = int((last_turn_analysis.escalation_assessment.risk_score if last_turn_analysis.escalation_assessment else 0) * 100)
        last_turn_analysis.coaching_feedback = self.coaching_agent.analyze_response(
            Message(role="customer", content=last_turn_analysis.customer_message),
            agent_message,
            last_turn_analysis.intent_analysis,
            humor_mode=self.humor_mode,
            knowledge_items=last_turn_analysis.knowledge_items,
            escalation_pct=escalation_pct,
            deep=last_turn_analysis.deep_analysis,
        )

    def _generate_coaching(
        self, session: SessionState, customer_message: Message, intent_analysis: IntentAnalysis,
        knowledge_items: list = None, deep: dict | None = None,
    ) -> CoachingFeedback:
        return self.coaching_agent.analyze_response(
            customer_message, None, intent_analysis, humor_mode=self.humor_mode,
            knowledge_items=knowledge_items,
            deep=deep,
        )

    def should_show_coaching(
        self, agent_name: str, coaching: CoachingFeedback
    ) -> tuple[bool, float]:
        return self.calibrator.should_intervene(agent_name, coaching)

    def record_coaching_effect(
        self,
        agent_name: str,
        coaching: CoachingFeedback | None,
        was_shown: bool,
        next_sentiment=None,
    ):
        self.calibrator.record_turn(agent_name, coaching, was_shown, next_sentiment)

    def generate_simulator_reply(self, session: SessionState, last_turn: TurnAnalysis) -> Message:
        scenario = session.config.scenario
        prev_sentiment = (
            last_turn.intent_analysis.sentiment
            if last_turn and last_turn.intent_analysis
            else (scenario.emotional_start if scenario else None)
        )
        agent_quality = (
            last_turn.coaching_feedback.response_quality_score
            if last_turn and last_turn.coaching_feedback
            else 0.5
        )
        hinglish = getattr(self, "hinglish_mode", False)
        return self.simulator.generate_reply(
            scenario, session.get_conversation_context(), prev_sentiment, agent_quality, hinglish_mode=hinglish
        )
