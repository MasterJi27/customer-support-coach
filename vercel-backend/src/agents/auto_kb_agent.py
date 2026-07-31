import json
import os
import uuid
import re
from src.core.llm import llm_chat
from src.core.models import SessionState, TurnAnalysis
from src.core.config import settings
from src.core.prompts import AUTO_KB_SYSTEM_PROMPT

class AutoKBAgent:
    def __init__(self):
        self.pending_dir = os.path.join(settings.runtime_data_dir, "knowledge_base", "pending")
        if not os.path.exists(self.pending_dir):
            os.makedirs(self.pending_dir, exist_ok=True)

    def trigger_auto_kb(self, session: SessionState, analyses: list[TurnAnalysis]):
        # Reconstruct transcript
        transcript_parts = []
        for ta in analyses:
            transcript_parts.append(f"Customer: {ta.customer_message}")
            if ta.agent_message:
                transcript_parts.append(f"Agent: {ta.agent_message}")
        
        transcript = "\n".join(transcript_parts)
        
        system = AUTO_KB_SYSTEM_PROMPT
        
        user = f"Here is the transcript:\n{transcript}\n\nPlease generate the JSON FAQ entry."
        
        try:
            response_text = llm_chat(system, user, temperature=0.3)
            # Clean up potential markdown formatting
            response_text = response_text.strip()
            match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if match:
                raw_json = match.group(0)
            else:
                raw_json = response_text
            kb_entry = json.loads(raw_json)
            
            # Ensure required keys exist
            required_keys = ["title", "category", "content", "keywords"]
            if all(k in kb_entry for k in required_keys):
                file_id = str(uuid.uuid4())[:8]
                file_name = f"faq_auto_gen_{file_id}.json"
                file_path = os.path.join(self.pending_dir, file_name)
                
                with open(file_path, "w", encoding="utf-8") as f:
                    json.dump(kb_entry, f, indent=2)
                    
                print(f"Auto-KB drafted new FAQ: {file_name}")
                return file_path
        except Exception as e:
            print(f"Auto-KB generation failed: {e}")
            return None
