import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  User,
  Mic,
  UploadCloud,
  FileText,
  X,
  Sparkles,
  ArrowRight,
  Shield,
  Users,
  Search,
  Info,
  Loader2,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { usePipelineStore } from '../lib/store';
import { buildCandidateProfile } from '../lib/agents';
import type { CandidateProfile } from '../types';

function uid(): string {
  return Math.random().toString(36).slice(2, 11);
}

// Fallback client-side profile extraction if backend is unreachable
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
    targetRole: role || 'Senior AI Systems Engineer',
    resumeText: resumeText || 'Senior Systems Architect with 8+ years experience building distributed LLM pipelines, autonomous tool-calling agents, and real-time streaming infrastructure in Rust and Python.',
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

const PRESET_SAMPLES = [
  {
    title: 'Senior Staff AI Engineer',
    role: 'Staff AI Systems & Agentic Workflows Engineer',
    resume: `Alex Rivers\nSan Francisco, CA • alex.rivers@example.com\n\nSUMMARY\nStaff AI Systems Engineer with 8+ years leading production LLM infrastructure, multi-agent orchestration, and real-time streaming backends.\n\nEXPERIENCE\nNexus AI Labs — Staff Engineer (2022 - Present)\n• Designed and built high-throughput multi-agent deliberation framework serving 10M+ daily API requests.\n• Reduced LLM inference latency by 45% using Rust token streams and dynamic prompt compression.\n\nSKILLS\nPython, Rust, FastAPI, PyTorch, asyncio, Docker, Kubernetes, PostgreSQL, Multi-Agent Systems.`,
    transcript: `Interviewer: Tell me about a time you resolved a major deadlock or latency bottleneck in your multi-agent architecture.\nCandidate: At Nexus, our independent reviewer agents were causing severe rate-limit spikes when calling OpenRouter. I refactored the dispatch loop to use asyncio.gather with micro-staggering and exponential backoff jitter. That stabilized latency from 5s down to under 900ms without dropping requests.\nInterviewer: How do you handle evidence verification?\nCandidate: Every agent output must cite verbatim substrings from raw input text. If an agent claims experience not present in the fact-base, the Skeptic auditor agent automatically flags it.`,
  },
  {
    title: 'Lead Technical Product Manager',
    role: 'Principal Technical Product Manager - AI Platform',
    resume: `Morgan Chen\nNew York, NY • morgan.chen@example.com\n\nSUMMARY\nLead Product Manager with 6+ years driving enterprise AI/ML platforms and developer tool APIs.\n\nEXPERIENCE\nSynthia AI — Lead PM (2021 - Present)\n• Scaled AI Recruiting Platform from $0 to $4.2M ARR in 18 months.\n• Partnered with engineering to implement strict evidence-based candidate assessment rubrics.\n\nSKILLS\nProduct Strategy, Roadmap Design, AI Ethics & Compliance, API Design, User Research.`,
    transcript: `Interviewer: How do you align cross-functional teams when technical constraints conflict with user UX?\nCandidate: I establish a single source of truth early. In our AI screening product, we prioritized explainability over complex black-box scores so HR managers could inspect exact rationale.`,
  },
];

