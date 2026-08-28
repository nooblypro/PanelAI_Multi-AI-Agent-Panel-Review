"""Tests for provider-agnostic LLM client (OpenRouter & Gemini)."""

from __future__ import annotations

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import httpx

from app.config import Settings
from app.services.llm_client import (
    LLMError,
    _parse_json,
    generate_json,
)


class TestSettingsProviderResolution:
    """Test provider resolution and API key/model getters in Settings."""

    def test_openrouter_defaults(self):
        s = Settings(
            llm_provider="openrouter",
            openrouter_api_key="sk-or-test-key",
            llm_model="nvidia/nemotron-3-ultra-550b-a55b:free",
        )
        assert s.get_api_key() == "sk-or-test-key"
        assert s.get_model() == "nvidia/nemotron-3-ultra-550b-a55b:free"

    def test_gemini_switching(self):
        s = Settings(
            llm_provider="gemini",
            gemini_api_key="gemini-test-key",
            gemini_model="gemini-2.0-flash",
        )
        assert s.get_api_key() == "gemini-test-key"
        assert s.get_model() == "gemini-2.0-flash"


class TestJSONParsingRobustness:
    """Test _parse_json against raw JSON, markdown fences, and preambles."""

    def test_direct_json_object(self):
        raw = '{"score": 8, "verdict": "yes"}'
        result = _parse_json(raw, "test")
        assert result == {"score": 8, "verdict": "yes"}

    def test_direct_json_array(self):
        raw = '[{"id": "t1", "stance": "agree"}]'
        result = _parse_json(raw, "test")
        assert result == [{"id": "t1", "stance": "agree"}]

    def test_markdown_fenced_json(self):
        raw = """```json
{
  "score": 9,
  "verdict": "strong_yes",
  "summary": "Outstanding candidate"
}
```"""
        result = _parse_json(raw, "test")
        assert result["score"] == 9
        assert result["verdict"] == "strong_yes"

    def test_markdown_fenced_without_json_tag(self):
        raw = """```
{
  "score": 7,
  "verdict": "yes"
}
```"""
        result = _parse_json(raw, "test")
        assert result["score"] == 7

    def test_conversational_preamble_and_postamble(self):
        raw = """Sure, here is the candidate evaluation:

```json
{
  "score": 6,
  "verdict": "lean_yes"
}
```

I hope this helps!"""
        result = _parse_json(raw, "test")
        assert result["score"] == 6

    def test_unfenced_conversational_text(self):
        raw = """Here is the resulting object: {"score": 8, "confidence": 85} - thank you."""
        result = _parse_json(raw, "test")
        assert result == {"score": 8, "confidence": 85}

    def test_invalid_json_raises_llm_error(self):
        raw = "This is just plain text with no JSON."
        with pytest.raises(LLMError) as exc_info:
            _parse_json(raw, "test_stage")
        assert "could not parse LLM response as JSON" in str(exc_info.value)


class TestOpenRouterExecution:
    """Test OpenRouter API interactions with mocked HTTP client."""

    @pytest.mark.asyncio
    async def test_successful_openrouter_call(self):
        fake_response_content = json.dumps({
            "score": 8,
            "confidence": 80,
            "verdict": "yes",
            "summary": "Solid technical signals",
            "evidence": [
                {
                    "quote": "Built high-throughput data pipelines",
                    "source": "resume",
                    "note": "Relevant skill",
                }
            ],
        })

        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "choices": [
                {
                    "message": {
                        "role": "assistant",
                        "content": fake_response_content,
                    }
                }
            ]
        }

        with patch("app.services.llm_client.settings") as mock_settings:
            mock_settings.llm_provider = "openrouter"
            mock_settings.openrouter_api_key = "test-openrouter-key"
            mock_settings.openrouter_base_url = "https://openrouter.ai/api/v1"
            mock_settings.get_model.return_value = "nvidia/nemotron-3-ultra-550b-a55b:free"

            with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
                mock_post.return_value = mock_resp

                result = await generate_json(
                    system_prompt="You are a reviewer",
                    user_prompt="Evaluate candidate",
                    stage="independent_review",
                    agent_id="technical",
                )

                assert result["score"] == 8
                assert result["verdict"] == "yes"

                # Verify payload sent to OpenRouter
                mock_post.assert_called_once()
                call_kwargs = mock_post.call_args.kwargs
                assert "Authorization" in call_kwargs["headers"]
                assert call_kwargs["headers"]["Authorization"] == "Bearer test-openrouter-key"
                assert call_kwargs["json"]["model"] == "nvidia/nemotron-3-ultra-550b-a55b:free"
                assert len(call_kwargs["json"]["messages"]) == 2

    @pytest.mark.asyncio
    async def test_openrouter_missing_api_key_raises(self):
        with patch("app.services.llm_client.settings") as mock_settings:
            mock_settings.llm_provider = "openrouter"
            mock_settings.openrouter_api_key = ""

            with pytest.raises(LLMError) as exc_info:
                await generate_json(
                    system_prompt="Test",
                    user_prompt="Test",
                    stage="test",
                )
            assert "OPENROUTER_API_KEY is not set" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_openrouter_http_error_triggers_retry_and_raises(self):
        mock_resp = MagicMock()
        mock_resp.status_code = 429
        mock_resp.text = "Rate limit exceeded"

        with patch("app.services.llm_client.settings") as mock_settings:
            mock_settings.llm_provider = "openrouter"
            mock_settings.openrouter_api_key = "test-key"
            mock_settings.openrouter_base_url = "https://openrouter.ai/api/v1"
            mock_settings.get_model.return_value = "nvidia/nemotron-3-ultra-550b-a55b:free"

            with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
                mock_post.return_value = mock_resp

                with pytest.raises(LLMError) as exc_info:
                    await generate_json(
                        system_prompt="Test",
                        user_prompt="Test",
                        stage="test",
                    )
                # Attempted 2 times
                assert mock_post.call_count == 2
                assert "HTTP 429" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_unsupported_provider_raises(self):
        with patch("app.services.llm_client.settings") as mock_settings:
            mock_settings.llm_provider = "unsupported_llm"

            with pytest.raises(LLMError) as exc_info:
                await generate_json(
                    system_prompt="Test",
                    user_prompt="Test",
                    stage="test",
                )
            assert "Unsupported LLM_PROVIDER" in str(exc_info.value)
