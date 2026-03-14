import React, { useMemo } from 'react'
import {
  ChevronLeft, ChevronRight, LogOut, CheckCircle2, Target,
  CalendarDays, TrendingUp, TrendingDown, PiggyBank, Zap, RefreshCw
} from 'lucide-react'

export const DashboardHeader = ({
  renda, totalDespesas, despesasPagas, reservaTotal,
  currentDate, onMonthChange, onLogout, isLoading, userEmail,
  onRefresh, isRefreshing, onOpenAnalytics,
}) => {
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

  const isCoberto       = renda >= totalDespesas && totalDespesas > 0
  const rendaInsuficiente = renda < totalDespesas
  const faltaRenda      = totalDespesas - renda

  const getBarColor = () => {
    if (isCoberto)         return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
    if (estaNoRitmo)       return 'bg-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.4)]'
    return 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]'
  }

  const formatMonth = () => currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  if (isLoading) {
    return (
      <header className="bg-gradient-to-br from-indigo-600 to-violet-700 p-5 rounded-b-2xl shadow-2xl animate-pulse">
        <div className="h-36 bg-white/10 rounded-2xl" />
      </header>
    )
  }

  return (
    <header className="bg-gradient-to-br from-indigo-600 to-violet-700 p-4 sm:p-6 pb-8 rounded-b-2xl shadow-2xl relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-72 h-72 bg-white/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-5%] w-48 h-48 bg-violet-500/20 rounded-full blur-[60px] pointer-events-none" />

      <div className="flex justify-between items-center text-white mb-5 sm:mb-8 relative z-10">
        <div className="flex flex-col min-w-0">
          <span className="text-[7px] sm:text-[9px] font-black tracking-[0.2em] text-indigo-200/70 uppercase">
            Simples. Inteligente.
          </span>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <h1 className="font-black text-2xl sm:text-4xl tracking-tighter">Fluxly</h1>
            <div className="h-3 sm:h-5 w-[1px] bg-white/20" />
            <span className="text-[8px] sm:text-[11px] font-bold text-indigo-200/60 lowercase truncate max-w-[70px] sm:max-w-none">
              {userEmail?.split('@')[0]}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {!isCurrentMonth && (
            <button
              onClick={() => onMonthChange(
                (now.getFullYear() - currentDate.getFullYear()) * 12 +
                (now.getMonth() - currentDate.getMonth())
              )}
              className="bg-white/15 backdrop-blur-md p-2 sm:p-2.5 rounded-2xl border border-white/10 active:scale-90 transition-all hover:bg-white/20"
              title="Ir para o mês atual"
            >
              <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing || isLoading}
              className="bg-white/15 backdrop-blur-md p-2 sm:p-2.5 rounded-2xl border border-white/10 active:scale-90 transition-all hover:bg-white/20 disabled:opacity-40"
              title="Atualizar dados"
            >
              <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          )}

          <button
            onClick={onLogout}
            className="bg-white/10 backdrop-blur-md p-2 sm:p-2.5 rounded-2xl border border-white/10 text-rose-200 active:scale-90 transition-all hover:bg-white/20"
            title="Sair"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-5 sm:mb-8 bg-white/10 backdrop-blur-lg rounded-2xl p-1 border border-white/10 relative z-10">
        <button onClick={() => onMonthChange(-1)} className="p-1.5 sm:p-2 text-white/60 active:text-white hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <div className="relative px-3 py-1">
          <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-white">
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
        <button onClick={() => onMonthChange(1)} className="p-1.5 sm:p-2 text-white/60 active:text-white hover:text-white transition-colors">
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-8 relative z-10 border border-white/50 animate-in fade-in duration-500">

        <div className="flex justify-between items-start mb-4 sm:mb-6">
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[11px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Minhas Finanças</p>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight truncate">
                R$ {renda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h2>
              {isCurrentMonth && (
                estaNoRitmo
                  ? <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-emerald-500 shrink-0" />
                  : <TrendingDown className="w-4 h-4 sm:w-6 sm:h-6 text-amber-500 animate-bounce shrink-0" />
              )}
            </div>
            <p className="text-[9px] sm:text-[12px] font-bold text-gray-400 mt-0.5">
              de R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
            ideal até hoje: R$ {metrics.valorIdealAteHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
              R$ {despesasPagas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-gray-50/50 p-3 sm:p-4 rounded-2xl border border-gray-100 text-right">
            <div className="flex items-center gap-1.5 sm:gap-2 justify-end mb-1">
              <span className="text-[7px] sm:text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                {isCurrentMonth ? 'Meta/Dia' : 'Progresso'}
              </span>
              <Target className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-indigo-500 shrink-0" />
            </div>
            <p className="text-xs sm:text-lg font-black text-indigo-600 truncate">
              {isCurrentMonth
                ? metrics.rendaDiariaNecessaria > 0
                  ? `R$ ${metrics.rendaDiariaNecessaria.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  : 'Ok! 🎉'
                : `${metrics.progresso.toFixed(0)}%`
              }
            </p>
          </div>
        </div>

        <button
          onClick={onOpenAnalytics}
          className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-4 sm:p-6 flex items-center justify-between hover:from-indigo-700 hover:to-violet-700 active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-3 sm:gap-5 min-w-0">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-inner">
              <PiggyBank className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0 text-left">
              <p className="text-[7px] sm:text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-0.5">Patrimônio</p>
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-sm sm:text-2xl font-black text-white leading-none">
                  R$ {reservaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <Zap size={8} className="text-amber-300 fill-amber-300 shrink-0" />
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-white/40 shrink-0" />
        </button>

        <div className="flex justify-between items-center mt-5 sm:mt-8 px-0.5 border-t border-gray-50 pt-4">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isCoberto ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-[8px] sm:text-[11px] font-black text-gray-400 uppercase">
              {metrics.progresso.toFixed(0)}% Coberto
            </span>
          </div>
          <span className={`text-[8px] sm:text-[11px] font-black uppercase truncate ml-2 ${
            rendaInsuficiente ? 'text-rose-500' : 'text-emerald-500'
          }`}>
            {rendaInsuficiente
              ? `Faltam R$ ${faltaRenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
              : 'Objetivo Alcançado'}
          </span>
        </div>
      </div>
    </header>
  )
}