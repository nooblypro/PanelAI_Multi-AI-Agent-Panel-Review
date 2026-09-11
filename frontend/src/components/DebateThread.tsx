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
  MessageSquare,
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
  agree: '#10B981',
  disagree: '#F43F5E',
  challenge: '#F59E0B',
  concede: '#64748B',
  revise: '#3B82F6',
};

function ReplyConnector({ fromAgent, excerpt }: { fromAgent: AgentId; excerpt: string }) {
  const color = AGENT_COLORS[fromAgent];
  return (
    <div className="mb-2.5 ml-10 sm:ml-12 relative">
      <div
        className="absolute left-[-12px] top-0 bottom-0 w-0.5 rounded-full"
        style={{ backgroundColor: `${color}40` }}
      />
      <div
        className="rounded-xl px-3.5 py-2 border-l-2 bg-surface-2/70 border border-border"
        style={{ borderLeftColor: color }}
      >
        <p className="text-[11px] text-muted mb-0.5 font-medium">
          Replying to <span style={{ color }} className="font-bold">{AGENT_NAMES[fromAgent]}</span>
        </p>
        <p className="font-mono text-xs text-text/80 italic leading-relaxed">
          &ldquo;{excerpt}&rdquo;
        </p>
      </div>
    </div>
  );
}

