import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Lock, Check, Loader2, AlertCircle, RotateCcw } from 'lucide-react';
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

  // If this specific agent failed
  if (agentError) {
    return (
      <div
        className="bg-surface rounded-lg border border-danger/30 p-5 overflow-hidden relative"
        style={{ borderLeft: `3px solid #ef4444` }}
      >
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-danger/10">
            <AlertCircle size={18} className="text-danger" />
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-text">{name}</h3>
            <p className="text-[11px] text-danger font-medium">Evaluation Failed</p>
          </div>
        </div>
        <p className="text-[12px] text-muted leading-relaxed">
          {agentError}
        </p>
      </div>
    );
  }

  // While running and not done: skeleton
  if (!isDone) {
    return (
      <div
        className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 overflow-hidden relative"
        style={{ borderLeft: `4px solid ${color}` }}
      >
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}1A` }}>
            <Icon size={18} style={{ color }} />
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-slate-900">{name}</h3>
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
        className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 overflow-hidden relative"
        style={{ borderLeft: `4px solid ${color}` }}
      >
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}1A` }}>
            <Icon size={18} style={{ color }} />
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-slate-900">{name}</h3>
            <p className="text-[11px] text-muted flex items-center gap-1">
              <Check size={11} className="text-emerald-600" />
              done, waiting on others
            </p>
          </div>
        </div>
        <div className="blur-mask space-y-3">
          <div className="h-3 bg-slate-100 rounded" />
          <div className="h-3 bg-slate-100 rounded w-5/6" />
          <div className="h-3 bg-slate-100 rounded w-4/6" />
          <div className="h-12 bg-slate-100 rounded" />
          <div className="h-12 bg-slate-100 rounded" />
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
      className="bg-white rounded-xl border border-slate-200 shadow-xs p-5"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}1A`, border: `1.5px solid ${color}40` }}>
          <Icon size={18} style={{ color }} />
        </div>
        <div className="flex-1">
          <h3 className="text-[13px] font-semibold text-slate-900">{name}</h3>
          <p className="text-[11px] text-muted">Independent Review</p>
        </div>
        <VerdictBadge verdict={opinion.verdict} size="sm" />
      </div>

      {/* Score + Confidence */}
      <div className="flex items-center gap-4 mb-4">
        <div>
          <span className="text-2xl font-bold text-slate-900">{opinion.score}</span>
          <span className="text-sm text-muted">/10</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted uppercase tracking-wide">Confidence</span>
            <span className="text-[11px] font-medium text-slate-700">{opinion.confidence}%</span>
          </div>
          <ConfidenceBar value={opinion.confidence} color={color} />
        </div>
      </div>

      {/* Summary */}
      <p className="text-[12px] text-slate-700 leading-relaxed mb-4">{formatCleanSummary(opinion.summary)}</p>

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
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 pb-20">
      {/* Independence banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6 flex items-center gap-3 bg-white rounded-xl border border-slate-200 shadow-xs px-4 py-3"
      >
        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
          <Lock size={16} className="text-blue-600" />
        </div>
        <p className="text-[13px] text-slate-700">
          Each agent is evaluating independently and cannot see the other agents' conclusions at this stage.
        </p>
      </motion.div>

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
              <p className="text-[13px] font-semibold">Evaluation Interrupted</p>
              <p className="text-[12px] opacity-90">
                {reviewError && reviewError.includes('Failed to fetch')
                  ? 'Unable to connect to the backend server. Please verify your backend deployment URL and CORS settings.'
                  : reviewError || 'A connection issue occurred during agent review.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => startReview()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-danger text-white text-[12px] font-medium hover:bg-danger/90 transition-colors w-fit"
          >
            <RotateCcw size={13} />
            Retry Review
          </button>
        </motion.div>
      )}

      {/* 2x2 grid */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
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
