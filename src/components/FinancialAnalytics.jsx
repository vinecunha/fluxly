import React, { useState, useMemo, lazy, Suspense } from 'react'
import {
  TrendingDown, TrendingUp, Tag, ArrowLeft,
  DollarSign, PiggyBank, Building2, Wallet,
  ChevronRight, Minus
} from 'lucide-react'
import { categoryIcons } from '../lib/categories'
import { useMonthlyAverages } from '../hooks/useMonthlyAverages'

const MonthlyChart = lazy(() =>
  import('./MonthlyChart').then(m => ({ default: m.MonthlyChart }))
)

const fmt = (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

export function FinancialAnalytics({ transactions = [], allTransactions = [] }) {
  const [tab, setTab] = useState('gasto')
  const [expandedDestino, setExpandedDestino] = useState(null)
  const [expandedSubcat, setExpandedSubcat] = useState(null)

  const { averageByCategory, averageRenda, averageDespesas } = useMonthlyAverages(allTransactions, 3)

  const filtered = useMemo(() => (transactions || []).filter(t => {
    if (tab === 'renda') return t.tipo === 'renda'
    if (tab === 'investimento') return t.tipo === 'reserva'
    return t.tipo !== 'renda' && t.tipo !== 'reserva' && (t.tipo === 'gasto_diario' || t.pago === true)
  }), [transactions, tab])

  const grouped = useMemo(() => filtered.reduce((acc, t) => {
    const v = parseFloat(t.valor) || 0
    if (tab === 'investimento') {
      const dest = (t.destino_reserva || 'Outros').trim()
      const sub  = (t.subcategoria || t.descricao || 'Sem Nome').trim()
      if (!acc[dest]) acc[dest] = { total: 0, subcategorias: {} }
      if (!acc[dest].subcategorias[sub]) acc[dest].subcategorias[sub] = { total: 0, items: [] }
      acc[dest].total += v
      acc[dest].subcategorias[sub].total += v
      acc[dest].subcategorias[sub].items.push(t)
    } else if (tab === 'renda') {
      const desc = (t.descricao || 'Outros').trim()
      if (!acc[desc]) acc[desc] = { total: 0, items: [] }
      acc[desc].total += v
      acc[desc].items.push(t)
    } else {
      const cat = (t.categoria || 'Outros').trim()
      if (!acc[cat]) acc[cat] = { total: 0, items: [] }
      acc[cat].total += v
      acc[cat].items.push(t)
    }
    return acc
  }, {}), [filtered, tab])

  const viewTotal = Object.values(grouped).reduce((s, d) => s + d.total, 0)

  const resetDrill = () => { setExpandedDestino(null); setExpandedSubcat(null) }

  // ─── Nível 3: lançamentos individuais ───────────────────────────────────────
  if (expandedSubcat) {
    const items = tab === 'investimento'
      ? grouped[expandedDestino]?.subcategorias[expandedSubcat]?.items || []
      : grouped[expandedSubcat]?.items || []

    return (
      <section className="space-y-4 animate-in slide-in-from-right duration-300">
        <button onClick={() => setExpandedSubcat(null)}
          className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest bg-white px-4 py-2.5 rounded-2xl border border-gray-100 shadow-sm">
          <ArrowLeft size={13} /> Voltar
        </button>

        <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex justify-between items-center">
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Detalhes</p>
            <p className="text-xl font-black text-gray-900">{expandedSubcat}</p>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
            tab === 'renda' ? 'bg-emerald-100 text-emerald-600' : 'bg-purple-100 text-purple-600'
          }`}>
            {tab === 'renda' ? <DollarSign size={20} /> : <Wallet size={20} />}
          </div>
        </div>

        <div className="space-y-2">
          {items.sort((a, b) => new Date(b.data) - new Date(a.data)).map((t, i) => (
            <div key={i} className="bg-white p-4 rounded-[2rem] border border-gray-100 flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center flex-shrink-0">
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

  // ─── Nível 2: caixinhas dentro de um destino (só reservas) ──────────────────
  if (expandedDestino && tab === 'investimento') {
    const subs = Object.entries(grouped[expandedDestino]?.subcategorias || {})
    const destiTotal = grouped[expandedDestino]?.total || 0

    return (
      <section className="space-y-4 animate-in slide-in-from-right duration-300">
        <button onClick={() => setExpandedDestino(null)}
          className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest bg-white px-4 py-2.5 rounded-2xl border border-gray-100 shadow-sm">
          <ArrowLeft size={13} /> Voltar para Destinos
        </button>

        <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm text-center">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Saldo em {expandedDestino}</p>
          <p className="text-3xl font-black text-purple-600">{fmt(destiTotal)}</p>
        </div>

        <div className="space-y-2">
          {subs.sort((a, b) => b[1].total - a[1].total).map(([name, data]) => (
            <div key={name} onClick={() => setExpandedSubcat(name)}
              className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm flex justify-between items-center cursor-pointer active:scale-[0.98] transition-all">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center flex-shrink-0">
                  <PiggyBank size={16} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-700">{name}</p>
                  <p className="text-[9px] text-gray-400">{data.items.length} lançamento{data.items.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-black text-gray-900">{fmt(data.total)}</p>
                <ChevronRight size={14} className="text-gray-300" />
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  // ─── Nível 1: visão principal ────────────────────────────────────────────────
  const avgTotal = tab === 'renda' ? averageRenda : tab === 'gasto' ? averageDespesas : 0
  const trendDiff = avgTotal > 0 ? ((viewTotal - avgTotal) / avgTotal) * 100 : null

  return (
    <section className="space-y-4 animate-in fade-in duration-300">

      {/* Tabs */}
      <div className="flex gap-1.5 p-1 bg-gray-100 rounded-2xl">
        {[
          { id: 'gasto',        label: 'Gastos',   Icon: TrendingDown, color: 'text-rose-600' },
          { id: 'investimento', label: 'Reservas',  Icon: PiggyBank,    color: 'text-purple-600' },
          { id: 'renda',        label: 'Renda',    Icon: TrendingUp,   color: 'text-emerald-600' },
        ].map(({ id, label, Icon, color }) => (
          <button key={id}
            onClick={() => { setTab(id); resetDrill() }}
            className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-1.5 ${
              tab === id ? `bg-white shadow-sm ${color}` : 'text-gray-400'
            }`}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* Gráfico mensal */}
      <Suspense fallback={<div className="h-40 bg-gray-50 rounded-[2rem] animate-pulse" />}>
        <MonthlyChart allTransactions={allTransactions} />
      </Suspense>

      {/* Card totalizador com tendência */}
      <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm">
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
          {tab === 'investimento' ? 'Total das Reservas' : tab === 'renda' ? 'Renda Total' : 'Total de Gastos'}
        </p>
        <div className="flex items-end gap-3">
          <p className={`text-3xl font-black ${
            tab === 'investimento' ? 'text-purple-600' : tab === 'renda' ? 'text-emerald-600' : 'text-rose-600'
          }`}>{fmt(viewTotal)}</p>
          {trendDiff !== null && <TrendBadge diff={trendDiff} invertGood={tab === 'gasto'} />}
        </div>
        {avgTotal > 0 && (
          <p className="text-[10px] text-gray-400 mt-1">média 3 meses: {fmt(avgTotal)}</p>
        )}
      </div>

      {/* Lista com drill-down */}
      <div className="space-y-2">
        {Object.entries(grouped).length === 0 && (
          <div className="text-center py-10 text-gray-400 text-[11px] font-bold">
            Nenhum registro neste mês.
          </div>
        )}

        {Object.entries(grouped).sort((a, b) => b[1].total - a[1].total).map(([name, info]) => {
          const pct = viewTotal > 0 ? (info.total / viewTotal) * 100 : 0
          const avg = tab === 'gasto' ? (averageByCategory[name] || 0) : 0
          const diff = avg > 0 ? ((info.total - avg) / avg) * 100 : null
          const catData = tab === 'gasto' ? categoryIcons[name] : null

          return (
            <div key={name}
              onClick={() => tab === 'investimento' ? setExpandedDestino(name) : setExpandedSubcat(name)}
              className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm cursor-pointer active:scale-[0.98] transition-all"
            >
              <div className="flex justify-between items-center mb-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Ícone */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    catData?.color ||
                    (tab === 'investimento' ? 'bg-purple-100 text-purple-600' :
                     tab === 'renda' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600')
                  }`}>
                    {catData?.icon || (
                      tab === 'investimento' ? <Building2 size={14} /> :
                      tab === 'renda' ? <DollarSign size={14} /> : <Tag size={14} />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-700 truncate">{name}</p>
                    {avg > 0 && (
                      <p className="text-[9px] text-gray-400">média {fmt(avg)}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-black text-gray-900">{fmt(info.total)}</p>
                    {diff !== null && <TrendBadge diff={diff} invertGood small />}
                  </div>
                  <ChevronRight size={14} className="text-gray-300" />
                </div>
              </div>

              {/* Barra de progresso */}
              <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    tab === 'investimento' ? 'bg-purple-400' :
                    tab === 'renda' ? 'bg-emerald-400' : 'bg-indigo-400'
                  }`}
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
              <p className="text-[9px] text-gray-400 text-right mt-0.5">{pct.toFixed(0)}%</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function TrendBadge({ diff, invertGood = false, small = false }) {
  if (Math.abs(diff) < 5) {
    return (
      <span className={`flex items-center gap-0.5 font-black text-gray-400 bg-gray-100 rounded-lg ${small ? 'text-[8px] px-1 py-0.5' : 'text-[9px] px-1.5 py-0.5'}`}>
        <Minus size={small ? 7 : 8} /> estável
      </span>
    )
  }
  const isUp = diff > 0
  const isGood = invertGood ? !isUp : isUp
  return (
    <span className={`flex items-center gap-0.5 font-black rounded-lg ${small ? 'text-[8px] px-1 py-0.5' : 'text-[9px] px-1.5 py-0.5'} ${
      isGood ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'
    }`}>
      {isUp ? '↑' : '↓'} {Math.abs(diff).toFixed(0)}%
    </span>
  )
}