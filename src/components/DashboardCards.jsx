import React from 'react'
import { TrendingUp, TrendingDown, PiggyBank, Wallet, ArrowUpRight, ArrowDownRight, CircleDollarSign, Info } from 'lucide-react'
import { WidgetDia } from './WidgetDia'

const fmt = (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

export function DashboardCards({ renda, gastos, reserva, saldoProjetado, saldoAtual, saldo, totals, onVerDetalhes, isLoading }) {
  // Calcula o percentual de gasto em relação à renda
  const percentualGasto = renda > 0 ? (gastos / renda) * 100 : 0
  const estaNoLimite = percentualGasto <= 80
  const estaCritico = percentualGasto >= 100

  // Verifica se tem reserva
  const temReserva = reserva > 0

  return (
    <div className="space-y-4 mt-12">
      {/* Card principal - Balanço */}
      <div className={`rounded-2xl p-5 ${
        saldoAtual >= 0 ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : 'bg-gradient-to-br from-rose-500 to-rose-600'
      } text-white`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Balanço Mensal</span>
          <Wallet size={18} className="opacity-80" />
        </div>
        <p className="text-3xl font-black">{fmt(Math.abs(saldoAtual) < 0.01 ? 0 : saldoAtual)}</p>
        <div className="flex items-center gap-2 mt-2">
          {saldoAtual >= 0 ? (
            <>
              <ArrowUpRight size={14} />
              <span className="text-[9px] font-bold opacity-80">Disponível para gastar</span>
            </>
          ) : (
            <>
              <ArrowDownRight size={14} />
              <span className="text-[9px] font-bold opacity-80">Você está no vermelho</span>
            </>
          )}
        </div>

        {/* Explicação quando negativo */}
        {saldoAtual < 0 && (
          <div className="mt-4 pt-3 border-t border-white/20 text-[9px] font-bold opacity-90 space-y-1">
            <div className="flex items-center gap-1.5">
              <Info size={10} />
              <span>Por que está negativo?</span>
            </div>
            <p className="leading-relaxed opacity-80">
              Você pagou <span className="font-black">R$ {fmt(Math.abs(saldoAtual))}</span> a mais do que entrou.
              Isso pode ser por gastos extras, compras parceladas ou uso do cartão de crédito.
            </p>
            <p className="text-[8px] opacity-60 mt-1">
              💡 Dica: Revise seus gastos pendentes na aba <span className="font-black">"Contas"</span>
            </p>
          </div>
        )}
      </div>

      {/* Widget do Dia - Entre o Balanço e os 3 cards */}
      <WidgetDia
        saldo={saldo}
        totals={totals}
        onVerDetalhes={onVerDetalhes}
        isLoading={isLoading}
      />

      {/* Cards principais - 3 colunas (Renda, Gastos, Projeção) */}
      <div className="grid grid-cols-3 gap-3">
        {/* Renda */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
              <TrendingUp size={14} className="text-emerald-600" />
            </div>
            <span className="text-[9px] font-black text-gray-400 uppercase">Renda</span>
          </div>
          <p className="text-lg font-black text-gray-800">{fmt(renda)}</p>
          <p className="text-[8px] text-gray-400 mt-1">Total do mês</p>
        </div>

        {/* Gastos */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center">
              <TrendingDown size={14} className="text-rose-600" />
            </div>
            <span className="text-[9px] font-black text-gray-400 uppercase">Gastos</span>
          </div>
          <p className="text-lg font-black text-gray-800">{fmt(gastos)}</p>
          <div className="mt-1">
            <div className="flex items-center justify-between text-[8px] font-black">
              <span className="text-gray-400">{percentualGasto.toFixed(0)}% da renda</span>
              {estaCritico ? (
                <span className="text-rose-500">⚠️ Crítico</span>
              ) : estaNoLimite ? (
                <span className="text-emerald-500">✓ Saudável</span>
              ) : (
                <span className="text-amber-500">⚠️ Atenção</span>
              )}
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full mt-1 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  estaCritico ? 'bg-rose-500' : estaNoLimite ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(percentualGasto, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Projeção */}
        {saldoProjetado !== null && (
          <div className={`rounded-2xl p-4 border shadow-sm ${
            saldoProjetado >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                saldoProjetado >= 0 ? 'bg-emerald-100' : 'bg-amber-100'
              }`}>
                <CircleDollarSign size={14} className={saldoProjetado >= 0 ? 'text-emerald-600' : 'text-amber-600'} />
              </div>
              <span className="text-[9px] font-black text-gray-500 uppercase">Projeção</span>
            </div>
            <p className={`text-lg font-black ${saldoProjetado >= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
              {saldoProjetado >= 0 ? '+' : ''}{fmt(Math.abs(saldoProjetado))}
            </p>
            <p className="text-[8px] text-gray-500 mt-1">
              {saldoProjetado >= 0 ? 'Saldo esperado' : 'Déficit previsto'}
            </p>
          </div>
        )}
      </div>

      {/* Card de Reserva (apenas se tiver) */}
      {temReserva && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
              <PiggyBank size={14} className="text-blue-600" />
            </div>
            <span className="text-[9px] font-black text-gray-400 uppercase">Reserva</span>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-black text-blue-600">{fmt(reserva)}</p>
            <p className="text-[8px] text-gray-400">Guardado</p>
          </div>
          <p className="text-[8px] text-gray-400 mt-2">
            💰 Esse valor está reservado para emergências ou objetivos futuros
          </p>
        </div>
      )}
    </div>
  )
}