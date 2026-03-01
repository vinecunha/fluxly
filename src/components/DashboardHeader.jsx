import React from 'react'
import { ChevronLeft, ChevronRight, LogOut, CheckCircle2, Target, CalendarDays, AlertCircle } from 'lucide-react'

export const DashboardHeader = ({ renda, totalDespesas, despesasPagas, currentDate, onMonthChange, onLogout }) => {
  const progresso = totalDespesas > 0 ? Math.min((renda / totalDespesas) * 100, 100) : 0
  const isCoberto = renda >= totalDespesas && totalDespesas > 0
  const rendaInsuficiente = renda < totalDespesas
  const faltaRenda = totalDespesas - renda

  const isToday = new Date().getMonth() === currentDate.getMonth() && 
                  new Date().getFullYear() === currentDate.getFullYear()

  const formatMonth = () => {
    return currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }

  const getDailyTarget = () => {
    const today = new Date()
    const faltaGanhar = totalDespesas - renda
    if (faltaGanhar <= 0) return 0

    // Se o mês já passou, a meta diária não se aplica mais
    const isPastMonth = currentDate < new Date(today.getFullYear(), today.getMonth(), 1)
    if (isPastMonth) return 0

    const ultimoDiaMes = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
    const diaReferencia = isToday ? today.getDate() : 1
    const diasRestantes = (ultimoDiaMes - diaReferencia) + 1

    return faltaGanhar / diasRestantes
  }

  const rendaDiariaNecessaria = getDailyTarget()

  const handleDirectMonthChange = (e) => {
    const [year, month] = e.target.value.split('-')
    const newDate = new Date(year, parseInt(month) - 1, 1)
    const diff = (newDate.getFullYear() - currentDate.getFullYear()) * 12 + (newDate.getMonth() - currentDate.getMonth())
    onMonthChange(diff)
  }

  const goToToday = () => {
    const now = new Date()
    const diff = (now.getFullYear() - currentDate.getFullYear()) * 12 + (now.getMonth() - currentDate.getMonth())
    onMonthChange(diff)
  }

  return (
    <header className="bg-indigo-600 p-6 rounded-b-[2.5rem] shadow-xl lg:max-w-4xl lg:mx-auto">
      {/* Topo: Logo e Ações */}
      <div className="flex justify-between items-center text-white mb-6">
        <span className="font-black text-2xl tracking-tight">Fluxly</span>
        <div className="flex items-center gap-2">
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

      {/* Seletor de Mês */}
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
      
      {/* Card de Cobertura */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-indigo-100 relative overflow-hidden">
        {/* Barra de Progresso Inferior Fina */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-50">
          <div 
            className={`h-full transition-all duration-1000 ${rendaInsuficiente ? 'bg-rose-500' : 'bg-indigo-600'}`}
            style={{ width: `${progresso}%` }}
          />
        </div>

        <div className="flex justify-between items-start mb-1">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Cobertura de Gastos</p>
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

        <div className="flex justify-between items-end mb-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900 leading-none">
              R$ {renda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h2>
            <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">Renda no Mês</p>
          </div>
          <div className="text-right">
            <span className={`text-sm font-black ${rendaInsuficiente ? 'text-rose-600' : 'text-indigo-600'}`}>
              R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Alvo Acumulado</p>
          </div>
        </div>

        {/* Barra de Progresso Principal */}
        <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden relative mb-6">
          <div 
            className={`h-full transition-all duration-1000 ease-out ${rendaInsuficiente ? 'bg-rose-500' : 'bg-indigo-500'}`}
            style={{ width: `${progresso}%` }}
          />
        </div>

        {/* Grid de Infos: Já Pago vs Status/Meta Diária */}
        <div className="grid grid-cols-2 gap-4 py-4 border-t border-gray-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase leading-none mb-1">Já Pago</p>
              <p className="text-sm font-black text-gray-800 tracking-tight">
                R$ {despesasPagas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 border-l border-gray-100 pl-4">
            {/* Lógica: Só exibe "Renda Baixa" se o mês já acabou e não foi batido.
                Se for o mês atual ou futuro, foca na Meta Diária. */}
            {rendaInsuficiente && !isToday && currentDate < new Date(new Date().getFullYear(), new Date().getMonth(), 1) ? (
              <>
                <div className="p-2 bg-rose-50 rounded-xl text-rose-600 animate-pulse">
                  <AlertCircle size={16} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-rose-400 uppercase leading-none mb-1">Atenção</p>
                  <p className="text-sm font-black text-rose-600 tracking-tight leading-none uppercase">Renda Baixa</p>
                </div>
              </>
            ) : (
              <>
                <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                  <Target size={16} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase leading-none mb-1">Meta Diária</p>
                  <p className="text-sm font-black text-indigo-600 tracking-tight">
                    {rendaDiariaNecessaria > 0 
                      ? `R$ ${rendaDiariaNecessaria.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      : 'Meta Batida! 🎉'}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Rodapé do Card */}
        <div className="flex justify-between mt-4 pt-4 border-t border-gray-50">
            <span className="text-[9px] font-black text-gray-400 uppercase">{progresso.toFixed(0)}% Coberto</span>
            <span className={`text-[9px] font-black uppercase ${rendaInsuficiente ? 'text-rose-500 animate-pulse' : 'text-emerald-500'}`}>
              {rendaInsuficiente 
                ? `Faltam R$ ${faltaRenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de Renda` 
                : 'Objetivo Concluído'}
            </span>
        </div>
      </div>
    </header>
  )
}