"""Tests for production CORS handling, environment variable loading, and health check."""

import os
import pytest
from httpx import AsyncClient, ASGITransport
from app.config import Settings
from app.main import create_app


class TestEnvironmentAndConfig:
    """Test loading of settings from environment variables."""

    def test_openrouter_api_key_from_env(self, monkeypatch):
        monkeypatch.setenv("OPENROUTER_API_KEY", "sk-or-dummy-test-key-12345")
        s = Settings()
        assert s.openrouter_api_key == "sk-or-dummy-test-key-12345"
        assert s.get_api_key() == "sk-or-dummy-test-key-12345"

    def test_openrouter_model_from_env(self, monkeypatch):
        monkeypatch.setenv("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct:free")
        s = Settings()
        assert s.llm_model == "meta-llama/llama-3.3-70b-instruct:free"
        assert s.get_model() == "meta-llama/llama-3.3-70b-instruct:free"

    def test_llm_model_alias_from_env(self, monkeypatch):
        monkeypatch.setenv("LLM_MODEL", "google/gemini-2.0-flash-exp:free")
        s = Settings()
        assert s.llm_model == "google/gemini-2.0-flash-exp:free"

    def test_default_model_preserved_when_no_env(self, monkeypatch):
        monkeypatch.delenv("OPENROUTER_MODEL", raising=False)
        monkeypatch.delenv("LLM_MODEL", raising=False)
        s = Settings()
        assert "nvidia" in s.get_model() or "nemotron" in s.get_model()

    def test_comma_separated_cors_origins(self, monkeypatch):
        monkeypatch.setenv(
            "CORS_ORIGINS",
            "https://promptwars.onrender.com,https://promptwars-app.vercel.app/",
        )
        s = Settings()
        origins = s.get_cors_origins()
        assert "https://promptwars.onrender.com" in origins
        assert "https://promptwars-app.vercel.app" in origins  # trailing slash stripped
        # Local development origins still preserved
        assert "http://localhost:5173" in origins
        assert "http://127.0.0.1:5173" in origins

    def test_json_array_cors_origins(self, monkeypatch):
        monkeypatch.setenv(
            "CORS_ORIGINS",
            '["https://render-front.onrender.com", "https://custom-domain.com"]',
        )
        s = Settings()
        origins = s.get_cors_origins()
        assert "https://render-front.onrender.com" in origins
        assert "https://custom-domain.com" in origins

    def test_origin_with_path_and_quotes(self, monkeypatch):
        monkeypatch.setenv(
            "CORS_ORIGINS",
            '"https://promptwars-front.onrender.com/app", \'https://app.vercel.app/nested/route\'',
        )
        s = Settings()
        origins = s.get_cors_origins()
        assert "https://promptwars-front.onrender.com" in origins
        assert "https://app.vercel.app" in origins

    def test_frontend_url_alias(self, monkeypatch):
        monkeypatch.delenv("CORS_ORIGINS", raising=False)
        monkeypatch.setenv("FRONTEND_URL", "https://my-company-recruitment.onrender.com")
        s = Settings()
        origins = s.get_cors_origins()
        assert "https://my-company-recruitment.onrender.com" in origins


class TestProductionCORSPreflight:
    """Verify CORS preflights for production and local origins across all endpoints."""

    @pytest.fixture
    def prod_app(self, monkeypatch):
        monkeypatch.setenv(
            "CORS_ORIGINS",
            "https://promptwars.onrender.com,https://promptwars-app.vercel.app",
        )
        monkeypatch.setenv("OPENROUTER_API_KEY", "sk-or-test-key")
        return create_app()

    @pytest.mark.asyncio
    @pytest.mark.parametrize(
        "endpoint",
        [
            "/api/independent-review",
            "/api/independent-review/technical",
            "/api/independent-review/culture",
            "/api/independent-review/hiring_manager",
            "/api/independent-review/skeptic",
            "/api/build-profile",
            "/api/debate",
            "/api/synthesize",
        ],
    )
    async def test_cors_preflight_production_origin_allowed(self, prod_app, endpoint):
        async with AsyncClient(transport=ASGITransport(app=prod_app), base_url="http://test") as client:
            headers = {
                "Origin": "https://promptwars.onrender.com",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            }
            resp = await client.options(endpoint, headers=headers)
            assert resp.status_code == 200, f"Preflight failed for {endpoint}: {resp.status_code}"
            assert resp.headers.get("access-control-allow-origin") == "https://promptwars.onrender.com"
            assert "POST" in resp.headers.get("access-control-allow-methods", "")

    @pytest.mark.asyncio
    async def test_cors_preflight_localhost_preserved(self, prod_app):
        async with AsyncClient(transport=ASGITransport(app=prod_app), base_url="http://test") as client:
            headers = {
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            }
            resp = await client.options("/api/independent-review/technical", headers=headers)
            assert resp.status_code == 200
            assert resp.headers.get("access-control-allow-origin") == "http://localhost:5173"

    @pytest.mark.asyncio
    async def test_cors_preflight_disallowed_origin_rejected(self, prod_app):
        async with AsyncClient(transport=ASGITransport(app=prod_app), base_url="http://test") as client:
            headers = {
                "Origin": "https://malicious-attacker.com",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            }
            resp = await client.options("/api/independent-review/technical", headers=headers)
            # Origin is not allowed, so access-control-allow-origin must not be returned
            assert resp.headers.get("access-control-allow-origin") is None


class TestHealthEndpoint:
    """Verify the /health check endpoint for Render monitoring."""

    @pytest.mark.asyncio
    async def test_health_check_without_api_key(self, monkeypatch):
        monkeypatch.setenv("OPENROUTER_API_KEY", "")
        app = create_app()
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/health")
            assert resp.status_code == 200
            data = resp.json()
            assert data["status"] == "ok"
            assert data["ready"] is True
            assert data["has_api_key"] is False
            assert "key" not in data or data.get("key") is None  # no secret exposed

    @pytest.mark.asyncio
    async def test_health_check_with_api_key_safe(self, monkeypatch):
        test_key = "sk-or-very-secret-dummy-key"
        monkeypatch.setenv("OPENROUTER_API_KEY", test_key)
        app = create_app()
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/health")
            assert resp.status_code == 200
            data = resp.json()
            assert data["status"] == "ok"
            assert data["has_api_key"] is True
            # Crucial security check: the actual key must NEVER be in the response body
            assert test_key not in resp.text
