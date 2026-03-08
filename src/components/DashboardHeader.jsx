import React from 'react'
import { ChevronLeft, ChevronRight, LogOut, CheckCircle2, Target, CalendarDays, AlertCircle, TrendingUp, TrendingDown, PiggyBank, ArrowUpRight } from 'lucide-react'

export const DashboardHeader = ({ renda, totalDespesas, despesasPagas, reservaTotal, currentDate, onMonthChange, onLogout, isLoading, userEmail }) => {
  const progresso = totalDespesas > 0 ? Math.min((renda / totalDespesas) * 100, 100) : 0
  const isCoberto = renda >= totalDespesas && totalDespesas > 0
  const rendaInsuficiente = renda < totalDespesas
  const faltaRenda = totalDespesas - renda
  
  const now = new Date()
  const isToday = now.getMonth() === currentDate.getMonth() && 
                  now.getFullYear() === currentDate.getFullYear()

  const currentDay = now.getDate()
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const progressoIdealPercent = (currentDay / daysInMonth) * 100
  const valorIdealAteHoje = (totalDespesas / daysInMonth) * currentDay
  const estaNoRitmo = renda >= valorIdealAteHoje

  const getBarColor = () => {
    if (isCoberto) return 'bg-emerald-500'
    if (estaNoRitmo) return 'bg-indigo-500'
    return 'bg-rose-500'
  }

  const formatMonth = () => {
    return currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }

  const getDailyTarget = () => {
    const faltaGanhar = totalDespesas - renda
    if (faltaGanhar <= 0) return 0
    const isPastMonth = currentDate < new Date(now.getFullYear(), now.getMonth(), 1)
    if (isPastMonth) return 0
    const ultimoDiaMes = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
    const diaReferencia = isToday ? now.getDate() : 1
    const diasRestantes = (ultimoDiaMes - diaReferencia) + 1
    return faltaGanhar / diasRestantes
  }

  const rendaDiariaNecessaria = getDailyTarget()

  const getResponsiveFontSize = (value) => {
    const str = value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }).length
    if (str > 12) return 'text-[11px]'
    return 'text-sm'
  }

  const handleDirectMonthChange = (e) => {
    const [year, month] = e.target.value.split('-')
    const newDate = new Date(year, parseInt(month) - 1, 1)
    const diff = (newDate.getFullYear() - currentDate.getFullYear()) * 12 + (newDate.getMonth() - currentDate.getMonth())
    onMonthChange(diff)
  }

  const goToToday = () => {
    const diff = (now.getFullYear() - currentDate.getFullYear()) * 12 + (now.getMonth() - currentDate.getMonth())
    onMonthChange(diff)
  }

  if (isLoading) {
    return (
      <header className="bg-indigo-600 p-6 rounded-b-[2.5rem] shadow-xl lg:max-w-4xl lg:mx-auto animate-pulse">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 w-24 bg-white/20 rounded-lg" />
          <div className="h-8 w-8 bg-white/20 rounded-full" />
        </div>
        <div className="h-12 w-full bg-indigo-700/50 rounded-2xl mb-6" />
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-indigo-100">
          <div className="h-32 bg-gray-50 rounded-2xl" />
        </div>
      </header>
    )
  }

  return (
    <header className="bg-indigo-600 p-6 rounded-b-[2.5rem] shadow-xl lg:max-w-4xl lg:mx-auto">
      <div className="flex justify-between items-start text-white mb-4">
        <div className="flex flex-col min-w-0">
          <span className="text-[9px] font-bold tracking-wider text-indigo-100/80 ">
            Simples. Inteligente.
          </span>
          <div className="flex items-baseline gap-3">
            <span className="font-black text-4xl tracking-tight shrink-0">Fluxly</span>
            <span className="text-[10px] font-medium text-indigo-200 truncate lowercase opacity-80">
              {userEmail}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 pt-2">
          {!isToday && (
            <button 
              onClick={goToToday}
              className="text-[10px] font-black uppercase bg-white/20 px-3 py-1.5 rounded-full hover:bg-white/30 transition-all flex items-center gap-1.5"
            >
              <CalendarDays size={12} />
              Hoje
            </button>
          )}
          <button onClick={onLogout} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6 bg-indigo-700/50 rounded-2xl p-2 border border-indigo-400/20">
        <button onClick={() => onMonthChange(-1)} className="p-2 text-indigo-100 hover:text-white transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div className="relative flex items-center justify-center group cursor-pointer">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
            {formatMonth()}
          </h3>
          <input 
            type="month" 
            className="absolute inset-0 opacity-0 cursor-pointer w-full"
            value={`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`}
            onChange={handleDirectMonthChange}
          />
        </div>
        <button onClick={() => onMonthChange(1)} className="p-2 text-indigo-100 hover:text-white transition-colors">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-indigo-100 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-50" />
        
        <div className="flex justify-between items-start mb-1">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Minhas Finanças</p>
          <div className="flex flex-col items-end gap-1">
            {isCoberto ? (
              <span className="bg-emerald-100 text-emerald-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Mês Garantido</span>
            ) : (
              rendaInsuficiente && (
                <span className="bg-rose-100 text-rose-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase animate-pulse">
                  Ajuste Necessário
                </span>
              )
            )}
          </div>
        </div>

        <div className="flex justify-between items-end mb-4">
          <div className="min-w-0">
            <h2 className="text-2xl font-black text-gray-900 leading-none truncate">
              R$ {renda.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <div className="flex items-center gap-1.5 mt-1">
               <p className="text-[10px] text-gray-400 font-bold uppercase">Renda no Mês</p>
               {isToday && (
                estaNoRitmo ? (
                  <TrendingUp size={12} className="text-emerald-500" />
                ) : (
                  <TrendingDown size={12} className="text-amber-500 animate-bounce" />
                )
               )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className={`text-xs font-black ${rendaInsuficiente ? 'text-rose-600' : 'text-indigo-600'}`}>
              R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Alvo Acumulado</p>
          </div>
        </div>

        <div className="mb-6 group cursor-default">
          <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100/50 rounded-2xl p-3 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 transform group-hover:scale-110 transition-transform">
                <PiggyBank size={20} />
              </div>
              <div>
                <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Patrimônio / Reserva</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-black text-indigo-950">
                    R$ {reservaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <ArrowUpRight size={10} className="text-indigo-400" />
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end">
                <div className="h-1.5 w-16 bg-indigo-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full animate-pulse" style={{ width: '65%' }} />
                </div>
                <span className="text-[7px] font-black text-indigo-300 uppercase mt-1">Capital Protegido</span>
            </div>
          </div>
        </div>

        <div className="h-4 w-full bg-gray-100 rounded-full relative mb-6">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ease-out ${getBarColor()}`}
            style={{ width: `${progresso}%` }}
          />
          
          {isToday && (
            <div 
              className="absolute top-[-4px] bottom-[-4px] w-1 bg-slate-900 z-20 shadow-sm"
              style={{ left: `${progressoIdealPercent}%` }}
            >
              <div className="absolute bottom-[-14px] left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[7px] font-black px-1.5 py-0.5 rounded-sm whitespace-nowrap">
                DIA {currentDay}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 py-4 border-t border-gray-50">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600 shrink-0">
              <CheckCircle2 size={14} />
            </div>
            <div className="min-w-0">
              <p className="text-[8px] font-black text-gray-400 uppercase leading-none mb-0.5">Já Pago</p>
              <p className={`font-black text-gray-800 tracking-tight truncate ${getResponsiveFontSize(despesasPagas)}`}>
                R$ {despesasPagas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 border-l border-gray-100 pl-2 min-w-0">
            {rendaInsuficiente && !isToday && currentDate < new Date(now.getFullYear(), now.getMonth(), 1) ? (
              <>
                <div className="p-1.5 bg-rose-50 rounded-lg text-rose-600 animate-pulse shrink-0">
                  <AlertCircle size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] font-black text-rose-400 uppercase leading-none mb-0.5">Atenção</p>
                  <p className="text-[11px] font-black text-rose-600 tracking-tight leading-none uppercase truncate">Renda Baixa</p>
                </div>
              </>
            ) : (
              <>
                <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600 shrink-0">
                  <Target size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] font-black text-gray-400 uppercase leading-none mb-0.5">Meta Diária</p>
                  <p className={`font-black text-indigo-600 tracking-tight truncate ${getResponsiveFontSize(rendaDiariaNecessaria)}`}>
                    {rendaDiariaNecessaria > 0 
                      ? `R$ ${rendaDiariaNecessaria.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : 'Batida! 🎉'}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-between mt-4 pt-4 border-t border-gray-50">
          <span className="text-[9px] font-black text-gray-400 uppercase shrink-0">{progresso.toFixed(0)}% Coberto</span>
          <span className={`text-[9px] font-black uppercase truncate ml-2 ${rendaInsuficiente ? 'text-rose-500 animate-pulse' : 'text-emerald-500'}`}>
            {rendaInsuficiente 
              ? `Faltam R$ ${faltaRenda.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
              : 'Objetivo Concluído'}
          </span>
        </div>
      </div>
    </header>
  )
}