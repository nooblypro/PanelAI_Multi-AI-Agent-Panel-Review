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
    """Application lifespan — initialize shared clients and cleanup on shutdown."""
    logging.getLogger(__name__).info(
        "PanelAI backend starting (provider=%s, model=%s)",
        settings.llm_provider,
        settings.get_model(),
    )
    yield
    from app.services.llm_client import close_http_client
    await close_http_client()
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
        allow_origins=settings.get_cors_origins(),
        allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(pipeline.router)

    @app.get("/health")
    async def health():
        return {
            "status": "ok",
            "provider": settings.llm_provider,
            "model": settings.get_model(),
            "has_api_key": bool(settings.get_api_key()),
        }

    return app


app = create_app()
