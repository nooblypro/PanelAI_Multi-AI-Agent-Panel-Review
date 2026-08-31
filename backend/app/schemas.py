"""Pydantic v2 models matching frontend/src/types.ts exactly.

Field names use camelCase aliases to produce JSON that the React frontend
consumes without transformation.
"""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Shared config: serialize using camelCase aliases so JSON matches TS types
# ---------------------------------------------------------------------------
_CAMEL = ConfigDict(populate_by_name=True)


def _alias(name: str) -> str:
    """snake_case → camelCase helper for Field aliases."""
    parts = name.split("_")
    return parts[0] + "".join(w.capitalize() for w in parts[1:])


# ---------------------------------------------------------------------------
# Sub-models for CandidateProfile
# ---------------------------------------------------------------------------

AgentId = Literal["technical", "culture", "hiring_manager", "skeptic"]
Source = Literal["resume", "transcript"]
Verdict = Literal["strong_yes", "yes", "lean_yes", "lean_no", "no", "strong_no"]
Stance = Literal["agree", "disagree", "challenge", "concede", "revise"]
Recommendation = Literal["Strong Hire", "Hire", "Hold", "No Hire"]


class Skill(BaseModel):
    model_config = _CAMEL
    name: str
    evidence: str
    source: Source


class Experience(BaseModel):
    model_config = _CAMEL
    company: str
    title: str
    duration: str
    highlights: list[str]


class Education(BaseModel):
    model_config = _CAMEL
    school: str
    degree: str
    year: Optional[str] = None


class Claim(BaseModel):
    model_config = _CAMEL
    text: str
    source: Source


# ---------------------------------------------------------------------------
# CandidateProfile
# ---------------------------------------------------------------------------

class CandidateProfile(BaseModel):
    model_config = _CAMEL

    id: str
    name: str
    target_role: str = Field(alias="targetRole")
    resume_text: str = Field(default="", alias="resumeText")
    transcript_text: str = Field(default="", alias="transcriptText")
    skills: list[Skill]
    experience: list[Experience]
    education: list[Education]
    claims: list[Claim]
    created_at: str = Field(alias="createdAt")


# ---------------------------------------------------------------------------
# AgentOpinion
# ---------------------------------------------------------------------------

class Evidence(BaseModel):
    model_config = _CAMEL
    quote: str
    source: Source
    note: str


class AgentOpinion(BaseModel):
    model_config = _CAMEL

    agent_id: AgentId = Field(alias="agentId")
    round: Literal["independent", "post_debate"]
    score: int = Field(ge=1, le=10)
    confidence: int = Field(ge=0, le=100)
    verdict: Verdict
    summary: str
    evidence: list[Evidence]
    timestamp: str


# ---------------------------------------------------------------------------
# DebateTurn
# ---------------------------------------------------------------------------

class RespondingTo(BaseModel):
    model_config = _CAMEL
    agent_id: AgentId = Field(alias="agentId")
    excerpt: str


class ScoreChange(BaseModel):
    model_config = _CAMEL
    from_: int = Field(alias="from")
    to: int


class DebateTurn(BaseModel):
    model_config = _CAMEL

    id: str
    from_agent: AgentId = Field(alias="fromAgent")
    responding_to: Optional[RespondingTo] = Field(default=None, alias="respondingTo")
    stance: Stance
    content: str
    score_change: Optional[ScoreChange] = Field(default=None, alias="scoreChange")
    timestamp: str


# ---------------------------------------------------------------------------
# FinalDecision
# ---------------------------------------------------------------------------

class WeightBreakdown(BaseModel):
    model_config = _CAMEL
    agent_id: AgentId = Field(alias="agentId")
    weight: float
    rationale: str


class UnresolvedDisagreement(BaseModel):
    model_config = _CAMEL
    agents: list[AgentId]
    topic: str
    description: str


class CriterionScore(BaseModel):
    model_config = _CAMEL
    name: str
    score: float = Field(ge=1.0, le=10.0)
    weight: float = Field(ge=0.0, le=1.0)
    weighted_score: float = Field(alias="weightedScore")
    rationale: str


class WhatWouldChange(BaseModel):
    model_config = _CAMEL
    move_up: list[str] = Field(alias="moveUp")
    move_down: list[str] = Field(alias="moveDown")


class FinalDecision(BaseModel):
    model_config = _CAMEL

    recommendation: Recommendation
    confidence_level: int = Field(ge=0, le=100, alias="confidenceLevel")
    confidence_rationale: Optional[str] = Field(default=None, alias="confidenceRationale")
    overall_score: Optional[float] = Field(default=None, alias="overallScore")
    criteria_scores: Optional[list[CriterionScore]] = Field(default=None, alias="criteriaScores")
    reasoning: str
    weight_breakdown: list[WeightBreakdown] = Field(alias="weightBreakdown")
    strengths: list[str]
    concerns: list[str]
    unresolved_disagreements: list[UnresolvedDisagreement] = Field(
        alias="unresolvedDisagreements"
    )
    what_would_change: Optional[WhatWouldChange] = Field(default=None, alias="whatWouldChange")


# ---------------------------------------------------------------------------
# Request / Response schemas for the API
# ---------------------------------------------------------------------------

class IndependentReviewRequest(BaseModel):
    """POST /api/independent-review — body is a CandidateProfile."""
    model_config = _CAMEL
    # The frontend sends a CandidateProfile directly as the body,
    # so this is just an alias for clarity in the router.
    pass


class DebateRequest(BaseModel):
    model_config = _CAMEL
    profile: CandidateProfile
    opinions: list[AgentOpinion]


class SynthesizeRequest(BaseModel):
    model_config = _CAMEL
    profile: CandidateProfile
    opinions: list[AgentOpinion]
    debate_turns: list[DebateTurn] = Field(alias="debateTurns")


class EvaluateRequest(BaseModel):
    """All-in-one convenience endpoint."""
    model_config = _CAMEL
    target_role: str = Field(alias="targetRole")
    resume_text: str = Field(alias="resumeText")
    transcript_text: str = Field(alias="transcriptText")
    candidate_name: Optional[str] = Field(default=None, alias="candidateName")


class EvaluateResponse(BaseModel):
    model_config = _CAMEL
    profile: CandidateProfile
    opinions: list[AgentOpinion]
    debate_turns: list[DebateTurn] = Field(alias="debateTurns")
    decision: FinalDecision
    warnings: list[str] = Field(default_factory=list)


class VoiceSynthesizeRequest(BaseModel):
    """POST /api/voice/synthesize — synthesize speech for a persona turn."""
    model_config = _CAMEL
    agent_id: str = Field(alias="agentId")
    text: str
