/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

cleanupOutdatedCaches()
// @ts-ignore __WB_MANIFEST is injected by workbox at build time
precacheAndRoute(self.__WB_MANIFEST)

const AUTH_PATHS = ['/mapa', '/mapa-testemunhas', '/dados', '/admin', '/relatorio', '/account', '/import']

self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event

  if (request.method !== 'GET') return

  const accept = request.headers.get('accept') || ''
  if (accept.includes('application/json') || request.headers.get('x-requested-with') === 'XMLHttpRequest') {
    return
  }

  const url = new URL(request.url)
  if (AUTH_PATHS.some((p) => url.pathname.startsWith(p))) {
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/404.html'))
    )
  }
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})
