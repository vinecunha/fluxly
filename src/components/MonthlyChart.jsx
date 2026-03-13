import React, { useMemo } from 'react'

export function MonthlyChart({ allTransactions }) {
  const months = useMemo(() => {
    const result = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const month = d.getMonth()
      const year = d.getFullYear()
      const label = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')

      let renda = 0
      let despesas = 0

      for (const t of allTransactions || []) {
        const tDate = new Date(t.data + 'T12:00:00')
        const pDate = t.data_pagamento ? new Date(t.data_pagamento) : null
        const inMonth =
          (tDate.getMonth() === month && tDate.getFullYear() === year) ||
          (pDate && pDate.getMonth() === month && pDate.getFullYear() === year)

        if (!inMonth) continue
        const v = Number(t.valor) || 0
        if (t.tipo === 'renda') renda += v
        else if (t.tipo !== 'reserva') despesas += v
      }

      result.push({ label, renda, despesas })
    }
    return result
  }, [allTransactions])

  const maxVal = Math.max(...months.flatMap(m => [m.renda, m.despesas]), 1)

  return (
    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-5 space-y-4">
      <h4 className="text-gray-500 font-bold text-[10px] uppercase tracking-[0.2em]">Evolução Mensal</h4>

      <div className="flex items-end justify-between gap-2 h-32">
        {months.map((m, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex items-end gap-0.5 h-24">
              <div
                className="flex-1 bg-emerald-400 rounded-t-md transition-all duration-700"
                style={{ height: `${(m.renda / maxVal) * 100}%`, minHeight: m.renda > 0 ? 4 : 0 }}
              />
              <div
                className="flex-1 bg-rose-400 rounded-t-md transition-all duration-700"
                style={{ height: `${(m.despesas / maxVal) * 100}%`, minHeight: m.despesas > 0 ? 4 : 0 }}
              />
            </div>
            <span className="text-[8px] font-black text-gray-400 uppercase">{m.label}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 pt-1">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
          <span className="text-[9px] font-bold text-gray-400 uppercase">Renda</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-rose-400" />
          <span className="text-[9px] font-bold text-gray-400 uppercase">Despesas</span>
        </div>
      </div>
    </div>
  )
}
