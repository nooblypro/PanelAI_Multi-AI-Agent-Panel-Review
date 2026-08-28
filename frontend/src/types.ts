export interface CandidateProfile {
  id: string;
  name: string;
  targetRole: string;
  resumeText: string;
  transcriptText: string;
  skills: { name: string; evidence: string; source: 'resume' | 'transcript' }[];
  experience: { company: string; title: string; duration: string; highlights: string[] }[];
  education: { school: string; degree: string; year?: string }[];
  claims: { text: string; source: 'resume' | 'transcript' }[];
  createdAt: string;
}

export type AgentId = 'technical' | 'culture' | 'hiring_manager' | 'skeptic';

export interface AgentOpinion {
  agentId: AgentId;
  round: 'independent' | 'post_debate';
  score: number; // 1-10
  confidence: number; // 0-100
  verdict: 'strong_yes' | 'yes' | 'lean_yes' | 'lean_no' | 'no' | 'strong_no';
  summary: string;
  evidence: { quote: string; source: 'resume' | 'transcript'; note: string }[];
  timestamp: string;
}

export interface DebateTurn {
  id: string;
  fromAgent: AgentId;
  respondingTo?: { agentId: AgentId; excerpt: string };
  stance: 'agree' | 'disagree' | 'challenge' | 'concede' | 'revise';
  content: string;
  scoreChange?: { from: number; to: number };
  timestamp: string;
}

export interface CriterionScore {
  name: string;
  score: number; // 1.0 - 10.0
  weight: number; // 0.0 - 1.0 (e.g. 0.30)
  weightedScore: number; // score * weight
  rationale: string;
}

export interface WhatWouldChange {
  moveUp: string[];
  moveDown: string[];
}

export interface FinalDecision {
  recommendation: 'Strong Hire' | 'Hire' | 'Hold' | 'No Hire';
  confidenceLevel: number; // 0-100
  confidenceRationale?: string;
  overallScore?: number; // 1.0 - 10.0
  criteriaScores?: CriterionScore[];
  reasoning: string;
  weightBreakdown: { agentId: AgentId; weight: number; rationale: string }[];
  strengths: string[];
  concerns: string[];
  unresolvedDisagreements: { agents: AgentId[]; topic: string; description: string }[];
  whatWouldChange?: WhatWouldChange;
}

export type Stage = 'intake' | 'profile' | 'review' | 'debate' | 'verdict';

export const AGENTS: { id: AgentId; name: string; color: string; icon: string }[] = [
  { id: 'technical', name: 'Technical Agent', color: 'accent-technical', icon: 'Code2' },
  { id: 'culture', name: 'HR / Culture Agent', color: 'accent-culture', icon: 'Handshake' },
  { id: 'hiring_manager', name: 'Hiring Manager Agent', color: 'accent-hm', icon: 'Briefcase' },
  { id: 'skeptic', name: 'Skeptic Agent', color: 'accent-skeptic', icon: 'Search' },
];

export const VERDICT_LABELS: Record<AgentOpinion['verdict'], string> = {
  strong_yes: 'Strong Yes',
  yes: 'Yes',
  lean_yes: 'Lean Yes',
  lean_no: 'Lean No',
  no: 'No',
  strong_no: 'Strong No',
};

export const VERDICT_COLORS: Record<AgentOpinion['verdict'], string> = {
  strong_yes: '#34D399',
  yes: '#34D399',
  lean_yes: '#FBBF24',
  lean_no: '#FBBF24',
  no: '#F87171',
  strong_no: '#F87171',
};

export const STANCE_ICONS: Record<DebateTurn['stance'], string> = {
  agree: 'Handshake',
  disagree: 'Zap',
  challenge: 'Target',
  concede: 'Flag',
  revise: 'RefreshCw',
};

export const STANCE_LABELS: Record<DebateTurn['stance'], string> = {
  agree: 'Agree',
  disagree: 'Disagree',
  challenge: 'Challenge',
  concede: 'Concede',
  revise: 'Revise',
};
