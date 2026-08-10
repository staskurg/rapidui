from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

AGENT_DIR = Path(__file__).resolve().parent
PROMPTS_DIR = AGENT_DIR / "prompts"
ENV_FILE = AGENT_DIR / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE) if ENV_FILE.is_file() else None,
        extra="ignore",
    )

    openai_api_key: str = ""
    rapidui_base_url: str = "http://localhost:3000"
    rapidui_agent_model: str = "openai:o4-mini"
    rapidui_agent_prompt_version: str = "v1"
    rapidui_env: str = "local"
    logfire_token: str | None = None

    http_timeout_seconds: float = 60.0


@lru_cache
def get_settings() -> Settings:
    return Settings()


def apply_settings_env(settings: Settings) -> None:
    """Push Settings into os.environ for libraries that read env directly (OpenAI, Logfire)."""
    if settings.openai_api_key and not os.getenv("OPENAI_API_KEY"):
        os.environ["OPENAI_API_KEY"] = settings.openai_api_key
    if settings.logfire_token and not os.getenv("LOGFIRE_TOKEN"):
        os.environ["LOGFIRE_TOKEN"] = settings.logfire_token


def require_openai_api_key(settings: Settings) -> None:
    if settings.openai_api_key or os.getenv("OPENAI_API_KEY"):
        return
    raise RuntimeError(
        "OPENAI_API_KEY is required. Set it in agent/.env or export it in your shell."
    )


def load_agent_instructions(version: str | None = None) -> str:
    """Load agent instructions from prompts/{version}.txt.

    Used with Agent(instructions=...) so guidance is injected fresh each turn
    and is not stored in client-submitted message history (recommended for UI adapters).
    """
    settings = get_settings()
    prompt_version = version or settings.rapidui_agent_prompt_version
    path = PROMPTS_DIR / f"{prompt_version}.txt"
    if not path.is_file():
        raise FileNotFoundError(f"Agent instructions not found: {path}")
    return path.read_text(encoding="utf-8").strip()


def parse_model(model: str) -> tuple[str, str]:
    if ":" in model:
        provider, name = model.split(":", 1)
        return provider, name
    return "openai", model
