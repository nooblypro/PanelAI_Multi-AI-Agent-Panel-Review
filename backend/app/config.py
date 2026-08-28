"""Application configuration via pydantic-settings."""

from __future__ import annotations

import json
from typing import Any, Literal, Optional, Union
from pydantic import Field, AliasChoices, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Backend settings loaded from environment variables / .env file."""

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # Provider Selection
    llm_provider: str = Field(
        default="openrouter",
        validation_alias=AliasChoices("LLM_PROVIDER", "llm_provider"),
    )
    llm_model: str = Field(
        default="nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
        validation_alias=AliasChoices("OPENROUTER_MODEL", "LLM_MODEL", "openrouter_model", "llm_model"),
    )

    # OpenRouter Configuration
    openrouter_api_key: str = Field(
        default="",
        validation_alias=AliasChoices("OPENROUTER_API_KEY", "openrouter_api_key", "OPEN_ROUTER_API_KEY"),
    )
    openrouter_base_url: str = Field(
        default="https://openrouter.ai/api/v1",
        validation_alias=AliasChoices("OPENROUTER_BASE_URL", "openrouter_base_url"),
    )

    # Gemini Configuration (alternative)
    gemini_api_key: str = Field(
        default="",
        validation_alias=AliasChoices("GEMINI_API_KEY", "gemini_api_key"),
    )
    gemini_model: str = Field(
        default="gemini-2.0-flash",
        validation_alias=AliasChoices("GEMINI_MODEL", "gemini_model"),
    )

    # CORS
    cors_origins: Union[list[str], str] = Field(
        default=["http://localhost:5173"],
        validation_alias=AliasChoices("CORS_ORIGINS", "cors_origins"),
    )

    # App
    app_name: str = "PanelAI Backend"
    app_version: str = "0.1.0"
    debug: bool = False

    @field_validator("cors_origins", mode="after")
    @classmethod
    def normalize_cors_origins(cls, v: Any) -> list[str]:
        """Normalize comma-separated strings or JSON arrays into a list of clean origin URLs."""
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("[") and v.endswith("]"):
                try:
                    parsed = json.loads(v)
                    if isinstance(parsed, list):
                        return [str(item).strip().rstrip("/") for item in parsed if str(item).strip()]
                except Exception:
                    pass
            return [part.strip().rstrip("/") for part in v.split(",") if part.strip()]
        elif isinstance(v, (list, tuple, set)):
            return [str(item).strip().rstrip("/") for item in v if str(item).strip()]
        return ["http://localhost:5173"]

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
            if self.gemini_model:
                return self.gemini_model
            return self.llm_model
        return self.llm_model

    def get_cors_origins(self) -> list[str]:
        """Return list of allowed CORS origins, including dev defaults."""
        defaults = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5174",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
        origins: list[str] = []
        if isinstance(self.cors_origins, (list, tuple, set)):
            for item in self.cors_origins:
                cleaned = str(item).strip().rstrip("/")
                if cleaned and cleaned not in origins:
                    origins.append(cleaned)
        elif isinstance(self.cors_origins, str):
            for part in self.cors_origins.split(","):
                cleaned = part.strip().strip("[]'\"").rstrip("/")
                if cleaned and cleaned not in origins:
                    origins.append(cleaned)

        for d in defaults:
            if d not in origins:
                origins.append(d)
        return origins


settings = Settings()
