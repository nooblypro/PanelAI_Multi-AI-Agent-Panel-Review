import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Lock, Check, Loader2, AlertCircle, RotateCcw, ShieldAlert, Sparkles } from 'lucide-react';
import { usePipelineStore } from '../lib/store';
import type { AgentId, AgentOpinion } from '../types';
import { AGENT_ICONS, AGENT_NAMES, AGENT_COLORS } from './AgentAvatar';
import { VerdictBadge } from './VerdictBadge';
import { ConfidenceBar } from './ConfidenceBar';
import { EvidenceQuoteBlock } from './EvidenceQuoteBlock';

const AGENT_IDS: AgentId[] = ['technical', 'culture', 'hiring_manager', 'skeptic'];

function formatCleanSummary(summary?: string): string {
  if (!summary) return 'Independent evaluation completed.';
  if (summary.includes('Job Description:') || summary.includes('About the Role') || summary.length > 240) {
    const sentences = summary.split(/\.\s+/).filter(
      (s) => !s.includes('Job Description:') && !s.includes('About the Role') && !s.includes("What You'll Do") && s.trim().length > 10
    );
    if (sentences.length > 0) {
      const trimmed = sentences.slice(0, 2).join('. ');
      return trimmed + (trimmed.endsWith('.') ? '' : '.');
    }
  }
  return summary;
}

