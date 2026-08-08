"""
Pydantic schemas for AI generate request and response.
"""
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class AIGenerateRequest(BaseModel):
    intent: str = Field(
        ...,
        description="Target intent: 'memory_caption', 'love_letter', 'quiz_suggestion', 'story_narrative', 'surprise_idea'",
    )
    context: Dict[str, Any] = Field(
        default_factory=dict,
        description="Minimal contextual fields only (e.g., {'title': 'Sunset Walk', 'location': 'Beach'})",
    )


class AIGenerateResponse(BaseModel):
    intent: str
    draft_content: str
    requires_approval: bool = True
    agent_name: str
