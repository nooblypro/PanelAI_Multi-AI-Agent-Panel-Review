"""Tests for Intake file extraction, precedence, validation, and profile building."""

from __future__ import annotations

import io
import docx
import pytest
from httpx import ASGITransport, AsyncClient
from pypdf import PdfWriter

from app.main import app
from app.services.file_extractor import (
    FileExtractionError,
    UnsupportedFileTypeError,
    extract_text_from_bytes,
)
from app.services.profile_builder import (
    resolve_input_precedence,
    validate_and_normalize_inputs,
)


def create_sample_docx(text: str) -> bytes:
    """Helper to create in-memory DOCX bytes."""
    doc = docx.Document()
    doc.add_paragraph(text)
    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


def create_sample_pdf(text: str) -> bytes:
    """Helper to create in-memory PDF bytes with text."""
    # Using pypdf to create a valid minimal PDF structure
    writer = PdfWriter()
    page = writer.add_blank_page(width=300, height=300)
    # pypdf can write annotations or text metadata
    writer.add_metadata({"/Title": text, "/Subject": text})
    buf = io.BytesIO()
    writer.write(buf)
    return buf.getvalue()


class TestFileExtractionService:
    """Unit tests for file_extractor service."""

    def test_txt_extraction_utf8(self):
        content = "Senior Engineer with 5 years experience in Python and Go.".encode("utf-8")
        extracted = extract_text_from_bytes(content, "resume.txt")
        assert "Senior Engineer" in extracted

    def test_docx_extraction(self):
        docx_bytes = create_sample_docx("Led development of distributed streaming engine at ScaleCo.")
        extracted = extract_text_from_bytes(docx_bytes, "resume.docx")
        assert "Led development of distributed streaming engine" in extracted

    def test_unsupported_file_type_raises(self):
        with pytest.raises(UnsupportedFileTypeError) as exc:
            extract_text_from_bytes(b"binary data", "malware.exe")
        assert "Unsupported file type '.exe'" in str(exc.value)

    def test_corrupted_file_raises_extraction_error(self):
        with pytest.raises(FileExtractionError):
            extract_text_from_bytes(b"not a valid zip or docx file", "corrupted.docx")


class TestPrecedenceAndValidation:
    """Unit tests for input precedence and missing field detection."""

    def test_file_plus_pasted_text_uses_pasted_text(self):
        """Pasted text MUST take precedence over uploaded file text."""
        result = resolve_input_precedence(
            pasted_text="Pasted Resume Text (Source of Truth)",
            file_text="Uploaded Resume Text from PDF",
        )
        assert result == "Pasted Resume Text (Source of Truth)"

    def test_file_only_uses_file_text(self):
        result = resolve_input_precedence(
            pasted_text=None,
            file_text="Uploaded Resume Text from PDF",
        )
        assert result == "Uploaded Resume Text from PDF"

    def test_missing_fields_detection(self):
        # Missing transcript
        t, r, tr, missing = validate_and_normalize_inputs(
            target_role_text="AI Engineer",
            resume_text="Experienced engineer",
            transcript_text="",
        )
        assert "Interview Transcript" in missing
        assert len(missing) == 1

        # Missing all 3
        t, r, tr, missing = validate_and_normalize_inputs()
        assert set(missing) == {"Target Role", "Resume", "Interview Transcript"}


