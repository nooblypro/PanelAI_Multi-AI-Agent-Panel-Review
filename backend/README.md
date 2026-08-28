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

## 2. Security

All LLM API keys (`OPENROUTER_API_KEY`, `GEMINI_API_KEY`) remain strictly on the backend and are never exposed to the frontend. The `.env` file is excluded from Git via `.gitignore`.

---

## 3. Local Setup & Running

### 3.1 Install Dependencies
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"  # or pip install fastapi "uvicorn[standard]" pydantic pydantic-settings google-genai httpx pytest pytest-asyncio
```

### 3.2 Run the Server
```bash
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```
Check health: `http://localhost:8000/health`

### 3.3 Run Tests
```bash
source .venv/bin/activate
python -m pytest tests/ -v
```

### 3.4 Run Local Smoke Test
```bash
source .venv/bin/activate
python smoke_test.py
```

---

## 4. Endpoints & Pipeline Flow

| Method | Path | Request Body | Response Body | Stage Description |
|---|---|---|---|---|
| `GET` | `/health` | None | `{"status": "ok", "provider": str, "model": str, "has_api_key": bool}` | Health & provider readiness probe |
| `POST` | `/api/independent-review` | `CandidateProfile` | `{"opinions": AgentOpinion[], "warnings"?: string[]}` | Runs 4 isolated agents in parallel (`asyncio.gather`) |
| `POST` | `/api/debate` | `{"profile": CandidateProfile, "opinions": AgentOpinion[]}` | `{"debateTurns": DebateTurn[], "warnings"?: string[]}` | Multi-turn debate cross-referencing statements |
| `POST` | `/api/synthesize` | `{"profile": CandidateProfile, "opinions": AgentOpinion[], "debateTurns": DebateTurn[]}` | `{"decision": FinalDecision, "warnings"?: string[]}` | Weighted synthesis with strengths, concerns & disagreements |
