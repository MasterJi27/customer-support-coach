import os
from groq import Groq
from src.core.config import settings

_client = None
_last_key = None

def get_groq_client() -> Groq | None:
    global _client, _last_key
    api_key = settings.groq_api_key or os.environ.get("GROQ_API_KEY", "")
    if not api_key:
        return None
    if _client is None or _last_key != api_key:
        try:
            _client = Groq(api_key=api_key)
        except Exception as e:
            print(f"Failed to initialize Groq client: {e}")
            return None
        _last_key = api_key
    return _client


def llm_chat(system: str, user: str, temperature: float = 0.7) -> str:
    client = get_groq_client()
    if not client:
        return ""
    
    # Try primary model first, fallback to faster/lighter models if rate-limited
    models_to_try = [
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
        "gemma2-9b-it",
        "llama3-8b-8192",
    ]
    
    for model in models_to_try:
        try:
            resp = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                temperature=temperature,
                max_tokens=512,
            )
            content = resp.choices[0].message.content
            if content and content.strip():
                return content.strip()
        except Exception as e:
            print(f"LLM Error ({model}): {e}")
            continue
            
    return ""

