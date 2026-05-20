import React, { useMemo } from 'react'
import { BarChart3 } from 'lucide-react'
import { TAB_CONFIG, fmt, fmtFull } from './constants'

function MonthlyOverview({ allTransactions, activeTab, currentDate, periodType }) {
  const cfg = TAB_CONFIG[activeTab] || TAB_CONFIG.gasto

  const months = useMemo(() => {
    const ref = currentDate instanceof Date ? currentDate : new Date()
    const numMonths = 12
    const result = []

    for (let i = numMonths - 1; i >= 0; i--) {
      const d = new Date(ref.getFullYear(), ref.getMonth() - i, 1)
      const m = d.getMonth()
      const y = d.getFullYear()
      const label = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase()

      const txs = (allTransactions || []).filter(t => {
        const td = new Date(t.data + 'T12:00:00')
        const pd = t.data_pagamento ? new Date(t.data_pagamento) : null
        return (td.getMonth() === m && td.getFullYear() === y) ||
               (pd && pd.getMonth() === m && pd.getFullYear() === y)
      })

      let valor = 0
      if (activeTab === 'renda') {
        valor = txs.filter(t => t.tipo === 'renda').reduce((s, t) => s + (parseFloat(t.valor) || 0), 0)
      } else if (activeTab === 'investimento') {
        valor = txs.filter(t => t.tipo === 'reserva' && Number(t.valor) >= 0)
          .reduce((s, t) => s + (parseFloat(t.valor) || 0), 0)
      } else {
        valor = txs.filter(t => t.tipo !== 'renda' && t.tipo !== 'reserva' && t.tipo !== 'pagamento_cartao' && (t.tipo === 'gasto_diario' || t.pago))
          .reduce((s, t) => s + (parseFloat(t.valor) || 0), 0)
      }

      result.push({ label, valor, mes: m, ano: y })
    }
    return result
  }, [allTransactions, activeTab, currentDate])

  const maxVal = Math.max(...months.map(m => m.valor), 1)
  const total = months.reduce((s, m) => s + m.valor, 0)
  const media = total / months.length

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mt-3">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 size={12} className="text-gray-400" />
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
            {periodType === '12months' ? 'Visão Mensal — 12 Meses' : 'Visão Mensal — Anual'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[7px] font-black text-gray-400 uppercase">Total</p>
            <p className={`text-[11px] font-black ${cfg.color}`}>{fmtFull(total)}</p>
          </div>
          <div className="text-right">
            <p className="text-[7px] font-black text-gray-400 uppercase">Média</p>
            <p className="text-[11px] font-black text-gray-600">{fmtFull(media)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {months.map((m, i) => {
          const pct = maxVal > 0 ? (m.valor / maxVal) * 100 : 0
          const isCurrent = m.mes === currentDate.getMonth() && m.ano === currentDate.getFullYear()

          return (
            <div
              key={i}
              className={`rounded-xl p-3 transition-all ${isCurrent ? cfg.bg + ' ring-1 ring-black/5' : 'bg-gray-50'}`}
            >
              <p className={`text-[8px] font-black ${isCurrent ? cfg.color : 'text-gray-500'} uppercase mb-1`}>
                {m.label}
                {isCurrent && ' ←'}
              </p>
              <div className="h-16 flex items-end mb-1">
                <div
                  className={`w-full rounded-t-md transition-all duration-500 ${cfg.bar} ${isCurrent ? 'opacity-100' : 'opacity-60'}`}
                  style={{
                    height: `${Math.max(pct, m.valor > 0 ? 6 : 0)}%`,
                  }}
                />
              </div>
              <p className={`text-[9px] font-black ${m.valor > 0 ? 'text-gray-800' : 'text-gray-400'}`}>
                {m.valor > 0 ? fmt(m.valor) : '—'}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MonthlyOverview
