import React, { useMemo, useState, useEffect } from 'react'
import {
  ChevronLeft, ChevronRight, LogOut, CheckCircle2, Target,
  CalendarDays, TrendingUp, TrendingDown, PiggyBank, Zap, RefreshCw
} from 'lucide-react'

export const DashboardHeader = ({
  renda, totalDespesas, despesasPagas, reservaTotal,
  currentDate, onMonthChange, onLogout, isLoading, userEmail,
  onRefresh, isRefreshing, onOpenAnalytics,
}) => {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const metrics = useMemo(() => {
    const now = new Date()
    const isCurrentMonth =
      now.getMonth() === currentDate.getMonth() &&
      now.getFullYear() === currentDate.getFullYear()

    const progresso = totalDespesas > 0 ? Math.min((renda / totalDespesas) * 100, 100) : 0
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
    const currentDay = now.getDate()
    const progressoIdealPercent = (currentDay / daysInMonth) * 100
    const valorIdealAteHoje = (totalDespesas / daysInMonth) * currentDay
    const faltaGanhar = totalDespesas - renda
    const diasRestantes = (daysInMonth - currentDay) + 1
    const rendaDiariaNecessaria = isCurrentMonth && faltaGanhar > 0
      ? faltaGanhar / diasRestantes
      : 0
    const estaNoRitmo = renda >= valorIdealAteHoje

    return {
      now, isCurrentMonth,
      progresso, daysInMonth, currentDay,
      progressoIdealPercent, valorIdealAteHoje,
      rendaDiariaNecessaria, estaNoRitmo,
    }
  }, [renda, totalDespesas, currentDate])

  const { now, isCurrentMonth, estaNoRitmo } = metrics
  const isCoberto = renda >= totalDespesas && totalDespesas > 0

  const getBarColor = () => {
    if (isCoberto) return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
    if (estaNoRitmo) return 'bg-slate-400 shadow-[0_0_10px_rgba(99,102,241,0.4)]'
    return 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]'
  }

  const formatMonth = () => {
    if (isScrolled) {
      const m = String(currentDate.getMonth() + 1).padStart(2, '0')
      const y = currentDate.getFullYear()
      return `${m}/${y}`
    }
    return currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }

  if (isLoading) {
    return (
      <header className="fixed top-0 left-0 right-0 z-[100] bg-slate-900 pt-4 px-4 pb-6 animate-pulse">
        <div className="max-w-2xl mx-auto h-32 bg-white/10 rounded-2xl" />
      </header>
    )
  }

  return (
    <>
      <div className="h-[180px] sm:h-[220px]" />

      <header 
        className={`fixed top-0 left-0 right-0 z-[100] bg-slate-900 px-4 transition-all duration-300 ease-in-out border-b border-white/5 shadow-lg
          ${isScrolled ? 'py-3' : 'pt-4 sm:pt-6 pb-6'}`}
      >
        <div className="max-w-2xl mx-auto relative">
          
          <div className={`flex transition-all duration-300 ${isScrolled ? 'flex-row items-center justify-between gap-2' : 'flex-col'}`}>
            
            {/* 1. LOGO (order-1 no scroll) */}
            <div className={`flex flex-col min-w-0 transition-all duration-300 shrink-0 order-1 ${isScrolled ? 'scale-90 origin-left' : 'mb-4'}`}>
              {!isScrolled && (
                <span className="text-[7px] sm:text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase mb-0.5">
                  Simples. Inteligente.
                </span>
              )}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className={`font-black tracking-tighter text-white transition-all ${isScrolled ? 'text-xl' : 'text-2xl sm:text-4xl'}`}>
                  Fluxly
                </h1>
                <div className="h-3 sm:h-5 w-[1px] bg-white/20" />
                <span className="text-[8px] sm:text-[11px] font-bold text-slate-400 lowercase truncate max-w-[40px] sm:max-w-none">
                  {userEmail?.split('@')[0]}
                </span>
              </div>
            </div>

            {/* 2. MÊS (order-2 no scroll) */}
            <div className={`flex items-center bg-white/10 rounded-2xl p-1 border border-white/10 transition-all duration-300 order-2
              ${isScrolled 
                ? 'flex-1 max-w-[120px] mx-auto' 
                : 'w-full py-1.5 sm:py-2'}`}
            >
              <button onClick={() => onMonthChange(-1)} className="p-1 text-white/50 active:text-white hover:text-white transition-colors">
                <ChevronLeft size={isScrolled ? 14 : 16} />
              </button>
              <div className="relative flex-1 text-center">
                <span className={`font-black uppercase text-white transition-all duration-300 block truncate
                  ${isScrolled ? 'text-[10px] tracking-tight' : 'text-[9px] sm:text-[11px] tracking-widest'}`}>
                  {formatMonth()}
                </span>
                <input
                  type="month"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  value={`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`}
                  onChange={(e) => {
                    const [y, m] = e.target.value.split('-')
                    onMonthChange(
                      (parseInt(y) - currentDate.getFullYear()) * 12 +
                      (parseInt(m) - 1 - currentDate.getMonth())
                    )
                  }}
                />
              </div>
              <button onClick={() => onMonthChange(1)} className="p-1 text-white/50 active:text-white hover:text-white transition-colors">
                <ChevronRight size={isScrolled ? 14 : 16} />
              </button>
            </div>

            {/* 3. BOTÕES (order-3 no scroll) */}
            <div className={`flex items-center gap-1.5 shrink-0 order-3 transition-all
              ${isScrolled ? '' : 'absolute top-2 sm:top-4 right-0'}`}>
              {!isCurrentMonth && (
                <button
                  onClick={() => onMonthChange(
                    (now.getFullYear() - currentDate.getFullYear()) * 12 +
                    (now.getMonth() - currentDate.getMonth())
                  )}
                  className="bg-white/10 p-2 rounded-xl border border-white/10 active:scale-90 transition-all hover:bg-white/15"
                >
                  <CalendarDays className="w-4 h-4 text-white" />
                </button>
              )}
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={isRefreshing || isLoading}
                  className="bg-white/10 p-2 rounded-xl border border-white/10 active:scale-90 transition-all hover:bg-white/15"
                >
                  <RefreshCw className={`w-4 h-4 text-white ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              )}
              <button
                onClick={onLogout}
                className="bg-white/10 p-2 rounded-xl border border-white/10 active:scale-90 transition-all hover:bg-white/15"
              >
                <LogOut className="w-4 h-4 text-slate-300" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Card Section */}
      <div className="px-4 sm:px-6 relative z-10 -mt-10">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-5 sm:p-8 border border-gray-100">
          <div className="flex justify-between items-start mb-4 sm:mb-6">
            <div className="min-w-0">
              <p className="text-[9px] sm:text-[11px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Minhas Finanças</p>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight truncate">
                  R$ {renda.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h2>
                {isCurrentMonth && (
                  estaNoRitmo
                    ? <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-emerald-500 shrink-0" />
                    : <TrendingDown className="w-4 h-4 sm:w-6 sm:h-6 text-amber-500 animate-bounce shrink-0" />
                )}
              </div>
              <p className="text-[9px] sm:text-[12px] font-bold text-gray-400 mt-0.5">
                de R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <span className={`text-[8px] sm:text-[10px] font-black px-2 sm:px-3 py-0.5 sm:py-1 rounded-full uppercase shrink-0 mt-1 ${
              isCoberto ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}>
              {isCoberto ? 'Finalizado' : 'Em curso'}
            </span>
          </div>

          <div className="relative h-5 sm:h-7 flex items-center mb-2">
            <div className="w-full h-2 sm:h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${getBarColor()}`}
                style={{ width: `${metrics.progresso}%` }}
              />
            </div>
            {isCurrentMonth && (
              <div
                className="absolute h-5 sm:h-7 w-0.5 sm:w-1 bg-gray-900 rounded-full z-20"
                style={{ left: `${metrics.progressoIdealPercent}%` }}
              >
                <div className="absolute -top-4 sm:-top-5 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[6px] sm:text-[8px] font-black px-1 sm:px-1.5 py-0.5 rounded">
                  HOJE
                </div>
              </div>
            )}
          </div>

          {isCurrentMonth && (
            <p className="text-[9px] text-gray-400 font-bold mb-6 sm:mb-8">
              ideal até hoje: R$ {metrics.valorIdealAteHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          )}
          {!isCurrentMonth && <div className="mb-6 sm:mb-8" />}

          <div className="grid grid-cols-2 gap-3 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-gray-50/50 p-3 sm:p-4 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                <CheckCircle2 className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
                <span className="text-[7px] sm:text-[10px] font-black text-gray-400 uppercase tracking-tighter">Pagas</span>
              </div>
              <p className="text-xs sm:text-lg font-black text-gray-800 truncate">
                R$ {despesasPagas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-gray-50/50 p-3 sm:p-4 rounded-2xl border border-gray-100 text-right">
              <div className="flex items-center gap-1.5 sm:gap-2 justify-end mb-1">
                <span className="text-[7px] sm:text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                  {isCurrentMonth ? 'Meta/Dia' : 'Progresso'}
                </span>
                <Target className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-slate-500 shrink-0" />
              </div>
              <p className="text-xs sm:text-lg font-black text-slate-600 truncate">
                {isCurrentMonth
                  ? metrics.rendaDiariaNecessaria > 0
                    ? `R$ ${metrics.rendaDiariaNecessaria.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : 'Ok! 🎉'
                  : `${metrics.progresso.toFixed(0)}%`
                }
              </p>
            </div>
          </div>

          <button
            onClick={onOpenAnalytics}
            className="w-full bg-slate-900 rounded-2xl p-4 sm:p-6 flex items-center justify-between hover:bg-slate-800 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3 sm:gap-5 min-w-0">
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-white/15 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-inner">
                <PiggyBank className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0 text-left">
                <p className="text-[7px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Patrimônio</p>
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-sm sm:text-2xl font-black text-white leading-none">
                    R$ {reservaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <Zap size={8} className="text-amber-300 fill-amber-300 shrink-0" />
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/40 shrink-0" />
          </button>
        </div>
      </div>
    </>
  )
}