"""Provider-agnostic async LLM client supporting OpenRouter and Gemini.

Handles:
- OpenRouter API (OpenAI-compatible chat completions)
- Gemini API (via google-genai SDK)
- JSON extraction and parsing (handling raw JSON, markdown code blocks, and preambles)
- Timeouts, retries, and failure logging
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any, Optional

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


class LLMError(Exception):
    """Raised when an LLM API call fails or returns unparseable output."""


# Backwards compatibility alias
GeminiError = LLMError

# ---------------------------------------------------------------------------
# Gemini Client Singleton
# ---------------------------------------------------------------------------

_gemini_client: Any = None


def _get_gemini_client():
    """Lazily initialise the Google Gen AI client."""
    global _gemini_client
    if _gemini_client is None:
        api_key = settings.gemini_api_key
        if not api_key:
            raise LLMError(
                "GEMINI_API_KEY is not set. Set it in .env or as an environment variable."
            )
        from google import genai
        _gemini_client = genai.Client(api_key=api_key)
    return _gemini_client


# ---------------------------------------------------------------------------
# Public Entry Point
# ---------------------------------------------------------------------------


async def generate_json(
    *,
    system_prompt: str,
    user_prompt: str,
    stage: str = "unknown",
    agent_id: Optional[str] = None,
) -> dict[str, Any] | list[Any]:
    """Call the configured LLM provider and parse the response as JSON.

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
    LLMError
        If the call fails after retries or the output is unparseable.
    """
    provider = settings.llm_provider.lower()
    label = f"{stage}/{agent_id}" if agent_id else stage

    if provider == "openrouter":
        return await _generate_openrouter_json(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            label=label,
        )
    elif provider == "gemini":
        return await _generate_gemini_json(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            label=label,
        )
    else:
        raise LLMError(
            f"[{label}] Unsupported LLM_PROVIDER: '{settings.llm_provider}'. "
            "Supported providers: 'openrouter', 'gemini'."
        )


# ---------------------------------------------------------------------------
# OpenRouter Provider Implementation
# ---------------------------------------------------------------------------


async def _generate_openrouter_json(
    *,
    system_prompt: str,
    user_prompt: str,
    label: str,
) -> dict[str, Any] | list[Any]:
    """Call OpenRouter chat completions API using httpx."""
    api_key = settings.openrouter_api_key
    if not api_key:
        raise LLMError(
            f"[{label}] OPENROUTER_API_KEY is not set. Set it in .env or as an environment variable."
        )

    base_url = settings.openrouter_base_url.rstrip("/")
    url = f"{base_url}/chat/completions"
    model = settings.get_model()

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/promptwars/panelai",
        "X-Title": "PanelAI",
    }

    for attempt in range(1, 3):  # max 2 attempts
        temperature = 0.7 if attempt == 1 else 0.4
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": temperature,
        }

        try:
            logger.info(
                "[%s] attempt %d — calling OpenRouter (model=%s, temp=%.1f)",
                label,
                attempt,
                model,
                temperature,
            )

            async with httpx.AsyncClient(timeout=90.0) as http_client:
                response = await http_client.post(url, headers=headers, json=payload)

            if response.status_code != 200:
                error_detail = response.text[:400]
                error_msg = f"[{label}] OpenRouter returned HTTP {response.status_code}: {error_detail}"
                if response.status_code in (400, 401, 403, 404, 413, 422):
                    # Deterministic failure, do not retry
                    raise LLMError(f"Deterministic error: {error_msg}")
                raise LLMError(error_msg)

            data = response.json()
            choices = data.get("choices")
            if not choices or not isinstance(choices, list):
                raise LLMError(f"[{label}] OpenRouter response missing choices: {data}")

            raw_content = choices[0].get("message", {}).get("content", "")
            if not raw_content:
                raise LLMError(f"[{label}] OpenRouter returned empty message content")

            parsed = _parse_json(raw_content, label)
            logger.info("[%s] success — parsed %s", label, type(parsed).__name__)
            return parsed

        except LLMError as exc:
            if attempt == 2 or "Deterministic error:" in str(exc):
                raise
            logger.warning("[%s] attempt %d failed, retrying", label, attempt)
        except Exception as exc:
            if attempt == 2:
                raise LLMError(f"[{label}] OpenRouter call failed: {exc}") from exc
            logger.warning("[%s] attempt %d error: %s — retrying", label, attempt, exc)

    raise LLMError(f"[{label}] exhausted retries")


# ---------------------------------------------------------------------------
# Gemini Provider Implementation
# ---------------------------------------------------------------------------


async def _generate_gemini_json(
    *,
    system_prompt: str,
    user_prompt: str,
    label: str,
) -> dict[str, Any] | list[Any]:
    """Call Google Gemini API using google-genai SDK."""
    from google.genai import types as genai_types

    client = _get_gemini_client()
    model = settings.get_model()

    for attempt in range(1, 3):  # max 2 attempts
        temperature = 0.7 if attempt == 1 else 0.4
        try:
            logger.info(
                "[%s] attempt %d — calling Gemini (model=%s)",
                label,
                attempt,
                model,
            )

            response = await client.aio.models.generate_content(
                model=model,
                contents=user_prompt,
                config=genai_types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    response_mime_type="application/json",
                    temperature=temperature,
                ),
            )

            raw = response.text
            if not raw:
                raise LLMError(f"[{label}] empty response from Gemini")

            parsed = _parse_json(raw, label)
            logger.info("[%s] success — parsed %s", label, type(parsed).__name__)
            return parsed

        except LLMError:
            if attempt == 2:
                raise
            logger.warning("[%s] attempt %d failed, retrying", label, attempt)
        except Exception as exc:
            if attempt == 2:
                raise LLMError(f"[{label}] Gemini call failed: {exc}") from exc
            logger.warning("[%s] attempt %d error: %s — retrying", label, attempt, exc)

    raise LLMError(f"[{label}] exhausted retries")


# ---------------------------------------------------------------------------
# JSON Extraction & Parsing Helper
# ---------------------------------------------------------------------------


def _parse_json(raw: str, label: str) -> dict[str, Any] | list[Any]:
    """Parse a potentially messy LLM response into a JSON object or array.

    Handles:
    - Clean JSON string
    - Markdown code fences (` ```json ... ``` ` or ` ``` ... ``` `)
    - Preamble/postamble conversational text surrounding JSON
    """
    text = raw.strip()

    # 1. Direct parse attempt
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # 2. Extract content from markdown code fences
    fence_pattern = r"```(?:json)?\s*\n?([\s\S]*?)\n?\s*```"
    fence_match = re.search(fence_pattern, text, re.DOTALL | re.IGNORECASE)
    if fence_match:
        fenced_text = fence_match.group(1).strip()
        try:
            return json.loads(fenced_text)
        except json.JSONDecodeError:
            pass

    # 3. Fallback: Find outermost JSON array [...] or object {...}
    start_bracket = text.find("[")
    end_bracket = text.rfind("]")
    start_brace = text.find("{")
    end_brace = text.rfind("}")

    candidates: list[str] = []

    # If both brackets exist and encompass a valid range
    if start_bracket != -1 and end_bracket != -1 and end_bracket > start_bracket:
        candidates.append(text[start_bracket : end_bracket + 1])

    if start_brace != -1 and end_brace != -1 and end_brace > start_brace:
        candidates.append(text[start_brace : end_brace + 1])

    for candidate in candidates:
        try:
            return json.loads(candidate.strip())
        except json.JSONDecodeError:
            continue

    # If all parsing attempts fail, raise informative LLMError
    raise LLMError(
        f"[{label}] could not parse LLM response as JSON.\n"
        f"Raw response (first 500 chars): {raw[:500]}"
    )
