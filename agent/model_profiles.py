from __future__ import annotations

from pydantic_ai.models.openai import OpenAIResponsesModelSettings

from config import parse_model

DEFAULT_MODEL = "openai:gpt-5.6-terra"

# Base model names with known pricing / Observe support. Extend when adding providers.
SUPPORTED_MODELS: tuple[str, ...] = ("gpt-5.6-terra",)

# Models that need non-default OpenAI Responses settings (e.g. reasoning_effort).
_MODEL_SETTINGS: dict[str, OpenAIResponsesModelSettings] = {}


def build_model_settings(model: str) -> OpenAIResponsesModelSettings | None:
    """Return model-specific settings, or None when defaults are correct."""
    _, name = parse_model(model)
    return _MODEL_SETTINGS.get(name)
