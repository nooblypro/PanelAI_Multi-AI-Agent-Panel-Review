import type { AgentOpinion, CandidateProfile, DebateTurn, FinalDecision } from '../types';

// Backend API base URL — configurable via Vite env var (VITE_API_URL or VITE_API_BASE_URL)
const API_BASE = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

/**
 * Build a structured CandidateProfile from files and/or text inputs.
 *
 * Calls POST /api/build-profile with multipart/form-data.
 * The backend extracts text from .pdf, .docx, or .txt files,
 * resolves precedence (pasted text > file text), and constructs
 * the structured fact base.
 */
export async function buildCandidateProfile(params: {
  targetRoleText?: string;
  targetRoleFile?: File | null;
  resumeText?: string;
  resumeFile?: File | null;
  transcriptText?: string;
  transcriptFile?: File | null;
  candidateName?: string;
}): Promise<CandidateProfile> {
  const formData = new FormData();
  if (params.targetRoleText) formData.append('targetRoleText', params.targetRoleText);
  if (params.targetRoleFile) formData.append('targetRoleFile', params.targetRoleFile);
  if (params.resumeText) formData.append('resumeText', params.resumeText);
  if (params.resumeFile) formData.append('resumeFile', params.resumeFile);
  if (params.transcriptText) formData.append('transcriptText', params.transcriptText);
  if (params.transcriptFile) formData.append('transcriptFile', params.transcriptFile);
  if (params.candidateName) formData.append('candidateName', params.candidateName);

  const res = await fetch(`${API_BASE}/api/build-profile`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    let detail = 'Unknown error';
    try {
      const errJson = await res.json();
      detail = errJson.detail || JSON.stringify(errJson);
    } catch {
      detail = await res.text().catch(() => 'Unknown error');
    }
    throw new Error(`Profile building failed (${res.status}): ${detail}`);
  }

  const data = await res.json();
  return data.profile;
}

/**
 * Run 4 independent AI agent evaluations in parallel.
 *
 * Calls POST /api/independent-review with the candidate profile.
 * The backend enforces full agent independence — each agent sees
 * only the profile and its own persona prompt, never another agent's output.
 */
export async function runIndependentReview(
  profile: CandidateProfile,
  onProgress?: (agentId: string) => void
): Promise<AgentOpinion[]> {
  const agents = ['technical', 'culture', 'hiring_manager', 'skeptic'];
  
  const promises = agents.map(async (agentId) => {
    const res = await fetch(`${API_BASE}/api/independent-review/${agentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });

    if (!res.ok) {
      let detail = 'Unknown error';
      try {
        const errJson = await res.json();
        detail = errJson.detail || JSON.stringify(errJson);
      } catch {
        detail = await res.text().catch(() => 'Unknown error');
      }
      throw new Error(`Independent review for ${agentId} failed (${res.status}): ${detail}`);
    }

    const data = await res.json();
    if (onProgress) {
      onProgress(agentId);
    }
    return data.opinion;
  });

  return Promise.all(promises);
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
  // OPTIMIZATION: Do not send large raw text to debate since it's popped on the server anyway.
  const { resumeText, transcriptText, ...profileWithoutRaw } = profile;
  const res = await fetch(`${API_BASE}/api/debate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile: profileWithoutRaw, opinions }),
  });

  if (!res.ok) {
    let detail = 'Unknown error';
    try {
      const errJson = await res.json();
      detail = errJson.detail || JSON.stringify(errJson);
    } catch {
      detail = await res.text().catch(() => 'Unknown error');
    }
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
  // OPTIMIZATION: Do not send large raw text to synthesis since it's popped on the server anyway.
  const { resumeText, transcriptText, ...profileWithoutRaw } = profile;
  const res = await fetch(`${API_BASE}/api/synthesize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile: profileWithoutRaw, opinions, debateTurns }),
  });

  if (!res.ok) {
    let detail = 'Unknown error';
    try {
      const errJson = await res.json();
      detail = errJson.detail || JSON.stringify(errJson);
    } catch {
      detail = await res.text().catch(() => 'Unknown error');
    }
    throw new Error(`Synthesis failed (${res.status}): ${detail}`);
  }

  const data = await res.json();
  return data.decision;
}
