export type ThemeName = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'chat_theme';

export function getInitialTheme(): ThemeName {
	try {
		const stored = localStorage.getItem(THEME_STORAGE_KEY);
		if (stored === 'light' || stored === 'dark') {
			return stored;
		}
		const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
		return prefersDark ? 'dark' : 'light';
	} catch (_e) {
		return 'light';
	}
}

type ImportMetaEnv = { DEV?: boolean; VITE_API_BASE_URL?: string; VITE_WS_URL?: string };
const env = (import.meta as unknown as { env?: ImportMetaEnv }).env || {};
export const API_BASE_URL: string = env.VITE_API_BASE_URL || (env.DEV ? '/api' : '/');

function computeDefaultWsUrl(): string {
	try {
		const isHttps = window.location.protocol === 'https:';
		const wsProtocol = isHttps ? 'wss' : 'ws';
		const host = window.location.hostname;
		// In dev, default to localhost:3001 like current implementation
		if (env.DEV) {
			return `${wsProtocol}://${host}:3001`;
		}
		const port = window.location.port ? `:${window.location.port}` : '';
		// Fallback production path; adjust via VITE_WS_URL if different
		return `${wsProtocol}://${host}${port}/ws`;
	} catch (_e) {
		return 'ws://localhost:3001';
	}
}

export const WS_URL: string = env.VITE_WS_URL || computeDefaultWsUrl();

