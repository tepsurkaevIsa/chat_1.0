import React, { useEffect, useMemo, useState } from 'react';
import { THEME_STORAGE_KEY, ThemeName, getInitialTheme } from '../../config';
import { ThemeContext } from './themeContext';

// ThemeContext is defined in themeContext.ts to keep this file exporting only components

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
    } catch (_e) {
      void 0;
    }
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
      } catch (_e) {
        void 0;
      }
    };
    media.addEventListener?.('change', handleChange);
    return () => media.removeEventListener?.('change', handleChange);
  }, []);

  const value = useMemo(() => ({
    theme,
    setTheme: setThemeState,
    toggleTheme: () => setThemeState(prev => (prev === 'dark' ? 'light' : 'dark')),
  }), [theme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
