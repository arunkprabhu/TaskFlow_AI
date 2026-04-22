"""
FastAPI application entry point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from app.config import settings
from app.api.routes import tasks, health

# Configure logging
logging.basicConfig(
    level=settings.log_level,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title="meetingtotask API",
    description="Extract tasks from meeting notes using Ollama AI and push to Monday.com",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(tasks.router)
app.include_router(health.router)


@app.on_event("startup")
async def startup_event():
    """Application startup event"""
    logger.info("Starting meetingtotask API")
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"Ollama URL: {settings.ollama_base_url}")
    logger.info(f"Ollama Model: {settings.ollama_model}")
    logger.info(f"CORS Origins: {settings.cors_origins_list}")


@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event"""
    logger.info("Shutting down meetingtotask API")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "meetingtotask API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }
