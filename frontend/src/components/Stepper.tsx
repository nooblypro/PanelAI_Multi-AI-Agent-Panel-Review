import { motion } from 'framer-motion';
import { Check, ChevronRight } from 'lucide-react';
import type { Stage } from '../types';
import { usePipelineStore } from '../lib/store';

interface StepMeta {
  id: Stage;
  number: string;
  label: string;
  code: string;
}

const STEPS: StepMeta[] = [
  { id: 'intake', number: '01', label: 'Evidence Intake', code: 'Intake' },
  { id: 'profile', number: '02', label: 'Fact Base', code: 'Facts' },
  { id: 'review', number: '03', label: '4-Desk Audit', code: 'Audit' },
  { id: 'debate', number: '04', label: 'Panel Debate', code: 'Debate' },
  { id: 'verdict', number: '05', label: 'Decision Brief', code: 'Verdict' },
];

export function Stepper({ currentStage }: { currentStage: Stage }) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStage);
  const setStage = usePipelineStore((s) => s.setStage);
  const profile = usePipelineStore((s) => s.profile);
  const opinions = usePipelineStore((s) => s.opinions);
  const debateTurns = usePipelineStore((s) => s.debateTurns);

  const canNavigateTo = (stageId: Stage, index: number) => {
    if (index === currentIndex) return true;
    if (stageId === 'intake') return true;
    if (stageId === 'profile') return !!profile;
    if (stageId === 'review') return opinions.length > 0;
    if (stageId === 'debate') return debateTurns.length > 0;
    if (stageId === 'verdict') return index <= currentIndex;
    return false;
  };

  return (
    <nav aria-label="Evaluation Docket Progression" className="w-full flex justify-center">
      {/* Precision Segmented Control Track */}
      <div className="inline-flex items-center gap-1 sm:gap-1.5 p-1.5 rounded-xl bg-surface-2/80 border border-border backdrop-blur-md shadow-2xs">
        {STEPS.map((step, i) => {
          const isComplete = i < currentIndex;
          const isCurrent = i === currentIndex;
          const isClickable = canNavigateTo(step.id, i);

          return (
            <div key={step.id} className="flex items-center">
              <button
                type="button"
                onClick={() => isClickable && setStage(step.id)}
                disabled={!isClickable}
                className={`relative z-10 flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-2 rounded-lg text-left transition-colors duration-200 focus-visible:outline-none select-none cursor-pointer ${
                  isCurrent
                    ? 'text-text font-bold'
                    : isComplete
                    ? 'text-text/80 hover:text-text hover:bg-surface/50'
                    : 'text-muted/50 cursor-not-allowed'
                }`}
                title={`${step.number} // ${step.label}`}
              >
                {/* Sliding active pill background with Framer Motion layoutId */}
                {isCurrent && (
                  <motion.div
                    layoutId="activeStepCapsule"
                    className="absolute inset-0 rounded-lg bg-surface border border-border shadow-xs z-[-1]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}

                {/* Step indicator badge */}
                <div
                  className={`w-6 h-6 rounded-md flex items-center justify-center font-mono text-xs font-bold transition-all ${
                    isCurrent
                      ? 'bg-text text-bg shadow-2xs'
                      : isComplete
                      ? 'bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-surface/60 text-muted/70 border border-border/60'
                  }`}
                >
                  {isComplete ? <Check size={13} strokeWidth={2.8} /> : step.number}
                </div>

                {/* Step label text */}
                <div className="flex flex-col leading-none">
                  <span
                    className={`text-xs sm:text-[13px] font-semibold tracking-tight transition-colors ${
                      isCurrent
                        ? 'text-text font-bold'
                        : isComplete
                        ? 'text-text/80 font-medium'
                        : 'text-muted/65'
                    }`}
                  >
                    <span className="hidden xl:inline">{step.label}</span>
                    <span className="inline xl:hidden">{step.code}</span>
                  </span>
                </div>
              </button>

              {/* Minimal Divider between steps */}
              {i < STEPS.length - 1 && (
                <div className="text-muted/30 px-0.5 hidden sm:flex items-center">
                  <ChevronRight size={14} strokeWidth={2} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
