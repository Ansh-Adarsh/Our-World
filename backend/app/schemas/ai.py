"""
Pydantic schemas for AI generate request and response.
"""
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator


class AIGenerateRequest(BaseModel):
    intent: str = Field(
        ...,
        description="Target intent: 'memory_caption', 'love_letter', 'quiz_suggestion', 'story_narrative', 'surprise_idea', 'birthday_experience'",
    )
    context: Dict[str, Any] = Field(
        default_factory=dict,
        description="Minimal contextual fields only (e.g., {'title': 'Sunset Walk', 'location': 'Beach'})",
    )

    @field_validator("context")
    @classmethod
    def validate_context_minimization(cls, v: Dict[str, Any]) -> Dict[str, Any]:
        # Enforce max 10 context keys
        if len(v) > 10:
            raise ValueError("Too many context fields passed. Data minimization strictly enforced.")
        
        # Enforce max 500 characters per string value
        sanitized = {}
        for key, val in v.items():
            if isinstance(val, str) and len(val) > 500:
                sanitized[key] = val[:500]
            else:
                sanitized[key] = val
        return sanitized


class AIGenerateResponse(BaseModel):
    intent: str
    draft_content: str
    requires_approval: bool = True
    agent_name: str
