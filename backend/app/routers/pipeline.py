"""Pipeline router — endpoints for candidate profile building, review, debate, and synthesis.

POST /api/build-profile        ← multipart/form-data (files and/or text) → CandidateProfile
POST /api/independent-review   ← CandidateProfile → AgentOpinion[]
POST /api/debate               ← {profile, opinions} → DebateTurn[]
POST /api/synthesize           ← {profile, opinions, debateTurns} → FinalDecision
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from app.schemas import (
    AgentOpinion,
    CandidateProfile,
    DebateRequest,
    DebateTurn,
    EvaluateRequest,
    FinalDecision,
    SynthesizeRequest,
)
from app.services.debate import run_debate
from app.services.file_extractor import (
    FileExtractionError,
    UnsupportedFileTypeError,
    extract_text_from_upload,
)
from app.services.independent_review import run_independent_reviews
from app.services.profile_builder import (
    build_candidate_profile,
    validate_and_normalize_inputs,
)
from app.services.synthesis import synthesize_decision

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["pipeline"])


# ---------------------------------------------------------------------------
# 0. Profile Builder (Multipart / Form-Data + JSON support)
# ---------------------------------------------------------------------------


@router.post("/build-profile")
async def build_profile(
    targetRoleText: Optional[str] = Form(None),
    targetRoleFile: Optional[UploadFile] = File(None),
    resumeText: Optional[str] = Form(None),
    resumeFile: Optional[UploadFile] = File(None),
    transcriptText: Optional[str] = Form(None),
    transcriptFile: Optional[UploadFile] = File(None),
    candidateName: Optional[str] = Form(None),
) -> dict:
    """Extract files, normalize text inputs with precedence, and build CandidateProfile.

    PRECEDENCE RULE:
    If both file and text are provided for the same field, pasted text is used as the source of truth.
    """
    # 1. Extract text from uploaded files if present
    target_file_text = ""
    resume_file_text = ""
    transcript_file_text = ""

    try:
        if targetRoleFile and targetRoleFile.filename:
            target_file_text = await extract_text_from_upload(targetRoleFile)
        if resumeFile and resumeFile.filename:
            resume_file_text = await extract_text_from_upload(resumeFile)
        if transcriptFile and transcriptFile.filename:
            transcript_file_text = await extract_text_from_upload(transcriptFile)
    except (UnsupportedFileTypeError, FileExtractionError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to extract file contents: {exc}",
        ) from exc

    # 2. Normalize and check precedence (pasted text > file text)
    target_role, resume, transcript, missing = validate_and_normalize_inputs(
        target_role_text=targetRoleText,
        target_role_file_text=target_file_text,
        resume_text=resumeText,
        resume_file_text=resume_file_text,
        transcript_text=transcriptText,
        transcript_file_text=transcript_file_text,
    )

    if missing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing required input(s): {', '.join(missing)}. Please provide text or upload a file for each.",
        )

    # 3. Build candidate profile
    try:
        profile = await build_candidate_profile(
            target_role=target_role,
            resume_text=resume,
            transcript_text=transcript,
            candidate_name=candidateName,
        )
        return {"profile": profile.model_dump(by_alias=True)}
    except Exception as exc:
        logger.exception("Candidate profile building failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Profile construction failed: {exc}",
        ) from exc


@router.post("/build-profile-json")
async def build_profile_json(request: EvaluateRequest) -> dict:
    """Alternative JSON endpoint for building profile from raw text strings."""
    target_role, resume, transcript, missing = validate_and_normalize_inputs(
        target_role_text=request.target_role,
        resume_text=request.resume_text,
        transcript_text=request.transcript_text,
    )

    if missing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing required input(s): {', '.join(missing)}",
        )

    try:
        profile = await build_candidate_profile(
            target_role=target_role,
            resume_text=resume,
            transcript_text=transcript,
            candidate_name=request.candidate_name,
        )
        return {"profile": profile.model_dump(by_alias=True)}
    except Exception as exc:
        logger.exception("Candidate profile building from JSON failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Profile construction failed: {exc}",
        ) from exc


# ---------------------------------------------------------------------------
# 1. Independent Review
# ---------------------------------------------------------------------------


@router.post("/independent-review")
async def independent_review(profile: CandidateProfile) -> dict:
    """Run 4 independent agent evaluations in parallel.

    Request body: CandidateProfile (JSON, camelCase).
    Response: { opinions: AgentOpinion[], warnings?: string[] }
    """
    try:
        opinions, warnings = await run_independent_reviews(profile)
    except Exception as exc:
        logger.exception("Independent review failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
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
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
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
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Synthesis failed: {exc}",
        ) from exc

    result: dict = {
        "decision": decision.model_dump(by_alias=True),
    }
    if warnings:
        result["warnings"] = warnings

    return result
