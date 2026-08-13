from __future__ import annotations

from pydantic_ai import Agent

from config import Settings, load_agent_instructions
from deps import Deps
from model_profiles import build_model_settings
from tools.rapidui import register_rapidui_tools


def create_agent(settings: Settings) -> Agent[Deps, str]:
    agent: Agent[Deps, str] = Agent(
        settings.rapidui_agent_model,
        deps_type=Deps,
        instructions=load_agent_instructions(settings.rapidui_agent_prompt_version),
        model_settings=build_model_settings(settings.rapidui_agent_model),
    )
    register_rapidui_tools(agent)
    return agent
