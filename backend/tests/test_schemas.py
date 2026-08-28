"""Tests validating Pydantic schemas match frontend TypeScript types."""

from __future__ import annotations

import json

import pytest

from app.schemas import (
    AgentOpinion,
    CandidateProfile,
    DebateRequest,
    DebateTurn,
    Evidence,
    FinalDecision,
    RespondingTo,
    ScoreChange,
    SynthesizeRequest,
    UnresolvedDisagreement,
    WeightBreakdown,
)


class TestCandidateProfile:
    """CandidateProfile must serialize with camelCase keys."""

    def test_serializes_with_camel_case(self, sample_profile):
        data = sample_profile.model_dump(by_alias=True)

        # All keys from TypeScript interface must be present
        assert "id" in data
        assert "name" in data
        assert "targetRole" in data
        assert "resumeText" in data
        assert "transcriptText" in data
        assert "skills" in data
        assert "experience" in data
        assert "education" in data
        assert "claims" in data
        assert "createdAt" in data

        # snake_case keys must NOT be present in alias mode
        assert "target_role" not in data
        assert "resume_text" not in data
        assert "transcript_text" not in data
        assert "created_at" not in data

    def test_round_trip_json(self, sample_profile):
        """JSON serialize → deserialize must produce identical object."""
        json_str = sample_profile.model_dump_json(by_alias=True)
        restored = CandidateProfile.model_validate_json(json_str)
        assert restored.id == sample_profile.id
        assert restored.name == sample_profile.name
        assert restored.target_role == sample_profile.target_role


class TestAgentOpinion:
    """AgentOpinion must serialize with correct camelCase and constraints."""

    def test_serializes_with_camel_case(self, sample_opinions):
        for op in sample_opinions:
            data = op.model_dump(by_alias=True)
            assert "agentId" in data
            assert "score" in data
            assert "confidence" in data
            assert "verdict" in data
            assert "evidence" in data

    def test_score_range(self):
        """Score must be 1-10."""
        with pytest.raises(Exception):
            AgentOpinion(
                agent_id="technical",
                round="independent",
                score=0,  # below minimum
                confidence=50,
                verdict="yes",
                summary="test",
                evidence=[],
                timestamp="2026-01-01T00:00:00Z",
            )

        with pytest.raises(Exception):
            AgentOpinion(
                agent_id="technical",
                round="independent",
                score=11,  # above maximum
                confidence=50,
                verdict="yes",
                summary="test",
                evidence=[],
                timestamp="2026-01-01T00:00:00Z",
            )


class TestDebateTurn:
    """DebateTurn must serialize correctly including optional fields."""

    def test_with_responding_to(self):
        turn = DebateTurn(
            id="t1",
            from_agent="technical",
            responding_to=RespondingTo(agent_id="skeptic", excerpt="test"),
            stance="disagree",
            content="I disagree because...",
            score_change=ScoreChange(from_=7, to=8),
            timestamp="2026-01-01T00:00:00Z",
        )
        data = turn.model_dump(by_alias=True)
        assert data["fromAgent"] == "technical"
        assert data["respondingTo"]["agentId"] == "skeptic"
        assert data["scoreChange"]["from"] == 7
        assert data["scoreChange"]["to"] == 8

    def test_without_optional_fields(self):
        turn = DebateTurn(
            id="t2",
            from_agent="culture",
            stance="agree",
            content="I agree.",
            timestamp="2026-01-01T00:00:00Z",
        )
        data = turn.model_dump(by_alias=True)
        assert data["respondingTo"] is None
        assert data["scoreChange"] is None


class TestFinalDecision:
    """FinalDecision must serialize correctly."""

    def test_all_fields_present(self):
        decision = FinalDecision(
            recommendation="Hire",
            confidence_level=75,
            reasoning="Strong candidate overall.",
            weight_breakdown=[
                WeightBreakdown(
                    agent_id="technical", weight=0.3, rationale="Strong tech"
                ),
                WeightBreakdown(
                    agent_id="culture", weight=0.25, rationale="Good fit"
                ),
                WeightBreakdown(
                    agent_id="hiring_manager", weight=0.3, rationale="Impact"
                ),
                WeightBreakdown(
                    agent_id="skeptic", weight=0.15, rationale="Some concerns"
                ),
            ],
            strengths=["Technical depth", "Leadership"],
            concerns=["Limited company diversity"],
            unresolved_disagreements=[
                UnresolvedDisagreement(
                    agents=["technical", "skeptic"],
                    topic="Depth vs breadth",
                    description="Disagreement on specialization",
                ),
            ],
        )
        data = decision.model_dump(by_alias=True)
        assert data["recommendation"] == "Hire"
        assert data["confidenceLevel"] == 75
        assert len(data["weightBreakdown"]) == 4
        assert len(data["unresolvedDisagreements"]) == 1
