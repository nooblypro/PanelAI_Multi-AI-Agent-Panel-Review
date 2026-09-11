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
              className="fixed inset-0 z-30 bg-black/50 backdrop-blur-xs no-print"
            />
            {/* Panel */}
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed left-0 top-0 bottom-0 w-[300px] bg-surface border-r border-border z-30 flex flex-col no-print shadow-2xl"
            >
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={15} className="text-accent-technical" />
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-text">DOCKET ARCHIVE</span>
                </div>
                <span className="font-mono text-[10px] text-muted bg-surface-2 px-2 py-0.5 rounded border border-border">
                  {entries.length} RECORDS
                </span>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-2.5">
                {entries.length === 0 ? (
                  <div className="text-center py-12 px-2">
                    <p className="font-mono text-[11px] text-muted uppercase tracking-wider">NO PRIOR DOCKETS</p>
                    <p className="text-[12px] text-muted mt-2">
                      Concluded hearing reports will be archived here for instant recall.
                    </p>
                  </div>
                ) : (
                  entries.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group bg-surface-2 rounded-xl border border-border p-3.5 cursor-pointer hover:border-accent-technical/60 transition-all hover:shadow-xs"
                      onClick={() => handleLoad(entry)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-bold text-text truncate font-serif">{entry.candidateName}</p>
                          <p className="text-[11px] text-muted font-mono truncate mt-0.5">{entry.targetRole}</p>
                        </div>
                        <button
                          onClick={(e) => handleDelete(e, entry.id)}
                          className="opacity-0 group-hover:opacity-100 text-muted hover:text-danger p-1 rounded hover:bg-surface transition-all flex-shrink-0"
                          title="Delete record"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <div className="mt-2.5 flex items-center justify-between border-t border-border/50 pt-2">
                        <span
                          className="inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm tracking-wider uppercase"
                          style={{
                            backgroundColor: `${RECOMMENDATION_COLORS[entry.recommendation]}18`,
                            color: RECOMMENDATION_COLORS[entry.recommendation],
                            border: `1px solid ${RECOMMENDATION_COLORS[entry.recommendation]}40`,
                          }}
                        >
                          {entry.recommendation}
                        </span>
                        <span className="font-mono text-[9px] text-muted">LOAD ➔</span>
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
