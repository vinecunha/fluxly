import React, { useState } from 'react'
import {
  TrendingDown, TrendingUp, Tag, ArrowLeft,
  ShoppingCart, Home, Car, Palmtree, Pill,
  Hexagon, DollarSign, PiggyBank, Building2, Wallet, ChevronRight,
  ArrowDownRight
} from 'lucide-react'
import { MonthlyChart } from './MonthlyChart'

const categoryIcons = {
  "Mercado": { icon: <ShoppingCart size={16} />, color: "bg-amber-100 text-amber-600" },
  "Casa": { icon: <Home size={16} />, color: "bg-indigo-100 text-indigo-600" },
  "Carro": { icon: <Car size={16} />, color: "bg-blue-100 text-blue-600" },
  "Lazer": { icon: <Palmtree size={16} />, color: "bg-emerald-100 text-emerald-600" },
  "Saúde": { icon: <Pill size={16} />, color: "bg-rose-100 text-rose-600" },
  "Investimento": { icon: <PiggyBank size={16} />, color: "bg-purple-100 text-purple-600" },
  "Renda": { icon: <DollarSign size={16} />, color: "bg-emerald-100 text-emerald-600" },
  "Outros": { icon: <Hexagon size={16} />, color: "bg-gray-100 text-gray-600" }
}

