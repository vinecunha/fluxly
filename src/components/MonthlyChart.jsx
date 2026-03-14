import React, { useMemo, useState } from 'react'

const TAB_CONFIG = {
  gasto:        { label: 'Gastos',  barKey: 'despesas', color: 'bg-rose-400',    dimColor: 'bg-rose-100',    textColor: 'text-rose-500',    goal: 'below' },
  investimento: { label: 'Reserva', barKey: 'reserva',  color: 'bg-blue-400',  dimColor: 'bg-blue-100',  textColor: 'text-blue-500',  goal: 'above' },
  renda:        { label: 'Renda',   barKey: 'renda',    color: 'bg-emerald-400', dimColor: 'bg-emerald-100', textColor: 'text-emerald-500', goal: 'above' },
}

const LEGEND = [
  { id: 'gasto',        color: 'bg-rose-400',    label: 'Gastos'  },
  { id: 'investimento', color: 'bg-blue-400',  label: 'Reserva' },
  { id: 'renda',        color: 'bg-emerald-400', label: 'Renda'   },
]

export function MonthlyChart({ allTransactions, activeTab = null }) {
  const [localTab, setLocalTab] = useState(null)

  // Tab destacado: clique local tem prioridade, senão usa o da tela pai
  const highlighted = localTab ?? activeTab

  const { months, maxVal } = useMemo(() => {
    const result = []
    const now = new Date()

    for (let i = 5; i >= 0; i--) {
      const d     = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const month = d.getMonth()
      const year  = d.getFullYear()
      const label = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')

      let renda = 0, despesas = 0, reserva = 0

      for (const t of allTransactions || []) {
        const tDate = new Date(t.data + 'T12:00:00')
        const pDate = t.data_pagamento ? new Date(t.data_pagamento) : null
        const inMonth =
          (tDate.getMonth() === month && tDate.getFullYear() === year) ||
          (pDate && pDate.getMonth() === month && pDate.getFullYear() === year)

        if (!inMonth) continue
        const v = Number(t.valor) || 0
        if (t.tipo === 'renda')        renda    += v
        else if (t.tipo === 'reserva') reserva  += v
        else                           despesas += v
      }

      result.push({ label, renda, despesas, reserva })
    }

    const max = Math.max(...result.flatMap(m => [m.renda, m.despesas, m.reserva]), 1)
    return { months: result, maxVal: max }
  }, [allTransactions])

  // Média dos últimos 3 meses (excluindo o mês atual = last index)
  const goals = useMemo(() => {
    const past = months.slice(0, -1) // 5 meses anteriores
    const last3 = past.slice(-3)     // só os 3 mais recentes

    const avg = (key) => last3.length
      ? last3.reduce((s, m) => s + m[key], 0) / last3.length
      : 0

    return {
      gasto:        avg('despesas'),
      investimento: avg('reserva'),
      renda:        avg('renda'),
    }
  }, [months])

  const currentMonth = months[months.length - 1]

  const barHeight = (val) =>
    val > 0 ? `${Math.max((val / maxVal) * 100, 3)}%` : '2px'

  const goalY = (goalVal) =>
    `${100 - Math.min((goalVal / maxVal) * 100, 98)}%`

  const handleLegendClick = (id) =>
    setLocalTab(prev => prev === id ? null : id)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-gray-500 font-bold text-[10px] uppercase tracking-[0.2em]">Evolução Mensal</h4>
        {highlighted && (
          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg ${TAB_CONFIG[highlighted].textColor} bg-gray-50`}>
            destacando {TAB_CONFIG[highlighted].label}
          </span>
        )}
      </div>

      {/* Gráfico */}
      <div className="relative">
        <div className="flex items-end justify-between gap-2 h-32">
          {months.map((m, i) => {
            const isCurrentMonth = i === months.length - 1
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end gap-0.5 h-24 relative">

                  {/* Linhas de meta — só na coluna do mês atual */}
                  {isCurrentMonth && highlighted && goals[highlighted] > 0 && (() => {
                    const cfg = TAB_CONFIG[highlighted]
                    return (
                      <div
                        className="absolute left-0 right-0 flex items-center pointer-events-none z-10"
                        style={{ bottom: goalY(goals[highlighted]), top: 'auto', height: 0 }}
                      >
                        <div className={`w-full border-t-2 border-dashed ${
                          highlighted === 'gasto' ? 'border-rose-400' :
                          highlighted === 'investimento' ? 'border-blue-400' : 'border-emerald-400'
                        } opacity-70`} />
                      </div>
                    )
                  })()}

                  {/* Barra Gastos */}
                  <div
                    className={`flex-1 rounded-t transition-all duration-700 ${
                      !highlighted || highlighted === 'gasto'
                        ? 'bg-rose-400'
                        : 'bg-rose-100'
                    }`}
                    style={{ height: barHeight(m.despesas) }}
                  />

                  {/* Barra Reserva */}
                  <div
                    className={`flex-1 rounded-t transition-all duration-700 ${
                      !highlighted || highlighted === 'investimento'
                        ? 'bg-blue-400'
                        : 'bg-blue-100'
                    }`}
                    style={{ height: barHeight(m.reserva) }}
                  />

                  {/* Barra Renda */}
                  <div
                    className={`flex-1 rounded-t transition-all duration-700 ${
                      !highlighted || highlighted === 'renda'
                        ? 'bg-emerald-400'
                        : 'bg-emerald-100'
                    }`}
                    style={{ height: barHeight(m.renda) }}
                  />
                </div>

                <span className={`text-[8px] font-black uppercase ${
                  isCurrentMonth ? 'text-gray-600' : 'text-gray-300'
                }`}>
                  {m.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {highlighted && goals[highlighted] > 0 && currentMonth && (() => {
        const cfg     = TAB_CONFIG[highlighted]
        const current = currentMonth[cfg.barKey]
        const goal    = goals[highlighted]
        const isGood = cfg.goal === 'below' ? current <= goal : current >= goal
        const diff   = current - goal  // com sinal
        const pct    = goal > 0 ? Math.abs(diff / goal * 100).toFixed(0) : 0

        return (
          <div className={`rounded-xl px-3 py-2.5 flex items-center justify-between ${
            isGood ? 'bg-emerald-50 border border-emerald-100' : 'bg-rose-50 border border-rose-100'
          }`}>
            <div>
              <p className={`text-[9px] font-black uppercase tracking-wide ${isGood ? 'text-emerald-600' : 'text-rose-600'}`}>
                {cfg.label} — Meta {cfg.goal === 'below' ? '↓' : '↑'} {cfg.goal === 'below' ? 'abaixo de' : 'acima de'} R$ {goal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] font-black text-gray-700 mt-0.5">
                Atual: R$ {current.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className={`text-right flex-shrink-0 ml-3`}>
              <p className={`text-lg font-black ${isGood ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isGood ? '✓' : '✗'}
              </p>
              <p className={`text-[9px] font-black ${isGood ? 'text-emerald-500' : 'text-rose-500'}`}>
                {cfg.goal === 'below'
                  ? isGood
                    ? `${pct}% abaixo da meta ✓`
                    : `${pct}% acima da meta`
                  : isGood
                    ? `${pct}% acima da meta ✓`
                    : `${pct}% abaixo da meta`
                }
              </p>
            </div>
          </div>
        )
      })()}

      <div className="flex items-center gap-4 pt-1 flex-wrap">
        {LEGEND.map(({ id, color, label }) => (
          <button
            key={id}
            onClick={() => handleLegendClick(id)}
            className={`flex items-center gap-1.5 transition-opacity ${
              highlighted && highlighted !== id ? 'opacity-40' : 'opacity-100'
            }`}
          >
            <div className={`w-2.5 h-2.5 rounded ${color} ${
              highlighted === id ? 'ring-2 ring-offset-1 ring-gray-400' : ''
            }`} />
            <span className="text-[9px] font-bold text-gray-400 uppercase">{label}</span>
          </button>
        ))}
        {highlighted && (
          <button
            onClick={() => setLocalTab(null)}
            className="text-[9px] font-black text-gray-400 uppercase ml-auto"
          >
            limpar
          </button>
        )}
      </div>
    </div>
  )
}