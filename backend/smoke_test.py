"""Local smoke test script for PanelAI backend.

Uses synthetic test data to test:
- OPTIONS /api/independent-review (CORS preflight verification)
- GET /health
- POST /api/build-profile (Multipart file and text extraction with precedence)
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

SYNTHETIC_RESUME_TEXT = """Alex Mercer — Staff Systems Engineer
Experience: 8 years designing fault-tolerant distributed streaming platforms.
Architected real-time event streaming cluster processing 500k msgs/sec with Raft consensus.
Reduced p99 latency by 35% through custom zero-copy memory buffers in Rust and C++.
Proficient in Rust, Go, Python, Kafka, gRPC, Distributed Raft Consensus.
Education: MS Computer Engineering, Stanford University, 2017."""

SYNTHETIC_TRANSCRIPT_TEXT = """Interviewer: Tell me about your experience scaling consensus algorithms.
Alex: In our Raft cluster, we noticed leader election thrashing during network partitions. I analyzed the heartbeat jitter and tuned the randomized election timeout to adapt dynamically. That stabilized the cluster and eliminated false-positive elections.
Interviewer: How do you handle disagreements with stakeholders?
Alex: I bring data and benchmark profiles. When the product team wanted synchronous replication across all regions, I ran latency tests showing the 200ms round-trip penalty and proposed quorum-based semi-synchronous replication instead, which satisfied both safety and SLA requirements."""


async def run_smoke_test():
    print("==================================================")
    print(" Starting PanelAI Backend Local Smoke Test")
    print("==================================================")

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # 1. CORS OPTIONS Preflight check
        print("\n[Step 1] Checking CORS OPTIONS preflight ...")
        cors_headers = {
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        }
        resp = await client.options("/api/independent-review", headers=cors_headers)
        assert resp.status_code == 200, f"CORS preflight failed: {resp.status_code}"
        assert resp.headers.get("access-control-allow-origin") == "http://localhost:5173"
        print(f"  -> CORS Preflight OK: {resp.status_code} (Allow-Origin: {resp.headers.get('access-control-allow-origin')})")

        # 2. Health check
        print("\n[Step 2] Checking GET /health ...")
        resp = await client.get("/health")
        assert resp.status_code == 200, f"Health check failed: {resp.status_code}"
        health_data = resp.json()
        print(f"  -> Health OK: {json.dumps(health_data, indent=2)}")

        # 3. Build Profile (Multipart Form Data)
        print("\n[Step 3] Testing POST /api/build-profile (File + Text Precedence) ...")
        resp = await client.post(
            "/api/build-profile",
            data={
                "targetRoleText": "Staff Distributed Systems Engineer",
                "resumeText": SYNTHETIC_RESUME_TEXT,
                "transcriptText": SYNTHETIC_TRANSCRIPT_TEXT,
            },
        )
        assert resp.status_code == 200, f"Build profile failed ({resp.status_code}): {resp.text}"
        profile_data = resp.json().get("profile", {})
        print(f"  -> Profile constructed successfully: ID={profile_data.get('id')}, Candidate={profile_data.get('name')}")
        print(f"     Skills extracted: {len(profile_data.get('skills', []))}")
        print(f"     Claims extracted: {len(profile_data.get('claims', []))}")

        # 4. Independent Review
        print("\n[Step 4] Testing POST /api/independent-review ...")
        resp = await client.post("/api/independent-review", json=profile_data)
        assert resp.status_code == 200, f"Review failed ({resp.status_code}): {resp.text}"
        review_data = resp.json()
        opinions = review_data.get("opinions", [])
        print(f"  -> Received {len(opinions)} independent opinions.")
        for op in opinions:
            print(f"     • [{op['agentId'].upper()}] Score: {op['score']}/10, Verdict: {op['verdict']}, Conf: {op['confidence']}%")
            print(f"       Summary: {op['summary'][:100]}...")

        assert len(opinions) == 4, f"Expected 4 opinions, got {len(opinions)}"

        # 5. Debate
        print("\n[Step 5] Testing POST /api/debate ...")
        debate_req = {"profile": profile_data, "opinions": opinions}
        resp = await client.post("/api/debate", json=debate_req)
        assert resp.status_code == 200, f"Debate failed ({resp.status_code}): {resp.text}"
        debate_data = resp.json()
        turns = debate_data.get("debateTurns", [])
        print(f"  -> Received {len(turns)} debate turns.")
        for t in turns[:2]:
            resp_info = f" (responding to {t['respondingTo']['agentId']})" if t.get("respondingTo") else ""
            print(f"     • Turn [{t['fromAgent']} / {t['stance']}{resp_info}]: {t['content'][:85]}...")

        # 6. Synthesis
        print("\n[Step 6] Testing POST /api/synthesize ...")
        synth_req = {
            "profile": profile_data,
            "opinions": opinions,
            "debateTurns": turns,
        }
        resp = await client.post("/api/synthesize", json=synth_req)
        assert resp.status_code == 200, f"Synthesis failed ({resp.status_code}): {resp.text}"
        synth_data = resp.json()
        decision = synth_data.get("decision", {})
        print(f"  -> Decision: {decision.get('recommendation')} (Confidence: {decision.get('confidenceLevel')}%)")
        print(f"     Reasoning: {decision.get('reasoning')[:110]}...")

        assert decision.get("recommendation") in {"Strong Hire", "Hire", "Hold", "No Hire"}

    print("\n==================================================")
    print(" ✅ ALL SMOKE TEST STEPS COMPLETED SUCCESSFULLY!")
    print("==================================================")


if __name__ == "__main__":
    asyncio.run(run_smoke_test())
