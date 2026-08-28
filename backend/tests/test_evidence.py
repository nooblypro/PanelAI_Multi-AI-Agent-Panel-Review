"""Tests for evidence validation logic."""

from __future__ import annotations

import pytest

from app.schemas import AgentOpinion, CandidateProfile, Evidence
from app.validation import validate_evidence


class TestEvidenceValidation:
    """Test validate_evidence ensures quotes exist in source text."""

    def test_valid_evidence_resume_and_transcript(self, sample_profile):
        opinion = AgentOpinion(
            agent_id="technical",
            round="independent",
            score=8,
            confidence=80,
            verdict="yes",
            summary="Test summary",
            evidence=[
                Evidence(
                    quote="Led migration from monolith to microservices",
                    source="resume",
                    note="Found in resume",
                ),
                Evidence(
                    quote="I designed the migration strategy and we completed it in 6 months",
                    source="transcript",
                    note="Found in transcript",
                ),
            ],
            timestamp="2026-08-28T10:00:00Z",
        )
        is_valid, warnings = validate_evidence(opinion, sample_profile)
        assert is_valid is True
        assert len(warnings) == 0

    def test_invalid_evidence_hallucinated(self, sample_profile):
        opinion = AgentOpinion(
            agent_id="technical",
            round="independent",
            score=8,
            confidence=80,
            verdict="yes",
            summary="Test summary",
            evidence=[
                Evidence(
                    quote="Invented statement that never appears anywhere in the text",
                    source="resume",
                    note="Hallucinated quote",
                ),
            ],
            timestamp="2026-08-28T10:00:00Z",
        )
        is_valid, warnings = validate_evidence(opinion, sample_profile)
        assert is_valid is False
        assert len(warnings) >= 1
        assert any("NO evidence quotes matched" in w for w in warnings)

    def test_mixed_evidence_partial_match(self, sample_profile):
        opinion = AgentOpinion(
            agent_id="culture",
            round="independent",
            score=7,
            confidence=70,
            verdict="yes",
            summary="Test summary",
            evidence=[
                Evidence(
                    quote="I conceded because the data supported their position",
                    source="transcript",
                    note="Valid transcript quote",
                ),
                Evidence(
                    quote="Invented second quote",
                    source="resume",
                    note="Invalid resume quote",
                ),
            ],
            timestamp="2026-08-28T10:00:00Z",
        )
        is_valid, warnings = validate_evidence(opinion, sample_profile)
        assert is_valid is True  # at least one valid quote
        assert len(warnings) == 1
        assert "Invented second quote" in warnings[0]

    def test_empty_evidence_list(self, sample_profile):
        opinion = AgentOpinion(
            agent_id="skeptic",
            round="independent",
            score=5,
            confidence=50,
            verdict="lean_yes",
            summary="Test summary",
            evidence=[],
            timestamp="2026-08-28T10:00:00Z",
        )
        is_valid, warnings = validate_evidence(opinion, sample_profile)
        assert is_valid is False
        assert len(warnings) == 1
        assert "no evidence items provided" in warnings[0]
