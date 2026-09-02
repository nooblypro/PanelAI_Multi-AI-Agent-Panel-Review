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


def clean_target_role(raw: str) -> str:
    """Extract a concise, clean target role title from job description text or headers."""
    if not raw or not raw.strip():
        return "Target Role"
    text = raw.strip()

    # 1. Match explicit markers like 'Job Description:', 'Role:', 'Position:', 'Title:'
    match = re.search(
        r"(?:Job Description|Target Role|Role|Position|Title)\s*[:—\-]\s*([^\n\r·]+)",
        text,
        re.IGNORECASE,
    )
    if match:
        candidate = match.group(1).strip()
    else:
        # 2. Take first non-empty line
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        candidate = lines[0] if lines else "Target Role"

    # Remove company trailer or separator if on same line (e.g. 'Company: Cargonet AI' or 'at Cargonet' or '·')
    candidate = re.split(
        r"\s*(?:Company\s*[:—\-]|\bat\b|·|\bAbout the\b)",
        candidate,
        flags=re.IGNORECASE,
    )[0].strip()

    # Clean up trailing punctuation or dashes
    candidate = re.sub(r"[\s:—\-,.]+$", "", candidate).strip()

    # Cap length at 50 characters cleanly
    if len(candidate) > 50:
        parts = candidate[:47].rsplit(" ", 1)
        candidate = (parts[0] if len(parts) > 1 else candidate[:47]) + "..."

    return candidate or "Target Role"


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

    if not claims:
        # Fallback to extracting non-empty lines from user input verbatim as claims
        for line in (resume_text.splitlines() + transcript_text.splitlines()):
            line_clean = line.strip()
            if line_clean and len(line_clean) > 3 and not line_clean.lower().startswith(("http", "email", "phone")):
                src = "transcript" if line in transcript_text else "resume"
                claims.append(Claim(text=line_clean[:150], source=src))
                if len(claims) >= 4:
                    break
        if not claims and (resume_text.strip() or transcript_text.strip()):
            src_text = resume_text.strip() or transcript_text.strip()
            claims.append(Claim(text=src_text[:150], source="resume" if resume_text.strip() else "transcript"))

    if not education:
        # Check if user mentioned education status in resume (e.g. 12th, college dropout)
        resume_lower = resume_text.lower()
        if "failed college" in resume_lower or "dropped out" in resume_lower:
            education.append(Education(school="College", degree="Incomplete (Failed)"))
        if "12th" in resume_lower or "high school" in resume_lower:
            education.append(Education(school="High School", degree="12th Grade"))

    clean_role = clean_target_role(target_role) if (target_role and target_role.strip()) else clean_target_role(raw.get("targetRole"))

    return CandidateProfile(
        id=profile_id,
        name=name,
        target_role=clean_role,
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
    clean_role = clean_target_role(target_role)

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
        # Verbatim fallback from candidate lines
        for line in (resume_text.splitlines() + transcript_text.splitlines()):
            line_clean = line.strip()
            if line_clean and len(line_clean) > 3 and not line_clean.lower().startswith(("http", "email", "phone")):
                src = "transcript" if line in transcript_text else "resume"
                claims.append(Claim(text=line_clean[:150], source=src))
                if len(claims) >= 4:
                    break
        if not claims and (resume_text.strip() or transcript_text.strip()):
            src_text = resume_text.strip() or transcript_text.strip()
            claims.append(Claim(text=src_text[:150], source="resume" if resume_text.strip() else "transcript"))

    # Experience heuristic: only if candidate mentions career keywords
    experience: list[Experience] = []
    exp_indicators = ["engineer", "developer", "lead", "architect", "manager", "intern", "worked at", "employment", "experience", "company"]
    if any(ind in resume_lower for ind in exp_indicators) and len(resume_text.strip()) > 60:
        experience.append(
            Experience(
                company="Recent Employer",
                title=clean_role.split("—")[0].strip() or "Engineer",
                duration="Recent",
                highlights=["Demonstrated contributions in role"],
            )
        )

    # Education heuristic
    education: list[Education] = []
    if "failed college" in resume_lower or "dropped out" in resume_lower:
        education.append(Education(school="College", degree="Incomplete (Failed)"))
    if "12th" in resume_lower or "high school" in resume_lower:
        education.append(Education(school="High School", degree="12th Grade"))
    elif any(term in resume_lower for term in ["bachelor", "master", "phd", "b.tech", "btech", "degree", "university"]):
        education.append(Education(school="University", degree="Bachelor of Science"))

    return CandidateProfile(
        id=profile_id,
        name=name,
        target_role=clean_role,
        resume_text=resume_text,
        transcript_text=transcript_text,
        skills=skills[:12],
        experience=experience,
        education=education,
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
