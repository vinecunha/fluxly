import React from 'react'
import { TrendingUp, TrendingDown, PiggyBank, Minus } from 'lucide-react'
import { TAB_CONFIG, fmtFull } from './constants'

function StatusCard({ dayValue, dayNumber, dayType, currentDate }) {
  const hoje = new Date()
  const isToday = dayNumber === hoje.getDate() && 
                  currentDate.getMonth() === hoje.getMonth() && 
                  currentDate.getFullYear() === hoje.getFullYear()
  
  const cfg = TAB_CONFIG[dayType]
  
  return (
    <div className={`rounded-xl p-3 mb-3 ${cfg.bg}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <cfg.Icon size={14} className={cfg.color} />
          <div>
            <p className="text-[8px] font-black uppercase tracking-wider text-gray-500">
              {isToday ? 'Hoje' : `Dia ${dayNumber}`}
            </p>
            <p className={`text-base font-black ${cfg.color}`}>
              {cfg.prefix} {fmtFull(dayValue)}
            </p>
          </div>
        </div>
        {isToday && (
          <div className="bg-white/50 rounded-full px-2 py-0.5">
            <span className="text-[8px] font-black text-gray-500">✓ Atual</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default StatusCard
