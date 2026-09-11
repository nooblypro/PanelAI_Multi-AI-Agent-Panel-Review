import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Handshake,
  Zap,
  Target,
  Flag,
  RefreshCw,
  ArrowRight,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Square,
  Volume2,
  Loader2,
  ArrowDown,
  ArrowUp,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { usePipelineStore } from '../lib/store';
import type { AgentId, DebateTurn } from '../types';
import { AGENT_ICONS, AGENT_NAMES, AGENT_COLORS } from './AgentAvatar';
import { VoiceDebateEngine, type VoicePlayerState } from '../lib/voice';

const STANCE_CONFIG: Record<
  DebateTurn['stance'],
  { label: string; icon: any; color: string }
> = {
  agree: { label: 'CONCURS', icon: Handshake, color: '#047857' },
  disagree: { label: 'DISSENTS', icon: Zap, color: '#BE123C' },
  challenge: { label: 'INTERROGATES', icon: Target, color: '#B45309' },
  concede: { label: 'CONCEDES', icon: Flag, color: '#686C78' },
  revise: { label: 'REVISES POSITION', icon: RefreshCw, color: '#1D4ED8' },
};

const SAMPLE_DEBATE_TURNS: DebateTurn[] = [
  {
    id: 'turn-1',
    fromAgent: 'skeptic',
    stance: 'challenge',
    content: 'The candidate claims zero-downtime routing across distributed LLM services. However, looking at the transcript, they only cite latency micro-staggering. How did their architecture ensure graceful degradation during total upstream provider outages?',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'turn-2',
    fromAgent: 'technical',
    respondingTo: {
      agentId: 'skeptic',
      excerpt: 'How did their architecture ensure graceful degradation during total upstream provider outages?',
    },
    stance: 'agree',
    content: 'The interview transcript lines 14-22 explicitly corroborate this: they deployed pre-warmed websocket circuits with fallback heuristics that automatically switched to secondary model providers upon 3 consecutive timeout spikes.',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'turn-3',
    fromAgent: 'culture',
    stance: 'agree',
    content: 'I agree with the Technical Architect. The candidate repeatedly emphasized cross-functional transparency, refusing to deploy black-box routing until both product and support teams understood the failure recovery semantics.',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'turn-4',
    fromAgent: 'skeptic',
    stance: 'revise',
    content: 'Given the verbatim evidence regarding the multi-provider fallback circuit, my concern regarding outage resilience is resolved. I am raising my score from 7.2 to 8.4.',
    scoreChange: { from: 7.2, to: 8.4 },
    timestamp: new Date().toISOString(),
  },
  {
    id: 'turn-5',
    fromAgent: 'hiring_manager',
    stance: 'agree',
    content: 'With the Skeptic Auditor satisfied and the technical claim validated against the transcript, the candidate satisfies our top quartile bar for Staff AI Systems Engineer.',
    scoreChange: { from: 8.0, to: 8.8 },
    timestamp: new Date().toISOString(),
  },
];

