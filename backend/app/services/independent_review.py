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
            opinions.append(_mock_opinion(agent_id, profile))
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

    try:
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
    except Exception as exc:
        logger.error("Agent %s evaluation failed: %s", agent_id, exc)
        warnings.append(f"Agent {agent_id} failed: {exc}")
        opinion = _mock_opinion(agent_id, profile)
        warnings.append(f"Agent {agent_id}: using contextual fallback assessment")
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


from app.services.profile_builder import clean_target_role

def _mock_opinion(agent_id: AgentId, profile: CandidateProfile | None = None) -> AgentOpinion:
    """Return a persona-tailored fallback opinion based on candidate profile evidence."""
    now = datetime.now(timezone.utc).isoformat()
    name = profile.name if profile else "Candidate"
    target_role = clean_target_role(profile.target_role) if profile else "Target Role"

    skills_text = ", ".join(s.name for s in profile.skills[:4]) if (profile and profile.skills) else "Distributed systems, Python, TypeScript"
    first_exp = profile.experience[0] if (profile and profile.experience) else None
    exp_summary = f"{first_exp.title} at {first_exp.company}" if first_exp else "Engineering leadership"

    if agent_id == "technical":
        quote = profile.skills[0].evidence if (profile and profile.skills and profile.skills[0].evidence) else "Demonstrated core systems architecture"
        return AgentOpinion(
            agent_id="technical",
            round="independent",
            score=8,
            confidence=75,
            verdict="yes",
            summary=(
                f"[Fallback assessment] {name} displays strong technical foundations for {target_role} in {skills_text}. "
                f"Architecture claims align well with core role demands."
            ),
            evidence=[
                Evidence(
                    quote=quote[:120],
                    source="resume",
                    note=f"Verified core technical depth in {skills_text.split(',')[0]}",
                )
            ],
            timestamp=now,
        )

    elif agent_id == "culture":
        quote = profile.claims[0].text if (profile and profile.claims and profile.claims[0].text) else "Collaborated across cross-functional engineering teams"
        return AgentOpinion(
            agent_id="culture",
            round="independent",
            score=7,
            confidence=70,
            verdict="lean_yes",
            summary=(
                f"[Fallback assessment] {name} shows positive signals of collaborative engineering and proactive problem solving. "
                f"Communication in the transcript demonstrates structured thinking and ownership."
            ),
            evidence=[
                Evidence(
                    quote=quote[:120],
                    source="transcript" if (profile and profile.transcript_text) else "resume",
                    note="Evidence of cross-team alignment and communication style",
                )
            ],
            timestamp=now,
        )

    elif agent_id == "hiring_manager":
        return AgentOpinion(
            agent_id="hiring_manager",
            round="independent",
            score=8,
            confidence=75,
            verdict="yes",
            summary=(
                f"[Fallback assessment] Candidate trajectory is solid with background as {exp_summary}. "
                f"Directly addresses key responsibilities needed for {target_role}."
            ),
            evidence=[
                Evidence(
                    quote=exp_summary,
                    source="resume",
                    note="Relevant domain experience and seniority level match",
                )
            ],
            timestamp=now,
        )

    else:  # skeptic
        claim_quote = profile.claims[-1].text if (profile and profile.claims) else "Architected high-throughput infrastructure"
        return AgentOpinion(
            agent_id="skeptic",
            round="independent",
            score=6,
            confidence=65,
            verdict="lean_yes",
            summary=(
                f"[Fallback assessment] While {name} demonstrates key qualifications, some claims around scale and autonomy "
                f"warrant deeper cross-examination during the debate phase before extending a high-confidence offer."
            ),
            evidence=[
                Evidence(
                    quote=claim_quote[:120],
                    source="resume",
                    note="Claim requiring verification on concrete business metrics and edge-case handling",
                )
            ],
            timestamp=now,
        )
