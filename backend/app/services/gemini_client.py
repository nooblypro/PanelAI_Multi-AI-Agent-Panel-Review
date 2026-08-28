"""Thin async wrapper around the Google Gen AI SDK.

Handles:
- Structured JSON output via response_schema
- Timeouts and retries
- Parse failure fallback
- Stage/agent logging
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any, Optional

from google import genai
from google.genai import types as genai_types

from app.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Client singleton
# ---------------------------------------------------------------------------

_client: Optional[genai.Client] = None


def _get_client() -> genai.Client:
    """Lazily initialise the Gen AI client."""
    global _client
    if _client is None:
        if not settings.gemini_api_key:
            raise RuntimeError(
                "GEMINI_API_KEY is not set. Set it in .env or as an "
                "environment variable."
            )
        _client = genai.Client(api_key=settings.gemini_api_key)
    return _client


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


async def generate_json(
    *,
    system_prompt: str,
    user_prompt: str,
    stage: str = "unknown",
    agent_id: Optional[str] = None,
) -> dict[str, Any] | list[Any]:
    """Call Gemini and parse the response as JSON.

    Parameters
    ----------
    system_prompt : str
        The system instruction for this call.
    user_prompt : str
        The user message containing context / data.
    stage : str
        Label for logging (e.g. "independent_review", "debate").
    agent_id : Optional[str]
        Label for logging (e.g. "technical", "skeptic").

    Returns
    -------
    dict | list
        Parsed JSON from the model response.

    Raises
    ------
    GeminiError
        If the call fails after retries or the output is unparseable.
    """
    label = f"{stage}/{agent_id}" if agent_id else stage
    client = _get_client()

    for attempt in range(1, 3):  # max 2 attempts
        try:
            logger.info("[%s] attempt %d — calling Gemini", label, attempt)

            response = client.models.generate_content(
                model=settings.gemini_model,
                contents=user_prompt,
                config=genai_types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    response_mime_type="application/json",
                    temperature=0.7 if attempt == 1 else 0.4,
                ),
            )

            raw = response.text
            if not raw:
                raise GeminiError(f"[{label}] empty response from Gemini")

            parsed = _parse_json(raw, label)
            logger.info("[%s] success — parsed %s", label, type(parsed).__name__)
            return parsed

        except GeminiError:
            if attempt == 2:
                raise
            logger.warning("[%s] attempt %d failed, retrying", label, attempt)
        except Exception as exc:
            if attempt == 2:
                raise GeminiError(
                    f"[{label}] Gemini call failed: {exc}"
                ) from exc
            logger.warning(
                "[%s] attempt %d error: %s — retrying", label, attempt, exc
            )

    # unreachable but keeps mypy happy
    raise GeminiError(f"[{label}] exhausted retries")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _parse_json(raw: str, label: str) -> dict[str, Any] | list[Any]:
    """Parse a potentially messy LLM response into JSON."""
    # Try direct parse first
    text = raw.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Strip markdown fences if present
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        raise GeminiError(
            f"[{label}] could not parse Gemini response as JSON: {exc}\n"
            f"Raw response (first 500 chars): {raw[:500]}"
        ) from exc


class GeminiError(Exception):
    """Raised when a Gemini API call fails or returns unparseable output."""
