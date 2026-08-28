"""Pipeline router — the 3 endpoints matching the frontend's 3 function calls.

POST /api/independent-review   ← CandidateProfile  → AgentOpinion[]
POST /api/debate               ← {profile, opinions} → DebateTurn[]
POST /api/synthesize           ← {profile, opinions, debateTurns} → FinalDecision
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from app.schemas import (
    AgentOpinion,
    CandidateProfile,
    DebateRequest,
    DebateTurn,
    FinalDecision,
    SynthesizeRequest,
)
from app.services.debate import run_debate
from app.services.independent_review import run_independent_reviews
from app.services.synthesis import synthesize_decision

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["pipeline"])


# ---------------------------------------------------------------------------
# 1. Independent Review
# ---------------------------------------------------------------------------


@router.post("/independent-review")
async def independent_review(profile: CandidateProfile) -> dict:
    """Run 4 independent agent evaluations.

    Request body: CandidateProfile (JSON, camelCase).
    Response: { opinions: AgentOpinion[], warnings?: string[] }
    """
    try:
        opinions, warnings = await run_independent_reviews(profile)
    except Exception as exc:
        logger.exception("Independent review failed")
        raise HTTPException(
            status_code=500,
            detail=f"Independent review failed: {exc}",
        ) from exc

    result: dict = {
        "opinions": [op.model_dump(by_alias=True) for op in opinions],
    }
    if warnings:
        result["warnings"] = warnings

    return result


# ---------------------------------------------------------------------------
# 2. Debate
# ---------------------------------------------------------------------------


@router.post("/debate")
async def debate(request: DebateRequest) -> dict:
    """Generate a structured debate between the 4 agents.

    Request body: { profile: CandidateProfile, opinions: AgentOpinion[] }
    Response: { debateTurns: DebateTurn[], warnings?: string[] }
    """
    try:
        turns, warnings = await run_debate(request.profile, request.opinions)
    except Exception as exc:
        logger.exception("Debate generation failed")
        raise HTTPException(
            status_code=500,
            detail=f"Debate generation failed: {exc}",
        ) from exc

    result: dict = {
        "debateTurns": [t.model_dump(by_alias=True) for t in turns],
    }
    if warnings:
        result["warnings"] = warnings

    return result


# ---------------------------------------------------------------------------
# 3. Synthesize
# ---------------------------------------------------------------------------


@router.post("/synthesize")
async def synthesize(request: SynthesizeRequest) -> dict:
    """Synthesize the final hiring decision.

    Request body: { profile, opinions, debateTurns }
    Response: { decision: FinalDecision, warnings?: string[] }
    """
    try:
        decision, warnings = await synthesize_decision(
            request.profile, request.opinions, request.debate_turns
        )
    except Exception as exc:
        logger.exception("Synthesis failed")
        raise HTTPException(
            status_code=500,
            detail=f"Synthesis failed: {exc}",
        ) from exc

    result: dict = {
        "decision": decision.model_dump(by_alias=True),
    }
    if warnings:
        result["warnings"] = warnings

    return result
