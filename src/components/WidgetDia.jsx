import React, { useState } from 'react'
import { TrendingUp, TrendingDown, ChevronRight, Sun, Moon, Sunset, Minus } from 'lucide-react'

const fmt  = (v) => Math.abs(Number(v)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
const fmtK = (v) => {
  const a = Math.abs(Number(v)||0)
  if (a >= 1000) return `R$${(a/1000).toFixed(1)}k`
  return `R$${a.toLocaleString('pt-BR',{minimumFractionDigits:0})}`
}

const getSaudacao = () => {
  const h = new Date().getHours()
  if (h < 12) return { texto:'Bom dia',   Icon:Sun,     cor:'#f59e0b' }
  if (h < 18) return { texto:'Boa tarde', Icon:Sunset, cor:'#f97316' }
  return         { texto:'Boa noite',  Icon:Moon,    cor:'#6366f1' }
}

const FILTERS  = ['hoje','semana','mes']
const F_LABELS = { hoje:'Hoje', semana:'Semana', mes:'Mês' }

/**
 * WidgetDia — substitui os dois StatCards + adiciona saldo projetado
 *
 * Props:
 * saldo         — resultado do useSaldoProjetado
 * totals        — resultado do useTotals (renda/gastos hoje/semana/mês)
 * userName
 * onVerDetalhes
 * isLoading
 */
export const WidgetDia = ({ saldo, totals, userName, onVerDetalhes, isLoading }) => {
  const [filter,   setFilter]   = useState('hoje')
  const [expanded, setExpanded] = useState(false)

  const { texto, Icon, cor } = getSaudacao()

  const cycleFilter = (e) => {
    e.stopPropagation()
    setFilter(f => FILTERS[(FILTERS.indexOf(f)+1) % FILTERS.length])
  }

  if (isLoading) {
    return (
      <div className="px-4 pt-3">
        <div className="max-w-2xl mx-auto bg-white  rounded-2xl shadow-sm border border-gray-100  p-4 animate-pulse">
          <div className="h-4 w-32 bg-gray-100  rounded mb-3"/>
          <div className="grid grid-cols-2 gap-2">
            <div className="h-14 bg-gray-50  rounded-xl"/>
            <div className="h-14 bg-gray-50  rounded-xl"/>
          </div>
        </div>
      </div>
    )
  }

  // Valores por período
  const renda  = filter==='hoje' ? (totals?.rendaHoje   ||0)
               : filter==='semana' ? (totals?.rendaSemana||0)
               : (totals?.renda   ||0)
  const gastos = filter==='hoje' ? (totals?.gastosHoje   ||0)
               : filter==='semana' ? (totals?.gastosSemana||0)
               : (totals?.gastosTotal||0)
  const saldoDia   = renda - gastos
  const positivo   = saldoDia >= 0

  const {
    saldoProjetado, saldoAtual,
    pendentesSaida, faturasPendentes,
    mediaDiariaGasto, diasRestantes,
    isCurrentMonth,
  } = saldo || {}

  const corProj = (saldoProjetado??0) > 0 ? '#10b981'
                : (saldoProjetado??0) > -500 ? '#f59e0b'
                : '#ef4444'

  const IconTrend = saldoDia > 0 ? TrendingUp : saldoDia < 0 ? TrendingDown : Minus

  return (
    <div className="px-4  pt-3">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white  rounded-2xl shadow-sm border border-gray-100  overflow-hidden">

          {/* ── Cabeçalho clicável ── */}
          <div
            onClick={() => setExpanded(e=>!e)}
            className="w-full p-4 flex items-center gap-3 text-left active:bg-gray-50 transition-colors cursor-pointer"
          >
            {/* Saudação */}
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: cor+'18' }}>
              <Icon size={16} style={{ color: cor }}/>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400  leading-none">
                  {texto}
                </p>
                {/* filtro pill — cicla hoje/semana/mês */}
                <button onClick={cycleFilter}
                  className="text-[7px] font-black px-1.5 py-0.5 rounded-full bg-slate-900  text-white uppercase flex-shrink-0 transition-all active:scale-95"
                  style={{ minHeight:18 }}>
                  {F_LABELS[filter]}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-base font-black ${positivo?'text-emerald-600':'text-rose-600'}`}>
                  {positivo?'+':'-'}{fmt(saldoDia)}
                </span>
                <IconTrend size={12} className={positivo?'text-emerald-500':'text-rose-500'}/>
              </div>
            </div>

            {/* Projetado */}
            {isCurrentMonth && saldoProjetado!=null && (
              <div className="flex-shrink-0 text-right">
                <p className="text-[8px] font-black uppercase text-gray-400  leading-none mb-0.5">projetado</p>
                <p className="text-sm font-black" style={{ color:corProj }}>
                  {(saldoProjetado>=0?'+':'')}{fmtK(saldoProjetado)}
                </p>
              </div>
            )}
  
            <ChevronRight size={14} className={`text-gray-300 flex-shrink-0 transition-transform duration-200 ${expanded?'rotate-90':''}`}/>
          </div>

          {/* ── Grid renda/gastos ── */}
          <div className="grid grid-cols-2 gap-2 px-4 pb-4">
            <div className="bg-emerald-50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp size={11} className="text-emerald-600"/>
                <p className="text-[8px] font-black uppercase text-emerald-600 leading-none">Renda</p>
              </div>
              <p className="text-[15px] font-black text-emerald-700 leading-tight">
                <span className="text-[9px] opacity-60 mr-0.5">R$</span>
                {Number(renda).toLocaleString('pt-BR',{minimumFractionDigits:2})}
              </p>
            </div>
            <div className="bg-rose-50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingDown size={11} className="text-rose-600"/>
                <p className="text-[8px] font-black uppercase text-rose-600 leading-none">Despesas</p>
              </div>
              <p className="text-[15px] font-black text-rose-700 leading-tight">
                <span className="text-[9px] opacity-60 mr-0.5">R$</span>
                {Number(gastos).toLocaleString('pt-BR',{minimumFractionDigits:2})}
              </p>
            </div>
          </div>

          {/* ── Expandido: projeção ── */}
          {expanded && (
            <div className="border-t border-gray-50  px-4 pb-4 pt-3 animate-in slide-in-from-top-1 duration-200">

              {isCurrentMonth && saldo && (
                <>
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-400  mb-3">Projeção do mês</p>

                  <div className="space-y-0 mb-3">
                    {[
                      { label:'Saldo atual',       val:saldoAtual,       cor: (saldoAtual??0)>=0?'text-emerald-600':'text-rose-600', prefix:true },
                      pendentesSaida>0 && { label:'Pendentes a pagar', val:-pendentesSaida,  cor:'text-amber-600',  prefix:true },
                      faturasPendentes>0 && { label:'Faturas pendentes', val:-faturasPendentes,cor:'text-indigo-600', prefix:true },
                      { label:'Saldo projetado',   val:saldoProjetado,   cor: (saldoProjetado??0)>=0?'text-emerald-700':'text-rose-700', prefix:true, bold:true },
                    ].filter(Boolean).map((row,i,arr) => (
                      <div key={i} className={`flex items-center justify-between py-2 ${i<arr.length-1?'border-b border-gray-50 ':''}`}>
                        <span className={`text-[11px] ${row.bold?'font-black text-gray-700 ':'font-bold text-gray-500 '}`}>{row.label}</span>
                        <span className={`text-[11px] font-black ${row.cor}`}>
                          {row.prefix && (row.val>=0?'+':'-')}{fmt(row.val)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Média + dias */}
                  <div className="bg-gray-50  rounded-xl p-3 flex justify-between mb-3">
                    <div>
                      <p className="text-[8px] font-black uppercase text-gray-400 ">Gasto médio/dia</p>
                      <p className="text-sm font-black text-gray-700 ">{fmt(mediaDiariaGasto)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-black uppercase text-gray-400 ">Dias restantes</p>
                      <p className="text-sm font-black text-gray-700 ">{diasRestantes}d</p>
                    </div>
                  </div>

                  {/* Alertas */}
                  {(saldoProjetado??0) < 0 && (
                    <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 mb-3">
                      <p className="text-[10px] font-black text-rose-700">
                        ⚠️ Projeção negativa de {fmt(Math.abs(saldoProjetado))} — revise seus gastos pendentes.
                      </p>
                    </div>
                  )}
                  {(saldoProjetado??0) >= 0 && (saldoProjetado??0) < 500 && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-3">
                      <p className="text-[10px] font-black text-amber-700">
                        ⚡ Margem apertada — você vai fechar o mês com {fmt(saldoProjetado)}.
                      </p>
                    </div>
                  )}
                </>
              )}

              {onVerDetalhes && (
                <button onClick={e=>{e.stopPropagation();onVerDetalhes()}}
                  className="w-full py-3 rounded-xl bg-gray-900 text-white text-[11px] font-black uppercase tracking-wider active:scale-95 transition-all">
                  Ver análise completa
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}