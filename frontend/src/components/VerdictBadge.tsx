import { motion } from 'framer-motion';
import type { AgentOpinion } from '../types';
import { VERDICT_COLORS, VERDICT_LABELS } from '../types';

export function VerdictBadge({ verdict, size = 'md' }: { verdict: AgentOpinion['verdict']; size?: 'sm' | 'md' }) {
  const color = VERDICT_COLORS[verdict];
  const label = VERDICT_LABELS[verdict];

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${sizes[size]}`}
      style={{
        backgroundColor: `${color}1A`,
        borderColor: `${color}40`,
        color: color,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </motion.span>
  );
}
