import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HelpCircle, RotateCcw, Scale } from 'lucide-react';
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
import { DoodleBackground } from './components/doodles/DoodleBackground';

function App() {
  const stage = usePipelineStore((s) => s.stage);
  const reset = usePipelineStore((s) => s.reset);
  const profile = usePipelineStore((s) => s.profile);
  const [showExplainer, setShowExplainer] = useState(false);

  const candidateName = profile?.name;

  return (
    <div className="min-h-screen bg-bg text-text transition-colors duration-250 relative">
      {/* Ambient Deliberative Background Doodles */}
      <DoodleBackground stage={stage} />

      <CandidateHistorySidebar />
      <ProductExplainerModal isOpen={showExplainer} onClose={() => setShowExplainer(false)} />

      {/* Editorial Header */}
      <header className="sticky top-0 z-30 bg-bg/85 backdrop-blur-xl border-b border-border/80 transition-colors no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
          {/* Brand & Docket Seal */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => stage !== 'intake' && reset()}
              className="flex items-center gap-3 text-left group focus-visible:outline-none cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-text text-bg flex items-center justify-center font-bold text-base shadow-xs transition-transform group-hover:scale-105">
                <Scale size={19} strokeWidth={2.3} />
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-2">
                  <span className="font-serif font-extrabold text-lg sm:text-xl tracking-tight text-text">
                    PanelAI
                  </span>
                  {candidateName && stage !== 'intake' && (
                    <span className="hidden xl:inline-block font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-surface-2 border border-border text-muted">
                      {candidateName}
                    </span>
                  )}
                </div>
                <span className="font-mono text-[10px] sm:text-[11px] text-muted tracking-wider block font-semibold">
                  DELIBERATIVE COMMITTEE
                </span>
              </div>
            </button>
          </div>

          {/* Stepper Navigation */}
          <div className="flex-1 max-w-3xl px-2 hidden sm:block">
            <Stepper currentStage={stage} />
          </div>

          {/* Controls Dock */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowExplainer(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border hover:border-text/30 bg-surface-2/80 hover:bg-surface text-xs sm:text-[13px] font-mono font-semibold text-text transition-all cursor-pointer shadow-2xs"
              title="Committee Operating Protocol"
            >
              <HelpCircle size={14} className="text-muted" />
              <span>Protocol</span>
            </button>

            {stage !== 'intake' && (
              <button
                onClick={reset}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border hover:border-rose-500/40 bg-surface-2/80 hover:bg-surface text-xs sm:text-[13px] font-mono font-semibold text-muted hover:text-rose-600 transition-all cursor-pointer shadow-2xs"
                title="Reset to New Evidence Docket"
              >
                <RotateCcw size={13} />
                <span className="hidden md:inline">Reset</span>
              </button>
            )}

            <div className="pl-1 border-l border-border/60">
              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Mobile Stepper row */}
        <div className="sm:hidden px-4 pb-2 pt-1 border-t border-border/40">
          <Stepper currentStage={stage} />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={stage}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
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
