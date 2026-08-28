"""Application configuration via pydantic-settings."""

from __future__ import annotations

from typing import Literal
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Backend settings loaded from environment variables / .env file."""

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # Provider Selection
    llm_provider: str = "openrouter"  # "openrouter" | "gemini"
    llm_model: str = "nvidia/nemotron-3-ultra-550b-a55b:free"

    # OpenRouter Configuration
    openrouter_api_key: str = ""
    openrouter_base_url: str = "https://openrouter.ai/api/v1"

    # Gemini Configuration (alternative)
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"

    # CORS
    cors_origins: list[str] = ["http://localhost:5173"]

    # App
    app_name: str = "PanelAI Backend"
    app_version: str = "0.1.0"
    debug: bool = False

    def get_api_key(self) -> str:
        """Return the API key for the currently configured provider."""
        provider = self.llm_provider.lower()
        if provider == "openrouter":
            return self.openrouter_api_key
        elif provider == "gemini":
            return self.gemini_api_key
        return ""

    def get_model(self) -> str:
        """Return the model identifier for the currently configured provider."""
        provider = self.llm_provider.lower()
        if provider == "gemini":
            # If user explicitly set gemini_model, prioritize it over the openrouter default
            if self.llm_model == "nvidia/nemotron-3-ultra-550b-a55b:free" and self.gemini_model:
                return self.gemini_model
            return self.llm_model
        return self.llm_model


settings = Settings()
