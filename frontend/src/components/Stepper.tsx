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
    <div className="sticky top-0 z-50 bg-bg/95 backdrop-blur-sm border-b border-white/[0.06] px-4 sm:px-8 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {STEPS.map((step, i) => {
          const isComplete = i < currentIndex;
          const isCurrent = i === currentIndex;
          const isFuture = i > currentIndex;

          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2.5">
                <motion.div
                  initial={false}
                  animate={{
                    backgroundColor: isCurrent ? '#4C8DFF' : isComplete ? '#34D399' : '#1C1F27',
                    borderColor: isCurrent ? '#4C8DFF' : isComplete ? '#34D399' : 'rgba(255,255,255,0.12)',
                    color: isFuture ? '#9096A6' : '#0B0C10',
                  }}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border"
                  style={{ fontSize: '11px' }}
                >
                  {isComplete ? <Check size={14} strokeWidth={3} /> : i + 1}
                </motion.div>
                <span
                  className={`text-xs font-medium hidden sm:inline ${
                    isCurrent ? 'text-text' : isFuture ? 'text-muted' : 'text-muted'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 mx-2 sm:mx-3 h-px bg-white/[0.08] relative">
                  <motion.div
                    initial={false}
                    animate={{ width: isComplete ? '100%' : '0%' }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="absolute top-0 left-0 h-full bg-success"
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
