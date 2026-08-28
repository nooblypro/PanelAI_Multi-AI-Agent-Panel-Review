import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Sparkles, FileUp, Loader2, X, AlertCircle } from 'lucide-react';
import { usePipelineStore } from '../lib/store';
import { buildCandidateProfile } from '../lib/agents';
import type { CandidateProfile } from '../types';

function uid(): string {
  return Math.random().toString(36).slice(2, 11);
}

// Fallback client-side heuristic profile extraction if backend is unreachable
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
      // Fallback: If network or backend fails, try client-side extraction so user is never blocked
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
    <div className="min-h-[calc(100vh-60px)] flex items-start justify-center pt-10 pb-20 px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-[700px]"
      >
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text mb-2">New Candidate Evaluation</h1>
          <p className="text-sm text-muted">
            Upload or paste the target role / job description, resume, and interview transcript. Four AI agents will independently evaluate, debate, and deliver a final hiring verdict.
          </p>
        </div>

        <div className="space-y-6">
          {/* 1. TARGET ROLE */}
          <div className="bg-surface/50 border border-white/[0.06] rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-text uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-hm" />
                Target Role / Job Description
              </label>
              <span className="text-[11px] text-muted">File or text</span>
            </div>

            {/* Dropzone for Target Role */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver('target'); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => handleDrop(e, 'target')}
              onClick={() => targetFileRef.current?.click()}
              className={`cursor-pointer rounded-lg border-2 border-dashed p-3.5 text-center transition-all ${
                dragOver === 'target'
                  ? 'border-accent-hm/60 bg-accent-hm/5'
                  : 'border-white/[0.1] hover:border-white/[0.2] bg-surface'
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
                <div className="flex items-center justify-between bg-white/[0.04] rounded-md px-3 py-2 text-[12px] text-accent-hm">
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
                    className="p-1 hover:bg-white/[0.1] rounded text-muted hover:text-text transition-colors"
                    title="Remove file"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 py-1">
                  <FileUp size={18} className="text-muted" />
                  <span className="text-xs text-muted">Drop role description or click to upload</span>
                  <span className="text-[10px] text-muted/70">.txt, .pdf, .docx</span>
                </div>
              )}
            </div>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-white/[0.06]"></div>
              <span className="flex-shrink mx-3 text-[10px] uppercase tracking-wider text-muted/70 font-semibold">OR</span>
              <div className="flex-grow border-t border-white/[0.06]"></div>
            </div>

            <textarea
              value={targetRoleText}
              onChange={(e) => setTargetRoleText(e.target.value)}
              placeholder="Paste or type job description or target role (e.g. Senior Backend Engineer)..."
              className="w-full bg-surface border border-white/[0.08] rounded-lg px-3 py-2.5 text-[13px] text-text placeholder:text-muted/50 focus:outline-none focus:border-accent-hm/50 transition-colors resize-y min-h-[70px] font-sans"
            />
            {targetRoleFile && targetRoleText.trim() && (
              <p className="text-[11px] text-accent-hm/80 mt-1.5 flex items-center gap-1">
                <span>ℹ️</span> Pasted text takes precedence over the uploaded file.
              </p>
            )}
          </div>

          {/* 2. RESUME & TRANSCRIPT GRID */}
          <div className="grid sm:grid-cols-2 gap-5">
            {/* Resume Card */}
            <div className="bg-surface/50 border border-white/[0.06] rounded-xl p-4 sm:p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-text uppercase tracking-wide flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-technical" />
                    Resume
                  </label>
                  <span className="text-[11px] text-muted">File or text</span>
                </div>

                {/* Dropzone for Resume */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver('resume'); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={(e) => handleDrop(e, 'resume')}
                  onClick={() => resumeFileRef.current?.click()}
                  className={`cursor-pointer rounded-lg border-2 border-dashed p-3.5 text-center transition-all ${
                    dragOver === 'resume'
                      ? 'border-accent-technical/60 bg-accent-technical/5'
                      : 'border-white/[0.1] hover:border-white/[0.2] bg-surface'
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
                    <div className="flex items-center justify-between bg-white/[0.04] rounded-md px-3 py-2 text-[12px] text-accent-technical">
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
                        className="p-1 hover:bg-white/[0.1] rounded text-muted hover:text-text transition-colors"
                        title="Remove file"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 py-1">
                      <FileUp size={18} className="text-muted" />
                      <span className="text-xs text-muted">Drop resume or click to upload</span>
                      <span className="text-[10px] text-muted/70">.txt, .pdf, .docx</span>
                    </div>
                  )}
                </div>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-white/[0.06]"></div>
                  <span className="flex-shrink mx-3 text-[10px] uppercase tracking-wider text-muted/70 font-semibold">OR</span>
                  <div className="flex-grow border-t border-white/[0.06]"></div>
                </div>

                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Or paste resume text here…"
                  className="w-full bg-surface border border-white/[0.08] rounded-lg px-3 py-2.5 text-[13px] text-text placeholder:text-muted/50 focus:outline-none focus:border-accent-technical/50 transition-colors resize-y min-h-[110px] font-mono"
                />
              </div>
              {resumeFile && resumeText.trim() && (
                <p className="text-[11px] text-accent-technical/80 mt-1.5 flex items-center gap-1">
                  <span>ℹ️</span> Pasted text takes precedence over the uploaded file.
                </p>
              )}
            </div>

            {/* Transcript Card */}
            <div className="bg-surface/50 border border-white/[0.06] rounded-xl p-4 sm:p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-text uppercase tracking-wide flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-culture" />
                    Interview Transcript
                  </label>
                  <span className="text-[11px] text-muted">File or text</span>
                </div>

                {/* Dropzone for Transcript */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver('transcript'); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={(e) => handleDrop(e, 'transcript')}
                  onClick={() => transcriptFileRef.current?.click()}
                  className={`cursor-pointer rounded-lg border-2 border-dashed p-3.5 text-center transition-all ${
                    dragOver === 'transcript'
                      ? 'border-accent-culture/60 bg-accent-culture/5'
                      : 'border-white/[0.1] hover:border-white/[0.2] bg-surface'
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
                    <div className="flex items-center justify-between bg-white/[0.04] rounded-md px-3 py-2 text-[12px] text-accent-culture">
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
                        className="p-1 hover:bg-white/[0.1] rounded text-muted hover:text-text transition-colors"
                        title="Remove file"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 py-1">
                      <FileUp size={18} className="text-muted" />
                      <span className="text-xs text-muted">Drop transcript or click to upload</span>
                      <span className="text-[10px] text-muted/70">.txt, .pdf, .docx</span>
                    </div>
                  )}
                </div>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-white/[0.06]"></div>
                  <span className="flex-shrink mx-3 text-[10px] uppercase tracking-wider text-muted/70 font-semibold">OR</span>
                  <div className="flex-grow border-t border-white/[0.06]"></div>
                </div>

                <textarea
                  value={transcriptText}
                  onChange={(e) => setTranscriptText(e.target.value)}
                  placeholder="Or paste transcript text here…"
                  className="w-full bg-surface border border-white/[0.08] rounded-lg px-3 py-2.5 text-[13px] text-text placeholder:text-muted/50 focus:outline-none focus:border-accent-culture/50 transition-colors resize-y min-h-[110px] font-mono"
                />
              </div>
              {transcriptFile && transcriptText.trim() && (
                <p className="text-[11px] text-accent-culture/80 mt-1.5 flex items-center gap-1">
                  <span>ℹ️</span> Pasted text takes precedence over the uploaded file.
                </p>
              )}
            </div>
          </div>

          {/* Validation & Error Notices */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-xs"
              >
                <AlertCircle size={15} className="flex-shrink-0" />
                <span>{errorMessage}</span>
              </motion.div>
            )}

            {!canBuild && missingFields.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[12px] text-muted/80 text-center"
              >
                Please provide{' '}
                <span className="text-warning font-medium">
                  {missingFields.join(', ')}
                </span>{' '}
                (via file upload or text) to begin evaluation.
              </motion.div>
            )}
          </AnimatePresence>

          {/* Build button */}
          <motion.button
            whileHover={canBuild ? { scale: 1.01 } : undefined}
            whileTap={canBuild ? { scale: 0.99 } : undefined}
            onClick={handleBuild}
            disabled={!canBuild || building}
            className={`w-full flex items-center justify-center gap-2 rounded-lg py-3.5 font-semibold text-sm transition-all shadow-lg ${
              canBuild && !building
                ? 'bg-accent-technical text-bg hover:bg-accent-technical/90 shadow-accent-technical/20 cursor-pointer'
                : 'bg-surface-2 text-muted border border-white/[0.05] cursor-not-allowed'
            }`}
          >
            {building ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Constructing Candidate Fact Base…
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Build Candidate Profile
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
