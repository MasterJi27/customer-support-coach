from src.core.models import ComplianceViolation, KnowledgeItem, Message
from src.core.llm import llm_chat
from src.core.prompts import COMPLIANCE_MONITOR_SYSTEM_PROMPT
import json

class ComplianceMonitorAgent:
    def assess(
        self,
        agent_message: Message,
        knowledge_items: list[KnowledgeItem]
    ) -> ComplianceViolation:
        if not agent_message.content.strip():
            return ComplianceViolation(
                is_violation=False,
                reasoning="No agent message provided.",
                severity="low"
            )

        if not knowledge_items:
            # If no knowledge items were retrieved, we might not have a baseline to check against,
            # but we can still do a basic check if desired. For now, assume no violation.
            return ComplianceViolation(
                is_violation=False,
                reasoning="No knowledge context to check against.",
                severity="low"
            )

        kb_context = "\n".join([f"- {item.title}: {item.content}" for item in knowledge_items])
        
        system_prompt = COMPLIANCE_MONITOR_SYSTEM_PROMPT

        user_prompt = f"Knowledge Base:\n{kb_context}\n\nAgent Message:\n{agent_message.content}"

        raw = llm_chat(system_prompt, user_prompt, temperature=0.0)

        if not raw:
            return ComplianceViolation(
                is_violation=False,
                reasoning="Failed to analyze compliance.",
                severity="low"
            )

        import re
        try:
            raw = raw.strip()
            match = re.search(r'\{.*\}', raw, re.DOTALL)
            if match:
                raw_json = match.group(0)
            else:
                raw_json = raw
            data = json.loads(raw_json)
            return ComplianceViolation(
                is_violation=data.get("is_violation", False),
                reasoning=data.get("reasoning", "No clear reasoning provided."),
                severity=data.get("severity", "low")
            )
        except Exception as e:
            print(f"JSON Parsing Error in compliance monitor: {e}\nRaw output:\n{raw}")
            return ComplianceViolation(
                is_violation=False,
                reasoning=f"Error parsing compliance check: {str(e)}",
                severity="low"
            )
