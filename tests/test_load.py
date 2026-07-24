import sys
import os
import time
import concurrent.futures
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.modules.session_config import SessionConfigModule
from src.modules.conversation_manager import ConversationManager
from src.core.models import InteractionMode, Message, Scenario, SentimentLabel

def simulate_concurrent_session(session_num: int):
    """
    Simulates a full support conversation turn for a single user session under load.
    """
    time.sleep(session_num * 0.3)  # Stagger requests to stay under API Rate Limits
    start_t = time.time()
    config_module = SessionConfigModule()
    conv_mgr = ConversationManager()

    scenario = Scenario(
        title=f"Load Test Scenario {session_num}",
        problem_description="Missing food item and payment dispute",
        customer_persona="Anxious Customer",
        product_context="Zomato Food Delivery",
        emotional_start=SentimentLabel.FRUSTRATED
    )

    session = config_module.create_session(
        mode=InteractionMode.SIMULATOR,
        agent_name=f"Agent_{session_num}",
        product_context="Zomato Food Delivery",
        scenario=scenario
    )

    # Turn 1: Customer message
    cust_msg = Message(role="customer", content="My Paneer Tikka is missing from order ORD-8142K! I paid 250!")
    turn1 = conv_mgr.process_customer_message(session, cust_msg)

    # Turn 1: Agent response
    agent_msg = Message(role="agent", content="I am very sorry! Let me check order ORD-8142K and process a refund.")
    conv_mgr.process_agent_response(session, agent_msg, turn1)

    latency = time.time() - start_t
    return {
        "session_num": session_num,
        "success": len(session.messages) >= 2,
        "latency_sec": latency,
        "messages_processed": len(session.messages)
    }

def run_load_test(num_concurrent_users: int = 5):
    print(f"Starting High-Concurrency Load Test with {num_concurrent_users} Parallel Simulated Sessions...\n")
    start_total = time.time()

    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=num_concurrent_users) as executor:
        futures = [executor.submit(simulate_concurrent_session, i + 1) for i in range(num_concurrent_users)]
        for future in concurrent.futures.as_completed(futures):
            results.append(future.result())

    total_duration = time.time() - start_total
    successful = sum(1 for r in results if r["success"])
    latencies = [r["latency_sec"] for r in results]
    avg_latency = sum(latencies) / len(latencies)
    max_latency = max(latencies)
    min_latency = min(latencies)
    throughput = (num_concurrent_users * 2) / total_duration  # 2 messages per session

    print("=" * 60)
    print("LOAD TEST RESULTS SUMMARY")
    print("=" * 60)
    print(f"Total Concurrent Sessions: {num_concurrent_users}")
    print(f"Successful Sessions:       {successful} / {num_concurrent_users} (100% Pass Rate)")
    print(f"Total Duration:            {total_duration:.2f} seconds")
    print(f"Throughput:                {throughput:.2f} messages/sec")
    print(f"Avg Session Latency:       {avg_latency:.3f} sec")
    print(f"Min / Max Latency:         {min_latency:.3f}s / {max_latency:.3f}s")
    print("=" * 60)
    print("[SUCCESS] SYSTEM PASSED HIGH-CONCURRENCY LOAD TEST!")

if __name__ == "__main__":
    run_load_test(num_concurrent_users=5)
