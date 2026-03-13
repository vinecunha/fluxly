import React, { useMemo } from 'react'
import {
  ChevronLeft, ChevronRight, LogOut, CheckCircle2, Target,
  CalendarDays, TrendingUp, TrendingDown,
  PiggyBank, Zap
} from 'lucide-react'

export const DashboardHeader = ({ renda, totalDespesas, despesasPagas, reservaTotal, currentDate, onMonthChange, onLogout, isLoading, userEmail }) => {
  const now = new Date()
  const isToday = now.getMonth() === currentDate.getMonth() &&
    now.getFullYear() === currentDate.getFullYear()

  const metrics = useMemo(() => {
    const progresso = totalDespesas > 0 ? Math.min((renda / totalDespesas) * 100, 100) : 0
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
    const currentDay = now.getDate()
    const progressoIdealPercent = (currentDay / daysInMonth) * 100
    const valorIdealAteHoje = (totalDespesas / daysInMonth) * currentDay
    const faltaGanhar = totalDespesas - renda
    const diasRestantes = (daysInMonth - currentDay) + 1
    const rendaDiariaNecessaria = faltaGanhar > 0 ? faltaGanhar / diasRestantes : 0
    return { progresso, daysInMonth, currentDay, progressoIdealPercent, valorIdealAteHoje, rendaDiariaNecessaria }
  }, [renda, totalDespesas, currentDate])

  const isCoberto = renda >= totalDespesas && totalDespesas > 0
  const rendaInsuficiente = renda < totalDespesas
  const faltaRenda = totalDespesas - renda
  const estaNoRitmo = renda >= metrics.valorIdealAteHoje

  const getBarColor = () => {
    if (isCoberto) return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
    if (estaNoRitmo) return 'bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.4)]'
    return 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]'
  }

  const formatMonth = () => currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  if (isLoading) {
    return (
      <header className="bg-indigo-600 p-5 rounded-b-[2.5rem] shadow-2xl animate-pulse lg:max-w-4xl lg:mx-auto">
        <div className="h-36 bg-white/10 rounded-3xl" />
      </header>
    )
  }

  return (
    <header className="bg-indigo-600 p-4 sm:p-6 pb-8 rounded-b-[2.5rem] sm:rounded-b-[3.5rem] shadow-2xl relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-indigo-500 rounded-full blur-[80px] opacity-50 pointer-events-none" />

      <div className="flex justify-between items-center text-white mb-5 sm:mb-8 relative z-10">
        <div className="flex flex-col min-w-0">
          <span className="text-[7px] sm:text-[9px] font-black tracking-[0.2em] text-indigo-200/70 uppercase">
            Simples. Inteligente.
          </span>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <h1 className="font-black text-2xl sm:text-4xl tracking-tighter">Fluxly</h1>
            <div className="h-3 sm:h-5 w-[1px] bg-indigo-400/40" />
            <span className="text-[8px] sm:text-[11px] font-bold text-indigo-200 opacity-60 lowercase truncate max-w-[70px] sm:max-w-none">
              {userEmail?.split('@')[0]}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {!isToday && (
            <button
              onClick={() => onMonthChange((now.getFullYear() - currentDate.getFullYear()) * 12 + (now.getMonth() - currentDate.getMonth()))}
              className="bg-white/15 backdrop-blur-md p-2 sm:p-2.5 rounded-xl border border-white/10 active:scale-90 transition-all hover:bg-white/20"
            >
              <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
          <button onClick={onLogout} className="bg-indigo-900/20 backdrop-blur-md p-2 sm:p-2.5 rounded-xl border border-indigo-500/20 text-rose-100 active:scale-90 transition-all hover:bg-indigo-500/30">
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-5 sm:mb-8 bg-black/10 backdrop-blur-lg rounded-2xl p-1 border border-white/5 relative z-10">
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
              onMonthChange((parseInt(y) - currentDate.getFullYear()) * 12 + (parseInt(m) - 1 - currentDate.getMonth()))
            }}
          />
        </div>
        <button onClick={() => onMonthChange(1)} className="p-1.5 sm:p-2 text-white/60 active:text-white hover:text-white transition-colors">
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-xl p-5 sm:p-8 relative z-10 border border-indigo-50">
        <div className="flex justify-between items-start mb-4 sm:mb-6">
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[11px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Minhas Finanças</p>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight truncate">
                R$ {renda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h2>
              {isToday && (estaNoRitmo ? <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-emerald-500 shrink-0" /> : <TrendingDown className="w-4 h-4 sm:w-6 sm:h-6 text-amber-500 animate-bounce shrink-0" />)}
            </div>
            <p className="text-[9px] sm:text-[12px] font-bold text-gray-400 mt-0.5">
              de R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <span className={`text-[8px] sm:text-[10px] font-black px-2 sm:px-3 py-0.5 sm:py-1 rounded-full uppercase shrink-0 mt-1 ${isCoberto ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {isCoberto ? 'Finalizado' : 'Em curso'}
          </span>
        </div>

        <div className="relative h-5 sm:h-7 flex items-center mb-8 sm:mb-10">
          <div className="w-full h-2 sm:h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${getBarColor()}`}
              style={{ width: `${metrics.progresso}%` }}
            />
          </div>
          {isToday && (
            <div
              className="absolute h-5 sm:h-7 w-0.5 sm:w-1 bg-gray-900 rounded-full z-20"
              style={{ left: `${metrics.progressoIdealPercent}%` }}
            >
              <div className="absolute -top-4 sm:-top-5 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[6px] sm:text-[8px] font-black px-1 sm:px-1.5 py-0.5 rounded-sm">
                HOJE
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-gray-50/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-100">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
              <CheckCircle2 className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
              <span className="text-[7px] sm:text-[10px] font-black text-gray-400 uppercase tracking-tighter">Pagas</span>
            </div>
            <p className="text-xs sm:text-lg font-black text-gray-800 truncate">
              R$ {despesasPagas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-gray-50/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-100 text-right">
            <div className="flex items-center gap-1.5 sm:gap-2 justify-end mb-1">
              <span className="text-[7px] sm:text-[10px] font-black text-gray-400 uppercase tracking-tighter">Meta/Dia</span>
              <Target className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-indigo-500 shrink-0" />
            </div>
            <p className="text-xs sm:text-lg font-black text-indigo-600 truncate">
              {metrics.rendaDiariaNecessaria > 0 ? `R$ ${metrics.rendaDiariaNecessaria.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Ok! 🎉'}
            </p>
          </div>
        </div>

        <div className="bg-indigo-600 rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 flex items-center justify-between group hover:bg-indigo-700 transition-colors">
          <div className="flex items-center gap-3 sm:gap-5 min-w-0">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center text-white shrink-0 shadow-inner">
              <PiggyBank className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[7px] sm:text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-0.5">Patrimônio</p>
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-sm sm:text-2xl font-black text-white leading-none">
                  R$ {reservaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <Zap size={8} className="text-amber-300 fill-amber-300 shrink-0" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mt-5 sm:mt-8 px-0.5 border-t border-gray-50 pt-4">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isCoberto ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-[8px] sm:text-[11px] font-black text-gray-400 uppercase">{metrics.progresso.toFixed(0)}% Coberto</span>
          </div>
          <span className={`text-[8px] sm:text-[11px] font-black uppercase truncate ml-2 ${rendaInsuficiente ? 'text-rose-500' : 'text-emerald-500'}`}>
            {rendaInsuficiente ? `Faltam R$ ${faltaRenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Objetivo Alcançado'}
          </span>
        </div>
      </div>
    </header>
  )
}