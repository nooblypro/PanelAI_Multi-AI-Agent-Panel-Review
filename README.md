# PanelAI — Multi-Agent Deliberative Hiring Committee

> An evidence-grounded multi-agent hiring committee that independently evaluates candidates, cross-examines findings through structured debate, and produces an auditable hiring verdict.

---

## 🏗️ 5-Stage Deliberation Pipeline

```
┌─────────────────────────┐
│ 1. Document Intake      │  PDF / DOCX / TXT Parsing & Text Precedence
└────────────┬────────────┘
             ▼
┌─────────────────────────┐
│ 2. Fact-Base Profile    │  Zero-Hallucination Extraction with Evidence Quotes
└────────────┬────────────┘
             ▼
┌─────────────────────────┐  4 Isolated Evaluators (Parallel asyncio)
│ 3. Independent Review   │  • Technical  • HR/Culture  • Hiring Manager  • Skeptic
└────────────┬────────────┘
             ▼
┌─────────────────────────┐
│ 4. Debate Arena         │  Multi-Turn Cross-Examination (Challenge ⇄ Defend ⇄ Revise)
└────────────┬────────────┘
             ▼
┌─────────────────────────┐
│ 5. Mathematical Synthesis│ 5-Criteria Weighted Scoring Rubric & Verdict
└─────────────────────────┘
```

---

## 👥 Evaluator Personas

- **Technical Evaluator:** Systems architecture, CS fundamentals, algorithmic depth, & code quality.
- **HR & Culture Evaluator:** Communication, collaboration evidence, & professional maturity.
- **Hiring Manager:** Role alignment, delivery track record, & operational readiness.
- **Skeptic / Auditor:** Adversarial auditor that stress-tests claims & catches resume contradictions.

---

## 📊 Evaluation Rubric

| Criterion | Weight | Focus |
|---|:---:|---|
| **Technical Ability** | 30% | Architecture, algorithms, & code quality |
| **Agentic AI / LLM Experience** | 30% | Tool-calling, multi-agent workflows |
| **Production Engineering** | 20% | Scalability, SLAs, & outage remediation |
| **Problem Solving** | 10% | Root-cause breakdown & trade-offs |
| **Communication & Collaboration** | 10% | Cross-functional alignment |

---

## ⚡ Quickstart

### 1. Backend (FastAPI + Python)
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env  # Configure OPENROUTER_API_KEY or GEMINI_API_KEY
uvicorn app.main:app --port 8000 --reload
```

### 2. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

### 3. Run Tests
```bash
cd backend && ./.venv/bin/pytest -v
```
