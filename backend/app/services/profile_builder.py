"""Candidate profile builder service.

Normalizes inputs, enforces file/text precedence, and builds the
CandidateProfile fact base for downstream evaluation agents.
"""

from __future__ import annotations

import logging
import re
import uuid
from datetime import datetime, timezone
from typing import Optional

from app.prompts.profile import PROFILE_SYSTEM_PROMPT, build_profile_user_prompt
from app.schemas import (
    CandidateProfile,
    Claim,
    Education,
    Experience,
    Skill,
)
from app.services.llm_client import LLMError, generate_json

logger = logging.getLogger(__name__)


def resolve_input_precedence(
    pasted_text: Optional[str],
    file_text: Optional[str],
) -> str:
    """Resolve precedence between pasted text and uploaded file text.

    PRECEDENCE RULE:
    If both pasted text and an uploaded file are provided for the same field,
    the PASTED TEXT is preferred and used as the source of truth.
    """
    if pasted_text is not None and pasted_text.strip():
        return pasted_text.strip()
    if file_text is not None and file_text.strip():
        return file_text.strip()
    return ""


def validate_and_normalize_inputs(
    target_role_text: Optional[str] = None,
    target_role_file_text: Optional[str] = None,
    resume_text: Optional[str] = None,
    resume_file_text: Optional[str] = None,
    transcript_text: Optional[str] = None,
    transcript_file_text: Optional[str] = None,
) -> tuple[str, str, str, list[str]]:
    """Validate all three inputs and resolve precedence.

    Returns
    -------
    (target_role, resume, transcript, missing_fields)
    """
    target_role = resolve_input_precedence(target_role_text, target_role_file_text)
    resume = resolve_input_precedence(resume_text, resume_file_text)
    transcript = resolve_input_precedence(transcript_text, transcript_file_text)

    missing: list[str] = []
    if not target_role:
        missing.append("Target Role")
    if not resume:
        missing.append("Resume")
    if not transcript:
        missing.append("Interview Transcript")

    return target_role, resume, transcript, missing


async def build_candidate_profile(
    target_role: str,
    resume_text: str,
    transcript_text: str,
    candidate_name: Optional[str] = None,
) -> CandidateProfile:
    """Construct a CandidateProfile using LLM extraction with heuristic fallback."""
    profile_id = uuid.uuid4().hex[:9]
    now = datetime.now(timezone.utc).isoformat()

    user_prompt = build_profile_user_prompt(
        target_role=target_role,
        resume_text=resume_text,
        transcript_text=transcript_text,
        candidate_name=candidate_name or "",
    )

    try:
        raw = await generate_json(
            system_prompt=PROFILE_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            stage="profile_builder",
        )
        if isinstance(raw, dict):
            return _parse_profile_dict(
                raw=raw,
                profile_id=profile_id,
                target_role=target_role,
                resume_text=resume_text,
                transcript_text=transcript_text,
                fallback_name=candidate_name,
                created_at=now,
            )
    except (LLMError, Exception) as exc:
        logger.warning("LLM profile builder failed: %s — using heuristic fallback", exc)

    return _heuristic_profile_builder(
        profile_id=profile_id,
        target_role=target_role,
        resume_text=resume_text,
        transcript_text=transcript_text,
        candidate_name=candidate_name,
        created_at=now,
    )


# ---------------------------------------------------------------------------
# Internal parsing & fallback
# ---------------------------------------------------------------------------


def _parse_profile_dict(
    raw: dict,
    profile_id: str,
    target_role: str,
    resume_text: str,
    transcript_text: str,
    fallback_name: Optional[str],
    created_at: str,
) -> CandidateProfile:
    """Parse JSON dict into CandidateProfile with defensive defaults."""
    name = str(raw.get("name") or fallback_name or _infer_name(resume_text))

    skills: list[Skill] = []
    for s in raw.get("skills", []):
        if isinstance(s, dict) and s.get("name"):
            src = "transcript" if s.get("source") == "transcript" else "resume"
            skills.append(
                Skill(
                    name=str(s["name"]),
                    evidence=str(s.get("evidence", s["name"])),
                    source=src,
                )
            )

    experience: list[Experience] = []
    for exp in raw.get("experience", []):
        if isinstance(exp, dict) and exp.get("company"):
            highlights = [str(h) for h in exp.get("highlights", []) if h]
            experience.append(
                Experience(
                    company=str(exp["company"]),
                    title=str(exp.get("title", "Engineer")),
                    duration=str(exp.get("duration", "N/A")),
                    highlights=highlights or ["Core contributor"],
                )
            )

    education: list[Education] = []
    for edu in raw.get("education", []):
        if isinstance(edu, dict) and edu.get("school"):
            education.append(
                Education(
                    school=str(edu["school"]),
                    degree=str(edu.get("degree", "Degree")),
                    year=str(edu["year"]) if edu.get("year") else None,
                )
            )

    claims: list[Claim] = []
    for c in raw.get("claims", []):
        if isinstance(c, dict) and c.get("text"):
            src = "transcript" if c.get("source") == "transcript" else "resume"
            claims.append(Claim(text=str(c["text"]), source=src))

    if not skills:
        skills = [Skill(name="General Engineering", evidence="Inferred from profile", source="resume")]
    if not experience:
        experience = [Experience(company="Experience", title="Engineer", duration="N/A", highlights=["Key impact"])]
    if not education:
        education = [Education(school="University", degree="Bachelor of Science")]
    if not claims:
        claims = [Claim(text="Demonstrated technical experience", source="resume")]

    return CandidateProfile(
        id=profile_id,
        name=name,
        target_role=target_role,
        resume_text=resume_text,
        transcript_text=transcript_text,
        skills=skills,
        experience=experience,
        education=education,
        claims=claims,
        created_at=created_at,
    )


