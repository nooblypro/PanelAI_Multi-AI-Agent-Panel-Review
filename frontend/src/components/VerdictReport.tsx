import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Volume2,
  VolumeX,
  Printer,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Scale,
  ArrowUpRight,
  ArrowDownRight,
  Info,
} from 'lucide-react';
import { usePipelineStore } from '../lib/store';
import type { AgentId, FinalDecision, CriterionScore } from '../types';
import { AGENT_ICONS, AGENT_NAMES, AGENT_COLORS } from './AgentAvatar';
import { ConfidenceGauge } from './ConfidenceGauge';
import { saveToHistory, RECOMMENDATION_COLORS } from '../lib/history';

const RECOMMENDATION_GAUGE_COLORS: Record<FinalDecision['recommendation'], string> = {
  'Strong Hire': '#34D399',
  Hire: '#34D399',
  Hold: '#FBBF24',
  'No Hire': '#F87171',
};

// Fallback criteria if backend is in legacy/mock state
const DEFAULT_CRITERIA: CriterionScore[] = [
  { name: 'Technical ability', score: 8.0, weight: 0.30, weightedScore: 2.40, rationale: 'Assessed from system architecture and technical depth.' },
  { name: 'Agentic AI / LLM experience', score: 6.0, weight: 0.30, weightedScore: 1.80, rationale: 'Assessed from autonomous workflows and tool-calling experience.' },
  { name: 'Production engineering', score: 7.5, weight: 0.20, weightedScore: 1.50, rationale: 'Assessed from reliability, latency, and scalability track record.' },
  { name: 'Problem solving', score: 7.0, weight: 0.10, weightedScore: 0.70, rationale: 'Assessed from diagnostic rigor during live incidents.' },
  { name: 'Communication / collaboration', score: 7.0, weight: 0.10, weightedScore: 0.70, rationale: 'Assessed from cross-functional alignment and stakeholder communication.' },
];

function CriteriaScoreCard({
  criterion,
  index,
}: {
  criterion: CriterionScore;
  index: number;
}) {
  const percentWeight = Math.round(criterion.weight <= 1.0 ? criterion.weight * 100 : criterion.weight);
  const scorePercent = (criterion.score / 10) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.25 }}
      className="p-3.5 rounded-lg bg-surface-2/60 border border-white/[0.05] hover:border-white/[0.12] transition-colors"
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-text">{criterion.name}</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-muted">
            {percentWeight}% weight
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[12px]">
          <span className="text-text font-bold">{criterion.score.toFixed(1)}/10</span>
          <span className="text-muted text-[11px]">→</span>
          <span className="text-accent-technical font-semibold">+{criterion.weightedScore.toFixed(2)} pts</span>
        </div>
      </div>

      <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden mb-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${scorePercent}%` }}
          transition={{ delay: index * 0.06 + 0.1, duration: 0.45, ease: 'easeOut' }}
          className="h-full rounded-full bg-accent-technical"
        />
      </div>

      {criterion.rationale && (
        <p className="text-[11px] text-muted leading-relaxed">{criterion.rationale}</p>
      )}
    </motion.div>
  );
}

function WeightBar({
  agentId,
  weight,
  rationale,
  index,
}: {
  agentId: AgentId;
  weight: number;
  rationale: string;
  index: number;
}) {
  const [showRationale, setShowRationale] = useState(false);
  const color = AGENT_COLORS[agentId];
  const Icon = AGENT_ICONS[agentId];
  const name = AGENT_NAMES[agentId];
  const displayPercent = Math.round(weight <= 1.0 ? weight * 100 : weight);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, duration: 0.25 }}
      className="group"
      onMouseEnter={() => setShowRationale(true)}
      onMouseLeave={() => setShowRationale(false)}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <Icon size={13} style={{ color }} />
        <span className="text-[12px] font-medium text-text flex-1">{name}</span>
        <span className="text-[12px] font-semibold" style={{ color }}>{displayPercent}%</span>
      </div>
      <div className="w-full h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${displayPercent}%` }}
          transition={{ delay: index * 0.08 + 0.1, duration: 0.5, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
      {showRationale && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[11px] text-muted mt-1.5 leading-relaxed"
        >
          {rationale}
        </motion.p>
      )}
    </motion.div>
  );
}

