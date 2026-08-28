"""Application configuration via pydantic-settings."""

from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Backend settings loaded from environment variables / .env file."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Gemini
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"

    # CORS
    cors_origins: list[str] = ["http://localhost:5173"]

    # App
    app_name: str = "PanelAI Backend"
    app_version: str = "0.1.0"
    debug: bool = False


settings = Settings()
