import { RefreshCw } from 'lucide-react'

const THRESHOLD = 80

/**
 * PullToRefreshIndicator
 *
 * Indicador visual que aparece no topo durante o gesto de pull-to-refresh.
 * Coloque logo após a abertura do div raiz no App.jsx.
 *
 * Props:
 *   pullDistance  — número de px arrastados (0 quando parado)
 *   isPulling     — true durante o arrasto
 *   isRefreshing  — true enquanto o refresh está em andamento
 */
export function PullToRefreshIndicator({ pullDistance, isPulling, isRefreshing }) {
  if (!isPulling && !isRefreshing) return null

  const progress  = Math.min(pullDistance / THRESHOLD, 1)
  const ready     = progress >= 1
  const rotation  = isRefreshing ? 'animate-spin' : ''

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
      style={{
        transform: `translateY(${isRefreshing ? 56 : pullDistance * 0.6}px)`,
        transition: isPulling ? 'none' : 'transform 0.3s ease',
      }}
    >
      <div className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg text-white text-[10px] font-black uppercase tracking-wide transition-all ${
        ready || isRefreshing ? 'bg-slate-900' : 'bg-gray-400'
      }`}>
        <RefreshCw
          size={14}
          className={rotation}
          style={{ transform: `rotate(${progress * 360}deg)`, transition: isPulling ? 'none' : undefined }}
        />
        {isRefreshing ? 'Atualizando...' : ready ? 'Solte para atualizar' : 'Puxe para atualizar'}
      </div>
    </div>
  )
}