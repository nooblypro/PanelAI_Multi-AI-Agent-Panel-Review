import React from 'react';

interface DoodleProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

/**
 * PanelAI Custom Hand-Drawn Evidentiary & Committee Vector Doodles
 * Designed specifically for the Multi-AI-Agent Deliberative Committee experience.
 */

// 1. EVIDENCE & CITATIONS: Dossier Folder
export function DoodleDossier({ className = '', ...props }: DoodleProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M6 14C6 11.7909 7.79086 10 10 10H18.5L22.5 14H38C40.2091 14 42 15.7909 42 18V36C42 38.2091 40.2091 40 38 40H10C7.79086 40 6 38.2091 6 36V14Z" />
      <path d="M14 24H34" strokeDasharray="3 3" />
      <path d="M14 29H28" strokeDasharray="3 3" />
      <path d="M14 34H22" strokeDasharray="2 2" />
      <circle cx="34" cy="31" r="3" />
    </svg>
  );
}

// 2. EVIDENCE: Editorial Quotation Marks (Verbatim Interview Citation)
export function DoodleQuoteMarks({ className = '', ...props }: DoodleProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M11 28C11 23 13 18 19 14M11 28H19V36H11V28Z" fill="currentColor" fillOpacity="0.08" />
      <path d="M27 28C27 23 29 18 35 14M27 28H35V36H27V28Z" fill="currentColor" fillOpacity="0.08" />
      <circle cx="23" cy="38" r="1.5" fill="currentColor" />
      <circle cx="39" cy="38" r="1.5" fill="currentColor" />
    </svg>
  );
}

// 3. EVIDENCE: Magnifier Inspecting Fact Checkmark
export function DoodleMagnifier({ className = '', ...props }: DoodleProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <circle cx="21" cy="21" r="13" />
      <path d="M17 21L20 24L26 17" />
      <path d="M30.5 30.5L41 41" strokeWidth="2.2" />
      <path d="M37 37L43 43" strokeWidth="3" />
      <path d="M14 14C16 12 19 11 22 11" strokeDasharray="2 2" />
    </svg>
  );
}

// 4. EVIDENCE: Paper Clip binding interview records
export function DoodlePaperClip({ className = '', ...props }: DoodleProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M18 20L29.5 8.5C32.5 5.5 37.5 5.5 40.5 8.5C43.5 11.5 43.5 16.5 40.5 19.5L22 38C17.5 42.5 10.5 42.5 6 38C1.5 33.5 1.5 26.5 6 22L23 5C26 2 31 2 34 5" />
    </svg>
  );
}

// 5. EVALUATOR DESK 01: Tech Agent (Silicon Chip & Code Node)
export function DoodleTechChip({ className = '', ...props }: DoodleProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <rect x="12" y="12" width="24" height="24" rx="4" fill="currentColor" fillOpacity="0.06" />
      <path d="M18 20L15 24L18 28" />
      <path d="M30 20L33 24L30 28" />
      <path d="M25 18L23 30" />
      {/* Pins */}
      <path d="M18 6V12M24 6V12M30 6V12" />
      <path d="M18 36V42M24 36V42M30 36V42" />
      <path d="M6 18H12M6 24H12M6 30H12" />
      <path d="M36 18H42M36 24H42M36 30H42" />
    </svg>
  );
}

// 6. EVALUATOR DESK 02: Culture & Collaboration Resonance
export function DoodleCultureResonance({ className = '', ...props }: DoodleProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <circle cx="18" cy="18" r="6" />
      <circle cx="30" cy="18" r="6" />
      <path d="M10 36C10 31.58 13.58 28 18 28H30C34.42 28 38 31.58 38 36" />
      <path d="M24 10C24 7 26 5 28 6C30 7 28 10 24 12" strokeWidth="1.2" />
      <circle cx="24" cy="33" r="1.5" fill="currentColor" />
    </svg>
  );
}

// 7. EVALUATOR DESK 03: Hiring Manager Portfolio & Role Alignment
export function DoodleHiringPortfolio({ className = '', ...props }: DoodleProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <rect x="8" y="16" width="32" height="22" rx="3" fill="currentColor" fillOpacity="0.06" />
      <path d="M18 16V12C18 10.3431 19.3431 9 21 9H27C28.6569 9 30 10.3431 30 12V16" />
      <path d="M8 24H40" />
      <rect x="22" y="22" width="4" height="5" rx="1" fill="currentColor" />
      <path d="M14 31H18M30 31H34" strokeDasharray="2 2" />
    </svg>
  );
}

// 8. EVALUATOR DESK 04: Skeptic Radar & Blindspot Interrogation
export function DoodleSkepticRadar({ className = '', ...props }: DoodleProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <circle cx="24" cy="24" r="16" />
      <circle cx="24" cy="24" r="10" strokeDasharray="3 3" />
      <circle cx="24" cy="24" r="4" fill="currentColor" fillOpacity="0.2" />
      <path d="M24 24L35 13" />
      <circle cx="34" cy="16" r="2" fill="currentColor" />
      <path d="M8 24H40" strokeWidth="0.9" opacity="0.4" />
      <path d="M24 8V40" strokeWidth="0.9" opacity="0.4" />
    </svg>
  );
}

