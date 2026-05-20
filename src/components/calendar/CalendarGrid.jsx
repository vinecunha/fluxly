import React from 'react'
import { WEEKDAYS } from './constants'
import DayCell from './DayCell'

function CalendarGrid({ 
  year, month, firstDay, daysInMonth, totalCells, dayMap, maxDay,
  cfg, isInvestimento, selectedDay, setSelectedDay, onDaySelect,
  filteredCategory, weekDays = []
}) {
  return (
    <>
      {/* Dias da semana */}
      <div className="grid grid-cols-7 border-b border-gray-50">
        {WEEKDAYS.map(d => (
          <div key={d} className="py-1.5 text-center text-[8px] font-black text-gray-400 uppercase">{d}</div>
        ))}
      </div>

      {/* Grade do calendário */}
      <div className="grid grid-cols-7">
        {Array.from({ length: totalCells }).map((_, i) => {
          const dayNum  = i - firstDay + 1
          const isValid = dayNum >= 1 && dayNum <= daysInMonth
          const dateKey = isValid ? `${year}-${String(month + 1).padStart(2,'0')}-${String(dayNum).padStart(2,'0')}` : null
          const data = dateKey ? dayMap[dateKey] : null
          const today = new Date()
          const isToday = isValid && today.getDate() === dayNum && today.getMonth() === month && today.getFullYear() === year
          const isSelected = isValid && selectedDay === dayNum

          return (
            <DayCell
              key={i}
              dayNum={dayNum}
              isValid={isValid}
              dateKey={dateKey}
              data={data}
              isToday={isToday}
              isSelected={isSelected}
              cfg={cfg}
              isInvestimento={isInvestimento}
              maxDay={maxDay}
              filteredCategory={filteredCategory}
              dayMap={dayMap}
              onDaySelect={onDaySelect}
              year={year}
              month={month}
              selectedDay={selectedDay}
              setSelectedDay={setSelectedDay}
              isWeekDay={weekDays.includes(dayNum)}
            />
          )
        })}
      </div>
    </>
  )
}

export default CalendarGrid
