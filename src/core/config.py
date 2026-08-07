import os
import tempfile
from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Development of AI-Powered Customer Support Assistant with Live Response Guidance"
    version: str = "1.0.0"
    debug: bool = True

    database_url: str = ""

    data_dir: str = str(Path(__file__).resolve().parent.parent.parent / "data")
    knowledge_base_dir: str = ""
    transcripts_dir: str = ""
    reports_dir: str = ""

    embedding_model: str = "all-MiniLM-L6-v2"
    vector_store_path: str = ""
    chunk_size: int = 512
    chunk_overlap: int = 64

    openai_api_key: str = ""
    openai_model: str = "gpt-3.5-turbo"
    use_mock_llm: bool = True
    groq_api_key: str = ""

    azure_openai_endpoint: str = ""
    azure_openai_key: str = ""
    azure_openai_deployment: str = "gpt-5.4-mini"
    azure_openai_enabled: bool = True

    max_turns_per_session: int = 50
    escalation_high_threshold: float = 0.7
    escalation_critical_threshold: float = 0.9

    composio_api_key: str = ""
    composio_user_id: str = "default"
    composio_jira_project_key: str = "COACH"
    composio_refund_email: str = "raghavkathuria63@gmail.com"
    composio_slack_channel: str = "#support-ops"

    openrouter_api_key: str = ""
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    openrouter_embed_model: str = "nvidia/nemotron-3-embed-1b:free"
    openrouter_tts_model: str = "fish-audio/s2.1-pro-free:free"
    openrouter_chat_fallbacks: list[str] = [
        "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
        "nvidia/nemotron-3-ultra-550b-a55b:free",
        "nvidia/nemotron-nano-12b-v2-vl:free",
        "google/gemma-4-26b-a4b-it:free",
        "nvidia/nemotron-nano-9b-v2:free",
    ]

    class Config:
        env_file = str(Path(__file__).resolve().parent.parent.parent / ".env")
        env_file_encoding = "utf-8"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.knowledge_base_dir:
            self.knowledge_base_dir = os.path.join(self.data_dir, "knowledge_base")
        if not self.transcripts_dir:
            self.transcripts_dir = os.path.join(self.data_dir, "transcripts")
        if not self.reports_dir:
            self.reports_dir = os.path.join(self.data_dir, "reports")
        if not self.vector_store_path:
            self.vector_store_path = os.path.join(self.data_dir, "vector_store")
        if not self._is_writable(self.data_dir):
            runtime = self.runtime_data_dir
            self.transcripts_dir = os.path.join(runtime, "transcripts")
            self.reports_dir = os.path.join(runtime, "reports")
            self.vector_store_path = os.path.join(runtime, "vector_store")
        os.makedirs(self.knowledge_base_dir, exist_ok=True)
        os.makedirs(self.transcripts_dir, exist_ok=True)
        os.makedirs(self.reports_dir, exist_ok=True)
        os.makedirs(self.vector_store_path, exist_ok=True)

    @staticmethod
    def _is_writable(path: str) -> bool:
        try:
            os.makedirs(path, exist_ok=True)
            probe = os.path.join(path, ".write_probe")
            with open(probe, "w") as fh:
                fh.write("ok")
            os.remove(probe)
            return True
        except OSError:
            return False

    @property
    def runtime_data_dir(self) -> str:
        if self._is_writable(self.data_dir):
            return self.data_dir
        path = os.path.join(tempfile.gettempdir(), "coachai-runtime")
        os.makedirs(path, exist_ok=True)
        return path


settings = Settings()
