"""Application configuration via pydantic-settings."""

from __future__ import annotations

import json
import re
from typing import Any, Literal, Optional, Union
from urllib.parse import urlparse
from pydantic import Field, AliasChoices, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def _normalize_single_origin(raw: str) -> str:
    cleaned = raw.strip().strip("'\"`[]()").strip()
    if not cleaned:
        return ""
    if not cleaned.startswith("http://") and not cleaned.startswith("https://"):
        cleaned = "https://" + cleaned
    parsed = urlparse(cleaned)
    if parsed.netloc:
        return f"{parsed.scheme}://{parsed.netloc}"
    return cleaned.rstrip("/")


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

    # Text-to-Speech (TTS) Configuration
    tts_provider: str = Field(
        default="openai",
        validation_alias=AliasChoices("TTS_PROVIDER", "tts_provider"),
    )
    tts_api_key: str = Field(
        default="",
        validation_alias=AliasChoices("TTS_API_KEY", "tts_api_key", "OPENAI_API_KEY", "openai_api_key"),
    )
    tts_model: str = Field(
        default="tts-1",
        validation_alias=AliasChoices("TTS_MODEL", "tts_model"),
    )

    # CORS
    cors_origins: Union[list[str], str] = Field(
        default=["http://localhost:5173"],
        validation_alias=AliasChoices(
            "CORS_ORIGINS",
            "cors_origins",
            "CORS_ORIGIN",
            "cors_origin",
            "FRONTEND_URL",
            "frontend_url",
            "ALLOWED_ORIGINS",
            "allowed_origins",
            "CORS_ALLOWED_ORIGINS",
            "cors_allowed_origins",
        ),
    )

    # App
    app_name: str = "PanelAI Backend"
    app_version: str = "0.1.0"
    debug: bool = False

    @field_validator("cors_origins", mode="after")
    @classmethod
    def normalize_cors_origins(cls, v: Any) -> list[str]:
        """Normalize comma/semicolon/whitespace separated strings or JSON arrays into clean origin URLs."""
        if isinstance(v, (list, tuple, set)):
            raw_items = list(v)
        elif isinstance(v, str):
            s = v.strip()
            if s.startswith("[") and s.endswith("]"):
                try:
                    parsed = json.loads(s)
                    if isinstance(parsed, list):
                        raw_items = parsed
                    else:
                        raw_items = [s[1:-1]]
                except Exception:
                    raw_items = [s[1:-1]]
            else:
                raw_items = re.split(r"[,;\s]+", s)
        else:
            raw_items = []

        origins: list[str] = []
        for item in raw_items:
            normalized = _normalize_single_origin(str(item))
            if normalized and normalized not in origins:
                origins.append(normalized)

        return origins if origins else ["http://localhost:5173"]

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
        configured = self.cors_origins if isinstance(self.cors_origins, list) else [self.cors_origins]
        for item in configured:
            normalized = _normalize_single_origin(str(item))
            if normalized and normalized not in origins:
                origins.append(normalized)

        for d in defaults:
            if d not in origins:
                origins.append(d)
        return origins


settings = Settings()
