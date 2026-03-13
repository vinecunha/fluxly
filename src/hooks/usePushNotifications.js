import { useState, useEffect, useCallback } from 'react'
import { env } from '../lib/env'

/**
 * usePushNotifications
 *
 * Gerencia permissão e inscrição em notificações push.
 * Requer:
 *   1. Service Worker registrado (public/sw.js)
 *   2. VITE_VAPID_PUBLIC_KEY no .env.local
 *
 * Uso:
 *   const { permission, requestPermission } = usePushNotifications()
 */
export function usePushNotifications() {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  )

  useEffect(() => {
    if (typeof Notification === 'undefined') return
    setPermission(Notification.permission)
  }, [])

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return 'denied'

    const result = await Notification.requestPermission()
    setPermission(result)

    if (result === 'granted' && env.VAPID_PUBLIC_KEY) {
      await _subscribeToPush()
    }

    return result
  }, [])

  return { permission, requestPermission }
}

/**
 * Envia uma notificação local imediata (sem servidor).
 * Útil para confirmações de ação dentro do app.
 */
export function sendLocalNotification(title, body, options = {}) {
  if (typeof Notification === 'undefined') return
  if (Notification.permission !== 'granted') return

  new Notification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    ...options,
  })
}

/**
 * Agenda uma notificação via Service Worker para uma data futura.
 * O SW precisa tratar o evento 'push' ou 'notificationclick'.
 * Aqui usamos postMessage para passar o agendamento ao SW.
 */
export function scheduleNotification({ title, body, scheduledAt, tag }) {
  if (!navigator.serviceWorker?.controller) return

  navigator.serviceWorker.controller.postMessage({
    type: 'SCHEDULE_NOTIFICATION',
    payload: { title, body, scheduledAt, tag },
  })
}

// ─── Inscrição Push (Web Push API) ──────────────────────────────────────────
async function _subscribeToPush() {
  try {
    const registration = await navigator.serviceWorker.ready
    const existing = await registration.pushManager.getSubscription()
    if (existing) return existing

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: _urlBase64ToUint8Array(env.VAPID_PUBLIC_KEY),
    })

    // Aqui você enviaria `subscription` para o seu backend/Supabase Edge Function.
    // Por enquanto, logamos para debug:
    if (env.IS_DEV) {
      console.info('[Push] Inscrição criada:', JSON.stringify(subscription))
    }

    return subscription
  } catch (err) {
    console.warn('[Push] Falha ao inscrever:', err)
  }
}

function _urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}