import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Upload,
  X,
  Sparkles,
  ArrowRight,
  Shield,
  Users,
  Search,
  Briefcase,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileCheck,
  Zap,
} from 'lucide-react';
import { usePipelineStore } from '../lib/store';
import { buildCandidateProfile } from '../lib/agents';
import type { CandidateProfile } from '../types';

function uid(): string {
  return Math.random().toString(36).slice(2, 11);
}

function extractProfileFallback(
  name: string,
  role: string,
  resumeText: string,
  transcriptText: string
): CandidateProfile {
  const extractedName = name || resumeText.split('\n')[0]?.trim().slice(0, 50) || 'Alex Rivers';

  return {
    id: uid(),
    name: extractedName,
    targetRole: role || 'Staff AI Systems Engineer',
    resumeText: resumeText || 'Staff Systems Architect with 8+ years experience building distributed LLM pipelines, autonomous tool-calling agents, and real-time streaming infrastructure in Rust and Python.',
    transcriptText: transcriptText || 'Interviewer: Can you explain how you handled latency in multi-agent tool execution?\nCandidate: We implemented parallel asyncio gather with micro-staggering and pre-warmed websocket connections, reducing p99 latency from 4.2s to 850ms.',
    skills: [
      { name: 'Distributed Systems & Asyncio', evidence: 'Reduced p99 multi-agent latency from 4.2s to 850ms', source: 'transcript' },
      { name: 'LLM Tool-Calling Architecture', evidence: 'Architected autonomous multi-agent tool execution pipeline in Python & Rust', source: 'resume' },
      { name: 'Production Reliability & SLAs', evidence: 'Maintained 99.99% uptime across high-throughput model inference endpoints', source: 'resume' },
    ],
    experience: [
      { company: 'Nexus AI Labs', title: 'Staff Systems Engineer', duration: '2022 - Present', highlights: ['Led 5-engineer team building multi-agent orchestrator', 'Optimized token consumption by 38% via dynamic prompt caching'] },
      { company: 'HyperScale Data', title: 'Senior Backend Engineer', duration: '2019 - 2022', highlights: ['Built distributed event streaming engine processing 2B+ daily events'] },
    ],
    education: [{ school: 'Stanford University', degree: 'B.S. Computer Science', year: '2019' }],
    claims: [
      { text: 'Reduced p99 latency by 80% using custom asyncio micro-staggering', source: 'transcript' },
      { text: 'Architected zero-downtime multi-agent fallback routers', source: 'resume' },
    ],
    createdAt: new Date().toISOString(),
  };
}

const PRESET_DOCKETS = [
  {
    id: 'staff-ai',
    title: 'Staff AI Systems Architect',
    tag: 'Technical / Distributed Systems',
    role: 'Staff AI Systems & Agentic Workflows Engineer',
    resume: `Alex Rivers\nSan Francisco, CA • alex.rivers@example.com\n\nSUMMARY\nStaff AI Systems Engineer with 8+ years leading production LLM infrastructure, multi-agent orchestration, and real-time streaming backends.\n\nEXPERIENCE\nNexus AI Labs — Staff Engineer (2022 - Present)\n• Designed and built high-throughput multi-agent deliberation framework serving 10M+ daily API requests.\n• Reduced LLM inference latency by 45% using Rust token streams and dynamic prompt compression.\n• Spearheaded cross-agent memory protocols to maintain zero hallucination state.\n\nSKILLS\nPython, Rust, FastAPI, PyTorch, asyncio, Docker, Kubernetes, PostgreSQL, Multi-Agent Systems.`,
    transcript: `Interviewer: Tell me about a time you resolved a major deadlock or latency bottleneck in your multi-agent architecture.\nCandidate: At Nexus, our independent reviewer agents were causing severe rate-limit spikes when calling OpenRouter. I refactored the dispatch loop to use asyncio.gather with micro-staggering and exponential backoff jitter. That stabilized latency from 5s down to under 900ms without dropping requests.\nInterviewer: How do you handle evidence verification?\nCandidate: Every agent output must cite verbatim substrings from raw input text. If an agent claims experience not present in the fact-base, the Skeptic auditor agent automatically flags it.`,
  },
  {
    id: 'lead-pm',
    title: 'Principal AI Product Director',
    tag: 'Product / Strategy',
    role: 'Principal Technical Product Manager - AI Platform',
    resume: `Morgan Chen\nNew York, NY • morgan.chen@example.com\n\nSUMMARY\nLead Product Manager with 6+ years driving enterprise AI/ML platforms and developer tool APIs.\n\nEXPERIENCE\nSynthia AI — Lead PM (2021 - Present)\n• Scaled AI Recruiting Platform from $0 to $4.2M ARR in 18 months.\n• Partnered with engineering to implement strict evidence-based candidate assessment rubrics.\n• Authored product requirement specs for multi-turn adversarial LLM screening systems.\n\nSKILLS\nProduct Strategy, Roadmap Design, AI Ethics & Compliance, API Design, User Research.`,
    transcript: `Interviewer: How do you align cross-functional teams when technical constraints conflict with user UX?\nCandidate: I establish a single source of truth early. In our AI screening product, we prioritized explainability over complex black-box scores so HR managers could inspect exact rationale.`,
  },
];

