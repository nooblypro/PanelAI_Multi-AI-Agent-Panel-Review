import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Pencil, ArrowRight, Briefcase, GraduationCap, Quote, Search, ShieldCheck, FileCheck2, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';
import { usePipelineStore } from '../lib/store';
import type { CandidateProfile } from '../types';
import { formatCleanRole } from './VerdictReport';

export function ProfileView() {
  const profile = usePipelineStore((s) => s.profile);
  const updateProfileName = usePipelineStore((s) => s.updateProfileName);
  const setStage = usePipelineStore((s) => s.setStage);
  const startReview = usePipelineStore((s) => s.startReview);
  const prefetchReview = usePipelineStore((s) => s.prefetchReview);
  const reviewStatus = usePipelineStore((s) => s.reviewStatus);

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile?.name || '');

  useEffect(() => {
    if (profile && reviewStatus === 'idle') {
      prefetchReview();
    }
  }, [profile, reviewStatus, prefetchReview]);

  if (!profile) return null;

  const handleStartReview = () => {
    setStage('review');
    if (reviewStatus === 'idle' || reviewStatus === 'error') {
      startReview();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 pb-24">
      {/* Dossier Header */}
      <div className="pb-8 border-b border-border flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="dossier-stamp text-accent-technical">
              [DOSSIER REF: #{profile.id.toUpperCase()}]
            </span>
            <span className="text-muted text-xs">•</span>
            <span className="dossier-stamp text-emerald-600 dark:text-emerald-400">
              ZERO-HALLUCINATION FACT BASE
            </span>
          </div>

          <div className="flex items-center gap-3">
            {editingName ? (
              <input
                autoFocus
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={() => {
                  updateProfileName(nameInput || profile.name);
                  setEditingName(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    updateProfileName(nameInput || profile.name);
                    setEditingName(false);
                  }
                }}
                className="text-3xl sm:text-4xl font-serif font-bold text-text bg-surface-2 border border-accent-technical rounded-lg px-2.5 py-1 focus:outline-none"
              />
            ) : (
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-text tracking-tight">
                {profile.name}
              </h1>
            )}
            <button
              type="button"
              onClick={() => {
                setNameInput(profile.name);
                setEditingName(!editingName);
              }}
              className="text-muted hover:text-text transition-colors p-1 cursor-pointer"
              title="Edit Candidate Identity"
            >
              <Pencil size={18} />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-3">
            <span className="dossier-stamp px-3 py-1 rounded bg-surface-2 border border-border text-xs text-text">
              TARGET SCOPE: {formatCleanRole(profile.targetRole).toUpperCase()}
            </span>
            <span className="text-xs text-muted">
              {profile.skills.length} verified competencies • {profile.claims.length} claims extracted
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleStartReview}
          disabled={reviewStatus === 'running'}
          className="flex-shrink-0 bg-text text-bg hover:opacity-90 active:scale-[0.99] py-3.5 px-6 rounded-lg font-bold text-xs uppercase tracking-wider font-mono flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
        >
          <span>CONVENE INDEPENDENT AUDIT</span>
          <ArrowRight size={15} />
        </button>
      </div>

      {/* Main Dossier Content */}
      <div className="py-8 grid lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Career Trajectory & Credentials (5 Cols) */}
        <div className="lg:col-span-5 space-y-8">
          {/* Work Experience */}
          <div>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/80">
              <span className="dossier-stamp text-xs text-muted">SECTION 01</span>
              <span className="text-xs text-muted">/</span>
              <h2 className="text-sm font-bold uppercase tracking-wider text-text">
                Verified Career Trajectory
              </h2>
            </div>

            {profile.experience.length > 0 ? (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-border">
                {profile.experience.map((exp, i) => (
                  <div key={i} className="relative">
                    {/* Trajectory node marker */}
                    <div className="absolute -left-6 top-1.5 w-4 h-4 rounded-full bg-surface border-2 border-accent-technical flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-technical" />
                    </div>

                    <div>
                      <span className="dossier-stamp text-[10px] text-muted block mb-0.5">
                        {exp.duration}
                      </span>
                      <h3 className="text-base font-serif font-bold text-text">
                        {exp.company}
                      </h3>
                      <p className="text-xs font-semibold text-accent-technical mt-0.5">
                        {exp.title}
                      </p>

                      <ul className="mt-2.5 space-y-1.5">
                        {exp.highlights.map((h, j) => (
                          <li key={j} className="text-xs sm:text-[13px] text-text/85 leading-relaxed flex items-start gap-2">
                            <span className="text-muted mt-1 text-[8px]">•</span>
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted italic">No formal career trajectory recorded.</p>
            )}
          </div>

          {/* Education */}
          <div className="pt-4 border-t border-border/80">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/80">
              <span className="dossier-stamp text-xs text-muted">SECTION 02</span>
              <span className="text-xs text-muted">/</span>
              <h2 className="text-sm font-bold uppercase tracking-wider text-text">
                Educational Credentials
              </h2>
            </div>

            {profile.education.length > 0 ? (
              <div className="space-y-3">
                {profile.education.map((edu, i) => (
                  <div key={i} className="p-3.5 rounded-lg bg-surface border border-border">
                    <span className="dossier-stamp text-[10px] text-muted block mb-0.5">
                      {edu.year || 'CREDENTIAL RECORDED'}
                    </span>
                    <h3 className="text-sm font-bold text-text">{edu.school}</h3>
                    <p className="text-xs text-muted mt-0.5">{edu.degree}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted italic">No formal degree credentials specified.</p>
            )}
          </div>
        </div>

        {/* Right Column: Verified Competencies & Skeptic Targets (7 Cols) */}
        <div className="lg:col-span-7 space-y-8">
          {/* Competency Evidence Table */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-4 pb-2 border-b border-border/80">
              <div className="flex items-center gap-2">
                <span className="dossier-stamp text-xs text-muted">SECTION 03</span>
                <span className="text-xs text-muted">/</span>
                <h2 className="text-sm font-bold uppercase tracking-wider text-text">
                  Competency & Evidence Matrix
                </h2>
              </div>
              <span className="dossier-stamp text-[10px] text-muted">VERBATIM EXCERPTS</span>
            </div>

            <div className="space-y-3">
              {profile.skills.map((skill, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-surface border border-border hover:border-border-strong transition-colors"
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="text-sm font-bold text-text">{skill.name}</span>
                    <span
                      className={`dossier-stamp text-[9px] px-2 py-0.5 rounded ${
                        skill.source === 'transcript'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                      }`}
                    >
                      ANCHOR: {skill.source.toUpperCase()}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-muted bg-surface-2 p-2.5 rounded border border-border/60 leading-relaxed italic">
                    &ldquo;{skill.evidence}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Extracted Assertions (Skeptic Targets) */}
          <div className="pt-4 border-t border-border/80">
            <div className="flex items-center justify-between gap-2 mb-4 pb-2 border-b border-border/80">
              <div className="flex items-center gap-2">
                <span className="dossier-stamp text-xs text-rose-600 dark:text-rose-400">SECTION 04</span>
                <span className="text-xs text-muted">/</span>
                <h2 className="text-sm font-bold uppercase tracking-wider text-text">
                  Key Claims Under Cross-Examination
                </h2>
              </div>
              <span className="dossier-stamp text-[10px] text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
                SKEPTIC TARGETS
              </span>
            </div>

            <div className="space-y-3">
              {profile.claims.map((claim, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-surface border border-border hover:border-rose-500/40 transition-colors flex items-start gap-3.5"
                >
                  <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                    #{String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs sm:text-[13px] text-text/90 italic leading-relaxed">
                      &ldquo;{claim.text}&rdquo;
                    </p>
                    <span className="dossier-stamp text-[9px] text-muted block mt-2">
                      SOURCE RECORD: {claim.source.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
