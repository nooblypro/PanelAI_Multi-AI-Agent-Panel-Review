import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText, Sparkles, FileUp, Loader2 } from 'lucide-react';
import { usePipelineStore } from '../lib/store';
import type { CandidateProfile } from '../types';

function uid(): string {
  return Math.random().toString(36).slice(2, 11);
}

// Simple profile extraction from pasted text — mock heuristic, not a real parser.
function extractProfile(
  name: string,
  role: string,
  resumeText: string,
  transcriptText: string
): CandidateProfile {
  // Heuristic skill extraction: look for common tech keywords in resume
  const techKeywords = [
    'Kafka', 'RabbitMQ', 'Kubernetes', 'Docker', 'AWS', 'GCP', 'Azure',
    'React', 'Node', 'Python', 'Go', 'Java', 'PostgreSQL', 'Redis',
    'Microservices', 'CI/CD', 'Terraform', 'GraphQL', 'gRPC', 'TypeScript',
  'Kafka', 'Elasticsearch', 'MongoDB', 'Kinesis',
  'event-driven', 'distributed systems', 'backpressure', 'exponential backoff',
  'infrastructure-as-code', 'on-call', 'mentor',
  'OKRs', 'led team', 'architected', 'migration',
  'latency', 'throughput', 'scalability', 'reliability',
  'API', 'REST', 'event-driven', 'monolith',
  'CI/CD pipeline', 'jitter', 'replay',
  'mentor', 'on-call rotation',
  'self-organizing', 'infrastructure-as-code',
  'conflict', 'disagreement',
  'hand off', 'ownership',
    'API contract',
  ];

  const foundSkills: { name: string; evidence: string; source: 'resume' | 'transcript' }[] = [];
  const resumeLower = resumeText.toLowerCase();
  const transcriptLower = transcriptText.toLowerCase();

  for (const kw of techKeywords) {
    if (resumeLower.includes(kw.toLowerCase())) {
      // Find a sentence containing the keyword
      const sentences = resumeText.split(/[.\n]/).filter((s) =>
        s.toLowerCase().includes(kw.toLowerCase())
      );
      foundSkills.push({
        name: kw,
        evidence: sentences[0]?.trim().slice(0, 120) || kw,
        source: 'resume',
      });
    } else if (transcriptLower.includes(kw.toLowerCase())) {
      const sentences = transcriptText.split(/[.\n]/).filter((s) =>
        s.toLowerCase().includes(kw.toLowerCase())
      );
      foundSkills.push({
        name: kw,
        evidence: sentences[0]?.trim().slice(0, 120) || kw,
        source: 'transcript',
      });
    }
  }

  // Deduplicate skills by name
  const seen = new Set<string>();
  const skills = foundSkills.filter((s) => {
    if (seen.has(s.name)) return false;
    seen.add(s.name);
    return true;
  }).slice(0, 12);

  // Extract experience: look for lines with company/title patterns
  const experience: CandidateProfile['experience'] = [];
  const expLines = resumeText.split('\n').filter((l) => l.trim().length > 5);
  // Take every other non-empty line as a potential experience entry (mock heuristic)
  for (let i = 0; i < expLines.length && experience.length < 5; i += 2) {
    const line = expLines[i].trim();
    if (line.length > 5 && !line.toLowerCase().includes('education') && !line.toLowerCase().includes('school')) {
      const nextLine = expLines[i + 1]?.trim() || '';
      experience.push({
        company: line.slice(0, 50),
        title: nextLine.slice(0, 50) || 'Engineer',
        duration: '2020 - 2023',
        highlights: ['Key contributor to core systems'],
      });
    }
  }

  // Extract education
  const education: CandidateProfile['education'] = [];
  const eduIdx = resumeText.toLowerCase().indexOf('education');
  if (eduIdx >= 0) {
    const eduSection = resumeText.slice(eduIdx, eduIdx + 300);
    const eduLines = eduSection.split('\n').filter((l) => l.trim().length > 3).slice(1, 3);
    for (const line of eduLines) {
      education.push({
        school: line.slice(0, 60),
        degree: 'B.S. Computer Science',
        year: '2018',
      });
    }
  }
  if (education.length === 0) {
    education.push({ school: 'University', degree: 'B.S. Computer Science', year: '2018' });
  }

  // Extract claims: notable sentences from both sources
  const claims: CandidateProfile['claims'] = [];
  const resumeSentences = resumeText.split(/[.\n]/).filter((s) => s.trim().length > 20);
  const transcriptSentences = transcriptText.split(/[.\n]/).filter((s) => s.trim().length > 20);

  // Pick sentences with strong verbs
  const strongVerbs = ['led', 'built', 'architected', 'drove', 'implemented', 'designed', 'created', 'managed', 'reduced', 'improved', 'migrated', 'chose', 'mentored'];
  for (const s of resumeSentences) {
    if (strongVerbs.some((v) => s.toLowerCase().includes(v))) {
      claims.push({ text: s.trim().slice(0, 150), source: 'resume' });
    }
    if (claims.length >= 4) break;
  }
  for (const s of transcriptSentences) {
    if (s.toLowerCase().includes('i ') || s.toLowerCase().includes('we ')) {
      claims.push({ text: s.trim().slice(0, 150), source: 'transcript' });
    }
    if (claims.length >= 6) break;
  }
  if (claims.length === 0) {
    claims.push({ text: 'No specific claims detected — review manually.', source: 'resume' });
  }

  // Extract name from first line of resume if not provided
  const extractedName = name || resumeText.split('\n')[0]?.trim().slice(0, 50) || 'Unknown Candidate';

  return {
    id: uid(),
    name: extractedName,
    targetRole: role,
    resumeText,
    transcriptText,
    skills: skills.length > 0 ? skills : [
      { name: 'Distributed Systems', evidence: 'Inferred from resume content', source: 'resume' },
    ],
    experience: experience.length > 0 ? experience : [
      { company: 'Tech Corp', title: 'Software Engineer', duration: '2020 - Present', highlights: ['Core systems contributor'] },
    ],
    education,
    claims,
    createdAt: new Date().toISOString(),
  };
}

