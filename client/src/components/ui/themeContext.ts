export type { ThemeName } from '../../config';
import { createContext, useContext } from 'react';
import type { ThemeName as ThemeNameType } from '../../config';

export interface ThemeContextValue {
	theme: ThemeNameType;
	setTheme: (theme: ThemeNameType) => void;
	toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function useTheme(): ThemeContextValue {
	const ctx = useContext(ThemeContext);
	if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
	return ctx;
}