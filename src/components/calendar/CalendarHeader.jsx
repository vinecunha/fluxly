import React from 'react'
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { MONTHS, TAB_CONFIG, fmt, fmtFull } from './constants'

function CalendarHeader({ cfg, year, month, filteredCategory, isInvestimento, summary }) {
  return (
    <>
      {/* Cabeçalho */}
      <div className={`flex items-center justify-center gap-1.5 py-2.5 ${cfg.bg}`}>
        <cfg.Icon size={11} className={cfg.color} />
        <span className={`text-[9px] font-black uppercase ${cfg.color}`}>
          {filteredCategory ? filteredCategory : cfg.label} — {MONTHS[month]} {year}
        </span>
      </div>

      {/* Resumo rápido */}
      <div className="px-3 py-2 border-b border-gray-50">
        {isInvestimento ? (
          <div className="grid grid-cols-4 gap-1">
            <div className="text-center">
              <p className="text-[7px] font-black text-gray-400 uppercase">Entrada</p>
              <p className="text-[10px] font-black text-emerald-600">{summary.diasComEntrada}d</p>
              <p className="text-[8px] font-black text-emerald-600/70">{fmt(summary.totalEntrada)}</p>
            </div>
            <div className="text-center">
              <p className="text-[7px] font-black text-gray-400 uppercase">Saída</p>
              <p className="text-[10px] font-black text-rose-500">{summary.diasComSaida}d</p>
              <p className="text-[8px] font-black text-rose-500/70">{fmt(summary.totalSaida)}</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[7px] font-black text-gray-400 uppercase">Dias com {cfg.label.toLowerCase()}</p>
              <p className={`text-[13px] font-black ${cfg.color}`}>
                {cfg.label === 'Renda' ? summary.diasComEntrada : summary.diasComSaida}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[7px] font-black text-gray-400 uppercase">Total</p>
              <p className={`text-[13px] font-black ${cfg.color}`}>
                {fmtFull(cfg.label === 'Renda' ? summary.totalEntrada : summary.totalSaida)}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default CalendarHeader
