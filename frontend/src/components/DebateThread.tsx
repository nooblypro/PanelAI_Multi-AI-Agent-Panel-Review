import { useState, useEffect, useRef, useMemo } from 'react';
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
  VolumeX,
  Loader2,
  ArrowDown,
  ArrowUp,
  AlertCircle,
  Radio,
  Sparkles,
} from 'lucide-react';
import { usePipelineStore } from '../lib/store';
import type { AgentId, DebateTurn } from '../types';
import { AGENT_ICONS, AGENT_NAMES, AGENT_COLORS } from './AgentAvatar';
import { VoiceDebateEngine, type VoicePlayerState } from '../lib/voice';

const STANCE_ICON_MAP = {
  agree: Handshake,
  disagree: Zap,
  challenge: Target,
  concede: Flag,
  revise: RefreshCw,
} as const;

const STANCE_COLORS: Record<DebateTurn['stance'], string> = {
  agree: '#34D399',
  disagree: '#F87171',
  challenge: '#F5B841',
  concede: '#9096A6',
  revise: '#4C8DFF',
};

function ReplyConnector({ fromAgent, excerpt }: { fromAgent: AgentId; excerpt: string }) {
  const color = AGENT_COLORS[fromAgent];
  return (
    <div className="mb-2 ml-10 sm:ml-12 relative">
      <div
        className="absolute left-[-12px] top-0 bottom-0 w-px"
        style={{ backgroundColor: `${color}40` }}
      />
      <div
        className="rounded-md px-3 py-2 border-l-2 bg-surface-2/80"
        style={{ borderColor: `${color}60` }}
      >
        <p className="text-[10px] text-muted mb-0.5">
          Replying to <span style={{ color }} className="font-semibold">{AGENT_NAMES[fromAgent]}</span>
        </p>
        <p className="font-mono text-[11px] text-text/75 italic leading-relaxed">
          &ldquo;{excerpt}&rdquo;
        </p>
      </div>
    </div>
  );
}

function ScoreChangeChip({ from, to }: { from: number; to: number }) {
  const isUp = to > from;
  const color = isUp ? '#34D399' : '#F87171';
  const Icon = isUp ? ArrowUp : ArrowDown;

  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold"
      style={{ backgroundColor: `${color}1A`, color }}
    >
      <Icon size={11} />
      Score {from} → {to}
    </span>
  );
}

