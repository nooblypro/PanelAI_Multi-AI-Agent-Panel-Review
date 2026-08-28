"""Independent review service — the INDEPENDENCE BOUNDARY.

Each of the 4 agent calls receives ONLY:
- The CandidateProfile
- Its own persona system prompt

Each agent call DOES NOT receive:
- Any other agent's AgentOpinion
- Any other agent's score, verdict, or reasoning

This is enforced structurally: ``_run_single_agent`` takes only a profile
and an agent_id.  There is no parameter through which another agent's output
could leak.
"""

from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime, timezone

from app.prompts.personas import get_persona_prompt
from app.schemas import AgentId, AgentOpinion, CandidateProfile, Evidence
from app.services.llm_client import LLMError, generate_json
from app.validation import EVIDENCE_RETRY_INSTRUCTION, validate_evidence

logger = logging.getLogger(__name__)

# The four agent IDs — typed as a sequence for iteration
AGENT_IDS: list[AgentId] = ["technical", "culture", "hiring_manager", "skeptic"]


async def run_independent_reviews(
    profile: CandidateProfile,
) -> tuple[list[AgentOpinion], list[str]]:
    """Run 4 independent agent evaluations in parallel.

    Returns
    -------
    (opinions, warnings)
        opinions — list of 4 AgentOpinion objects
        warnings — accumulated validation warnings
    """
    tasks = [_run_single_agent(agent_id, profile) for agent_id in AGENT_IDS]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    opinions: list[AgentOpinion] = []
    warnings: list[str] = []

    for agent_id, result in zip(AGENT_IDS, results):
        if isinstance(result, Exception):
            logger.error("Agent %s failed: %s", agent_id, result)
            warnings.append(f"Agent {agent_id} failed: {result}")
            opinions.append(_mock_opinion(agent_id))
            warnings.append(f"Agent {agent_id}: using mock fallback due to failure")
        else:
            opinion, agent_warnings = result
            opinions.append(opinion)
            warnings.extend(agent_warnings)

    return opinions, warnings


# ---------------------------------------------------------------------------
# Single-agent call — the isolation boundary
# ---------------------------------------------------------------------------


async def _run_single_agent(
    agent_id: AgentId,
    profile: CandidateProfile,
) -> tuple[AgentOpinion, list[str]]:
    """Evaluate one agent independently.

    Parameters
    ----------
    agent_id : AgentId
        Which persona to use.
    profile : CandidateProfile
        The candidate data — the ONLY context this agent receives.

    Note: there is no parameter for other agents' opinions.  This is the
    architectural guarantee of independence.
    """
    system_prompt = get_persona_prompt(agent_id)
    user_prompt = _build_user_prompt(profile)
    warnings: list[str] = []

    raw = await generate_json(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        stage="independent_review",
        agent_id=agent_id,
    )

    opinion = _parse_opinion(agent_id, raw)

    # Evidence validation — check substring match and collect warnings without slow blocking retry
    _, ev_warnings = validate_evidence(opinion, profile)
    warnings.extend(ev_warnings)

    return opinion, warnings


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _build_user_prompt(profile: CandidateProfile) -> str:
    """Build the user message for an independent evaluation."""
    profile_data = profile.model_dump(by_alias=True)
    profile_data.pop("resumeText", None)
    profile_data.pop("transcriptText", None)
    return f"""Evaluate this candidate for the target role below.

<candidate_target_role>
{profile.target_role}
</candidate_target_role>

CANDIDATE NAME: {profile.name}

<candidate_resume>
{profile.resume_text}
</candidate_resume>

<candidate_transcript>
{profile.transcript_text}
</candidate_transcript>

<extracted_profile_data>
{json.dumps(profile_data, indent=2)}
</extracted_profile_data>

Provide your independent evaluation as a JSON object following the schema and evidence rules in your system instructions."""


def _parse_opinion(agent_id: AgentId, raw: dict) -> AgentOpinion:
    """Parse raw JSON into an AgentOpinion, with defensive defaults."""
    now = datetime.now(timezone.utc).isoformat()

    evidence_list = []
    for ev in raw.get("evidence", []):
        evidence_list.append(
            Evidence(
                quote=str(ev.get("quote", "")),
                source=ev.get("source", "resume"),
                note=str(ev.get("note", "")),
            )
        )

    return AgentOpinion(
        agent_id=agent_id,
        round="independent",
        score=_clamp(int(raw.get("score", 5)), 1, 10),
        confidence=_clamp(int(raw.get("confidence", 50)), 0, 100),
        verdict=_safe_verdict(raw.get("verdict", "lean_yes")),
        summary=str(raw.get("summary", "No summary provided.")),
        evidence=evidence_list,
        timestamp=now,
    )


def _safe_verdict(v: str) -> str:
    """Ensure the verdict is one of the allowed values."""
    allowed = {"strong_yes", "yes", "lean_yes", "lean_no", "no", "strong_no"}
    return v if v in allowed else "lean_yes"


def _clamp(value: int, lo: int, hi: int) -> int:
    return max(lo, min(hi, value))


def _mock_opinion(agent_id: AgentId) -> AgentOpinion:
    """Return a fallback mock opinion when LLM fails."""
    now = datetime.now(timezone.utc).isoformat()
    return AgentOpinion(
        agent_id=agent_id,
        round="independent",
        score=5,
        confidence=30,
        verdict="lean_yes",
        summary=(
            "⚠️ This is a fallback response. The AI evaluation service "
            "was temporarily unavailable. Please retry for a real assessment."
        ),
        evidence=[
            Evidence(
                quote="[evaluation unavailable]",
                source="resume",
                note="Fallback: AI evaluation service call failed",
            )
        ],
        timestamp=now,
    )
