import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Printer,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { usePipelineStore } from '../lib/store';
import type { AgentId, FinalDecision } from '../types';
import { AGENT_ICONS, AGENT_NAMES, AGENT_COLORS } from './AgentAvatar';
import { ConfidenceGauge } from './ConfidenceGauge';
import { saveToHistory, RECOMMENDATION_COLORS } from '../lib/history';

const RECOMMENDATION_GAUGE_COLORS: Record<FinalDecision['recommendation'], string> = {
  'Strong Hire': '#34D399',
  Hire: '#34D399',
  Hold: '#FBBF24',
  'No Hire': '#F87171',
};

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
        <span className="text-[12px] font-semibold" style={{ color }}>{weight}%</span>
      </div>
      <div className="w-full h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${weight}%` }}
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

  // Voice assignments per agent
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
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakTurn = useCallback((idx: number) => {
    if (cancelRef.current || idx >= debateTurns.length) {
      setPlaying(false);
      setCurrentIdx(-1);
      return;
    }

    const turn = debateTurns[idx];
    const config = VOICE_CONFIG[turn.fromAgent];
    const utterance = new SpeechSynthesisUtterance(turn.content);
    utterance.pitch = config.pitch;
    utterance.rate = config.rate;

    // Try to assign distinct voices
    const voices = voicesRef.current;
    if (voices.length > 0) {
      const voiceIdx = Object.keys(VOICE_CONFIG).indexOf(turn.fromAgent) % voices.length;
      utterance.voice = voices[voiceIdx];
    }

    utterance.onend = () => {
      if (!cancelRef.current) {
        setCurrentIdx(idx);
        speakTurn(idx + 1);
      }
    };

    utterance.onerror = () => {
      if (!cancelRef.current) {
        speakTurn(idx + 1);
      }
    };

    setCurrentIdx(idx);
    window.speechSynthesis.speak(utterance);
  }, [debateTurns, VOICE_CONFIG]);

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
        >
          <VolumeX size={14} />
          Stop Voice
        </button>
      ) : (
        <button
          onClick={handlePlay}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium bg-surface-2 border border-white/[0.08] hover:border-white/[0.15] text-text transition-colors"
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 pb-20">
      {/* Verdict banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-surface rounded-lg border border-white/[0.06] p-6 mb-6 flex flex-col sm:flex-row items-center gap-6"
      >
        <div className="flex-1 text-center sm:text-left">
          <p className="text-[11px] text-muted uppercase tracking-wide mb-2">Final Recommendation</p>
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
            Candidate: <span className="text-text font-medium">{profile.name}</span> · {profile.targetRole}
          </p>
        </div>
        <ConfidenceGauge value={decision.confidenceLevel} color={gaugeColor} size={130} label="Confidence" />
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
        <p className="text-[14px] text-text/85 leading-[1.6]">{decision.reasoning}</p>
      </motion.div>

      {/* Weight breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="bg-surface rounded-lg border border-white/[0.06] p-6 mb-6"
      >
        <h3 className="text-[13px] font-semibold text-text mb-4">Weight Breakdown</h3>
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
          transition={{ delay: 0.15, duration: 0.3 }}
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

      {/* Unresolved disagreements */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.3 }}
        className="mb-8"
      >
        {decision.unresolvedDisagreements.length > 0 ? (
          <div className="bg-warning/[0.06] rounded-lg border border-warning/30 p-5">
            <h3 className="text-[13px] font-semibold text-warning mb-3 flex items-center gap-2">
              <AlertTriangle size={15} />
              Unresolved Disagreements
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
        transition={{ delay: 0.3 }}
        className="flex flex-wrap items-center gap-3 no-print"
      >
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-lg px-4 py-2.5 font-semibold text-sm bg-surface-2 border border-white/[0.08] hover:border-white/[0.15] text-text transition-colors"
        >
          <Printer size={15} />
          Export / Print Report
        </button>
        <button
          onClick={reset}
          className="flex items-center gap-2 rounded-lg px-4 py-2.5 font-semibold text-sm bg-accent-technical text-bg hover:bg-accent-technical/90 transition-colors"
        >
          <RotateCcw size={15} />
          Evaluate Another Candidate
        </button>
      </motion.div>
    </div>
  );
}
