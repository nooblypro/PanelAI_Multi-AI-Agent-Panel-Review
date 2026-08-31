"""Tests for the Voice Synthesis service and endpoint (/api/voice/synthesize)."""

import pytest
from httpx import ASGITransport, AsyncClient
from unittest.mock import patch, AsyncMock

from app.config import Settings
from app.main import create_app
from app.services.voice import (
    PERSONA_SPEECH_CONFIG,
    PERSONA_VOICE_MAP,
    VALID_PERSONAS,
    synthesize_speech,
)


@pytest.fixture
def app():
    """Create test application instance with clean settings."""
    test_settings = Settings(
        llm_provider="openrouter",
        openrouter_api_key="test-key",
        tts_api_key="",  # No external key by default
    )
    return create_app(test_settings)


@pytest.fixture
async def client(app):
    """Async test client."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest.mark.asyncio
async def test_synthesize_voice_fallback_when_no_api_key(client):
    """Without external TTS API key, endpoint returns fallback metadata for client-side synthesis."""
    response = await client.post(
        "/api/voice/synthesize",
        json={"agentId": "technical", "text": "I reviewed the distributed systems architecture."},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "fallback"
    assert data["agent_id"] == "technical"
    assert data["voice"] == "alloy"
    assert "speech_config" in data
    assert data["speech_config"]["pitch"] == PERSONA_SPEECH_CONFIG["technical"]["pitch"]


@pytest.mark.asyncio
async def test_synthesize_voice_all_valid_personas(client):
    """All 4 personas map to distinct voices properly."""
    for persona in VALID_PERSONAS:
        response = await client.post(
            "/api/voice/synthesize",
            json={"agentId": persona, "text": f"This is a test message from {persona}."},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["agent_id"] == persona
        assert data["voice"] == PERSONA_VOICE_MAP[persona]


@pytest.mark.asyncio
async def test_synthesize_voice_invalid_agent_id(client):
    """Invalid agent ID returns 400 Bad Request."""
    response = await client.post(
        "/api/voice/synthesize",
        json={"agentId": "invalid_agent", "text": "Testing invalid persona."},
    )
    assert response.status_code == 400
    assert "Invalid agent_id" in response.json()["detail"]


@pytest.mark.asyncio
async def test_synthesize_voice_empty_text(client):
    """Empty text returns 400 Bad Request."""
    response = await client.post(
        "/api/voice/synthesize",
        json={"agentId": "skeptic", "text": "   "},
    )
    assert response.status_code == 400
    assert "cannot be empty" in response.json()["detail"]


@pytest.mark.asyncio
async def test_synthesize_voice_oversized_text(client):
    """Text exceeding 3000 chars returns 400 Bad Request."""
    long_text = "word " * 650  # > 3000 chars
    response = await client.post(
        "/api/voice/synthesize",
        json={"agentId": "skeptic", "text": long_text},
    )
    assert response.status_code == 400
    assert "exceeds maximum allowed length" in response.json()["detail"]


@pytest.mark.asyncio
async def test_synthesize_voice_with_mocked_provider_success():
    """When TTS API key is present and provider succeeds, binary audio is returned."""
    mock_settings = Settings(
        tts_api_key="mock-tts-key",
        tts_model="tts-1",
    )
    fake_audio_bytes = b"\xff\xfb\x90\x44" + b"fake-mp3-data"

    with patch("httpx.AsyncClient.post") as mock_post:
        mock_resp = AsyncMock()
        mock_resp.status_code = 200
        mock_resp.content = fake_audio_bytes
        mock_post.return_value = mock_resp

        audio, meta = await synthesize_speech("culture", "Great cultural alignment.", mock_settings)
        assert audio == fake_audio_bytes
        assert meta["status"] == "success"
        assert meta["voice"] == "shimmer"


@pytest.mark.asyncio
async def test_synthesize_voice_with_mocked_provider_failure_graceful_fallback():
    """When external TTS provider fails with HTTP 500 or timeout, returns graceful fallback."""
    mock_settings = Settings(
        tts_api_key="mock-tts-key",
        tts_model="tts-1",
    )

    with patch("httpx.AsyncClient.post") as mock_post:
        mock_resp = AsyncMock()
        mock_resp.status_code = 500
        mock_resp.text = "Internal Provider Error"
        mock_post.return_value = mock_resp

        audio, meta = await synthesize_speech("hiring_manager", "Let's review leadership signals.", mock_settings)
        assert audio is None
        assert meta["status"] == "fallback"
        assert meta["agent_id"] == "hiring_manager"
        assert "error" in meta
