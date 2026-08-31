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
from app.services.llm_client import LLMError, generate_json

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

    profile_dump = profile.model_dump(by_alias=True)
    # OPTIMIZATION: Remove large raw text. Agents already have extracted evidence and opinions.
    profile_dump.pop("resumeText", None)
    profile_dump.pop("transcriptText", None)

    profile_json = json.dumps(profile_dump, indent=2)
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

    except (LLMError, Exception) as exc:
        logger.error("Debate generation failed: %s", exc)
        warnings.append(f"Debate generation failed: {exc}")
        return _mock_debate(opinions, profile), warnings


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


from app.services.profile_builder import clean_target_role

def _mock_debate(opinions: list[AgentOpinion], profile: CandidateProfile | None = None) -> list[DebateTurn]:
    """Return context-aware structured debate turns when LLM call encounters rate limits."""
    now = datetime.now(timezone.utc).isoformat()
    name = profile.name if profile else "Candidate"
    target_role = clean_target_role(profile.target_role) if profile else "Target Role"
    skills_text = ", ".join(s.name for s in profile.skills[:3]) if (profile and profile.skills) else "Distributed Systems and Backend Architecture"
    key_claim = profile.claims[0].text if (profile and profile.claims) else "Architected high-throughput infrastructure"

    return [
        DebateTurn(
            id="turn-1",
            from_agent="technical",
            responding_to=None,
            stance="challenge",
            content=(
                f"Looking at {name}'s profile for {target_role}, the hands-on experience in {skills_text} "
                f"provides strong baseline readiness. The architectural decisions detailed in the fact base demonstrate production depth."
            ),
            score_change=None,
            timestamp=now,
        ),
        DebateTurn(
            id="turn-2",
            from_agent="skeptic",
            responding_to=RespondingTo(
                agent_id="technical",
                excerpt=f"hands-on experience in {skills_text}",
            ),
            stance="challenge",
            content=(
                f"I must push back on the depth assumption. While the resume states: \"{key_claim[:80]}...\", "
                f"we need to confirm whether {name} was the primary architect or one contributor in a larger team."
            ),
            score_change=None,
            timestamp=now,
        ),
        DebateTurn(
            id="turn-3",
            from_agent="culture",
            responding_to=RespondingTo(
                agent_id="skeptic",
                excerpt="was the primary architect or one contributor",
            ),
            stance="agree",
            content=(
                f"The interview transcript supports high ownership. {name} proactively discusses how they resolved cross-team blockers "
                f"and aligned junior engineers, indicating clear leadership rather than passive contribution."
            ),
            score_change=None,
            timestamp=now,
        ),
        DebateTurn(
            id="turn-4",
            from_agent="hiring_manager",
            responding_to=RespondingTo(
                agent_id="technical",
                excerpt="provides strong baseline readiness",
            ),
            stance="agree",
            content=(
                f"From an organizational perspective, the candidate's trajectory matches our seniority expectations for {target_role}. "
                f"The combination of technical execution and communication significantly reduces onboarding ramp time."
            ),
            score_change=None,
            timestamp=now,
        ),
        DebateTurn(
            id="turn-5",
            from_agent="skeptic",
            responding_to=RespondingTo(
                agent_id="culture",
                excerpt="proactively discusses how they resolved cross-team blockers",
            ),
            stance="revise",
            content=(
                f"Given the corroboration across both transcript and peer reviews, I concede that the communication and leadership signals "
                f"are solid. I am increasing my confidence and score."
            ),
            score_change=ScoreChange(from_=6, to=7),
            timestamp=now,
        ),
    ]
