/**
 * Application Theme Manager
 * Supports 'light' | 'dark' | 'system' modes with localStorage persistence
 * and OS prefers-color-scheme detection without theme flashes.
 */

export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'promptwars_theme';

export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
  } catch (e) {
    console.warn('[Theme] Could not read theme from localStorage:', e);
  }
  return 'system';
}

export function applyTheme(theme: ThemeMode): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'light';

  const effectiveTheme: 'light' | 'dark' =
    theme === 'system' ? getSystemTheme() : theme;

  const root = document.documentElement;
  if (effectiveTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (e) {
    console.warn('[Theme] Could not save theme to localStorage:', e);
  }

  return effectiveTheme;
}

/**
 * Initializes theme listener to track OS preference changes dynamically
 * when the user is in 'system' mode.
 */
export function initThemeListener(onThemeChange?: (effective: 'light' | 'dark') => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = () => {
    const current = getInitialTheme();
    if (current === 'system') {
      const effective = applyTheme('system');
      if (onThemeChange) onThemeChange(effective);
    }
  };

  mediaQuery.addEventListener('change', handler);
  return () => mediaQuery.removeEventListener('change', handler);
}
