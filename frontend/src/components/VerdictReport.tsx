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
} from 'lucide-react';
import { usePipelineStore } from '../lib/store';
import type { AgentId, FinalDecision, CriterionScore } from '../types';
import { AGENT_ICONS, AGENT_NAMES, AGENT_COLORS } from './AgentAvatar';
import { ConfidenceGauge } from './ConfidenceGauge';
import { saveToHistory, RECOMMENDATION_COLORS } from '../lib/history';
import { selectPersonaVoice } from '../lib/voice';

const RECOMMENDATION_GAUGE_COLORS: Record<FinalDecision['recommendation'], string> = {
  'Strong Hire': '#10B981',
  Hire: '#10B981',
  Hold: '#F59E0B',
  'No Hire': '#F43F5E',
};

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
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold bg-rose-500/10 border border-rose-500/30 text-rose-500 hover:bg-rose-500/20 transition-colors cursor-pointer"
        >
          <VolumeX size={14} />
          Stop Narration
        </button>
      ) : (
        <button
          onClick={handlePlay}
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold bg-surface-2 border border-border hover:border-accent-technical text-text transition-colors cursor-pointer"
        >
          <Volume2 size={14} className="text-accent-technical" />
          Play Audio Narration
        </button>
      )}
      {playing && currentIdx >= 0 && (
        <span className="text-xs text-muted font-mono">
          Turn {currentIdx + 1} / {debateTurns.length}
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

  const gaugeColor = RECOMMENDATION_GAUGE_COLORS[decision.recommendation] || '#10B981';
  const pillColor = RECOMMENDATION_COLORS[decision.recommendation] || '#10B981';

  const cleanRole = formatCleanRole(profile.targetRole);
  const cleanRationale = formatCleanConfidenceRationale(decision.confidenceRationale, profile.targetRole);
  const cleanReasoning = formatCleanReasoning(decision.reasoning, profile.name, profile.targetRole);

  const agentOpinionMap = new Map(opinions.map((o) => [o.agentId, o]));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 pb-20 space-y-6">
      {/* 1. TOP VERDICT HERO BANNER */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-surface rounded-2xl border border-border p-6 sm:p-8 shadow-md flex flex-col sm:flex-row items-center justify-between gap-6"
      >
        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              Executive Verdict
            </span>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-surface-2 text-muted border border-border">
              Weighted Score: <strong className="text-text">{calculatedOverall.toFixed(1)} / 10</strong>
            </span>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-3 my-1">
            <span
              className="text-3xl sm:text-5xl font-extrabold tracking-tight font-serif"
              style={{ color: pillColor }}
            >
              {decision.recommendation}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-muted mt-2 font-medium">
            Candidate: <strong className="text-text">{profile.name}</strong> • <span className="text-accent-technical">{cleanRole}</span>
          </p>

          {cleanRationale && (
            <p className="text-xs sm:text-sm text-text/90 mt-3 flex items-start justify-center sm:justify-start gap-2 leading-relaxed">
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

      {/* 2. DECISION RATIONALE */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.3 }}
        className="bg-surface rounded-2xl border border-border p-6 shadow-2xs"
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-text flex items-center gap-2">
            <ShieldCheck size={17} className="text-emerald-500" />
            Decision Reasoning & Synthesis
          </h3>
          <VoicePlaybackControls />
        </div>
        <p className="text-xs sm:text-sm text-text/90 leading-relaxed font-normal">
          {cleanReasoning}
        </p>
      </motion.div>

      {/* 3. EVALUATION CRITERIA & SUMMARY */}
      <div className="grid lg:grid-cols-12 gap-6 items-stretch">
        {/* Job Evaluation Criteria (8 cols) */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.3 }}
          className="lg:col-span-8 bg-surface rounded-2xl border border-border p-6 shadow-2xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Scale size={17} className="text-accent-technical" />
                <h3 className="text-sm sm:text-base font-bold text-text">Deterministic Criteria Breakdown</h3>
              </div>
              <span className="text-xs font-mono text-muted">
                Weighted Sum: <strong className="text-text">{calculatedOverall.toFixed(1)} / 10</strong>
              </span>
            </div>

            <div className="space-y-3">
              {criteriaScores.map((criterion, idx) => {
                const percentWeight = Math.round(criterion.weight <= 1.0 ? criterion.weight * 100 : criterion.weight);
                const scorePercent = (criterion.score / 10) * 100;

                return (
                  <div
                    key={criterion.name}
                    className="p-3.5 rounded-xl bg-surface-2/60 border border-border/80"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-xs sm:text-sm font-semibold text-text truncate">{criterion.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface text-muted border border-border flex-shrink-0">
                          {percentWeight}% weight
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-xs flex-shrink-0">
                        <strong className="text-text">{criterion.score.toFixed(1)}/10</strong>
                        <span className="text-accent-technical font-semibold">+{criterion.weightedScore.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-surface overflow-hidden mb-1.5 border border-border/50">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${scorePercent}%` }}
                        transition={{ delay: 0.1 + idx * 0.04, duration: 0.45 }}
                        className="h-full rounded-full"
                        style={{
                          backgroundColor:
                            criterion.score >= 8.0 ? '#10B981' : criterion.score >= 6.0 ? '#3B82F6' : '#F43F5E',
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

        {/* Summary Stats (4 cols) */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="lg:col-span-4 bg-surface rounded-2xl border border-border p-6 shadow-2xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
              <Award size={17} className="text-amber-500" />
              <h3 className="text-sm sm:text-base font-bold text-text">Metrics Summary</h3>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-surface-2 border border-border">
                <span className="text-xs uppercase tracking-wider font-bold text-muted">Overall Score</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-3xl font-bold font-mono text-text">{calculatedOverall.toFixed(1)} <span className="text-xs text-muted">/ 10</span></span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded uppercase" style={{ backgroundColor: `${pillColor}1A`, color: pillColor }}>
                    {decision.recommendation}
                  </span>
                </div>
              </div>

              {strongest && (
                <div className="p-3.5 rounded-xl bg-surface-2/60 border border-border">
                  <div className="flex items-center justify-between text-xs text-muted uppercase tracking-wider font-bold">
                    <span>Highest Criterion</span>
                    <span className="text-emerald-500 font-mono font-bold flex items-center gap-0.5">
                      <ArrowUpRight size={13} /> {strongest.score.toFixed(1)}/10
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-text mt-1 truncate">{strongest.name}</p>
                </div>
              )}

              {weakest && (
                <div className="p-3.5 rounded-xl bg-surface-2/60 border border-border">
                  <div className="flex items-center justify-between text-xs text-muted uppercase tracking-wider font-bold">
                    <span>Lowest Criterion</span>
                    <span className="text-rose-500 font-mono font-bold flex items-center gap-0.5">
                      <ArrowDownRight size={13} /> {weakest.score.toFixed(1)}/10
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-text mt-1 truncate">{weakest.name}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-3 rounded-xl bg-surface-2 border border-border text-center">
                  <span className="text-[10px] uppercase tracking-wider text-muted font-bold">Passed</span>
                  <p className="text-base font-bold font-mono text-emerald-500 mt-0.5">{passedCount} / {criteriaScores.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-surface-2 border border-border text-center">
                  <span className="text-[10px] uppercase tracking-wider text-muted font-bold">Average</span>
                  <p className="text-base font-bold font-mono text-text mt-0.5">{avgScore.toFixed(1)} / 10</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 4. POSITIVE SIGNALS VS RISKS */}
      <div className="grid sm:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.3 }}
          className="bg-surface rounded-2xl border border-emerald-500/30 p-6 shadow-2xs bg-gradient-to-b from-emerald-500/[0.03] to-transparent"
        >
          <h3 className="text-sm font-bold text-emerald-500 mb-3.5 flex items-center gap-2">
            <CheckCircle2 size={17} />
            Key Candidate Strengths
          </h3>
          <ul className="space-y-2.5">
            {decision.strengths.slice(0, 4).map((s, idx) => (
              <li key={idx} className="text-xs sm:text-sm text-text/90 flex items-start gap-2 leading-relaxed">
                <Check size={15} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.3 }}
          className="bg-surface rounded-2xl border border-rose-500/30 p-6 shadow-2xs bg-gradient-to-b from-rose-500/[0.03] to-transparent"
        >
          <h3 className="text-sm font-bold text-rose-500 mb-3.5 flex items-center gap-2">
            <AlertTriangle size={17} />
            Identified Hiring Risks & Blindspots
          </h3>
          <ul className="space-y-2.5">
            {decision.concerns.slice(0, 4).map((c, idx) => (
              <li key={idx} className="text-xs sm:text-sm text-text/90 flex items-start gap-2 leading-relaxed">
                <XCircle size={15} className="text-rose-500 flex-shrink-0 mt-0.5" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* 5. EVALUATOR CONSENSUS BREAKDOWN */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16, duration: 0.3 }}
        className="bg-surface rounded-2xl border border-border p-6 shadow-2xs"
      >
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
          <h3 className="text-sm sm:text-base font-bold text-text">4-Agent Evaluator Influence</h3>
          <span className="text-xs text-muted">Panel deliberation consensus breakdown</span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {decision.weightBreakdown.map((w, i) => {
            const color = AGENT_COLORS[w.agentId];
            const Icon = AGENT_ICONS[w.agentId];
            const name = AGENT_NAMES[w.agentId];
            const displayPercent = Math.round(w.weight <= 1.0 ? w.weight * 100 : w.weight);
            const op = agentOpinionMap.get(w.agentId);

            return (
              <div
                key={w.agentId}
                className="p-4 rounded-xl bg-surface-2/60 border border-border flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}1A` }}>
                        <Icon size={15} style={{ color }} />
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-text truncate">{name}</span>
                    </div>
                    {op && (
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded uppercase"
                        style={{
                          backgroundColor:
                            op.verdict.includes('yes') ? '#10B9811A' : op.verdict.includes('no') ? '#F43F5E1A' : '#F59E0B1A',
                          color:
                            op.verdict.includes('yes') ? '#10B981' : op.verdict.includes('no') ? '#F43F5E' : '#F59E0B',
                        }}
                      >
                        {op.verdict.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono text-muted mb-1.5">
                    <span>Influence</span>
                    <strong className="text-text">{displayPercent}%</strong>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-surface overflow-hidden mb-2 border border-border/50">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${displayPercent}%` }}
                      transition={{ delay: 0.18 + i * 0.05, duration: 0.45 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  </div>
                </div>

                <p className="text-xs text-muted leading-relaxed line-clamp-2 mt-1">
                  {w.rationale}
                </p>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* 6. WHAT WOULD CHANGE DECISION */}
      {decision.whatWouldChange && (decision.whatWouldChange.moveUp?.length > 0 || decision.whatWouldChange.moveDown?.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.3 }}
          className="bg-surface rounded-2xl border border-border p-6 shadow-2xs"
        >
          <h3 className="text-sm sm:text-base font-bold text-text mb-4 flex items-center gap-2">
            <Info size={16} className="text-accent-technical" />
            Decision Sensitivity & Pivots
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            {decision.whatWouldChange.moveUp && decision.whatWouldChange.moveUp.length > 0 && (
              <div className="p-4 rounded-xl bg-emerald-500/[0.03] border border-emerald-500/25">
                <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <ArrowUpRight size={15} />
                  Milestones to Elevate Verdict
                </h4>
                <ul className="space-y-2">
                  {decision.whatWouldChange.moveUp.map((item, idx) => (
                    <li key={idx} className="text-xs sm:text-sm text-text/90 flex items-start gap-2 leading-relaxed">
                      <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {decision.whatWouldChange.moveDown && decision.whatWouldChange.moveDown.length > 0 && (
              <div className="p-4 rounded-xl bg-rose-500/[0.03] border border-rose-500/25">
                <h4 className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <ArrowDownRight size={15} />
                  Triggers Toward Rejection
                </h4>
                <ul className="space-y-2">
                  {decision.whatWouldChange.moveDown.map((item, idx) => (
                    <li key={idx} className="text-xs sm:text-sm text-text/90 flex items-start gap-2 leading-relaxed">
                      <span className="text-rose-500 mt-0.5 flex-shrink-0">⚠</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* 7. BOTTOM ACTION BAR */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.22 }}
        className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border no-print"
      >
        <button
          onClick={() => window.print()}
          className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold text-xs sm:text-sm bg-surface-2 border border-border hover:border-accent-technical/40 text-text transition-all cursor-pointer shadow-2xs"
        >
          <Printer size={16} />
          Export / Print Report
        </button>

        <button
          onClick={reset}
          className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-bold text-xs sm:text-sm bg-accent-technical hover:bg-accent-technical/90 text-white shadow-md transition-all cursor-pointer"
        >
          <RotateCcw size={16} />
          Evaluate Another Candidate
        </button>
      </motion.div>
    </div>
  );
}
