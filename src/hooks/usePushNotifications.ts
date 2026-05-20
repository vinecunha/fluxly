import { useState, useEffect, useCallback } from 'react'
import { env } from '@lib/env'
import { logger } from '@lib/logger'

type NotificationPermission = 'granted' | 'denied' | 'default'

interface UsePushNotificationsReturn {
  permission: NotificationPermission
  requestPermission: () => Promise<NotificationPermission>
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [permission, setPermission] = useState<NotificationPermission>(
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

interface NotificationOptions {
  tag?: string
  icon?: string
  badge?: string
}

export function sendLocalNotification(title: string, body: string, options: NotificationOptions = {}): void {
  if (typeof Notification === 'undefined') return
  if (Notification.permission !== 'granted') return

  new Notification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    ...options,
  })
}

interface ScheduledNotification {
  title: string
  body: string
  scheduledAt: Date
  tag?: string
}

export function scheduleNotification({ title, body, scheduledAt, tag }: ScheduledNotification): void {
  if (!navigator.serviceWorker?.controller) return

  navigator.serviceWorker.controller.postMessage({
    type: 'SCHEDULE_NOTIFICATION',
    payload: { title, body, scheduledAt: scheduledAt.toISOString(), tag },
  })
}

async function _subscribeToPush(): Promise<PushSubscription | undefined> {
  try {
    const registration = await navigator.serviceWorker.ready
    const existing = await registration.pushManager.getSubscription()
    if (existing) return existing

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: _urlBase64ToUint8Array(env.VAPID_PUBLIC_KEY) as BufferSource,
    })

    if (env.IS_DEV) {
      logger.info('[Push] Inscrição criada:', JSON.stringify(subscription))
    }

    return subscription
  } catch (err) {
    logger.warn('[Push] Falha ao inscribver:', err)
  }
}

function _urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const buffer = new ArrayBuffer(rawData.length)
  const output = new Uint8Array(buffer)
  for (let i = 0; i < rawData.length; ++i) {
    output[i] = rawData.charCodeAt(i)
  }
  return output
}