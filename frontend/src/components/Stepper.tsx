import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { Stage } from '../types';

const STEPS: { id: Stage; label: string }[] = [
  { id: 'intake', label: 'Intake' },
  { id: 'profile', label: 'Profile' },
  { id: 'review', label: 'Independent Review' },
  { id: 'debate', label: 'Debate' },
  { id: 'verdict', label: 'Verdict & Report' },
];

export function Stepper({ currentStage }: { currentStage: Stage }) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStage);

  return (
    <div className="py-1 px-2">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        {STEPS.map((step, i) => {
          const isComplete = i < currentIndex;
          const isCurrent = i === currentIndex;
          const isFuture = i > currentIndex;

          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2 relative group">
                <motion.div
                  initial={false}
                  animate={{
                    backgroundColor: isCurrent || isComplete ? 'var(--text)' : 'var(--surface)',
                    borderColor: isCurrent || isComplete ? 'var(--text)' : 'var(--border)',
                    color: isCurrent || isComplete ? 'var(--bg)' : 'var(--muted)',
                  }}
                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-semibold border shadow-xs transition-colors"
                >
                  {isComplete ? <Check size={12} strokeWidth={2.5} /> : i + 1}
                </motion.div>
                <div className="relative">
                  <span
                    className={`text-[11px] sm:text-xs hidden md:inline transition-colors ${
                      isCurrent
                        ? 'font-bold text-text'
                        : isComplete
                        ? 'font-medium text-text/80'
                        : 'font-normal text-muted'
                    }`}
                  >
                    {step.label}
                  </span>
                  {isCurrent && (
                    <motion.div
                      layoutId="activeStepUnderline"
                      className="absolute -bottom-1 left-0 right-0 h-[2px] bg-accent-technical rounded-full"
                    />
                  )}
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 mx-2 sm:mx-3 h-px bg-border relative">
                  <motion.div
                    initial={false}
                    animate={{ width: isComplete ? '100%' : '0%' }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="absolute top-0 left-0 h-full bg-text"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
