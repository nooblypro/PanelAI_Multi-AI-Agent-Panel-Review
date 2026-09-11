import React from 'react';
import {
  DoodleDossier,
  DoodleQuoteMarks,
  DoodleMagnifier,
  DoodlePaperClip,
  DoodleTechChip,
  DoodleCultureResonance,
  DoodleHiringPortfolio,
  DoodleSkepticRadar,
  DoodleDialecticBubbles,
  DoodleConsensusArrows,
  DoodleJudicialScales,
  DoodleDecisionStamp,
  DoodleNeuralNodes,
  DoodleSparkle,
  DoodleTranscriptTape,
  DoodleScoreMetric,
} from './PanelAIDoodles';
import type { Stage } from '../../types';

interface DoodleBackgroundProps {
  stage?: Stage;
}

/**
 * PanelAI Ambient Deliberative Doodle Background
 * 
 * Technical Implementation:
 * - Positioned in the fixed background (`fixed inset-0 pointer-events-none z-0`)
 * - Sub-pixel GPU-accelerated CSS animations (float, sway, flutter, rotate, twinkle)
 * - Low-contrast, high-readability opacity (does not compete with text or controls)
 * - Stage-aware thematic accent shifts (Intake -> Profile -> Desks -> Debate -> Verdict)
 * - Responsive breakpoints for small, tablet, laptop, and ultra-wide displays
 * - Full prefers-reduced-motion accessibility compliance
 */
