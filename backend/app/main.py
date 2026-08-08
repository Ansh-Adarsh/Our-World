"""
Our World — FastAPI Backend
Phase 1: Health check + couple creation endpoint only.
Sensitive credentials stay here. Never in the frontend.
"""
import logging

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.core.config import Settings, get_settings
from app.core.logging import configure_logging
from app.core.security import get_current_user_id
from app.api.v1.ai import ai_router

logger = logging.getLogger(__name__)


# ─── Application Factory ─────────────────────────────────────────────────────

def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(debug=settings.debug)

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        # Disable docs in production to avoid leaking schema
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
    )

    # ─── CORS ────────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
    )

    # ─── Request Body Size Limit Middleware (Max 1MB) ────────────────────────
    @app.middleware("http")
    async def limit_request_size(request, call_next):
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > 1_048_576:
            from fastapi.responses import JSONResponse
            return JSONResponse(
                status_code=413,
                content={"detail": "Request payload exceeds 1MB limit."},
            )
        return await call_next(request)

    # ─── Routes ──────────────────────────────────────────────────────────────
    app.include_router(health_router)
    app.include_router(couples_router, prefix="/api/v1")
    app.include_router(ai_router, prefix="/api/v1")

    logger.info("Our World API started (version %s)", settings.app_version)
    return app


# ─── Health Router ───────────────────────────────────────────────────────────

from fastapi import APIRouter

health_router = APIRouter(tags=["health"])
couples_router = APIRouter(tags=["couples"])


@health_router.get("/health")
async def health_check(settings: Settings = Depends(get_settings)) -> dict:
    """
    Public health check endpoint.
    Returns service status only — never exposes credentials or config.
    """
    return {
        "status": "ok",
        "service": "our-world-api",
        "version": settings.app_version,
    }


# ─── Couples Router ──────────────────────────────────────────────────────────

class CreateCoupleRequest(BaseModel):
    couple_name: str | None = None
    anniversary_date: str | None = None  # ISO date string: YYYY-MM-DD


class CreateCoupleResponse(BaseModel):
    couple_id: str
    message: str


@couples_router.post(
    "/couples",
    response_model=CreateCoupleResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_couple(
    body: CreateCoupleRequest,
    user_id: str = Depends(get_current_user_id),
    settings: Settings = Depends(get_settings),
) -> CreateCoupleResponse:
    """
    Creates a new couple record and adds the authenticated user as first member.
    Uses the service-role key (backend only) to bypass RLS for this privileged operation.
    The couple_id returned should be stored by the client — never trusted for auth.
    """
    if not settings.supabase_url or not settings.supabase_service_role_key:
        logger.warning("Supabase credentials not configured — returning mock couple_id")
        # Development fallback so frontend works without a real Supabase project
        import uuid
        mock_id = str(uuid.uuid4())
        return CreateCoupleResponse(
            couple_id=mock_id,
            message="Couple created (mock mode — configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)",
        )

    try:
        from supabase import create_client

        # Service role — bypasses RLS for privileged creation
        client = create_client(settings.supabase_url, settings.supabase_service_role_key)

        # 1. Create the couple
        couple_data: dict = {}
        if body.couple_name:
            couple_data["couple_name"] = body.couple_name
        if body.anniversary_date:
            couple_data["anniversary_date"] = body.anniversary_date
        couple_data["partner_1_id"] = user_id

        couple_result = client.table("couples").insert(couple_data).execute()
        couple_id: str = couple_result.data[0]["id"]

        # 2. Add user as first member
        client.table("couple_members").insert(
            {"couple_id": couple_id, "user_id": user_id, "role": "admin"}
        ).execute()

        logger.info("Couple %s created for user %s", couple_id, user_id)
        return CreateCoupleResponse(couple_id=couple_id, message="Couple created successfully")

    except Exception as exc:
        # Never expose internal details to client
        logger.error("Failed to create couple for user %s: %s", user_id, type(exc).__name__)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create couple. Please try again.",
        )


# ─── Entry Point ─────────────────────────────────────────────────────────────

app = create_app()
