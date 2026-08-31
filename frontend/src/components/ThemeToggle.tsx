import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import { applyTheme, getInitialTheme, initThemeListener, type ThemeMode } from '../lib/theme';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<ThemeMode>('system');
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const initial = getInitialTheme();
    setTheme(initial);
    const effective = applyTheme(initial);
    setEffectiveTheme(effective);

    const cleanup = initThemeListener((eff) => {
      setEffectiveTheme(eff);
    });
    return cleanup;
  }, []);

  const handleSelectTheme = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    const eff = applyTheme(newTheme);
    setEffectiveTheme(eff);
    setShowMenu(false);
  };

  const toggleDirect = () => {
    const next: ThemeMode = effectiveTheme === 'dark' ? 'light' : 'dark';
    handleSelectTheme(next);
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onClick={toggleDirect}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowMenu(!showMenu);
        }}
        aria-label={`Switch theme (currently ${theme} mode, rendered in ${effectiveTheme})`}
        title={`Theme: ${theme.toUpperCase()} (${effectiveTheme}). Right-click for options.`}
        className="flex items-center justify-center w-8 h-8 rounded-lg bg-surface border border-border hover:bg-surface-2 text-text transition-all duration-200 shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-technical cursor-pointer"
      >
        <AnimatePresence mode="wait" initial={false}>
          {effectiveTheme === 'dark' ? (
            <motion.div
              key="moon"
              initial={{ rotate: -90, scale: 0.7, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0.7, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <Moon size={15} className="text-accent-technical" />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ rotate: 90, scale: 0.7, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: -90, scale: 0.7, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <Sun size={15} className="text-amber-500" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Quick Menu Popover if open */}
      <AnimatePresence>
        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-1.5 z-50 w-32 rounded-lg bg-surface border border-border p-1 shadow-lg"
            >
              <button
                onClick={() => handleSelectTheme('light')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] rounded-md transition-colors ${
                  theme === 'light' ? 'bg-accent-technical/15 text-accent-technical font-semibold' : 'text-text hover:bg-surface-2'
                }`}
              >
                <Sun size={13} className="text-amber-500" />
                <span>Light</span>
              </button>
              <button
                onClick={() => handleSelectTheme('dark')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] rounded-md transition-colors ${
                  theme === 'dark' ? 'bg-accent-technical/15 text-accent-technical font-semibold' : 'text-text hover:bg-surface-2'
                }`}
              >
                <Moon size={13} className="text-accent-technical" />
                <span>Dark</span>
              </button>
              <button
                onClick={() => handleSelectTheme('system')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] rounded-md transition-colors ${
                  theme === 'system' ? 'bg-accent-technical/15 text-accent-technical font-semibold' : 'text-text hover:bg-surface-2'
                }`}
              >
                <Monitor size={13} className="text-muted" />
                <span>System</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
