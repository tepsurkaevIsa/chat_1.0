import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './components/ui/ThemeProvider'

// Handle mobile keyboard: toggle body class to prevent whole-document scrolling
if (typeof window !== 'undefined') {
  const root = document.documentElement;
  const getVv = () => (window as any).visualViewport as VisualViewport | undefined;
  let lastKeyboardOpen = false;
  let rafId: number | null = null;
  const updateKeyboardState = () => {
    const vv = getVv();
    const height = vv ? vv.height : window.innerHeight;
    const fullHeight = window.innerHeight;
    const keyboardOpen = fullHeight - height > 120;
    if (keyboardOpen !== lastKeyboardOpen) {
      root.classList.toggle('keyboard-open', keyboardOpen);
      lastKeyboardOpen = keyboardOpen;
    }
  };
  const onViewportChange = () => {
    if (rafId != null) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      updateKeyboardState();
      rafId = null;
    });
  };
  window.addEventListener('resize', onViewportChange, { passive: true });
  window.addEventListener('orientationchange', onViewportChange, { passive: true });
  const vv = getVv();
  if (vv) {
    vv.addEventListener('resize', onViewportChange, { passive: true } as any);
    vv.addEventListener('scroll', onViewportChange, { passive: true } as any);
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('Service worker registration failed:', error)
    })
  })
}