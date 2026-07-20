from __future__ import annotations

from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIResponsesModelSettings

from config import Settings, load_agent_instructions
from deps import Deps
from tools.rapidui import register_rapidui_tools


def create_agent(settings: Settings) -> Agent[Deps, str]:
    model_settings = OpenAIResponsesModelSettings(
        openai_reasoning_effort="medium",
        # Reasoning summaries require a verified OpenAI org; omit until enabled.
    )

    agent: Agent[Deps, str] = Agent(
        settings.rapidui_agent_model,
        deps_type=Deps,
        instructions=load_agent_instructions(settings.rapidui_agent_prompt_version),
        model_settings=model_settings,
    )
    register_rapidui_tools(agent)
    return agent
