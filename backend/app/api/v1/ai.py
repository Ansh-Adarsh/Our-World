"""
FastAPI Router for AI endpoints.

🔒 SECURITY & PRIVACY MANDATES:
1. Protected by `get_current_user_id` JWT auth dependency.
2. Protected by `check_rate_limit` (max 10 AI calls/min/user).
3. Evaluates input via LangGraph orchestrator engine & Groq API on backend ONLY.
4. Always marks responses with `requires_approval = True`.
"""
import logging
from fastapi import APIRouter, Depends, status

from app.core.security import get_current_user_id
from app.core.rate_limiter import check_rate_limit
from app.schemas.ai import AIGenerateRequest, AIGenerateResponse
from app.agents.graph import route_and_execute_agent

logger = logging.getLogger(__name__)

ai_router = APIRouter(prefix="/ai", tags=["ai"])


@ai_router.post(
    "/generate",
    response_model=AIGenerateResponse,
    status_code=status.HTTP_200_OK,
)
async def generate_ai_content(
    body: AIGenerateRequest,
    user_id: str = Depends(get_current_user_id),
) -> AIGenerateResponse:
    """
    Unified AI generation endpoint.
    Executes LangGraph agent orchestration and Groq LLM on backend.
    """
    # 1. Enforce rate limiting per user
    check_rate_limit(user_id=user_id, limit=10, window=60)

    logger.info("[AIRouter] Processing intent '%s' for user %s", body.intent, user_id)

    # 2. Execute LangGraph orchestration engine
    result = await route_and_execute_agent(intent=body.intent, context=body.context)

    # 3. Return candidate draft (Mandatory Human Approval)
    return AIGenerateResponse(
        intent=result["intent"],
        draft_content=result["draft_content"],
        requires_approval=True,
        agent_name=result["agent_name"],
    )
