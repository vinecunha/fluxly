import { useState, useEffect, useRef, useCallback } from 'react'

const THRESHOLD = 80   // px para acionar o refresh
const MAX_PULL  = 120  // px máximo de arrasto

/**
 * usePullToRefresh
 *
 * Detecta o gesto de pull-to-refresh no topo da página.
 *
 * @param {Function} onRefresh — função async chamada ao soltar
 * @returns {{ pullDistance, isPulling, isRefreshing }}
 */
export function usePullToRefresh(onRefresh) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isPulling, setIsPulling]       = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const startY    = useRef(null)
  const triggered = useRef(false)

  const handleTouchStart = useCallback((e) => {
    // Só ativa se já estiver no topo da página
    if (window.scrollY > 0) return
    startY.current  = e.touches[0].clientY
    triggered.current = false
  }, [])

  const handleTouchMove = useCallback((e) => {
    if (startY.current === null) return
    const delta = e.touches[0].clientY - startY.current
    if (delta <= 0) { setPullDistance(0); return }

    // Resiste progressivamente (efeito elástico)
    const resistance = 0.5
    const clamped = Math.min(delta * resistance, MAX_PULL)
    setPullDistance(clamped)
    setIsPulling(true)

    if (clamped >= THRESHOLD && !triggered.current) {
      triggered.current = true
      // Vibração háptica leve ao atingir o threshold
      navigator.vibrate?.(10)
    }
  }, [])

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= THRESHOLD && !isRefreshing) {
      setIsRefreshing(true)
      setPullDistance(0)
      setIsPulling(false)
      try { await onRefresh() } finally { setIsRefreshing(false) }
    } else {
      setPullDistance(0)
      setIsPulling(false)
    }
    startY.current = null
  }, [pullDistance, isRefreshing, onRefresh])

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove',  handleTouchMove,  { passive: true })
    document.addEventListener('touchend',   handleTouchEnd,   { passive: true })
    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove',  handleTouchMove)
      document.removeEventListener('touchend',   handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  return { pullDistance, isPulling, isRefreshing }
}