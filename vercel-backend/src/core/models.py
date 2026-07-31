from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional
import typing

from pydantic import BaseModel, Field


class InteractionMode(str, Enum):
    SIMULATOR = "simulator"
    MANUAL = "manual"
    REPLAY = "replay"


class SentimentLabel(str, Enum):
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"
    FRUSTRATED = "frustrated"
    ANGRY = "angry"
    SATISFIED = "satisfied"


class CustomerIntent(str, Enum):
    TECHNICAL_ISSUE = "technical_issue"
    BILLING = "billing"
    ACCOUNT = "account"
    GENERAL_INQUIRY = "general_inquiry"
    COMPLAINT = "complaint"
    FEEDBACK = "feedback"
    CANCELLATION = "cancellation"
    REFUND = "refund"
    OTHER = "other"


class EscalationRisk(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ComplianceViolation(BaseModel):
    is_violation: bool
    reasoning: str
    severity: str

class Message(BaseModel):
    role: str  # "customer" | "agent" | "system"
    content: str
    sender: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)

    def model_dump(self, **kwargs: typing.Any) -> dict:  # type: ignore[override]
        return {
            "role": self.role,
            "content": self.content,
            "sender": self.sender,
            "timestamp": self.timestamp.isoformat(),
        }


class Scenario(BaseModel):
    title: str
    customer_persona: str
    problem_description: str
    product_context: str
    emotional_start: SentimentLabel = SentimentLabel.NEUTRAL


class SessionConfig(BaseModel):
    mode: InteractionMode
    scenario: Optional[Scenario] = None
    product_context: str = ""
    agent_name: str = "Agent"
    transcript_path: Optional[str] = None
    risk_threshold: float = Field(default=0.7, ge=0.0, le=1.0)


class IntentAnalysis(BaseModel):
    intent: CustomerIntent
    sentiment: SentimentLabel
    frustration_level: float = Field(ge=0.0, le=1.0)
    satisfaction_trend: float = Field(ge=-1.0, le=1.0)
    reasoning: str = ""


class KnowledgeItem(BaseModel):
    title: str
    content: str
    relevance_score: float = Field(ge=0.0, le=1.0)
    source: str = ""


class CoachingFeedback(BaseModel):
    tone_quality: str = ""
    clarity_score: float = Field(ge=0.0, le=1.0)
    communication_tips: list[str] = []
    suggested_response: str = ""
    suggested_actions: list[dict] = []
    suggested_macros: list[str] = []
    response_quality_score: float = Field(ge=0.0, le=1.0)


class EscalationAssessment(BaseModel):
    risk_level: EscalationRisk
    risk_score: float = Field(ge=0.0, le=1.0)
    reasoning: str = ""
    recommended_strategies: list[str] = []


class TurnAnalysis(BaseModel):
    turn_number: int
    customer_message: str
    agent_message: Optional[str] = None
    intent_analysis: Optional[IntentAnalysis] = None
    knowledge_items: list[KnowledgeItem] = []
    coaching_feedback: Optional[CoachingFeedback] = None
    escalation_assessment: Optional[EscalationAssessment] = None
    deep_analysis: dict = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.now)


class ResolutionQuality(BaseModel):
    score: float = Field(default=0.0, ge=0.0, le=1.0)
    issue_resolved: bool = False
    customer_satisfied: bool = False
    escalation_needed: bool = False


class PerformanceReport(BaseModel):
    session_id: str
    agent_name: str = ""
    interaction_mode: InteractionMode
    total_turns: int = 0
    sentiment_journey: list[dict] = []
    resolution_quality: Optional[ResolutionQuality] = None
    overall_score: float = Field(default=0.0, ge=0.0, le=1.0)
    coaching_recommendations: list[str] = []
    escalation_triggers: list[str] = []
    knowledge_gaps: list[str] = []
    generated_at: datetime = Field(default_factory=datetime.now)


class SessionState(BaseModel):
    session_id: str
    config: SessionConfig
    messages: list[Message] = []
    turn_analyses: list[TurnAnalysis] = []
    current_turn: int = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.now)

    def add_message(self, message: Message):
        self.messages.append(message)

    def get_conversation_context(self, window: int = 5) -> str:
        recent = self.messages[-window:] if len(self.messages) > window else self.messages
        return "\n".join(f"{m.role}: {m.content}" for m in recent)

    def model_dump(self, **kwargs: typing.Any) -> dict:  # type: ignore[override]
        return {
            "session_id": self.session_id,
            "config": self.config.model_dump() if hasattr(self.config, 'model_dump') else self.config.__dict__,
            "messages": [m.model_dump() for m in self.messages],
            "current_turn": self.current_turn,
            "is_active": self.is_active,
        }


class ToolCallResult(BaseModel):
    tool_name: str
    arguments: dict
    success: bool
    result_text: str
    executed_at: datetime = Field(default_factory=datetime.now)


class PredictiveCSATResult(BaseModel):
    predicted_csat: float = Field(ge=1.0, le=5.0)  # 1.0 to 5.0
    churn_risk_pct: float = Field(ge=0.0, le=100.0)  # 0 to 100%
    csat_delta: float = 0.0
    churn_delta: float = 0.0
    key_drivers: list[str] = []
    recommended_action_to_boost: str = ""


