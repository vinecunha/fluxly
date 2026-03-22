import React, { useMemo, useState, useEffect } from 'react'
import {
  ChevronLeft, ChevronRight, LogOut, CheckCircle2, Target,
  CalendarDays, TrendingUp, TrendingDown, PiggyBank, Zap, RefreshCw
} from 'lucide-react'

// Header sempre fixo com altura constante — sem strip scrolled que causa sobreposição
// O strip de métricas fica apenas no card, sempre visível

export const DashboardHeader = ({
  renda, totalDespesas, despesasPagas, reservaTotal,
  currentDate, onMonthChange, onLogout, isLoading, userEmail,
  onRefresh, isRefreshing, onOpenAnalytics,
  saldoProjetado,
}) => {
  const metrics = useMemo(() => {
    const now = new Date()
    const isCurrentMonth =
      now.getMonth() === currentDate.getMonth() &&
      now.getFullYear() === currentDate.getFullYear()

    const progresso             = totalDespesas > 0 ? Math.min((renda / totalDespesas) * 100, 100) : 0
    const daysInMonth           = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
    const currentDay            = now.getDate()
    const progressoIdealPct     = (currentDay / daysInMonth) * 100
    const valorIdealAteHoje     = (totalDespesas / daysInMonth) * currentDay
    const faltaGanhar           = totalDespesas - renda
    const diasRestantes         = Math.max(daysInMonth - currentDay + 1, 1)
    const rendaDiariaNecessaria = isCurrentMonth && faltaGanhar > 0 ? faltaGanhar / diasRestantes : 0
    const estaNoRitmo           = renda >= valorIdealAteHoje

    return {
      now, isCurrentMonth,
      progresso, daysInMonth, currentDay, diasRestantes,
      progressoIdealPct, valorIdealAteHoje,
      rendaDiariaNecessaria, estaNoRitmo,
    }
  }, [renda, totalDespesas, reservaTotal, currentDate])

  const { now, isCurrentMonth, estaNoRitmo } = metrics
  const isCoberto         = renda >= totalDespesas && totalDespesas > 0
  const rendaInsuficiente = renda < totalDespesas
  const faltaRenda        = totalDespesas - renda

  const getBarColor = () => {
    if (isCoberto)   return 'bg-emerald-500'
    if (estaNoRitmo) return 'bg-slate-400'
    return 'bg-rose-500'
  }

  const fmtK = (v) => {
    const abs = Math.abs(v)
    if (abs >= 1000) return `R$${(abs / 1000).toFixed(1)}k`
    return `R$${abs.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`
  }
  const fmtFull = (v) =>
    `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const formatMonth = () =>
    currentDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).toUpperCase()

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
      {/* Spacer fixo — altura do header sempre igual */}
      <div className="h-[64px]" />

      {/* Header fixo slim */}
      <header className="fixed top-0 left-0 right-0 z-[100] bg-slate-900 border-b border-white/5 shadow-lg px-4 py-2">
        <div className="max-w-2xl mx-auto flex items-center gap-2">

          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <h1 className="text-xl font-black tracking-tighter text-white leading-none">Fluxly</h1>
            <div className="h-3.5 w-px bg-white/20" />
            <span className="text-[10px] font-bold text-slate-500 lowercase truncate max-w-[55px] sm:max-w-none">
              {userEmail?.split('@')[0]}
            </span>
          </div>

          {/* Seletor de mês */}
          <div className="flex items-center bg-white/10 rounded-2xl border border-white/10 flex-1 mx-1">
            <button onClick={() => onMonthChange(-1)}
              className="px-2 text-white/50 active:text-white hover:text-white transition-colors"
              style={{ minHeight: 40 }}>
              <ChevronLeft size={14} />
            </button>
            <div className="relative flex-1 text-center">
              <span className="text-[11px] font-black tracking-widest text-white block">
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
            <button onClick={() => onMonthChange(1)}
              className="px-2 text-white/50 active:text-white hover:text-white transition-colors"
              style={{ minHeight: 40 }}>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Botões */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {!isCurrentMonth && (
              <button
                onClick={() => onMonthChange(
                  (now.getFullYear() - currentDate.getFullYear()) * 12 +
                  (now.getMonth() - currentDate.getMonth())
                )}
                className="bg-white/10 p-2 rounded-xl border border-white/10 active:scale-90 transition-all"
                style={{ minHeight: 36, minWidth: 36 }}>
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
            <button onClick={onLogout}
              className="bg-white/10 p-2 rounded-xl border border-white/10 active:scale-90 transition-all"
              style={{ minHeight: 36, minWidth: 36 }}>
              <LogOut className="w-3.5 h-3.5 text-slate-300" />
            </button>
          </div>
        </div>
      </header>

      {/* Card — sem -mt, flui normalmente abaixo do spacer */}
      <div className="px-4 pt-3">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">

          {/* Valor + badge */}
          <div className="flex justify-between items-start mb-3">
            <div className="min-w-0">
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Minhas Finanças</p>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  {fmtFull(renda)}
                </h2>
                {isCurrentMonth && (
                  estaNoRitmo
                    ? <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" />
                    : <TrendingDown className="w-4 h-4 text-amber-500 animate-bounce shrink-0" />
                )}
              </div>
              <p className="text-[10px] font-bold text-gray-400 mt-0.5">
                de {fmtFull(totalDespesas)} em despesas
              </p>
            </div>
            <span className={`text-[8px] font-black px-2.5 py-1 rounded-full uppercase shrink-0 mt-1 ${
              isCoberto ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}>
              {isCoberto ? 'Finalizado' : 'Em curso'}
            </span>
          </div>

          {/* Barra */}
          <div className="relative h-5 flex items-center mb-1">
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-1000 ease-out ${getBarColor()}`}
                style={{ width: `${metrics.progresso}%` }} />
            </div>
            {isCurrentMonth && (
              <div className="absolute h-5 w-0.5 bg-gray-800 rounded-full z-10"
                style={{ left: `${metrics.progressoIdealPct}%` }}>
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[7px] font-black px-1 py-0.5 rounded whitespace-nowrap">
                  HOJE
                </div>
              </div>
            )}
          </div>
          {isCurrentMonth && (
            <p className="text-[9px] text-gray-400 font-bold mb-4">
              ideal até hoje: {fmtFull(metrics.valorIdealAteHoje)}
            </p>
          )}
          {!isCurrentMonth && <div className="mb-4" />}

          {/* Grid 2 métricas */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                <span className="text-[8px] font-black text-gray-400 uppercase">Pagas</span>
              </div>
              <p className="text-sm font-black text-gray-800">{fmtFull(despesasPagas)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 text-right">
              <div className="flex items-center gap-1.5 justify-end mb-1">
                <span className="text-[8px] font-black text-gray-400 uppercase">
                  {isCurrentMonth ? 'Meta/Dia' : 'Progresso'}
                </span>
                <Target className="w-3 h-3 text-slate-400 shrink-0" />
              </div>
              <p className="text-sm font-black text-slate-600">
                {isCurrentMonth
                  ? metrics.rendaDiariaNecessaria > 0 ? fmtFull(metrics.rendaDiariaNecessaria) : 'Ok! 🎉'
                  : `${metrics.progresso.toFixed(0)}%`}
              </p>
            </div>
          </div>

          {/* Strip 4 mini-métricas */}
          <div className="grid grid-cols-4 gap-1.5 mb-3">
            {[
              { label: 'Gastos',  value: fmtK(totalDespesas),                          color: 'text-rose-600',    bg: 'bg-rose-50'    },
              { label: 'Reserva', value: fmtK(reservaTotal),                            color: 'text-blue-600',    bg: 'bg-blue-50'    },
              { label: 'Projetado', value: saldoProjetado != null ? fmtK(saldoProjetado) : fmtK(Math.max(renda - totalDespesas, 0)), color: (saldoProjetado ?? (renda - totalDespesas)) >= 0 ? 'text-emerald-600' : 'text-rose-600', bg: (saldoProjetado ?? (renda - totalDespesas)) >= 0 ? 'bg-emerald-50' : 'bg-rose-50' },
              { label: isCurrentMonth ? 'Dias' : 'Prog.', value: isCurrentMonth ? `${metrics.diasRestantes}d` : `${metrics.progresso.toFixed(0)}%`, color: 'text-slate-600', bg: 'bg-slate-50' },
            ].map((m, i) => (
              <div key={i} className={`${m.bg} rounded-xl p-2 text-center`}>
                <p className="text-[7px] font-black text-gray-400 uppercase leading-none mb-1">{m.label}</p>
                <p className={`text-[11px] font-black ${m.color} leading-none`}>{m.value}</p>
              </div>
            ))}
          </div>

          {/* Patrimônio */}
          <button onClick={onOpenAnalytics}
            className="w-full bg-slate-900 rounded-2xl p-4 flex items-center justify-between hover:bg-slate-800 active:scale-[0.98] transition-all"
            style={{ minHeight: 52 }}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 bg-white/15 rounded-2xl flex items-center justify-center shrink-0">
                <PiggyBank className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0 text-left">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Patrimônio</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-black text-white leading-none">{fmtFull(reservaTotal)}</span>
                  <Zap size={8} className="text-amber-300 fill-amber-300 shrink-0" />
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/30 shrink-0" />
          </button>

          {/* Rodapé */}
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-50">
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isCoberto ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-[8px] font-black text-gray-400 uppercase">{metrics.progresso.toFixed(0)}% coberto</span>
            </div>
            <span className={`text-[8px] font-black uppercase ${rendaInsuficiente ? 'text-rose-500' : 'text-emerald-500'}`}>
              {rendaInsuficiente ? `Faltam ${fmtFull(faltaRenda)}` : 'Objetivo Alcançado'}
            </span>
          </div>
        </div>
      </div>
    </>
  )
}