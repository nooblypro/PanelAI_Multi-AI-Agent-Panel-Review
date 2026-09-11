import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HelpCircle, RotateCcw, ShieldCheck } from 'lucide-react';
import { usePipelineStore } from './lib/store';
import { Stepper } from './components/Stepper';
import { IntakeForm } from './components/IntakeForm';
import { ProfileView } from './components/ProfileView';
import { IndependentReview } from './components/IndependentReview';
import { DebateThread } from './components/DebateThread';
import { VerdictReport } from './components/VerdictReport';
import { CandidateHistorySidebar } from './components/CandidateHistorySidebar';
import { ThemeToggle } from './components/ThemeToggle';
import { ProductExplainerModal } from './components/ProductExplainerModal';

function App() {
  const stage = usePipelineStore((s) => s.stage);
  const profile = usePipelineStore((s) => s.profile);
  const reset = usePipelineStore((s) => s.reset);
  const [showExplainer, setShowExplainer] = useState(false);

  return (
    <div className="min-h-screen bg-bg text-text transition-colors duration-200">
      <CandidateHistorySidebar />
      <ProductExplainerModal isOpen={showExplainer} onClose={() => setShowExplainer(false)} />

      {/* Top Application Header */}
      <header className="sticky top-0 z-30 bg-bg/95 backdrop-blur-md border-b border-border px-4 sm:px-6 py-2.5 transition-colors no-print">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo / Brand */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => stage !== 'intake' && reset()}
              className="flex items-center gap-2 text-left group focus-visible:outline-none cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-accent-technical text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
                <ShieldCheck size={18} />
              </div>
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-text font-serif">
                PanelAI
              </span>
            </button>
          </div>

          {/* Stepper centered */}
          <div className="flex-1 max-w-3xl px-2">
            <Stepper currentStage={stage} />
          </div>

          {/* Controls: Explainer, Reset & Theme Toggle */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowExplainer(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-2 border border-border hover:border-accent-technical/40 text-xs font-semibold text-text transition-all cursor-pointer"
              title="How PanelAI Works"
            >
              <HelpCircle size={14} className="text-accent-technical" />
              <span>Guide</span>
            </button>

            {stage !== 'intake' && (
              <button
                onClick={reset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-2 border border-border hover:border-rose-500/40 text-xs font-semibold text-muted hover:text-rose-500 transition-all cursor-pointer"
                title="Start New Candidate Evaluation"
              >
                <RotateCcw size={13} />
                <span className="hidden md:inline">Reset</span>
              </button>
            )}

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main>
        <AnimatePresence mode="wait">
          <motion.div
            key={stage}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            {stage === 'intake' && <IntakeForm onOpenExplainer={() => setShowExplainer(true)} />}
            {stage === 'profile' && <ProfileView />}
            {stage === 'review' && <IndependentReview />}
            {stage === 'debate' && <DebateThread />}
            {stage === 'verdict' && <VerdictReport />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