class ManagerIntervention(BaseModel):
    requires_intervention: bool = False
    intervention_type: str = "none"  # "whisper", "takeover", "auto_approve_voucher"
    whisper_note: str = ""
    reasoning: str = ""
    suggested_action: str = ""


class GeneratedScenario(BaseModel):
    title: str
    product_context: str
    customer_persona: str
    problem_description: str
    difficulty: str  # "easy", "challenging", "nightmare"
    emotional_start: SentimentLabel = SentimentLabel.ANGRY


class JiraBugTicket(BaseModel):
    ticket_id: str
    summary: str
    issue_type: str = "Bug"
    priority: str = "High"
    component: str = "Order Management"
    description: str
    steps_to_reproduce: list[str] = []
    affected_merchants_or_users: list[str] = []
    suggested_fix: str = ""
    created_at: datetime = Field(default_factory=datetime.now)


class FraudDetectionResult(BaseModel):
    is_suspicious: bool = False
    fraud_risk_score: float = Field(default=0.0, ge=0.0, le=100.0)  # 0 to 100%
    risk_category: str = "Low Risk"
    historical_red_flags: list[str] = []
    recommended_protocol: str = ""


class ViralPRThreatResult(BaseModel):
    is_viral_threat: bool = False
    viral_risk_score: float = Field(default=0.0, ge=0.0, le=100.0)  # 0 to 100%
    platform_risk: str = "Twitter / Social Media"
    key_threat_triggers: list[str] = []
    preapproved_pr_statement: str = ""


class MultiverseBranch(BaseModel):
    branch_id: str
    parent_turn: int
    option_a_text: str
    option_a_outcome: str
    option_a_csat: float
    option_b_text: str
    option_b_outcome: str
    option_b_csat: float


class SurvivalGameState(BaseModel):
    health: int = 100
    score: int = 0
    streak: int = 0
    active_powerup: str | None = None
    seconds_remaining: int = 30
    is_game_over: bool = False

    created_at: datetime = Field(default_factory=datetime.now)


class CustomerMindReadResult(BaseModel):
    internal_monologue: str
    true_intent: str
    risk_level: str = "Low"


class CompetitorDefectionResult(BaseModel):
    is_defection_threat: bool = False
    defection_risk_pct: float = Field(default=0.0, ge=0.0, le=100.0)
    competitor_mentioned: str = "Swiggy / Competitor"
    retention_counter_offer: str = ""


class VoiceStressMetrics(BaseModel):
    vocal_tension_pct: float = Field(default=25.0, ge=0.0, le=100.0)
    pitch_instability: float = Field(default=0.15, ge=0.0, le=1.0)
    speech_wpm: int = Field(default=135, ge=50, le=300)
    tone_emotion: str = "Agitated"


class HallOfFameEntry(BaseModel):
    entry_id: str
    title: str
    category: str  # "Hall of Fame" or "Hall of Shame"
    overall_score: float
    summary: str
    created_at: datetime = Field(default_factory=datetime.now)


class AutoPilotResult(BaseModel):
    suggested_reply: str
    tool_action_executed: str | None = None
    reasoning: str = ""


class CustomerPatienceResult(BaseModel):
    patience_turns_remaining: int = 3
    urgency_level: str = "Moderate"
    dropoff_risk_pct: float = Field(default=35.0, ge=0.0, le=100.0)


class QAComplianceAudit(BaseModel):
    fcr_status: bool = True
    iso_score: float = Field(default=95.0, ge=0.0, le=100.0)
    greeting_passed: bool = True
    empathy_passed: bool = True
    audit_stamp: str = "ISO-9001 PASSED"


class OrderHeaderCard(BaseModel):
    order_id: str = "ORD-8142K"
    restaurant_name: str = "Biryani Blues"
    items_summary: str = "Chicken Biryani (1x), Paneer Tikka (1x)"
    order_amount: float = 250.0
    payment_method: str = "GPay UPI"
    delivery_address: str = "Flat 402, Block B, Green Glen Layout"
    order_status: str = "Out for Delivery (Missing Main Course Claimed)"


class RiderStatusCard(BaseModel):
    rider_name: str = "Ramesh Kumar"
    rider_phone: str = "+91-9876543210"
    distance_km: float = 1.2
    eta_mins: int = 8
    rider_status: str = "En-route to Customer Location"


class PhotoProofAttachment(BaseModel):
    file_name: str
    issue_type: str = "Missing / Damaged Food"
    attached_at: datetime = Field(default_factory=datetime.now)


class AgentCognitiveLoad(BaseModel):
    cognitive_load_pct: float = Field(default=45.0, ge=0.0, le=100.0)
    focus_score: float = Field(default=88.0, ge=0.0, le=100.0)
    ticket_complexity: str = "Moderate"


class ArcadeTicket(BaseModel):
    ticket_id: str
    customer_name: str
    issue_title: str
    problem_description: str
    urgency_level: str = "HIGH"
    timer_seconds: int = 45
    is_resolved: bool = False
    agent_reply: str | None = None





