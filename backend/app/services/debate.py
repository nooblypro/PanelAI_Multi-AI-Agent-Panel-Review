"""Debate service — multi-turn structured debate between agents.

This stage runs AFTER all 4 independent opinions are collected.  It is the
first point where agents' opinions can interact.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone

from app.prompts.debate import DEBATE_SYSTEM_PROMPT, build_debate_user_prompt
from app.schemas import (
    AgentOpinion,
    CandidateProfile,
    DebateTurn,
    RespondingTo,
    ScoreChange,
)
from app.services.gemini_client import GeminiError, generate_json

logger = logging.getLogger(__name__)


async def run_debate(
    profile: CandidateProfile,
    opinions: list[AgentOpinion],
) -> tuple[list[DebateTurn], list[str]]:
    """Generate a structured debate between the 4 agents.

    Returns
    -------
    (debate_turns, warnings)
    """
    warnings: list[str] = []

    profile_json = json.dumps(
        profile.model_dump(by_alias=True), indent=2
    )
    opinions_json = json.dumps(
        [op.model_dump(by_alias=True) for op in opinions], indent=2
    )

    user_prompt = build_debate_user_prompt(profile_json, opinions_json)

    try:
        raw = await generate_json(
            system_prompt=DEBATE_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            stage="debate",
        )

        if not isinstance(raw, list):
            raw = raw.get("debateTurns", raw.get("turns", [raw]))

        turns = _parse_turns(raw)

        # Validate: at least one respondingTo should be populated
        has_response = any(t.responding_to is not None for t in turns)
        if not has_response and len(turns) > 1:
            warnings.append(
                "Debate: no turns reference prior statements. "
                "Debate may lack genuine interaction."
            )

        return turns, warnings

    except (GeminiError, Exception) as exc:
        logger.error("Debate generation failed: %s", exc)
        warnings.append(f"Debate generation failed: {exc}")
        return _mock_debate(opinions), warnings


# ---------------------------------------------------------------------------
# Parsing
# ---------------------------------------------------------------------------


def _parse_turns(raw_list: list) -> list[DebateTurn]:
    """Parse raw JSON array into DebateTurn objects."""
    turns: list[DebateTurn] = []
    now = datetime.now(timezone.utc)

    for i, item in enumerate(raw_list):
        responding_to = None
        rt = item.get("respondingTo")
        if rt and isinstance(rt, dict):
            responding_to = RespondingTo(
                agent_id=rt.get("agentId", "technical"),
                excerpt=str(rt.get("excerpt", "")),
            )

        score_change = None
        sc = item.get("scoreChange")
        if sc and isinstance(sc, dict):
            score_change = ScoreChange(
                from_=int(sc.get("from", 0)),
                to=int(sc.get("to", 0)),
            )

        valid_stances = {"agree", "disagree", "challenge", "concede", "revise"}
        stance = item.get("stance", "challenge")
        if stance not in valid_stances:
            stance = "challenge"

        valid_agents = {"technical", "culture", "hiring_manager", "skeptic"}
        from_agent = item.get("fromAgent", "technical")
        if from_agent not in valid_agents:
            from_agent = "technical"

        turns.append(
            DebateTurn(
                id=str(item.get("id", f"turn-{i}")),
                from_agent=from_agent,
                responding_to=responding_to,
                stance=stance,
                content=str(item.get("content", "")),
                score_change=score_change,
                timestamp=item.get(
                    "timestamp", now.isoformat()
                ),
            )
        )

    return turns


# ---------------------------------------------------------------------------
# Mock fallback
# ---------------------------------------------------------------------------


def _mock_debate(opinions: list[AgentOpinion]) -> list[DebateTurn]:
    """Return minimal mock debate when Gemini fails."""
    now = datetime.now(timezone.utc).isoformat()
    return [
        DebateTurn(
            id="mock-1",
            from_agent="technical",
            responding_to=None,
            stance="challenge",
            content=(
                "⚠️ This is a fallback debate. The AI service was temporarily "
                "unavailable. Please retry for a real debate."
            ),
            score_change=None,
            timestamp=now,
        ),
        DebateTurn(
            id="mock-2",
            from_agent="skeptic",
            responding_to=RespondingTo(
                agent_id="technical",
                excerpt="fallback debate",
            ),
            stance="agree",
            content=(
                "I agree we should revisit this evaluation once the AI "
                "service is available."
            ),
            score_change=None,
            timestamp=now,
        ),
    ]
