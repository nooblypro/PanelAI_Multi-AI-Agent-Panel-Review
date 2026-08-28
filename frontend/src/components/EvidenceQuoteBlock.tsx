import { motion } from 'framer-motion';
import type { AgentOpinion } from '../types';

export function EvidenceQuoteBlock({
  evidence,
  index = 0,
}: {
  evidence: AgentOpinion['evidence'][number];
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.25 }}
      className="border-l-2 pl-3 py-1.5 rounded-r-sm"
      style={{ borderColor: 'rgba(255,255,255,0.12)' }}
    >
      <p className="font-mono text-[12px] leading-relaxed text-text/85 italic">
        &ldquo;{evidence.quote}&rdquo;
      </p>
      <div className="flex items-center gap-2 mt-1.5">
        <span
          className="text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wide"
          style={{
            backgroundColor:
              evidence.source === 'resume' ? 'rgba(76,141,255,0.12)' : 'rgba(52,211,153,0.12)',
            color: evidence.source === 'resume' ? '#4C8DFF' : '#34D399',
          }}
        >
          {evidence.source}
        </span>
        <span className="text-[11px] text-muted">{evidence.note}</span>
      </div>
    </motion.div>
  );
}
