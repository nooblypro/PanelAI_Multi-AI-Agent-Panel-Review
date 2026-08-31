import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PanelLeftClose, PanelLeftOpen, Trash2, Clock } from 'lucide-react';
import { usePipelineStore } from '../lib/store';
import { loadHistory, deleteFromHistory, RECOMMENDATION_COLORS, type HistoryEntry } from '../lib/history';

export function CandidateHistorySidebar() {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const loadFromHistory = usePipelineStore((s) => s.loadFromHistory);

  const refresh = () => setEntries(loadHistory());

  useEffect(() => {
    refresh();
  }, []);

  const handleLoad = (entry: HistoryEntry) => {
    loadFromHistory(entry.data);
    setOpen(false);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteFromHistory(id);
    refresh();
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-40 bg-surface border border-border border-l-0 rounded-r-lg p-2 hover:bg-surface-2 transition-colors shadow-xs no-print cursor-pointer"
        title={open ? 'Close history' : 'Open history'}
        aria-label="Toggle candidate evaluation history sidebar"
      >
        {open ? <PanelLeftClose size={18} className="text-muted" /> : <PanelLeftOpen size={18} className="text-muted" />}
      </button>

      {/* Sidebar */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-30 bg-black/40 no-print"
            />
            {/* Panel */}
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-[260px] bg-surface border-r border-border z-30 flex flex-col no-print shadow-xl"
            >
              <div className="px-4 py-4 border-b border-border flex items-center gap-2">
                <Clock size={16} className="text-muted" />
                <h3 className="text-[13px] font-semibold text-text">Evaluation History</h3>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2">
                {entries.length === 0 ? (
                  <p className="text-[12px] text-muted text-center py-8">
                    No past evaluations yet. Complete an evaluation to see it here.
                  </p>
                ) : (
                  entries.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group bg-surface-2 rounded-lg border border-border p-3 cursor-pointer hover:border-accent-technical/40 transition-colors"
                      onClick={() => handleLoad(entry)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-semibold text-text truncate">{entry.candidateName}</p>
                          <p className="text-[11px] text-muted truncate">{entry.targetRole}</p>
                        </div>
                        <button
                          onClick={(e) => handleDelete(e, entry.id)}
                          className="opacity-0 group-hover:opacity-100 text-muted hover:text-danger transition-all flex-shrink-0"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <div className="mt-2">
                        <span
                          className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${RECOMMENDATION_COLORS[entry.recommendation]}1A`,
                            color: RECOMMENDATION_COLORS[entry.recommendation],
                          }}
                        >
                          {entry.recommendation}
                        </span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