function SoundWave({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-0.5 h-3 px-1">
      <motion.span
        animate={{ height: ['3px', '12px', '4px', '10px', '3px'] }}
        transition={{ repeat: Infinity, duration: 1.0, ease: 'easeInOut' }}
        className="w-0.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      <motion.span
        animate={{ height: ['8px', '3px', '12px', '5px', '8px'] }}
        transition={{ repeat: Infinity, duration: 0.8, ease: 'easeInOut', delay: 0.15 }}
        className="w-0.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      <motion.span
        animate={{ height: ['10px', '5px', '3px', '12px', '10px'] }}
        transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut', delay: 0.3 }}
        className="w-0.5 rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

export function DebateThread() {
  const debateTurns = usePipelineStore((s) => s.debateTurns);
  const debateStatus = usePipelineStore((s) => s.debateStatus);
  const debateError = usePipelineStore((s) => s.debateError);
  const revealedTurns = usePipelineStore((s) => s.revealedTurns);
  const revealAllTurns = usePipelineStore((s) => s.revealAllTurns);
  const setRevealedTurns = usePipelineStore((s) => s.setRevealedTurns);
  const startDebate = usePipelineStore((s) => s.startDebate);
  const startVerdict = usePipelineStore((s) => s.startVerdict);
  const verdictStatus = usePipelineStore((s) => s.verdictStatus);

  const scrollRef = useRef<HTMLDivElement>(null);
  const voiceEngineRef = useRef<VoiceDebateEngine | null>(null);
  const [voiceState, setVoiceState] = useState<VoicePlayerState>({
    status: 'idle',
    currentTurnIndex: -1,
    currentTurn: null,
    totalTurns: 0,
    activeSpeaker: null,
    isPlaying: false,
    isPaused: false,
    error: null,
  });

  useEffect(() => {
    const engine = new VoiceDebateEngine((turnIndex) => {
      setRevealedTurns(Math.max(turnIndex, usePipelineStore.getState().revealedTurns));
    });

    const unsubscribe = engine.subscribe((s) => {
      setVoiceState(s);
    });

    voiceEngineRef.current = engine;

    return () => {
      unsubscribe();
      engine.destroy();
      voiceEngineRef.current = null;
    };
  }, [setRevealedTurns]);

  useEffect(() => {
    if (voiceEngineRef.current && debateTurns.length > 0) {
      voiceEngineRef.current.setTurns(debateTurns);
    }
  }, [debateTurns]);

  const allRevealed = revealedTurns >= debateTurns.length && debateTurns.length > 0;
  const isLoading = debateStatus === 'running' && debateTurns.length === 0;
  const isError = debateStatus === 'error';

  useEffect(() => {
    if (voiceState.currentTurnIndex >= 0) {
      const element = document.getElementById(`hearing-entry-${voiceState.currentTurnIndex}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [voiceState.currentTurnIndex, revealedTurns]);

  const handlePlayVoice = () => {
    if (voiceEngineRef.current) {
      if (voiceState.currentTurnIndex >= 0 && voiceState.isPaused) {
        voiceEngineRef.current.play();
      } else {
        voiceEngineRef.current.play(0);
      }
    }
  };

  const handlePauseVoice = () => {
    if (voiceEngineRef.current) {
      voiceEngineRef.current.pause();
    }
  };

  const handleSkipTurn = () => {
    if (voiceEngineRef.current) {
      voiceEngineRef.current.skipTurn();
    }
  };

  const handleStopVoice = () => {
    if (voiceEngineRef.current) {
      voiceEngineRef.current.stop();
    }
  };

  const handleLoadOfflineDebate = () => {
    usePipelineStore.setState({
      debateTurns: SAMPLE_DEBATE_TURNS,
      debateStatus: 'done',
      debateError: null,
      revealedTurns: SAMPLE_DEBATE_TURNS.length,
    });
  };

  const handleConcludeHearing = async () => {
    try {
      await startVerdict();
      // If store caught error but backend was offline, advance stage
      if (usePipelineStore.getState().verdictStatus === 'error') {
        usePipelineStore.setState({ stage: 'verdict', verdictStatus: 'done' });
      }
    } catch {
      usePipelineStore.setState({ stage: 'verdict', verdictStatus: 'done' });
    }
  };

  const activeSpeakerName = voiceState.activeSpeaker ? AGENT_NAMES[voiceState.activeSpeaker] : null;
  const activeSpeakerColor = voiceState.activeSpeaker ? AGENT_COLORS[voiceState.activeSpeaker] : 'var(--text)';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 pb-24 space-y-8">
      {/* Header */}
      <div className="pb-8 border-b border-border flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="dossier-stamp text-accent-technical">
              [PROCEEDINGS // STAGE 04]
            </span>
            <span className="text-muted text-xs">•</span>
            <span className="dossier-stamp text-muted">
              ADVERSARIAL CROSS-EXAMINATION
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-text tracking-tight">
            Hearing Deliberation Transcript
          </h1>

          <p className="text-sm sm:text-base text-muted mt-3 max-w-3xl leading-relaxed font-normal">
            Specialists challenge unverified claims, cross-examine evidence against candidate dialogue, and adjust ratings in structured debate before final synthesis.
          </p>
        </div>

        {allRevealed && (
          <button
            type="button"
            onClick={handleConcludeHearing}
            disabled={verdictStatus === 'running'}
            className="flex-shrink-0 bg-text text-bg hover:opacity-90 active:scale-[0.99] py-3.5 px-6 rounded-lg font-bold text-xs uppercase tracking-wider font-mono flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-40"
          >
            {verdictStatus === 'running' ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>SYNTHESIZING VERDICT...</span>
              </>
            ) : (
              <>
                <Sparkles size={15} />
                <span>CONCLUDE HEARING & VIEW VERDICT</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        )}
      </div>

      {/* Backend Offline Fallback Alert */}
      {isError && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-text">Local Backend Server Not Running</p>
              <p className="text-xs text-muted mt-0.5">
                The Python API at <code className="font-mono text-text">http://localhost:8000</code> is offline. You can preview sample hearing transcript rounds below:
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLoadOfflineDebate}
            className="flex-shrink-0 px-4 py-2 rounded-lg bg-text text-bg text-xs font-mono uppercase font-bold hover:opacity-90 transition-all cursor-pointer"
          >
            Preview Sample Hearing
          </button>
        </motion.div>
      )}

      {/* Audio Hearing Cockpit Strip */}
      {debateTurns.length > 0 && (
        <div className="border border-border rounded-xl bg-surface p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="dossier-stamp text-xs text-muted">
              AUDIO RECORD:
            </span>

            {voiceState.isPlaying ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-serif" style={{ color: activeSpeakerColor }}>
                  {activeSpeakerName}
                </span>
                <SoundWave color={activeSpeakerColor} />
                <span className="text-xs text-muted">testifying...</span>
              </div>
            ) : (
              <span className="text-xs text-muted font-normal">
                {debateTurns.length} hearing statements recorded
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {voiceState.isPlaying ? (
              <button
                type="button"
                onClick={handlePauseVoice}
                className="px-3.5 py-1.5 rounded bg-surface-2 border border-border text-xs font-mono font-bold flex items-center gap-1.5 hover:bg-surface-3 cursor-pointer"
              >
                <Pause size={13} /> PAUSE AUDIO
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePlayVoice}
                className="px-3.5 py-1.5 rounded bg-text text-bg text-xs font-mono font-bold flex items-center gap-1.5 hover:opacity-90 cursor-pointer"
              >
                <Play size={13} fill="currentColor" /> PLAY HEARING AUDIO
              </button>
            )}

            <button
              type="button"
              onClick={handleSkipTurn}
              disabled={voiceState.currentTurnIndex >= debateTurns.length - 1}
              className="p-1.5 rounded bg-surface-2 border border-border text-muted hover:text-text disabled:opacity-30 cursor-pointer"
              title="Next speaker"
            >
              <SkipForward size={14} />
            </button>

            {(voiceState.isPlaying || voiceState.isPaused) && (
              <button
                type="button"
                onClick={handleStopVoice}
                className="p-1.5 rounded bg-surface-2 border border-border text-muted hover:text-rose-500 cursor-pointer"
                title="Stop playback"
              >
                <Square size={13} />
              </button>
            )}

            {!allRevealed && (
              <button
                type="button"
                onClick={revealAllTurns}
                className="dossier-stamp text-xs text-accent-technical hover:underline ml-2 cursor-pointer"
              >
                UNFOLD ENTIRE RECORD
              </button>
            )}
          </div>
        </div>
      )}

      {/* Hearing Transcript Entries */}
      <div className="space-y-6">
        {debateTurns.slice(0, Math.max(revealedTurns, voiceState.currentTurnIndex + 1)).map((turn, idx) => {
          const Icon = AGENT_ICONS[turn.fromAgent];
          const name = AGENT_NAMES[turn.fromAgent];
          const color = AGENT_COLORS[turn.fromAgent];
          const stance = STANCE_CONFIG[turn.stance] || STANCE_CONFIG.agree;
          const StanceIcon = stance.icon;
          const isSpeaking = voiceState.currentTurnIndex === idx && (voiceState.isPlaying || voiceState.isPaused);

          return (
            <motion.div
              key={turn.id}
              id={`hearing-entry-${idx}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`p-6 sm:p-7 rounded-xl border transition-all ${
                isSpeaking
                  ? 'bg-surface border-text shadow-md ring-1 ring-text'
                  : 'bg-surface border-border hover:border-border-strong'
              }`}
              style={{ borderLeft: `4px solid ${color}` }}
            >
              {/* Entry Meta Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-border/70">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded flex items-center justify-center font-mono text-xs font-bold"
                    style={{ backgroundColor: `${color}18`, color }}
                  >
                    <Icon size={16} />
                  </div>
                  <div>
                    <span className="font-serif font-bold text-sm sm:text-base text-text block">
                      {name}
                    </span>
                    <span className="dossier-stamp text-[9px] text-muted">
                      STATEMENT #{String(idx + 1).padStart(2, '0')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="dossier-stamp text-[10px] px-2.5 py-1 rounded flex items-center gap-1.5"
                    style={{ backgroundColor: `${stance.color}15`, color: stance.color }}
                  >
                    <StanceIcon size={12} />
                    {stance.label}
                  </span>

                  {turn.scoreChange && (
                    <span className="dossier-stamp text-[10px] px-2.5 py-1 rounded bg-accent-technical/10 text-accent-technical border border-accent-technical/20 font-bold flex items-center gap-1">
                      {turn.scoreChange.to > turn.scoreChange.from ? (
                        <ArrowUp size={12} />
                      ) : (
                        <ArrowDown size={12} />
                      )}
                      SCORE ADJUSTED: {turn.scoreChange.from} ➔ {turn.scoreChange.to}
                    </span>
                  )}
                </div>
              </div>

              {/* Reply Citation */}
              {turn.respondingTo && (
                <div className="mb-3.5 pl-4 border-l-2 border-border/80 text-xs text-muted">
                  <span className="dossier-stamp text-[9px] block mb-0.5">
                    IN CROSS-EXAMINATION OF {AGENT_NAMES[turn.respondingTo.agentId].toUpperCase()}:
                  </span>
                  <p className="font-mono italic text-text/80">
                    &ldquo;{turn.respondingTo.excerpt}&rdquo;
                  </p>
                </div>
              )}

              {/* Argument Content */}
              <p className="text-sm sm:text-[15px] text-text/95 leading-relaxed font-normal">
                {turn.content}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
