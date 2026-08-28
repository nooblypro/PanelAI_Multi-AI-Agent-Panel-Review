# PanelAI FastAPI Backend

FastAPI backend for **PanelAI** — a multi-agent hiring evaluation system where 4 independent AI personas evaluate candidates, engage in a structured debate, and produce an evidence-backed decision.

---

## 1. Provider-Agnostic LLM Configuration

The backend supports multiple LLM providers configured via environment variables.

### Option A: OpenRouter (Default / Recommended for Development)

To use OpenRouter with NVIDIA Nemotron 3 Ultra Free:

Create a `.env` file in `backend/` (or set environment variables):

```env
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=your_openrouter_api_key_here
LLM_MODEL=nvidia/nemotron-3-ultra-550b-a55b:free
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

> **Note on Nemotron Free Endpoint:** The free Nemotron model endpoint does not require structured output / schema mode. The backend requests JSON format directly in the prompt and uses robust markdown fence & preamble-tolerant parsing (`_parse_json`), followed by Pydantic schema validation.

### Option B: Google Gemini (Alternative)

To switch to Google Gemini:

```env
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash
```

### Option C: Mock Fallback Mode (Zero Keys Required)

If no API key is provided, the backend logs the missing key and automatically activates the mock fallback system. The full 5-stage UI workflow remains 100% interactive and testable without API credentials.

---

## 2. File & Text Input Precedence Rule

When both an uploaded file (`.pdf`, `.docx`, `.txt`) and pasted text are provided for the same field (Target Role, Resume, or Interview Transcript):
- **Pasted text is the preferred source of truth** and is used for evaluation.
- The file content is discarded for that field rather than concatenated, avoiding duplicate or conflicting statements.

---

## 3. Security

All LLM API keys (`OPENROUTER_API_KEY`, `GEMINI_API_KEY`) remain strictly on the backend and are never exposed to the frontend. The `.env` file is excluded from Git via `.gitignore`.

---

## 4. Local Setup & Running

### 4.1 Install Dependencies
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"  # installs fastapi, uvicorn, pydantic, google-genai, httpx, pypdf, python-docx, python-multipart
```

### 4.2 Run the Server
```bash
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```
Check health: `http://localhost:8000/health`

### 4.3 Run Tests
```bash
source .venv/bin/activate
python -m pytest tests/ -v
```

### 4.4 Run Local Smoke Test
```bash
source .venv/bin/activate
python smoke_test.py
```

---

## 5. Endpoints & Pipeline Flow

| Method | Path | Request Body | Response Body | Stage Description |
|---|---|---|---|---|
| `GET` | `/health` | None | `{"status": "ok", "provider": str, "model": str, "has_api_key": bool}` | Health & provider readiness probe |
| `POST` | `/api/build-profile` | `multipart/form-data` with optional `targetRoleText`, `targetRoleFile`, `resumeText`, `resumeFile`, `transcriptText`, `transcriptFile`, `candidateName` | `{"profile": CandidateProfile}` | Normalizes `.pdf`, `.docx`, `.txt` and applies precedence rules |
| `POST` | `/api/independent-review` | `CandidateProfile` | `{"opinions": AgentOpinion[], "warnings"?: string[]}` | Runs 4 isolated agents in parallel (`asyncio.gather`) |
| `POST` | `/api/debate` | `{"profile": CandidateProfile, "opinions": AgentOpinion[]}` | `{"debateTurns": DebateTurn[], "warnings"?: string[]}` | Multi-turn debate cross-referencing statements |
| `POST` | `/api/synthesize` | `{"profile": CandidateProfile, "opinions": AgentOpinion[], "debateTurns": DebateTurn[]}` | `{"decision": FinalDecision, "warnings"?: string[]}` | 5 JD criteria weighted synthesis with strengths, concerns, uncertainty tracking & What Would Change |

---

## 6. Scoring Methodology & 5 JD Dimensions

The final score is mathematically calculated from the 5 official Job Description evaluation dimensions (sum of weights = 1.0):
1. **Technical ability** (30% weight)
2. **Agentic AI / LLM experience** (30% weight)
3. **Production engineering** (20% weight)
4. **Problem solving** (10% weight)
5. **Communication / collaboration** (10% weight)

$$\text{Overall Score} = \sum_{i=1}^{5} (\text{Score}_i \times \text{Weight}_i)$$

The 4 evaluator agents act as independent perspectives providing evidence and cross-examination during the debate, feeding into the mathematical scoring engine.
