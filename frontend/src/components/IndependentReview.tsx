import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Lock, Check, Loader2, AlertCircle, RotateCcw, Sparkles, Shield, Users, Briefcase, Search, Quote } from 'lucide-react';
import { usePipelineStore } from '../lib/store';
import type { AgentId, AgentOpinion } from '../types';
import { VerdictBadge } from './VerdictBadge';
import { ConfidenceBar } from './ConfidenceBar';

const AGENT_CONFIG: Record<
  AgentId,
  {
    deskNumber: string;
    title: string;
    subtitle: string;
    icon: typeof Shield;
    accentColor: string;
    lightBg: string;
  }
> = {
  technical: {
    deskNumber: 'DESK 01',
    title: 'Principal Systems Architect',
    subtitle: 'Technical Rigor, Architecture & Algorithms',
    icon: Shield,
    accentColor: '#1D4ED8',
    lightBg: 'rgba(29, 78, 216, 0.06)',
  },
  culture: {
    deskNumber: 'DESK 02',
    title: 'Head of Organizational Culture',
    subtitle: 'Communication, Collaboration & Values',
    icon: Users,
    accentColor: '#047857',
    lightBg: 'rgba(4, 120, 87, 0.06)',
  },
  hiring_manager: {
    deskNumber: 'DESK 03',
    title: 'Executive Hiring Director',
    subtitle: 'Scope Suitability, Delivery & Impact Fit',
    icon: Briefcase,
    accentColor: '#B45309',
    lightBg: 'rgba(180, 83, 9, 0.06)',
  },
  skeptic: {
    deskNumber: 'DESK 04',
    title: 'Adversarial Skeptic Auditor',
    subtitle: 'Contradiction Audit & Integrity Stress-Test',
    icon: Search,
    accentColor: '#BE123C',
    lightBg: 'rgba(190, 18, 60, 0.06)',
  },
};

const AGENT_IDS: AgentId[] = ['technical', 'culture', 'hiring_manager', 'skeptic'];

// Sample fallback opinions for offline review preview
const SAMPLE_OPINIONS: AgentOpinion[] = [
  {
    agentId: 'technical',
    round: 'independent',
    score: 9.0,
    confidence: 94,
    verdict: 'strong_yes',
    summary: 'Candidate exhibits exceptional systems architecture depth, having built high-throughput LLM pipelines and solved real-world multi-agent concurrency bottlenecks with micro-staggering.',
    evidence: [
      { quote: 'Reduced p99 multi-agent latency from 4.2s to 850ms', source: 'transcript', note: 'Demonstrated deep understanding of asyncio execution graphs' },
      { quote: 'Designed high-throughput multi-agent deliberation framework serving 10M+ daily API requests', source: 'resume', note: 'Validated production scale execution' },
    ],
    timestamp: new Date().toISOString(),
  },
  {
    agentId: 'culture',
    round: 'independent',
    score: 8.5,
    confidence: 88,
    verdict: 'yes',
    summary: 'Strong collaborative maturity. Values explainability and cross-functional transparency, choosing verifiable evidence over opaque black-box metrics.',
    evidence: [
      { quote: 'I establish a single source of truth early to align engineering and product', source: 'transcript', note: 'Clear empathy for cross-functional partners' },
    ],
    timestamp: new Date().toISOString(),
  },
  {
    agentId: 'hiring_manager',
    round: 'independent',
    score: 8.0,
    confidence: 90,
    verdict: 'yes',
    summary: 'Direct scope match for Staff/Lead AI roles. Proven track record leading 5-engineer infrastructure teams and driving measurable token cost reductions.',
    evidence: [
      { quote: 'Optimized token consumption by 38% via dynamic prompt caching', source: 'resume', note: 'Strong commercial and operational impact' },
    ],
    timestamp: new Date().toISOString(),
  },
  {
    agentId: 'skeptic',
    round: 'independent',
    score: 7.2,
    confidence: 85,
    verdict: 'lean_yes',
    summary: 'While technical claims are corroborated by the transcript, formal evidence of zero-downtime router deployment under high burst traffic requires live verification in debate.',
    evidence: [
      { quote: 'Architected zero-downtime multi-agent fallback routers', source: 'resume', note: 'Needs corroboration on outage remediation protocols' },
    ],
    timestamp: new Date().toISOString(),
  },
];

