import os
import sys
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from src.core.orchestrator import Orchestrator
from src.core.models import InteractionMode
from src.agents.cognitive_load_agent import cognitive_load_agent
from src.agents.competitor_defection_agent import competitor_defection_agent
from src.agents.compliance_monitor import ComplianceMonitorAgent
from src.agents.customer_mind_reader import customer_mind_reader_agent
from src.agents.fraud_detector import fraud_detector_agent
from src.agents.multiverse_simulator import multiverse_simulator_agent
from src.agents.patience_clock_agent import patience_clock_agent
from src.agents.qa_audit_agent import qa_audit_agent
from src.agents.scenario_generator import scenario_generator_agent
from src.agents.viral_threat_predictor import viral_threat_predictor_agent
from src.agents.tone_rewriter import tone_rewriter_agent
from src.agents.bot_agent import bot_agent
from src.agents.auto_kb_agent import AutoKBAgent
from src.agents.jira_bug_generator import jira_bug_generator_agent
from src.modules.survival_game import survival_game_engine

router = APIRouter(prefix="/api", tags=["features"])

orchestrator: Orchestrator | None = None

def bind_orchestrator(orch: Orchestrator):
    global orchestrator
    orchestrator = orch

def _session(session_id: Optional[str] = None):
    if orchestrator is None:
        raise HTTPException(status_code=400, detail="No active session. Start a session first.")
    session = orchestrator.bind_session(session_id) if session_id else orchestrator.active_session
    if not session:
        raise HTTPException(
            status_code=400,
            detail="No session found for this session_id. Please start a new session.",
        )
    return session


class AnalysisRequest(BaseModel):
    message: str
    context: str = ""
    session_id: Optional[str] = None


class ToneRequest(BaseModel):
    draft: str
    customer_message: str = ""


class ScenarioRequest(BaseModel):
    product_context: str = "Zomato - Food Delivery App"
    difficulty: str = "challenging"
    compound_issues: Optional[list[str]] = None


class MultiverseRequest(BaseModel):
    message: str
    turn_number: int = 2


class PatienceRequest(BaseModel):
    message: str
    current_turn: int = 1
    session_id: Optional[str] = None


class SessionScopedRequest(BaseModel):
    session_id: Optional[str] = None


class SurvivalTurnRequest(BaseModel):
    ticket_index: int
    reply_text: str
    turn_time_seconds: float = 0.0


class WhisperRequest(BaseModel):
    text: str
    sender_id: str = "Manager"
    session_id: Optional[str] = None


class JiraRequest(BaseModel):
    product_context: str = "Zomato - Food Delivery App"
    session_id: Optional[str] = None


def _wrap(fn):
    try:
        return fn()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analysis/viral")
def viral_analysis(req: AnalysisRequest):
    return _wrap(lambda: viral_threat_predictor_agent.evaluate_viral_threat(req.message, req.context))


@router.post("/analysis/fraud")
def fraud_analysis(req: AnalysisRequest):
    return _wrap(lambda: fraud_detector_agent.evaluate_fraud_risk(req.message, req.context))


@router.post("/analysis/defection")
def defection_analysis(req: AnalysisRequest):
    return _wrap(lambda: competitor_defection_agent.evaluate_defection(req.message, req.context))


@router.post("/analysis/mind-reader")
def mind_reader_analysis(req: AnalysisRequest):
    return _wrap(lambda: customer_mind_reader_agent.read_customer_mind(req.message, req.context))


@router.post("/analysis/multiverse")
def multiverse_analysis(req: MultiverseRequest):
    return _wrap(lambda: multiverse_simulator_agent.simulate_multiverse(req.message, req.turn_number))


@router.post("/analysis/patience")
def patience_analysis(req: PatienceRequest):
    def run():
        session = _session(req.session_id)
        intent = session.turn_analyses[-1].intent_analysis if session.turn_analyses else None
        return patience_clock_agent.evaluate_patience(req.message, req.current_turn, intent)
    return _wrap(run)


