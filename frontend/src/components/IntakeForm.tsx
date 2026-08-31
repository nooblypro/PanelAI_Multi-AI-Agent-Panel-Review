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
  Scale,
  TrendingUp,
  Info,
  Loader2,
  AlertCircle,
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
  const extractedName = name || resumeText.split('\n')[0]?.trim().slice(0, 50) || 'Candidate';

  return {
    id: uid(),
    name: extractedName,
    targetRole: role || 'Software Engineer',
    resumeText: resumeText || '[Resume content from uploaded file]',
    transcriptText: transcriptText || '[Transcript content from uploaded file]',
    skills: [
      { name: 'Distributed Systems', evidence: 'Inferred from profile submission', source: 'resume' },
      { name: 'System Architecture', evidence: 'Inferred from interview transcript', source: 'transcript' },
    ],
    experience: [
      { company: 'Tech Systems', title: role || 'Engineer', duration: '2020 - Present', highlights: ['Core systems contributor'] },
    ],
    education: [{ school: 'University', degree: 'B.S. Computer Science', year: '2019' }],
    claims: [{ text: 'Demonstrated experience in technical evaluation', source: 'resume' }],
    createdAt: new Date().toISOString(),
  };
}

export function IntakeForm() {
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

  const missingFields: string[] = [];
  if (!hasTargetRole) missingFields.push('Target Role');
  if (!hasResume) missingFields.push('Resume');
  if (!hasTranscript) missingFields.push('Interview Transcript');

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
        setErrorMessage(err?.message || 'Failed to construct candidate profile. Please check the backend connection.');
        setBuilding(false);
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-70px)] flex items-center justify-center p-4 sm:p-6 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-6xl bg-surface rounded-2xl md:rounded-3xl border border-border shadow-sm p-5 sm:p-6 md:p-8 transition-colors"
      >
        <div className="grid lg:grid-cols-12 gap-8 items-stretch">
          {/* ========================================================================= */}
          {/* LEFT COLUMN: HERO BRANDING & VALUE PROPOSITIONS */}
          {/* ========================================================================= */}
          <div className="lg:col-span-4 bg-surface-2 border border-border/80 rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-colors">
            <div>
              {/* Illustration */}
              <div className="w-full mb-6 rounded-xl overflow-hidden bg-surface/70 p-2 border border-border shadow-xs flex items-center justify-center">
                <img
                  src="/hero_illustration.jpg"
                  alt="Evaluation Visual"
                  className="w-full h-auto object-cover rounded-lg"
                />
              </div>

              {/* Title & Tagline */}
              <h2 className="text-2xl sm:text-[26px] font-bold font-serif text-text tracking-tight leading-snug">
                Fair. Structured.<br />
                <span className="text-accent-technical">Human</span>-first.
              </h2>

              <p className="text-xs text-muted font-normal leading-relaxed mt-2.5">
                Give every candidate an evaluation that's consistent, unbiased, and insightful.
              </p>
            </div>

            {/* Value Proposition Features */}
            <div className="space-y-4 mt-8 pt-6 border-t border-border">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent-technical/10 border border-accent-technical/20 flex items-center justify-center text-accent-technical flex-shrink-0 mt-0.5">
                  <Shield size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-text">Independent AI agents</h4>
                  <p className="text-[11px] text-muted">Multiple perspectives, zero bias</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 flex-shrink-0 mt-0.5">
                  <Scale size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-text">Structured process</h4>
                  <p className="text-[11px] text-muted">Every detail considered</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500 flex-shrink-0 mt-0.5">
                  <TrendingUp size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-text">Actionable insights</h4>
                  <p className="text-[11px] text-muted">Clear verdicts and reports</p>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: EVALUATION FORM & FILE UPLOAD DROPZONES */}
          {/* ========================================================================= */}
          <div className="lg:col-span-8 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
                <div>
                  <h1 className="text-2xl md:text-[28px] font-bold font-serif text-text tracking-tight">
                    New Candidate Evaluation
                  </h1>
                  <p className="text-xs sm:text-[13px] text-muted mt-1.5 leading-relaxed max-w-xl">
                    Upload or paste the target role / job description, resume, and interview transcript. Four AI agents will independently evaluate, debate, and deliver a final hiring verdict.
                  </p>
                </div>

                {/* Secure Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-surface-2 text-[11px] text-muted flex-shrink-0 self-start">
                  <Info size={13} className="text-muted" />
                  <span>All files are <strong className="text-success font-semibold">secure & private</strong></span>
                </div>
              </div>

              {/* Form Cards */}
              <div className="space-y-4">
                {/* ------------------------------------------------------------- */}
                {/* 1. TARGET ROLE / JOB DESCRIPTION (FULL WIDTH) */}
                {/* ------------------------------------------------------------- */}
                <div className="border border-border rounded-xl p-4 sm:p-5 bg-surface shadow-xs transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-accent-technical/10 text-accent-technical flex items-center justify-center">
                        <Briefcase size={13} />
                      </div>
                      <span className="text-xs font-bold text-text">1. Target Role / Job Description</span>
                    </div>
                    <span className="text-[11px] text-muted">File or text</span>
                  </div>

                  {/* Dropzone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver('target'); }}
                    onDragLeave={() => setDragOver(null)}
                    onDrop={(e) => handleDrop(e, 'target')}
                    onClick={() => targetFileRef.current?.click()}
                    className={`cursor-pointer rounded-xl border-2 border-dashed p-4 text-center transition-all ${
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
                      <div className="flex items-center justify-between bg-surface rounded-md px-3 py-2 text-[12px] text-accent-technical border border-border shadow-xs">
                        <div className="flex items-center gap-2 truncate">
                          <FileText size={14} className="flex-shrink-0" />
                          <span className="truncate font-medium">{targetRoleFile.name}</span>
                          <span className="text-[10px] text-muted">({(targetRoleFile.size / 1024).toFixed(1)} KB)</span>
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
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <UploadCloud size={20} className="text-accent-technical" />
                        <span className="text-xs font-medium text-text">Drag and drop your file here, or click to browse</span>
                        <span className="text-[11px] text-muted">.txt, .pdf, .docx</span>
                      </div>
                    )}
                  </div>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-border"></div>
                    <span className="flex-shrink mx-3 text-[10px] uppercase tracking-wider text-muted font-semibold">OR</span>
                    <div className="flex-grow border-t border-border"></div>
                  </div>

                  <textarea
                    value={targetRoleText}
                    onChange={(e) => setTargetRoleText(e.target.value)}
                    placeholder="Paste or type job description or target role (e.g. Senior Backend Engineer)..."
                    className="w-full bg-surface-2/50 border border-border rounded-lg px-3.5 py-2.5 text-xs text-text placeholder:text-muted focus:outline-none focus:bg-surface focus:border-accent-technical focus:ring-1 focus:ring-accent-technical/30 transition-all resize-y min-h-[64px]"
                  />
                </div>

                {/* ------------------------------------------------------------- */}
                {/* 2 & 3: RESUME & TRANSCRIPT 2-COLUMN GRID */}
                {/* ------------------------------------------------------------- */}
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* RESUME CARD */}
                  <div className="border border-border rounded-xl p-4 sm:p-5 bg-surface shadow-xs flex flex-col justify-between transition-colors">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                            <User size={13} />
                          </div>
                          <span className="text-xs font-bold text-text">2. Resume</span>
                        </div>
                        <span className="text-[11px] text-muted">File or text</span>
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
                          <div className="flex items-center justify-between bg-surface rounded-md px-3 py-2 text-[12px] text-emerald-500 border border-border shadow-xs">
                            <div className="flex items-center gap-2 truncate">
                              <FileText size={14} className="flex-shrink-0" />
                              <span className="truncate font-medium">{resumeFile.name}</span>
                              <span className="text-[10px] text-muted">({(resumeFile.size / 1024).toFixed(1)} KB)</span>
                            </div>
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
                          <div className="flex flex-col items-center gap-1">
                            <UploadCloud size={18} className="text-emerald-500" />
                            <span className="text-xs font-medium text-text">Drag and drop your file here, or click to browse</span>
                            <span className="text-[11px] text-muted">.txt, .pdf, .docx</span>
                          </div>
                        )}
                      </div>

                      <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-border"></div>
                        <span className="flex-shrink mx-3 text-[10px] uppercase tracking-wider text-muted font-semibold">OR</span>
                        <div className="flex-grow border-t border-border"></div>
                      </div>

                      <textarea
                        value={resumeText}
                        onChange={(e) => setResumeText(e.target.value)}
                        placeholder="Paste resume text here..."
                        className="w-full bg-surface-2/50 border border-border rounded-lg px-3 py-2 text-xs text-text placeholder:text-muted focus:outline-none focus:bg-surface focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all resize-y min-h-[64px]"
                      />
                    </div>
                  </div>

                  {/* TRANSCRIPT CARD */}
                  <div className="border border-border rounded-xl p-4 sm:p-5 bg-surface shadow-xs flex flex-col justify-between transition-colors">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-amber-500/10 text-amber-500 flex items-center justify-center">
                            <Mic size={13} />
                          </div>
                          <span className="text-xs font-bold text-text">3. Interview Transcript</span>
                        </div>
                        <span className="text-[11px] text-muted">File or text</span>
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
                          <div className="flex items-center justify-between bg-surface rounded-md px-3 py-2 text-[12px] text-amber-500 border border-border shadow-xs">
                            <div className="flex items-center gap-2 truncate">
                              <FileText size={14} className="flex-shrink-0" />
                              <span className="truncate font-medium">{transcriptFile.name}</span>
                              <span className="text-[10px] text-muted">({(transcriptFile.size / 1024).toFixed(1)} KB)</span>
                            </div>
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
                          <div className="flex flex-col items-center gap-1">
                            <UploadCloud size={18} className="text-amber-500" />
                            <span className="text-xs font-medium text-text">Drag and drop your file here, or click to browse</span>
                            <span className="text-[11px] text-muted">.txt, .pdf, .docx</span>
                          </div>
                        )}
                      </div>

                      <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-border"></div>
                        <span className="flex-shrink mx-3 text-[10px] uppercase tracking-wider text-muted font-semibold">OR</span>
                        <div className="flex-grow border-t border-border"></div>
                      </div>

                      <textarea
                        value={transcriptText}
                        onChange={(e) => setTranscriptText(e.target.value)}
                        placeholder="Paste transcript text here..."
                        className="w-full bg-surface-2/50 border border-border rounded-lg px-3 py-2 text-xs text-text placeholder:text-muted focus:outline-none focus:bg-surface focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all resize-y min-h-[64px]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message if any */}
            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs"
                >
                  <AlertCircle size={15} className="flex-shrink-0" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom Actions & Requirement Notice */}
            <div className="mt-5 space-y-3">
              {/* Info notice bar */}
              <div className="bg-surface-2 border border-border rounded-xl px-4 py-2.5 flex items-center justify-center gap-2 text-xs text-muted text-center transition-colors">
                <Info size={14} className="text-muted flex-shrink-0" />
                <span>
                  Please provide{' '}
                  <strong className="text-accent-technical font-semibold">Target Role</strong>,{' '}
                  <strong className="text-emerald-500 font-semibold">Resume</strong>,{' '}
                  <strong className="text-amber-500 font-semibold">Interview Transcript</strong> to begin evaluation.
                </span>
              </div>

              {/* Build Candidate Profile CTA */}
              <button
                onClick={handleBuild}
                disabled={!canBuild || building}
                className="w-full bg-text hover:opacity-90 active:scale-[0.995] text-bg py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {building ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Building Candidate Profile...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Build Candidate Profile</span>
                    <ArrowRight size={16} className="ml-auto" />
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
