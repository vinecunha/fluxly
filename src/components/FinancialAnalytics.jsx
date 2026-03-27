import React, { useState, useMemo, lazy, Suspense } from 'react'
import {
  TrendingDown, TrendingUp, Tag, ArrowLeft,
  DollarSign, PiggyBank, Building2, Wallet,
  ChevronRight, Zap
} from 'lucide-react'
import { categoryIcons } from '../lib/categories'
import { useMonthlyAverages } from '../hooks/useMonthlyAverages'
import { useCDI } from '../hooks/useCDI'
import { CalendarView } from './CalendarView'

const MonthlyChart = lazy(() =>
  import('./MonthlyChart').then(m => ({ default: m.MonthlyChart }))
)

const fmt  = (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtK = (v) => {
  if (Math.abs(v) >= 1000) return `R$${(v / 1000).toFixed(1)}k`
  return `R$${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`
}

const PALETTE = [
  '#1e293b','#3b82f6','#10b981','#f59e0b','#ef4444',
  '#8b5cf6','#ec4899','#06b6d4','#84cc16','#f97316',
  '#64748b','#a78bfa','#34d399','#fbbf24','#fb923c',
]

// ─── Donut SVG ────────────────────────────────────────────────────────────────
function DonutChart({ entries, total, activeIdx, onPress }) {
  const SIZE  = 200
  const CX    = SIZE / 2
  const CY    = SIZE / 2
  const R     = 78
  const INNER = 50
  const GAP   = 1.5

  const slices = useMemo(() => {
    if (!entries.length || total <= 0) return []
    let angle = -90
    return entries.map((e, i) => {
      const pct   = e.value / total
      const sweep = pct * 360
      const s     = { ...e, pct, sweep, start: angle, i }
      angle += sweep + (sweep > 3 ? GAP : 0)
      return s
    })
  }, [entries, total])

  const polar = (deg, r) => {
    const rad = (deg * Math.PI) / 180
    return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)]
  }

  const arc = (start, sweep, r, inner) => {
    if (sweep >= 359.9) {
      return `M${CX} ${CY-r} A${r} ${r} 0 1 1 ${CX-0.01} ${CY-r} Z M${CX} ${CY-inner} A${inner} ${inner} 0 1 0 ${CX-0.01} ${CY-inner} Z`
    }
    const adj  = Math.max(sweep - (sweep > 3 ? GAP : 0), 0.3)
    const [x1,y1] = polar(start, r)
    const [x2,y2] = polar(start + adj, r)
    const [x3,y3] = polar(start + adj, inner)
    const [x4,y4] = polar(start, inner)
    const lg = sweep > 180 ? 1 : 0
    return `M${x1} ${y1} A${r} ${r} 0 ${lg} 1 ${x2} ${y2} L${x3} ${y3} A${inner} ${inner} 0 ${lg} 0 ${x4} ${y4}Z`
  }

  const active = activeIdx !== null ? slices[activeIdx] : null

  return (
    <svg
      width="100%" viewBox={`0 0 ${SIZE} ${SIZE}`}
      style={{ maxWidth: 220, touchAction: 'manipulation' }}
    >
      {slices.map((s, i) => {
        const isActive = activeIdx === i
        return (
          <path
            key={i}
            d={arc(s.start, s.sweep, R, INNER)}
            fill={PALETTE[i % PALETTE.length]}
            opacity={activeIdx === null ? 1 : isActive ? 1 : 0.3}
            style={{
              transform: isActive ? `scale(1.04)` : 'scale(1)',
              transformOrigin: `${CX}px ${CY}px`,
              transition: 'all 0.18s ease',
              cursor: 'pointer',
            }}
            onMouseEnter={() => onPress(i)}
            onMouseLeave={() => onPress(null)}
            onClick={() => onPress(activeIdx === i ? null : i)}
            onTouchStart={(e) => { e.preventDefault(); onPress(activeIdx === i ? null : i) }}
          />
        )
      })}

      {/* Inner circle */}
      <circle cx={CX} cy={CY} r={INNER - 1} fill="white" />

      {/* Center text */}
      {active ? (
        <>
          <text x={CX} y={CY - 8} textAnchor="middle" fontSize="13" fontWeight="900" fill="#1e293b">
            {(active.pct * 100).toFixed(0)}%
          </text>
          <text x={CX} y={CY + 8} textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#94a3b8">
            {active.label.length > 11 ? active.label.slice(0, 10) + '…' : active.label}
          </text>
          <text x={CX} y={CY + 22} textAnchor="middle" fontSize="8" fontWeight="800" fill="#475569">
            {fmtK(active.value)}
          </text>
        </>
      ) : (
        <>
          <text x={CX} y={CY - 4} textAnchor="middle" fontSize="11" fontWeight="900" fill="#1e293b">
            {fmtK(total)}
          </text>
          <text x={CX} y={CY + 11} textAnchor="middle" fontSize="8" fontWeight="700" fill="#94a3b8">
            total
          </text>
        </>
      )}
    </svg>
  )
}

