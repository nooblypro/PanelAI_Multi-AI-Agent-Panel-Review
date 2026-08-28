import { create } from 'zustand';
import type { AgentOpinion, CandidateProfile, DebateTurn, FinalDecision, Stage } from '../types';
import { runDebate, runIndependentReview, synthesizeDecision } from './agents';

interface PipelineState {
  stage: Stage;
  profile: CandidateProfile | null;
  opinions: AgentOpinion[];
  debateTurns: DebateTurn[];
  decision: FinalDecision | null;

  // Review state
  reviewStatus: 'idle' | 'running' | 'done';
  agentProgress: Record<string, boolean>; // agentId -> done?

  // Debate state
  debateStatus: 'idle' | 'running' | 'done';
  revealedTurns: number;

  // Verdict state
  verdictStatus: 'idle' | 'running' | 'done';

  // Actions
  setStage: (stage: Stage) => void;
  setProfile: (profile: CandidateProfile) => void;
  updateProfileName: (name: string) => void;
  startReview: () => Promise<void>;
  startDebate: () => Promise<void>;
  revealNextTurn: () => void;
  revealAllTurns: () => void;
  startVerdict: () => Promise<void>;
  reset: () => void;
  loadFromHistory: (data: {
    profile: CandidateProfile;
    opinions: AgentOpinion[];
    debateTurns: DebateTurn[];
    decision: FinalDecision;
  }) => void;
}

export const usePipelineStore = create<PipelineState>((set, get) => ({
  stage: 'intake',
  profile: null,
  opinions: [],
  debateTurns: [],
  decision: null,
  reviewStatus: 'idle',
  agentProgress: {},
  debateStatus: 'idle',
  revealedTurns: 0,
  verdictStatus: 'idle',

  setStage: (stage) => set({ stage }),

  setProfile: (profile) => set({ profile, stage: 'profile' }),

  updateProfileName: (name) => {
    const profile = get().profile;
    if (profile) set({ profile: { ...profile, name } });
  },

  startReview: async () => {
    const profile = get().profile;
    if (!profile) return;

    set({
      reviewStatus: 'running',
      agentProgress: { technical: false, culture: false, hiring_manager: false, skeptic: false },
      opinions: [],
    });

    const opinions = await runIndependentReview(profile);

    // Mark all agents done, then set opinions
    set({
      agentProgress: { technical: true, culture: true, hiring_manager: true, skeptic: true },
      opinions,
      reviewStatus: 'done',
    });
  },

  startDebate: async () => {
    const profile = get().profile;
    const opinions = get().opinions;
    if (!profile || opinions.length === 0) return;

    set({ debateStatus: 'running', debateTurns: [], revealedTurns: 0 });

    const turns = await runDebate(profile, opinions);

    set({ debateTurns: turns, debateStatus: 'done' });
  },

  revealNextTurn: () => {
    const current = get().revealedTurns;
    const total = get().debateTurns.length;
    if (current < total) set({ revealedTurns: current + 1 });
  },

  revealAllTurns: () => set({ revealedTurns: get().debateTurns.length }),

  startVerdict: async () => {
    const profile = get().profile;
    const opinions = get().opinions;
    const debateTurns = get().debateTurns;
    if (!profile || opinions.length === 0) return;

    set({ verdictStatus: 'running' });

    const decision = await synthesizeDecision(profile, opinions, debateTurns);

    set({ decision, verdictStatus: 'done', stage: 'verdict' });
  },

  reset: () =>
    set({
      stage: 'intake',
      profile: null,
      opinions: [],
      debateTurns: [],
      decision: null,
      reviewStatus: 'idle',
      agentProgress: {},
      debateStatus: 'idle',
      revealedTurns: 0,
      verdictStatus: 'idle',
    }),

  loadFromHistory: (data) =>
    set({
      stage: 'verdict',
      profile: data.profile,
      opinions: data.opinions,
      debateTurns: data.debateTurns,
      decision: data.decision,
      reviewStatus: 'done',
      agentProgress: { technical: true, culture: true, hiring_manager: true, skeptic: true },
      debateStatus: 'done',
      revealedTurns: data.debateTurns.length,
      verdictStatus: 'done',
    }),
}));