function SoundWave({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-0.5 h-3.5 px-1">
      <motion.span
        animate={{ height: ['4px', '14px', '6px', '12px', '4px'] }}
        transition={{ repeat: Infinity, duration: 1.0, ease: 'easeInOut' }}
        className="w-0.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      <motion.span
        animate={{ height: ['8px', '4px', '14px', '6px', '8px'] }}
        transition={{ repeat: Infinity, duration: 0.8, ease: 'easeInOut', delay: 0.15 }}
        className="w-0.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      <motion.span
        animate={{ height: ['12px', '6px', '4px', '14px', '12px'] }}
        transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut', delay: 0.3 }}
        className="w-0.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      <motion.span
        animate={{ height: ['6px', '12px', '8px', '4px', '6px'] }}
        transition={{ repeat: Infinity, duration: 0.9, ease: 'easeInOut', delay: 0.45 }}
        className="w-0.5 rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

function DebateBubble({
  turn,
  index,
  isSpeaking,
  onPlayTurn,
}: {
  turn: DebateTurn;
  index: number;
  isSpeaking: boolean;
  onPlayTurn?: () => void;
}) {
  const Icon = AGENT_ICONS[turn.fromAgent];
  const name = AGENT_NAMES[turn.fromAgent];
  const color = AGENT_COLORS[turn.fromAgent];
  const StanceIcon = STANCE_ICON_MAP[turn.stance];
  const stanceColor = STANCE_COLORS[turn.stance];

  return (
    <motion.div
      id={`debate-turn-${index}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`flex gap-3 transition-all duration-300 ${
        isSpeaking
          ? 'p-2 rounded-xl bg-surface-2 border border-accent-technical/40 shadow-md ring-2 ring-accent-technical/20'
          : 'p-1'
      }`}
    >
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-transform"
        style={{
          backgroundColor: `${color}1A`,
          border: `1.5px solid ${color}40`,
          boxShadow: isSpeaking ? `0 0 12px ${color}50` : 'none',
        }}
      >
        <Icon size={18} style={{ color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-semibold" style={{ color }}>{name}</span>
            <span
              className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{ backgroundColor: `${stanceColor}1A`, color: stanceColor }}
            >
              <StanceIcon size={10} />
              {turn.stance}
            </span>
            {turn.scoreChange && (
              <ScoreChangeChip from={turn.scoreChange.from} to={turn.scoreChange.to} />
            )}
          </div>

          <div className="flex items-center gap-2">
            {isSpeaking ? (
              <div className="flex items-center gap-1 text-[10px] font-medium text-accent-technical">
                <SoundWave color={color} />
                <span className="hidden sm:inline">Speaking</span>
              </div>
            ) : onPlayTurn ? (
              <button
                onClick={onPlayTurn}
                title="Play this persona voice turn"
                className="opacity-0 group-hover:opacity-100 hover:opacity-100 p-1 text-muted hover:text-accent-technical rounded transition-opacity"
              >
                <Volume2 size={13} />
              </button>
            ) : null}
          </div>
        </div>

        {/* Reply connector */}
        {turn.respondingTo && (
          <ReplyConnector fromAgent={turn.respondingTo.agentId} excerpt={turn.respondingTo.excerpt} />
        )}

        {/* Message bubble */}
        <div
          className="rounded-xl px-4 py-3 bg-surface border border-border/80 shadow-xs transition-colors"
          style={{
            borderLeft: `3px solid ${color}`,
          }}
        >
          <p className="text-[13px] text-text/90 leading-relaxed">{turn.content}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function DebateThread() {
  const debateTurns = usePipelineStore((s) => s.debateTurns);
  const debateStatus = usePipelineStore((s) => s.debateStatus);
  const debateError = usePipelineStore((s) => s.debateError);
  const revealedTurns = usePipelineStore((s) => s.revealedTurns);
  const revealNextTurn = usePipelineStore((s) => s.revealNextTurn);
  const revealAllTurns = usePipelineStore((s) => s.revealAllTurns);
  const setRevealedTurns = usePipelineStore((s) => s.setRevealedTurns);
  const startDebate = usePipelineStore((s) => s.startDebate);
  const startVerdict = usePipelineStore((s) => s.startVerdict);
  const verdictStatus = usePipelineStore((s) => s.verdictStatus);

  const [loadingRound, setLoadingRound] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize Voice Engine
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
      // Sync revealed turns with voice
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

  // Update turns in engine when debate turns load
  useEffect(() => {
    if (voiceEngineRef.current && debateTurns.length > 0) {
      voiceEngineRef.current.setTurns(debateTurns);
    }
  }, [debateTurns]);

  const allRevealed = revealedTurns >= debateTurns.length && debateTurns.length > 0;
  const isLoading = debateStatus === 'running' && debateTurns.length === 0;
  const isError = debateStatus === 'error';

  // Loading rounds ticker
  useEffect(() => {
    if (isLoading) {
      setLoadingRound(1);
      const timer = setInterval(() => {
        setLoadingRound((r) => (r < 10 ? r + 1 : r));
      }, 4500);
      return () => clearInterval(timer);
    }
  }, [isLoading]);

  // Auto-scroll when active speaking turn changes or revealed turns increment
  useEffect(() => {
    if (voiceState.currentTurnIndex >= 0) {
      const element = document.getElementById(`debate-turn-${voiceState.currentTurnIndex}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } else if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
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

  const handleReplayTurn = () => {
    if (voiceEngineRef.current) {
      voiceEngineRef.current.replayCurrentTurn();
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

  const handleRestartVoice = () => {
    if (voiceEngineRef.current) {
      voiceEngineRef.current.restart();
    }
  };

  const activeSpeakerName = voiceState.activeSpeaker ? AGENT_NAMES[voiceState.activeSpeaker] : null;
  const activeSpeakerColor = voiceState.activeSpeaker ? AGENT_COLORS[voiceState.activeSpeaker] : '#4C8DFF';
  const ActiveSpeakerIcon = voiceState.activeSpeaker ? AGENT_ICONS[voiceState.activeSpeaker] : Volume2;

  const currentTurnNumber = voiceState.currentTurnIndex >= 0 ? voiceState.currentTurnIndex + 1 : 0;
  const totalTurnsCount = debateTurns.length;
  const progressPercent = totalTurnsCount > 0 && currentTurnNumber > 0 ? (currentTurnNumber / totalTurnsCount) * 100 : 0;

  return (
    <div className="max-w-[820px] mx-auto px-4 sm:px-6 py-6 pb-20 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold font-serif text-text tracking-tight flex items-center gap-2">
            <span>Multi-Agent Panel Debate</span>
            <span className="text-[10px] font-sans font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent-technical/10 text-accent-technical border border-accent-technical/20">
              Interactive Audio & Text
            </span>
          </h2>
          <p className="text-xs text-muted mt-1">
            Agents cross-examine each other's independent opinions and resolve disagreements before the final verdict.
          </p>
        </div>
      </div>

      {/* Error Notice */}
      {isError && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} className="flex-shrink-0" />
            <div>
              <p className="text-[13px] font-semibold">Debate Generation Interrupted</p>
              <p className="text-[12px] opacity-90">{debateError || 'A connection issue occurred while deliberating.'}</p>
            </div>
          </div>
          <button
            onClick={() => startDebate()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-danger text-white text-[12px] font-medium hover:bg-danger/90 transition-colors w-fit cursor-pointer"
          >
            <RotateCcw size={13} />
            Retry Debate
          </button>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* AI VOICE DEBATE COCKPIT CONTROL BAR */}
      {/* ========================================================================= */}
      {debateTurns.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface rounded-xl border border-border shadow-sm p-4 transition-colors no-print"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
            {/* Left: Active Persona & Speaking Indicator */}
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center relative transition-all"
                style={{
                  backgroundColor: `${activeSpeakerColor}1A`,
                  border: `1.5px solid ${activeSpeakerColor}40`,
                }}
              >
                <ActiveSpeakerIcon size={20} style={{ color: activeSpeakerColor }} />
                {voiceState.isPlaying && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span
                      className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                      style={{ backgroundColor: activeSpeakerColor }}
                    />
                    <span
                      className="relative inline-flex rounded-full h-3 w-3"
                      style={{ backgroundColor: activeSpeakerColor }}
                    />
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-text">
                    {voiceState.isPlaying || voiceState.isPaused ? (
                      <span className="flex items-center gap-1.5">
                        <span style={{ color: activeSpeakerColor }}>{activeSpeakerName}</span>
                        <span className="text-muted font-normal">is speaking</span>
                      </span>
                    ) : (
                      'AI Voice Debate'
                    )}
                  </span>

                  {voiceState.isPlaying && <SoundWave color={activeSpeakerColor} />}
                </div>

                <p className="text-[11px] text-muted flex items-center gap-2 mt-0.5">
                  <span>
                    {currentTurnNumber > 0 ? `Turn ${currentTurnNumber} of ${totalTurnsCount}` : `${totalTurnsCount} debate turns ready`}
                  </span>
                  {voiceState.status === 'synthesizing' && (
                    <span className="text-accent-technical flex items-center gap-1 text-[10px]">
                      <Loader2 size={10} className="animate-spin" /> Synthesizing voice…
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Right: Audio Playback Control Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {voiceState.isPlaying ? (
                <button
                  onClick={handlePauseVoice}
                  aria-label="Pause voice debate"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 border border-border hover:border-accent-technical/40 text-text text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  <Pause size={14} className="text-accent-technical" />
                  <span>Pause</span>
                </button>
              ) : (
                <button
                  onClick={handlePlayVoice}
                  aria-label="Start or resume voice debate"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-accent-technical hover:opacity-90 active:scale-[0.99] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <Play size={14} fill="currentColor" />
                  <span>{voiceState.isPaused ? 'Resume Voice' : 'Play Voice Debate'}</span>
                </button>
              )}

              {/* Replay current turn */}
              <button
                onClick={handleReplayTurn}
                disabled={voiceState.currentTurnIndex < 0}
                aria-label="Replay current turn"
                title="Replay current turn"
                className="p-2 rounded-lg bg-surface-2 border border-border hover:border-accent-technical/40 text-muted hover:text-text text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <RotateCcw size={14} />
              </button>

              {/* Skip to next turn */}
              <button
                onClick={handleSkipTurn}
                disabled={voiceState.currentTurnIndex < 0 || voiceState.currentTurnIndex >= totalTurnsCount - 1}
                aria-label="Skip to next speaking turn"
                title="Skip to next speaking turn"
                className="p-2 rounded-lg bg-surface-2 border border-border hover:border-accent-technical/40 text-muted hover:text-text text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <SkipForward size={14} />
              </button>

              {/* Stop */}
              {(voiceState.isPlaying || voiceState.isPaused) && (
                <button
                  onClick={handleStopVoice}
                  aria-label="Stop voice playback"
                  title="Stop voice playback"
                  className="p-2 rounded-lg bg-surface-2 border border-border hover:border-danger/40 text-muted hover:text-danger text-xs transition-all cursor-pointer"
                >
                  <Square size={14} />
                </button>
              )}

              {/* Skip to end / reveal all button */}
              {!allRevealed && (
                <button
                  onClick={revealAllTurns}
                  aria-label="Reveal all debate text turns"
                  className="text-[11px] text-muted hover:text-text px-2 py-1 underline transition-colors cursor-pointer ml-1"
                >
                  Reveal all text
                </button>
              )}
            </div>
          </div>

          {/* Bottom Audio Progress Bar */}
          <div className="w-full h-1 bg-surface-2 rounded-full overflow-hidden mt-3 border border-border/50">
            <motion.div
              initial={false}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ backgroundColor: activeSpeakerColor }}
            />
          </div>
        </motion.div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-20 bg-surface rounded-xl border border-border">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={30} className="animate-spin text-accent-technical" />
            <p className="text-[13px] font-semibold text-text">Multi-Agent Deliberation in Progress</p>
            <p className="text-[12px] text-muted">Persona debate rounds are compiling (Round {loadingRound})…</p>
          </div>
        </div>
      )}

      {/* Debate Messages Stream */}
      {debateTurns.length > 0 && (
        <div
          ref={scrollRef}
          className="space-y-4 max-h-[64vh] overflow-y-auto scrollbar-thin pr-1 sm:pr-2"
        >
          <AnimatePresence>
            {debateTurns.slice(0, Math.max(revealedTurns, voiceState.currentTurnIndex + 1)).map((turn, i) => (
              <DebateBubble
                key={turn.id}
                turn={turn}
                index={i}
                isSpeaking={voiceState.currentTurnIndex === i && (voiceState.isPlaying || voiceState.isPaused)}
                onPlayTurn={() => {
                  if (voiceEngineRef.current) {
                    voiceEngineRef.current.play(i);
                  }
                }}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Final verdict CTA button */}
      {allRevealed && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="pt-2 no-print"
        >
          <button
            onClick={() => startVerdict()}
            disabled={verdictStatus === 'running'}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-bold text-sm bg-accent-technical hover:opacity-90 active:scale-[0.99] text-white shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {verdictStatus === 'running' ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Synthesizing Final Verdict…
              </>
            ) : (
              <>
                <span>Proceed to Final Verdict & Report</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </motion.div>
      )}
    </div>
  );
}
