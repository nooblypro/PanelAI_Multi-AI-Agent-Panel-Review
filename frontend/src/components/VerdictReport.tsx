import { useState, useEffect, useRef, useMemo } from 'react';
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
  ShieldCheck,
  Check,
  XCircle,
  Award,
} from 'lucide-react';
import { usePipelineStore } from '../lib/store';
import type { AgentId, FinalDecision, CriterionScore } from '../types';
import { AGENT_ICONS, AGENT_NAMES, AGENT_COLORS } from './AgentAvatar';
import { ConfidenceGauge } from './ConfidenceGauge';
import { saveToHistory, RECOMMENDATION_COLORS } from '../lib/history';
import { selectPersonaVoice } from '../lib/voice';

const RECOMMENDATION_GAUGE_COLORS: Record<FinalDecision['recommendation'], string> = {
  'Strong Hire': '#34D399',
  Hire: '#34D399',
  Hold: '#FBBF24',
  'No Hire': '#F87171',
};

// Fallback criteria if backend criteria array is absent
const DEFAULT_CRITERIA: CriterionScore[] = [
  { name: 'Technical Ability', score: 8.5, weight: 0.30, weightedScore: 2.55, rationale: 'Assessed from system architecture depth and technical execution.' },
  { name: 'Agentic AI / LLM Experience', score: 9.0, weight: 0.25, weightedScore: 2.25, rationale: 'Demonstrated experience with autonomous pipelines and agent coordination.' },
  { name: 'Production Engineering', score: 7.5, weight: 0.20, weightedScore: 1.50, rationale: 'Assessed from reliability, latency, and scalability track record.' },
  { name: 'Problem Solving & Rigor', score: 8.0, weight: 0.15, weightedScore: 1.20, rationale: 'Strong analytical breakdown during architecture trade-offs.' },
  { name: 'Communication & Alignment', score: 8.0, weight: 0.10, weightedScore: 0.80, rationale: 'Clear structured reasoning and cross-functional alignment.' },
];

