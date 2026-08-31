import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Shield,
  Users,
  Briefcase,
  Search,
  ArrowRight,
  FileText,
  Lock,
  MessagesSquare,
  Award,
  Sparkles,
  Volume2,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { AGENT_ICONS, AGENT_NAMES, AGENT_COLORS } from './AgentAvatar';

interface ProductExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PIPELINE_STEPS = [
  {
    step: '01',
    title: 'Input',
    subtitle: 'Role, Resume & Transcript',
    description: 'Ingests the job description, candidate resume, and full interview transcript.',
    icon: FileText,
    color: '#3B82F6',
  },
  {
    step: '02',
    title: 'Candidate Profile',
    subtitle: 'Structured Evidence Base',
    description: 'Extracts skills, experience, and verifiable claims into a shared factual reference.',
    icon: Users,
    color: '#10B981',
  },
  {
    step: '03',
    title: 'Independent Review',
    subtitle: 'Zero Groupthink Barrier',
    description: '4 specialized AI agents evaluate concurrently without seeing peer scores or opinions.',
    icon: Lock,
    color: '#F59E0B',
  },
  {
    step: '04',
    title: 'Multi-Agent Debate',
    subtitle: 'Active Deliberation',
    description: 'Agents challenge inconsistencies, defend conclusions, and refine positions (with Voice AI).',
    icon: MessagesSquare,
    color: '#8B5CF6',
  },
  {
    step: '05',
    title: 'Verdict & Report',
    subtitle: 'Evidence-Weighted Decision',
    description: 'Reasons over evidence quality, confidence, strengths, risks, and consensus.',
    icon: Award,
    color: '#EC4899',
  },
];

const AGENT_ROLES = [
  {
    id: 'technical',
    name: 'Technical Agent',
    icon: Shield,
    color: '#3B82F6',
    title: 'Engineering & Depth',
    focus: [
      'Technical skill proficiency and system architecture depth',
      'Production engineering, scalability, and technical rigor',
      'Verification of engineering claims against transcript evidence',
    ],
  },
  {
    id: 'culture',
    name: 'HR / Culture Agent',
    icon: Users,
    color: '#10B981',
    title: 'Collaboration & Values',
    focus: [
      'Communication style, team empathy, and leadership presence',
      'Behavioral consistency, conflict navigation, and teamwork',
      'Professional alignment with collaborative team culture',
    ],
  },
  {
    id: 'hiring_manager',
    name: 'Hiring Manager Agent',
    icon: Briefcase,
    color: '#F59E0B',
    title: 'Role Fit & Execution',
    focus: [
      'Direct suitability against core job requirements',
      'Balance of strengths vs. operational hiring risk',
      'Actionable hiring recommendation for immediate role demands',
    ],
  },
  {
    id: 'skeptic',
    name: 'Skeptic Agent',
    icon: Search,
    color: '#EF4444',
    title: 'Challenge & Verification',
    focus: [
      'Interrogates exaggerated claims and unsupported metrics',
      'Flags contradictions between resume bullet points and transcript',
      'Surfaces critical blindspots before a hiring commitment',
    ],
  },
];

export function ProductExplainerModal({ isOpen, onClose }: ProductExplainerModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto no-print">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-surface border border-border rounded-2xl md:rounded-3xl shadow-2xl overflow-y-auto scrollbar-thin p-5 sm:p-8 z-10 my-auto transition-colors"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-4 right-4 p-2 rounded-xl bg-surface-2 hover:bg-border text-muted hover:text-text transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="mb-8 pr-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-technical/10 border border-accent-technical/20 text-accent-technical text-xs font-semibold mb-3">
              <Sparkles size={13} />
              <span>Multi-Agent Architecture</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-text tracking-tight">
              How PanelAI Works
            </h2>
            <p className="text-xs sm:text-sm text-muted mt-2 leading-relaxed max-w-2xl">
              PanelAI is not a single AI giving a hiring score. It is a <strong>virtual hiring panel</strong> where specialized AI agents independently evaluate candidate evidence, debate conflicting viewpoints, and reach a reasoned final verdict.
            </p>
          </div>

          {/* 5-Stage Architecture Visual Pipeline */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text">
                5-Stage Evaluation Lifecycle
              </h3>
              <span className="text-[11px] text-muted">From raw evidence to reasoned decision</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {PIPELINE_STEPS.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.step}
                    className="p-3.5 rounded-xl bg-surface-2 border border-border/80 flex flex-col justify-between relative group hover:border-accent-technical/40 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[10px] font-mono font-bold text-muted">{step.step}</span>
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${step.color}18`, color: step.color }}
                        >
                          <Icon size={14} />
                        </div>
                      </div>
                      <h4 className="text-xs font-bold text-text">{step.title}</h4>
                      <p className="text-[10px] font-semibold text-accent-technical mt-0.5">{step.subtitle}</p>
                      <p className="text-[11px] text-muted mt-1.5 leading-snug">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Four Specialized AI Personas */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text">
                Four Specialized Evaluator Personas
              </h3>
              <span className="text-[11px] text-muted">Each evaluator applies distinct domain criteria</span>
            </div>

            <div className="grid sm:grid-cols-2 gap-3.5">
              {AGENT_ROLES.map((agent) => {
                const Icon = agent.icon;
                return (
                  <div
                    key={agent.id}
                    className="p-4 rounded-xl bg-surface-2 border border-border/80 transition-colors"
                    style={{ borderLeft: `3px solid ${agent.color}` }}
                  >
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${agent.color}1A`, color: agent.color }}
                      >
                        <Icon size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-text">{agent.name}</h4>
                        <span className="text-[10px] text-muted">{agent.title}</span>
                      </div>
                    </div>

                    <ul className="space-y-1.5 mt-2">
                      {agent.focus.map((point, pIdx) => (
                        <li key={pIdx} className="text-[11px] text-text/80 flex items-start gap-2 leading-relaxed">
                          <span className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: agent.color }} />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Key Architectural Principles */}
          <div className="p-4 sm:p-5 rounded-2xl bg-accent-technical/5 border border-accent-technical/20 mb-8">
            <h4 className="text-xs font-bold uppercase tracking-wider text-accent-technical mb-3 flex items-center gap-2">
              <CheckCircle2 size={15} />
              Core Architectural Principles
            </h4>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <h5 className="text-xs font-bold text-text">Strict Information Barrier</h5>
                <p className="text-[11px] text-muted mt-1 leading-relaxed">
                  During Independent Review, agents are strictly isolated. No agent sees another agent's score or opinion, preventing groupthink and early bias.
                </p>
              </div>

              <div>
                <h5 className="text-xs font-bold text-text">Authentic Multi-Turn Debate</h5>
                <p className="text-[11px] text-muted mt-1 leading-relaxed">
                  The debate is a true multi-agent cross-examination where personas challenge contradictions, defend findings, and refine stances based on evidence.
                </p>
              </div>

              <div>
                <h5 className="text-xs font-bold text-text">Reasoned Verdict (Not Averaging)</h5>
                <p className="text-[11px] text-muted mt-1 leading-relaxed">
                  The final verdict reasons holistically over evidence depth, agent confidence, blindspots, and risk triggers rather than taking a naive mathematical average.
                </p>
              </div>
            </div>
          </div>

          {/* Footer note on Voice AI */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-muted">
              <Volume2 size={15} className="text-accent-technical flex-shrink-0" />
              <span>
                <strong>Bonus Capability:</strong> Interactive Multi-Persona Voice Debate engine with distinct voice profiles for each evaluator.
              </span>
            </div>

            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-text text-bg hover:opacity-90 font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              Close & Continue
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
