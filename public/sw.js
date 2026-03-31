// Detectar caminho base automaticamente
const BASE_PATH = self.location.pathname.replace(/\/[^/]*$/, '/')
const CACHE_NAME = 'fluxly-v3'

const STATIC_ASSETS = [
  `${BASE_PATH}`,
  `${BASE_PATH}index.html`,
  `${BASE_PATH}manifest.json`,
  `${BASE_PATH}icon-192.png`,
  `${BASE_PATH}icon-512.png`,
  `${BASE_PATH}icon-192.svg`,
  `${BASE_PATH}icon-512.svg`,
]

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando, base:', BASE_PATH)
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Usar Promise.allSettled para não falhar se algum arquivo não existir
      return Promise.allSettled(
        STATIC_ASSETS.map(asset => 
          cache.add(asset).catch(err => console.warn(`[SW] Falha ao cachear ${asset}:`, err))
        )
      )
    })
  )
  self.skipWaiting()
})

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativado')
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

  // Para navegação (HTML), retornar index.html do cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(`${BASE_PATH}index.html`).then(response => {
        return response || fetch(event.request).catch(() => {
          // Fallback offline
          return caches.match(`${BASE_PATH}index.html`)
        })
      })
    )
    return
  }

  // Cache-first para assets estáticos
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached
      
      return fetch(event.request).then(response => {
        // Cachear apenas respostas OK de mesma origem ou imagens
        if (response.ok && (url.origin === self.location.origin || event.request.destination === 'image')) {
          const toCache = response.clone()
          caches.open(CACHE_NAME).then(c => c.put(event.request, toCache))
        }
        return response
      }).catch(() => {
        // Fallback para imagens
        if (event.request.destination === 'image') {
          return caches.match(`${BASE_PATH}icon-192.png`)
        }
        return null
      })
    })
  )
})

// ─── Push Notifications ───────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return
  try {
    const { title, body, tag } = event.data.json()
    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        tag,
        icon: `${BASE_PATH}icon-192.png`,
        badge: `${BASE_PATH}icon-192.png`,
      })
    )
  } catch (error) {
    console.error('[SW] Erro na notificação:', error)
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      if (clientList.length > 0) {
        return clientList[0].focus()
      }
      return clients.openWindow(BASE_PATH)
    })
  )
})

// ─── Scheduled Notifications via postMessage ──────────────────────────────────
const scheduledTimers = new Map()

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'SCHEDULE_NOTIFICATION') return

  const { title, body, scheduledAt, tag } = event.data.payload
  const delay = new Date(scheduledAt) - Date.now()

  if (delay <= 0) return

  if (scheduledTimers.has(tag)) clearTimeout(scheduledTimers.get(tag))

  const timerId = setTimeout(() => {
    self.registration.showNotification(title, {
      body,
      tag,
      icon: `${BASE_PATH}icon-192.png`,
      badge: `${BASE_PATH}icon-192.png`,
    })
    scheduledTimers.delete(tag)
  }, delay)

  scheduledTimers.set(tag, timerId)
})