function ScoreChangeChip({ from, to }: { from: number; to: number }) {
  const isUp = to > from;
  const color = isUp ? '#10B981' : '#F43F5E';
  const Icon = isUp ? ArrowUp : ArrowDown;

  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold"
      style={{ backgroundColor: `${color}1A`, color }}
    >
      <Icon size={12} />
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
      className={`flex gap-3.5 transition-all duration-300 ${
        isSpeaking
          ? 'p-3 rounded-2xl bg-surface border border-accent-technical/40 shadow-lg ring-2 ring-accent-technical/20'
          : 'p-1'
      }`}
    >
      {/* Avatar */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform mt-0.5 shadow-2xs"
        style={{
          backgroundColor: `${color}1A`,
          border: `1.5px solid ${color}40`,
          boxShadow: isSpeaking ? `0 0 16px ${color}60` : 'none',
        }}
      >
        <Icon size={20} style={{ color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold" style={{ color }}>{name}</span>
            <span
              className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
              style={{ backgroundColor: `${stanceColor}1A`, color: stanceColor }}
            >
              <StanceIcon size={12} />
              {turn.stance}
            </span>
            {turn.scoreChange && (
              <ScoreChangeChip from={turn.scoreChange.from} to={turn.scoreChange.to} />
            )}
          </div>

          <div className="flex items-center gap-2">
            {isSpeaking ? (
              <div className="flex items-center gap-1.5 text-xs font-bold text-accent-technical">
                <SoundWave color={color} />
                <span className="hidden sm:inline">Speaking</span>
              </div>
            ) : onPlayTurn ? (
              <button
                onClick={onPlayTurn}
                title="Play voice turn"
                className="opacity-60 hover:opacity-100 p-1 text-muted hover:text-accent-technical rounded transition-all cursor-pointer"
              >
                <Volume2 size={15} />
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
          className="rounded-2xl p-4 bg-surface border border-border shadow-2xs transition-colors"
          style={{
            borderLeft: `4px solid ${color}`,
          }}
        >
          <p className="text-xs sm:text-sm text-text/95 leading-relaxed font-normal">{turn.content}</p>
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
    if (isLoading) {
      setLoadingRound(1);
      const timer = setInterval(() => {
        setLoadingRound((r) => (r < 10 ? r + 1 : r));
      }, 4500);
      return () => clearInterval(timer);
    }
  }, [isLoading]);

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

  const activeSpeakerName = voiceState.activeSpeaker ? AGENT_NAMES[voiceState.activeSpeaker] : null;
  const activeSpeakerColor = voiceState.activeSpeaker ? AGENT_COLORS[voiceState.activeSpeaker] : 'var(--accent-technical)';
  const ActiveSpeakerIcon = voiceState.activeSpeaker ? AGENT_ICONS[voiceState.activeSpeaker] : Volume2;

  const currentTurnNumber = voiceState.currentTurnIndex >= 0 ? voiceState.currentTurnIndex + 1 : 0;
  const totalTurnsCount = debateTurns.length;
  const progressPercent = totalTurnsCount > 0 && currentTurnNumber > 0 ? (currentTurnNumber / totalTurnsCount) * 100 : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 pb-20 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl font-bold font-serif text-text tracking-tight">
              Adversarial Debate Arena
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-accent-technical/10 text-accent-technical border border-accent-technical/20">
              Stage 4
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted leading-relaxed">
            Evaluators cross-examine candidate evidence, defend conclusions, and dynamically adjust scores.
          </p>
        </div>

        {allRevealed && (
          <button
            onClick={() => startVerdict()}
            disabled={verdictStatus === 'running'}
            className="flex-shrink-0 flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 font-bold text-sm bg-accent-technical hover:bg-accent-technical/90 text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {verdictStatus === 'running' ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Synthesize Verdict</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        )}
      </div>

      {/* Error Alert */}
      {isError && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} className="flex-shrink-0" />
            <p className="text-xs sm:text-sm font-semibold">{debateError || 'Failed to complete panel debate.'}</p>
          </div>
          <button
            onClick={() => startDebate()}
            className="px-3.5 py-1.5 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 transition-colors cursor-pointer"
          >
            Retry Debate
          </button>
        </motion.div>
      )}

      {/* VOICE AUDIO PLAYER CONTROL BAR */}
      {debateTurns.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface rounded-2xl border border-border shadow-sm p-4 sm:p-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-2xs"
                style={{
                  backgroundColor: `${activeSpeakerColor}1A`,
                  border: `1.5px solid ${activeSpeakerColor}40`,
                }}
              >
                <ActiveSpeakerIcon size={20} style={{ color: activeSpeakerColor }} />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-text">
                    {voiceState.isPlaying || voiceState.isPaused ? (
                      <span className="flex items-center gap-1.5">
                        <span style={{ color: activeSpeakerColor }}>{activeSpeakerName}</span>
                        <span className="text-muted font-medium">speaking</span>
                      </span>
                    ) : (
                      'Voice Debate Playback'
                    )}
                  </span>
                  {voiceState.isPlaying && <SoundWave color={activeSpeakerColor} />}
                </div>
                <p className="text-xs text-muted mt-0.5">
                  {currentTurnNumber > 0 ? `Turn ${currentTurnNumber} of ${totalTurnsCount}` : `${totalTurnsCount} debate turns ready`}
                </p>
              </div>
            </div>

            {/* Audio Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {voiceState.isPlaying ? (
                <button
                  onClick={handlePauseVoice}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-2 border border-border hover:border-accent-technical text-text text-xs font-bold transition-all cursor-pointer"
                >
                  <Pause size={14} className="text-accent-technical" />
                  <span>Pause</span>
                </button>
              ) : (
                <button
                  onClick={handlePlayVoice}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent-technical hover:bg-accent-technical/90 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <Play size={14} fill="currentColor" />
                  <span>{voiceState.isPaused ? 'Resume Audio' : 'Play Voice Debate'}</span>
                </button>
              )}

              <button
                onClick={handleReplayTurn}
                disabled={voiceState.currentTurnIndex < 0}
                className="p-2 rounded-xl bg-surface-2 border border-border hover:border-accent-technical text-muted hover:text-text text-xs transition-all disabled:opacity-30 cursor-pointer"
                title="Replay turn"
              >
                <RotateCcw size={14} />
              </button>

              <button
                onClick={handleSkipTurn}
                disabled={voiceState.currentTurnIndex < 0 || voiceState.currentTurnIndex >= totalTurnsCount - 1}
                className="p-2 rounded-xl bg-surface-2 border border-border hover:border-accent-technical text-muted hover:text-text text-xs transition-all disabled:opacity-30 cursor-pointer"
                title="Skip to next turn"
              >
                <SkipForward size={14} />
              </button>

              {(voiceState.isPlaying || voiceState.isPaused) && (
                <button
                  onClick={handleStopVoice}
                  className="p-2 rounded-xl bg-surface-2 border border-border hover:border-rose-500 text-muted hover:text-rose-500 text-xs transition-all cursor-pointer"
                  title="Stop audio"
                >
                  <Square size={14} />
                </button>
              )}

              {!allRevealed && (
                <button
                  onClick={revealAllTurns}
                  className="text-xs text-accent-technical font-semibold hover:underline px-2 py-1 transition-colors cursor-pointer"
                >
                  Reveal All Turns
                </button>
              )}
            </div>
          </div>

          <div className="w-full h-1 bg-surface-2 rounded-full overflow-hidden mt-3 border border-border/50">
            <motion.div
              initial={false}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.25 }}
              className="h-full rounded-full"
              style={{ backgroundColor: activeSpeakerColor }}
            />
          </div>
        </motion.div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-20 bg-surface rounded-2xl border border-border shadow-2xs">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="animate-spin text-accent-technical" />
            <p className="text-sm font-bold text-text">Multi-Agent Deliberation in Progress</p>
            <p className="text-xs text-muted">Orchestrating persona debate rounds (Round {loadingRound})…</p>
          </div>
        </div>
      )}

      {/* Debate Turns Stream */}
      {debateTurns.length > 0 && (
        <div
          ref={scrollRef}
          className="space-y-4 max-h-[62vh] overflow-y-auto scrollbar-thin pr-1 sm:pr-2"
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
    </div>
  );
}
