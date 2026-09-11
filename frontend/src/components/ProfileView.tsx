import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Pencil, ArrowRight, Briefcase, GraduationCap, Quote, Search, ShieldCheck, FileCheck2, Sparkles, CheckCircle2 } from 'lucide-react';
import { usePipelineStore } from '../lib/store';
import type { CandidateProfile } from '../types';
import { formatCleanRole } from './VerdictReport';

function SkillChip({ skill, index }: { skill: CandidateProfile['skills'][number]; index: number }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        type="button"
        onClick={() => setShowTooltip(!showTooltip)}
        className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs sm:text-[13px] font-medium bg-surface-2 border border-border hover:border-accent-technical/40 transition-colors"
      >
        <span className="text-text font-medium">{skill.name}</span>
        <span
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase"
          style={{
            backgroundColor:
              skill.source === 'resume' ? 'rgba(59,130,246,0.15)' : 'rgba(16,185,129,0.15)',
            color: skill.source === 'resume' ? 'var(--accent-technical)' : 'var(--accent-culture)',
          }}
        >
          {skill.source}
        </span>
      </button>
      {showTooltip && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="absolute bottom-full left-0 mb-2 z-30 w-72 bg-surface border border-border rounded-xl p-3.5 shadow-2xl"
        >
          <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1 flex items-center gap-1">
            <FileCheck2 size={12} className="text-accent-technical" /> Verbatim Source Evidence
          </div>
          <p className="text-xs text-text leading-relaxed font-mono bg-surface-2 p-2 rounded-lg border border-border">
            "{skill.evidence}"
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

function ExperienceTimeline({
  experience,
  index,
}: {
  experience: CandidateProfile['experience'];
  index: number;
}) {
  return (
    <div className="space-y-4">
      {experience.map((exp, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: (index + i) * 0.06, duration: 0.25 }}
          className="relative pl-5"
        >
          {/* Timeline dot + line */}
          <div className="absolute left-0 top-2 w-2.5 h-2.5 rounded-full bg-accent-technical ring-4 ring-accent-technical/10" />
          {i < experience.length - 1 && (
            <div className="absolute left-[4px] top-4 bottom-[-14px] w-px bg-border" />
          )}
          <div>
            <h4 className="text-sm font-bold text-text">{exp.company}</h4>
            <p className="text-[12px] font-medium text-muted">{exp.title} • {exp.duration}</p>
            <ul className="mt-2 space-y-1.5">
              {exp.highlights.map((h, j) => (
                <li key={j} className="text-[12px] sm:text-[13px] text-text/85 flex items-start gap-2 leading-relaxed">
                  <span className="text-accent-technical mt-0.5">•</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function ClaimQuote({
  claim,
  index,
}: {
  claim: CandidateProfile['claims'][number];
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + index * 0.05, duration: 0.25 }}
      className="p-4 rounded-xl bg-surface-2/60 border border-border flex items-start justify-between gap-3.5 group hover:border-accent-skeptic/40 transition-colors"
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <Quote size={16} className="text-accent-skeptic flex-shrink-0 mt-0.5 opacity-80" />
        <p className="text-xs sm:text-[13px] text-text italic leading-relaxed font-mono">
          "{claim.text}"
        </p>
      </div>
      <span
        className="text-[10px] font-semibold px-2 py-0.5 rounded uppercase flex-shrink-0"
        style={{
          backgroundColor:
            claim.source === 'resume' ? 'rgba(59,130,246,0.15)' : 'rgba(16,185,129,0.15)',
          color: claim.source === 'resume' ? 'var(--accent-technical)' : 'var(--accent-culture)',
        }}
      >
        {claim.source}
      </span>
    </motion.div>
  );
}

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
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 pb-20">
      {/* Candidate Header Dossier */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8 p-6 sm:p-7 rounded-2xl bg-surface border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
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
                className="text-2xl sm:text-3xl font-bold text-text bg-surface-2 border border-accent-technical rounded-lg px-2.5 py-1 focus:outline-none"
              />
            ) : (
              <h1 className="text-2xl sm:text-3xl font-bold font-serif text-text tracking-tight">{profile.name}</h1>
            )}
            <button
              onClick={() => {
                setNameInput(profile.name);
                setEditingName(!editingName);
              }}
              className="text-muted hover:text-text transition-colors p-1 cursor-pointer"
              title="Edit Candidate Name"
            >
              <Pencil size={16} />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs sm:text-[13px] font-semibold px-3 py-1 rounded-full bg-accent-technical/10 text-accent-technical border border-accent-technical/20">
              {formatCleanRole(profile.targetRole)}
            </span>
            <span className="text-xs text-emerald-500 font-medium flex items-center gap-1 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              <ShieldCheck size={14} /> Zero-Hallucination Fact Base
            </span>
          </div>

          <p className="text-xs sm:text-sm text-muted mt-3 max-w-2xl leading-relaxed">
            All 4 specialized evaluator agents strictly consume this verified fact-base. No unevidenced external assumptions are allowed downstream.
          </p>
        </div>

        <button
          onClick={handleStartReview}
          disabled={reviewStatus === 'running'}
          className="flex-shrink-0 flex items-center justify-center gap-2.5 rounded-xl px-6 py-3.5 font-bold text-sm sm:text-base bg-accent-technical hover:bg-accent-technical/90 text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
        >
          <Sparkles size={17} />
          <span>Launch 4-Agent Review</span>
          <ArrowRight size={17} />
        </button>
      </motion.div>

      {/* Three Grid Cards */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Skills */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.3 }}
          className="bg-surface rounded-2xl border border-border shadow-2xs p-5 sm:p-6"
        >
          <h3 className="text-sm font-bold text-text mb-4 flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-full bg-accent-technical" />
            Verified Technical Skills
          </h3>
          <div className="flex flex-wrap gap-2">
            {profile.skills.length > 0 ? (
              profile.skills.map((skill, i) => (
                <SkillChip key={i} skill={skill} index={i} />
              ))
            ) : (
              <p className="text-xs text-muted italic">No technical skills detected in candidate input.</p>
            )}
          </div>
        </motion.div>

        {/* Experience */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="bg-surface rounded-2xl border border-border shadow-2xs p-5 sm:p-6"
        >
          <h3 className="text-sm font-bold text-text mb-4 flex items-center gap-2">
            <Briefcase size={16} className="text-amber-500" />
            Career Experience
          </h3>
          {profile.experience.length > 0 ? (
            <ExperienceTimeline experience={profile.experience} index={0} />
          ) : (
            <p className="text-xs text-muted italic">No formal work experience listed in candidate input.</p>
          )}
        </motion.div>

        {/* Education */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="bg-surface rounded-2xl border border-border shadow-2xs p-5 sm:p-6"
        >
          <h3 className="text-sm font-bold text-text mb-4 flex items-center gap-2">
            <GraduationCap size={16} className="text-emerald-500" />
            Education & Degrees
          </h3>
          <div className="space-y-3.5">
            {profile.education.length > 0 ? (
              profile.education.map((edu, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.05, duration: 0.25 }}
                  className="p-3 rounded-xl bg-surface-2/40 border border-border"
                >
                  <h4 className="text-sm font-bold text-text">{edu.school}</h4>
                  <p className="text-xs text-muted mt-0.5">{edu.degree}{edu.year ? ` • ${edu.year}` : ''}</p>
                </motion.div>
              ))
            ) : (
              <p className="text-xs text-muted italic">No educational credentials or degrees provided.</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Key Claims */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="bg-surface rounded-2xl border border-border shadow-2xs p-5 sm:p-6"
      >
        <h3 className="text-sm font-bold text-text mb-3.5 flex items-center gap-2">
          <Search size={16} className="text-rose-500" />
          Extracted Resume Claims
          <span className="text-xs text-muted font-normal ml-1">
            — Target points for Skeptic Auditor cross-examination
          </span>
        </h3>
        <div className="space-y-3">
          {profile.claims.length > 0 ? (
            profile.claims.map((claim, i) => (
              <ClaimQuote key={i} claim={claim} index={i} />
            ))
          ) : (
            <p className="text-xs text-muted italic">No substantive candidate claims extracted.</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
