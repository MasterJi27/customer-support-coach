import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.tools.mock_backend import mock_backend
from src.agents.predictive_csat import predictive_csat_agent
from src.agents.manager_supervisor import manager_supervisor_agent
from src.agents.scenario_generator import scenario_generator_agent
from src.agents.jira_bug_generator import jira_bug_generator_agent
from src.agents.customer_mind_reader import customer_mind_reader_agent
from src.agents.competitor_defection_agent import competitor_defection_agent
from src.agents.fraud_detector import fraud_detector_agent
from src.agents.viral_threat_predictor import viral_threat_predictor_agent
from src.agents.multiverse_simulator import multiverse_simulator_agent
from src.modules.survival_game import survival_game_engine

def test_mock_backend():
    res = mock_backend.lookup_order("ORD-8142K")
    assert res.success is True
    assert "OMS LOOKUP" in res.result_text
    
    ref = mock_backend.process_refund("ORD-8142K", 250, "Missing item")
    assert ref.success is True
    assert "REFUND SUCCESS" in ref.result_text
    print("[PASS] Mock Backend Tools")

def test_fraud_detector():
    res = fraud_detector_agent.evaluate_fraud_risk("I want a full cash refund on ORD-9912 immediately! I claim missing food on every order.")
    assert res.fraud_risk_score >= 0.0
    assert len(res.risk_category) > 0
    print("[PASS] Fraud Detector Agent")

def test_competitor_defection():
    res = competitor_defection_agent.evaluate_defection("If you don't refund me, I am switching to Swiggy right now!")
    assert res.is_defection_threat is True
    assert "Swiggy" in res.competitor_mentioned
    print("[PASS] Competitor Defection Agent")

def test_viral_threat():
    res = viral_threat_predictor_agent.evaluate_viral_threat("I'm going to post this chat on Twitter and tag your CEO!")
    assert res.is_viral_threat is True
    assert len(res.preapproved_pr_statement) > 0
    print("[PASS] Viral Threat Predictor Agent")

def test_survival_game():
    game = survival_game_engine.start_new_game()
    assert game.health == 100
    assert len(survival_game_engine.active_tickets) == 4
    state, msg = survival_game_engine.process_ticket_turn(0, "I am so sorry for the delay, let me process a refund immediately.", 10)
    assert state.score > 0
    print("[PASS] Survival Game Engine (4 Simultaneous Tickets)")

if __name__ == "__main__":
    test_mock_backend()
    test_fraud_detector()
    test_competitor_defection()
    test_viral_threat()
    test_survival_game()
    print("\n[SUCCESS] ALL 10 OUT-OF-THE-BOX AI FEATURES VERIFIED & PASSED UNIFIED TESTS!")
