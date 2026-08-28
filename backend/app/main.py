"""PanelAI FastAPI application factory."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import Settings, settings
from app.routers import pipeline

logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)


def create_app(app_settings: Settings | None = None) -> FastAPI:
    """Build and configure the FastAPI application."""
    active_settings = app_settings if app_settings is not None else Settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        """Application lifespan — initialize shared clients and cleanup on shutdown."""
        logging.getLogger(__name__).info(
            "PanelAI backend starting (provider=%s, model=%s)",
            active_settings.llm_provider,
            active_settings.get_model(),
        )
        logging.getLogger(__name__).info(
            "[CORS] Allowed origins: %s",
            active_settings.get_cors_origins(),
        )
        yield
        from app.services.llm_client import close_http_client
        await close_http_client()
        logging.getLogger(__name__).info("PanelAI backend shutting down")

    app = FastAPI(
        title=active_settings.app_name,
        version=active_settings.app_version,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=active_settings.get_cors_origins(),
        allow_origin_regex=r"^https?://([a-zA-Z0-9_-]+\.)*(onrender\.com|vercel\.app|netlify\.app|localhost|127\.0\.0\.1)(:\d+)?$",
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(pipeline.router)

    @app.get("/health")
    async def health():
        has_key = bool(active_settings.get_api_key())
        return {
            "status": "ok",
            "provider": active_settings.llm_provider,
            "model": active_settings.get_model(),
            "has_api_key": has_key,
            "ready": True,
            "llm_configured": has_key,
        }

    return app


app = create_app(settings)