// ─── Pie Section ─────────────────────────────────────────────────────────────
function PieSection({ grouped, viewTotal, tab, selectedCategory, onCategorySelect }) {
  const [activeIdx, setActiveIdx]     = useState(null)
  const [expandedKey, setExpandedKey] = useState(null)

  const entries = useMemo(() =>
    Object.entries(grouped)
      .sort((a, b) => b[1].totalBruto - a[1].totalBruto)
      .map(([name, info], i) => ({
        label: name,
        value: info.totalBruto,
        color: PALETTE[i % PALETTE.length],
        items: info.items || [],
        subcategorias: info.subcategorias || null,
      })),
    [grouped]
  )

  if (entries.length === 0) return null

  const handleItemPress = (i) => {
    const key = entries[i].label
    setActiveIdx(prev => prev === i ? null : i)
    setExpandedKey(prev => prev === key ? null : key)
    onCategorySelect?.(key)
  }

  const fmt2 = (v) => `R$ ${Math.abs(Number(v)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-4 pt-4 pb-1">
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Distribuição</p>
      </div>

      <div className="flex justify-center px-8 py-2">
        <DonutChart
          entries={entries}
          total={viewTotal}
          activeIdx={activeIdx}
          onPress={(i) => i === null ? setActiveIdx(null) : handleItemPress(i)}
        />
      </div>

      <div className="px-4 pb-4 space-y-1">
        {entries.map((e, i) => {
          const catData    = tab === 'gasto' ? categoryIcons[e.label] : null
          const pct        = viewTotal > 0 ? (e.value / viewTotal) * 100 : 0
          const isActive   = activeIdx === i
          const isExpanded = expandedKey === e.label

          // itens a mostrar no sub-painel
          const subItems = e.subcategorias
            ? Object.entries(e.subcategorias)
                .sort((a, b) => b[1].totalBruto - a[1].totalBruto)
                .map(([subName, subData]) => ({ label: subName, value: subData.totalBruto, items: subData.items }))
            : e.items
                .reduce((acc, t) => {
                  const k = t.descricao || 'Outros'
                  const existing = acc.find(x => x.label === k)
                  if (existing) existing.value += Math.abs(Number(t.valor))
                  else acc.push({ label: k, value: Math.abs(Number(t.valor)), date: t.data })
                  return acc
                }, [])
                .sort((a, b) => b.value - a.value)

          return (
            <div key={e.label}>
              <button
                onClick={() => handleItemPress(i)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all active:scale-[0.98] ${
                  selectedCategory === e.label
                    ? 'bg-slate-50 ring-1 ring-slate-200'
                    : isActive ? 'bg-slate-50 ring-1 ring-slate-200' : 'hover:bg-gray-50'
                }`}
                style={{ minHeight: 44 }}
              >
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: e.color }} />

                {catData ? (
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${catData.color}`}>
                    {catData.icon}
                  </div>
                ) : (
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    tab === 'investimento' ? 'bg-blue-100 text-blue-600' :
                    tab === 'renda' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {tab === 'investimento' ? <Building2 size={12} /> :
                     tab === 'renda' ? <DollarSign size={12} /> : <Tag size={12} />}
                  </div>
                )}

                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[11px] font-bold text-gray-700 truncate leading-none">{e.label}</p>
                    <p className="text-[11px] font-black text-gray-900 ml-2 flex-shrink-0">{fmtK(e.value)}</p>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: e.color }} />
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className={`text-[9px] font-black w-6 text-right ${selectedCategory === e.label ? 'text-white/70' : 'text-gray-400'}`}>{pct.toFixed(0)}%</span>
                  <ChevronRight
                    size={13}
                    className={`text-gray-300 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                  />
                </div>
              </button>

              {/* Sub-painel inline */}
              {isExpanded && subItems.length > 0 && (
                <div className="ml-4 mt-0.5 mb-1 border-l-2 pl-3 space-y-0.5 animate-in slide-in-from-top-1 duration-200"
                  style={{ borderColor: e.color + '55' }}>
                  {subItems.slice(0, 8).map((sub, si) => {
                    const subPct = e.value > 0 ? (sub.value / e.value) * 100 : 0
                    return (
                      <div key={si} className="flex items-center gap-2 py-2 px-2 rounded-xl">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold text-gray-600 truncate">{sub.label}</p>
                            <p className="text-[10px] font-black text-gray-700 ml-2 flex-shrink-0">{fmt2(sub.value)}</p>
                          </div>
                          <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden mt-1">
                            <div className="h-full rounded-full" style={{ width: `${subPct}%`, backgroundColor: e.color + 'aa' }} />
                          </div>
                        </div>
                        <span className="text-[8px] font-black text-gray-300 w-5 text-right flex-shrink-0">
                          {subPct.toFixed(0)}%
                        </span>
                      </div>
                    )
                  })}
                  {subItems.length > 8 && (
                    <p className="text-[8px] text-gray-300 font-bold px-2 pb-1">
                      +{subItems.length - 8} itens
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}


// ─── Gráfico de barras mês a mês ─────────────────────────────────────────────
function BarChartMensal({ allTransactions, tab, currentDate }) {
  const meses = useMemo(() => {
    const result = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const m = d.getMonth()
      const y = d.getFullYear()
      const label = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.','').toUpperCase()

      const txs = (allTransactions || []).filter(t => {
        const td = new Date(t.data + 'T12:00:00')
        return td.getMonth() === m && td.getFullYear() === y
      })

      let valor = 0
      if (tab === 'renda') {
        valor = txs.filter(t => t.tipo === 'renda').reduce((s,t) => s + (parseFloat(t.valor)||0), 0)
      } else {
        valor = txs.filter(t => t.tipo !== 'renda' && t.tipo !== 'reserva' && t.tipo !== 'pagamento_cartao' && (t.tipo === 'gasto_diario' || t.pago))
                   .reduce((s,t) => s + (parseFloat(t.valor)||0), 0)
      }
      result.push({ label, valor, mes: m, ano: y })
    }
    return result
  }, [allTransactions, tab, currentDate])

  const max = Math.max(...meses.map(m => m.valor), 1)
  const cor = tab === 'renda' ? '#10b981' : '#ef4444'
  const corLight = tab === 'renda' ? '#d1fae5' : '#fee2e2'
  const isCurrentMes = (m) => m.mes === currentDate.getMonth() && m.ano === currentDate.getFullYear()

  const fmtBar = (v) => {
    if (v >= 1000) return `R$${(v/1000).toFixed(1)}k`
    return `R$${v.toLocaleString('pt-BR',{minimumFractionDigits:0})}`
  }

  // Variação mês a mês
  const ultimo   = meses[meses.length - 1]?.valor || 0
  const anterior = meses[meses.length - 2]?.valor || 0
  const delta    = anterior > 0 ? ((ultimo - anterior) / anterior) * 100 : 0

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
            Últimos 6 meses
          </p>
          <p className="text-sm font-black text-gray-800">
            {tab === 'renda' ? 'Evolução da Renda' : 'Evolução dos Gastos'}
          </p>
        </div>
        {Math.abs(delta) >= 1 && (
          <span className={`text-[10px] font-black px-2 py-1 rounded-full ${
            tab === 'renda'
              ? delta > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
              : delta > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
          }`}>
            {delta > 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(0)}% vs mês ant.
          </span>
        )}
      </div>

      {/* Barras */}
      <div className="flex items-end gap-2 h-28">
        {meses.map((m, i) => {
          const pct     = max > 0 ? (m.valor / max) * 100 : 0
          const isCur   = isCurrentMes(m)
          const prevVal = i > 0 ? meses[i-1].valor : null
          const diffPct = prevVal && prevVal > 0 ? ((m.valor - prevVal) / prevVal) * 100 : null

          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              {/* Valor no topo */}
              <p className="text-[8px] font-black text-gray-400 leading-none">
                {m.valor > 0 ? fmtBar(m.valor) : '—'}
              </p>
              {/* Barra */}
              <div className="w-full flex items-end" style={{ height: 72 }}>
                <div
                  className="w-full rounded-t-lg transition-all duration-700"
                  style={{
                    height: `${Math.max(pct, m.valor > 0 ? 4 : 0)}%`,
                    backgroundColor: isCur ? cor : corLight,
                    opacity: isCur ? 1 : 0.6,
                  }}
                />
              </div>
              {/* Label mês */}
              <p className={`text-[8px] font-black leading-none ${isCur ? 'text-gray-800' : 'text-gray-400'}`}>
                {m.label}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Ranking de categorias com delta vs mês anterior ─────────────────────────
function ComparativoCategoria({ allTransactions, tab, currentDate }) {
  const dados = useMemo(() => {
    const build = (mes, ano) => {
      const txs = (allTransactions || []).filter(t => {
        const td = new Date(t.data + 'T12:00:00')
        return td.getMonth() === mes && td.getFullYear() === ano
      })
      const filtradas = tab === 'renda'
        ? txs.filter(t => t.tipo === 'renda')
        : txs.filter(t => t.tipo !== 'renda' && t.tipo !== 'reserva' && t.tipo !== 'pagamento_cartao' && (t.tipo === 'gasto_diario' || t.pago))

      return filtradas.reduce((acc, t) => {
        const cat = (tab === 'renda' ? (t.subcategoria || t.descricao) : t.categoria) || 'Outros'
        acc[cat] = (acc[cat] || 0) + (parseFloat(t.valor) || 0)
        return acc
      }, {})
    }

    const mesAtual = currentDate.getMonth()
    const anoAtual = currentDate.getFullYear()
    const mesAnt   = mesAtual === 0 ? 11 : mesAtual - 1
    const anoAnt   = mesAtual === 0 ? anoAtual - 1 : anoAtual

    const atual    = build(mesAtual, anoAtual)
    const anterior = build(mesAnt, anoAnt)

    const todas = [...new Set([...Object.keys(atual), ...Object.keys(anterior)])]
    return todas
      .map(cat => ({
        cat,
        atual:    atual[cat] || 0,
        anterior: anterior[cat] || 0,
        delta:    anterior[cat] > 0
          ? ((( atual[cat]||0) - anterior[cat]) / anterior[cat]) * 100
          : atual[cat] > 0 ? 100 : 0,
      }))
      .filter(r => r.atual > 0 || r.anterior > 0)
      .sort((a, b) => b.atual - a.atual)
      .slice(0, 8)
  }, [allTransactions, tab, currentDate])

  const mesNome = (offset) => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1)
    return d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.','').toUpperCase()
  }

  const maxVal = Math.max(...dados.map(d => Math.max(d.atual, d.anterior)), 1)
  const corAtual = tab === 'renda' ? '#10b981' : '#ef4444'
  const corAnt   = tab === 'renda' ? '#d1fae5' : '#fee2e2'

  if (!dados.length) return null

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
            Comparativo por categoria
          </p>
          <p className="text-sm font-black text-gray-800">
            {mesNome(-1)} vs {mesNome(0)}
          </p>
        </div>
        {/* Legenda */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: corAnt }}/>
            <span className="text-[8px] font-black text-gray-400">{mesNome(-1)}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: corAtual }}/>
            <span className="text-[8px] font-black text-gray-400">{mesNome(0)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {dados.map((row, i) => (
          <div key={i}>
            {/* Label + delta */}
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black text-gray-700 truncate max-w-[55%]">
                {row.cat}
              </span>
              <div className="flex items-center gap-2">
                {Math.abs(row.delta) >= 1 && (
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                    tab === 'renda'
                      ? row.delta > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                      : row.delta > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {row.delta > 0 ? '↑' : '↓'}{Math.abs(row.delta).toFixed(0)}%
                  </span>
                )}
                <span className="text-[10px] font-black text-gray-500">
                  {row.atual >= 1000 ? `R$${(row.atual/1000).toFixed(1)}k` : `R$${row.atual.toFixed(0)}`}
                </span>
              </div>
            </div>
            {/* Barras duplas */}
            <div className="space-y-0.5">
              {/* Anterior */}
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#f3f4f6' }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${(row.anterior/maxVal)*100}%`, backgroundColor: corAnt, opacity:0.8 }}/>
              </div>
              {/* Atual */}
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#f3f4f6' }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${(row.atual/maxVal)*100}%`, backgroundColor: corAtual }}/>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function FinancialAnalytics({ transactions = [], allTransactions = [], currentDate }) {
  const [tab, setTab]                         = useState('gasto')
  const [expandedDestino, setExpandedDestino] = useState(null)
  const [expandedSubcat, setExpandedSubcat]   = useState(null)
  const [projectionDays, setProjectionDays]   = useState(0)
  const [selectedDate, setSelectedDate]       = useState(null) // 'YYYY-MM-DD' ou null
  const [selectedCategory, setSelectedCategory] = useState(null) // string ou null

  const { averageRenda, averageDespesas } = useMonthlyAverages(allTransactions, 3)
  const { taxaAnual: cdiReal } = useCDI()

  const calculateLiquidValue = (items, extraDays = 0) => {
    const taxaDiaria = Math.pow(1 + cdiReal, 1 / 252) - 1
    const hoje = new Date()
    return items.reduce((total, t) => {
      const valorOriginal = parseFloat(t.valor) || 0
      const dataTransacao = new Date(t.data + 'T12:00:00')
      const diasPassados  = Math.max(0, Math.floor((hoje - dataTransacao) / (1000 * 60 * 60 * 24)))
      const diasTotais    = diasPassados + extraDays
      if (diasTotais >= 30) {
        const diasUteis = Math.floor(diasTotais * 0.69)
        const bruto = valorOriginal * Math.pow(1 + taxaDiaria, diasUteis)
        const lucro = bruto - valorOriginal
        const ir    = lucro * 0.225
        return total + (bruto - ir)
      }
      return total + valorOriginal
    }, 0)
  }

  const filtered = useMemo(() => (transactions || []).filter(t => {
    // Filtro de tab
    let ok = false
    if (tab === 'renda')        ok = t.tipo === 'renda'
    else if (tab === 'investimento') ok = t.tipo === 'reserva'
    else ok = t.tipo !== 'renda' && t.tipo !== 'reserva' && (t.tipo === 'gasto_diario' || t.pago === true)
    if (!ok) return false
    // Filtro por dia
    if (selectedDate) {
      const ref = (t.data_pagamento
        ? new Date(t.data_pagamento).toLocaleDateString('en-CA')
        : t.data) || ''
      return ref === selectedDate
    }
    // Filtro por categoria
    if (selectedCategory) {
      const catField = tab === 'renda'
        ? (t.subcategoria || t.descricao)
        : tab === 'investimento'
        ? (t.destino_reserva || 'Outros')
        : t.categoria
      return catField === selectedCategory
    }
    return true
  }), [transactions, tab, selectedDate, selectedCategory])

  const grouped = useMemo(() => filtered.reduce((acc, t) => {
    const v = parseFloat(t.valor) || 0
    if (tab === 'investimento') {
      const dest = (t.destino_reserva || 'Outros').trim()
      const sub  = (t.subcategoria || t.descricao || 'Sem Nome').trim()
      if (!acc[dest]) acc[dest] = { totalBruto: 0, items: [], subcategorias: {} }
      if (!acc[dest].subcategorias[sub]) acc[dest].subcategorias[sub] = { totalBruto: 0, items: [] }
      acc[dest].totalBruto += v
      acc[dest].items.push(t)
      acc[dest].subcategorias[sub].totalBruto += v
      acc[dest].subcategorias[sub].items.push(t)
    } else {
      const key = tab === 'renda' ? (t.descricao || 'Outros').trim() : (t.categoria || 'Outros').trim()
      if (!acc[key]) acc[key] = { totalBruto: 0, items: [] }
      acc[key].totalBruto += v
      acc[key].items.push(t)
    }
    return acc
  }, {}), [filtered, tab])

  const viewTotal = useMemo(() => {
    if (tab === 'investimento') return calculateLiquidValue(filtered, projectionDays)
    return Object.values(grouped).reduce((s, d) => s + d.totalBruto, 0)
  }, [grouped, tab, filtered, projectionDays, cdiReal])

  const resetDrill = () => {
    setExpandedDestino(null); setExpandedSubcat(null)
    setProjectionDays(0); setSelectedDate(null); setSelectedCategory(null)
  }

  const handleDaySelect = (dateStr) => {
    setSelectedDate(dateStr)
    if (dateStr) setSelectedCategory(null) // limpa categoria ao filtrar por dia
  }

  const handleCategorySelect = (cat) => {
    setSelectedCategory(prev => prev === cat ? null : cat)
    if (cat) setSelectedDate(null) // limpa dia ao filtrar por categoria
  }

  // ── Drill: subcategoria ────────────────────────────────────────────────────
  if (expandedSubcat) {
    const items = tab === 'investimento'
      ? grouped[expandedDestino]?.subcategorias[expandedSubcat]?.items || []
      : grouped[expandedSubcat]?.items || []

    return (
      <section className="space-y-4 animate-in slide-in-from-right duration-300">
        <button onClick={() => setExpandedSubcat(null)}
          className="flex items-center gap-2 text-slate-600 font-black text-[10px] uppercase tracking-widest bg-white px-4 py-3 rounded-2xl border border-gray-100 shadow-sm active:scale-95 transition-all"
          style={{ minHeight: 44 }}>
          <ArrowLeft size={13} /> Voltar
        </button>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Detalhes</p>
            <p className="text-xl font-black text-gray-900">{expandedSubcat}</p>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
            tab === 'renda' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
          }`}>
            {tab === 'renda' ? <DollarSign size={20} /> : <Wallet size={20} />}
          </div>
        </div>
        <div className="space-y-2">
          {items.sort((a, b) => new Date(b.data) - new Date(a.data)).map((t, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center flex-shrink-0">
                  <Tag size={14} />
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-800">{t.descricao}</p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase">{t.data.split('-').reverse().join('/')}</p>
                </div>
              </div>
              <p className="text-sm font-black text-gray-900">{fmt(Math.abs(parseFloat(t.valor)))}</p>
            </div>
          ))}
        </div>
      </section>
    )
  }

  // ── Drill: destino reserva ─────────────────────────────────────────────────
  if (expandedDestino && tab === 'investimento') {
    const subs = Object.entries(grouped[expandedDestino]?.subcategorias || {})
    const liquidDestino = calculateLiquidValue(grouped[expandedDestino]?.items || [], projectionDays)
    return (
      <section className="space-y-4 animate-in slide-in-from-right duration-300">
        <button onClick={() => setExpandedDestino(null)}
          className="flex items-center gap-2 text-slate-600 font-black text-[10px] uppercase tracking-widest bg-white px-4 py-3 rounded-2xl border border-gray-100 shadow-sm active:scale-95 transition-all"
          style={{ minHeight: 44 }}>
          <ArrowLeft size={13} /> Voltar para Destinos
        </button>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-center">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Saldo Líquido em {expandedDestino}</p>
          <p className="text-3xl font-black text-blue-600">{fmt(liquidDestino)}</p>
        </div>
        <div className="space-y-2">
          {subs.sort((a, b) => b[1].totalBruto - a[1].totalBruto).map(([name, data]) => (
            <button key={name} onClick={() => setExpandedSubcat(name)}
              className="w-full bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center active:scale-[0.98] transition-all"
              style={{ minHeight: 56 }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0">
                  <PiggyBank size={16} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-700">{name}</p>
                  <p className="text-[9px] text-gray-400">{data.items.length} lançamento{data.items.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-black text-gray-900">{fmt(calculateLiquidValue(data.items, projectionDays))}</p>
                <ChevronRight size={14} className="text-gray-300" />
              </div>
            </button>
          ))}
        </div>
      </section>
    )
  }

  const avgTotal  = tab === 'renda' ? averageRenda : tab === 'gasto' ? averageDespesas : 0
  const trendDiff = (tab !== 'investimento' && avgTotal > 0) ? ((viewTotal - avgTotal) / avgTotal) * 100 : null

  return (
    <section className="space-y-4 animate-in fade-in duration-300">

      {/* Badges de filtro ativo */}
      {(selectedDate || selectedCategory) && (
        <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50 rounded-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-slate-700"/>
            <span className="text-[11px] font-black text-slate-700 uppercase tracking-wide">
              {selectedDate
                ? `Dia: ${new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { day:'2-digit', month:'short' })}`
                : `Cat: ${selectedCategory}`}
            </span>
          </div>
          <button
            onClick={() => { setSelectedDate(null); setSelectedCategory(null) }}
            className="text-[9px] font-black uppercase text-slate-500 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 active:scale-95 transition-all">
            Limpar ✕
          </button>
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex gap-1.5 p-1 bg-gray-100 rounded-2xl">
        {[
          { id: 'gasto',        label: 'Gastos',  Icon: TrendingDown, color: 'text-rose-600'    },
          { id: 'investimento', label: 'Reservas', Icon: PiggyBank,   color: 'text-blue-600'    },
          { id: 'renda',        label: 'Renda',    Icon: TrendingUp,  color: 'text-emerald-600' },
        ].map(({ id, label, Icon, color }) => (
          <button key={id}
            onClick={() => { setTab(id); resetDrill() }}
            style={{ minHeight: 44 }}
            className={`flex-1 py-2.5 rounded-2xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
              tab === id ? `bg-white shadow-sm ${color}` : 'text-gray-400'
            }`}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* Gráfico mensal */}
      <Suspense fallback={<div className="h-40 bg-gray-50 rounded-2xl animate-pulse" />}>
        <MonthlyChart allTransactions={allTransactions} activeTab={tab} />
      </Suspense>

      {/* Total card */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-end justify-between mb-1">
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
              {tab === 'investimento'
                ? (projectionDays === 0 ? 'Saldo Líquido (100% CDI)' : `Projeção ${projectionDays}d`)
                : tab === 'renda' ? 'Renda Total' : 'Total de Gastos'}
            </p>
            <div className="flex items-end gap-2">
              <p className={`text-3xl font-black ${
                tab === 'investimento' ? 'text-blue-600' : tab === 'renda' ? 'text-emerald-600' : 'text-rose-600'
              }`}>{fmt(Math.abs(viewTotal) < 0.01 ? 0 : viewTotal)}</p>
              {trendDiff !== null && <TrendBadge diff={trendDiff} invertGood={tab === 'gasto'} />}
            </div>
          </div>
          {avgTotal > 0 && (
            <div className="text-right">
              <p className="text-[8px] font-black text-gray-300 uppercase">Média 3m</p>
              <p className="text-xs font-black text-gray-400">{fmtK(avgTotal)}</p>
            </div>
          )}
        </div>

        {tab === 'investimento' && (
          <div className="mt-4 pt-4 border-t border-gray-50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <Zap size={10} className="text-blue-400 fill-purple-400" />
                <span className="text-[9px] font-black text-gray-400 uppercase">Projetar Futuro</span>
              </div>
              <div className="flex gap-1">
                {[0, 30, 60, 90, 365].map(d => (
                  <button key={d} onClick={() => setProjectionDays(d)}
                    style={{ minHeight: 36 }}
                    className={`px-2.5 py-1.5 rounded-2xl text-[8px] font-black transition-all ${
                      projectionDays === d ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-400'
                    }`}>
                    {d === 0 ? 'HOJE' : d === 365 ? '1A' : `${d}D`}
                  </button>
                ))}
              </div>
            </div>
            {projectionDays > 0 && (
              <div className="bg-blue-50/50 p-3 rounded-2xl flex justify-between items-center animate-in zoom-in-95 duration-200">
                <div>
                  <p className="text-[8px] font-bold text-blue-400 uppercase">Lucro Estimado</p>
                  <p className="text-lg font-black text-purple-700">+{fmt(viewTotal - calculateLiquidValue(filtered, 0))}</p>
                </div>
                <div className="text-right">
                  <p className="text-[7px] text-gray-400 font-bold uppercase">CDI: {(cdiReal * 100).toFixed(2)}% aa</p>
                  <p className="text-[7px] text-gray-400 font-bold uppercase">IR 22,5% descontado</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Gráfico mensal */}
      {(tab === 'gasto' || tab === 'renda') && (
        <BarChartMensal
          allTransactions={allTransactions}
          tab={tab}
          currentDate={currentDate}
        />
      )}

      {/* Comparativo por categoria */}
      {(tab === 'gasto' || tab === 'renda') && (
        <ComparativoCategoria
          allTransactions={allTransactions}
          tab={tab}
          currentDate={currentDate}
        />
      )}
      
      {/* Pizza */}
      <PieSection
        grouped={grouped}
        viewTotal={viewTotal}
        tab={tab}
        selectedCategory={selectedCategory}
        onCategorySelect={handleCategorySelect}
      />

      {/* Calendário */}
      <CalendarView transactions={allTransactions} activeTab={tab} currentDate={currentDate} onDaySelect={handleDaySelect} filteredCategory={selectedCategory} />
    </section>
  )
}

function TrendBadge({ diff, invertGood = false }) {
  if (Math.abs(diff) < 5) return null
  const isUp   = diff > 0
  const isGood = invertGood ? !isUp : isUp
  return (
    <span className={`flex items-center gap-0.5 font-black rounded-2xl text-[9px] px-1.5 py-0.5 mb-1 ${
      isGood ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'
    }`}>
      {isUp ? '↑' : '↓'} {Math.abs(diff).toFixed(0)}%
    </span>
  )
}