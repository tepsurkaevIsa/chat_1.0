// Minimal service worker to enable PWA installability
// Uses pass-through fetch; no precaching for fastest setup

self.addEventListener('install', () => {
	self.skipWaiting()
})

self.addEventListener('activate', (event) => {
	event.waitUntil(self.clients.claim())
})

// Optional: pass-through fetch to keep control for installability criteria
self.addEventListener('fetch', () => {})

