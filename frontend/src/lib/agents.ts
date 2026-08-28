import type { AgentOpinion, CandidateProfile, DebateTurn, FinalDecision } from '../types';

// Backend API base URL — configurable via Vite env var (VITE_API_URL or VITE_API_BASE_URL)
function getApiBase(): string {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }
  if (import.meta.env.PROD) {
    console.warn(
      '[PanelAI] VITE_API_URL is not set in this production build. Defaulting to http://localhost:8000. ' +
      'Set VITE_API_URL in your hosting environment (e.g. Render, Vercel) to point to your deployed backend.'
    );
  }
  return 'http://localhost:8000';
}

export const API_BASE = getApiBase();

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
 * Calls POST /api/independent-review/{agentId} with the candidate profile.
 * The backend enforces full agent independence — each agent sees
 * only the profile and its own persona prompt, never another agent's output.
 */
export async function runIndependentReview(
  profile: CandidateProfile,
  onProgress?: (
    agentId: string,
    result: { success: boolean; opinion?: AgentOpinion; error?: string }
  ) => void
): Promise<AgentOpinion[]> {
  const agents = ['technical', 'culture', 'hiring_manager', 'skeptic'];
  
  const results = await Promise.all(
    agents.map(async (agentId) => {
      let errorDetail = '';

      // Primary: Call single agent endpoint (with 1 retry for cold start resilience)
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const res = await fetch(`${API_BASE}/api/independent-review/${agentId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profile),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.opinion) {
              if (onProgress) onProgress(agentId, { success: true, opinion: data.opinion });
              return { success: true, opinion: data.opinion as AgentOpinion };
            }
          }
          errorDetail = `HTTP ${res.status}: ${await res.text().catch(() => '')}`;
        } catch (e: any) {
          errorDetail = e?.message || 'Network request failed';
          console.warn(`Single agent review fetch attempt ${attempt} failed for ${agentId}:`, e);
          if (attempt === 1) {
            await new Promise((r) => setTimeout(r, 800));
          }
        }
      }

      // Secondary fallback: Try batch endpoint
      try {
        const batchRes = await fetch(`${API_BASE}/api/independent-review`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profile),
        });
        if (batchRes.ok) {
          const batchData = await batchRes.json();
          const found = (batchData.opinions || []).find((op: any) => op.agentId === agentId);
          if (found) {
            if (onProgress) onProgress(agentId, { success: true, opinion: found });
            return { success: true, opinion: found as AgentOpinion };
          }
        }
      } catch (e: any) {
        console.warn(`Batch review fallback failed for ${agentId}:`, e);
      }

      // If backend attempts failed, fail cleanly so user is notified instead of silent fabrication
      const errMsg = `Agent ${agentId} review failed (${errorDetail || 'backend unavailable'}). Please check backend connection (${API_BASE}) and CORS configuration.`;
      if (onProgress) onProgress(agentId, { success: false, error: errMsg });
      return { success: false, error: errMsg };
    })
  );

  const failed = results.filter((r) => !r.success);
  if (failed.length > 0) {
    throw new Error(failed.map((f) => f.error).join('\n'));
  }

  return results.map((r) => r.opinion!);
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
