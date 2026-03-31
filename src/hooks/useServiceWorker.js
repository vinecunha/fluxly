import { useEffect } from 'react'

export function useServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Pega o caminho base configurado no Vite (ex: '/fluxly/')
      const basePath = import.meta.env.BASE_URL || '/'
      const swPath = `${basePath}sw.js`
      
      console.log('[SW] Registrando em:', swPath)
      
      navigator.serviceWorker.register(swPath)
        .then(registration => {
          console.log('[SW] Registrado com sucesso! Scope:', registration.scope)
        })
        .catch(err => {
          console.error('[SW] Falha no registro:', err)
        })
    } else {
      console.warn('[SW] Service Worker não suportado neste navegador')
    }
  }, [])
}