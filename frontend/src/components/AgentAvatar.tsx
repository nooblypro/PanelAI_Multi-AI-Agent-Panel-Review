import { motion } from 'framer-motion';
import {
  Code2,
  Handshake,
  Briefcase,
  Search,
  type LucideIcon,
} from 'lucide-react';
import type { AgentId } from '../types';

export const AGENT_ICONS: Record<AgentId, LucideIcon> = {
  technical: Code2,
  culture: Handshake,
  hiring_manager: Briefcase,
  skeptic: Search,
};

export const AGENT_NAMES: Record<AgentId, string> = {
  technical: 'Technical Agent',
  culture: 'HR / Culture Agent',
  hiring_manager: 'Hiring Manager Agent',
  skeptic: 'Skeptic Agent',
};

export const AGENT_COLORS: Record<AgentId, string> = {
  technical: '#4C8DFF',
  culture: '#34D399',
  hiring_manager: '#F5B841',
  skeptic: '#F87171',
};

export function AgentAvatar({
  agentId,
  size = 36,
}: {
  agentId: AgentId;
  size?: number;
}) {
  const Icon = AGENT_ICONS[agentId];
  const color = AGENT_COLORS[agentId];

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="rounded-full flex items-center justify-center flex-shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: `${color}1A`,
        border: `1.5px solid ${color}40`,
      }}
    >
      <Icon size={size * 0.5} style={{ color }} />
    </motion.div>
  );
}
