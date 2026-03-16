import React, { useState, useMemo } from 'react'
import { TrendingUp, TrendingDown, PiggyBank } from 'lucide-react'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS   = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const fmt = (v) => {
  if (v >= 1000) return `R$${(v/1000).toFixed(1)}k`
  return `R$${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

const fmtFull = (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const TAB_CONFIG = {
  gasto:        { color: 'text-rose-500',    bg: 'bg-rose-50',    bar: 'bg-rose-400',    label: 'Gastos',  prefix: '-', Icon: TrendingDown },
  renda:        { color: 'text-emerald-600', bg: 'bg-emerald-50', bar: 'bg-emerald-400', label: 'Renda',   prefix: '+', Icon: TrendingUp   },
  investimento: { color: 'text-blue-500',    bg: 'bg-blue-50',    bar: 'bg-blue-400',    label: 'Reserva', prefix: '+', Icon: PiggyBank    },
}

export function CalendarView({ transactions = [], activeTab = 'gasto', currentDate }) {
  const today     = new Date()
  const viewDate  = currentDate instanceof Date ? currentDate : new Date()
  const year      = viewDate.getFullYear()
  const month     = viewDate.getMonth()
  const cfg       = TAB_CONFIG[activeTab] || TAB_CONFIG.gasto

  const [selectedDay, setSelectedDay] = useState(null)

  const dayMap = useMemo(() => {
    setSelectedDay(null)
    const map = {}
    ;(transactions || []).forEach(t => {
      const refDate = t.data_pagamento
        ? new Date(t.data_pagamento).toLocaleDateString('en-CA')
        : t.data

      const [y, m] = refDate.split('-').map(Number)
      if (y !== year || m - 1 !== month) return

      const v = Math.abs(Number(t.valor)) || 0
      let belongs = false

      if (activeTab === 'renda'        && t.tipo === 'renda')                                                              belongs = true
      if (activeTab === 'investimento' && t.tipo === 'reserva' && Number(t.valor) >= 0)                                   belongs = true
      if (activeTab === 'gasto'        && t.tipo !== 'renda' && t.tipo !== 'reserva' && t.tipo !== 'pagamento_cartao' && t.pago) belongs = true

      if (!belongs) return

      if (!map[refDate]) map[refDate] = { total: 0, items: [] }
      map[refDate].total += v
      map[refDate].items.push(t)
    })
    return map
  }, [transactions, year, month, activeTab])

  const maxDay = useMemo(() =>
    Math.max(...Object.values(dayMap).map(d => d.total), 1),
    [dayMap]
  )

  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const totalCells  = Math.ceil((firstDay + daysInMonth) / 7) * 7

  const selectedKey  = selectedDay
    ? `${year}-${String(month + 1).padStart(2,'0')}-${String(selectedDay).padStart(2,'0')}`
    : null
  const selectedData = selectedKey ? dayMap[selectedKey] : null

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">

        <div className={`flex items-center justify-center gap-1.5 py-2.5 border-b border-gray-50 rounded-t-2xl ${cfg.bg}`}>
          <cfg.Icon size={11} className={cfg.color} />
          <span className={`text-[9px] font-black uppercase ${cfg.color}`}>
            {cfg.label} — {MONTHS[month]} {year}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }} className="border-b border-gray-50">
          {WEEKDAYS.map(d => (
            <div key={d} className="py-2 text-center text-[9px] font-black text-gray-400 uppercase">{d}</div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
          {Array.from({ length: totalCells }).map((_, i) => {
            const dayNum  = i - firstDay + 1
            const isValid = dayNum >= 1 && dayNum <= daysInMonth
            const dateKey = isValid
              ? `${year}-${String(month + 1).padStart(2,'0')}-${String(dayNum).padStart(2,'0')}`
              : null
            const data       = dateKey ? dayMap[dateKey] : null
            const isToday    = isValid && today.getDate() === dayNum && today.getMonth() === month && today.getFullYear() === year
            const isSelected = isValid && selectedDay === dayNum
            const pct        = data ? Math.max((data.total / maxDay) * 100, 8) : 0

            return (
              <button
                key={i}
                disabled={!isValid}
                onClick={() => isValid && setSelectedDay(prev => prev === dayNum ? null : dayNum)}
                style={{ minHeight: 56 }}
                className={`p-1 border-b border-r border-gray-50 flex flex-col items-center justify-start transition-colors ${
                  !isValid   ? 'bg-gray-50/30' :
                  isSelected ? cfg.bg           :
                  'hover:bg-gray-50 active:bg-gray-100'
                }`}
              >
                {isValid && (
                  <>
                    <span className={`text-[11px] font-black w-6 h-6 flex items-center justify-center rounded-full mb-0.5 flex-shrink-0 ${
                      isToday    ? 'bg-slate-900 text-white' :
                      isSelected ? cfg.color                 :
                      'text-gray-600'
                    }`}>
                      {dayNum}
                    </span>
                    {data && (
                      <div className="w-full px-0.5 space-y-0.5">
                        <div className="w-full bg-gray-100 rounded-full overflow-hidden" style={{ height: 3 }}>
                          <div className={`h-full rounded-full ${cfg.bar}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className={`text-[7px] font-black w-full text-center block truncate ${cfg.color}`}>
                          {fmt(data.total)}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {selectedData && selectedDay && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {String(selectedDay).padStart(2,'0')}/{String(month+1).padStart(2,'0')}/{year}
            </p>
            <p className={`text-sm font-black ${cfg.color}`}>
              {cfg.prefix} {fmtFull(selectedData.total)}
            </p>
          </div>

          <div className="space-y-2">
            {selectedData.items
              .sort((a, b) => Math.abs(Number(b.valor)) - Math.abs(Number(a.valor)))
              .map(t => {
                const v        = Math.abs(Number(t.valor))
                const pctItem  = selectedData.total > 0 ? (v / selectedData.total) * 100 : 0
                return (
                  <div key={t.id} className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-700 truncate">{t.descricao}</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">{t.categoria || t.tipo}</p>
                      </div>
                      <div className="flex-shrink-0 ml-3 text-right">
                        <p className={`text-xs font-black ${cfg.color}`}>{cfg.prefix} {fmtFull(v)}</p>
                        <p className="text-[9px] text-gray-300 font-bold">{pctItem.toFixed(0)}%</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full overflow-hidden" style={{ height: 2 }}>
                      <div className={`h-full rounded-full ${cfg.bar}`} style={{ width: `${pctItem}%` }} />
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}