// 9. DEBATE & DELIBERATION: Dialectic Cross-Examination Bubbles
export function DoodleDialecticBubbles({ className = '', ...props }: DoodleProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M8 18C8 12.5 13 8 20 8C27 8 32 12.5 32 18C32 23.5 27 28 20 28C18 28 16 27.5 14 26.5L8 28L10 23C8.8 21.5 8 19.8 8 18Z" fill="currentColor" fillOpacity="0.05" />
      <path d="M28 22C34 22 39 25.5 39 30C39 31.8 38 33.3 36.5 34.5L38 39L33.5 37.8C32 38.5 30 38.8 28 38.8C22 38.8 17 35.3 17 30" strokeDasharray="3 2" />
      <circle cx="15" cy="18" r="1" fill="currentColor" />
      <circle cx="20" cy="18" r="1" fill="currentColor" />
      <circle cx="25" cy="18" r="1" fill="currentColor" />
    </svg>
  );
}

// 10. DEBATE: Opposing Stance Consensus Arrows
export function DoodleConsensusArrows({ className = '', ...props }: DoodleProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      {/* Forward Arrow */}
      <path d="M10 18H36M36 18L28 12M36 18L28 24" />
      {/* Return Arrow */}
      <path d="M38 30H12M12 30L20 24M12 30L20 36" />
      <circle cx="24" cy="24" r="1.5" fill="currentColor" />
    </svg>
  );
}

// 11. VERDICT: Judicial Scales of Evidence
export function DoodleJudicialScales({ className = '', ...props }: DoodleProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      {/* Pillar & Base */}
      <path d="M24 8V38" strokeWidth="2" />
      <path d="M16 38H32" strokeWidth="2.5" />
      <path d="M20 12H28" />
      {/* Beam */}
      <path d="M10 14L38 14" strokeWidth="2" />
      {/* Left Pan */}
      <path d="M10 14L5 24M10 14L15 24" />
      <path d="M5 24C5 28 15 28 15 24" fill="currentColor" fillOpacity="0.1" />
      {/* Right Pan */}
      <path d="M38 14L33 24M38 14L43 24" />
      <path d="M33 24C33 28 43 28 43 24" fill="currentColor" fillOpacity="0.1" />
    </svg>
  );
}

// 12. VERDICT: Certified Committee Decision Stamp
export function DoodleDecisionStamp({ className = '', ...props }: DoodleProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <circle cx="24" cy="24" r="17" strokeDasharray="4 2" />
      <circle cx="24" cy="24" r="13" />
      <path d="M24 16L26.5 21L32 21.8L28 25.7L29 31.2L24 28.5L19 31.2L20 25.7L16 21.8L21.5 21L24 16Z" fill="currentColor" fillOpacity="0.15" />
    </svg>
  );
}

// 13. NEURAL & LOGIC: Synaptic Telemetry Nodes
export function DoodleNeuralNodes({ className = '', ...props }: DoodleProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <circle cx="12" cy="24" r="4" fill="currentColor" fillOpacity="0.1" />
      <circle cx="34" cy="14" r="4" fill="currentColor" fillOpacity="0.1" />
      <circle cx="34" cy="34" r="4" fill="currentColor" fillOpacity="0.1" />
      <path d="M16 22L30 16" />
      <path d="M16 26L30 32" />
      <path d="M34 18V30" strokeDasharray="2 2" />
      <circle cx="23" cy="20" r="1.5" fill="currentColor" />
      <circle cx="23" cy="28" r="1.5" fill="currentColor" />
    </svg>
  );
}

// 14. AMBIENT: 4-Point Analytical Sparkle
export function DoodleSparkle({ className = '', ...props }: DoodleProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className} {...props}>
      <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" />
    </svg>
  );
}

// 15. TRANSCRIPT: Verbatim Dialogue Record
export function DoodleTranscriptTape({ className = '', ...props }: DoodleProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M12 8H36V40L32 37L28 40L24 37L20 40L16 37L12 40V8Z" fill="currentColor" fillOpacity="0.04" />
      <path d="M18 16H30" />
      <path d="M18 22H26" />
      <path d="M18 28H30" />
      <circle cx="15" cy="16" r="1" fill="currentColor" />
      <circle cx="15" cy="22" r="1" fill="currentColor" />
      <circle cx="15" cy="28" r="1" fill="currentColor" />
    </svg>
  );
}

// 16. SENSITIVITY: Metric Shift Arrow
export function DoodleScoreMetric({ className = '', ...props }: DoodleProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M8 38H40" strokeWidth="2" />
      <path d="M12 32L20 22L28 26L38 12" strokeWidth="2" />
      <path d="M30 12H38V20" strokeWidth="2" />
      <circle cx="12" cy="32" r="2" fill="currentColor" />
      <circle cx="20" cy="22" r="2" fill="currentColor" />
      <circle cx="28" cy="26" r="2" fill="currentColor" />
      <circle cx="38" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}
