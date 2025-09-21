import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { THEME_STORAGE_KEY, ThemeName, getInitialTheme } from '../../config';

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function applyThemeClass(theme: ThemeName) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(() => getInitialTheme());

  useEffect(() => {
    applyThemeClass(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {}
  }, [theme]);

  // Sync with system preference if user clears storage elsewhere
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeName | null;
        if (!stored) {
          setThemeState(media.matches ? 'dark' : 'light');
        }
      } catch {}
    };
    media.addEventListener?.('change', handleChange);
    return () => media.removeEventListener?.('change', handleChange);
  }, []);

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    setTheme: setThemeState,
    toggleTheme: () => setThemeState(prev => (prev === 'dark' ? 'light' : 'dark')),
  }), [theme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
