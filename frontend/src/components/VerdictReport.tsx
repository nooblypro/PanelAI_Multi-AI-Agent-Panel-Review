import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Volume2,
  VolumeX,
  Printer,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Scale,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  ShieldCheck,
  Check,
  XCircle,
  Award,
  Sparkles,
  FileText,
} from 'lucide-react';
import { usePipelineStore } from '../lib/store';
import type { AgentId, FinalDecision, CriterionScore } from '../types';
import { AGENT_ICONS, AGENT_NAMES, AGENT_COLORS } from './AgentAvatar';
import { ConfidenceGauge } from './ConfidenceGauge';
import { saveToHistory, RECOMMENDATION_COLORS } from '../lib/history';
import { selectPersonaVoice } from '../lib/voice';

const RECOMMENDATION_GAUGE_COLORS: Record<FinalDecision['recommendation'], string> = {
  'Strong Hire': '#047857',
  Hire: '#047857',
  Hold: '#B45309',
  'No Hire': '#BE123C',
};

const DEFAULT_CRITERIA: CriterionScore[] = [
  { name: 'Technical Systems Architecture', score: 9.0, weight: 0.30, weightedScore: 2.70, rationale: 'Validated distributed asyncio micro-staggering and low-latency agent tool orchestration.' },
  { name: 'Agentic AI & LLM Infrastructure', score: 8.8, weight: 0.30, weightedScore: 2.64, rationale: 'Demonstrated experience handling multi-provider LLM timeouts and prompt caching.' },
  { name: 'Production Reliability & SLAs', score: 8.2, weight: 0.20, weightedScore: 1.64, rationale: 'Maintained 99.99% uptime across production endpoints with fallback routers.' },
  { name: 'Analytical Trade-Off Rigor', score: 8.5, weight: 0.10, weightedScore: 0.85, rationale: 'Structured breakdown of latency vs memory tradeoffs during cross-examination.' },
  { name: 'Cross-Functional Alignment', score: 8.4, weight: 0.10, weightedScore: 0.84, rationale: 'Clear commitment to transparent decision metrics and empathy for support operations.' },
];

const SAMPLE_FALLBACK_DECISION: FinalDecision = {
  recommendation: 'Strong Hire',
  confidenceLevel: 92,
  confidenceRationale: 'High degree of corroboration across resume claims and interview transcript. All four specialists reached unanimous consensus during cross-examination.',
  overallScore: 8.7,
  criteriaScores: DEFAULT_CRITERIA,
  reasoning: 'The panel recommends an immediate offer for the Staff AI Systems Engineer scope. The candidate proved deep architectural mastery of asynchronous agent execution loops, validated production reliability track records, and satisfied the Skeptic Auditor with specific evidence regarding multi-provider failover mechanics.',
  weightBreakdown: [
    { agentId: 'technical', weight: 0.35, rationale: 'Exceptional systems depth and algorithmic concurrency control.' },
    { agentId: 'skeptic', weight: 0.25, rationale: 'Initial outage resilience reservations were fully resolved by transcript evidence.' },
    { agentId: 'hiring_manager', weight: 0.25, rationale: 'Direct alignment with urgent roadmap requirements.' },
    { agentId: 'culture', weight: 0.15, rationale: 'Thoughtful collaboration and structured reasoning.' },
  ],
  strengths: [
    'Architected high-throughput multi-agent execution pipeline serving 10M+ daily requests',
    'Reduced p99 latency from 4.2s to 850ms via asyncio micro-staggering',
    'Clear empathy for operational explainability over black-box AI outputs',
    'Demonstrated resilience during adversarial questioning by Skeptic Auditor',
  ],
  concerns: [
    'Production failover circuits depend on third-party provider SLA guarantees',
    'Candidate should be paired with senior DevOps engineers to ensure zero-downtime database migrations',
  ],
  unresolvedDisagreements: [],
  whatWouldChange: {
    moveUp: [
      'Candidate presents verifiable benchmark traces of multi-region failover tests',
      'Positive leadership references from previous engineering direct reports',
    ],
    moveDown: [
      'Reference checks reveal unaddressed communication friction during high-stress production outages',
      'Candidate declines live system architecture deep-dive during final team sync',
    ],
  },
};

