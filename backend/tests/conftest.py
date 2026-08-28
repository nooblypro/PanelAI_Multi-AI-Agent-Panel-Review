"""Pytest fixtures for backend tests."""

from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import create_app
from app.schemas import (
    AgentOpinion,
    CandidateProfile,
    Claim,
    Education,
    Evidence,
    Experience,
    Skill,
)


@pytest.fixture
def app():
    """Create a fresh FastAPI app for testing."""
    return create_app()


@pytest.fixture
async def client(app):
    """Async HTTP test client."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac


@pytest.fixture
def sample_profile() -> CandidateProfile:
    """A realistic sample CandidateProfile for testing."""
    return CandidateProfile(
        id="test-001",
        name="Jane Doe",
        target_role="Senior Backend Engineer",
        resume_text=(
            "Jane Doe — Senior Backend Engineer\n"
            "Experience: 6 years building distributed systems at scale.\n"
            "Led migration from monolith to microservices at Acme Corp, "
            "reducing p99 latency by 40%.\n"
            "Proficient in Python, Go, PostgreSQL, Kafka, Kubernetes.\n"
            "Education: BS Computer Science, MIT, 2018.\n"
            "Open-source contributor to FastAPI and SQLAlchemy.\n"
            "Published paper on distributed consensus at SIGMOD 2022.\n"
        ),
        transcript_text=(
            "Interviewer: Tell me about a challenging project.\n"
            "Jane: At Acme Corp, we had a monolith serving 10M requests/day. "
            "I led the team of 5 engineers to decompose it into 12 microservices. "
            "The hardest part was the data migration — we had to maintain "
            "backward compatibility while moving to event-driven architecture. "
            "I designed the migration strategy and we completed it in 6 months "
            "with zero downtime.\n"
            "Interviewer: How did you handle disagreements in the team?\n"
            "Jane: We had a strong debate about whether to use Kafka or RabbitMQ. "
            "I initially pushed for RabbitMQ but my colleague made a compelling "
            "case for Kafka based on our throughput requirements. I conceded "
            "because the data supported their position, and it turned out to "
            "be the right call.\n"
        ),
        skills=[
            Skill(name="Python", evidence="Proficient in Python", source="resume"),
            Skill(name="Go", evidence="Proficient in Go", source="resume"),
            Skill(
                name="Distributed Systems",
                evidence="6 years building distributed systems at scale",
                source="resume",
            ),
        ],
        experience=[
            Experience(
                company="Acme Corp",
                title="Senior Backend Engineer",
                duration="4 years",
                highlights=[
                    "Led migration from monolith to microservices",
                    "Reduced p99 latency by 40%",
                ],
            ),
        ],
        education=[
            Education(school="MIT", degree="BS Computer Science", year="2018"),
        ],
        claims=[
            Claim(
                text="Led migration from monolith to microservices",
                source="resume",
            ),
            Claim(
                text="I led the team of 5 engineers to decompose it into 12 microservices",
                source="transcript",
            ),
        ],
        created_at="2026-08-28T10:00:00Z",
    )


@pytest.fixture
def sample_opinions(sample_profile: CandidateProfile) -> list[AgentOpinion]:
    """Sample opinions for testing debate and synthesis stages."""
    return [
        AgentOpinion(
            agent_id="technical",
            round="independent",
            score=8,
            confidence=85,
            verdict="strong_yes",
            summary="Strong technical background with demonstrated systems design.",
            evidence=[
                Evidence(
                    quote="Led migration from monolith to microservices",
                    source="resume",
                    note="Demonstrates leadership and architecture skills",
                ),
            ],
            timestamp="2026-08-28T10:01:00Z",
        ),
        AgentOpinion(
            agent_id="culture",
            round="independent",
            score=7,
            confidence=75,
            verdict="yes",
            summary="Shows good collaboration and growth mindset.",
            evidence=[
                Evidence(
                    quote="I conceded because the data supported their position",
                    source="transcript",
                    note="Demonstrates intellectual humility",
                ),
            ],
            timestamp="2026-08-28T10:01:00Z",
        ),
        AgentOpinion(
            agent_id="hiring_manager",
            round="independent",
            score=8,
            confidence=80,
            verdict="strong_yes",
            summary="Excellent fit for the role with proven impact.",
            evidence=[
                Evidence(
                    quote="reducing p99 latency by 40%",
                    source="resume",
                    note="Quantified impact",
                ),
            ],
            timestamp="2026-08-28T10:01:00Z",
        ),
        AgentOpinion(
            agent_id="skeptic",
            round="independent",
            score=6,
            confidence=60,
            verdict="lean_yes",
            summary="Solid but some claims need more evidence.",
            evidence=[
                Evidence(
                    quote="6 years building distributed systems at scale",
                    source="resume",
                    note="Claim — but only one company shown",
                ),
            ],
            timestamp="2026-08-28T10:01:00Z",
        ),
    ]
