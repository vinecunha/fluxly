import React, { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  getPeriodLabel, navigatePeriod, getPeriodRange
} from '../lib/periodHelpers'

const PERIOD_OPTIONS = [
  { value: 'today', label: 'Hoje' },
  { value: 'week', label: 'Esta Semana' },
  { value: 'month', label: 'Este Mês' },
  { value: 'year', label: 'Este Ano' },
  { value: '12months', label: 'Últimos 12 Meses' },
  { value: 'custom', label: 'Personalizar' },
]

export default function PeriodFilter({ period, onPeriodChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const label = getPeriodLabel(period)
  const isCustom = period.type === 'custom'

  const handleSelect = (type) => {
    if (type === 'custom') {
      const r = getPeriodRange({ type: 'month', referenceDate: new Date() })
      const fmt = (d) => d.toLocaleDateString('en-CA')
      onPeriodChange({ type: 'custom', referenceDate: new Date(), customStart: fmt(r.start), customEnd: fmt(r.end) })
    } else {
      onPeriodChange({ type, referenceDate: new Date() })
    }
    setIsOpen(false)
  }

  return (
    <div className="flex items-center bg-white/10 rounded-2xl border border-white/10 flex-1 mx-1 relative" ref={ref}>
      {!isCustom ? (
        <>
          <button
            onClick={() => onPeriodChange(navigatePeriod(period, -1))}
            className="px-4 text-white/50 active:text-white hover:text-white transition-colors"
            style={{ minHeight: 40 }}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex-1 text-center relative"
            style={{ minHeight: 40 }}
          >
            <span className="text-[11px] font-black tracking-widest text-white block">{label}</span>
          </button>
          <button
            onClick={() => onPeriodChange(navigatePeriod(period, 1))}
            className="px-4 text-white/50 active:text-white hover:text-white transition-colors"
            style={{ minHeight: 40 }}
          >
            <ChevronRight size={14} />
          </button>
        </>
      ) : (
        <>
          <div className="flex items-center gap-1 px-2 flex-1" style={{ minHeight: 40 }}>
            <input
              type="date"
              value={period.customStart || ''}
              onChange={(e) => onPeriodChange({ ...period, customStart: e.target.value })}
              className="w-[115px] bg-transparent text-white text-[9px] font-bold border border-white/20 rounded-lg px-2 py-1.5
                         [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:invert"
            />
            <span className="text-white/40 text-[9px] font-bold">até</span>
            <input
              type="date"
              value={period.customEnd || ''}
              onChange={(e) => onPeriodChange({ ...period, customEnd: e.target.value })}
              className="w-[115px] bg-transparent text-white text-[9px] font-bold border border-white/20 rounded-lg px-2 py-1.5
                         [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:invert"
            />
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="px-2 text-white/40 hover:text-white transition-colors"
            style={{ minHeight: 40 }}
          >
            <ChevronRight size={12} className={`transition-transform ${isOpen ? 'rotate-90' : ''}`} />
          </button>
        </>
      )}

      {isOpen && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 min-w-[190px] animate-in slide-in-from-top-2 fade-in duration-200">
          {PERIOD_OPTIONS.map(({ value, label: lbl }) => (
            <button
              key={value}
              onClick={() => handleSelect(value)}
              className={`w-full text-left px-4 py-3 text-[11px] font-bold transition-colors flex items-center gap-2.5 ${
                period.type === value
                  ? 'bg-slate-50 text-slate-900'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                period.type === value ? 'bg-slate-900' : 'border border-gray-300'
              }`} />
              {lbl}
            </button>
          ))}
        </div>
      )}

    </div>
  )
}
