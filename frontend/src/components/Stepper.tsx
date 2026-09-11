import { motion } from 'framer-motion';
import { Check, FileText, UserCheck, Users, MessageSquare, Award } from 'lucide-react';
import type { Stage } from '../types';
import { usePipelineStore } from '../lib/store';

const STEPS: { id: Stage; label: string; icon: any }[] = [
  { id: 'intake', label: 'Intake', icon: FileText },
  { id: 'profile', label: 'Fact Base', icon: UserCheck },
  { id: 'review', label: '4-Agent Review', icon: Users },
  { id: 'debate', label: 'Panel Debate', icon: MessageSquare },
  { id: 'verdict', label: 'Verdict', icon: Award },
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
    <nav aria-label="Pipeline Stage Progress" className="py-1 px-1">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-1 sm:gap-2">
        {STEPS.map((step, i) => {
          const isComplete = i < currentIndex;
          const isCurrent = i === currentIndex;
          const isClickable = canNavigateTo(step.id, i);
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              <button
                onClick={() => isClickable && setStage(step.id)}
                disabled={!isClickable}
                title={isClickable ? `Jump to ${step.label}` : `${step.label} pending completion`}
                className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-full transition-all duration-200 focus-visible:outline-none ${
                  isCurrent
                    ? 'bg-surface border border-accent-technical/40 shadow-sm text-text font-bold'
                    : isComplete
                    ? 'bg-surface-2/70 text-text/80 hover:bg-surface-2 cursor-pointer font-medium'
                    : 'text-muted opacity-50 cursor-not-allowed font-normal'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                    isCurrent
                      ? 'bg-accent-technical text-white shadow-xs'
                      : isComplete
                      ? 'bg-emerald-500 text-white'
                      : 'bg-surface-3 text-muted'
                  }`}
                >
                  {isComplete ? <Check size={13} strokeWidth={2.5} /> : <Icon size={13} />}
                </div>

                <span className="text-xs sm:text-[13px] hidden sm:inline whitespace-nowrap">
                  {step.label}
                </span>

                {isCurrent && (
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-technical animate-ping hidden md:inline-block" />
                )}
              </button>

              {i < STEPS.length - 1 && (
                <div className="flex-1 mx-1 sm:mx-2 h-0.5 bg-border relative hidden sm:block">
                  <motion.div
                    initial={false}
                    animate={{ width: isComplete ? '100%' : '0%' }}
                    transition={{ duration: 0.3 }}
                    className="absolute top-0 left-0 h-full bg-accent-technical"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}