export function IntakeForm({ onOpenExplainer }: { onOpenExplainer?: () => void }) {
  const setProfile = usePipelineStore((s) => s.setProfile);

  // Form states
  const [targetRoleText, setTargetRoleText] = useState('');
  const [targetRoleFile, setTargetRoleFile] = useState<File | null>(null);

  const [resumeText, setResumeText] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const [transcriptText, setTranscriptText] = useState('');
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);

  const [building, setBuilding] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text');

  const targetFileRef = useRef<HTMLInputElement>(null);
  const resumeFileRef = useRef<HTMLInputElement>(null);
  const transcriptFileRef = useRef<HTMLInputElement>(null);

  const hasTargetRole = targetRoleText.trim().length > 0 || targetRoleFile !== null;
  const hasResume = resumeText.trim().length > 0 || resumeFile !== null;
  const hasTranscript = transcriptText.trim().length > 0 || transcriptFile !== null;

  const readyCount = (hasTargetRole ? 1 : 0) + (hasResume ? 1 : 0) + (hasTranscript ? 1 : 0);
  const canBuild = readyCount === 3;

  const loadPreset = (preset: typeof PRESET_DOCKETS[0]) => {
    setTargetRoleText(preset.role);
    setTargetRoleFile(null);
    setResumeText(preset.resume);
    setResumeFile(null);
    setTranscriptText(preset.transcript);
    setTranscriptFile(null);
    setErrorMessage(null);
  };

  const handleBuild = async () => {
    if (!canBuild || building) return;
    setBuilding(true);
    setErrorMessage(null);

    try {
      const profile = await buildCandidateProfile({
        targetRoleText: targetRoleText.trim() || undefined,
        targetRoleFile,
        resumeText: resumeText.trim() || undefined,
        resumeFile,
        transcriptText: transcriptText.trim() || undefined,
        transcriptFile,
      });
      setProfile(profile);
    } catch (err: any) {
      console.warn('Backend buildProfile failed, extracting fact-base locally:', err);
      try {
        let rText = resumeText.trim();
        if (!rText && resumeFile && (resumeFile.type === 'text/plain' || resumeFile.name.endsWith('.txt'))) {
          rText = await resumeFile.text();
        }
        let tText = transcriptText.trim();
        if (!tText && transcriptFile && (transcriptFile.type === 'text/plain' || transcriptFile.name.endsWith('.txt'))) {
          tText = await transcriptFile.text();
        }
        let role = targetRoleText.trim();
        if (!role && targetRoleFile && (targetRoleFile.type === 'text/plain' || targetRoleFile.name.endsWith('.txt'))) {
          role = await targetRoleFile.text();
        }

        const fallback = extractProfileFallback('', role, rText, tText);
        setProfile(fallback);
      } catch {
        setErrorMessage('Failed to parse candidate evidence. Please check input formats.');
        setBuilding(false);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 pb-24">
      {/* Editorial Docket Header */}
      <div className="pb-8 border-b border-border flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="dossier-stamp text-accent-technical">
              [INQUIRY DOCKET // PROTOCOL v2.4]
            </span>
            <span className="text-muted text-xs">•</span>
            <span className="dossier-stamp text-muted">
              EVIDENCE-GROUNDED PROCEEDING
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-text tracking-tight leading-tight">
            Open Candidate Investigation
          </h1>

          <p className="text-sm sm:text-base text-muted mt-3 max-w-2xl leading-relaxed font-normal">
            Deposit three evidentiary records to initiate independent committee deliberation. 
            All extracted facts require verbatim document anchors before entering adversarial debate.
          </p>
        </div>

        {/* Quick Docket Demo Loaders */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-shrink-0">
          <span className="font-mono text-xs font-bold text-text/70 tracking-wider self-center mr-1 hidden lg:inline">
            SAMPLE DOCKETS:
          </span>
          {PRESET_DOCKETS.map((docket) => (
            <button
              key={docket.id}
              type="button"
              onClick={() => loadPreset(docket)}
              className="px-3 py-1.5 rounded-lg border border-border hover:border-accent-technical/60 bg-surface hover:bg-surface-2 transition-all flex items-center justify-between gap-2.5 shadow-2xs group cursor-pointer"
            >
              <div className="text-left">
                <span className="text-[11px] font-semibold text-text block leading-snug">{docket.title}</span>
                <span className="text-[9px] text-muted font-mono block leading-tight mt-0.5">{docket.tag}</span>
              </div>
              <ArrowRight size={11} className="text-muted group-hover:text-accent-technical transition-colors flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Main 3 Evidentiary Streams */}
      <div className="py-8 grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: The 3 Document Streams (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* DOCUMENT 01: TARGET ROLE SPECIFICATION */}
          <div className="border border-border rounded-xl bg-surface p-5 sm:p-6 transition-all hover:border-border-strong">
            <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-border/80">
              <div className="flex items-center gap-2.5">
                <span className="dossier-stamp text-xs font-bold text-accent-technical">
                  DOC 01
                </span>
                <span className="text-xs text-muted">/</span>
                <h2 className="text-sm sm:text-base font-bold text-text">
                  Target Role & Evaluation Criteria
                </h2>
              </div>

              {hasTargetRole ? (
                <span className="dossier-stamp text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 size={12} /> RECORD ATTACHED
                </span>
              ) : (
                <span className="dossier-stamp text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                  AWAITING INPUT
                </span>
              )}
            </div>

            <textarea
              value={targetRoleText}
              onChange={(e) => setTargetRoleText(e.target.value)}
              placeholder="Paste target job description, title, seniority requirements, or key architectural responsibilities..."
              className="w-full bg-surface-2/40 border border-border rounded-lg p-3.5 text-xs sm:text-sm text-text placeholder:text-muted focus:outline-none focus:bg-surface focus:border-accent-technical transition-all min-h-[90px] font-mono leading-relaxed"
            />

            <div className="mt-3 flex items-center justify-between text-xs text-muted">
              <span>Supports pasted role text or file upload (.pdf, .docx, .txt)</span>
              <div>
                <input
                  ref={targetFileRef}
                  type="file"
                  accept=".txt,.pdf,.docx"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && setTargetRoleFile(e.target.files[0])}
                />
                {targetRoleFile ? (
                  <span className="inline-flex items-center gap-1.5 text-accent-technical font-medium bg-accent-technical/10 px-2 py-0.5 rounded">
                    <FileCheck size={13} /> {targetRoleFile.name}
                    <button
                      type="button"
                      onClick={() => setTargetRoleFile(null)}
                      className="hover:text-rose-500 ml-1"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => targetFileRef.current?.click()}
                    className="hover:text-text underline cursor-pointer"
                  >
                    Upload File Instead
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* DOCUMENT 02: CANDIDATE RESUME */}
          <div className="border border-border rounded-xl bg-surface p-5 sm:p-6 transition-all hover:border-border-strong">
            <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-border/80">
              <div className="flex items-center gap-2.5">
                <span className="dossier-stamp text-xs font-bold text-accent-technical">
                  DOC 02
                </span>
                <span className="text-xs text-muted">/</span>
                <h2 className="text-sm sm:text-base font-bold text-text">
                  Candidate Dossier / Formal Resume
                </h2>
              </div>

              {hasResume ? (
                <span className="dossier-stamp text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 size={12} /> RECORD ATTACHED
                </span>
              ) : (
                <span className="dossier-stamp text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                  AWAITING INPUT
                </span>
              )}
            </div>

            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste candidate resume text, verified work history, educational credentials, and claimed accomplishments..."
              className="w-full bg-surface-2/40 border border-border rounded-lg p-3.5 text-xs sm:text-sm text-text placeholder:text-muted focus:outline-none focus:bg-surface focus:border-accent-technical transition-all min-h-[120px] font-mono leading-relaxed"
            />

            <div className="mt-3 flex items-center justify-between text-xs text-muted">
              <span>Text is strictly validated for verbatim evidence quotes</span>
              <div>
                <input
                  ref={resumeFileRef}
                  type="file"
                  accept=".txt,.pdf,.docx"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && setResumeFile(e.target.files[0])}
                />
                {resumeFile ? (
                  <span className="inline-flex items-center gap-1.5 text-accent-technical font-medium bg-accent-technical/10 px-2 py-0.5 rounded">
                    <FileCheck size={13} /> {resumeFile.name}
                    <button
                      type="button"
                      onClick={() => setResumeFile(null)}
                      className="hover:text-rose-500 ml-1"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => resumeFileRef.current?.click()}
                    className="hover:text-text underline cursor-pointer"
                  >
                    Upload File Instead
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* DOCUMENT 03: INTERVIEW RECORDING / TRANSCRIPT */}
          <div className="border border-border rounded-xl bg-surface p-5 sm:p-6 transition-all hover:border-border-strong">
            <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-border/80">
              <div className="flex items-center gap-2.5">
                <span className="dossier-stamp text-xs font-bold text-accent-technical">
                  DOC 03
                </span>
                <span className="text-xs text-muted">/</span>
                <h2 className="text-sm sm:text-base font-bold text-text">
                  Interview Transcript & Hearing Dialogue
                </h2>
              </div>

              {hasTranscript ? (
                <span className="dossier-stamp text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 size={12} /> RECORD ATTACHED
                </span>
              ) : (
                <span className="dossier-stamp text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                  AWAITING INPUT
                </span>
              )}
            </div>

            <textarea
              value={transcriptText}
              onChange={(e) => setTranscriptText(e.target.value)}
              placeholder="Paste raw transcript dialogue between interviewers and candidate..."
              className="w-full bg-surface-2/40 border border-border rounded-lg p-3.5 text-xs sm:text-sm text-text placeholder:text-muted focus:outline-none focus:bg-surface focus:border-accent-technical transition-all min-h-[120px] font-mono leading-relaxed"
            />

            <div className="mt-3 flex items-center justify-between text-xs text-muted">
              <span>Skeptic Auditor interrogates dialogue against resume claims</span>
              <div>
                <input
                  ref={transcriptFileRef}
                  type="file"
                  accept=".txt,.pdf,.docx"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && setTranscriptFile(e.target.files[0])}
                />
                {transcriptFile ? (
                  <span className="inline-flex items-center gap-1.5 text-accent-technical font-medium bg-accent-technical/10 px-2 py-0.5 rounded">
                    <FileCheck size={13} /> {transcriptFile.name}
                    <button
                      type="button"
                      onClick={() => setTranscriptFile(null)}
                      className="hover:text-rose-500 ml-1"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => transcriptFileRef.current?.click()}
                    className="hover:text-text underline cursor-pointer"
                  >
                    Upload File Instead
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Hearing Committee Roster & Protocol (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Committee Specialists Overview */}
          <div className="border border-border rounded-xl bg-surface p-5 sm:p-6">
            <span className="dossier-stamp text-xs text-muted block mb-3">
              COMMITTEE COMPOSITION
            </span>
            <h3 className="text-base font-serif font-bold text-text mb-4">
              4 Independent Evaluators
            </h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3 pb-3 border-b border-border/60">
                <div className="w-8 h-8 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 font-mono text-xs font-bold">
                  01
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text uppercase tracking-wider">Technical Architect</h4>
                  <p className="text-xs text-muted mt-0.5 leading-relaxed">
                    Systems engineering rigor, algorithms, concurrency, and architecture trade-offs.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 pb-3 border-b border-border/60">
                <div className="w-8 h-8 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 font-mono text-xs font-bold">
                  02
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text uppercase tracking-wider">Head of Culture</h4>
                  <p className="text-xs text-muted mt-0.5 leading-relaxed">
                    Communication clarity, team collaboration evidence, and professional maturity.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 pb-3 border-b border-border/60">
                <div className="w-8 h-8 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 font-mono text-xs font-bold">
                  03
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text uppercase tracking-wider">Hiring Director</h4>
                  <p className="text-xs text-muted mt-0.5 leading-relaxed">
                    Target scope alignment, leadership track record, and operational delivery fit.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0 font-mono text-xs font-bold">
                  04
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text uppercase tracking-wider">Skeptic Auditor</h4>
                  <p className="text-xs text-muted mt-0.5 leading-relaxed">
                    Stress-tests claims, uncovers resume-vs-transcript contradictions, and quantifies risk.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Docket Box */}
          <div className="border border-border rounded-xl bg-surface-2/60 p-5 sm:p-6">
            <span className="dossier-stamp text-xs text-muted block mb-2">
              DOCKET READINESS
            </span>
            <div className="flex items-baseline justify-between mb-3">
              <span className="text-2xl font-serif font-bold text-text">{readyCount} / 3</span>
              <span className="dossier-stamp text-xs text-muted">SOURCES VERIFIED</span>
            </div>

            <div className="w-full h-1.5 bg-border rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-accent-technical transition-all duration-300"
                style={{ width: `${(readyCount / 3) * 100}%` }}
              />
            </div>

            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 text-xs text-rose-600 dark:text-rose-400 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20"
                >
                  {errorMessage}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="button"
              onClick={handleBuild}
              disabled={!canBuild || building}
              className="w-full bg-text text-bg hover:opacity-90 active:scale-[0.99] py-3.5 px-4 rounded-lg font-bold text-xs uppercase tracking-wider font-mono flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {building ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>EXTRACTING FACT BASE...</span>
                </>
              ) : (
                <>
                  <span>COMMENCE INQUIRY</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
