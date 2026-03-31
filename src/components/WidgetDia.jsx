import React, { useState } from 'react'
import { TrendingUp, TrendingDown, ChevronRight, Target, AlertCircle, Sparkles } from 'lucide-react'

const fmt = (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

export function WidgetDia({ saldo, totals, onVerDetalhes, isLoading }) {
  const [expanded, setExpanded] = useState(false)

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-4 animate-pulse">
        <div className="h-12 bg-gray-100 rounded-xl" />
      </div>
    )
  }

  const saldoHoje = (totals?.rendaHoje || 0) - (totals?.gastosHoje || 0)
  const positivo = saldoHoje >= 0

  // Garantir que saldoProjetado é um número e tratar sinal
  const saldoProjetadoValor = saldo?.saldoProjetado !== undefined && saldo?.saldoProjetado !== null 
    ? Number(saldo.saldoProjetado) 
    : null
  
  const isProjecaoNegativa = saldoProjetadoValor !== null && saldoProjetadoValor < 0
  const isProjecaoPositiva = saldoProjetadoValor !== null && saldoProjetadoValor > 0

  // Calcula meta diária para fechar o mês (quando está negativo)
  const getMetaDiaria = () => {
    if (!saldoProjetadoValor || !saldo?.diasRestantes) return null
    
    const deficit = Math.max(0, -saldoProjetadoValor)
    
    if (deficit > 0) {
      const metaPorDia = deficit / saldo.diasRestantes
      return { 
        tipo: 'deficit', 
        valor: metaPorDia, 
        total: deficit, 
        mensagem: `precisa de ${fmt(metaPorDia)}/dia` 
      }
    }
    
    if (saldoProjetadoValor > 0) {
      const sobraPorDia = saldoProjetadoValor / saldo.diasRestantes
      return { 
        tipo: 'superavit', 
        valor: sobraPorDia, 
        total: saldoProjetadoValor, 
        mensagem: `sobra ${fmt(sobraPorDia)}/dia` 
      }
    }
    
    return null
  }

  const metaDiaria = getMetaDiaria()

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between text-left active:bg-gray-50 transition-colors"
      >
        <div>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Saldo do dia</p>
          <p className={`text-2xl font-black ${positivo ? 'text-emerald-600' : 'text-rose-600'}`}>
            {positivo ? '+' : '-'}{fmt(Math.abs(saldoHoje))}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saldoProjetadoValor !== null && (
            <div className="text-right">
              <p className="text-[7px] font-black text-gray-400 uppercase">Até o final do mês</p>
              <p className={`text-xs font-black ${!isProjecaoNegativa ? 'text-emerald-600' : 'text-rose-600'}`}>
                {!isProjecaoNegativa ? '+' : '-'}{fmt(Math.abs(saldoProjetadoValor))}
              </p>
              {/* Meta diária (só aparece se tiver déficit) */}
              {metaDiaria && metaDiaria.tipo === 'deficit' && (
                <p className="text-[6px] font-black text-amber-500 mt-0.5">
                  {metaDiaria.mensagem}
                </p>
              )}
              {/* Sobra diária (opcional) */}
              {metaDiaria && metaDiaria.tipo === 'superavit' && (
                <p className="text-[6px] font-black text-emerald-500 mt-0.5">
                  {metaDiaria.mensagem}
                </p>
              )}
            </div>
          )}
          <ChevronRight size={16} className={`text-gray-300 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-50 p-4 space-y-3 animate-in slide-in-from-top-1 duration-200">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 rounded-xl p-3">
              <p className="text-[8px] font-black text-emerald-600 uppercase">Renda hoje</p>
              <p className="text-sm font-black text-emerald-700">{fmt(totals?.rendaHoje || 0)}</p>
            </div>
            <div className="bg-rose-50 rounded-xl p-3">
              <p className="text-[8px] font-black text-rose-600 uppercase">Gastos hoje</p>
              <p className="text-sm font-black text-rose-700">{fmt(totals?.gastosHoje || 0)}</p>
            </div>
          </div>

          {saldo && (
            <>
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex justify-between text-[8px] font-black text-gray-500 uppercase mb-1">
                  <span>Gasto médio/dia</span>
                  <span>{fmt(saldo.mediaDiariaGasto)}</span>
                </div>
                <div className="flex justify-between text-[8px] font-black text-gray-500 uppercase">
                  <span>Dias restantes</span>
                  <span>{saldo.diasRestantes}d</span>
                </div>
              </div>

              {/* Meta diária expandida (apenas déficit) */}
              {metaDiaria && metaDiaria.tipo === 'deficit' && (
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Target size={12} className="text-amber-600" />
                    <p className="text-[8px] font-black text-amber-700 uppercase">Meta diária</p>
                  </div>
                  <p className="text-base font-black text-amber-700">{fmt(metaDiaria.valor)}/dia</p>
                  <p className="text-[7px] text-amber-600 mt-0.5">
                    Para evitar déficit de {fmt(metaDiaria.total)} no fim do mês
                  </p>
                </div>
              )}

              {/* Alerta de déficit */}
              {isProjecaoNegativa && (
                <div className="bg-rose-50 rounded-xl p-3 border border-rose-100">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle size={12} className="text-rose-600" />
                    <p className="text-[8px] font-black text-rose-700 uppercase">Alerta</p>
                  </div>
                  <p className="text-[9px] font-black text-rose-700">
                    Projeção negativa de {fmt(Math.abs(saldoProjetadoValor))}
                  </p>
                  {metaDiaria && (
                    <p className="text-[8px] text-rose-600 mt-1">
                      Você precisa ganhar {fmt(metaDiaria.valor)} por dia para zerar o déficit.
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {onVerDetalhes && (
            <button
              onClick={onVerDetalhes}
              className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase active:scale-95 transition-all"
            >
              Ver análise completa
            </button>
          )}
        </div>
      )}
    </div>
  )
}