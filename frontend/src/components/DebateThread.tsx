import { useState, useEffect, useRef, useCallback } from 'react';
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
  Loader2,
  ArrowDown,
  ArrowUp,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { usePipelineStore } from '../lib/store';
import type { AgentId, DebateTurn } from '../types';
import { AGENT_ICONS, AGENT_NAMES, AGENT_COLORS } from './AgentAvatar';

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
    <div className="mb-2 ml-12 relative">
      <div
        className="absolute left-[-12px] top-0 bottom-0 w-px"
        style={{ backgroundColor: `${color}40` }}
      />
      <div
        className="rounded-md px-3 py-2 border-l-2 bg-surface-2/60"
        style={{ borderColor: `${color}60` }}
      >
        <p className="text-[10px] text-muted mb-0.5">
          Replying to <span style={{ color }}>{AGENT_NAMES[fromAgent]}</span>
        </p>
        <p className="font-mono text-[11px] text-text/60 italic leading-relaxed">
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
      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold"
      style={{ backgroundColor: `${color}1A`, color }}
    >
      <Icon size={11} />
      Score {from} → {to}
    </span>
  );
}

function DebateBubble({
  turn,
  index,
  isSpeaking,
}: {
  turn: DebateTurn;
  index: number;
  isSpeaking: boolean;
}) {
  const Icon = AGENT_ICONS[turn.fromAgent];
  const name = AGENT_NAMES[turn.fromAgent];
  const color = AGENT_COLORS[turn.fromAgent];
  const StanceIcon = STANCE_ICON_MAP[turn.stance];
  const stanceColor = STANCE_COLORS[turn.stance];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`flex gap-3 ${isSpeaking ? 'ring-2 ring-accent-technical/40 rounded-lg p-1' : ''}`}
    >
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}1A`, border: `1.5px solid ${color}40` }}
      >
        <Icon size={18} style={{ color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
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

        {/* Reply connector */}
        {turn.respondingTo && (
          <ReplyConnector fromAgent={turn.respondingTo.agentId} excerpt={turn.respondingTo.excerpt} />
        )}

        {/* Message bubble */}
        <div
          className="rounded-lg px-4 py-3"
          style={{ backgroundColor: `${color}0D`, border: `1px solid ${color}20` }}
        >
          <p className="text-[13px] text-text/85 leading-relaxed">{turn.content}</p>
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
  const startDebate = usePipelineStore((s) => s.startDebate);
  const startVerdict = usePipelineStore((s) => s.startVerdict);
  const verdictStatus = usePipelineStore((s) => s.verdictStatus);

  const [playing, setPlaying] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState(-1);
  const [loadingRound, setLoadingRound] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const allRevealed = revealedTurns >= debateTurns.length && debateTurns.length > 0;
  const isLoading = debateStatus === 'running' && debateTurns.length === 0;
  const isError = debateStatus === 'error';

  // Fake loading progress for debate to avoid static spinning wheel
  useEffect(() => {
    if (isLoading) {
      setLoadingRound(1);
      const timer = setInterval(() => {
        setLoadingRound((r) => (r < 10 ? r + 1 : r));
      }, 5000); // Increment fake round every 5 seconds
      return () => clearInterval(timer);
    }
  }, [isLoading]);

  const play = useCallback(() => {
    if (allRevealed) return;
    setPlaying(true);
    intervalRef.current = setInterval(() => {
      revealNextTurn();
    }, 500);
  }, [allRevealed, revealNextTurn]);

  const pause = useCallback(() => {
    setPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Auto-stop when all revealed
  useEffect(() => {
    if (allRevealed && playing) {
      pause();
    }
  }, [allRevealed, playing, pause]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Auto-scroll to bottom when new turns appear
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [revealedTurns]);

  // Highlight currently revealing turn
  useEffect(() => {
    if (playing && revealedTurns > 0) {
      setSpeakingIdx(revealedTurns - 1);
      const timer = setTimeout(() => setSpeakingIdx(-1), 1000);
      return () => clearTimeout(timer);
    }
  }, [revealedTurns, playing]);

  return (
    <div className="max-w-[760px] mx-auto px-4 sm:px-8 py-8 pb-20">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text mb-1">Panel Debate</h2>
        <p className="text-[12px] text-muted">
          Agents now see each other's independent opinions and respond to specific points.
        </p>
      </div>

      {/* Error Notice */}
      {isError && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-lg bg-danger/10 border border-danger/30 text-danger flex flex-col sm:flex-row sm:items-center justify-between gap-3"
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-danger text-white text-[12px] font-medium hover:bg-danger/90 transition-colors w-fit"
          >
            <RotateCcw size={13} />
            Retry Debate
          </button>
        </motion.div>
      )}

      {/* Controls */}
      {debateTurns.length > 0 && (
        <div className="flex items-center gap-2 mb-6 no-print">
          {!playing ? (
            <button
              onClick={play}
              disabled={allRevealed}
              aria-label={revealedTurns === 0 ? 'Play Debate' : 'Resume Debate'}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium bg-surface-2 border border-white/[0.08] hover:border-white/[0.15] text-text transition-colors disabled:opacity-40"
            >
              <Play size={13} />
              {revealedTurns === 0 ? 'Play Debate' : 'Resume'}
            </button>
          ) : (
            <button
              onClick={pause}
              aria-label="Pause Debate"
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium bg-surface-2 border border-white/[0.08] hover:border-white/[0.15] text-text transition-colors"
            >
              <Pause size={13} />
              Pause
            </button>
          )}
          <button
            onClick={revealAllTurns}
            disabled={allRevealed}
            aria-label="Skip to end of debate and reveal all turns"
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium bg-surface-2 border border-white/[0.08] hover:border-white/[0.15] text-text transition-colors disabled:opacity-40"
          >
            <SkipForward size={13} />
            Skip to End
          </button>
          <span className="text-[11px] text-muted ml-2">
            {revealedTurns} / {debateTurns.length} turns
          </span>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={28} className="animate-spin text-accent-technical" />
            <p className="text-[13px] text-muted">Agents are deliberating (Round {loadingRound})…</p>
          </div>
        </div>
      )}

      {/* Debate thread */}
      {debateTurns.length > 0 && (
        <div ref={scrollRef} className="space-y-5 max-h-[60vh] overflow-y-auto scrollbar-thin pr-2">
          <AnimatePresence>
            {debateTurns.slice(0, revealedTurns).map((turn, i) => (
              <DebateBubble key={turn.id} turn={turn} index={i} isSpeaking={speakingIdx === i} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Final verdict button */}
      {allRevealed && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="mt-8"
        >
          <button
            onClick={() => startVerdict()}
            disabled={verdictStatus === 'running'}
            className="flex items-center gap-2 rounded-lg px-5 py-2.5 font-semibold text-sm bg-accent-technical text-bg hover:bg-accent-technical/90 transition-colors disabled:opacity-50"
          >
            {verdictStatus === 'running' ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Synthesizing Verdict…
              </>
            ) : (
              <>
                See Final Verdict
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </motion.div>
      )}
    </div>
  );
}
