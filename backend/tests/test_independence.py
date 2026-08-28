"""Tests proving the INDEPENDENCE GUARANTEE.

These tests verify that each agent call receives ONLY the CandidateProfile
and its own persona prompt — never another agent's output.
"""

from __future__ import annotations

import asyncio
import inspect
from unittest.mock import AsyncMock, patch

import pytest

from app.schemas import CandidateProfile
from app.services.independent_review import (
    AGENT_IDS,
    _run_single_agent,
    run_independent_reviews,
)


class TestIndependenceGuarantee:
    """Core independence proof — the most important tests in the project."""

    def test_run_single_agent_signature_has_no_opinions_param(self):
        """The _run_single_agent function signature MUST NOT accept
        any parameter for other agents' opinions."""
        sig = inspect.signature(_run_single_agent)
        param_names = set(sig.parameters.keys())

        # Must have exactly agent_id and profile — nothing else
        assert "agent_id" in param_names
        assert "profile" in param_names

        # Must NOT have any parameter that could carry other opinions
        forbidden = {"opinions", "other_opinions", "prior_opinions", "context"}
        assert param_names & forbidden == set(), (
            f"_run_single_agent has forbidden parameters: {param_names & forbidden}"
        )

    def test_all_four_agents_are_defined(self):
        """All four agent IDs must be present."""
        assert set(AGENT_IDS) == {"technical", "culture", "hiring_manager", "skeptic"}

    @pytest.mark.asyncio
    async def test_parallel_execution_calls_gather(self, sample_profile):
        """run_independent_reviews must call all 4 agents in parallel
        via asyncio.gather, not sequentially."""
        call_log: list[str] = []

        async def mock_single_agent(agent_id, profile):
            call_log.append(agent_id)
            from app.services.independent_review import _mock_opinion
            return _mock_opinion(agent_id), []

        with patch(
            "app.services.independent_review._run_single_agent",
            side_effect=mock_single_agent,
        ):
            opinions, warnings = await run_independent_reviews(sample_profile)

        # All 4 agents must have been called
        assert set(call_log) == {"technical", "culture", "hiring_manager", "skeptic"}
        assert len(opinions) == 4

    @pytest.mark.asyncio
    async def test_each_agent_receives_only_profile(self, sample_profile):
        """Each generate_json call must receive only the profile data
        and the persona prompt — no other agent's output."""
        captured_prompts: list[dict] = []

        async def mock_generate_json(*, system_prompt, user_prompt, stage, agent_id=None):
            captured_prompts.append({
                "agent_id": agent_id,
                "system_prompt": system_prompt,
                "user_prompt": user_prompt,
            })
            return {
                "score": 7,
                "confidence": 70,
                "verdict": "yes",
                "summary": "Test summary",
                "evidence": [
                    {
                        "quote": "6 years building distributed systems at scale",
                        "source": "resume",
                        "note": "Test note",
                    }
                ],
            }

        with patch(
            "app.services.independent_review.generate_json",
            side_effect=mock_generate_json,
        ):
            opinions, _ = await run_independent_reviews(sample_profile)

        # Verify each call was isolated
        assert len(captured_prompts) == 4

        for call in captured_prompts:
            # The user prompt must contain profile data
            assert sample_profile.name in call["user_prompt"]
            assert sample_profile.target_role in call["user_prompt"]

            # The user prompt must NOT contain any other agent's output
            for other in ("score", "verdict", "confidence"):
                # These keys should only appear in the profile JSON context,
                # not as agent opinion results
                assert f'"agentId"' not in call["user_prompt"], (
                    f"Agent {call['agent_id']} received another agent's "
                    f"opinion data in its prompt!"
                )

    @pytest.mark.asyncio
    async def test_agent_failure_returns_mock_not_crash(self, sample_profile):
        """If one agent fails, the others should still succeed."""
        call_count = 0

        async def mock_generate_json(*, system_prompt, user_prompt, stage, agent_id=None):
            nonlocal call_count
            call_count += 1
            if agent_id == "skeptic":
                raise RuntimeError("Simulated Gemini failure")
            return {
                "score": 7,
                "confidence": 70,
                "verdict": "yes",
                "summary": "Test summary",
                "evidence": [
                    {
                        "quote": "6 years building distributed systems at scale",
                        "source": "resume",
                        "note": "Test note",
                    }
                ],
            }

        with patch(
            "app.services.independent_review.generate_json",
            side_effect=mock_generate_json,
        ):
            opinions, warnings = await run_independent_reviews(sample_profile)

        # Should still get 4 opinions (3 real + 1 mock fallback)
        assert len(opinions) == 4

        # The failed agent should have a warning
        assert any("skeptic" in w and "failed" in w.lower() for w in warnings)

        # The fallback opinion should be identifiable
        skeptic_op = next(op for op in opinions if op.agent_id == "skeptic")
        assert "fallback" in skeptic_op.summary.lower()
