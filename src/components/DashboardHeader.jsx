import React, { useState, useMemo, useRef, useEffect } from 'react'
import {
  ChevronLeft, ChevronRight, LogOut, CalendarDays, RefreshCw,
  Bell, Flame, AlertTriangle, Info, X, CheckCircle2, PiggyBank, Zap,
  TrendingUp, TrendingDown
} from 'lucide-react'

// Componente de notificação individual
function NotificationItem({ notification, onClose }) {
  const getIcon = () => {
    switch (notification.tipo) {
      case 'perigo': return <Flame size={14} className="text-rose-500" />
      case 'atencao': return <AlertTriangle size={14} className="text-amber-500" />
      default: return <Info size={14} className="text-blue-500" />
    }
  }

  const getBgColor = () => {
    switch (notification.tipo) {
      case 'perigo': return 'bg-rose-50 border-rose-100'
      case 'atencao': return 'bg-amber-50 border-amber-100'
      default: return 'bg-blue-50 border-blue-100'
    }
  }

  return (
    <div className={`p-3 rounded-xl border ${getBgColor()} relative group`}>
      <div className="flex items-start gap-2.5">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold text-gray-800 leading-tight">
            {notification.titulo}
          </p>
          <p className="text-[9px] text-gray-500 mt-0.5 leading-relaxed">
            {notification.texto}
          </p>
          {notification.data && (
            <p className="text-[8px] text-gray-400 mt-1">
              {new Date(notification.data).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
        <button
          onClick={() => onClose(notification.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 -mr-1"
        >
          <X size={12} className="text-gray-400 hover:text-gray-600" />
        </button>
      </div>
    </div>
  )
}

export const DashboardHeader = ({
  renda, totalDespesas, reservaTotal,
  currentDate, onMonthChange, onLogout, isLoading,
  onRefresh, isRefreshing, onOpenAnalytics,
  saldoProjetado, alertas = [], onQuickPay, isSaving
}) => {
  const [showNotifications, setShowNotifications] = useState(false)
  const [dismissedNotifications, setDismissedNotifications] = useState(new Set())
  const notificationsRef = useRef(null)

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filtrar notificações não dispensadas
  const activeNotifications = useMemo(() => {
    return (alertas || [])
      .filter(a => !dismissedNotifications.has(a.id))
      .sort((a, b) => {
        const prioridade = { perigo: 3, atencao: 2, info: 1, ok: 0 }
        return (prioridade[b.tipo] || 0) - (prioridade[a.tipo] || 0)
      })
  }, [alertas, dismissedNotifications])

  const nonDismiss = activeNotifications.length
  const hasUrgent = activeNotifications.some(a => a.tipo === 'perigo')

  const dismissNotification = (id) => {
    setDismissedNotifications(prev => new Set([...prev, id]))
  }

  // Métricas para barra de progresso
  const metrics = useMemo(() => {
    const now = new Date()
    const isCurrentMonth =
      now.getMonth() === currentDate.getMonth() &&
      now.getFullYear() === currentDate.getFullYear()

    const progresso = totalDespesas > 0 ? Math.min((renda / totalDespesas) * 100, 100) : 0
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
    const currentDay = now.getDate()
    const progressoIdealPct = (currentDay / daysInMonth) * 100
    const valorIdealAteHoje = (totalDespesas / daysInMonth) * currentDay
    const estaNoRitmo = renda >= valorIdealAteHoje

    return {
      isCurrentMonth,
      progresso,
      progressoIdealPct,
      valorIdealAteHoje,
      estaNoRitmo,
      daysInMonth,
      currentDay
    }
  }, [renda, totalDespesas, currentDate])

  const { isCurrentMonth, progresso, progressoIdealPct, valorIdealAteHoje, estaNoRitmo } = metrics
  const isCoberto = renda >= totalDespesas && totalDespesas > 0

  const getBarColor = () => {
    if (isCoberto) return 'bg-emerald-500'
    if (estaNoRitmo) return 'bg-slate-400'
    return 'bg-rose-500'
  }

  const fmtFull = (v) =>
    `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const formatMonth = () =>
    currentDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).toUpperCase()

  const navigateToMonth = (year, month) => {
    const targetDate = new Date(year, month, 1)
    const diffMonths = (targetDate.getFullYear() - currentDate.getFullYear()) * 12 +
      (targetDate.getMonth() - currentDate.getMonth())
    if (diffMonths !== 0) {
      onMonthChange(diffMonths)
    }
  }

  const goToCurrentMonth = () => {
    const now = new Date()
    navigateToMonth(now.getFullYear(), now.getMonth())
  }

  if (isLoading) {
    return (
      <>
        <div className="h-[64px]" />
        <header className="fixed top-0 left-0 right-0 z-[100] bg-slate-900 px-4 py-3 animate-pulse">
          <div className="max-w-2xl mx-auto h-10 bg-white/10 rounded-2xl" />
        </header>
      </>
    )
  }

  return (
    <>
      {/* Spacer fixo */}
      <div className="h-[64px]" />

      {/* Header fixo */}
      <header className="fixed top-0 left-0 right-0 z-[100] bg-slate-900 border-b border-white/5 shadow-lg px-4 py-2">
        <div className="max-w-2xl mx-auto">
          {/* Linha superior: Logo + Seletor + Botões */}
          <div className="flex items-center gap-2">
            {/* Logo */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <h1 className="text-xl font-black tracking-tighter text-white leading-none">Fluxly</h1>
              <div className="h-3.5 w-px bg-white/20" />
            </div>

            {/* Seletor de mês */}
            <div className="flex items-center bg-white/10 rounded-2xl border border-white/10 flex-1 mx-1">
              <button onClick={() => onMonthChange(-1)} className="px-4 text-white/50 active:text-white hover:text-white transition-colors" style={{ minHeight: 40 }}>
                <ChevronLeft size={14} />
              </button>
              <div className="relative flex-1 text-center">
                <span className="text-[11px] font-black tracking-widest text-white block">{formatMonth()}</span>
                <input
                  type="month"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  value={`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`}
                  onChange={(e) => {
                    const [year, month] = e.target.value.split('-')
                    navigateToMonth(parseInt(year), parseInt(month) - 1)
                  }}
                />
              </div>
              <button onClick={() => onMonthChange(1)} className="px-4 text-white/50 active:text-white hover:text-white transition-colors" style={{ minHeight: 40 }}>
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Botões */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Botão de notificações */}
              <div className="relative" ref={notificationsRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative bg-white/10 p-2 rounded-xl border border-white/10 active:scale-90 transition-all"
                  style={{ minHeight: 36, minWidth: 36 }}
                >
                  <Bell size={16} className="text-white" />
                  {nonDismiss > 0 && (
                    <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center ${
                      hasUrgent ? 'bg-rose-500 text-white animate-pulse' : 'bg-amber-500 text-white'
                    }`}>
                      {nonDismiss > 9 ? '9+' : nonDismiss}
                    </span>
                  )}
                </button>

                {/* Dropdown de notificações */}
                {showNotifications && (
                  <div 
                    className="absolute top-full mt-2 w-80 max-w-[calc(100vw-32px)] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in slide-in-from-top-2 fade-in duration-200"
                    style={{ 
                      right: 'auto',
                      left: '50%',
                      transform: 'translateX(-50%)'
                    }}
                  >
                    <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell size={14} className="text-gray-500" />
                        <h3 className="text-[11px] font-black text-gray-700 uppercase tracking-wider">Notificações</h3>
                      </div>
                      {nonDismiss > 0 && (
                        <button
                          onClick={() => setDismissedNotifications(new Set(alertas.map(a => a.id)))}
                          className="text-[9px] font-black text-gray-400 hover:text-gray-600 uppercase"
                        >
                          Limpar todas
                        </button>
                      )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto p-3 space-y-2">
                      {activeNotifications.length === 0 ? (
                        <div className="text-center py-8">
                          <CheckCircle2 size={24} className="text-gray-200 mx-auto mb-2" />
                          <p className="text-[10px] text-gray-400 font-bold">Nenhuma notificação</p>
                          <p className="text-[8px] text-gray-300 mt-1">Tudo em ordem por enquanto</p>
                        </div>
                      ) : (
                        activeNotifications.map(notif => (
                          <NotificationItem
                            key={notif.id}
                            notification={notif}
                            onClose={dismissNotification}
                          />
                        ))
                      )}
                    </div>

                    {activeNotifications.length > 0 && onQuickPay && (
                      <div className="p-3 border-t border-gray-100">
                        <button
                          onClick={() => {
                            const firstUrgent = activeNotifications.find(n => n.tipo === 'perigo')
                            if (firstUrgent?.onQuickPay) firstUrgent.onQuickPay()
                            setShowNotifications(false)
                          }}
                          className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase active:scale-95 transition-all"
                        >
                          Resolver agora
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {!isCurrentMonth && (
                <button onClick={goToCurrentMonth} className="bg-white/10 p-2 rounded-xl border border-white/10 active:scale-90 transition-all" style={{ minHeight: 36, minWidth: 36 }}>
                  <CalendarDays className="w-3.5 h-3.5 text-white" />
                </button>
              )}
              {onRefresh && (
                <button onClick={onRefresh} disabled={isRefreshing || isLoading}
                  className="bg-white/10 p-2 rounded-xl border border-white/10 active:scale-90 transition-all disabled:opacity-40"
                  style={{ minHeight: 36, minWidth: 36 }}>
                  <RefreshCw className={`w-3.5 h-3.5 text-white ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              )}
              <button onClick={onLogout} className="bg-white/10 p-2 rounded-xl border border-white/10 active:scale-90 transition-all" style={{ minHeight: 36, minWidth: 36 }}>
                <LogOut className="w-3.5 h-3.5 text-slate-300" />
              </button>
            </div>
          </div>

          {/* Linha inferior: Barra de progresso + indicadores */}
          <div className="mt-2">
            {/* Valores */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black text-white/70">{fmtFull(renda)}</span>
                <span className="text-[7px] text-white/40">recebidos</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black text-white/70">{fmtFull(totalDespesas)}</span>
                <span className="text-[7px] text-white/40">despesas</span>
              </div>
            </div>

            {/* Barra de progresso */}
            <div className="relative h-6 mt-3 flex items-center">
              <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-1000 ease-out ${getBarColor()}`}
                  style={{ width: `${progresso}%` }} />
              </div>
              {isCurrentMonth && (
                <div className="absolute h-4 w-0.5 bg-white rounded-full z-10"
                  style={{ left: `${progressoIdealPct}%` }}>
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white/20 text-white text-[6px] font-black px-1 py-0.5 rounded whitespace-nowrap">
                    HOJE
                  </div>
                </div>
              )}
            </div>

            {/* Indicador de ritmo */}
            <div className="flex items-center justify-between mt-1">
              <p className="text-[7px] text-white/50 font-bold">
                {isCurrentMonth && `ideal: ${fmtFull(valorIdealAteHoje)}`}
              </p>
              <div className="flex items-center gap-1">
                {isCurrentMonth && (
                  estaNoRitmo
                    ? <TrendingUp size={8} className="text-emerald-400" />
                    : <TrendingDown size={8} className="text-amber-400" />
                )}
                <span className={`text-[7px] font-black ${isCoberto ? 'text-emerald-400' : estaNoRitmo ? 'text-white/60' : 'text-amber-400'}`}>
                  {isCoberto ? '✓ Meta alcançada' : `${progresso.toFixed(0)}% coberto`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  )
}