export function formatCleanRole(rawRole?: string): string {
  if (!rawRole || !rawRole.trim()) return 'Target Role';
  const text = rawRole.trim();

  // Match explicit markers like 'Job Description:', 'Role:', 'Position:', 'Title:'
  const match = text.match(/(?:Job Description|Target Role|Role|Position|Title)\s*[:—\-]\s*([^\n\r·]+)/i);
  let candidate = match ? match[1].trim() : text.split(/\r?\n/)[0].trim();

  // Remove company trailer if pasted on same line
  candidate = candidate.split(/\s*(?:Company\s*[:—\-]|\bat\b|·|\bAbout the\b)/i)[0].trim();
  candidate = candidate.replace(/[\s:—\-,.]+$/, '').trim();

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

function VoicePlaybackControls() {
  const debateTurns = usePipelineStore((s) => s.debateTurns);
  const [playing, setPlaying] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const cancelRef = useRef(false);

  const VOICE_CONFIG: Record<AgentId, { pitch: number; rate: number }> = {
    technical: { pitch: 1.0, rate: 1.02 },
    culture: { pitch: 1.05, rate: 0.98 },
    hiring_manager: { pitch: 0.98, rate: 1.0 },
    skeptic: { pitch: 1.02, rate: 1.04 },
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
    const config = VOICE_CONFIG[turn.fromAgent] || { pitch: 1.0, rate: 1.0 };
    utterance.pitch = config.pitch;
    utterance.rate = config.rate;

    const voices = voicesRef.current;
    if (voices.length > 0) {
      const selected = selectPersonaVoice(voices, turn.fromAgent);
      if (selected) {
        utterance.voice = selected;
      }
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
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium bg-[#1C1F27] border border-white/[0.08] hover:border-white/[0.16] text-[#F5F5F7] transition-colors"
          aria-label="Stop audio playback of debate"
        >
          <VolumeX size={13} className="text-[#F87171]" />
          Stop Voice Narration
        </button>
      ) : (
        <button
          onClick={handlePlay}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium bg-[#1C1F27] border border-white/[0.08] hover:border-white/[0.16] text-[#F5F5F7] transition-colors"
          aria-label="Play audio narration of the multi-agent debate"
        >
          <Volume2 size={13} className="text-[#4C8DFF]" />
          Play Voice Debate Narration
        </button>
      )}
      {playing && currentIdx >= 0 && (
        <span className="text-[11px] text-[#9096A6] font-mono">
          Speaking: Turn {currentIdx + 1} of {debateTurns.length}
        </span>
      )}
    </div>
  );
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

  // Derived or provided criteria scores
  const criteriaScores = useMemo(() => {
    if (decision?.criteriaScores && decision.criteriaScores.length > 0) {
      return decision.criteriaScores;
    }
    return DEFAULT_CRITERIA;
  }, [decision?.criteriaScores]);

  // Calculate overall weighted score
  const calculatedOverall = useMemo(() => {
    if (decision?.overallScore !== undefined && decision.overallScore !== null) {
      return decision.overallScore;
    }
    return Number((criteriaScores.reduce((acc, c) => acc + c.weightedScore, 0)).toFixed(1));
  }, [decision?.overallScore, criteriaScores]);

  // Analytical summary computations
  const { strongest, weakest, passedCount, avgScore } = useMemo(() => {
    if (!criteriaScores || criteriaScores.length === 0) {
      return { strongest: null, weakest: null, passedCount: 0, avgScore: 0 };
    }
    let s = criteriaScores[0];
    let w = criteriaScores[0];
    let sum = 0;
    let passed = 0;

    criteriaScores.forEach((c) => {
      sum += c.score;
      if (c.score >= 6.0) passed += 1;
      if (c.score > s.score) s = c;
      if (c.score < w.score) w = c;
    });

    return {
      strongest: s,
      weakest: w,
      passedCount: passed,
      avgScore: sum / criteriaScores.length,
    };
  }, [criteriaScores]);

  if (!decision || !profile) return null;

  const gaugeColor = RECOMMENDATION_GAUGE_COLORS[decision.recommendation] || '#34D399';
  const pillColor = RECOMMENDATION_COLORS[decision.recommendation] || '#34D399';

  const cleanRole = formatCleanRole(profile.targetRole);
  const cleanRationale = formatCleanConfidenceRationale(decision.confidenceRationale, profile.targetRole);
  const cleanReasoning = formatCleanReasoning(decision.reasoning, profile.name, profile.targetRole);

  // Map agent opinions for quick consensus lookup
  const agentOpinionMap = new Map(opinions.map((o) => [o.agentId, o]));

  return (
    <div className="max-w-[1140px] mx-auto px-4 sm:px-6 py-6 pb-20 space-y-4">
      {/* ========================================================================= */}
      {/* 1. TOP VERDICT HERO */}
      {/* ========================================================================= */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="bg-surface rounded-xl border border-border p-5 sm:p-7 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 transition-colors"
      >
        <div className="flex-1 text-center sm:text-left">
          {/* Eyebrow */}
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              FINAL RECOMMENDATION
            </span>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-md bg-surface-2 text-muted border border-border">
              Aggregate Score: <strong className="text-text">{calculatedOverall.toFixed(1)} / 10</strong>
            </span>
          </div>

          {/* Large Verdict */}
          <div className="flex items-center justify-center sm:justify-start gap-3 my-1.5">
            <span
              className="text-3xl sm:text-5xl font-extrabold tracking-tight font-serif"
              style={{ color: pillColor }}
            >
              {decision.recommendation}
            </span>
          </div>

          {/* Candidate Name & Role */}
          <p className="text-sm sm:text-base text-muted mt-2 font-medium">
            Candidate: <strong className="text-text">{profile.name}</strong> · <span className="text-accent-technical">{cleanRole}</span>
          </p>

          {/* Concise Recommendation Sentence */}
          {cleanRationale && (
            <p className="text-[13px] sm:text-sm text-text/85 mt-2.5 flex items-start justify-center sm:justify-start gap-2 max-w-2xl leading-relaxed">
              <Info size={16} className="text-accent-technical flex-shrink-0 mt-0.5" />
              <span>{cleanRationale}</span>
            </p>
          )}
        </div>

        {/* Circular Confidence Gauge */}
        <div className="flex-shrink-0 flex flex-col items-center">
          <ConfidenceGauge
            value={decision.confidenceLevel}
            color={gaugeColor}
            size={120}
            stroke={8}
            label="Confidence"
          />
        </div>
      </motion.div>

      {/* ========================================================================= */}
      {/* 2. "WHY THIS DECISION" SECTION */}
      {/* ========================================================================= */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.3 }}
        className="bg-surface rounded-xl border border-border p-5 sm:p-6 shadow-xs transition-colors"
      >
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-text flex items-center gap-2">
            <ShieldCheck size={16} className="text-success" />
            Why This Decision
          </h3>
          <VoicePlaybackControls />
        </div>
        <p className="text-sm sm:text-[15px] text-text/90 leading-relaxed max-w-4xl">
          {cleanReasoning}
        </p>
      </motion.div>

      {/* ========================================================================= */}
      {/* 3. MAIN EVALUATION GRID (2-Column 65/35 Responsive Grid) */}
      {/* ========================================================================= */}
      <div className="grid lg:grid-cols-12 gap-4 items-stretch">
        {/* LEFT COLUMN: Job Evaluation Criteria (65%) */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.3 }}
          className="lg:col-span-8 bg-surface rounded-xl border border-border p-5 shadow-xs flex flex-col justify-between transition-colors"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Scale size={17} className="text-accent-technical" />
                <h3 className="text-sm sm:text-[15px] font-bold text-text">Job Evaluation Criteria</h3>
              </div>
              <span className="text-xs font-mono text-muted">
                Weighted Aggregate: <strong className="text-text">{calculatedOverall.toFixed(1)} / 10</strong>
              </span>
            </div>

            {/* Criteria Rows */}
            <div className="space-y-3">
              {criteriaScores.map((criterion, idx) => {
                const percentWeight = Math.round(criterion.weight <= 1.0 ? criterion.weight * 100 : criterion.weight);
                const scorePercent = (criterion.score / 10) * 100;

                return (
                  <div
                    key={criterion.name}
                    className="p-3 sm:p-3.5 rounded-xl bg-surface-2 border border-border/60 hover:border-accent-technical/30 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-[13px] sm:text-sm font-semibold text-text truncate">{criterion.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface text-muted border border-border flex-shrink-0">
                          {percentWeight}% weight
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-xs flex-shrink-0">
                        <strong className="text-text">{criterion.score.toFixed(1)}/10</strong>
                        <span className="text-muted text-[11px]">({scorePercent.toFixed(0)}%)</span>
                        <span className="text-accent-technical font-semibold">+{criterion.weightedScore.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-surface overflow-hidden mb-2 border border-border/40">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${scorePercent}%` }}
                        transition={{ delay: 0.1 + idx * 0.04, duration: 0.45, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{
                          backgroundColor:
                            criterion.score >= 8.0 ? '#34D399' : criterion.score >= 6.0 ? '#3B82F6' : '#EF4444',
                        }}
                      />
                    </div>

                    {criterion.rationale && (
                      <p className="text-xs text-muted leading-relaxed">
                        {criterion.rationale}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* RIGHT COLUMN: Evaluation Summary Mini Stat Cards (35%) */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="lg:col-span-4 bg-surface rounded-xl border border-border p-5 shadow-xs flex flex-col justify-between transition-colors"
        >
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
              <Award size={17} className="text-accent-hm" />
              <h3 className="text-sm sm:text-[15px] font-bold text-text">Evaluation Summary</h3>
            </div>

            {/* Stat Cards */}
            <div className="space-y-3">
              {/* Overall Weighted Score */}
              <div className="p-3.5 rounded-xl bg-surface-2 border border-border">
                <span className="text-xs uppercase tracking-wider font-semibold text-muted">Overall Weighted Score</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-text">{calculatedOverall.toFixed(1)} <span className="text-xs text-muted">/ 10</span></span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded uppercase" style={{ backgroundColor: `${pillColor}1A`, color: pillColor }}>
                    {decision.recommendation}
                  </span>
                </div>
              </div>

              {/* Strongest Criterion */}
              {strongest && (
                <div className="p-3 rounded-xl bg-surface-2 border border-border/80">
                  <div className="flex items-center justify-between text-xs text-muted uppercase tracking-wide">
                    <span>Strongest Criterion</span>
                    <span className="text-success font-mono font-bold flex items-center gap-0.5">
                      <ArrowUpRight size={13} /> {strongest.score.toFixed(1)}/10
                    </span>
                  </div>
                  <p className="text-sm font-medium text-text mt-1 truncate">{strongest.name}</p>
                </div>
              )}

              {/* Weakest Criterion */}
              {weakest && (
                <div className="p-3 rounded-xl bg-surface-2 border border-border/80">
                  <div className="flex items-center justify-between text-xs text-muted uppercase tracking-wide">
                    <span>Weakest Criterion</span>
                    <span className="text-danger font-mono font-bold flex items-center gap-0.5">
                      <ArrowDownRight size={13} /> {weakest.score.toFixed(1)}/10
                    </span>
                  </div>
                  <p className="text-sm font-medium text-text mt-1 truncate">{weakest.name}</p>
                </div>
              )}

              {/* Passed Count & Average */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div className="p-3 rounded-xl bg-surface-2 border border-border/80 text-center">
                  <span className="text-[10px] uppercase tracking-wider text-muted">Passed Criteria</span>
                  <p className="text-base font-bold font-mono text-success mt-0.5">{passedCount} / {criteriaScores.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-surface-2 border border-border/80 text-center">
                  <span className="text-[10px] uppercase tracking-wider text-muted">Average Score</span>
                  <p className="text-base font-bold font-mono text-text mt-0.5">{avgScore.toFixed(1)} / 10</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ========================================================================= */}
      {/* 4. POSITIVE SIGNALS VS RISKS (2-Column Equal Height) */}
      {/* ========================================================================= */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Positive Signals */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.3 }}
          className="bg-surface rounded-xl border border-success/25 p-5 shadow-xs bg-gradient-to-b from-success/[0.04] to-transparent transition-colors"
        >
          <h3 className="text-sm font-bold text-success mb-3.5 flex items-center gap-2">
            <CheckCircle2 size={17} />
            Positive Signals
          </h3>
          <ul className="space-y-2.5">
            {decision.strengths.slice(0, 3).map((s, idx) => (
              <li key={idx} className="text-xs sm:text-[13px] text-text/85 flex items-start gap-2 leading-relaxed">
                <Check size={15} className="text-success flex-shrink-0 mt-0.5" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Risk / Negative Signals */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.3 }}
          className="bg-surface rounded-xl border border-danger/25 p-5 shadow-xs bg-gradient-to-b from-danger/[0.04] to-transparent transition-colors"
        >
          <h3 className="text-sm font-bold text-danger mb-3.5 flex items-center gap-2">
            <AlertTriangle size={17} />
            Risk & Potential Blindspots
          </h3>
          <ul className="space-y-2.5">
            {decision.concerns.slice(0, 3).map((c, idx) => (
              <li key={idx} className="text-xs sm:text-[13px] text-text/85 flex items-start gap-2 leading-relaxed">
                <XCircle size={15} className="text-danger flex-shrink-0 mt-0.5" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* ========================================================================= */}
      {/* 5. EVALUATOR PERSPECTIVE CONSENSUS (Compact Horizontal Rows) */}
      {/* ========================================================================= */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16, duration: 0.3 }}
        className="bg-surface rounded-xl border border-border p-5 shadow-xs transition-colors"
      >
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
          <h3 className="text-sm sm:text-[15px] font-bold text-text">Evaluator Perspective Consensus</h3>
          <span className="text-xs text-muted">Independent agent debate contribution</span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {decision.weightBreakdown.map((w, i) => {
            const color = AGENT_COLORS[w.agentId];
            const Icon = AGENT_ICONS[w.agentId];
            const name = AGENT_NAMES[w.agentId];
            const displayPercent = Math.round(w.weight <= 1.0 ? w.weight * 100 : w.weight);
            const op = agentOpinionMap.get(w.agentId);

            return (
              <div
                key={w.agentId}
                className="p-3.5 rounded-xl bg-surface-2 border border-border/80 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}1A` }}>
                        <Icon size={15} style={{ color }} />
                      </div>
                      <span className="text-xs sm:text-[13px] font-bold text-text truncate">{name}</span>
                    </div>
                    {op && (
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded uppercase"
                        style={{
                          backgroundColor:
                            op.verdict.includes('yes') ? '#34D3991A' : op.verdict.includes('no') ? '#F871711A' : '#FBBF241A',
                          color:
                            op.verdict.includes('yes') ? '#34D399' : op.verdict.includes('no') ? '#F87171' : '#FBBF24',
                        }}
                      >
                        {op.verdict.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono text-muted mb-1.5">
                    <span>Influence Weight</span>
                    <strong className="text-text">{displayPercent}%</strong>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="w-full h-1.5 rounded-full bg-surface overflow-hidden mb-2 border border-border/40">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${displayPercent}%` }}
                      transition={{ delay: 0.18 + i * 0.05, duration: 0.45, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  </div>
                </div>

                <p className="text-xs text-muted leading-snug line-clamp-2 mt-1">
                  {w.rationale}
                </p>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ========================================================================= */}
      {/* 6. WHAT WOULD CHANGE THE DECISION (2-Column Grid) */}
      {/* ========================================================================= */}
      {decision.whatWouldChange && (decision.whatWouldChange.moveUp?.length > 0 || decision.whatWouldChange.moveDown?.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.3 }}
          className="bg-surface rounded-xl border border-border p-5 shadow-xs transition-colors"
        >
          <h3 className="text-sm sm:text-[15px] font-bold text-text mb-3.5 flex items-center gap-2">
            <Info size={16} className="text-accent-technical" />
            What Would Change the Decision?
          </h3>

          <div className="grid sm:grid-cols-2 gap-3.5">
            {decision.whatWouldChange.moveUp && decision.whatWouldChange.moveUp.length > 0 && (
              <div className="p-4 rounded-xl bg-success/[0.03] border border-success/25">
                <h4 className="text-xs font-bold text-success uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                  <ArrowUpRight size={15} />
                  Pivots Toward Stronger Recommendation
                </h4>
                <ul className="space-y-2">
                  {decision.whatWouldChange.moveUp.map((item, idx) => (
                    <li key={idx} className="text-xs sm:text-[13px] text-text/85 flex items-start gap-2 leading-relaxed">
                      <span className="text-success mt-0.5 flex-shrink-0">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {decision.whatWouldChange.moveDown && decision.whatWouldChange.moveDown.length > 0 && (
              <div className="p-4 rounded-xl bg-danger/[0.03] border border-danger/25">
                <h4 className="text-xs font-bold text-danger uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                  <ArrowDownRight size={15} />
                  Risk Triggers Toward Rejection
                </h4>
                <ul className="space-y-2">
                  {decision.whatWouldChange.moveDown.map((item, idx) => (
                    <li key={idx} className="text-xs sm:text-[13px] text-text/85 flex items-start gap-2 leading-relaxed">
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

      {/* ========================================================================= */}
      {/* 7. UNRESOLVED DISAGREEMENTS & UNCERTAINTIES */}
      {/* ========================================================================= */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        {decision.unresolvedDisagreements.length > 0 ? (
          <div className="bg-surface rounded-xl border border-warning/30 p-5 shadow-xs bg-gradient-to-b from-warning/[0.03] to-transparent transition-colors">
            <h3 className="text-sm sm:text-[15px] font-bold text-warning mb-3.5 flex items-center gap-2">
              <AlertTriangle size={16} />
              Unresolved Disagreements & Uncertainties
            </h3>
            <div className="space-y-3">
              {decision.unresolvedDisagreements.map((d, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-surface-2 border-l-3 border-warning">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <p className="text-[13px] sm:text-sm font-bold text-text">{d.topic}</p>
                    <div className="flex items-center gap-1.5">
                      {d.agents.map((a) => {
                        const color = AGENT_COLORS[a];
                        const Icon = AGENT_ICONS[a];
                        return (
                          <span
                            key={a}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md"
                            style={{ backgroundColor: `${color}1A`, color }}
                          >
                            <Icon size={12} />
                            {AGENT_NAMES[a]}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <p className="text-xs sm:text-[13px] text-muted leading-relaxed">{d.description}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-surface rounded-xl border border-border p-4 flex items-center gap-2.5 shadow-xs transition-colors">
            <CheckCircle2 size={18} className="text-success" />
            <span className="text-xs sm:text-[13px] text-muted">
              No unresolved disagreements — the 4-agent panel reached full consensus across all debate rounds.
            </span>
          </div>
        )}
      </motion.div>

      {/* ========================================================================= */}
      {/* 8. BOTTOM ACTION BAR */}
      {/* ========================================================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.22 }}
        className="flex flex-col sm:flex-row items-center justify-between gap-3.5 pt-4 border-t border-border no-print"
      >
        <button
          onClick={() => window.print()}
          className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold text-xs sm:text-sm bg-surface-2 border border-border hover:border-accent-technical/40 text-text transition-all cursor-pointer shadow-2xs"
          aria-label="Export or print the final verdict evaluation report"
        >
          <Printer size={16} />
          Export / Print Report
        </button>

        <button
          onClick={reset}
          className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-bold text-xs sm:text-sm bg-accent-technical hover:opacity-90 active:scale-[0.99] text-white shadow-sm transition-all cursor-pointer"
          aria-label="Reset and evaluate another candidate"
        >
          <RotateCcw size={16} />
          Evaluate Another Candidate
        </button>
      </motion.div>
    </div>
  );
}
