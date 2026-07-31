import json
import os
import random
import shutil
from datetime import datetime
from src.core.config import settings
from src.core.models import HallOfFameEntry, PerformanceReport

BUNDLED_DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "hall_of_fame.json")
DATA_PATH = os.path.join(settings.runtime_data_dir, "hall_of_fame.json")

class HallOfFameVault:
    """
    Archives top 1% masterclass sessions (Hall of Fame) and catastrophic failure sessions (Hall of Shame).
    """

    def __init__(self):
        os.makedirs(os.path.dirname(DATA_PATH), exist_ok=True)
        if not os.path.exists(DATA_PATH):
            if os.path.exists(BUNDLED_DATA_PATH):
                shutil.copyfile(BUNDLED_DATA_PATH, DATA_PATH)
            else:
                self._save_entries([])

    def _load_entries(self) -> list[dict]:
        try:
            with open(DATA_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    def _save_entries(self, entries: list[dict]):
        with open(DATA_PATH, "w", encoding="utf-8") as f:
            json.dump(entries, f, indent=2, default=str)

    def archive_session(self, report: PerformanceReport) -> HallOfFameEntry | None:
        if not report:
            return None

        score = report.overall_score
        if score >= 0.85:
            category = "Hall of Fame"
            title = f"🏆 Masterclass De-escalation ({int(score * 100)}%)"
            summary = "Agent handled high customer frustration perfectly, followed policy, and restored satisfaction."
        elif score <= 0.45:
            category = "Hall of Shame"
            title = f"💀 Catastrophic Failure ({int(score * 100)}%)"
            summary = "Agent failed policy compliance, missed mandatory empathy, and escalated frustration."
        else:
            return None

        entry = HallOfFameEntry(
            entry_id=f"HOF-{random.randint(1000, 9999)}",
            title=title,
            category=category,
            overall_score=score,
            summary=summary
        )

        entries = self._load_entries()
        entries.append(entry.model_dump())
        self._save_entries(entries)

        return entry

    def get_all_entries(self) -> list[dict]:
        entries = self._load_entries()
        if not entries:
            # Seed default benchmark examples
            default_entries = [
                {
                    "entry_id": "HOF-1001",
                    "title": "🏆 Masterclass: 100% Biryani Dispute Recovery",
                    "category": "Hall of Fame",
                    "overall_score": 0.96,
                    "summary": "Agent Ramesh handled a 90% angry customer, verified order details, issued refund + STAY15 voucher, and turned frustration into a 5-star CSAT."
                },
                {
                    "entry_id": "HOS-9002",
                    "title": "💀 Hall of Shame: Robot Interrogation Incident",
                    "category": "Hall of Shame",
                    "overall_score": 0.28,
                    "summary": "Agent repeatedly copied-pasted Terms of Service to an angry customer without apologizing, causing customer to uninstall app."
                }
            ]
            self._save_entries(default_entries)
            return default_entries
        return entries

hall_of_fame_vault = HallOfFameVault()