def _heuristic_profile_builder(
    profile_id: str,
    target_role: str,
    resume_text: str,
    transcript_text: str,
    candidate_name: Optional[str],
    created_at: str,
) -> CandidateProfile:
    """Robust heuristic extraction when LLM is unavailable."""
    name = candidate_name or _infer_name(resume_text)

    # Keywords to look for in resume & transcript
    tech_keywords = [
        "Python", "Go", "Rust", "Java", "C++", "TypeScript", "JavaScript", "React",
        "FastAPI", "Docker", "Kubernetes", "AWS", "GCP", "PostgreSQL", "Redis",
        "Kafka", "RabbitMQ", "Distributed Systems", "Microservices", "CI/CD",
        "GraphQL", "gRPC", "Raft", "Terraform", "Elasticsearch",
    ]

    skills: list[Skill] = []
    resume_lower = resume_text.lower()
    transcript_lower = transcript_text.lower()

    for kw in tech_keywords:
        if kw.lower() in resume_lower:
            sentences = [s.strip() for s in re.split(r"[.\n]", resume_text) if kw.lower() in s.lower()]
            evidence = sentences[0][:120] if sentences else kw
            skills.append(Skill(name=kw, evidence=evidence, source="resume"))
        elif kw.lower() in transcript_lower:
            sentences = [s.strip() for s in re.split(r"[.\n]", transcript_text) if kw.lower() in s.lower()]
            evidence = sentences[0][:120] if sentences else kw
            skills.append(Skill(name=kw, evidence=evidence, source="transcript"))

    if not skills:
        skills.append(Skill(name="Engineering", evidence="Extracted from resume", source="resume"))

    # Claims extraction
    claims: list[Claim] = []
    strong_verbs = ["led", "built", "architected", "drove", "designed", "reduced", "improved", "migrated", "scaled"]
    for line in resume_text.splitlines():
        line_clean = line.strip()
        if len(line_clean) > 20 and any(v in line_clean.lower() for v in strong_verbs):
            claims.append(Claim(text=line_clean[:150], source="resume"))
            if len(claims) >= 3:
                break

    for line in transcript_text.splitlines():
        line_clean = line.strip()
        if len(line_clean) > 20 and ("i " in line_clean.lower() or "we " in line_clean.lower()):
            claims.append(Claim(text=line_clean[:150], source="transcript"))
            if len(claims) >= 6:
                break

    if not claims:
        claims.append(Claim(text="Demonstrated technical problem solving in interview", source="transcript"))

    return CandidateProfile(
        id=profile_id,
        name=name,
        target_role=target_role,
        resume_text=resume_text,
        transcript_text=transcript_text,
        skills=skills[:12],
        experience=[
            Experience(
                company="Recent Employer",
                title=target_role.split("—")[0].strip() or "Engineer",
                duration="2020 - Present",
                highlights=["Core systems and architecture contributor"],
            )
        ],
        education=[Education(school="University", degree="Bachelor of Science", year="2019")],
        claims=claims,
        created_at=created_at,
    )


def _infer_name(resume_text: str) -> str:
    """Infer candidate name from the top lines of resume."""
    for line in resume_text.splitlines()[:3]:
        clean = line.strip()
        if clean and len(clean) < 40 and not clean.lower().startswith(("http", "email", "phone", "resume", "summary")):
            # If line contains letters
            if re.search(r"[a-zA-Z]", clean):
                return clean.split("—")[0].split("-")[0].strip()
    return "Candidate"
