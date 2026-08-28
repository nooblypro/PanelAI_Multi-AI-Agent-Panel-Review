"""Backwards-compatibility module re-exporting from llm_client."""

from app.services.llm_client import (  # noqa: F401
    GeminiError,
    LLMError,
    generate_json,
)
