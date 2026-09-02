# PanelAI — Multi-Agent Deliberative Hiring Committee

[![Backend Tests](https://img.shields.io/badge/Backend%20Tests-95%2F95%20Passing-brightgreen.svg)](file:///Users/shriram/Documents/Projects/Promptwars/backend)
[![Frontend Build](https://img.shields.io/badge/Frontend-Vite%20%7C%20React%2018%20%7C%20TS-blue.svg)](file:///Users/shriram/Documents/Projects/Promptwars/frontend)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Pydantic%20v2-009688.svg)](file:///Users/shriram/Documents/Projects/Promptwars/backend)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

> **An evidence-grounded, adversarial multi-agent hiring committee that independently evaluates candidates, cross-examines conclusions through structured debate, and produces an auditable, mathematically consistent hiring verdict.**

---

## The Problem: Why Single-Prompt AI Screening Fails

Most conventional AI recruiting tools follow a simplistic pipeline:
```
Resume + Job Description ──► Single LLM Prompt ──► Generic Score & Summary
```

This naive approach introduces critical failure modes in hiring workflows:
- **Hallucinated Qualifications:** Models invent unmentioned projects, degrees, or proficiencies to fill narrative gaps.
- **Sycophancy & Tone Bias:** Well-formatted, buzzword-heavy resumes receive high scores, while concise or unconventional candidates are misjudged.
- **Evaluation Drift:** Without a shared factual anchor, the model drifts away from core job description requirements.
- **Opaque Averaging:** Subjective scoring without an inspectable mathematical rubric or verifiable evidence quotes.

**PanelAI** treats candidate evaluation as a **structured deliberation problem** rather than a single classification call. It separates intake, factual extraction, independent evaluation, adversarial cross-examination, and mathematical synthesis into distinct, auditable stages.

---

## System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│  STAGE 1: DOCUMENT INTAKE & NORMALIZATION                              │
│  Target Role  •  Resume  •  Interview Transcript                       │
│  PDF, DOCX, TXT parsing  •  Precedence: Pasted text overrides file     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  STAGE 2: CANDIDATE FACT-BASE PROFILE                                  │
│  Zero-Hallucination Extraction  •  Verbatim Evidence Quotes            │
│  Skills  •  Experience Timeline  •  Education  •  Auditable Claims     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
           ┌────────────────────────┼────────────────────────┐
           ▼                        ▼                        ▼
    ┌──────────────┐         ┌──────────────┐         ┌──────────────┐
    │  Technical   │         │ HR / Culture │         │Hiring Manager│
    │  Evaluator   │         │  Evaluator   │         │  Evaluator   │
    └──────┬───────┘         └──────┬───────┘         └──────┬───────┘
           │                        │                        │
           └────────────────────────┼────────────────────────┘
                                    ▼
                             ┌──────────────┐
                             │Skeptic Agent │ (Adversarial Auditor)
                             └──────┬───────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  STAGE 3: STRICTLY INDEPENDENT REVIEW                                  │
│  Parallel execution via asyncio.gather()                               │
│  Architectural isolation: Evaluators NEVER see peer scores/verdicts   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  STAGE 4: ADVERSARIAL DEBATE ARENA                                     │
│  Multi-Turn Cross-Examination: Challenge ⇄ Defend ⇄ Revise            │
│  Agents defend assessments, identify discrepancies & adjust scores     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  STAGE 5: AUDITABLE MATHEMATICAL SYNTHESIS                             │
│  5 Weighted Job Criteria (100%)  •  Deterministic Scoring Formula      │
│  Explainable Confidence Rationale  •  Dynamic Decision Pivots          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Five-Stage Pipeline Deep Dive

### Stage 1: Document Intake & Precedence
- **Inputs:** Target Job Description, Candidate Resume, and Interview Transcript.
- **File Extraction:** In-memory parsing of `.pdf` (pypdf), `.docx` (python-docx), and `.txt` files with strict 10MB size limits.
- **Precedence Rule:** If both an uploaded file and pasted text are supplied for a field, the **pasted text is the authoritative source of truth**.

### Stage 2: Candidate Fact-Base (Zero Hallucination)
Before any evaluator forms an opinion, PanelAI constructs a structured `CandidateProfile`.
- **Anti-Hallucination Rules:** Evaluator agents read exclusively from this fact base. The extractor is strictly forbidden from inventing degrees, companies, or skills.
- **Truthful Status:** If a candidate states *"Passed 12th, failed college"*, it records `High School: 12th Grade Passed` and `College: Incomplete (Failed)`—never a hallucinated "Bachelor of Science".
- **Sparse Profile Handling:** Unmentioned skills or experience remain empty (`[]`), rather than being populated with placeholder data.

### Stage 3: Independent Parallel Review
Four specialized agents evaluate the candidate simultaneously with **strict information isolation**:

| Evaluator Persona | Lens & Role | Core Focus |
|---|---|---|
| **Technical Evaluator** | Principal Systems Architect | Systems engineering, algorithmic depth, coding rigor, CS fundamentals, and tech stack alignment. |
| **HR / Culture Agent** | Head of People | Communication clarity, collaboration evidence, behavioral interview responses, and professional maturity. |
| **Hiring Manager** | Department Head / Director | Target role suitability, leadership track record, seniority fit, and operational delivery readiness. |
| **Skeptic / Auditor** | Adversarial Investigator | Stress-tests claims against evidence, catches resume-vs-transcript contradictions, and quantifies hiring risks. |

#### Strict Independence Guarantee
Each agent call receives **only** the `CandidateProfile` and its own system persona prompt. The function signature enforces this structurally:
```python
async def _run_single_agent(agent_id: AgentId, profile: CandidateProfile) -> tuple[AgentOpinion, list[str]]:
    # There is no parameter through which another agent's opinion can leak.
```
Evaluator opinions are gathered concurrently using `asyncio.gather(*tasks)` with micro-staggering to prevent rate-limit spikes.

### Stage 4: Cross-Examination Debate Arena
Independent opinions are not merely averaged. PanelAI passes the collected perspectives into a structured multi-turn debate:
- **Turn Actions:** `challenge`, `defend`, `agree`, `concede`, `revise`.
- **Score Revisions:** Evaluators can increase or decrease their scores when confronted with corroborating or contradictory evidence from peers.
- **Evidence Linking:** Responses cite specific peer excerpts and fact-base claims.

### Stage 5: Deterministic Mathematical Synthesis
The final hiring decision uses a fixed 5-criteria rubric rather than arbitrary model averaging:

$$\text{Overall Score} = \sum_{i=1}^{5} (\text{Criterion Score}_i \times \text{Weight}_i)$$

| Evaluation Dimension | Weight | Target Role Assessment Focus |
|---|:---:|---|
| **Technical Ability** | **30%** | Systems architecture, algorithms, concurrency, and code quality. |
| **Agentic AI / LLM Experience** | **30%** | Autonomous tool-calling, multi-agent workflows, and state machines. |
| **Production Engineering** | **20%** | Scalability, reliability, latency SLAs, and outage remediation. |
| **Problem Solving** | **10%** | Root-cause analytical breakdown during technical trade-offs. |
| **Communication & Collaboration** | **10%** | Cross-functional alignment, structured reasoning, and team dynamic. |
| **Total** | **100%** | **Mathematically verified sum: 1.0** |

#### Decision Thresholds
| Overall Weighted Score | Recommendation | Action |
|---:|:---:|---|
| **≥ 8.5** | **Strong Hire** | Top tier candidate; priority offer. |
| **≥ 7.0** | **Hire** | Meets or exceeds core requirements with minor manageable gaps. |
| **≥ 5.0** | **Hold** | Candidate demonstrates baseline traits but key unverified dependencies remain. |
| **< 5.0** | **No Hire** | Significant competency, credential, or experience deficits. |

---

## Explainability & Decision Pivots

PanelAI answers not only *"What is the decision?"* but also *"What evidence would change it?"*:

- **Confidence Rationale:** Explicit explanation of why confidence is high (strong corroboration across sources) or low (conflicting signals).
- **Positive Decision Pivots (`moveUp`):** Concrete milestones that would strengthen the recommendation (e.g. *"Demonstrate live hands-on deployment of autonomous tool-calling agents"*).
- **Risk Triggers (`moveDown`):** Conditions that would cause rejection (e.g. *"Reference checks reveal reliability issues or team friction"*).
- **Unresolved Organizational Assumptions:** Explicitly tags missing information that cannot be deduced from documents, preventing silent assumptions.

---

## Security & Adversarial Defenses

1. **Prompt Injection Resistance:**
   All candidate text is bounded inside explicit XML delimiters (`<candidate_resume>`, `<candidate_transcript>`, `<candidate_target_role>`). Prompts instruct models to treat delimiter contents strictly as untrusted external data.
2. **Server-Side Secrets:**
   LLM API keys (`OPENROUTER_API_KEY`, `GEMINI_API_KEY`) remain strictly on the backend server and are never sent to the client.
3. **Thought-Tag Stripping:**
   Reasoning models (Nemotron, DeepSeek R1, Qwen) output `<thought>...</thought>` blocks that can include curly braces. PanelAI strips reasoning tags prior to JSON extraction to prevent JSON parse corruption.
4. **Resilient Rate-Limit Handling:**
   OpenRouter and Gemini calls feature automated retries with exponential backoff, jitter, and response-format fallbacks.

---

## Tech Stack

### Frontend
- **Framework:** React 18 with TypeScript & Vite
- **State Management:** Zustand with persistent history
- **Styling & Animations:** Vanilla CSS + Tailwind tokens, Framer Motion
- **Icons:** Lucide React
- **Voice Synthesis:** Web Speech API with persona-tuned pitch and speech rate

### Backend
- **Framework:** FastAPI (Python 3.9+)
- **Data Validation:** Pydantic v2 with camelCase aliases
- **Concurrency:** Asyncio parallel gather with micro-staggering
- **Document Extractors:** `pypdf`, `python-docx`
- **Testing:** `pytest`, `pytest-asyncio`, `httpx` (95 automated tests)

### Supported LLM Providers
- **OpenRouter:** Supports `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free`, DeepSeek, Llama, and Mistral models.
- **Google Gemini:** Direct integration via `google-genai` SDK (`gemini-2.0-flash`).

---

## Project Structure

```
Promptwars/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI application entrypoint & CORS
│   │   ├── config.py                   # Pydantic Settings & env resolution
│   │   ├── schemas.py                  # Pydantic v2 data models matching frontend
│   │   ├── validation.py               # Evidence quote verification logic
│   │   ├── routers/
│   │   │   ├── pipeline.py             # Build profile, review, debate, synthesis endpoints
│   │   │   └── voice.py                # Text-to-speech synthesis endpoint
│   │   ├── services/
│   │   │   ├── file_extractor.py       # PDF, DOCX, TXT document parser
│   │   │   ├── profile_builder.py      # Fact-base builder & heuristic extraction
│   │   │   ├── independent_review.py   # 4 parallel evaluator agents
│   │   │   ├── debate.py               # Cross-examination debate arena
│   │   │   ├── synthesis.py            # 5-criteria mathematical scoring
│   │   │   └── llm_client.py           # Provider-agnostic client (OpenRouter/Gemini)
│   │   └── prompts/
│   │       ├── personas.py             # 4 distinct evaluator system instructions
│   │       ├── profile.py              # Zero-hallucination profile extraction prompt
│   │       ├── debate.py               # Multi-turn debate system prompt
│   │       └── synthesis.py            # Decision synthesis system prompt
│   └── tests/                          # 95 automated backend tests
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── IntakeForm.tsx          # Document dropzones & text input
│   │   │   ├── ProfileView.tsx         # Fact-base profile & empty states
│   │   │   ├── IndependentReview.tsx   # 4 evaluator review cards
│   │   │   ├── DebateThread.tsx        # Multi-turn cross-examination timeline
│   │   │   └── VerdictReport.tsx       # Final verdict, rubric, and audio narration
│   │   ├── lib/
│   │   │   ├── store.ts                # Zustand global pipeline store
│   │   │   ├── voice.ts                # Web Speech API voice selection
│   │   │   └── history.ts              # LocalStorage evaluation history
│   │   └── types.ts                    # TypeScript interfaces matching backend schemas
│   └── package.json
│
└── README.md
```

---

## Quickstart & Local Development

### Prerequisites
- Python 3.9 or higher
- Node.js 18 or higher

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -e ".[dev]"

# Configure environment variables
cp .env.example .env
```

Edit `backend/.env` with your API credentials:
```env
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=your_openrouter_api_key_here
LLM_MODEL=nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free

# Or use Google Gemini:
# LLM_PROVIDER=gemini
# GEMINI_API_KEY=your_gemini_api_key_here
# GEMINI_MODEL=gemini-2.0-flash
```

Run the backend server:
```bash
uvicorn app.main:app --port 8000 --reload
```
API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Frontend Setup

```bash
cd frontend

# Install packages
npm install

# Start Vite dev server
npm run dev
```
Open: [http://localhost:5173](http://localhost:5173)

---

## Verification & Automated Tests

### Backend Test Suite (95 Tests)
```bash
cd backend
./.venv/bin/pytest -v
```

Tests cover:
- **Evidence Verification:** Verbatim substring checks against raw inputs.
- **Independence Guarantee:** Signature inspection and isolated prompts.
- **File Parsing & Precedence:** PDF/DOCX/TXT parsing and pasted text overrides.
- **Sparse Profile Handling:** Zero hallucination on minimal or negative candidate inputs.
- **Reasoning Model Parsing:** `<thought>` and `<think>` block stripping.
- **Scoring Rubric Math:** Proof that $\sum \text{Weights} = 1.0$ and criteria match overall score.

### Frontend Production Build
```bash
cd frontend
npm run build
```

---

## Production Deployment

PanelAI is designed for split deployment:
- **Frontend:** Deployed to Vercel ([promptwars-tau-lac.vercel.app](https://promptwars-tau-lac.vercel.app))
- **Backend:** Deployed to Render / Railway with CORS origins configured.

```
React Frontend (Vercel)  ──HTTPS──►  FastAPI Backend (Render)  ──►  OpenRouter / Gemini
```

Configure `VITE_API_URL` in Vercel to point to the backend URL:
```env
VITE_API_URL=https://your-backend.onrender.com
```

---

## License

MIT License. Built for PanelAI Evaluation.
