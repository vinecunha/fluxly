const CACHE_NAME = 'fluxly-v2'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
]

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Nunca cachear requisições do Supabase
  if (url.hostname.includes('supabase')) return

  // Para navegação (HTML), retornar /index.html do cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then(r => r || fetch(event.request))
    )
    return
  }

  // Cache-first para assets estáticos
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached
      return fetch(event.request).then(response => {
        // Cachear apenas respostas OK de mesma origem ou assets
        if (response.ok && (url.origin === self.location.origin || event.request.destination === 'image')) {
          const toCache = response.clone()
          caches.open(CACHE_NAME).then(c => c.put(event.request, toCache))
        }
        return response
      }).catch(() => caches.match('/index.html'))
    })
  )
})

// ─── Push Notifications ───────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return
  const { title, body, tag } = event.data.json()
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      if (clientList.length > 0) return clientList[0].focus()
      return clients.openWindow('/')
    })
  )
})

// ─── Scheduled Notifications via postMessage ──────────────────────────────────
// O app envia { type: 'SCHEDULE_NOTIFICATION', payload: { title, body, scheduledAt, tag } }
// O SW agenda um setTimeout e dispara quando chegar a hora.
const scheduledTimers = new Map()

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'SCHEDULE_NOTIFICATION') return

  const { title, body, scheduledAt, tag } = event.data.payload
  const delay = new Date(scheduledAt) - Date.now()

  if (delay <= 0) return

  // Cancela agendamento anterior com mesmo tag
  if (scheduledTimers.has(tag)) clearTimeout(scheduledTimers.get(tag))

  const timerId = setTimeout(() => {
    self.registration.showNotification(title, {
      body,
      tag,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
    })
    scheduledTimers.delete(tag)
  }, delay)

  scheduledTimers.set(tag, timerId)
})