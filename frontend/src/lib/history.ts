import type { AgentOpinion, CandidateProfile, DebateTurn, FinalDecision } from '../types';

export interface HistoryEntry {
  id: string;
  candidateName: string;
  targetRole: string;
  recommendation: FinalDecision['recommendation'];
  createdAt: string;
  data: {
    profile: CandidateProfile;
    opinions: AgentOpinion[];
    debateTurns: DebateTurn[];
    decision: FinalDecision;
  };
}

const STORAGE_KEY = 'panelai_history';

export function saveToHistory(
  profile: CandidateProfile,
  opinions: AgentOpinion[],
  debateTurns: DebateTurn[],
  decision: FinalDecision
): void {
  const entries = loadHistory();
  const entry: HistoryEntry = {
    id: profile.id,
    candidateName: profile.name,
    targetRole: profile.targetRole,
    recommendation: decision.recommendation,
    createdAt: new Date().toISOString(),
    data: { profile, opinions, debateTurns, decision },
  };
  // Replace if same id exists
  const filtered = entries.filter((e) => e.id !== entry.id);
  filtered.unshift(entry);
  // Keep last 20
  const trimmed = filtered.slice(0, 20);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

export function deleteFromHistory(id: string): void {
  const entries = loadHistory().filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export const RECOMMENDATION_COLORS: Record<FinalDecision['recommendation'], string> = {
  'Strong Hire': '#34D399',
  Hire: '#34D399',
  Hold: '#FBBF24',
  'No Hire': '#F87171',
};