export function DoodleBackground({ stage = 'intake' }: DoodleBackgroundProps) {
  // Stage-aware accent classes for contextual highlights
  const isIntake = stage === 'intake';
  const isProfile = stage === 'profile';
  const isReview = stage === 'review';
  const isDebate = stage === 'debate';
  const isVerdict = stage === 'verdict';

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {/* ============================================================
          TOP MARGIN & HORIZON LAYER
          ============================================================ */}

      {/* Top Left: Judicial Scales / Official Inquiry Seal */}
      <DoodleJudicialScales
        className={`absolute top-24 left-4 sm:left-10 lg:left-12 w-11 sm:w-13 transition-all duration-700 animate-doodleSway ${
          isVerdict ? 'text-accent-hm opacity-60 scale-110' : 'text-text/15'
        }`}
        style={{ animationDuration: '4.5s' }}
      />

      {/* Top Left Secondary: Evidentiary Quote Marks */}
      <DoodleQuoteMarks
        className={`absolute top-44 left-2 sm:left-5 lg:left-8 w-8 sm:w-10 transition-all duration-700 animate-doodleFloatSlow ${
          isProfile || isIntake ? 'text-accent-technical opacity-55' : 'text-text/15'
        }`}
        style={{ animationDelay: '0.4s' }}
      />

      {/* Top Center-Left: Sparkle star */}
      <DoodleSparkle
        className="absolute top-20 left-[22%] w-3.5 sm:w-4 text-accent-technical/30 animate-doodleTwinkle hidden md:block"
        style={{ animationDelay: '0.8s' }}
      />

      {/* Top Center-Right: Neural / Logic Node */}
      <DoodleNeuralNodes
        className={`absolute top-20 right-[25%] w-10 sm:w-12 transition-all duration-700 animate-doodleFloat hidden lg:block ${
          isReview ? 'text-accent-culture opacity-50' : 'text-text/12'
        }`}
        style={{ animationDelay: '1.2s' }}
      />

      {/* Top Right: Certified Decision Stamp */}
      <DoodleDecisionStamp
        className={`absolute top-24 right-4 sm:right-10 lg:right-12 w-11 sm:w-14 transition-all duration-700 animate-doodleSpinSlow ${
          isVerdict ? 'text-accent-technical opacity-60 scale-110' : 'text-text/15'
        }`}
        style={{ animationDuration: '40s' }}
      />

      {/* Top Right Secondary: Inspection Magnifier */}
      <DoodleMagnifier
        className={`absolute top-44 right-2 sm:right-6 lg:right-8 w-9 sm:w-11 transition-all duration-700 animate-doodleFloat ${
          isReview || isProfile ? 'text-accent-skeptic opacity-55' : 'text-text/15'
        }`}
        style={{ animationDelay: '0.6s' }}
      />

      {/* ============================================================
          LEFT MARGIN CLUSTER (Evidence & Desk Personas)
          ============================================================ */}

      {/* Left Mid-Upper: Dossier Folder */}
      <DoodleDossier
        className={`absolute top-[280px] left-3 sm:left-6 w-11 sm:w-13 transition-all duration-700 animate-doodleFloat ${
          isIntake || isProfile ? 'text-accent-technical/35' : 'text-text/9'
        }`}
        style={{ animationDelay: '0.9s' }}
      />

      {/* Left Mid: Tech Silicon Chip */}
      <DoodleTechChip
        className={`absolute top-[420px] left-2 sm:left-5 w-10 sm:w-12 transition-all duration-700 animate-doodleSway hidden sm:block ${
          isReview ? 'text-accent-technical/35 scale-105' : 'text-text/8'
        }`}
        style={{ animationDelay: '1.5s' }}
      />

      {/* Left Mid-Lower: Paper Clip */}
      <DoodlePaperClip
        className="absolute top-[560px] left-4 sm:left-8 w-8 sm:w-10 text-text/8 animate-doodleFlutter hidden xl:block"
        style={{ animationDelay: '1.1s' }}
      />

      {/* Left Lower: Culture Resonance Symbol */}
      <DoodleCultureResonance
        className={`absolute bottom-52 left-3 sm:left-7 w-11 sm:w-13 transition-all duration-700 animate-doodlePulse hidden lg:block ${
          isReview ? 'text-accent-culture/35' : 'text-text/8'
        }`}
        style={{ animationDelay: '0.3s' }}
      />

      {/* Left Bottom: Transcript Tape */}
      <DoodleTranscriptTape
        className={`absolute bottom-16 left-4 sm:left-10 w-10 sm:w-12 transition-all duration-700 animate-doodleFloatSlow hidden sm:block ${
          isDebate ? 'text-accent-hm/30' : 'text-text/8'
        }`}
        style={{ animationDelay: '1.8s' }}
      />

      {/* ============================================================
          RIGHT MARGIN CLUSTER (Debate, Skepticism, Decision)
          ============================================================ */}

      {/* Right Mid-Upper: Dialectic Cross-Examination Bubbles */}
      <DoodleDialecticBubbles
        className={`absolute top-[270px] right-3 sm:right-7 w-12 sm:w-14 transition-all duration-700 animate-doodleFloat ${
          isDebate ? 'text-accent-hm/40 scale-110' : 'text-text/9'
        }`}
        style={{ animationDelay: '0.7s' }}
      />

      {/* Right Mid: Skeptic Radar Interrogation Sweep */}
      <DoodleSkepticRadar
        className={`absolute top-[410px] right-2 sm:right-6 w-11 sm:w-13 transition-all duration-700 animate-doodleSway hidden sm:block ${
          isReview || isDebate ? 'text-accent-skeptic/35' : 'text-text/8'
        }`}
        style={{ animationDelay: '1.3s' }}
      />

      {/* Right Mid-Lower: Consensus Deliberation Arrows */}
      <DoodleConsensusArrows
        className={`absolute top-[540px] right-4 sm:right-8 w-10 sm:w-12 transition-all duration-700 animate-doodleFlutter hidden xl:block ${
          isDebate ? 'text-accent-technical/35' : 'text-text/8'
        }`}
        style={{ animationDelay: '0.5s' }}
      />

      {/* Right Lower: Hiring Manager Portfolio */}
      <DoodleHiringPortfolio
        className={`absolute bottom-52 right-3 sm:right-7 w-11 sm:w-13 transition-all duration-700 animate-doodleFloatSlow hidden lg:block ${
          isReview ? 'text-accent-hm/35' : 'text-text/8'
        }`}
        style={{ animationDelay: '1.4s' }}
      />

      {/* Right Bottom: Score Migration Metric */}
      <DoodleScoreMetric
        className={`absolute bottom-16 right-4 sm:right-10 w-11 sm:w-13 transition-all duration-700 animate-doodleFloat hidden sm:block ${
          isVerdict || isDebate ? 'text-accent-culture/35' : 'text-text/8'
        }`}
        style={{ animationDelay: '0.2s' }}
      />

      {/* ============================================================
          LOWER AMBIENT SPARKLES & ACCENTS
          ============================================================ */}
      <DoodleSparkle
        className="absolute bottom-28 left-[22%] w-4 text-accent-hm/20 animate-doodleTwinkle hidden md:block"
        style={{ animationDelay: '1.7s' }}
      />
      <DoodleSparkle
        className="absolute bottom-20 right-[24%] w-4 text-accent-technical/20 animate-doodleTwinkle hidden md:block"
        style={{ animationDelay: '0.3s' }}
      />
    </div>
  );
}