class TestBuildProfileEndpointCombinations:
    """Tests for all combinations of text and file inputs on POST /api/build-profile."""

    @pytest.fixture(autouse=True)
    def mock_profile_llm(self):
        """Mock LLM to return structured profile without making external network calls."""
        from unittest.mock import patch, AsyncMock

        async def _mock_generate(*args, **kwargs):
            return {
                "name": "Alex Candidate",
                "targetRole": "Software Engineer",
                "skills": [{"name": "Python", "evidence": "Experienced in Python", "source": "resume"}],
                "experience": [{"company": "TechCo", "title": "Engineer", "duration": "2020", "highlights": ["Impact"]}],
                "education": [{"school": "University", "degree": "BS"}],
                "claims": [{"text": "Built distributed systems", "source": "resume"}],
            }

        with patch("app.services.profile_builder.generate_json", side_effect=_mock_generate):
            yield

    @pytest.mark.asyncio
    async def test_comb_1_target_text_resume_text_transcript_text(self):
        """1. target text + resume text + transcript text"""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.post(
                "/api/build-profile",
                data={
                    "targetRoleText": "Backend Engineer",
                    "resumeText": "Python, FastAPI, Postgres developer with 5 years experience.",
                    "transcriptText": "Interviewer: How do you handle errors? Candidate: I use structured logging.",
                },
            )
            assert resp.status_code == 200
            data = resp.json()
            assert "profile" in data
            assert data["profile"]["targetRole"] == "Backend Engineer"

    @pytest.mark.asyncio
    async def test_comb_2_target_file_resume_file_transcript_file(self):
        """2. target file + resume file + transcript file"""
        role_docx = create_sample_docx("Target Role: Staff Infrastructure Engineer")
        resume_docx = create_sample_docx("Resume: 8 years building distributed storage systems.")
        transcript_txt = "Interviewer: Tell me about consensus. Candidate: I implemented Raft in Go.".encode("utf-8")

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.post(
                "/api/build-profile",
                files={
                    "targetRoleFile": ("role.docx", role_docx, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
                    "resumeFile": ("resume.docx", resume_docx, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
                    "transcriptFile": ("transcript.txt", transcript_txt, "text/plain"),
                },
            )
            assert resp.status_code == 200
            data = resp.json()
            assert "profile" in data
            assert "Staff Infrastructure Engineer" in data["profile"]["targetRole"]

    @pytest.mark.asyncio
    async def test_comb_3_target_file_resume_text_transcript_text(self):
        """3. target file + resume text + transcript text"""
        role_docx = create_sample_docx("Role: Principal Architect")
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.post(
                "/api/build-profile",
                data={
                    "resumeText": "Deep experience in Kafka and event-driven architecture.",
                    "transcriptText": "Discussed system trade-offs and latency.",
                },
                files={
                    "targetRoleFile": ("role.docx", role_docx, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
                },
            )
            assert resp.status_code == 200
            assert "Principal Architect" in resp.json()["profile"]["targetRole"]

    @pytest.mark.asyncio
    async def test_comb_4_target_text_resume_file_transcript_file(self):
        """4. target text + resume file + transcript file"""
        resume_txt = "Resume: 6 years at TechCo building microservices.".encode("utf-8")
        transcript_txt = "Transcript: Answered questions about on-call rotations.".encode("utf-8")

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.post(
                "/api/build-profile",
                data={"targetRoleText": "Senior DevOps Engineer"},
                files={
                    "resumeFile": ("resume.txt", resume_txt, "text/plain"),
                    "transcriptFile": ("transcript.txt", transcript_txt, "text/plain"),
                },
            )
            assert resp.status_code == 200
            assert resp.json()["profile"]["targetRole"] == "Senior DevOps Engineer"

    @pytest.mark.asyncio
    async def test_comb_5_target_file_resume_file_transcript_text(self):
        """5. target file + resume file + transcript text"""
        role_txt = "Role: Machine Learning Platform Engineer".encode("utf-8")
        resume_txt = "Resume: Built feature store and model registry.".encode("utf-8")

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.post(
                "/api/build-profile",
                data={"transcriptText": "Explained feature engineering and latency SLAs."},
                files={
                    "targetRoleFile": ("role.txt", role_txt, "text/plain"),
                    "resumeFile": ("resume.txt", resume_txt, "text/plain"),
                },
            )
            assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_comb_6_target_file_resume_text_transcript_file(self):
        """6. target file + resume text + transcript file"""
        role_txt = "Role: Security Engineer".encode("utf-8")
        transcript_txt = "Transcript: Discussed vulnerability mitigation.".encode("utf-8")

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.post(
                "/api/build-profile",
                data={"resumeText": "Implemented OAuth2 and zero-trust networking."},
                files={
                    "targetRoleFile": ("role.txt", role_txt, "text/plain"),
                    "transcriptFile": ("transcript.txt", transcript_txt, "text/plain"),
                },
            )
            assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_comb_7_target_text_resume_file_transcript_text(self):
        """7. target text + resume file + transcript text"""
        resume_txt = "Resume: Full stack React and Python developer.".encode("utf-8")

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.post(
                "/api/build-profile",
                data={
                    "targetRoleText": "Full Stack Engineer",
                    "transcriptText": "Discussed frontend state management and API integration.",
                },
                files={
                    "resumeFile": ("resume.txt", resume_txt, "text/plain"),
                },
            )
            assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_comb_8_target_text_resume_text_transcript_file(self):
        """8. target text + resume text + transcript file"""
        transcript_txt = "Transcript: Solved concurrency bug with mutex lock.".encode("utf-8")

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.post(
                "/api/build-profile",
                data={
                    "targetRoleText": "Systems Engineer",
                    "resumeText": "Low level performance tuning and C++ mastery.",
                },
                files={
                    "transcriptFile": ("transcript.txt", transcript_txt, "text/plain"),
                },
            )
            assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_precedence_in_endpoint(self):
        """17. file + pasted text uses pasted text in endpoint"""
        file_resume = "OLD RESUME FROM FILE".encode("utf-8")
        pasted_resume = "NEW EDITED RESUME IN TEXTAREA"

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.post(
                "/api/build-profile",
                data={
                    "targetRoleText": "Engineer",
                    "resumeText": pasted_resume,
                    "transcriptText": "Transcript content",
                },
                files={
                    "resumeFile": ("resume.txt", file_resume, "text/plain"),
                },
            )
            assert resp.status_code == 200
            profile = resp.json()["profile"]
            assert profile["resumeText"] == pasted_resume
            assert "OLD RESUME" not in profile["resumeText"]

    @pytest.mark.asyncio
    async def test_missing_single_field_returns_400_with_details(self):
        """9, 10, 11, 12, 13, 14: Missing input validation returns specific 400 Bad Request."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            # Missing Target Role
            resp = await client.post(
                "/api/build-profile",
                data={"resumeText": "Some resume", "transcriptText": "Some transcript"},
            )
            assert resp.status_code == 400
            assert "Missing required input(s): Target Role" in resp.json()["detail"]

            # Missing Resume
            resp = await client.post(
                "/api/build-profile",
                data={"targetRoleText": "Engineer", "transcriptText": "Some transcript"},
            )
            assert resp.status_code == 400
            assert "Missing required input(s): Resume" in resp.json()["detail"]

            # Missing Transcript
            resp = await client.post(
                "/api/build-profile",
                data={"targetRoleText": "Engineer", "resumeText": "Some resume"},
            )
            assert resp.status_code == 400
            assert "Missing required input(s): Interview Transcript" in resp.json()["detail"]

    @pytest.mark.asyncio
    async def test_unsupported_file_upload_returns_400(self):
        """15. Unsupported file type returns clear 400 error."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.post(
                "/api/build-profile",
                data={"targetRoleText": "Role", "transcriptText": "Transcript"},
                files={
                    "resumeFile": ("resume.exe", b"fake binary", "application/x-msdownload"),
                },
            )
            assert resp.status_code == 400
            assert "Unsupported file type '.exe'" in resp.json()["detail"]


class TestCORSPreflight:
    """Verification tests for CORS OPTIONS preflight."""

    @pytest.mark.asyncio
    async def test_cors_options_preflight_localhost_5173(self):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            headers = {
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            }
            resp = await client.options("/api/independent-review", headers=headers)
            assert resp.status_code == 200
            assert resp.headers.get("access-control-allow-origin") == "http://localhost:5173"

    @pytest.mark.asyncio
    async def test_cors_options_preflight_127_0_0_1_5173(self):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            headers = {
                "Origin": "http://127.0.0.1:5173",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            }
            resp = await client.options("/api/independent-review", headers=headers)
            assert resp.status_code == 200
            assert resp.headers.get("access-control-allow-origin") == "http://127.0.0.1:5173"

    @pytest.mark.asyncio
    async def test_cors_options_preflight_build_profile(self):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            headers = {
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            }
            resp = await client.options("/api/build-profile", headers=headers)
            assert resp.status_code == 200
            assert resp.headers.get("access-control-allow-origin") == "http://localhost:5173"
