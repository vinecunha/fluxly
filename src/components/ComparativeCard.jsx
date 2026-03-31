import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

const fmt = (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

export function ComparativeCard({ atual, anterior, label, invertPositive = false }) {
  if (anterior === undefined || anterior === null) return null

  const variacao = anterior !== 0 ? ((atual - anterior) / anterior) * 100 : (atual > 0 ? 100 : 0)
  const isPositive = invertPositive ? variacao <= 0 : variacao >= 0
  const absVariacao = Math.abs(variacao).toFixed(1)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-3">
      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2">{label}</p>
      <div className="flex items-center justify-between">
        <p className="text-sm font-black text-gray-800">{fmt(atual)}</p>
        <div className={`flex items-center gap-1 text-[9px] font-black ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
          {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          <span>{absVariacao}%</span>
        </div>
      </div>
      <p className="text-[8px] text-gray-400 mt-1">vs mês anterior {fmt(anterior)}</p>
    </div>
  )
}