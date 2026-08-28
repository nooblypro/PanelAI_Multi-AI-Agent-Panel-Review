"""Tests for the 5 JD evaluation criteria, weighted scoring math, and synthesis service."""

from __future__ import annotations

import pytest

from app.schemas import (
    AgentOpinion,
    CandidateProfile,
    CriterionScore,
    DebateTurn,
    FinalDecision,
    WhatWouldChange,
)
from app.services.synthesis import (
    CRITERIA_DEFINITIONS,
    _parse_decision,
    _mock_decision,
)


@pytest.fixture
def sample_opinions_list() -> list[AgentOpinion]:
    return [
        AgentOpinion(
            agent_id="technical",
            round="independent",
            score=9,
            confidence=95,
            verdict="strong_yes",
            summary="Exceptional systems depth.",
            evidence=[],
            timestamp="2026-01-01T00:00:00Z",
        ),
        AgentOpinion(
            agent_id="culture",
            round="independent",
            score=8,
            confidence=85,
            verdict="yes",
            summary="Collaborative and transparent.",
            evidence=[],
            timestamp="2026-01-01T00:00:00Z",
        ),
        AgentOpinion(
            agent_id="hiring_manager",
            round="independent",
            score=8,
            confidence=85,
            verdict="yes",
            summary="Strong fit for senior staff.",
            evidence=[],
            timestamp="2026-01-01T00:00:00Z",
        ),
        AgentOpinion(
            agent_id="skeptic",
            round="independent",
            score=5,
            confidence=70,
            verdict="lean_no",
            summary="Limited proof on agentic deployment.",
            evidence=[],
            timestamp="2026-01-01T00:00:00Z",
        ),
    ]


class TestJDEvaluationCriteria:
    """Validate the 5 Job Description evaluation criteria and weights."""

    def test_five_criteria_definitions_and_weights_sum_to_one(self):
        expected_criteria = {
            "Technical ability": 0.30,
            "Agentic AI / LLM experience": 0.30,
            "Production engineering": 0.20,
            "Problem solving": 0.10,
            "Communication / collaboration": 0.10,
        }
        actual_criteria = dict(CRITERIA_DEFINITIONS)
        assert actual_criteria == expected_criteria
        assert sum(actual_criteria.values()) == pytest.approx(1.0)

    def test_parse_decision_mathematical_consistency(self, sample_opinions_list):
        raw_llm_json = {
            "recommendation": "Hire",
            "confidenceLevel": 78,
            "confidenceRationale": "Strong core backend performance with moderate uncertainty in agentic tooling.",
            "criteriaScores": [
                {"name": "Technical ability", "score": 8.0, "weight": 0.30, "rationale": "Strong distributed systems."},
                {"name": "Agentic AI / LLM experience", "score": 5.0, "weight": 0.30, "rationale": "Emerging familiarity."},
                {"name": "Production engineering", "score": 7.0, "weight": 0.20, "rationale": "High-throughput clusters."},
                {"name": "Problem solving", "score": 7.0, "weight": 0.10, "rationale": "Raft timeout debugging."},
                {"name": "Communication / collaboration", "score": 7.0, "weight": 0.10, "rationale": "Clear benchmark data."},
            ],
            "reasoning": "Candidate excels in production systems while agentic tooling remains a growth area.",
            "weightBreakdown": [
                {"agentId": "technical", "weight": 0.35, "rationale": "High technical signal."},
                {"agentId": "culture", "weight": 0.20, "rationale": "Good alignment."},
                {"agentId": "hiring_manager", "weight": 0.25, "rationale": "Role fit."},
                {"agentId": "skeptic", "weight": 0.20, "rationale": "Critical risk check."},
            ],
            "strengths": ["Zero-copy memory buffers", "Raft consensus mastery"],
            "concerns": ["Unverified autonomous agentic deployments"],
            "unresolvedDisagreements": [
                {
                    "agents": ["technical", "skeptic"],
                    "topic": "Agentic specialization vs core systems",
                    "description": "Mentorship capacity is an unresolved hiring dependency because it was not provided in the supplied hiring context.",
                }
            ],
            "whatWouldChange": {
                "moveUp": ["Demonstrate hands-on production multi-agent deployment in live exercise."],
                "moveDown": ["Role requires immediate autonomous ownership with zero ramp-up time."],
            },
        }

        decision = _parse_decision(raw_llm_json, sample_opinions_list)

        # Verify criteria scores are populated
        assert len(decision.criteria_scores) == 5
        crit_dict = {c.name: c for c in decision.criteria_scores}

        # 8.0 * 0.30 = 2.40
        assert crit_dict["Technical ability"].weighted_score == 2.40
        # 5.0 * 0.30 = 1.50
        assert crit_dict["Agentic AI / LLM experience"].weighted_score == 1.50
        # 7.0 * 0.20 = 1.40
        assert crit_dict["Production engineering"].weighted_score == 1.40
        # 7.0 * 0.10 = 0.70
        assert crit_dict["Problem solving"].weighted_score == 0.70
        # 7.0 * 0.10 = 0.70
        assert crit_dict["Communication / collaboration"].weighted_score == 0.70

        # Exact mathematical sum: 2.40 + 1.50 + 1.40 + 0.70 + 0.70 = 6.7
        expected_sum = 6.7
        assert decision.overall_score == expected_sum

        # Confidence and Rationale
        assert decision.confidence_level == 78
        assert "moderate uncertainty" in decision.confidence_rationale

        # What Would Change
        assert len(decision.what_would_change.move_up) == 1
        assert len(decision.what_would_change.move_down) == 1
        assert "multi-agent deployment" in decision.what_would_change.move_up[0]

        # Uncertainty handling check
        assert "unresolved hiring dependency" in decision.unresolved_disagreements[0].description

    def test_mock_fallback_decision_has_all_five_criteria(self, sample_opinions_list):
        fallback = _mock_decision(sample_opinions_list)
        assert fallback.criteria_scores is not None
        assert len(fallback.criteria_scores) == 5
        assert fallback.overall_score is not None
        assert fallback.what_would_change is not None
        assert len(fallback.what_would_change.move_up) >= 1
        assert len(fallback.what_would_change.move_down) >= 1
        assert fallback.confidence_rationale is not None

        # Verify math
        calc_sum = round(sum(c.weighted_score for c in fallback.criteria_scores), 1)
        assert fallback.overall_score == calc_sum
