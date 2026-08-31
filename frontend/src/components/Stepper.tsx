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
    <div className="pt-6 pb-2 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
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
                    backgroundColor: isCurrent ? '#0F172A' : isComplete ? '#0F172A' : '#FFFFFF',
                    borderColor: isCurrent ? '#0F172A' : isComplete ? '#0F172A' : '#CBD5E1',
                    color: isCurrent || isComplete ? '#FFFFFF' : '#64748B',
                  }}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold border shadow-xs transition-colors"
                >
                  {isComplete ? <Check size={12} strokeWidth={2.5} /> : i + 1}
                </motion.div>
                <div className="relative">
                  <span
                    className={`text-xs hidden sm:inline transition-colors ${
                      isCurrent
                        ? 'font-bold text-slate-900'
                        : isComplete
                        ? 'font-medium text-slate-700'
                        : 'font-normal text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                  {isCurrent && (
                    <motion.div
                      layoutId="activeStepUnderline"
                      className="absolute -bottom-1.5 left-0 right-0 h-[2px] bg-blue-600 rounded-full"
                    />
                  )}
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 mx-2 sm:mx-4 h-px bg-slate-200 relative">
                  <motion.div
                    initial={false}
                    animate={{ width: isComplete ? '100%' : '0%' }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="absolute top-0 left-0 h-full bg-slate-900"
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
