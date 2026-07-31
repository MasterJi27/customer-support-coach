import os
import sys
import json
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

# Ensure project root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from src.core.orchestrator import Orchestrator
from src.core.models import InteractionMode
from src.core.config import settings
from src.core.database import database
from src.agents.manager_supervisor import manager_supervisor_agent
from src.agents.auto_pilot_agent import auto_pilot_agent
from src.modules.hall_of_fame import HallOfFameVault

app = FastAPI(title="CoachAI Enterprise API", version="2.0")

# Enable CORS for React frontend (Vite port 5173 / localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global orchestrator instance
orchestrator = Orchestrator()

class StartSessionRequest(BaseModel):
    mode: str = "simulator"
    agent_name: str = "Support Agent"
    product_context: str = "Zomato Food Delivery"
    scenario_choice: Optional[str] = "delivery_delay"

class SendMessageRequest(BaseModel):
    message: str
    role: str = "agent"  # 'agent' or 'customer'

@app.get("/")
def root():
    return {
        "service": "CoachAI Enterprise API",
        "version": "2.0",
        "docs": "/docs",
        "health": "/health",
        "endpoints": [
            "GET /health",
            "GET /api/analytics",
            "GET /api/reports",
            "GET /api/knowledge",
            "GET /api/hall-of-fame",
            "POST /api/session/start",
            "POST /api/chat/message",
            "POST /api/chat/autopilot",
            "POST /api/chat/manager-takeover",
        ],
    }

@app.get("/health")
def health_check():
    return {"status": "online", "engine": "Groq Llama 3.3 70B & Gemini", "rag": "Sub-5ms BM25"}

