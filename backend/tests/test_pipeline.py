"""Tests for the full pipeline endpoints and fallback behavior."""

from __future__ import annotations

import json
from unittest.mock import patch

import pytest
from httpx import AsyncClient


class TestHealthEndpoint:
    """Health check must always work."""

    @pytest.mark.asyncio
    async def test_health(self, client):
        resp = await client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert "model" in data


class TestIndependentReviewEndpoint:
    """POST /api/independent-review"""

    @pytest.mark.asyncio
    async def test_returns_4_opinions(self, client, sample_profile):
        """With mocked Gemini, should return 4 opinions."""

        async def mock_generate_json(*, system_prompt, user_prompt, stage, agent_id=None):
            return {
                "score": 7,
                "confidence": 70,
                "verdict": "yes",
                "summary": f"Evaluation from {agent_id}",
                "evidence": [
                    {
                        "quote": "6 years building distributed systems at scale",
                        "source": "resume",
                        "note": "Strong experience",
                    }
                ],
            }

        with patch(
            "app.services.independent_review.generate_json",
            side_effect=mock_generate_json,
        ):
            resp = await client.post(
                "/api/independent-review",
                json=sample_profile.model_dump(by_alias=True),
            )

        assert resp.status_code == 200
        data = resp.json()
        assert "opinions" in data
        assert len(data["opinions"]) == 4

        # Each opinion must have the correct shape
        agent_ids = {op["agentId"] for op in data["opinions"]}
        assert agent_ids == {"technical", "culture", "hiring_manager", "skeptic"}

    @pytest.mark.asyncio
    async def test_single_agent_review_success(self, client, sample_profile):
        """POST /api/independent-review/{agent_id} returns single opinion."""
        async def mock_generate_json(*, system_prompt, user_prompt, stage, agent_id=None):
            return {
                "score": 8,
                "confidence": 80,
                "verdict": "yes",
                "summary": "Technical review summary",
                "evidence": [
                    {
                        "quote": "6 years building distributed systems at scale",
                        "source": "resume",
                        "note": "Proven systems depth",
                    }
                ],
            }

        with patch(
            "app.services.independent_review.generate_json",
            side_effect=mock_generate_json,
        ):
            resp = await client.post(
                "/api/independent-review/technical",
                json=sample_profile.model_dump(by_alias=True),
            )

        assert resp.status_code == 200
        data = resp.json()
        assert "opinion" in data
        assert data["opinion"]["agentId"] == "technical"
        assert data["opinion"]["score"] == 8

    @pytest.mark.asyncio
    async def test_single_agent_review_fallback_on_llm_error(self, client, sample_profile):
        """POST /api/independent-review/{agent_id} returns fallback opinion when LLM fails."""
        with patch(
            "app.services.independent_review.generate_json",
            side_effect=Exception("Rate limit 429"),
        ):
            resp = await client.post(
                "/api/independent-review/skeptic",
                json=sample_profile.model_dump(by_alias=True),
            )

        assert resp.status_code == 200
        data = resp.json()
        assert "opinion" in data
        assert data["opinion"]["agentId"] == "skeptic"
        assert "warnings" in data
        assert any("fallback" in w.lower() for w in data["warnings"])

    @pytest.mark.asyncio
    async def test_invalid_body_returns_422(self, client):
        """Missing required fields should return 422."""
        resp = await client.post(
            "/api/independent-review",
            json={"name": "test"},  # missing most fields
        )
        assert resp.status_code == 422


class TestDebateEndpoint:
    """POST /api/debate"""

    @pytest.mark.asyncio
    async def test_returns_debate_turns(self, client, sample_profile, sample_opinions):
        """With mocked Gemini, should return debate turns."""

        async def mock_generate_json(*, system_prompt, user_prompt, stage, agent_id=None):
            return [
                {
                    "id": "t1",
                    "fromAgent": "technical",
                    "respondingTo": None,
                    "stance": "challenge",
                    "content": "I want to challenge the skeptic's concern.",
                    "scoreChange": None,
                    "timestamp": "2026-08-28T10:00:00Z",
                },
                {
                    "id": "t2",
                    "fromAgent": "skeptic",
                    "respondingTo": {"agentId": "technical", "excerpt": "challenge"},
                    "stance": "concede",
                    "content": "Fair point, I'll revise.",
                    "scoreChange": {"from": 6, "to": 7},
                    "timestamp": "2026-08-28T10:01:00Z",
                },
            ]

        with patch(
            "app.services.debate.generate_json",
            side_effect=mock_generate_json,
        ):
            resp = await client.post(
                "/api/debate",
                json={
                    "profile": sample_profile.model_dump(by_alias=True),
                    "opinions": [
                        op.model_dump(by_alias=True) for op in sample_opinions
                    ],
                },
            )

        assert resp.status_code == 200
        data = resp.json()
        assert "debateTurns" in data
        assert len(data["debateTurns"]) >= 2


class TestSynthesizeEndpoint:
    """POST /api/synthesize"""

    @pytest.mark.asyncio
    async def test_returns_decision(self, client, sample_profile, sample_opinions):
        """With mocked Gemini, should return a final decision."""

        async def mock_generate_json(*, system_prompt, user_prompt, stage, agent_id=None):
            return {
                "recommendation": "Hire",
                "confidenceLevel": 78,
                "reasoning": "Strong technical candidate with good cultural fit.",
                "weightBreakdown": [
                    {"agentId": "technical", "weight": 0.3, "rationale": "Deep expertise"},
                    {"agentId": "culture", "weight": 0.25, "rationale": "Good fit"},
                    {"agentId": "hiring_manager", "weight": 0.3, "rationale": "Impact"},
                    {"agentId": "skeptic", "weight": 0.15, "rationale": "Some concerns"},
                ],
                "strengths": ["Technical depth", "Leadership experience"],
                "concerns": ["Limited company diversity"],
                "unresolvedDisagreements": [],
            }

        from app.schemas import DebateTurn

        mock_turns = [
            DebateTurn(
                id="t1",
                from_agent="technical",
                stance="challenge",
                content="Test turn.",
                timestamp="2026-08-28T10:00:00Z",
            ),
        ]

        with patch(
            "app.services.synthesis.generate_json",
            side_effect=mock_generate_json,
        ):
            resp = await client.post(
                "/api/synthesize",
                json={
                    "profile": sample_profile.model_dump(by_alias=True),
                    "opinions": [
                        op.model_dump(by_alias=True) for op in sample_opinions
                    ],
                    "debateTurns": [
                        t.model_dump(by_alias=True) for t in mock_turns
                    ],
                },
            )

        assert resp.status_code == 200
        data = resp.json()
        assert "decision" in data
        assert data["decision"]["recommendation"] in {
            "Strong Hire", "Hire", "Hold", "No Hire"
        }
        assert "weightBreakdown" in data["decision"]
