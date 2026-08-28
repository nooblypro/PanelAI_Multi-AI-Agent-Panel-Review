"""PanelAI FastAPI application factory."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import pipeline

logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — no database, just log startup/shutdown."""
    logging.getLogger(__name__).info(
        "PanelAI backend starting (model=%s)", settings.gemini_model
    )
    yield
    logging.getLogger(__name__).info("PanelAI backend shutting down")


def create_app() -> FastAPI:
    """Build and configure the FastAPI application."""
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type"],
    )

    app.include_router(pipeline.router)

    @app.get("/health")
    async def health():
        return {
            "status": "ok",
            "model": settings.gemini_model,
            "has_api_key": bool(settings.gemini_api_key),
        }

    return app


app = create_app()
