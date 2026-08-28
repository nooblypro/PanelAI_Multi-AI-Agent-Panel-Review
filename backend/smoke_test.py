"""Local smoke test script for PanelAI backend.

Uses synthetic test data to test:
- GET /health
- POST /api/independent-review
- POST /api/debate
- POST /api/synthesize

Verifies response shapes, schema validation, and graceful fallback.
"""

from __future__ import annotations

import asyncio
import json
from httpx import ASGITransport, AsyncClient

from app.main import app

SYNTHETIC_PROFILE = {
    "id": "smoke-cand-001",
    "name": "Alex Mercer",
    "targetRole": "Senior Distributed Systems Engineer",
    "resumeText": (
        "Alex Mercer — Staff Engineer\n"
        "Experience: 8 years designing fault-tolerant distributed streaming platforms.\n"
        "Architected real-time event streaming cluster processing 500k msgs/sec with Raft consensus.\n"
        "Reduced p99 latency by 35% through custom zero-copy memory buffers in Rust and C++.\n"
        "Proficient in Rust, Go, Python, Kafka, gRPC, Distributed Raft Consensus.\n"
        "Education: MS Computer Engineering, Stanford University, 2017.\n"
    ),
    "transcriptText": (
        "Interviewer: Tell me about your experience scaling consensus algorithms.\n"
        "Alex: In our Raft cluster, we noticed leader election thrashing during network partitions. "
        "I analyzed the heartbeat jitter and tuned the randomized election timeout to adapt dynamically. "
        "That stabilized the cluster and eliminated false-positive elections.\n"
        "Interviewer: How do you handle disagreements with stakeholders?\n"
        "Alex: I bring data and benchmark profiles. When the product team wanted synchronous replication "
        "across all regions, I ran latency tests showing the 200ms round-trip penalty and proposed "
        "quorum-based semi-synchronous replication instead, which satisfied both safety and SLA requirements.\n"
    ),
    "skills": [
        {"name": "Rust", "evidence": "custom zero-copy memory buffers in Rust", "source": "resume"},
        {"name": "Distributed Consensus", "evidence": "Raft consensus", "source": "resume"},
        {"name": "Performance Optimization", "evidence": "Reduced p99 latency by 35%", "source": "resume"},
    ],
    "experience": [
        {
            "company": "DataScale Systems",
            "title": "Staff Engineer",
            "duration": "4 years",
            "highlights": [
                "Architected real-time event streaming cluster processing 500k msgs/sec",
                "Reduced p99 latency by 35%",
            ],
        }
    ],
    "education": [
        {"school": "Stanford University", "degree": "MS Computer Engineering", "year": "2017"}
    ],
    "claims": [
        {"text": "Architected real-time event streaming cluster processing 500k msgs/sec", "source": "resume"},
        {"text": "tuned the randomized election timeout to adapt dynamically", "source": "transcript"},
    ],
    "createdAt": "2026-08-28T11:00:00Z",
}


async def run_smoke_test():
    print("==================================================")
    print(" Starting PanelAI Backend Local Smoke Test")
    print("==================================================")

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # 1. Health check
        print("\n[Step 1] Checking GET /health ...")
        resp = await client.get("/health")
        assert resp.status_code == 200, f"Health check failed: {resp.status_code}"
        health_data = resp.json()
        print(f"  -> Health OK: {json.dumps(health_data, indent=2)}")

        # 2. Independent Review
        print("\n[Step 2] Testing POST /api/independent-review ...")
        resp = await client.post("/api/independent-review", json=SYNTHETIC_PROFILE)
        assert resp.status_code == 200, f"Review failed ({resp.status_code}): {resp.text}"
        review_data = resp.json()
        opinions = review_data.get("opinions", [])
        print(f"  -> Received {len(opinions)} independent opinions.")
        for op in opinions:
            print(f"     • [{op['agentId'].upper()}] Score: {op['score']}/10, Verdict: {op['verdict']}, Conf: {op['confidence']}%")
            print(f"       Summary: {op['summary'][:100]}...")
            print(f"       Evidence count: {len(op.get('evidence', []))}")

        assert len(opinions) == 4, f"Expected 4 opinions, got {len(opinions)}"
        agent_ids = {op["agentId"] for op in opinions}
        assert agent_ids == {"technical", "culture", "hiring_manager", "skeptic"}

        # 3. Debate
        print("\n[Step 3] Testing POST /api/debate ...")
        debate_req = {"profile": SYNTHETIC_PROFILE, "opinions": opinions}
        resp = await client.post("/api/debate", json=debate_req)
        assert resp.status_code == 200, f"Debate failed ({resp.status_code}): {resp.text}"
        debate_data = resp.json()
        turns = debate_data.get("debateTurns", [])
        print(f"  -> Received {len(turns)} debate turns.")
        for t in turns[:3]:
            resp_info = f" (responding to {t['respondingTo']['agentId']})" if t.get("respondingTo") else ""
            print(f"     • Turn [{t['fromAgent']} / {t['stance']}{resp_info}]: {t['content'][:90]}...")

        # 4. Synthesis
        print("\n[Step 4] Testing POST /api/synthesize ...")
        synth_req = {
            "profile": SYNTHETIC_PROFILE,
            "opinions": opinions,
            "debateTurns": turns,
        }
        resp = await client.post("/api/synthesize", json=synth_req)
        assert resp.status_code == 200, f"Synthesis failed ({resp.status_code}): {resp.text}"
        synth_data = resp.json()
        decision = synth_data.get("decision", {})
        print(f"  -> Decision: {decision.get('recommendation')} (Confidence: {decision.get('confidenceLevel')}%)")
        print(f"     Reasoning: {decision.get('reasoning')[:120]}...")
        print(f"     Weight breakdown count: {len(decision.get('weightBreakdown', []))}")
        print(f"     Strengths count: {len(decision.get('strengths', []))}")
        print(f"     Concerns count: {len(decision.get('concerns', []))}")
        print(f"     Unresolved disagreements count: {len(decision.get('unresolvedDisagreements', []))}")

        assert decision.get("recommendation") in {"Strong Hire", "Hire", "Hold", "No Hire"}
        assert len(decision.get("weightBreakdown", [])) == 4

    print("\n==================================================")
    print(" ✅ ALL SMOKE TEST STEPS COMPLETED SUCCESSFULLY!")
    print("==================================================")


if __name__ == "__main__":
    asyncio.run(run_smoke_test())
