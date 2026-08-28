"""Evidence validation for agent opinions.

Checks that at least one evidence quote is an exact substring of the
resume or transcript text.
"""

from __future__ import annotations

import logging

from app.schemas import AgentOpinion, CandidateProfile

logger = logging.getLogger(__name__)


def validate_evidence(
    opinion: AgentOpinion,
    profile: CandidateProfile,
) -> tuple[bool, list[str]]:
    """Validate evidence quotes against source text.

    Returns
    -------
    (is_valid, warnings)
        is_valid is True if at least one evidence quote is an exact substring
        of the corresponding source text.
        warnings is a list of warning strings for any quotes that don't match.
    """
    if not opinion.evidence:
        return False, [f"Agent {opinion.agent_id}: no evidence items provided"]

    warnings: list[str] = []
    found_exact = False

    for ev in opinion.evidence:
        source_text = (
            profile.resume_text if ev.source == "resume" else profile.transcript_text
        )
        # Case-insensitive substring match — LLMs may adjust capitalisation
        if ev.quote.lower().strip() in source_text.lower():
            found_exact = True
        else:
            warnings.append(
                f"Agent {opinion.agent_id}: quote not found in {ev.source} — "
                f'"{ev.quote[:80]}…"'
            )

    if not found_exact:
        warnings.insert(
            0,
            f"Agent {opinion.agent_id}: NO evidence quotes matched source text. "
            "Responses may contain hallucinated evidence.",
        )

    return found_exact, warnings


EVIDENCE_RETRY_INSTRUCTION = """
WARNING: Your previous response contained evidence quotes that do not appear
in the candidate's resume or transcript text.

You MUST use EXACT substrings copied from the source text.  Do not paraphrase
or invent quotes.  Re-read the resume and transcript carefully and provide
evidence that is a verbatim copy from the text.
"""
