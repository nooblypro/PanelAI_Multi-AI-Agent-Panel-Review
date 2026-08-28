import { AnimatePresence, motion } from 'framer-motion';
import { usePipelineStore } from './lib/store';
import { Stepper } from './components/Stepper';
import { IntakeForm } from './components/IntakeForm';
import { ProfileView } from './components/ProfileView';
import { IndependentReview } from './components/IndependentReview';
import { DebateThread } from './components/DebateThread';
import { VerdictReport } from './components/VerdictReport';
import { CandidateHistorySidebar } from './components/CandidateHistorySidebar';

function App() {
  const stage = usePipelineStore((s) => s.stage);

  return (
    <div className="min-h-screen bg-bg text-text">
      <CandidateHistorySidebar />
      <Stepper currentStage={stage} />

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
    </div>
  );
}

export default App;
