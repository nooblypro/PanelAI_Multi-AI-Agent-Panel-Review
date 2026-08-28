import { useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil, ArrowRight, Briefcase, GraduationCap, Quote, Search } from 'lucide-react';
import { usePipelineStore } from '../lib/store';
import type { CandidateProfile } from '../types';

function SkillChip({ skill, index }: { skill: CandidateProfile['skills'][number]; index: number }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        onClick={() => setShowTooltip(!showTooltip)}
        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium bg-surface-2 border border-white/[0.08] hover:border-white/[0.15] transition-colors"
      >
        {skill.name}
        <span
          className="text-[9px] font-semibold px-1 py-0.5 rounded uppercase"
          style={{
            backgroundColor:
              skill.source === 'resume' ? 'rgba(76,141,255,0.12)' : 'rgba(52,211,153,0.12)',
            color: skill.source === 'resume' ? '#4C8DFF' : '#34D399',
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
          className="absolute bottom-full left-0 mb-2 z-20 w-64 bg-surface-2 border border-white/[0.1] rounded-lg p-3 shadow-xl"
        >
          <p className="text-[11px] text-muted leading-relaxed font-mono">{skill.evidence}</p>
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
          <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-accent-technical/60" />
          {i < experience.length - 1 && (
            <div className="absolute left-[3px] top-4 bottom-[-12px] w-px bg-white/[0.08]" />
          )}
          <div>
            <h4 className="text-[13px] font-semibold text-text">{exp.company}</h4>
            <p className="text-[12px] text-muted">{exp.title} · {exp.duration}</p>
            <ul className="mt-1.5 space-y-1">
              {exp.highlights.map((h, j) => (
                <li key={j} className="text-[12px] text-text/70 flex items-start gap-1.5">
                  <span className="text-muted mt-0.5">·</span>
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
      transition={{ delay: index * 0.05, duration: 0.25 }}
      className="border-l-2 pl-3 py-2 rounded-r-sm bg-surface-2/50"
      style={{
        borderColor: claim.source === 'resume' ? '#4C8DFF' : '#34D399',
      }}
    >
      <div className="flex items-start gap-2">
        <Quote size={14} className="text-muted/50 flex-shrink-0 mt-0.5" />
        <p className="font-mono text-[12px] leading-relaxed text-text/85 italic">
          {claim.text}
        </p>
      </div>
      <span
        className="inline-block mt-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase"
        style={{
          backgroundColor:
            claim.source === 'resume' ? 'rgba(76,141,255,0.12)' : 'rgba(52,211,153,0.12)',
          color: claim.source === 'resume' ? '#4C8DFF' : '#34D399',
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
  const reviewStatus = usePipelineStore((s) => s.reviewStatus);

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile?.name || '');

  if (!profile) return null;

  const handleStartReview = () => {
    setStage('review');
    startReview();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-1">
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
              className="text-2xl font-bold text-text bg-surface border border-white/[0.1] rounded px-2 py-1 focus:outline-none focus:border-accent-technical/50"
            />
          ) : (
            <h1 className="text-2xl font-bold text-text">{profile.name}</h1>
          )}
          <button
            onClick={() => {
              setNameInput(profile.name);
              setEditingName(!editingName);
            }}
            className="text-muted hover:text-text transition-colors p-1"
          >
            <Pencil size={15} />
          </button>
        </div>
        <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-accent-technical/10 text-accent-technical border border-accent-technical/20">
          {profile.targetRole}
        </span>
        <p className="text-[12px] text-muted mt-3 max-w-2xl">
          This is the shared fact-base. All four agents read only from this profile — no other context is passed downstream.
        </p>
      </motion.div>

      {/* Three columns */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Skills */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.3 }}
          className="bg-surface rounded-lg border border-white/[0.06] p-5"
        >
          <h3 className="text-[13px] font-semibold text-text mb-3 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-accent-technical" />
            Skills
          </h3>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill, i) => (
              <SkillChip key={i} skill={skill} index={i} />
            ))}
          </div>
        </motion.div>

        {/* Experience */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="bg-surface rounded-lg border border-white/[0.06] p-5"
        >
          <h3 className="text-[13px] font-semibold text-text mb-4 flex items-center gap-2">
            <Briefcase size={14} className="text-accent-hm" />
            Experience
          </h3>
          <ExperienceTimeline experience={profile.experience} index={0} />
        </motion.div>

        {/* Education */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="bg-surface rounded-lg border border-white/[0.06] p-5"
        >
          <h3 className="text-[13px] font-semibold text-text mb-4 flex items-center gap-2">
            <GraduationCap size={14} className="accent-culture" style={{ color: '#34D399' }} />
            Education
          </h3>
          <div className="space-y-3">
            {profile.education.map((edu, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05, duration: 0.25 }}
              >
                <h4 className="text-[13px] font-semibold text-text">{edu.school}</h4>
                <p className="text-[12px] text-muted">{edu.degree}{edu.year ? ` · ${edu.year}` : ''}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Key Claims */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="mb-8"
      >
        <h3 className="text-[13px] font-semibold text-text mb-3 flex items-center gap-2">
          <Search size={14} className="text-accent-skeptic" />
          Key Claims
          <span className="text-[11px] text-muted font-normal ml-1">
            — what the Skeptic Agent will interrogate
          </span>
        </h3>
        <div className="space-y-2.5">
          {profile.claims.map((claim, i) => (
            <ClaimQuote key={i} claim={claim} index={i} />
          ))}
        </div>
      </motion.div>

      {/* Action */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <button
          onClick={handleStartReview}
          disabled={reviewStatus === 'running'}
          aria-label="Run independent review with 4 parallel evaluator agents"
          className="flex items-center gap-2 rounded-lg px-5 py-2.5 font-semibold text-sm bg-accent-technical text-bg hover:bg-accent-technical/90 transition-colors disabled:opacity-50"
        >
          Run Panel Review
          <ArrowRight size={16} />
        </button>
      </motion.div>
    </div>
  );
}
