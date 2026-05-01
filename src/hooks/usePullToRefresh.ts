import { useState, useEffect, useRef, useCallback } from 'react'

const THRESHOLD = 80
const MAX_PULL  = 120

interface UsePullToRefreshReturn {
  pullDistance: number
  isPulling: boolean
  isRefreshing: boolean
}

export function usePullToRefresh(onRefresh: () => Promise<void>): UsePullToRefreshReturn {
  const [pullDistance, setPullDistance] = useState(0)
  const [isPulling, setIsPulling]       = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const startY    = useRef<number | null>(null)
  const triggered = useRef(false)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY > 0) return
    startY.current  = e.touches[0]?.clientY ?? null
    triggered.current = false
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (startY.current === null) return
    const delta = (e.touches[0]?.clientY ?? 0) - (startY.current ?? 0)
    if (delta <= 0) { setPullDistance(0); return }

    const resistance = 0.5
    const clamped = Math.min(delta * resistance, MAX_PULL)
    setPullDistance(clamped)
    setIsPulling(true)

    if (clamped >= THRESHOLD && !triggered.current) {
      triggered.current = true
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