export function IntakeForm() {
  const setProfile = usePipelineStore((s) => s.setProfile);
  const [targetRole, setTargetRole] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [transcriptText, setTranscriptText] = useState('');
  const [resumeFileName, setResumeFileName] = useState('');
  const [transcriptFileName, setTranscriptFileName] = useState('');
  const [parsing, setParsing] = useState<'resume' | 'transcript' | null>(null);
  const [building, setBuilding] = useState(false);
  const [dragOver, setDragOver] = useState<'resume' | 'transcript' | null>(null);

  const resumeFileRef = useRef<HTMLInputElement>(null);
  const transcriptFileRef = useRef<HTMLInputElement>(null);

  const canBuild = targetRole.trim().length > 0 && resumeText.trim().length > 0 && transcriptText.trim().length > 0;

  const handleFile = useCallback(async (file: File, type: 'resume' | 'transcript') => {
    const isText = file.type === 'text/plain' || file.name.endsWith('.txt');
    if (isText) {
      const text = await file.text();
      if (type === 'resume') {
        setResumeText(text);
        setResumeFileName(file.name);
      } else {
        setTranscriptText(text);
        setTranscriptFileName(file.name);
      }
    } else {
      // PDF/DOCX — show parsing state, accept paste as fallback
      setParsing(type);
      setTimeout(() => {
        setParsing(null);
        if (type === 'resume') setResumeFileName(file.name + ' — paste content below');
        else setTranscriptFileName(file.name + ' — paste content below');
      }, 1500);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, type: 'resume' | 'transcript') => {
    e.preventDefault();
    setDragOver(null);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file, type);
  }, [handleFile]);

  const handleBuild = async () => {
    if (!canBuild) return;
    setBuilding(true);
    // Simulate brief processing
    await new Promise((r) => setTimeout(r, 800));
    const profile = extractProfile('', targetRole, resumeText, transcriptText);
    setProfile(profile);
  };

  return (
    <div className="min-h-[calc(100vh-60px)] flex items-start justify-center pt-12 pb-20 px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-[640px]"
      >
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text mb-2">New Candidate Evaluation</h1>
          <p className="text-sm text-muted">
            Upload or paste the resume and interview transcript. Four AI agents will independently evaluate, then debate, then deliver a hiring verdict.
          </p>
        </div>

        <div className="space-y-5">
          {/* Target Role */}
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">
              Target Role
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Senior Backend Engineer"
              className="w-full bg-surface border border-white/[0.08] rounded-lg px-4 py-3 text-text placeholder:text-muted/60 focus:outline-none focus:border-accent-technical/50 transition-colors"
            />
          </div>

          {/* Upload zones */}
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Resume */}
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                Resume
              </label>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver('resume'); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => handleDrop(e, 'resume')}
                onClick={() => resumeFileRef.current?.click()}
                className={`cursor-pointer rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
                  dragOver === 'resume' ? 'border-accent-technical/50 bg-accent-technical/5' : 'border-white/[0.1] hover:border-white/[0.2] bg-surface'
                }`}
              >
                <input
                  ref={resumeFileRef}
                  type="file"
                  accept=".txt,.pdf,.docx"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0], 'resume')}
                />
                {parsing === 'resume' ? (
                  <div className="flex flex-col items-center gap-2 py-3">
                    <Loader2 size={20} className="animate-spin text-accent-technical" />
                    <span className="text-xs text-muted">Parsing…</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 py-2">
                    <FileUp size={20} className="text-muted" />
                    <span className="text-xs text-muted">Drop file or click to upload</span>
                    <span className="text-[10px] text-muted/70">.txt, .pdf, .docx</span>
                  </div>
                )}
                {resumeFileName && !parsing && (
                  <div className="flex items-center gap-1.5 mt-2 text-[11px] text-accent-technical">
                    <FileText size={12} />
                    <span className="truncate">{resumeFileName}</span>
                  </div>
                )}
              </div>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Or paste resume text here…"
                className="w-full mt-2 bg-surface border border-white/[0.08] rounded-lg px-3 py-2.5 text-[13px] text-text placeholder:text-muted/50 focus:outline-none focus:border-accent-technical/50 transition-colors resize-y min-h-[120px] font-mono"
              />
            </div>

            {/* Transcript */}
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                Interview Transcript
              </label>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver('transcript'); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => handleDrop(e, 'transcript')}
                onClick={() => transcriptFileRef.current?.click()}
                className={`cursor-pointer rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
                  dragOver === 'transcript' ? 'border-accent-culture/50 bg-accent-culture/5' : 'border-white/[0.1] hover:border-white/[0.2] bg-surface'
                }`}
              >
                <input
                  ref={transcriptFileRef}
                  type="file"
                  accept=".txt,.pdf,.docx"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0], 'transcript')}
                />
                {parsing === 'transcript' ? (
                  <div className="flex flex-col items-center gap-2 py-3">
                    <Loader2 size={20} className="animate-spin text-accent-culture" />
                    <span className="text-xs text-muted">Parsing…</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 py-2">
                    <FileUp size={20} className="text-muted" />
                    <span className="text-xs text-muted">Drop file or click to upload</span>
                    <span className="text-[10px] text-muted/70">.txt, .pdf, .docx</span>
                  </div>
                )}
                {transcriptFileName && !parsing && (
                  <div className="flex items-center gap-1.5 mt-2 text-[11px] text-accent-culture">
                    <FileText size={12} />
                    <span className="truncate">{transcriptFileName}</span>
                  </div>
                )}
              </div>
              <textarea
                value={transcriptText}
                onChange={(e) => setTranscriptText(e.target.value)}
                placeholder="Or paste transcript text here…"
                className="w-full mt-2 bg-surface border border-white/[0.08] rounded-lg px-3 py-2.5 text-[13px] text-text placeholder:text-muted/50 focus:outline-none focus:border-accent-culture/50 transition-colors resize-y min-h-[120px] font-mono"
              />
            </div>
          </div>

          {/* Build button */}
          <motion.button
            whileHover={canBuild ? { scale: 1.01 } : undefined}
            whileTap={canBuild ? { scale: 0.99 } : undefined}
            onClick={handleBuild}
            disabled={!canBuild || building}
            className={`w-full flex items-center justify-center gap-2 rounded-lg py-3 font-semibold text-sm transition-colors ${
              canBuild && !building
                ? 'bg-accent-technical text-bg hover:bg-accent-technical/90'
                : 'bg-surface-2 text-muted cursor-not-allowed'
            }`}
          >
            {building ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Building Profile…
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Build Candidate Profile
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
