"""Voice synthesis service — converts debate turns into persona speech audio.

Assigns distinct voice personas:
- technical      → alloy   (Analytical, clear, structured)
- culture        → shimmer (Warm, empathetic, collaborative)
- hiring_manager → fable   (Authoritative, strategic, balanced)
- skeptic        → onyx    (Probing, direct, skeptical)
"""

from __future__ import annotations

import logging
from typing import Optional

import httpx

from app.config import Settings, settings

logger = logging.getLogger(__name__)

VALID_PERSONAS: set[str] = {"technical", "culture", "hiring_manager", "skeptic"}

PERSONA_VOICE_MAP: dict[str, str] = {
    "technical": "alloy",
    "culture": "shimmer",
    "hiring_manager": "fable",
    "skeptic": "onyx",
}

PERSONA_SPEECH_CONFIG: dict[str, dict[str, float]] = {
    "technical": {"pitch": 0.85, "rate": 1.0},
    "culture": {"pitch": 1.15, "rate": 0.95},
    "hiring_manager": {"pitch": 0.95, "rate": 1.0},
    "skeptic": {"pitch": 1.05, "rate": 1.05},
}

MAX_TEXT_LENGTH = 3000


class VoiceSynthesisError(Exception):
    """Raised when voice synthesis fails."""


async def synthesize_speech(
    agent_id: str,
    text: str,
    app_settings: Optional[Settings] = None,
) -> tuple[Optional[bytes], dict]:
    """Synthesize speech audio for a given agent persona and text.

    Returns:
        tuple[audio_bytes, metadata_dict]
        If an external provider is configured, audio_bytes contains the MP3 binary data.
        If no external key is configured, audio_bytes is None and metadata_dict contains
        fallback speech parameters for client-side multi-persona speech synthesis.
    """
    cfg = app_settings or settings
    clean_agent = (agent_id or "").strip().lower()
    clean_text = (text or "").strip()

    if clean_agent not in VALID_PERSONAS:
        raise ValueError(
            f"Invalid agent_id: '{clean_agent}'. Must be one of {sorted(list(VALID_PERSONAS))}"
        )

    if not clean_text:
        raise ValueError("Text to synthesize cannot be empty.")

    if len(clean_text) > MAX_TEXT_LENGTH:
        raise ValueError(
            f"Text exceeds maximum allowed length of {MAX_TEXT_LENGTH} characters (received {len(clean_text)})."
        )

    voice_name = PERSONA_VOICE_MAP[clean_agent]
    speech_config = PERSONA_SPEECH_CONFIG[clean_agent]
    api_key = cfg.tts_api_key.strip()

    if not api_key:
        logger.info(
            "[Voice] No external TTS API key configured. Returning browser fallback config for persona '%s'.",
            clean_agent,
        )
        return None, {
            "status": "fallback",
            "agent_id": clean_agent,
            "voice": voice_name,
            "speech_config": speech_config,
            "message": "TTS API key not configured. Using client-side speech synthesis.",
        }

    # Call external OpenAI TTS API if key is configured
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/audio/speech",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": cfg.tts_model or "tts-1",
                    "input": clean_text,
                    "voice": voice_name,
                    "response_format": "mp3",
                },
            )

            if response.status_code == 200:
                logger.info(
                    "[Voice] Successfully synthesized %d bytes of audio for persona '%s' (voice: %s)",
                    len(response.content),
                    clean_agent,
                    voice_name,
                )
                return response.content, {
                    "status": "success",
                    "agent_id": clean_agent,
                    "voice": voice_name,
                    "media_type": "audio/mpeg",
                }

            logger.warning(
                "[Voice] External TTS provider returned HTTP %d: %s. Falling back to browser speech.",
                response.status_code,
                response.text[:200],
            )
            return None, {
                "status": "fallback",
                "agent_id": clean_agent,
                "voice": voice_name,
                "speech_config": speech_config,
                "error": f"Provider returned HTTP {response.status_code}",
            }
    except Exception as exc:
        logger.warning(
            "[Voice] TTS request failed (%s). Falling back to browser speech.",
            exc,
        )
        return None, {
            "status": "fallback",
            "agent_id": clean_agent,
            "voice": voice_name,
            "speech_config": speech_config,
            "error": str(exc),
        }