function AgentCard({
  agentId,
  opinion,
  isDone,
  allDone,
  agentError,
  index,
}: {
  agentId: AgentId;
  opinion?: AgentOpinion;
  isDone: boolean;
  allDone: boolean;
  agentError?: string | null;
  index: number;
}) {
  const Icon = AGENT_ICONS[agentId];
  const name = AGENT_NAMES[agentId];
  const color = AGENT_COLORS[agentId];

  // Agent error card
  if (agentError) {
    return (
      <div
        className="bg-surface rounded-2xl border border-rose-500/30 p-5 shadow-sm relative overflow-hidden"
        style={{ borderLeft: `4px solid #F43F5E` }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-500/10 text-rose-500">
            <AlertCircle size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text">{name}</h3>
            <p className="text-xs text-rose-500 font-medium">Evaluation Interrupted</p>
          </div>
        </div>
        <p className="text-xs text-muted leading-relaxed">
          {agentError}
        </p>
      </div>
    );
  }

  // Running card (Skeleton)
  if (!isDone) {
    return (
      <div
        className="bg-surface rounded-2xl border border-border shadow-2xs p-5 relative overflow-hidden"
        style={{ borderLeft: `4px solid ${color}` }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}1A` }}>
            <Icon size={20} style={{ color }} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text">{name}</h3>
            <p className="text-xs text-muted flex items-center gap-1.5 mt-0.5 font-medium">
              <Loader2 size={13} className="animate-spin text-accent-technical" />
              Evaluating candidate fact-base…
            </p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-3.5 shimmer rounded-lg" />
          <div className="h-3.5 shimmer rounded-lg w-5/6" />
          <div className="h-3.5 shimmer rounded-lg w-4/6" />
          <div className="h-16 shimmer rounded-xl" />
        </div>
      </div>
    );
  }

  // Done but waiting on peers (Masked)
  if (isDone && !allDone) {
    return (
      <div
        className="bg-surface rounded-2xl border border-border shadow-2xs p-5 relative overflow-hidden"
        style={{ borderLeft: `4px solid ${color}` }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}1A` }}>
            <Icon size={20} style={{ color }} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text">{name}</h3>
            <p className="text-xs text-emerald-500 font-medium flex items-center gap-1 mt-0.5">
              <Check size={14} />
              Review complete • Barrier sealed
            </p>
          </div>
        </div>
        <div className="blur-mask space-y-3">
          <div className="h-3.5 bg-surface-2 rounded-lg" />
          <div className="h-3.5 bg-surface-2 rounded-lg w-5/6" />
          <div className="h-16 bg-surface-2 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!opinion) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className="bg-surface rounded-2xl border border-border shadow-sm p-5 sm:p-6 transition-all hover:border-border-strong"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-2xs"
            style={{ backgroundColor: `${color}1A`, border: `1px solid ${color}30` }}
          >
            <Icon size={20} style={{ color }} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-text">{name}</h3>
            <p className="text-xs text-muted">Independent Assessment</p>
          </div>
        </div>

        <VerdictBadge verdict={opinion.verdict} size="sm" />
      </div>

      {/* Score & Confidence */}
      <div className="grid grid-cols-2 gap-4 mb-4 p-3 rounded-xl bg-surface-2/50 border border-border">
        <div>
          <span className="text-[11px] text-muted uppercase tracking-wider font-bold block mb-0.5">Assessment Score</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-serif text-text">{opinion.score}</span>
            <span className="text-xs text-muted font-medium">/ 10</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-muted uppercase tracking-wider font-bold">Confidence</span>
            <span className="text-xs font-bold text-text">{opinion.confidence}%</span>
          </div>
          <ConfidenceBar value={opinion.confidence} color={color} />
        </div>
      </div>

      {/* Summary */}
      <p className="text-xs sm:text-sm text-text/90 leading-relaxed mb-4 font-normal">
        {formatCleanSummary(opinion.summary)}
      </p>

      {/* Evidence Quotes */}
      <div className="space-y-2.5">
        <span className="text-[11px] text-muted uppercase tracking-wider font-bold block">
          Verbatim Fact Quotes
        </span>
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
  const reviewError = usePipelineStore((s) => s.reviewError);
  const agentProgress = usePipelineStore((s) => s.agentProgress);
  const agentErrors = usePipelineStore((s) => s.agentErrors);
  const setStage = usePipelineStore((s) => s.setStage);
  const startReview = usePipelineStore((s) => s.startReview);
  const startDebate = usePipelineStore((s) => s.startDebate);

  const allDone = reviewStatus === 'done' || (opinions.length === 4);
  const running = reviewStatus === 'running';
  const isError = reviewStatus === 'error';

  useEffect(() => {
    if (reviewStatus === 'idle') {
      startReview();
    }
  }, [reviewStatus, startReview]);

  const handleStartDebate = () => {
    setStage('debate');
    startDebate();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 pb-20">
      {/* Information Barrier Notice */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface rounded-2xl border border-border shadow-2xs p-4 sm:px-6 py-4"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-accent-technical/10 flex items-center justify-center flex-shrink-0 text-accent-technical border border-accent-technical/20">
            <Lock size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-text">Stage 3: Strict Information Isolation Active</h2>
            <p className="text-xs text-muted mt-0.5 leading-relaxed">
              Each evaluator analyzes the candidate independently in parallel. Peer scores are concealed to eliminate groupthink.
            </p>
          </div>
        </div>

        {allDone && (
          <button
            onClick={handleStartDebate}
            className="flex-shrink-0 flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 font-bold text-sm bg-accent-technical text-white hover:bg-accent-technical/90 shadow-sm transition-all cursor-pointer"
          >
            <Sparkles size={16} />
            <span>Proceed to Panel Debate</span>
            <ArrowRight size={16} />
          </button>
        )}
      </motion.div>

      {/* Error Alert */}
      {isError && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5">
            <ShieldAlert size={20} className="flex-shrink-0" />
            <div>
              <p className="text-sm font-bold">Independent Evaluation Interrupted</p>
              <p className="text-xs opacity-90">
                {reviewError || 'A connection issue occurred during agent review.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => startReview()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 transition-colors w-fit cursor-pointer shadow-xs"
          >
            <RotateCcw size={14} />
            Retry Evaluation
          </button>
        </motion.div>
      )}

      {/* 2x2 Grid of 4 Evaluators */}
      <div className="grid sm:grid-cols-2 gap-6 mb-8">
        {AGENT_IDS.map((id, i) => {
          const opinion = opinions.find((o) => o.agentId === id);
          return (
            <AgentCard
              key={id}
              agentId={id}
              opinion={opinion}
              isDone={agentProgress[id] || Boolean(opinion)}
              allDone={allDone}
              agentError={agentErrors[id]}
              index={i}
            />
          );
        })}
      </div>

      {/* Running Progress Text */}
      {running && !allDone && (
        <div className="flex items-center justify-center gap-2 text-xs font-medium text-muted py-4">
          <Loader2 size={16} className="animate-spin text-accent-technical" />
          <span>Evaluating 4 independent candidate perspectives in parallel...</span>
        </div>
      )}
    </div>
  );
}
