import React, { useState, useMemo } from 'react'
import { TrendingUp, TrendingDown, PiggyBank, ArrowUpRight, ArrowDownLeft } from 'lucide-react'

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
  investimento: { color: 'text-blue-500',    bg: 'bg-blue-50',    bar: 'bg-blue-400',    label: 'Reserva', prefix: '',  Icon: PiggyBank    },
}

export function CalendarView({ transactions = [], activeTab = 'gasto', currentDate, onDaySelect, filteredCategory }) {
  const today    = new Date()
  const viewDate = currentDate instanceof Date ? currentDate : new Date()
  const year     = viewDate.getFullYear()
  const month    = viewDate.getMonth()
  const cfg      = TAB_CONFIG[activeTab] || TAB_CONFIG.gasto

  const [selectedDay, setSelectedDay] = useState(null)

  const dayMap = useMemo(() => {
    setSelectedDay(null)
    const map = {}

    const add = (refDate, t, v, isEntrada) => {
      if (!map[refDate]) map[refDate] = { entrada: 0, saida: 0, items: [] }
      if (isEntrada) map[refDate].entrada += v
      else           map[refDate].saida   += v
      map[refDate].items.push({ ...t, _isEntrada: isEntrada })
    }

    ;(transactions || []).forEach(t => {
      const refDate = t.data_pagamento
        ? new Date(t.data_pagamento).toLocaleDateString('en-CA')
        : t.data
      const [y, m] = refDate.split('-').map(Number)
      if (y !== year || m - 1 !== month) return

      const v = Math.abs(Number(t.valor)) || 0

      if (activeTab === 'renda' && t.tipo === 'renda') {
        add(refDate, t, v, true)
      } else if (activeTab === 'investimento' && t.tipo === 'reserva') {
        add(refDate, t, v, Number(t.valor) >= 0)
      } else if (activeTab === 'gasto' && t.tipo !== 'renda' && t.tipo !== 'reserva' && t.tipo !== 'pagamento_cartao' && t.pago) {
        add(refDate, t, v, false)
      }
      // Guardar categorias do dia para filtro
      if (map[refDate]) {
        if (!map[refDate].cats) map[refDate].cats = new Set()
        const cat = activeTab === 'renda'
          ? (t.subcategoria || t.descricao)
          : activeTab === 'investimento'
          ? (t.destino_reserva || 'Outros')
          : t.categoria
        if (cat) map[refDate].cats.add(cat)
      }
    })
    return map
  }, [transactions, year, month, activeTab])

  const isInvestimento = activeTab === 'investimento'

  const maxDay = useMemo(() => {
    const vals = Object.values(dayMap).map(d => isInvestimento ? Math.max(d.entrada, d.saida) : d.entrada + d.saida)
    return Math.max(...vals, 1)
  }, [dayMap, isInvestimento])

  // Resumo do mês
  const summary = useMemo(() => {
    const dias = Object.keys(dayMap)
    const diasComEntrada = dias.filter(d => dayMap[d].entrada > 0).length
    const diasComSaida   = dias.filter(d => dayMap[d].saida > 0).length
    const totalEntrada   = Object.values(dayMap).reduce((s, d) => s + d.entrada, 0)
    const totalSaida     = Object.values(dayMap).reduce((s, d) => s + d.saida, 0)
    return { diasComEntrada, diasComSaida, totalEntrada, totalSaida }
  }, [dayMap])

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
            {filteredCategory ? filteredCategory : cfg.label} — {MONTHS[month]} {year}
          </span>
        </div>

        {/* Resumo do mês */}
        <div className={`border-b border-gray-50 px-3 py-2.5 ${isInvestimento ? '' : ''}`}>
          {isInvestimento ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 6 }}>
              <div className="text-center">
                <p className="text-[8px] font-black text-gray-400 uppercase">Dias entrada</p>
                <p className="text-sm font-black text-emerald-600">{summary.diasComEntrada}</p>
              </div>
              <div className="text-center">
                <p className="text-[8px] font-black text-gray-400 uppercase">Total entrada</p>
                <p className="text-[11px] font-black text-emerald-600">{fmt(summary.totalEntrada)}</p>
              </div>
              <div className="text-center">
                <p className="text-[8px] font-black text-gray-400 uppercase">Dias saída</p>
                <p className="text-sm font-black text-rose-500">{summary.diasComSaida}</p>
              </div>
              <div className="text-center">
                <p className="text-[8px] font-black text-gray-400 uppercase">Total saída</p>
                <p className="text-[11px] font-black text-rose-500">{fmt(summary.totalSaida)}</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 6 }}>
              <div className="text-center">
                <p className="text-[8px] font-black text-gray-400 uppercase">
                  Dias com {activeTab === 'renda' ? 'renda' : 'gastos'}
                </p>
                <p className={`text-sm font-black ${cfg.color}`}>
                  {activeTab === 'renda' ? summary.diasComEntrada : summary.diasComSaida}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[8px] font-black text-gray-400 uppercase">Total do mês</p>
                <p className={`text-[11px] font-black ${cfg.color}`}>
                  {fmtFull(activeTab === 'renda' ? summary.totalEntrada : summary.totalSaida)}
                </p>
              </div>
            </div>
          )}
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

            const mainVal = data ? (isInvestimento ? data.entrada + data.saida : data.entrada + data.saida) : 0
            const pct     = data ? Math.max((mainVal / maxDay) * 100, 8) : 0

            const hasEntrada = data && data.entrada > 0
            const hasSaida   = data && data.saida > 0

            return (
              <button
                key={i}
                disabled={!isValid}
                onClick={() => {
                  if (!isValid) return
                  const next = selectedDay === dayNum ? null : dayNum
                  setSelectedDay(next)
                  if (onDaySelect) {
                    const key = next
                      ? `${year}-${String(month+1).padStart(2,'0')}-${String(next).padStart(2,'0')}`
                      : null
                    onDaySelect(key)
                  }
                }}
                style={{ minHeight: 60 }}
                className={`p-1 border-b border-r border-gray-50 flex flex-col items-center justify-start transition-all ${
                  !isValid ? 'bg-gray-50/30'
                  : isSelected ? cfg.bg
                  : filteredCategory && data?.cats?.has(filteredCategory) ? cfg.bg
                  : filteredCategory && data && !data.cats?.has(filteredCategory) ? 'opacity-20'
                  : filteredCategory && !data ? 'opacity-10'
                  : 'hover:bg-gray-50 active:bg-gray-100'
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
                        {isInvestimento ? (
                          <>
                            {hasEntrada && (
                              <div className="w-full bg-gray-100 rounded-full overflow-hidden" style={{ height: 2 }}>
                                <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.max((data.entrada / maxDay) * 100, 8)}%` }} />
                              </div>
                            )}
                            {hasSaida && (
                              <div className="w-full bg-gray-100 rounded-full overflow-hidden" style={{ height: 2 }}>
                                <div className="h-full rounded-full bg-rose-400" style={{ width: `${Math.max((data.saida / maxDay) * 100, 8)}%` }} />
                              </div>
                            )}
                            <span className="text-[7px] font-black w-full text-center block truncate text-blue-500">
                              {hasEntrada && hasSaida
                                ? `+${fmt(data.entrada)} -${fmt(data.saida)}`
                                : hasEntrada ? `+${fmt(data.entrada)}` : `-${fmt(data.saida)}`
                              }
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="w-full bg-gray-100 rounded-full overflow-hidden" style={{ height: 3 }}>
                              <div className={`h-full rounded-full ${cfg.bar}`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className={`text-[7px] font-black w-full text-center block truncate ${cfg.color}`}>
                              {fmt(data.entrada + data.saida)}
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}
              </button>
            )
          })}
        </div>

        {isInvestimento && (
          <div className="flex items-center justify-center gap-4 px-4 py-2 border-t border-gray-50">
            <div className="flex items-center gap-1">
              <ArrowUpRight size={10} className="text-emerald-500" />
              <span className="text-[8px] font-bold text-gray-400 uppercase">Entrada</span>
              <div className="w-2 h-2 rounded-full bg-emerald-400 ml-0.5" />
            </div>
            <div className="flex items-center gap-1">
              <ArrowDownLeft size={10} className="text-rose-500" />
              <span className="text-[8px] font-bold text-gray-400 uppercase">Saída</span>
              <div className="w-2 h-2 rounded-full bg-rose-400 ml-0.5" />
            </div>
          </div>
        )}
      </div>

      {selectedData && selectedDay && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {String(selectedDay).padStart(2,'0')}/{String(month+1).padStart(2,'0')}/{year}
            </p>
            {isInvestimento ? (
              <div className="flex items-center gap-3">
                {selectedData.entrada > 0 && (
                  <p className="text-sm font-black text-emerald-600">+{fmtFull(selectedData.entrada)}</p>
                )}
                {selectedData.saida > 0 && (
                  <p className="text-sm font-black text-rose-500">-{fmtFull(selectedData.saida)}</p>
                )}
              </div>
            ) : (
              <p className={`text-sm font-black ${cfg.color}`}>
                {cfg.prefix} {fmtFull(selectedData.entrada + selectedData.saida)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            {selectedData.items
              .sort((a, b) => Math.abs(Number(b.valor)) - Math.abs(Number(a.valor)))
              .map(t => {
                const v       = Math.abs(Number(t.valor))
                const total   = selectedData.entrada + selectedData.saida
                const pctItem = total > 0 ? (v / total) * 100 : 0
                const isEnt   = t._isEntrada
                const itemColor = isInvestimento
                  ? (isEnt ? 'text-emerald-600' : 'text-rose-500')
                  : cfg.color
                const itemPrefix = isInvestimento ? (isEnt ? '+' : '-') : cfg.prefix
                const barColor  = isInvestimento
                  ? (isEnt ? 'bg-emerald-400' : 'bg-rose-400')
                  : cfg.bar

                return (
                  <div key={t.id} className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-700 truncate">{t.descricao}</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">
                          {isInvestimento && (
                            <span className={`mr-1 ${itemColor}`}>{isEnt ? '↑ entrada' : '↓ saída'}</span>
                          )}
                          {t.categoria || t.tipo}
                        </p>
                      </div>
                      <div className="flex-shrink-0 ml-3 text-right">
                        <p className={`text-xs font-black ${itemColor}`}>{itemPrefix} {fmtFull(v)}</p>
                        <p className="text-[9px] text-gray-300 font-bold">{pctItem.toFixed(0)}%</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full overflow-hidden" style={{ height: 2 }}>
                      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pctItem}%` }} />
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