import { motion } from 'framer-motion';
import { ArrowRight, Lock, Check, Loader2 } from 'lucide-react';
import { usePipelineStore } from '../lib/store';
import type { AgentId, AgentOpinion } from '../types';
import { AGENT_ICONS, AGENT_NAMES, AGENT_COLORS } from './AgentAvatar';
import { VerdictBadge } from './VerdictBadge';
import { ConfidenceBar } from './ConfidenceBar';
import { EvidenceQuoteBlock } from './EvidenceQuoteBlock';

const AGENT_IDS: AgentId[] = ['technical', 'culture', 'hiring_manager', 'skeptic'];

function AgentCard({
  agentId,
  opinion,
  isDone,
  allDone,
  index,
}: {
  agentId: AgentId;
  opinion?: AgentOpinion;
  isDone: boolean;
  allDone: boolean;
  index: number;
}) {
  const Icon = AGENT_ICONS[agentId];
  const name = AGENT_NAMES[agentId];
  const color = AGENT_COLORS[agentId];

  // While running and not done: skeleton
  if (!isDone) {
    return (
      <div
        className="bg-surface rounded-lg border border-white/[0.06] p-5 overflow-hidden relative"
        style={{ borderLeft: `3px solid ${color}` }}
      >
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}1A` }}>
            <Icon size={18} style={{ color }} />
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-text">{name}</h3>
            <p className="text-[11px] text-muted flex items-center gap-1">
              <Loader2 size={10} className="animate-spin" />
              is reviewing…
            </p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-3 shimmer rounded" />
          <div className="h-3 shimmer rounded w-5/6" />
          <div className="h-3 shimmer rounded w-4/6" />
          <div className="h-12 shimmer rounded" />
          <div className="h-12 shimmer rounded" />
        </div>
      </div>
    );
  }

  // Done but waiting on others: masked
  if (isDone && !allDone) {
    return (
      <div
        className="bg-surface rounded-lg border border-white/[0.06] p-5 overflow-hidden relative"
        style={{ borderLeft: `3px solid ${color}` }}
      >
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}1A` }}>
            <Icon size={18} style={{ color }} />
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-text">{name}</h3>
            <p className="text-[11px] text-muted flex items-center gap-1">
              <Check size={11} className="text-success" />
              done, waiting on others
            </p>
          </div>
        </div>
        <div className="blur-mask space-y-3">
          <div className="h-3 bg-white/[0.06] rounded" />
          <div className="h-3 bg-white/[0.06] rounded w-5/6" />
          <div className="h-3 bg-white/[0.06] rounded w-4/6" />
          <div className="h-12 bg-white/[0.06] rounded" />
          <div className="h-12 bg-white/[0.06] rounded" />
        </div>
      </div>
    );
  }

  // All done: reveal
  if (!opinion) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.12, duration: 0.3 }}
      className="bg-surface rounded-lg border border-white/[0.06] p-5"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}1A`, border: `1.5px solid ${color}40` }}>
          <Icon size={18} style={{ color }} />
        </div>
        <div className="flex-1">
          <h3 className="text-[13px] font-semibold text-text">{name}</h3>
          <p className="text-[11px] text-muted">Independent Review</p>
        </div>
        <VerdictBadge verdict={opinion.verdict} size="sm" />
      </div>

      {/* Score + Confidence */}
      <div className="flex items-center gap-4 mb-4">
        <div>
          <span className="text-2xl font-bold text-text">{opinion.score}</span>
          <span className="text-sm text-muted">/10</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted uppercase tracking-wide">Confidence</span>
            <span className="text-[11px] font-medium text-text">{opinion.confidence}%</span>
          </div>
          <ConfidenceBar value={opinion.confidence} color={color} />
        </div>
      </div>

      {/* Summary */}
      <p className="text-[12px] text-text/80 leading-relaxed mb-4">{opinion.summary}</p>

      {/* Evidence */}
      <div className="space-y-2.5">
        <span className="text-[10px] text-muted uppercase tracking-wide font-semibold">Evidence</span>
        {opinion.evidence.map((ev, i) => (
          <EvidenceQuoteBlock key={i} evidence={ev} index={i} />
        ))}
      </div>
    </motion.div>
  );
}

export function IndependentReview() {
  const opinions = usePipelineStore((s) => s.opinions);
  const reviewStatus = usePipelineStore((s) => s.reviewStatus);
  const agentProgress = usePipelineStore((s) => s.agentProgress);
  const setStage = usePipelineStore((s) => s.setStage);
  const startDebate = usePipelineStore((s) => s.startDebate);

  const allDone = reviewStatus === 'done';
  const running = reviewStatus === 'running';

  const handleStartDebate = () => {
    setStage('debate');
    startDebate();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 pb-20">
      {/* Independence banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6 flex items-center gap-3 bg-surface rounded-lg border border-white/[0.06] px-4 py-3"
      >
        <div className="w-8 h-8 rounded-full bg-accent-technical/10 flex items-center justify-center flex-shrink-0">
          <Lock size={16} className="text-accent-technical" />
        </div>
        <p className="text-[13px] text-text/80">
          Each agent is evaluating independently and cannot see the other agents' conclusions at this stage.
        </p>
      </motion.div>

      {/* 2x2 grid */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {AGENT_IDS.map((id, i) => {
          const opinion = opinions.find((o) => o.agentId === id);
          return (
            <AgentCard
              key={id}
              agentId={id}
              opinion={opinion}
              isDone={agentProgress[id] || false}
              allDone={allDone}
              index={i}
            />
          );
        })}
      </div>

      {/* Start Debate button */}
      {allDone && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <button
            onClick={handleStartDebate}
            aria-label="Start panel debate between the 4 evaluator agents"
            className="flex items-center gap-2 rounded-lg px-5 py-2.5 font-semibold text-sm bg-accent-technical text-bg hover:bg-accent-technical/90 transition-colors"
          >
            Start Debate
            <ArrowRight size={16} />
          </button>
        </motion.div>
      )}

      {running && !allDone && (
        <p className="text-[12px] text-muted flex items-center gap-2">
          <Loader2 size={12} className="animate-spin" />
          Agents are evaluating independently…
        </p>
      )}
    </div>
  );
}
