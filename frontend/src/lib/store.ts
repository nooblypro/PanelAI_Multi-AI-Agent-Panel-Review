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
  reviewStatus: 'idle' | 'running' | 'done' | 'error';
  reviewError: string | null;
  agentProgress: Record<string, boolean>; // agentId -> done?
  agentErrors: Record<string, string | null>; // agentId -> error message if any

  // Debate state
  debateStatus: 'idle' | 'running' | 'done' | 'error';
  debateError: string | null;
  revealedTurns: number;

  // Verdict state
  verdictStatus: 'idle' | 'running' | 'done' | 'error';
  verdictError: string | null;

  // Actions
  setStage: (stage: Stage) => void;
  setProfile: (profile: CandidateProfile) => void;
  updateProfileName: (name: string) => void;
  prefetchReview: () => void;
  startReview: () => Promise<void>;
  startDebate: () => Promise<void>;
  revealNextTurn: () => void;
  revealAllTurns: () => void;
  setRevealedTurns: (turns: number) => void;
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
  reviewError: null,
  agentProgress: {},
  agentErrors: {},
  debateStatus: 'idle',
  debateError: null,
  revealedTurns: 0,
  verdictStatus: 'idle',
  verdictError: null,

  setStage: (stage) => set({ stage }),

  setProfile: (profile) => set({ profile, stage: 'profile', reviewStatus: 'idle', reviewError: null, debateError: null, verdictError: null }),

  updateProfileName: (name) => {
    const profile = get().profile;
    if (profile) set({ profile: { ...profile, name } });
  },

  prefetchReview: () => {
    const state = get();
    if (state.profile && state.reviewStatus === 'idle') {
      state.startReview();
    }
  },

  startReview: async () => {
    const profile = get().profile;
    if (!profile || get().reviewStatus === 'running') return;

    set({
      reviewStatus: 'running',
      reviewError: null,
      agentProgress: { technical: false, culture: false, hiring_manager: false, skeptic: false },
      agentErrors: { technical: null, culture: null, hiring_manager: null, skeptic: null },
      opinions: [],
    });

    try {
      const opinions = await runIndependentReview(profile, (agentId, result) => {
        if (result.success && result.opinion) {
          set((state) => ({
            agentProgress: { ...state.agentProgress, [agentId]: true },
            agentErrors: { ...state.agentErrors, [agentId]: null },
            opinions: [...state.opinions.filter((o) => o.agentId !== agentId), result.opinion!],
          }));
        } else {
          set((state) => ({
            agentProgress: { ...state.agentProgress, [agentId]: false },
            agentErrors: { ...state.agentErrors, [agentId]: result.error || 'Evaluation failed' },
          }));
        }
      });

      // Finalize
      set({
        agentProgress: { technical: true, culture: true, hiring_manager: true, skeptic: true },
        agentErrors: { technical: null, culture: null, hiring_manager: null, skeptic: null },
        opinions,
        reviewStatus: 'done',
        reviewError: null,
      });
    } catch (err: any) {
      console.error('startReview failed:', err);
      set({
        reviewStatus: 'error',
        reviewError: err?.message || 'Failed to complete independent evaluation.',
      });
    }
  },

  startDebate: async () => {
    const profile = get().profile;
    const opinions = get().opinions;
    if (!profile || opinions.length === 0) return;

    set({ debateStatus: 'running', debateError: null, debateTurns: [], revealedTurns: 0 });

    try {
      const turns = await runDebate(profile, opinions);
      set({ debateTurns: turns, debateStatus: 'done', debateError: null });
    } catch (err: any) {
      console.error('startDebate failed:', err);
      set({
        debateStatus: 'error',
        debateError: err?.message || 'Failed to generate panel debate.',
      });
    }
  },

  revealNextTurn: () => {
    const current = get().revealedTurns;
    const total = get().debateTurns.length;
    if (current < total) set({ revealedTurns: current + 1 });
  },

  revealAllTurns: () => set({ revealedTurns: get().debateTurns.length }),

  setRevealedTurns: (turns: number) => {
    const total = get().debateTurns.length;
    const clamped = Math.min(Math.max(0, turns), total);
    set({ revealedTurns: clamped });
  },

  startVerdict: async () => {
    const profile = get().profile;
    const opinions = get().opinions;
    const debateTurns = get().debateTurns;
    if (!profile || opinions.length === 0) return;

    set({ verdictStatus: 'running', verdictError: null });

    try {
      const decision = await synthesizeDecision(profile, opinions, debateTurns);
      set({ decision, verdictStatus: 'done', verdictError: null, stage: 'verdict' });
    } catch (err: any) {
      console.error('startVerdict failed:', err);
      set({
        verdictStatus: 'error',
        verdictError: err?.message || 'Failed to synthesize final verdict.',
      });
    }
  },

  reset: () =>
    set({
      stage: 'intake',
      profile: null,
      opinions: [],
      debateTurns: [],
      decision: null,
      reviewStatus: 'idle',
      reviewError: null,
      agentProgress: {},
      debateStatus: 'idle',
      debateError: null,
      revealedTurns: 0,
      verdictStatus: 'idle',
      verdictError: null,
    }),

  loadFromHistory: (data) =>
    set({
      stage: 'verdict',
      profile: data.profile,
      opinions: data.opinions,
      debateTurns: data.debateTurns,
      decision: data.decision,
      reviewStatus: 'done',
      reviewError: null,
      agentProgress: { technical: true, culture: true, hiring_manager: true, skeptic: true },
      debateStatus: 'done',
      debateError: null,
      revealedTurns: data.debateTurns.length,
      verdictStatus: 'done',
      verdictError: null,
    }),
}));
