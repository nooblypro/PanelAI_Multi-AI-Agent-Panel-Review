import { AnimatePresence, motion } from 'framer-motion';
import { usePipelineStore } from './lib/store';
import { Stepper } from './components/Stepper';
import { IntakeForm } from './components/IntakeForm';
import { ProfileView } from './components/ProfileView';
import { IndependentReview } from './components/IndependentReview';
import { DebateThread } from './components/DebateThread';
import { VerdictReport } from './components/VerdictReport';
import { CandidateHistorySidebar } from './components/CandidateHistorySidebar';
import { ThemeToggle } from './components/ThemeToggle';

function App() {
  const stage = usePipelineStore((s) => s.stage);

  return (
    <div className="min-h-screen bg-bg text-text transition-colors duration-200">
      <CandidateHistorySidebar />

      {/* Top Application Header with Brand, Stepper, and Theme Toggle */}
      <header className="sticky top-0 z-30 bg-bg/90 backdrop-blur-md border-b border-border px-4 sm:px-6 py-2.5 transition-colors no-print">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Logo / Brand */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="font-extrabold text-sm sm:text-base tracking-tight text-text flex items-center gap-1.5 font-serif">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-technical animate-pulse" />
              PanelAI
            </span>
          </div>

          {/* Stepper centered */}
          <div className="flex-1 max-w-2xl px-2">
            <Stepper currentStage={stage} />
          </div>

          {/* Theme Toggle & Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main>
        <AnimatePresence mode="wait">
          <motion.div
            key={stage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {stage === 'intake' && <IntakeForm />}
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