@app.get("/api/analytics")
def get_analytics():
    try:
        sessions = database.list_sessions() if hasattr(database, "list_sessions") else []
        return {
            "sessions": sessions,
            "summary": {
                "sessions_today": len(sessions),
                "avg_score_pct": 86,
                "escalation_rate_pct": 11,
                "predicted_csat": 4.3,
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/reports")
def list_reports():
    try:
        reports = []
        reports_dir = settings.reports_dir
        if os.path.isdir(reports_dir):
            for fname in sorted(os.listdir(reports_dir)):
                if fname.endswith(".json"):
                    fpath = os.path.join(reports_dir, fname)
                    try:
                        with open(fpath, "r", encoding="utf-8") as f:
                            data = json.load(f)
                            data["_file"] = fname
                            reports.append(data)
                    except Exception:
                        reports.append({"_file": fname})
        return {"reports": reports}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/knowledge")
def list_knowledge():
    try:
        docs = []
        kb_dir = settings.knowledge_base_dir
        if os.path.isdir(kb_dir):
            for fname in sorted(os.listdir(kb_dir)):
                if fname.endswith(".json"):
                    fpath = os.path.join(kb_dir, fname)
                    try:
                        with open(fpath, "r", encoding="utf-8") as f:
                            data = json.load(f)
                            data["_file"] = fname
                            docs.append(data)
                    except Exception:
                        pass
        return {"documents": docs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/hall-of-fame")
def get_hall_of_fame():
    try:
        vault = HallOfFameVault()
        entries = vault.get_all_entries()
        return {"entries": entries}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/session/start")
def start_session(req: StartSessionRequest):
    try:
        mode_enum = InteractionMode(req.mode)
        scenarios = orchestrator.list_scenarios()
        choice = req.scenario_choice if req.scenario_choice in scenarios else (list(scenarios.keys())[0] if scenarios else None)
        
        scenario = None
        if mode_enum == InteractionMode.SIMULATOR and choice:
            scenario = orchestrator.session_config_module.create_scenario(
                title=choice,
                problem_description=choice,
                customer_persona="Customer",
                product_context=req.product_context,
                emotional_start="frustrated"
            )
            
        session = orchestrator.start_session(
            mode=mode_enum,
            agent_name=req.agent_name,
            product_context=req.product_context,
            scenario=scenario
        )
        
        last_turn = session.turn_analyses[-1] if session.turn_analyses else None
        return {
            "status": "success",
            "session_id": session.session_id,
            "product_context": session.config.product_context,
            "agent_name": session.config.agent_name,
            "messages": [{"role": m.role, "content": m.content} for m in session.messages],
            "last_turn": _serialize_turn(last_turn)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat/message")
def send_message(req: SendMessageRequest):
    try:
        session = orchestrator.active_session
        if not session:
            # Auto-start if no active session
            start_session(StartSessionRequest())
            session = orchestrator.active_session
            
        if req.role == "agent":
            orchestrator.process_agent_input(req.message)
            # Advance customer simulator if simulator mode
            if session.config.mode == InteractionMode.SIMULATOR:
                orchestrator.advance_simulator()
        else:
            orchestrator.process_customer_input(req.message)
            
        last_turn = session.turn_analyses[-1] if session.turn_analyses else None
        return {
            "status": "success",
            "messages": [{"role": m.role, "content": m.content} for m in session.messages],
            "last_turn": _serialize_turn(last_turn)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat/autopilot")
def trigger_autopilot():
    try:
        session = orchestrator.active_session
        if not session or not session.turn_analyses:
            raise HTTPException(status_code=400, detail="No active turn to analyze.")
            
        last_turn = session.turn_analyses[-1]
        cust_msg = last_turn.customer_message or "Help needed."
        ap_res = auto_pilot_agent.generate_autopilot_response(cust_msg, session.get_conversation_context())
        
        orchestrator.process_agent_input(ap_res.suggested_reply)
        if session.config.mode == InteractionMode.SIMULATOR:
            orchestrator.advance_simulator()
            
        new_turn = session.turn_analyses[-1] if session.turn_analyses else None
        return {
            "status": "success",
            "suggested_reply": ap_res.suggested_reply,
            "tool_action": ap_res.tool_action_executed,
            "messages": [{"role": m.role, "content": m.content} for m in session.messages],
            "last_turn": _serialize_turn(new_turn)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat/manager-takeover")
def manager_takeover():
    try:
        session = orchestrator.active_session
        if not session:
            start_session(StartSessionRequest())
            session = orchestrator.active_session
            
        statement = manager_supervisor_agent.generate_manager_takeover_response(
            order_id="ORD-8142K",
            customer_name="Customer",
            issue="Order Delay & Refund Claim"
        )
        
        orchestrator.process_agent_input(statement)
        if session.config.mode == InteractionMode.SIMULATOR:
            orchestrator.advance_simulator()
            
        new_turn = session.turn_analyses[-1] if session.turn_analyses else None
        return {
            "status": "success",
            "statement": statement,
            "messages": [{"role": m.role, "content": m.content} for m in session.messages],
            "last_turn": _serialize_turn(new_turn)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def _serialize_turn(turn):
    if not turn:
        return None
    deep = turn.deep_analysis or {}
    kb_item = None
    if turn.knowledge_items:
        for item in turn.knowledge_items:
            src = item.source or ""
            if src not in ("ai-synthesis", "kb-gap-alert", "built-in faq"):
                kb_item = item
                break
        if kb_item is None:
            kb_item = turn.knowledge_items[0]
    escalation = turn.escalation_assessment
    return {
        "customer_message": turn.customer_message,
        "agent_message": turn.agent_message,
        "sentiment": turn.intent_analysis.sentiment.value if turn.intent_analysis else "neutral",
        "intent": turn.intent_analysis.intent.value if turn.intent_analysis else "general",
        "frustration_pct": int((turn.intent_analysis.frustration_level if turn.intent_analysis else 0.3) * 100),
        "satisfaction_trend": turn.intent_analysis.satisfaction_trend if turn.intent_analysis else 0.0,
        "coaching_tips": turn.coaching_feedback.communication_tips if turn.coaching_feedback else [],
        "suggested_response": turn.coaching_feedback.suggested_response if turn.coaching_feedback else "",
        "suggested_actions": turn.coaching_feedback.suggested_actions if turn.coaching_feedback else [],
        "quality_score": turn.coaching_feedback.response_quality_score if turn.coaching_feedback else 0.8,
        "clarity_pct": int((turn.coaching_feedback.clarity_score if turn.coaching_feedback else 0.85) * 100),
        "tone_quality": turn.coaching_feedback.tone_quality if turn.coaching_feedback else "Professional",
        "escalation_risk_pct": int((escalation.risk_score if escalation else 0.3) * 100),
        "escalation_reasoning": (escalation.reasoning if escalation else ""),
        "escalation_strategies": (escalation.recommended_strategies if escalation else []),
        "predicted_csat": deep.get("predicted_csat"),
        "churn_risk_pct": deep.get("churn_risk_pct"),
        "csat_drivers": deep.get("csat_drivers", []),
        "viral_risk_pct": deep.get("viral_risk_pct"),
        "platform_risk": deep.get("platform_risk"),
        "pr_statement": deep.get("preapproved_pr_statement", ""),
        "fraud_risk_pct": deep.get("fraud_risk_pct"),
        "fraud_category": deep.get("fraud_category"),
        "fraud_protocol": deep.get("fraud_protocol", ""),
        "defection_risk_pct": deep.get("defection_risk_pct"),
        "competitor_mentioned": deep.get("competitor_mentioned"),
        "retention_counter_offer": deep.get("retention_counter_offer", ""),
        "internal_monologue": deep.get("internal_monologue", ""),
        "true_intent": deep.get("true_intent", ""),
        "escalation_trigger": deep.get("escalation_trigger", ""),
        "kb": {
            "title": kb_item.title if kb_item else "",
            "content": kb_item.content if kb_item else "",
            "source": kb_item.source if kb_item else "",
        },
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
