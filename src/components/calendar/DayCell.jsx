import React from 'react'
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { TAB_CONFIG, fmt } from './constants'

function DayCell({ 
  dayNum, isValid, dateKey, data, isToday, isSelected, 
  cfg, isInvestimento, maxDay, filteredCategory, dayMap,
  onDaySelect, year, month, selectedDay, setSelectedDay 
}) {
  const mainVal = data ? (isInvestimento ? data.entrada + data.saida : data.entrada + data.saida) : 0
  const pct = data ? Math.max((mainVal / maxDay) * 100, 8) : 0
  const hasEntrada = data && data.entrada > 0
  const hasSaida = data && data.saida > 0

  return (
    <button
      disabled={!isValid}
      onClick={() => {
        if (!isValid) return
        const next = selectedDay === dayNum ? null : dayNum
        setSelectedDay(next)
        if (onDaySelect) {
          const key = next ? `${year}-${String(month+1).padStart(2,'0')}-${String(next).padStart(2,'0')}` : null
          onDaySelect(key)
        }
      }}
      style={{ minHeight: 52 }}
      className={`p-0.5 border-b border-r border-gray-50 flex flex-col items-center justify-start transition-all ${
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
          <span className={`text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full mb-0.5 flex-shrink-0 ${
            isToday ? 'bg-slate-900 text-white text-[9px]' : isSelected ? cfg.color : 'text-gray-600'
          }`}>
            {dayNum}
          </span>
          {data && (
            <div className="w-full px-0.5">
              {isInvestimento ? (
                <>
                  {hasEntrada && (
                    <div className="w-full bg-gray-100 rounded-full overflow-hidden mb-0.5" style={{ height: 2 }}>
                      <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.max((data.entrada / maxDay) * 100, 8)}%` }} />
                    </div>
                  )}
                  {hasSaida && (
                    <div className="w-full bg-gray-100 rounded-full overflow-hidden mb-0.5" style={{ height: 2 }}>
                      <div className="h-full rounded-full bg-rose-400" style={{ width: `${Math.max((data.saida / maxDay) * 100, 8)}%` }} />
                    </div>
                  )}
                  <span className="text-[6px] font-black w-full text-center block truncate text-blue-500">
                    {hasEntrada && hasSaida ? `+${fmt(data.entrada)} -${fmt(data.saida)}` : hasEntrada ? `+${fmt(data.entrada)}` : `-${fmt(data.saida)}`}
                  </span>
                </>
              ) : (
                <>
                  <div className="w-full bg-gray-100 rounded-full overflow-hidden" style={{ height: 2 }}>
                    <div className={`h-full rounded-full ${cfg.bar}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className={`text-[6px] font-black w-full text-center block truncate ${cfg.color}`}>
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
}

export default DayCell
