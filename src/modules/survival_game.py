import random
from src.core.models import SurvivalGameState, ArcadeTicket

SCENARIO_POOL = [
    {"name": "Rahul Verma", "title": "Delayed Biryani Order", "desc": "WHERE IS MY CHICKEN BIRYANI?! Order ORD-8142K was supposed to be delivered 45 mins ago! I paid ₹250 on GPay!", "timer": 45},
    {"name": "Priya Sharma", "title": "Double Payment Deduction", "desc": "I was double charged ₹520 for my order ORD-9912! Money was deducted twice from my account balance!", "timer": 40},
    {"name": "Amit Patel", "title": "Spilled Food Container", "desc": "The food container arrived completely crushed and spilled all over the delivery bag! The package is a total mess!", "timer": 50},
    {"name": "Sneha Reddy", "title": "Fake Delivery Status", "desc": "Ramesh Kumar (Rider) marked my order as 'Delivered' but no one came to my apartment floor! Where is my food?", "timer": 35},
    {"name": "Karan Malhotra", "title": "Cold & Stale Pizza", "desc": "The pizza arrived ice cold and completely stale after 1.5 hours of waiting! I want an immediate full refund!", "timer": 45},
    {"name": "Deepak Joshi", "title": "Missing Main Course", "desc": "I received only the salad and dip, but the main Butter Chicken dish is completely missing from my order!", "timer": 40},
    {"name": "Ananya Roy", "title": "Wrong Items Delivered", "desc": "I received vegetarian food instead of non-veg order! This is completely unacceptable!", "timer": 50},
]

class SurvivalGameEngine:
    """
    Manages state, multi-ticket queue, and scoring for the Support Survival Arcade Challenge Mode.
    """
    def __init__(self):
        self.state = SurvivalGameState()
        self.active_tickets: list[ArcadeTicket] = []
        self.start_new_game()

    def start_new_game(self) -> SurvivalGameState:
        self.state = SurvivalGameState(
            health=100,
            score=0,
            streak=0,
            active_powerup=None,
            seconds_remaining=45,
            is_game_over=False
        )

        # Generate 4 random distinct scenarios from SCENARIO_POOL
        chosen = random.sample(SCENARIO_POOL, k=4)
        self.active_tickets = [
            ArcadeTicket(
                ticket_id=f"TCK-{1000 + i}",
                customer_name=c["name"],
                issue_title=c["title"],
                problem_description=c["desc"],
                urgency_level="CRITICAL" if i == 0 else "HIGH",
                timer_seconds=c["timer"],
                is_resolved=False
            )
            for i, c in enumerate(chosen)
        ]

        return self.state

    def get_resolved_count(self) -> int:
        return sum(1 for t in self.active_tickets if t.is_resolved)

    def process_ticket_turn(self, ticket_index: int, reply_text: str, turn_time_seconds: float) -> tuple[SurvivalGameState, str]:
        if self.state.is_game_over:
            return self.state, "Game Over! Restart to play again."

        if ticket_index < 0 or ticket_index >= len(self.active_tickets):
            return self.state, "Invalid ticket selection."

        ticket = self.active_tickets[ticket_index]
        if ticket.is_resolved:
            return self.state, f"Ticket {ticket.ticket_id} is already resolved!"

        # Quality check
        txt_lower = reply_text.strip().lower()
        if len(reply_text.strip()) > 20 and any(kw in txt_lower for kw in ["sorry", "apologize", "refund", "check", "immediately", "help"]):
            response_quality = 0.85
        elif len(reply_text.strip()) > 10 and any(kw in txt_lower for kw in ["sorry", "wait", "ok", "help"]):
            response_quality = 0.6
        else:
            response_quality = 0.35

        feedback_msg = ""

        if response_quality >= 0.8:
            ticket.is_resolved = True
            ticket.agent_reply = reply_text
            self.state.score += 250 * (self.state.streak + 1)
            self.state.streak += 1
            heal = 10
            self.state.health = min(100, self.state.health + heal)
            feedback_msg = f"🔥 EXCELLENT DE-ESCALATION on {ticket.customer_name}'s ticket! +250 Pts (Streak: x{self.state.streak}) | +{heal} HP"

            if self.state.streak == 3:
                self.state.active_powerup = "🛡️ Manager Shield"
                feedback_msg += " | 🎁 UNLOCKED POWERUP: Manager Shield!"
            elif self.state.streak == 5:
                self.state.active_powerup = "⚡ Instant Refund Pass"
                feedback_msg += " | 🎁 UNLOCKED POWERUP: Instant Refund Pass!"

        elif response_quality >= 0.5:
            ticket.is_resolved = True
            ticket.agent_reply = reply_text
            self.state.score += 100
            feedback_msg = f"👍 GOOD REPLY to {ticket.customer_name}! Ticket Resolved! +100 Pts"
        else:
            damage = 25
            if self.state.active_powerup == "🛡️ Manager Shield":
                damage = 0
                self.state.active_powerup = None
                feedback_msg = f"🛡️ MANAGER SHIELD BLOCKED DAMAGE on {ticket.customer_name}'s ticket!"
            else:
                self.state.health = max(0, self.state.health - damage)
                self.state.streak = 0
                feedback_msg = f"💥 POOR RESPONSE to {ticket.customer_name}! Customer Frustration Increased! -{damage} HP"

        if turn_time_seconds > ticket.timer_seconds:
            time_penalty = 15
            self.state.health = max(0, self.state.health - time_penalty)
            feedback_msg += f" | ⏱️ TIME OVERUN! -{time_penalty} HP"

        if self.state.health <= 0:
            self.state.is_game_over = True
            feedback_msg = "☠️ GAME OVER! Health reached 0 HP. Customer Escalated to CEO."
        elif self.get_resolved_count() == len(self.active_tickets):
            self.state.score += 500
            feedback_msg += " | 🏆 ALL 4 ANGRY CUSTOMER TICKETS RESOLVED! BONUS +500 PTS!"

        return self.state, feedback_msg

survival_game_engine = SurvivalGameEngine()