export function IndependentReview() {
  const opinions = usePipelineStore((s) => s.opinions);
  const reviewStatus = usePipelineStore((s) => s.reviewStatus);
  const reviewError = usePipelineStore((s) => s.reviewError);
  const agentProgress = usePipelineStore((s) => s.agentProgress);
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

  const handleLoadOfflinePreview = () => {
    // Populate store opinions for demonstration if offline
    usePipelineStore.setState({
      opinions: SAMPLE_OPINIONS,
      reviewStatus: 'done',
      reviewError: null,
      agentProgress: { technical: true, culture: true, hiring_manager: true, skeptic: true },
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 pb-24">
      {/* Information Barrier Header */}
      <div className="pb-8 border-b border-border flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="dossier-stamp text-accent-technical flex items-center gap-1">
              <Lock size={12} /> [BARRIER PROTOCOL: ACTIVE // SEALED]
            </span>
            <span className="text-muted text-xs">•</span>
            <span className="dossier-stamp text-muted">
              CONCURRENT 4-CHAMBER EVALUATION
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-text tracking-tight">
            Independent Chamber Inquiries
          </h1>

          <p className="text-sm sm:text-base text-muted mt-3 max-w-3xl leading-relaxed font-normal">
            Each specialist assesses candidate evidence behind strict information barriers. 
            No peer scores or findings are shared at this phase to prevent narrative anchoring and consensus bias.
          </p>
        </div>

        {allDone && (
          <button
            type="button"
            onClick={handleStartDebate}
            className="flex-shrink-0 bg-text text-bg hover:opacity-90 active:scale-[0.99] py-3.5 px-6 rounded-lg font-bold text-xs uppercase tracking-wider font-mono flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Sparkles size={15} />
            <span>UNSEAL BARRIERS & ENTER DEBATE</span>
            <ArrowRight size={15} />
          </button>
        )}
      </div>

      {/* Error / Backend Offline Notice */}
      {isError && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="my-6 p-5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-text">Local Backend Server Not Running</p>
              <p className="text-xs text-muted mt-0.5">
                The Python API at <code className="font-mono text-text">http://localhost:8000</code> is offline. You can click below to load pre-verified candidate opinions to preview the full evaluation:
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLoadOfflinePreview}
            className="flex-shrink-0 px-4 py-2 rounded-lg bg-text text-bg text-xs font-mono uppercase font-bold hover:opacity-90 transition-all cursor-pointer"
          >
            Preview Sample Audit
          </button>
        </motion.div>
      )}

      {/* 4 Specialized Chambers List (Editorial Format) */}
      <div className="py-8 space-y-6">
        {AGENT_IDS.map((id, i) => {
          const cfg = AGENT_CONFIG[id];
          const opinion = opinions.find((o) => o.agentId === id);
          const isDone = agentProgress[id] || Boolean(opinion);
          const Icon = cfg.icon;

          return (
            <div
              key={id}
              className="border border-border rounded-xl bg-surface p-6 sm:p-7 transition-all hover:border-border-strong relative"
              style={{ borderLeft: `4px solid ${cfg.accentColor}` }}
            >
              {/* Chamber Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center font-bold"
                    style={{ backgroundColor: cfg.lightBg, color: cfg.accentColor }}
                  >
                    <Icon size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="dossier-stamp text-[10px] text-muted">
                        {cfg.deskNumber}
                      </span>
                      <span className="text-muted text-xs">•</span>
                      <h2 className="text-base font-serif font-bold text-text">
                        {cfg.title}
                      </h2>
                    </div>
                    <p className="text-xs text-muted mt-0.5">
                      {cfg.subtitle}
                    </p>
                  </div>
                </div>

                {/* Score & Verdict Telemetry */}
                {opinion ? (
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <span className="dossier-stamp text-[9px] text-muted block">AUDIT SCORE</span>
                      <span className="text-2xl font-serif font-bold text-text">
                        {opinion.score.toFixed(1)} <span className="text-xs font-mono text-muted">/10</span>
                      </span>
                    </div>

                    <div className="h-8 w-px bg-border hidden sm:block" />

                    <div className="text-right">
                      <span className="dossier-stamp text-[9px] text-muted block">CONFIDENCE</span>
                      <span className="text-sm font-mono font-bold text-text">
                        {opinion.confidence}%
                      </span>
                    </div>

                    <VerdictBadge verdict={opinion.verdict} size="sm" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-muted font-mono">
                    <Loader2 size={13} className="animate-spin text-accent-technical" />
                    <span>CHAMBER DELIBERATING...</span>
                  </div>
                )}
              </div>

              {/* Chamber Findings Body */}
              {opinion ? (
                <div className="pt-4 space-y-4">
                  <div>
                    <span className="dossier-stamp text-[10px] text-muted block mb-1">
                      EXECUTIVE ASSESSMENT
                    </span>
                    <p className="text-sm text-text/95 leading-relaxed font-normal">
                      {opinion.summary}
                    </p>
                  </div>

                  {/* Verbatim Evidence Citations */}
                  <div>
                    <span className="dossier-stamp text-[10px] text-muted block mb-2">
                      CITATIONS & EVIDENCE NOTES
                    </span>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {opinion.evidence.map((ev, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg bg-surface-2/60 border border-border/70 text-xs"
                        >
                          <p className="font-mono text-text/90 italic leading-relaxed mb-1.5">
                            &ldquo;{ev.quote}&rdquo;
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-muted pt-1 border-t border-border/50">
                            <span className="dossier-stamp">ANCHOR: {ev.source.toUpperCase()}</span>
                            <span>{ev.note}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pt-6 space-y-2.5">
                  <div className="h-3 shimmer rounded w-5/6" />
                  <div className="h-3 shimmer rounded w-4/6" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
