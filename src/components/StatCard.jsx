import React, { useState } from 'react'

export const StatCard = ({ title, value, valueSemana, valueHoje, color, icon, bgLight, isLoading }) => {
  const [filterMode, setFilterMode] = useState('hoje')

  if (isLoading) {
    return (
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between gap-2 min-w-0 animate-pulse">
        <div className="min-w-0 flex-1">
          <div className="h-2 w-10 bg-gray-100 rounded-2xl mb-2 ml-0.5" />
          <div className="h-4 w-20 bg-gray-50 rounded-2xl" />
        </div>
        <div className="w-10 h-10 rounded-2xl bg-gray-50 flex-shrink-0" />
      </div>
    )
  }

  const FILTERS = ['hoje', 'semana', 'geral']

  const handleCycleFilter = (e) => {
    e.stopPropagation()
    setFilterMode(prev => FILTERS[(FILTERS.indexOf(prev) + 1) % FILTERS.length])
  }

  const currentValue = filterMode === 'hoje' ? (valueHoje || 0) : 
                       filterMode === 'semana' ? (valueSemana || 0) : 
                       (value || 0)

  const formattedValue = Number(currentValue).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const labels = { geral: 'Mês', semana: 'Semana', hoje: 'Hoje' }

  const getFontSize = (formatted) => {
    if (formatted.length > 14) return 'text-[11px]'
    if (formatted.length > 11) return 'text-[13px]'
    return 'text-base'
  }

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between gap-1.5 min-w-0 overflow-hidden relative">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 mb-0.5 ml-0.5">
          <p className="text-[8px] font-black uppercase text-gray-400 tracking-[0.12em] truncate">
            {title}
          </p>
          <button 
            onClick={handleCycleFilter}
            className={`text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase transition-all border ${
              filterMode !== 'geral'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
              : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100'
            }`}
          >
            {labels[filterMode]}
          </button>
        </div>
        
        <p className={`font-black leading-tight transition-all duration-300 ${color} ${getFontSize(currentValue)}`}>
          <span className="text-[10px] opacity-70 mr-0.5">R$</span>
          {formattedValue}
        </p>
      </div>
      
      {icon && (
        <div className={`w-9 h-9 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-sm ${bgLight} ${color}`}>
          {React.cloneElement(icon, { size: 16, strokeWidth: 3 })}
        </div>
      )}
    </div>
  )
}