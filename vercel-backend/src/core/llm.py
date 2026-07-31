import os
import base64
import io
import httpx
from concurrent.futures import ThreadPoolExecutor
from groq import Groq
from src.core.config import settings

_client = None
_last_key = None

def get_groq_client() -> Groq | None:
    global _client, _last_key
    api_key = settings.groq_api_key or os.environ.get("GROQ_API_KEY", "")
    if not api_key:
        try:
            import streamlit as st
            api_key = st.secrets.get("GROQ_API_KEY", "")
        except Exception:
            pass
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


def llm_chat_openrouter(system: str, user: str, temperature: float = 0.7) -> str:
    """Chat via OpenRouter free-tier models (zero cost). Tries fallback chain on rate limit / errors."""
    api_key = get_openrouter_api_key()
    if not api_key:
        return ""
    models = getattr(settings, "openrouter_chat_fallbacks", None) or [
        "nvidia/nemotron-3-nano-30b-a3b:free",
        "nvidia/nemotron-nano-9b-v2:free",
        "openai/gpt-oss-20b:free",
        "google/gemma-4-26b-a4b-it:free",
    ]
    for model in models:
        try:
            resp = httpx.post(
                f"{settings.openrouter_base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": user},
                    ],
                    "temperature": temperature,
                    "max_tokens": 512,
                },
                timeout=90,
            )
            if resp.status_code != 200:
                print(f"LLM Error ({model}): {resp.status_code} {resp.text[:200]}")
                continue
            data = resp.json()
            content = data.get("choices", [{}])[0].get("message", {}).get("content")
            if content and content.strip():
                return content.strip()
        except Exception as e:
            print(f"LLM Error ({model}): {e}")
            continue
    return ""


def _groq_chat(system: str, user: str, temperature: float) -> str:
    client = get_groq_client()
    if not client:
        return ""
    for model in ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "gemma2-9b-it", "llama3-8b-8192"]:
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


def llm_chat(system: str, user: str, temperature: float = 0.7) -> str:
    # Race OpenRouter free (NVIDIA) vs Groq free — return whichever answers first.
    # Guarantees lowest latency while staying 100% free.
    with ThreadPoolExecutor(max_workers=2) as pool:
        or_fut = pool.submit(llm_chat_openrouter, system, user, temperature)
        gq_fut = pool.submit(_groq_chat, system, user, temperature)
        futures = [or_fut, gq_fut]
        for fut in futures:
            try:
                out = fut.result()
            except Exception:
                continue
            if out:
                return out
    return ""


def get_openrouter_api_key() -> str:
    api_key = settings.openrouter_api_key or os.environ.get("OPENROUTER_API_KEY", "")
    if not api_key:
        try:
            import streamlit as st
            api_key = st.secrets.get("OPENROUTER_API_KEY", "")
        except Exception:
            pass
    return api_key


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Returns embeddings via OpenRouter (nemotron-3-embed). Empty list on failure."""
    api_key = get_openrouter_api_key()
    if not api_key or not texts:
        return []
    try:
        resp = httpx.post(
            f"{settings.openrouter_base_url}/embeddings",
            headers={"Authorization": f"Bearer {api_key}"},
            json={"model": settings.openrouter_embed_model, "input": texts},
            timeout=60,
        )
        resp.raise_for_status()
        data = resp.json()
        return [item["embedding"] for item in data.get("data", [])]
    except Exception as e:
        print(f"Embedding Error: {e}")
        return []


def embed_text(text: str) -> list[float]:
    vectors = embed_texts([text])
    return vectors[0] if vectors else []


def text_to_speech(text: str) -> bytes | None:
    """Neural TTS via OpenRouter (fish-audio) with gTTS fallback. Returns audio bytes or None."""
    if not text or not text.strip():
        return None
    api_key = get_openrouter_api_key()
    if api_key:
        try:
            resp = httpx.post(
                f"{settings.openrouter_base_url}/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "model": settings.openrouter_tts_model,
                    "modalities": ["audio", "text"],
                    "audio": {"format": "wav"},
                    "messages": [{"role": "user", "content": text}],
                },
                timeout=120,
            )
            resp.raise_for_status()
            data = resp.json()
            audio = data.get("choices", [{}])[0].get("message", {}).get("audio")
            encoded = (audio or {}).get("data") if isinstance(audio, dict) else None
            if encoded:
                return base64.b64decode(encoded)
        except Exception as e:
            print(f"OpenRouter TTS Error: {e}")
    try:
        from gtts import gTTS
        tts = gTTS(text=text, lang="en", tld="co.in")
        fp = io.BytesIO()
        tts.write_to_fp(fp)
        fp.seek(0)
        return fp.read()
    except Exception as e:
        print(f"gTTS Error: {e}")
        return None