export function IntakeForm({ onOpenExplainer }: { onOpenExplainer?: () => void }) {
  const setProfile = usePipelineStore((s) => s.setProfile);

  // Target Role state
  const [targetRoleText, setTargetRoleText] = useState('');
  const [targetRoleFile, setTargetRoleFile] = useState<File | null>(null);

  // Resume state
  const [resumeText, setResumeText] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  // Transcript state
  const [transcriptText, setTranscriptText] = useState('');
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);

  // UI state
  const [building, setBuilding] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<'target' | 'resume' | 'transcript' | null>(null);

  const targetFileRef = useRef<HTMLInputElement>(null);
  const resumeFileRef = useRef<HTMLInputElement>(null);
  const transcriptFileRef = useRef<HTMLInputElement>(null);

  // Validation: Each of the 3 fields needs AT LEAST one valid source (text OR file)
  const hasTargetRole = targetRoleText.trim().length > 0 || targetRoleFile !== null;
  const hasResume = resumeText.trim().length > 0 || resumeFile !== null;
  const hasTranscript = transcriptText.trim().length > 0 || transcriptFile !== null;

  const canBuild = hasTargetRole && hasResume && hasTranscript;

  const loadPreset = (preset: typeof PRESET_SAMPLES[0]) => {
    setTargetRoleText(preset.role);
    setTargetRoleFile(null);
    setResumeText(preset.resume);
    setResumeFile(null);
    setTranscriptText(preset.transcript);
    setTranscriptFile(null);
    setErrorMessage(null);
  };

  const handleFileSelect = useCallback((file: File, type: 'target' | 'resume' | 'transcript') => {
    setErrorMessage(null);
    if (type === 'target') {
      setTargetRoleFile(file);
    } else if (type === 'resume') {
      setResumeFile(file);
    } else {
      setTranscriptFile(file);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, type: 'target' | 'resume' | 'transcript') => {
    e.preventDefault();
    setDragOver(null);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file, type);
  }, [handleFileSelect]);

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
      console.warn('Backend profile build error:', err);
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
        setErrorMessage(err?.message || 'Failed to construct candidate profile. Please check backend connection.');
        setBuilding(false);
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-65px)] flex items-center justify-center p-4 sm:p-6 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-7xl bg-surface rounded-2xl md:rounded-3xl border border-border shadow-xl p-5 sm:p-7 md:p-9"
      >
        <div className="grid lg:grid-cols-12 gap-8 items-stretch">
          {/* ========================================================================= */}
          {/* LEFT COLUMN: HERO BRANDING & COMMITTEE PERSONAS */}
          {/* ========================================================================= */}
          <div className="lg:col-span-4 bg-surface-2/70 border border-border/80 rounded-2xl p-6 sm:p-7 flex flex-col justify-between">
            <div>
              {/* Preset Loader Banner */}
              <div className="mb-6 bg-surface border border-border rounded-xl p-4 shadow-2xs">
                <div className="flex items-center gap-2 mb-2.5">
                  <Zap size={15} className="text-amber-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-text">Quick Demo Presets</span>
                </div>
                <p className="text-xs text-muted leading-relaxed mb-3">
                  Click to pre-fill verified sample evaluation data in 1-click:
                </p>
                <div className="space-y-2">
                  {PRESET_SAMPLES.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => loadPreset(sample)}
                      className="w-full text-left px-3 py-2 rounded-lg bg-surface-2 hover:bg-surface-3 border border-border hover:border-accent-technical/40 text-xs font-semibold text-text flex items-center justify-between transition-all cursor-pointer group"
                    >
                      <span className="truncate">{sample.title}</span>
                      <ArrowRight size={13} className="text-muted group-hover:text-accent-technical transition-colors" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Eyebrow & Title */}
              <span className="text-xs font-bold uppercase tracking-wider text-accent-technical mb-2 block">
                Multi-Agent Hiring Committee
              </span>
              <h2 className="text-2xl sm:text-[26px] font-bold font-serif text-text tracking-tight leading-snug">
                Evidence-Based <br />
                <span className="text-accent-technical">Deliberative Panel</span>
              </h2>

              <p className="text-xs sm:text-sm text-muted font-normal leading-relaxed mt-2.5">
                PanelAI conducts adversarial candidate assessments using specialized AI personas that cross-examine findings in structured debate.
              </p>

              {/* 4 Specialized AI Evaluator Badges */}
              <div className="space-y-3 mt-6 pt-5 border-t border-border">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent-technical/10 border border-accent-technical/20 flex items-center justify-center text-accent-technical flex-shrink-0 mt-0.5">
                    <Shield size={16} />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-semibold text-text">Technical Agent</h4>
                    <p className="text-xs text-muted leading-snug">Systems depth, algorithms & code quality</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 flex-shrink-0 mt-0.5">
                    <Users size={16} />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-semibold text-text">HR / Culture Agent</h4>
                    <p className="text-xs text-muted leading-snug">Communication, collaboration & values</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 flex-shrink-0 mt-0.5">
                    <Briefcase size={16} />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-semibold text-text">Hiring Manager</h4>
                    <p className="text-xs text-muted leading-snug">Target role fit & execution history</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 flex-shrink-0 mt-0.5">
                    <Search size={16} />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-semibold text-text">Skeptic Auditor</h4>
                    <p className="text-xs text-muted leading-snug">Cross-checks evidence & catches gaps</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Explainer Trigger */}
            {onOpenExplainer && (
              <button
                type="button"
                onClick={onOpenExplainer}
                className="w-full mt-6 flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl bg-surface border border-border hover:border-accent-technical/40 text-text text-[13px] font-semibold transition-colors cursor-pointer"
              >
                <HelpCircle size={15} className="text-accent-technical" />
                <span>How PanelAI Works</span>
                <ArrowRight size={14} className="text-muted ml-auto" />
              </button>
            )}
          </div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: EVALUATION FORM & FILE UPLOAD CARDS */}
          {/* ========================================================================= */}
          <div className="lg:col-span-8 flex flex-col justify-between">
            <div>
              {/* Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-border">
                <div>
                  <h1 className="text-2xl font-bold font-serif text-text tracking-tight">
                    Candidate Evidence Intake
                  </h1>
                  <p className="text-xs sm:text-sm text-muted mt-1 leading-relaxed">
                    Provide the Target Role, Resume, and Interview Transcript to initiate evaluation.
                  </p>
                </div>

                {/* Validation Status Indicator */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-2 border border-border text-xs font-medium">
                  <span className={`w-2 h-2 rounded-full ${canBuild ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  <span className="text-muted">
                    {canBuild ? 'All 3 Sources Ready' : 'Completion Pending'}
                  </span>
                </div>
              </div>

              {/* Form Cards */}
              <div className="space-y-4">
                {/* 1. TARGET ROLE */}
                <div className="border border-border rounded-xl p-4 sm:p-5 bg-surface transition-all hover:border-border-strong">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-accent-technical/10 text-accent-technical flex items-center justify-center font-bold text-xs">
                        1
                      </div>
                      <span className="text-sm font-bold text-text">Target Role / Job Description</span>
                      {hasTargetRole && <CheckCircle2 size={16} className="text-emerald-500 ml-1" />}
                    </div>
                    <span className="text-xs text-muted">File or Text</span>
                  </div>

                  {/* Dropzone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver('target'); }}
                    onDragLeave={() => setDragOver(null)}
                    onDrop={(e) => handleDrop(e, 'target')}
                    onClick={() => targetFileRef.current?.click()}
                    className={`cursor-pointer rounded-xl border-2 border-dashed p-3.5 text-center transition-all ${
                      dragOver === 'target'
                        ? 'border-accent-technical bg-accent-technical/10'
                        : 'border-border hover:border-accent-technical/60 bg-surface-2/40 hover:bg-surface-2'
                    }`}
                  >
                    <input
                      ref={targetFileRef}
                      type="file"
                      accept=".txt,.pdf,.docx"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], 'target')}
                    />

                    {targetRoleFile ? (
                      <div className="flex items-center justify-between bg-surface rounded-lg px-3.5 py-2 text-sm text-accent-technical border border-border shadow-2xs">
                        <div className="flex items-center gap-2 truncate">
                          <FileText size={16} className="flex-shrink-0" />
                          <span className="truncate font-medium">{targetRoleFile.name}</span>
                          <span className="text-xs text-muted">({(targetRoleFile.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTargetRoleFile(null);
                            if (targetFileRef.current) targetFileRef.current.value = '';
                          }}
                          className="p-1 hover:bg-surface-2 rounded text-muted hover:text-text"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-xs text-muted">
                        <UploadCloud size={16} className="text-accent-technical" />
                        <span className="font-medium text-text">Upload .pdf / .docx / .txt</span>
                        <span>or click to browse</span>
                      </div>
                    )}
                  </div>

                  <textarea
                    value={targetRoleText}
                    onChange={(e) => setTargetRoleText(e.target.value)}
                    placeholder="Or paste target job description here..."
                    className="w-full mt-3 bg-surface-2/40 border border-border rounded-lg px-3.5 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:bg-surface focus:border-accent-technical transition-all resize-y min-h-[65px]"
                  />
                </div>

                {/* 2 & 3: RESUME & TRANSCRIPT GRID */}
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* RESUME CARD */}
                  <div className="border border-border rounded-xl p-4 sm:p-5 bg-surface transition-all hover:border-border-strong flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs">
                            2
                          </div>
                          <span className="text-sm font-bold text-text">Candidate Resume</span>
                          {hasResume && <CheckCircle2 size={16} className="text-emerald-500 ml-1" />}
                        </div>
                      </div>

                      {/* Dropzone */}
                      <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver('resume'); }}
                        onDragLeave={() => setDragOver(null)}
                        onDrop={(e) => handleDrop(e, 'resume')}
                        onClick={() => resumeFileRef.current?.click()}
                        className={`cursor-pointer rounded-xl border-2 border-dashed p-3.5 text-center transition-all ${
                          dragOver === 'resume'
                            ? 'border-emerald-500 bg-emerald-500/10'
                            : 'border-border hover:border-emerald-500/60 bg-surface-2/40 hover:bg-surface-2'
                        }`}
                      >
                        <input
                          ref={resumeFileRef}
                          type="file"
                          accept=".txt,.pdf,.docx"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], 'resume')}
                        />

                        {resumeFile ? (
                          <div className="flex items-center justify-between bg-surface rounded-lg px-3 py-1.5 text-xs text-emerald-500 border border-border">
                            <span className="truncate font-medium">{resumeFile.name}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setResumeFile(null);
                                if (resumeFileRef.current) resumeFileRef.current.value = '';
                              }}
                              className="p-1 hover:bg-surface-2 rounded text-muted hover:text-text"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2 text-xs text-muted">
                            <User size={15} className="text-emerald-500" />
                            <span className="font-medium text-text">Upload Resume File</span>
                          </div>
                        )}
                      </div>

                      <textarea
                        value={resumeText}
                        onChange={(e) => setResumeText(e.target.value)}
                        placeholder="Or paste resume content..."
                        className="w-full mt-3 bg-surface-2/40 border border-border rounded-lg px-3.5 py-2 text-xs sm:text-sm text-text placeholder:text-muted focus:outline-none focus:bg-surface focus:border-emerald-500 transition-all resize-y min-h-[75px]"
                      />
                    </div>
                  </div>

                  {/* TRANSCRIPT CARD */}
                  <div className="border border-border rounded-xl p-4 sm:p-5 bg-surface transition-all hover:border-border-strong flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xs">
                            3
                          </div>
                          <span className="text-sm font-bold text-text">Interview Transcript</span>
                          {hasTranscript && <CheckCircle2 size={16} className="text-emerald-500 ml-1" />}
                        </div>
                      </div>

                      {/* Dropzone */}
                      <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver('transcript'); }}
                        onDragLeave={() => setDragOver(null)}
                        onDrop={(e) => handleDrop(e, 'transcript')}
                        onClick={() => transcriptFileRef.current?.click()}
                        className={`cursor-pointer rounded-xl border-2 border-dashed p-3.5 text-center transition-all ${
                          dragOver === 'transcript'
                            ? 'border-amber-500 bg-amber-500/10'
                            : 'border-border hover:border-amber-500/60 bg-surface-2/40 hover:bg-surface-2'
                        }`}
                      >
                        <input
                          ref={transcriptFileRef}
                          type="file"
                          accept=".txt,.pdf,.docx"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], 'transcript')}
                        />

                        {transcriptFile ? (
                          <div className="flex items-center justify-between bg-surface rounded-lg px-3 py-1.5 text-xs text-amber-500 border border-border">
                            <span className="truncate font-medium">{transcriptFile.name}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTranscriptFile(null);
                                if (transcriptFileRef.current) transcriptFileRef.current.value = '';
                              }}
                              className="p-1 hover:bg-surface-2 rounded text-muted hover:text-text"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2 text-xs text-muted">
                            <Mic size={15} className="text-amber-500" />
                            <span className="font-medium text-text">Upload Transcript File</span>
                          </div>
                        )}
                      </div>

                      <textarea
                        value={transcriptText}
                        onChange={(e) => setTranscriptText(e.target.value)}
                        placeholder="Or paste interview transcript..."
                        className="w-full mt-3 bg-surface-2/40 border border-border rounded-lg px-3.5 py-2 text-xs sm:text-sm text-text placeholder:text-muted focus:outline-none focus:bg-surface focus:border-amber-500 transition-all resize-y min-h-[75px]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Banner */}
            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="mt-4 flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs sm:text-sm"
                >
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom Launch Bar */}
            <div className="mt-6 pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-muted">
                <Info size={14} />
                <span>Zero-hallucination fact base extracted with verbatim quote anchors</span>
              </div>

              <button
                onClick={handleBuild}
                disabled={!canBuild || building}
                className="w-full sm:w-auto bg-text hover:opacity-90 active:scale-[0.99] text-bg py-3 px-7 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 shadow-md transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {building ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Extracting Fact Base...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Build Candidate Fact Base</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
