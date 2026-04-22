"""
Health check endpoints
"""

from fastapi import APIRouter
from app.services.monday_client import MondayClient
from app.config import settings

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
async def health_check():
    """Overall health check — extractor is always available, Monday is optional."""
    monday_status = "not_configured"
    try:
        if settings.monday_api_token:
            monday = MondayClient()
            monday_healthy = await monday.health_check()
            monday_status = "healthy" if monday_healthy else "unhealthy"
    except Exception:
        monday_status = "not_configured"

    return {
        "status": "healthy",
        "services": {
            "extractor": {
                "status": "healthy",
                "engine": "python-nlp",
            },
            "monday": {
                "status": monday_status,
                "url": settings.monday_api_url,
            },
        },
        "environment": settings.environment,
    }


@router.get("/health/monday")
async def monday_health():
    """Check Monday.com API health"""
    try:
        if not settings.monday_api_token:
            return {
                "status": "not_configured",
                "url": settings.monday_api_url,
                "message": "Monday.com API token not configured",
            }

        monday = MondayClient()
        is_healthy = await monday.health_check()

        return {
            "status": "healthy" if is_healthy else "unhealthy",
            "url": settings.monday_api_url,
        }

    except Exception as e:
        return {
            "status": "error",
            "url": settings.monday_api_url,
            "message": str(e),
        }
