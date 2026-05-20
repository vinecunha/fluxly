import { useEffect } from 'react'
import { logger } from '@lib/logger'

export function useServiceWorker(): void {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const basePath = import.meta.env.BASE_URL || '/'
      const swPath = `${basePath}sw.js`
      
      logger.log('[SW] Registrando em:', swPath)
      
      navigator.serviceWorker.register(swPath)
        .then(registration => {
          logger.log('[SW] Registrado com sucesso! Scope:', registration.scope)
        })
        .catch(err => {
          logger.error('[SW] Falha no registro:', err)
        })
    } else {
      logger.warn('[SW] Service Worker não suportado neste navegador')
    }
  }, [])
}