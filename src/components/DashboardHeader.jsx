import React from 'react'
import { ChevronLeft, ChevronRight, LogOut, CheckCircle2, AlertCircle } from 'lucide-react'

export const DashboardHeader = ({ renda, totalDespesas, despesasPagas, currentDate, onMonthChange, onLogout }) => {
  // Progresso baseado no quanto da renda já cobre o total de gastos do mês
  const progresso = totalDespesas > 0 ? Math.min((renda / totalDespesas) * 100, 100) : 0
  const isCoberto = renda >= totalDespesas && totalDespesas > 0
  
  // Cálculo do que falta pagar dentro do alvo
  const despesasPendentes = totalDespesas - despesasPagas

  const formatMonth = () => {
    return currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }

  return (
    <header className="bg-indigo-600 p-6 rounded-b-[2.5rem] shadow-xl lg:max-w-4xl lg:mx-auto">
      {/* Top Bar */}
      <div className="flex justify-between items-center text-white mb-6">
        <span className="font-black text-2xl tracking-tight">Fluxly</span>
        <button 
          onClick={onLogout} 
          className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
        >
          <LogOut size={18} />
        </button>
      </div>

      {/* Seletor de Mês */}
      <div className="flex items-center justify-between mb-6 bg-indigo-700/50 rounded-2xl p-2 border border-indigo-400/20">
        <button onClick={() => onMonthChange(-1)} className="p-2 text-indigo-100 hover:text-white">
          <ChevronLeft size={20} />
        </button>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">{formatMonth()}</h3>
        <button onClick={() => onMonthChange(1)} className="p-2 text-indigo-100 hover:text-white">
          <ChevronRight size={20} />
        </button>
      </div>
      
      {/* Main Card */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-indigo-100">
        <div className="flex justify-between items-start mb-1">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Cobertura de Gastos</p>
          {isCoberto && (
            <span className="bg-emerald-100 text-emerald-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Mês Garantido</span>
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
            <span className="text-sm font-black text-rose-500">
              R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Alvo Acumulado</p>
          </div>
        </div>

        {/* Barra de Progresso Principal (Renda vs Alvo) */}
        <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden relative mb-4">
          <div 
            className={`h-full transition-all duration-1000 ease-out ${isCoberto ? 'bg-emerald-500' : 'bg-indigo-500'}`}
            style={{ width: `${progresso}%` }}
          />
        </div>

        {/* Sub-status: Detalhamento das Despesas (O que já foi pago do Alvo) */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
              <CheckCircle2 size={12} />
            </div>
            <div>
              <p className="text-[8px] font-black text-gray-400 uppercase leading-none mb-1">Já Pago</p>
              <p className="text-xs font-black text-gray-700">R$ {despesasPagas.toLocaleString('pt-BR')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-rose-50 rounded-lg text-rose-600">
              <AlertCircle size={12} />
            </div>
            <div>
              <p className="text-[8px] font-black text-gray-400 uppercase leading-none mb-1">Pendente</p>
              <p className="text-xs font-black text-gray-700">R$ {despesasPendentes.toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-4">
           <span className="text-[9px] font-black text-gray-400 uppercase">{progresso.toFixed(0)}% das contas cobertas</span>
           <span className={`text-[9px] font-black uppercase ${renda < totalDespesas ? 'text-rose-400' : 'text-emerald-500'}`}>
             {renda < totalDespesas 
               ? `Faltam R$ ${(totalDespesas - renda).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de Renda` 
               : 'Renda Superior ao Alvo!'}
           </span>
        </div>
      </div>
    </header>
  )
}