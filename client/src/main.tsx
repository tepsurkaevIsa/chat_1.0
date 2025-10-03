import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './components/ui/ThemeProvider'

// Handle mobile keyboard: toggle body class to prevent whole-document scrolling
if (typeof window !== 'undefined' && 'visualViewport' in window) {
  const vv = (window as any).visualViewport as VisualViewport;
  const body = document.body;
  const onResize = () => {
    const height = vv.height;
    const fullHeight = window.innerHeight;
    const keyboardOpen = fullHeight - height > 120;
    body.classList.toggle('keyboard-open', keyboardOpen);
  };
  vv.addEventListener('resize', onResize);
  vv.addEventListener('scroll', onResize);
  window.addEventListener('resize', onResize);
  onResize();
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