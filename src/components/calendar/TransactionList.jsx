import React from 'react'
import { fmtFull } from './constants'

function TransactionList({ items, isInvestimento, cfg }) {
  if (!items || items.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-3 py-2 border-b border-gray-50">
        <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider">Lançamentos do dia</p>
      </div>
      <div className="divide-y divide-gray-50 max-h-40 overflow-y-auto">
        {items
          .sort((a, b) => Math.abs(Number(b.valor)) - Math.abs(Number(a.valor)))
          .map(t => {
            const v = Math.abs(Number(t.valor))
            const isEnt = t._isEntrada
            const itemColor = isInvestimento ? (isEnt ? 'text-emerald-600' : 'text-rose-500') : cfg.color
            const itemPrefix = isInvestimento ? (isEnt ? '+' : '-') : cfg.prefix

            return (
              <div key={t.id} className="px-3 py-2 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-gray-700 truncate">{t.descricao}</p>
                  <p className="text-[7px] text-gray-400 font-bold uppercase">
                    {isInvestimento && (isEnt ? 'entrada' : 'saída')}
                    {!isInvestimento && (t.categoria || t.tipo)}
                  </p>
                </div>
                <p className={`text-[10px] font-black ${itemColor} ml-2 flex-shrink-0`}>
                  {itemPrefix} {fmtFull(v)}
                </p>
              </div>
            )
          })}
      </div>
    </div>
  )
}

export default TransactionList