export const FinancialAnalytics = ({ transactions, allTransactions }) => {
  const [transactionType, setTransactionType] = useState('gasto')
  const [expandedDestino, setExpandedDestino] = useState(null)
  const [expandedSubcat, setExpandedSubcat] = useState(null)

  const filteredTransactions = (transactions || []).filter(t => {
    if (transactionType === 'renda') return t.tipo === 'renda'
    if (transactionType === 'investimento') return t.tipo === 'reserva'
    return t.tipo !== 'renda' && t.tipo !== 'reserva' && (t.tipo === 'gasto_diario' || t.pago === true)
  })

  const groupedData = filteredTransactions.reduce((acc, t) => {
    const valor = parseFloat(t.valor) || 0
    if (transactionType === 'investimento') {
      const dest = (t.destino_reserva || 'Outros Destinos').trim()
      const sub = (t.subcategoria || t.descricao || 'Sem Nome').trim()
      if (!acc[dest]) acc[dest] = { total: 0, subcategorias: {} }
      if (!acc[dest].subcategorias[sub]) acc[dest].subcategorias[sub] = { total: 0, items: [] }
      acc[dest].total += valor
      acc[dest].subcategorias[sub].total += valor
      acc[dest].subcategorias[sub].items.push(t)
    } else if (transactionType === 'renda') {
      const desc = (t.descricao || 'Outros').trim()
      if (!acc[desc]) acc[desc] = { total: 0, items: [] }
      acc[desc].total += valor
      acc[desc].items.push(t)
    } else {
      const cat = (t.categoria || 'Outros').trim()
      if (!acc[cat]) acc[cat] = { total: 0, items: [] }
      acc[cat].total += valor
      acc[cat].items.push(t)
    }
    return acc
  }, {})

  const currentViewTotal = Object.values(groupedData).reduce((sum, d) => sum + (d.total || 0), 0)

  if (expandedSubcat) {
    const items = transactionType === 'investimento'
      ? groupedData[expandedDestino].subcategorias[expandedSubcat].items
      : groupedData[expandedSubcat].items

    return (
      <section className="space-y-6 animate-in slide-in-from-right duration-300">
        <button onClick={() => setExpandedSubcat(null)} className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest bg-white px-4 py-2 rounded-xl border border-gray-100">
          <ArrowLeft size={14} /> Voltar
        </button>
        <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex justify-between items-center">
          <div>
            <h4 className="text-gray-400 font-black text-[10px] uppercase mb-1 tracking-widest">Detalhes</h4>
            <p className="text-2xl font-black text-gray-900">{expandedSubcat}</p>
          </div>
          <div className={`w-14 h-14 rounded-3xl flex items-center justify-center shadow-sm ${transactionType === 'renda' ? 'bg-emerald-100 text-emerald-600' : 'bg-purple-100 text-purple-600'}`}>
            {transactionType === 'renda' ? <DollarSign size={24} /> : <Wallet size={24} />}
          </div>
        </div>
        <div className="space-y-3">
          {items.sort((a, b) => new Date(b.data) - new Date(a.data)).map((t, i) => {
            const isNegative = parseFloat(t.valor) < 0
            return (
              <div key={i} className="bg-white p-4 rounded-[2rem] border border-gray-100 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isNegative ? 'bg-rose-50 text-rose-500' : 'bg-gray-50 text-gray-400'}`}>
                    {isNegative ? <ArrowDownRight size={16} /> : <Tag size={16} />}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-800">{t.descricao}</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase">{t.data.split('-').reverse().join('/')}</p>
                  </div>
                </div>
                <p className={`text-sm font-black ${isNegative ? 'text-rose-600' : 'text-gray-900'}`}>
                  R$ {Math.abs(parseFloat(t.valor)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            )
          })}
        </div>
      </section>
    )
  }

  if (expandedDestino && transactionType === 'investimento') {
    const subs = Object.entries(groupedData[expandedDestino].subcategorias)
    return (
      <section className="space-y-6 animate-in slide-in-from-right duration-300">
        <button onClick={() => setExpandedDestino(null)} className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest bg-white px-4 py-2 rounded-xl border border-gray-100">
          <ArrowLeft size={14} /> Voltar para Destinos
        </button>
        <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <h4 className="text-gray-400 font-black text-[10px] uppercase mb-1 tracking-widest text-center">Saldo em {expandedDestino}</h4>
          <p className="text-3xl font-black text-center text-gray-900">R$ {groupedData[expandedDestino].total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="grid gap-3">
          {subs.map(([name, data]) => (
            <div key={name} onClick={() => setExpandedSubcat(name)} className="bg-white p-5 rounded-[2.5rem] border border-gray-100 shadow-sm flex justify-between items-center cursor-pointer active:scale-95 transition-transform">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center"><PiggyBank size={18} /></div>
                <span className="text-sm font-bold text-gray-700">{name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-gray-900">R$ {data.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                <ChevronRight size={16} className="text-gray-300" />
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-6 animate-in fade-in duration-500">
      <div className="flex gap-2 p-1 bg-gray-200/50 rounded-2xl">
        {[
          { id: 'gasto', label: 'Gastos', icon: <TrendingDown size={14} />, color: 'text-rose-600' },
          { id: 'investimento', label: 'Reservas', icon: <PiggyBank size={14} />, color: 'text-purple-600' },
          { id: 'renda', label: 'Renda', icon: <TrendingUp size={14} />, color: 'text-emerald-600' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setTransactionType(tab.id); setExpandedDestino(null); setExpandedSubcat(null) }}
            className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${
              transactionType === tab.id ? 'bg-white shadow-sm ' + tab.color : 'text-gray-500'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <MonthlyChart allTransactions={allTransactions} />

      <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden">
        <h4 className="text-gray-400 font-black text-[10px] uppercase tracking-[0.2em] mb-1">
          {transactionType === 'investimento' ? 'Saldo Total das Reservas' : transactionType === 'renda' ? 'Renda por Descrição' : 'Gastos por Categoria'}
        </h4>
        <p className="text-3xl font-black text-gray-900">
          R$ {currentViewTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      </div>

      <div className="grid gap-3">
        {Object.entries(groupedData).sort((a, b) => b[1].total - a[1].total).map(([name, info]) => {
          const percentage = currentViewTotal > 0 ? ((info.total / currentViewTotal) * 100).toFixed(1) : 0
          return (
            <div
              key={name}
              onClick={() => {
                if (transactionType === 'investimento') setExpandedDestino(name)
                else setExpandedSubcat(name)
              }}
              className="bg-white p-5 rounded-[2.5rem] border border-gray-100 shadow-sm cursor-pointer active:scale-[0.98] transition-all"
            >
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    transactionType === 'investimento' ? 'bg-purple-100 text-purple-600' :
                    transactionType === 'renda' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'
                  }`}>
                    {transactionType === 'investimento' ? <Building2 size={14} /> :
                     transactionType === 'renda' ? <DollarSign size={14} /> : <Tag size={14} />}
                  </div>
                  <span className="text-sm font-bold text-gray-700 capitalize">{name}</span>
                </div>
                <div className="flex items-center gap-2 text-right">
                  <p className="text-sm font-black text-gray-900">R$ {info.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <ChevronRight size={14} className="text-gray-300" />
                </div>
              </div>
              <div className="relative h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ${
                    transactionType === 'investimento' ? 'bg-purple-500' :
                    transactionType === 'renda' ? 'bg-emerald-500' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${Math.max(0, percentage)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
