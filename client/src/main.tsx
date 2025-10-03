import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './components/ui/ThemeProvider'

// Функция для установки кастомной переменной --vh
function setVh() {
  document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`)
}

// Изначальная установка
setVh()

// Отслеживание изменения высоты окна для мобильной клавиатуры
let initialHeight = window.innerHeight
window.addEventListener('resize', () => {
  setVh()
  const currentHeight = window.innerHeight
  if (currentHeight < initialHeight) {
    // клавиатура открылась
    document.body.style.overflow = 'hidden'
    document.body.classList.add('keyboard-open')
  } else {
    // клавиатура закрылась
    document.body.style.overflow = ''
    document.body.classList.remove('keyboard-open')
  }
})


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