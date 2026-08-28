"""Synthesis service — final decision generation.

Combines all 4 opinions + debate into a single FinalDecision.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone

from app.prompts.synthesis import SYNTHESIS_SYSTEM_PROMPT, build_synthesis_user_prompt
from app.schemas import (
    AgentOpinion,
    CandidateProfile,
    DebateTurn,
    FinalDecision,
    UnresolvedDisagreement,
    WeightBreakdown,
)
from app.services.gemini_client import GeminiError, generate_json

logger = logging.getLogger(__name__)


async def synthesize_decision(
    profile: CandidateProfile,
    opinions: list[AgentOpinion],
    debate_turns: list[DebateTurn],
) -> tuple[FinalDecision, list[str]]:
    """Synthesize the final hiring decision.

    Returns
    -------
    (decision, warnings)
    """
    warnings: list[str] = []

    profile_json = json.dumps(
        profile.model_dump(by_alias=True), indent=2
    )
    opinions_json = json.dumps(
        [op.model_dump(by_alias=True) for op in opinions], indent=2
    )
    debate_json = json.dumps(
        [t.model_dump(by_alias=True) for t in debate_turns], indent=2
    )

    user_prompt = build_synthesis_user_prompt(
        profile_json, opinions_json, debate_json
    )

    try:
        raw = await generate_json(
            system_prompt=SYNTHESIS_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            stage="synthesis",
        )

        decision = _parse_decision(raw)
        return decision, warnings

    except (GeminiError, Exception) as exc:
        logger.error("Synthesis failed: %s", exc)
        warnings.append(f"Synthesis failed: {exc}")
        return _mock_decision(opinions), warnings


# ---------------------------------------------------------------------------
# Parsing
# ---------------------------------------------------------------------------


def _parse_decision(raw: dict) -> FinalDecision:
    """Parse raw JSON into a FinalDecision with defensive defaults."""
    valid_recs = {"Strong Hire", "Hire", "Hold", "No Hire"}
    rec = raw.get("recommendation", "Hold")
    if rec not in valid_recs:
        rec = "Hold"

    weight_breakdown = []
    for wb in raw.get("weightBreakdown", []):
        weight_breakdown.append(
            WeightBreakdown(
                agent_id=wb.get("agentId", "technical"),
                weight=float(wb.get("weight", 0.25)),
                rationale=str(wb.get("rationale", "")),
            )
        )

    # Ensure all 4 agents are represented
    seen = {wb.agent_id for wb in weight_breakdown}
    for aid in ("technical", "culture", "hiring_manager", "skeptic"):
        if aid not in seen:
            weight_breakdown.append(
                WeightBreakdown(
                    agent_id=aid,
                    weight=0.25,
                    rationale="Default weight — agent not included in synthesis output",
                )
            )

    unresolved = []
    for ud in raw.get("unresolvedDisagreements", []):
        unresolved.append(
            UnresolvedDisagreement(
                agents=ud.get("agents", []),
                topic=str(ud.get("topic", "")),
                description=str(ud.get("description", "")),
            )
        )

    return FinalDecision(
        recommendation=rec,
        confidence_level=max(0, min(100, int(raw.get("confidenceLevel", 50)))),
        reasoning=str(raw.get("reasoning", "No reasoning provided.")),
        weight_breakdown=weight_breakdown,
        strengths=raw.get("strengths", []),
        concerns=raw.get("concerns", []),
        unresolved_disagreements=unresolved,
    )


# ---------------------------------------------------------------------------
# Mock fallback
# ---------------------------------------------------------------------------


def _mock_decision(opinions: list[AgentOpinion]) -> FinalDecision:
    """Return a fallback decision when Gemini fails."""
    avg_score = sum(op.score for op in opinions) / max(len(opinions), 1)
    rec = "Hold" if avg_score >= 5 else "No Hire"

    return FinalDecision(
        recommendation=rec,
        confidence_level=25,
        reasoning=(
            "⚠️ This is a fallback decision. The AI synthesis service was "
            "temporarily unavailable. The recommendation is based on a simple "
            "score average. Please retry for a real assessment."
        ),
        weight_breakdown=[
            WeightBreakdown(
                agent_id=aid,
                weight=0.25,
                rationale="Equal weight (fallback)",
            )
            for aid in ("technical", "culture", "hiring_manager", "skeptic")
        ],
        strengths=["Unable to determine — AI service unavailable"],
        concerns=["Unable to determine — AI service unavailable"],
        unresolved_disagreements=[],
    )