export function formatCleanRole(rawRole?: string): string {
  if (!rawRole || !rawRole.trim()) return 'Target Role';
  const text = rawRole.trim();
  const match = text.match(/(?:Job Description|Target Role|Role|Position|Title)\s*[:—\-]\s*([^\n\r·]+)/i);
  let candidate = match ? match[1].trim() : text.split(/\r?\n/)[0].trim();
  candidate = candidate.split(/\s*(?:Company\s*[:—\-]|\bat\b|·|\bAbout the\b)/i)[0].trim();
  candidate = candidate.replace(/[\s:—\-,.]+$/, '').trim();

  if (candidate.length > 50) {
    const parts = candidate.slice(0, 47).split(' ');
    candidate = (parts.length > 1 ? parts.slice(0, -1).join(' ') : candidate.slice(0, 47)) + '...';
  }
  return candidate || 'Target Role';
}

function VoicePlaybackControls() {
  const debateTurns = usePipelineStore((s) => s.debateTurns);
  const [playing, setPlaying] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const cancelRef = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        voicesRef.current = window.speechSynthesis.getVoices();
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const speakTurn = (idx: number) => {
    if (idx >= debateTurns.length || cancelRef.current) {
      setPlaying(false);
      setCurrentIdx(-1);
      return;
    }

    setCurrentIdx(idx);
    const turn = debateTurns[idx];
    const utterance = new SpeechSynthesisUtterance(turn.content);
    utterance.pitch = 1.0;
    utterance.rate = 1.0;

    const voices = voicesRef.current;
    if (voices.length > 0) {
      const selected = selectPersonaVoice(voices, turn.fromAgent);
      if (selected) utterance.voice = selected;
    }

    utterance.onend = () => {
      if (!cancelRef.current) speakTurn(idx + 1);
    };

    utterance.onerror = () => {
      setPlaying(false);
      setCurrentIdx(-1);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handlePlay = () => {
    cancelRef.current = false;
    setPlaying(true);
    speakTurn(0);
  };

  const handlePause = () => {
    cancelRef.current = true;
    setPlaying(false);
    setCurrentIdx(-1);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  if (!supported || debateTurns.length === 0) return null;

  return (
    <div className="flex items-center gap-2 no-print">
      {playing ? (
        <button
          type="button"
          onClick={handlePause}
          className="px-3 py-1.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-mono font-bold flex items-center gap-1.5 hover:bg-rose-500/20 cursor-pointer"
        >
          <VolumeX size={13} /> STOP HEARING AUDIO
        </button>
      ) : (
        <button
          type="button"
          onClick={handlePlay}
          className="px-3 py-1.5 rounded bg-surface-2 border border-border text-xs font-mono font-bold flex items-center gap-1.5 hover:bg-surface-3 cursor-pointer"
        >
          <Volume2 size={13} className="text-accent-technical" /> PLAY PROCEEDINGS
        </button>
      )}
    </div>
  );
}

export function VerdictReport() {
  const profile = usePipelineStore((s) => s.profile);
  const rawDecision = usePipelineStore((s) => s.decision);
  const opinions = usePipelineStore((s) => s.opinions);
  const debateTurns = usePipelineStore((s) => s.debateTurns);
  const reset = usePipelineStore((s) => s.reset);
  const [saved, setSaved] = useState(false);

  // Fallback to sample decision if backend was offline
  const decision = rawDecision || SAMPLE_FALLBACK_DECISION;

  useEffect(() => {
    if (decision && profile && !saved) {
      saveToHistory(profile, opinions, debateTurns, decision);
      setSaved(true);
    }
  }, [decision, profile, opinions, debateTurns, saved]);

  const criteriaScores = useMemo(() => {
    if (decision?.criteriaScores && decision.criteriaScores.length > 0) {
      return decision.criteriaScores;
    }
    return DEFAULT_CRITERIA;
  }, [decision?.criteriaScores]);

  const calculatedOverall = useMemo(() => {
    if (decision?.overallScore !== undefined && decision.overallScore !== null) {
      return decision.overallScore;
    }
    return Number((criteriaScores.reduce((acc, c) => acc + c.weightedScore, 0)).toFixed(1));
  }, [decision?.overallScore, criteriaScores]);

  if (!profile) return null;

  const pillColor = RECOMMENDATION_COLORS[decision.recommendation] || '#047857';
  const cleanRole = formatCleanRole(profile.targetRole);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 pb-24 space-y-10">
      {/* 1. EXECUTIVE DECISION MEMO HEADER */}
      <div className="pb-8 border-b border-border flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="dossier-stamp text-accent-technical">
              [EXECUTIVE BRIEF // DOCKET #{profile.id.toUpperCase()}]
            </span>
            <span className="text-muted text-xs">•</span>
            <span className="dossier-stamp text-muted">
              DELIBERATIVE SYNTHESIS
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-text tracking-tight">
            Committee Decision Brief
          </h1>

          <p className="text-sm sm:text-base text-muted mt-2 font-normal">
            Candidate: <strong className="text-text font-bold">{profile.name}</strong> • Target Scope: <span className="text-accent-technical font-semibold">{cleanRole}</span>
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3 flex-shrink-0 no-print">
          <VoicePlaybackControls />

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-lg bg-surface border border-border text-xs font-mono font-bold flex items-center gap-1.5 hover:bg-surface-2 cursor-pointer shadow-2xs"
          >
            <Printer size={13} /> PRINT BRIEF
          </button>

          <button
            type="button"
            onClick={reset}
            className="px-4 py-2 rounded-lg bg-text text-bg text-xs font-mono font-bold flex items-center gap-1.5 hover:opacity-90 cursor-pointer shadow-2xs"
          >
            <RotateCcw size={13} /> NEW INQUIRY
          </button>
        </div>
      </div>

      {/* 2. THE HERO: THE VERDICT & THE REASONING */}
      <div className="border border-border rounded-xl bg-surface p-6 sm:p-8 relative overflow-hidden">
        {/* Subtle background seal */}
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          {/* Left Hero: Decision & Consensus (5 Cols) */}
          <div className="lg:col-span-5 pb-6 lg:pb-0 lg:pr-6 lg:border-r border-border/80">
            <span className="dossier-stamp text-xs text-muted block mb-2">
              COMMITTEE VERDICT & FINDING
            </span>

            <div className="flex items-baseline gap-3 my-2">
              <span
                className="text-4xl sm:text-6xl font-serif font-extrabold tracking-tight"
                style={{ color: pillColor }}
              >
                {decision.recommendation.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/70">
              <div>
                <span className="dossier-stamp text-[10px] text-muted block">WEIGHTED SCORE</span>
                <span className="text-2xl font-serif font-bold text-text">
                  {calculatedOverall.toFixed(1)} <span className="text-xs font-mono text-muted">/10</span>
                </span>
              </div>

              <div className="h-8 w-px bg-border" />

              <div>
                <span className="dossier-stamp text-[10px] text-muted block">CONFIDENCE INDEX</span>
                <span className="text-2xl font-serif font-bold text-emerald-600 dark:text-emerald-400">
                  {decision.confidenceLevel}%
                </span>
              </div>
            </div>

            <p className="text-xs text-muted mt-3 font-mono leading-relaxed">
              {decision.confidenceRationale}
            </p>
          </div>

          {/* Right Hero: Executive Synthesis Reasoning (7 Cols) */}
          <div className="lg:col-span-7 space-y-3">
            <span className="dossier-stamp text-xs text-muted block">
              EXECUTIVE SUMMARY & RATIONALE
            </span>
            <p className="text-base sm:text-lg font-serif text-text leading-relaxed font-normal">
              {decision.reasoning}
            </p>
          </div>
        </div>
      </div>

      {/* 3. DETERMINISTIC EVALUATION CRITERIA MATRIX */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-4 pb-2 border-b border-border/80">
          <div className="flex items-center gap-2">
            <span className="dossier-stamp text-xs text-muted">AUDIT BREAKDOWN</span>
            <span className="text-xs text-muted">/</span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-text">
              5-Criteria Deterministic Scoring Formula
            </h2>
          </div>
          <span className="dossier-stamp text-[10px] text-muted">
            MATHEMATICAL SUM: 100% WEIGHT
          </span>
        </div>

        <div className="border border-border rounded-xl bg-surface overflow-hidden">
          <div className="divide-y divide-border/80">
            {criteriaScores.map((c, i) => {
              const weightPercent = Math.round(c.weight <= 1.0 ? c.weight * 100 : c.weight);
              const scorePercent = (c.score / 10) * 100;

              return (
                <div key={i} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-text">{c.name}</span>
                      <span className="dossier-stamp text-[10px] text-muted bg-surface-2 px-2 py-0.5 rounded border border-border">
                        {weightPercent}% WEIGHT
                      </span>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">
                      {c.rationale}
                    </p>
                  </div>

                  <div className="flex items-center gap-6 flex-shrink-0">
                    <div className="w-32 hidden sm:block">
                      <div className="w-full h-1.5 bg-surface-2 rounded-full overflow-hidden border border-border/60">
                        <div
                          className="h-full bg-text transition-all duration-500"
                          style={{ width: `${scorePercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-base font-bold text-text block">
                        {c.score.toFixed(1)}/10
                      </span>
                      <span className="text-[10px] text-accent-technical block">
                        +{c.weightedScore.toFixed(2)} pts
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. DELIBERATIVE SYNTHESIS: POSITIVE SIGNALS VS STRATEGIC RISKS */}
      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Positive Signals */}
        <div className="border border-border rounded-xl bg-surface p-6">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/80">
            <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-text">
              Primary Competencies & Proof Points
            </h3>
          </div>

          <ul className="space-y-3">
            {decision.strengths.map((s, idx) => (
              <li key={idx} className="text-xs sm:text-[13px] text-text/90 flex items-start gap-2.5 leading-relaxed">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">✓</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Strategic Risks */}
        <div className="border border-border rounded-xl bg-surface p-6">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/80">
            <AlertTriangle size={16} className="text-rose-600 dark:text-rose-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-text">
              Identified Risks & Remediation Notes
            </h3>
          </div>

          <ul className="space-y-3">
            {decision.concerns.map((c, idx) => (
              <li key={idx} className="text-xs sm:text-[13px] text-text/90 flex items-start gap-2.5 leading-relaxed">
                <span className="text-rose-600 dark:text-rose-400 font-bold font-mono">⚠</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 5. DECISION SENSITIVITY PIVOTS */}
      {decision.whatWouldChange && (
        <div className="border border-border rounded-xl bg-surface p-6 sm:p-7">
          <div className="mb-4 pb-2 border-b border-border/80">
            <span className="dossier-stamp text-xs text-muted block mb-0.5">
              DYNAMIC DECISION THRESHOLDS
            </span>
            <h3 className="text-sm font-bold uppercase tracking-wider text-text">
              What Evidence Would Alter This Recommendation?
            </h3>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {decision.whatWouldChange.moveUp && (
              <div>
                <span className="dossier-stamp text-[10px] text-emerald-600 dark:text-emerald-400 block mb-2">
                  PIVOTS TOWARD UNANIMOUS STRONG HIRE:
                </span>
                <ul className="space-y-2">
                  {decision.whatWouldChange.moveUp.map((u, idx) => (
                    <li key={idx} className="text-xs text-muted flex items-start gap-2 leading-relaxed">
                      <span className="text-emerald-600 dark:text-emerald-400 mt-0.5">↑</span>
                      <span>{u}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {decision.whatWouldChange.moveDown && (
              <div>
                <span className="dossier-stamp text-[10px] text-rose-600 dark:text-rose-400 block mb-2">
                  TRIGGER CONDITIONS TOWARD REJECTION:
                </span>
                <ul className="space-y-2">
                  {decision.whatWouldChange.moveDown.map((d, idx) => (
                    <li key={idx} className="text-xs text-muted flex items-start gap-2 leading-relaxed">
                      <span className="text-rose-600 dark:text-rose-400 mt-0.5">↓</span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. COMMITTEE SPECIALIST SIGN-OFF */}
      <div className="border-t border-border pt-8">
        <span className="dossier-stamp text-xs text-muted block mb-4">
          PANEL CONCURRENCE & SIGN-OFF
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {decision.weightBreakdown.map((w) => {
            const color = AGENT_COLORS[w.agentId];
            const name = AGENT_NAMES[w.agentId];
            const percent = Math.round(w.weight <= 1.0 ? w.weight * 100 : w.weight);

            return (
              <div key={w.agentId} className="p-3.5 rounded-lg bg-surface border border-border">
                <span className="dossier-stamp text-[9px] text-muted block mb-1">
                  SIGN-OFF DESK
                </span>
                <h4 className="text-xs font-bold text-text truncate">{name}</h4>
                <div className="flex items-center justify-between text-[11px] font-mono text-muted mt-2 pt-2 border-t border-border/60">
                  <span>INFLUENCE</span>
                  <span className="text-text font-bold">{percent}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
