import React, { useState, useMemo, lazy, Suspense, useRef, useEffect } from 'react'
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

const fmt = (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtK = (v) => {
  if (Math.abs(v) >= 1000) return `R$${(v / 1000).toFixed(1)}k`
  return `R$${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`
}

const PALETTE = [
  '#1e293b', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316',
  '#64748b', '#a78bfa', '#34d399', '#fbbf24', '#fb923c',
]

// ─── Donut Chart ─────────────────────────────────────────────────────────────
function DonutChart({ data, total, color, activeIdx, onHover }) {
  const SIZE   = 160
  const CX     = SIZE / 2
  const CY     = SIZE / 2
  const R      = 58
  const INNER  = 36
  const GAP    = 2

  const slices = useMemo(() => {
    if (!data.length || total <= 0) return []
    let angle = -90
    return data.map((d, i) => {
      const pct   = d.value / total
      const sweep = pct * 360
      const start = angle
      angle += sweep + (sweep > 5 ? GAP : 0)
      return { ...d, pct, sweep, start, i }
    })
  }, [data, total])

  const polarToXY = (angleDeg, r) => {
    const rad = (angleDeg * Math.PI) / 180
    return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) }
  }

  const describeArc = (start, sweep, r, inner) => {
    if (sweep >= 359.9) {
      return [
        `M ${CX} ${CY - r}`,
        `A ${r} ${r} 0 1 1 ${CX - 0.01} ${CY - r}`,
        `Z`,
        `M ${CX} ${CY - inner}`,
        `A ${inner} ${inner} 0 1 0 ${CX - 0.01} ${CY - inner}`,
        `Z`,
      ].join(' ')
    }
    const p1 = polarToXY(start, r)
    const p2 = polarToXY(start + sweep, r)
    const p3 = polarToXY(start + sweep, inner)
    const p4 = polarToXY(start, inner)
    const large = sweep > 180 ? 1 : 0
    return [
      `M ${p1.x} ${p1.y}`,
      `A ${r} ${r} 0 ${large} 1 ${p2.x} ${p2.y}`,
      `L ${p3.x} ${p3.y}`,
      `A ${inner} ${inner} 0 ${large} 0 ${p4.x} ${p4.y}`,
      `Z`,
    ].join(' ')
  }

  const active = activeIdx !== null ? slices[activeIdx] : null

  return (
    <div className="flex flex-col items-center">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="overflow-visible">
        {slices.map((s, i) => {
          const isActive = activeIdx === i
          const scale    = isActive ? 1.06 : 1
          return (
            <path
              key={i}
              d={describeArc(s.start, Math.max(s.sweep - (s.sweep > 5 ? GAP : 0), 0.5), R, INNER)}
              fill={PALETTE[i % PALETTE.length]}
              opacity={activeIdx === null ? 1 : isActive ? 1 : 0.35}
              style={{
                transform: `scale(${scale})`,
                transformOrigin: `${CX}px ${CY}px`,
                transition: 'all 0.2s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={() => onHover(i)}
              onMouseLeave={() => onHover(null)}
              onTouchStart={() => onHover(i)}
            />
          )
        })}
        <circle cx={CX} cy={CY} r={INNER - 2} fill="white" />
        <text x={CX} y={CY - 7} textAnchor="middle" fontSize="10" fontWeight="800" fill="#1e293b">
          {active ? `${(active.pct * 100).toFixed(0)}%` : fmtK(total)}
        </text>
        <text x={CX} y={CY + 8} textAnchor="middle" fontSize="7" fontWeight="700" fill="#94a3b8">
          {active ? active.label.substring(0, 10) : 'total'}
        </text>
      </svg>
    </div>
  )
}

// ─── Category Row ─────────────────────────────────────────────────────────────
function CategoryRow({ name, value, total, color, catData, rank, isActive, onHover, onClick }) {
  const pct = total > 0 ? (value / total) * 100 : 0
  return (
    <div
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={() => {}}
      className={`flex items-center gap-3 p-2.5 rounded-2xl cursor-pointer transition-all ${
        isActive ? 'bg-slate-50 ring-1 ring-slate-200' : 'hover:bg-gray-50'
      }`}
    >
      <div className="w-5 h-5 rounded-lg flex-shrink-0" style={{ backgroundColor: color }} />
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${catData?.color || 'bg-gray-100 text-gray-400'}`}>
        {catData?.icon || <Tag size={12} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[11px] font-bold text-gray-700 truncate">{name}</p>
          <p className="text-[11px] font-black text-gray-900 ml-2 flex-shrink-0">{fmtK(value)}</p>
        </div>
        <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
        </div>
      </div>
      <span className="text-[9px] font-black text-gray-300 w-7 text-right flex-shrink-0">{pct.toFixed(0)}%</span>
    </div>
  )
}

// ─── Pie Section ─────────────────────────────────────────────────────────────
function PieSection({ grouped, viewTotal, tab, onDrillDown }) {
  const [activeIdx, setActiveIdx] = useState(null)

  const entries = useMemo(() =>
    Object.entries(grouped)
      .sort((a, b) => b[1].totalBruto - a[1].totalBruto)
      .map(([name, info], i) => ({
        label: name,
        value: info.totalBruto,
        items: info.items,
        color: PALETTE[i % PALETTE.length],
      })),
    [grouped]
  )

  if (entries.length === 0) return null

  const tabColor = tab === 'investimento' ? 'text-blue-600' : tab === 'renda' ? 'text-emerald-600' : 'text-rose-600'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-4 pt-4 pb-2">
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Distribuição</p>
      </div>

      <div className="flex items-center gap-2 px-4 pb-4">
        <DonutChart
          data={entries}
          total={viewTotal}
          color={tab}
          activeIdx={activeIdx}
          onHover={setActiveIdx}
        />
        <div className="flex-1 min-w-0 space-y-0.5 max-h-[160px] overflow-y-auto no-scrollbar">
          {entries.map((e, i) => {
            const catData = tab === 'gasto' ? categoryIcons[e.label] : null
            return (
              <CategoryRow
                key={e.label}
                name={e.label}
                value={e.value}
                total={viewTotal}
                color={e.color}
                catData={catData}
                rank={i + 1}
                isActive={activeIdx === i}
                onHover={() => setActiveIdx(i)}
                onClick={() => onDrillDown(e.label)}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function FinancialAnalytics({ transactions = [], allTransactions = [], currentDate }) {
  const [tab, setTab]                         = useState('gasto')
  const [expandedDestino, setExpandedDestino] = useState(null)
  const [expandedSubcat, setExpandedSubcat]   = useState(null)
  const [projectionDays, setProjectionDays]   = useState(0)

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
    if (tab === 'renda')        return t.tipo === 'renda'
    if (tab === 'investimento') return t.tipo === 'reserva'
    return t.tipo !== 'renda' && t.tipo !== 'reserva' && (t.tipo === 'gasto_diario' || t.pago === true)
  }), [transactions, tab])

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

  const resetDrill = () => { setExpandedDestino(null); setExpandedSubcat(null); setProjectionDays(0) }

  if (expandedSubcat) {
    const items = tab === 'investimento'
      ? grouped[expandedDestino]?.subcategorias[expandedSubcat]?.items || []
      : grouped[expandedSubcat]?.items || []

    return (
      <section className="space-y-4 animate-in slide-in-from-right duration-300">
        <button onClick={() => setExpandedSubcat(null)}
          className="flex items-center gap-2 text-slate-600 font-black text-[10px] uppercase tracking-widest bg-white px-4 py-2.5 rounded-2xl border border-gray-100 shadow-sm">
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

  if (expandedDestino && tab === 'investimento') {
    const subs = Object.entries(grouped[expandedDestino]?.subcategorias || {})
    const liquidDestino = calculateLiquidValue(grouped[expandedDestino]?.items || [], projectionDays)
    return (
      <section className="space-y-4 animate-in slide-in-from-right duration-300">
        <button onClick={() => setExpandedDestino(null)}
          className="flex items-center gap-2 text-slate-600 font-black text-[10px] uppercase tracking-widest bg-white px-4 py-2.5 rounded-2xl border border-gray-100 shadow-sm">
          <ArrowLeft size={13} /> Voltar para Destinos
        </button>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-center">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Saldo Líquido em {expandedDestino}</p>
          <p className="text-3xl font-black text-blue-600">{fmt(liquidDestino)}</p>
        </div>
        <div className="space-y-2">
          {subs.sort((a, b) => b[1].totalBruto - a[1].totalBruto).map(([name, data]) => (
            <div key={name} onClick={() => setExpandedSubcat(name)}
              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center cursor-pointer active:scale-[0.98] transition-all">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0">
                  <PiggyBank size={16} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-700">{name}</p>
                  <p className="text-[9px] text-gray-400">{data.items.length} lançamento{data.items.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-black text-gray-900">{fmt(calculateLiquidValue(data.items, projectionDays))}</p>
                <ChevronRight size={14} className="text-gray-300" />
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  const avgTotal  = tab === 'renda' ? averageRenda : tab === 'gasto' ? averageDespesas : 0
  const trendDiff = (tab !== 'investimento' && avgTotal > 0) ? ((viewTotal - avgTotal) / avgTotal) * 100 : null

  return (
    <section className="space-y-4 animate-in fade-in duration-300">
      <div className="flex gap-1.5 p-1 bg-gray-100 rounded-2xl">
        {[
          { id: 'gasto',        label: 'Gastos',  Icon: TrendingDown, color: 'text-rose-600'    },
          { id: 'investimento', label: 'Reservas', Icon: PiggyBank,   color: 'text-blue-600'    },
          { id: 'renda',        label: 'Renda',    Icon: TrendingUp,  color: 'text-emerald-600' },
        ].map(({ id, label, Icon, color }) => (
          <button key={id}
            onClick={() => { setTab(id); resetDrill() }}
            className={`flex-1 py-2.5 rounded-2xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-1.5 ${
              tab === id ? `bg-white shadow-sm ${color}` : 'text-gray-400'
            }`}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      <Suspense fallback={<div className="h-40 bg-gray-50 rounded-2xl animate-pulse" />}>
        <MonthlyChart allTransactions={allTransactions} activeTab={tab} />
      </Suspense>

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
              }`}>{fmt(viewTotal)}</p>
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
                    className={`px-2.5 py-1 rounded-2xl text-[8px] font-black transition-all ${
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

      <PieSection
        grouped={grouped}
        viewTotal={viewTotal}
        tab={tab}
        onDrillDown={(name) => tab === 'investimento' ? setExpandedDestino(name) : setExpandedSubcat(name)}
      />

      <CalendarView transactions={allTransactions} activeTab={tab} currentDate={currentDate} />
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