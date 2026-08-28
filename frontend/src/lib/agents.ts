import type { AgentOpinion, CandidateProfile, DebateTurn, FinalDecision } from '../types';

// Backend API base URL — configurable via Vite env var
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Run 4 independent AI agent evaluations in parallel.
 *
 * Calls POST /api/independent-review with the candidate profile.
 * The backend enforces full agent independence — each agent sees
 * only the profile and its own persona prompt, never another agent's output.
 */
export async function runIndependentReview(profile: CandidateProfile): Promise<AgentOpinion[]> {
  const res = await fetch(`${API_BASE}/api/independent-review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => 'Unknown error');
    throw new Error(`Independent review failed (${res.status}): ${detail}`);
  }

  const data = await res.json();
  return data.opinions;
}

/**
 * Generate a structured multi-turn debate between the 4 agents.
 *
 * Calls POST /api/debate with the profile and all 4 opinions.
 * This is the first point where agents can see each other's reasoning.
 */
export async function runDebate(
  profile: CandidateProfile,
  opinions: AgentOpinion[]
): Promise<DebateTurn[]> {
  const res = await fetch(`${API_BASE}/api/debate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile, opinions }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => 'Unknown error');
    throw new Error(`Debate generation failed (${res.status}): ${detail}`);
  }

  const data = await res.json();
  return data.debateTurns;
}

/**
 * Synthesize a final hiring decision from all evidence.
 *
 * Calls POST /api/synthesize with the profile, opinions, and debate turns.
 */
export async function synthesizeDecision(
  profile: CandidateProfile,
  opinions: AgentOpinion[],
  debateTurns: DebateTurn[]
): Promise<FinalDecision> {
  const res = await fetch(`${API_BASE}/api/synthesize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile, opinions, debateTurns }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => 'Unknown error');
    throw new Error(`Synthesis failed (${res.status}): ${detail}`);
  }

  const data = await res.json();
  return data.decision;
}