@router.post("/analysis/cognitive-load")
def cognitive_load_analysis(req: AnalysisRequest):
    def run():
        session = _session(req.session_id)
        intent = session.turn_analyses[-1].intent_analysis if session.turn_analyses else None
        return cognitive_load_agent.evaluate_cognitive_load(req.message, intent)
    return _wrap(run)


@router.post("/analysis/compliance")
def compliance_analysis(req: SessionScopedRequest = SessionScopedRequest()):
    def run():
        session = _session(req.session_id)
        agent_msg = next((m for m in reversed(session.messages) if m.role == "agent"), None)
        if agent_msg is None:
            raise HTTPException(status_code=400, detail="No agent message to audit yet.")
        kbs = session.turn_analyses[-1].knowledge_items if session.turn_analyses else []
        return ComplianceMonitorAgent().assess(agent_msg, kbs)
    return _wrap(run)


@router.post("/analysis/tone")
def tone_polish(req: ToneRequest):
    return _wrap(lambda: tone_rewriter_agent.polish_response(req.draft, req.customer_message))


@router.post("/analysis/scenario")
def scenario_generation(req: ScenarioRequest):
    return _wrap(lambda: scenario_generator_agent.generate_scenario(
        req.product_context, req.difficulty, req.compound_issues
    ))


@router.post("/analysis/qa-audit")
def qa_audit(req: SessionScopedRequest = SessionScopedRequest()):
    def run():
        session = _session(req.session_id)
        report = orchestrator.end_session()
        return {
            "audit": qa_audit_agent.audit_session(report),
            "session_id": session.session_id,
            "overall_score": report.overall_score if report else None,
        }
    return _wrap(run)


@router.post("/analysis/auto-kb")
def auto_kb(req: SessionScopedRequest = SessionScopedRequest()):
    def run():
        session = _session(req.session_id)
        file_path = AutoKBAgent().trigger_auto_kb(session, session.turn_analyses)
        return {"drafted": file_path is not None, "file": file_path}
    return _wrap(run)


@router.post("/bot/reply")
def bot_reply(req: AnalysisRequest):
    def run():
        session = _session(req.session_id)
        intent = session.turn_analyses[-1].intent_analysis if session.turn_analyses else None
        return {
            "reply": bot_agent.generate_bot_reply(req.message, intent),
            "should_escalate": bot_agent.should_escalate(req.message, intent),
            "escalation_reason": bot_agent.escalation_reason(req.message, intent),
        }
    return _wrap(run)


@router.post("/jira/ticket")
def jira_ticket(req: JiraRequest):
    def run():
        session = _session(req.session_id)
        ticket = jira_bug_generator_agent.generate_jira_ticket(
            session.messages, session.turn_analyses, req.product_context
        )
        return ticket.model_dump() if hasattr(ticket, "model_dump") else ticket
    return _wrap(run)


@router.post("/survival/start")
def survival_start():
    state = survival_game_engine.start_new_game()
    return {
        "state": state.model_dump(),
        "tickets": [t.model_dump() for t in survival_game_engine.active_tickets],
    }


@router.post("/survival/turn")
def survival_turn(req: SurvivalTurnRequest):
    state, feedback = survival_game_engine.process_ticket_turn(
        req.ticket_index, req.reply_text, req.turn_time_seconds
    )
    return {
        "state": state.model_dump(),
        "feedback": feedback,
        "tickets": [t.model_dump() for t in survival_game_engine.active_tickets],
    }


@router.post("/manager/whisper")
def manager_whisper(req: WhisperRequest):
    def run():
        session = _session(req.session_id)
        orchestrator.process_whisper(req.text, req.sender_id)
        return {"status": "success", "sender_id": req.sender_id, "text": req.text}
    return _wrap(run)


@router.post("/chat/end")
def end_session(req: SessionScopedRequest = SessionScopedRequest()):
    def run():
        session = _session(req.session_id)
        report = orchestrator.end_session()
        return {
            "status": "success",
            "session_id": session.session_id,
            "report": report.model_dump() if report else None,
        }
    return _wrap(run)
