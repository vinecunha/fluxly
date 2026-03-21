import React, { useState } from 'react'

export const StatCard = ({ title, value, valueSemana, valueHoje, color, icon, bgLight, isLoading }) => {
  const [filterMode, setFilterMode] = useState('hoje')

  if (isLoading) {
    return (
      <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-gray-100 animate-pulse">
        <div className="h-2 w-12 bg-gray-100 rounded-full mb-2" />
        <div className="h-5 w-20 bg-gray-50 rounded-full" />
      </div>
    )
  }

  const FILTERS = ['hoje', 'semana', 'geral']
  const labels  = { hoje: 'Hoje', semana: 'Semana', geral: 'Mês' }

  const handleCycle = (e) => {
    e.stopPropagation()
    setFilterMode(prev => FILTERS[(FILTERS.indexOf(prev) + 1) % FILTERS.length])
  }

  const currentValue = filterMode === 'hoje'   ? (valueHoje   || 0)
                     : filterMode === 'semana' ? (valueSemana || 0)
                     : (value || 0)

  const formatted = Number(currentValue).toLocaleString('pt-BR', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  })

  const fontSize = formatted.length > 14 ? 'text-[11px]'
                 : formatted.length > 11 ? 'text-[13px]'
                 : 'text-[15px]'

  return (
    <div className="bg-white px-3.5 py-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-2 min-w-0 overflow-hidden">
      {/* Ícone */}
      {icon && (
        <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center ${bgLight} ${color}`}>
          {React.cloneElement(icon, { size: 15, strokeWidth: 2.5 })}
        </div>
      )}

      {/* Texto */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 mb-0.5">
          <p className="text-[8px] font-black uppercase text-gray-400 tracking-wider truncate leading-none">
            {title}
          </p>
          <button
            onClick={handleCycle}
            className={`text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase transition-all flex-shrink-0 ${
              filterMode !== 'geral'
                ? 'bg-slate-900 text-white'
                : 'bg-gray-100 text-gray-400'
            }`}
            style={{ minHeight: 18 }}
          >
            {labels[filterMode]}
          </button>
        </div>
        <p className={`font-black leading-tight ${color} ${fontSize}`}>
          <span className="text-[9px] opacity-60 mr-0.5">R$</span>
          {formatted}
        </p>
      </div>
    </div>
  )
}