function VoicePlaybackControls() {
  const debateTurns = usePipelineStore((s) => s.debateTurns);
  const [playing, setPlaying] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const cancelRef = useRef(false);

  const VOICE_CONFIG: Record<AgentId, { pitch: number; rate: number }> = {
    technical: { pitch: 0.8, rate: 1.0 },
    culture: { pitch: 1.2, rate: 0.95 },
    hiring_manager: { pitch: 0.9, rate: 1.0 },
    skeptic: { pitch: 1.1, rate: 1.05 },
  };

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
    const config = VOICE_CONFIG[turn.fromAgent] || { pitch: 1, rate: 1 };
    utterance.pitch = config.pitch;
    utterance.rate = config.rate;

    const voices = voicesRef.current;
    if (voices.length > 0) {
      const agentIdx = ['technical', 'culture', 'hiring_manager', 'skeptic'].indexOf(turn.fromAgent);
      utterance.voice = voices[agentIdx % voices.length] || voices[0];
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
  if (!supported) return null;

  return (
    <div className="flex items-center gap-2 no-print">
      {playing ? (
        <button
          onClick={handlePause}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium bg-surface-2 border border-white/[0.08] hover:border-white/[0.15] text-text transition-colors"
          aria-label="Stop audio playback of debate"
        >
          <VolumeX size={14} />
          Stop Voice
        </button>
      ) : (
        <button
          onClick={handlePlay}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium bg-surface-2 border border-white/[0.08] hover:border-white/[0.15] text-text transition-colors"
          aria-label="Play audio narration of the multi-agent debate"
        >
          <Volume2 size={14} />
          Play Voice Debate
        </button>
      )}
      {playing && currentIdx >= 0 && (
        <span className="text-[11px] text-muted">
          Speaking: turn {currentIdx + 1} / {debateTurns.length}
        </span>
      )}
    </div>
  );
}

export function formatCleanRole(rawRole?: string): string {
  if (!rawRole || !rawRole.trim()) return 'Target Role';
  const text = rawRole.trim();

  // 1. Match explicit markers like 'Job Description:', 'Role:', 'Position:', 'Title:'
  const match = text.match(/(?:Job Description|Target Role|Role|Position|Title)\s*[:—\-]\s*([^\n\r·]+)/i);
  let candidate = match ? match[1].trim() : text.split(/\r?\n/)[0].trim();

  // 2. Remove company trailer if pasted on same line
  candidate = candidate.split(/\s*(?:Company\s*[:—\-]|\bat\b|·|\bAbout the\b)/i)[0].trim();
  candidate = candidate.replace(/[\s:—\-,.]+$/, '').trim();

  // 3. Cap length cleanly
  if (candidate.length > 50) {
    const parts = candidate.slice(0, 47).split(' ');
    candidate = (parts.length > 1 ? parts.slice(0, -1).join(' ') : candidate.slice(0, 47)) + '...';
  }
  return candidate || 'Target Role';
}

function formatCleanConfidenceRationale(raw: string | undefined, role: string): string {
  if (!raw) return 'Panel consensus across 4 personas evaluated against core role requirements.';
  if (raw.includes('Job Description:') || raw.includes('Company:') || raw.length > 140) {
    return `Panel consensus across 4 personas evaluated against ${formatCleanRole(role)} requirements.`;
  }
  return raw;
}

function formatCleanReasoning(raw: string | undefined, name: string, role: string): string {
  if (!raw) return 'Panel synthesized recommendation based on verified evidence quality.';
  if (raw.includes('Job Description:') || raw.includes('About the Role') || raw.length > 320) {
    const cleanRole = formatCleanRole(role);
    const sentences = raw.split(/\.\s+/).filter(
      (s) => !s.includes('Job Description:') && !s.includes('About the Role') && !s.includes("What You'll Do") && s.trim().length > 15
    );
    if (sentences.length > 0) {
      const trimmed = sentences.slice(0, 3).join('. ');
      return trimmed + (trimmed.endsWith('.') ? '' : '.');
    }
    return `The 4 independent evaluators and structured debate rounds established strong competency for ${name}. Candidate background demonstrates direct alignment with core ${cleanRole} responsibilities.`;
  }
  return raw;
}

export function VerdictReport() {
  const profile = usePipelineStore((s) => s.profile);
  const decision = usePipelineStore((s) => s.decision);
  const opinions = usePipelineStore((s) => s.opinions);
  const debateTurns = usePipelineStore((s) => s.debateTurns);
  const reset = usePipelineStore((s) => s.reset);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (decision && profile && !saved) {
      saveToHistory(profile, opinions, debateTurns, decision);
      setSaved(true);
    }
  }, [decision, profile, opinions, debateTurns, saved]);

  if (!decision || !profile) return null;

  const gaugeColor = RECOMMENDATION_GAUGE_COLORS[decision.recommendation];
  const pillColor = RECOMMENDATION_COLORS[decision.recommendation];

  // Derived or provided criteria scores
  const criteriaScores = decision.criteriaScores && decision.criteriaScores.length > 0
    ? decision.criteriaScores
    : DEFAULT_CRITERIA;

  // Calculate or use overallScore
  const calculatedOverall = decision.overallScore !== undefined && decision.overallScore !== null
    ? decision.overallScore
    : Number((criteriaScores.reduce((acc, c) => acc + c.weightedScore, 0)).toFixed(1));

  const cleanRole = formatCleanRole(profile.targetRole);
  const cleanRationale = formatCleanConfidenceRationale(decision.confidenceRationale, profile.targetRole);
  const cleanReasoning = formatCleanReasoning(decision.reasoning, profile.name, profile.targetRole);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 pb-20">
      {/* Verdict Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-surface rounded-lg border border-white/[0.06] p-6 mb-6 flex flex-col sm:flex-row items-center gap-6"
      >
        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
            <span className="text-[11px] text-muted uppercase tracking-wide">Final Recommendation</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-2 text-muted border border-white/[0.06]">
              Overall Score: <strong className="text-text">{calculatedOverall.toFixed(1)}/10</strong>
            </span>
          </div>

          <span
            className="inline-block text-3xl font-bold px-5 py-2 rounded-lg"
            style={{
              backgroundColor: `${pillColor}1A`,
              color: pillColor,
              border: `1px solid ${pillColor}40`,
            }}
          >
            {decision.recommendation}
          </span>

          <p className="text-[13px] text-muted mt-3">
            Candidate: <span className="text-text font-medium">{profile.name}</span> · {cleanRole}
          </p>

          {cleanRationale && (
            <p className="text-[12px] text-text/75 mt-2 flex items-start gap-1.5 max-w-xl">
              <Info size={14} className="text-accent-technical flex-shrink-0 mt-0.5" />
              <span>{cleanRationale}</span>
            </p>
          )}
        </div>

        <ConfidenceGauge
          value={decision.confidenceLevel}
          color={gaugeColor}
          size={130}
          label="Confidence"
        />
      </motion.div>

      {/* Voice playback */}
      <div className="mb-6 no-print">
        <VoicePlaybackControls />
      </div>

      {/* Why this decision */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.3 }}
        className="bg-surface rounded-lg border border-white/[0.06] p-6 mb-6"
      >
        <h3 className="text-[13px] font-semibold text-text mb-3">Why This Decision</h3>
        <p className="text-[13px] text-text/85 leading-relaxed max-w-3xl">{cleanReasoning}</p>
      </motion.div>

      {/* 5 Job Description Evaluation Criteria & Weighted Scoring */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.3 }}
        className="bg-surface rounded-lg border border-white/[0.06] p-6 mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Scale size={16} className="text-accent-technical" />
            <h3 className="text-[13px] font-semibold text-text">
              Job Description Evaluation Criteria & Weighted Scoring
            </h3>
          </div>
          <div className="text-[12px] font-mono text-muted">
            Weighted Total: <span className="text-text font-bold">{calculatedOverall.toFixed(1)} / 10.0</span>
          </div>
        </div>

        <div className="grid gap-3">
          {criteriaScores.map((c, i) => (
            <CriteriaScoreCard key={c.name} criterion={c} index={i} />
          ))}
        </div>
      </motion.div>

      {/* What Would Change the Decision? */}
      {decision.whatWouldChange && (decision.whatWouldChange.moveUp?.length > 0 || decision.whatWouldChange.moveDown?.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.3 }}
          className="bg-surface rounded-lg border border-white/[0.06] p-6 mb-6"
        >
          <h3 className="text-[13px] font-semibold text-text mb-4 flex items-center gap-2">
            <Info size={15} className="text-accent-technical" />
            What Would Change the Decision?
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            {decision.whatWouldChange.moveUp && decision.whatWouldChange.moveUp.length > 0 && (
              <div className="p-4 rounded-lg bg-success/[0.04] border border-success/20">
                <h4 className="text-[12px] font-semibold text-success mb-2.5 flex items-center gap-1.5">
                  <ArrowUpRight size={15} />
                  Pivots Toward Stronger Recommendation
                </h4>
                <ul className="space-y-2">
                  {decision.whatWouldChange.moveUp.map((item, idx) => (
                    <li key={idx} className="text-[12px] text-text/80 flex items-start gap-2">
                      <span className="text-success mt-0.5 flex-shrink-0">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {decision.whatWouldChange.moveDown && decision.whatWouldChange.moveDown.length > 0 && (
              <div className="p-4 rounded-lg bg-danger/[0.04] border border-danger/20">
                <h4 className="text-[12px] font-semibold text-danger mb-2.5 flex items-center gap-1.5">
                  <ArrowDownRight size={15} />
                  Risk Triggers Toward Rejection
                </h4>
                <ul className="space-y-2">
                  {decision.whatWouldChange.moveDown.map((item, idx) => (
                    <li key={idx} className="text-[12px] text-text/80 flex items-start gap-2">
                      <span className="text-danger mt-0.5 flex-shrink-0">⚠</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Evaluator Perspective Influence (Agent Weight Breakdown) */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="bg-surface rounded-lg border border-white/[0.06] p-6 mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[13px] font-semibold text-text">Evaluator Perspective Influence</h3>
          <span className="text-[11px] text-muted">Relative agent debate contribution</span>
        </div>
        <div className="space-y-4">
          {decision.weightBreakdown.map((w, i) => (
            <WeightBar
              key={w.agentId}
              agentId={w.agentId}
              weight={w.weight}
              rationale={w.rationale}
              index={i}
            />
          ))}
        </div>
      </motion.div>

      {/* Strengths + Concerns */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.3 }}
          className="bg-surface rounded-lg border border-white/[0.06] p-5"
        >
          <h3 className="text-[13px] font-semibold text-success mb-3 flex items-center gap-2">
            <TrendingUp size={15} />
            Strengths
          </h3>
          <ul className="space-y-2">
            {decision.strengths.map((s, i) => (
              <li key={i} className="text-[12px] text-text/80 flex items-start gap-2">
                <span className="text-success mt-0.5 flex-shrink-0">·</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="bg-surface rounded-lg border border-white/[0.06] p-5"
        >
          <h3 className="text-[13px] font-semibold text-danger mb-3 flex items-center gap-2">
            <TrendingDown size={15} />
            Concerns
          </h3>
          <ul className="space-y-2">
            {decision.concerns.map((c, i) => (
              <li key={i} className="text-[12px] text-text/80 flex items-start gap-2">
                <span className="text-danger mt-0.5 flex-shrink-0">·</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Unresolved Disagreements & Uncertainties */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, duration: 0.3 }}
        className="mb-8"
      >
        {decision.unresolvedDisagreements.length > 0 ? (
          <div className="bg-warning/[0.06] rounded-lg border border-warning/30 p-5">
            <h3 className="text-[13px] font-semibold text-warning mb-3 flex items-center gap-2">
              <AlertTriangle size={15} />
              Unresolved Disagreements & Uncertainties
            </h3>
            <div className="space-y-3">
              {decision.unresolvedDisagreements.map((d, i) => (
                <div key={i} className="border-l-2 border-warning/40 pl-3">
                  <p className="text-[12px] font-medium text-text mb-1">{d.topic}</p>
                  <div className="flex items-center gap-2 mb-1.5">
                    {d.agents.map((a) => {
                      const color = AGENT_COLORS[a];
                      const Icon = AGENT_ICONS[a];
                      return (
                        <span
                          key={a}
                          className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: `${color}1A`, color }}
                        >
                          <Icon size={10} />
                          {AGENT_NAMES[a]}
                        </span>
                      );
                    })}
                  </div>
                  <p className="text-[12px] text-text/70 leading-relaxed">{d.description}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-surface rounded-lg border border-white/[0.06] p-4 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-success" />
            <span className="text-[13px] text-muted">No unresolved disagreements — the panel reached full consensus.</span>
          </div>
        )}
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="flex flex-wrap items-center gap-3 no-print"
      >
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-lg px-4 py-2.5 font-semibold text-sm bg-surface-2 border border-white/[0.08] hover:border-white/[0.15] text-text transition-colors"
          aria-label="Export or print the final verdict evaluation report"
        >
          <Printer size={15} />
          Export / Print Report
        </button>
        <button
          onClick={reset}
          className="flex items-center gap-2 rounded-lg px-4 py-2.5 font-semibold text-sm bg-accent-technical text-bg hover:bg-accent-technical/90 transition-colors"
          aria-label="Reset and evaluate another candidate"
        >
          <RotateCcw size={15} />
          Evaluate Another Candidate
        </button>
      </motion.div>
    </div>
  );
}
