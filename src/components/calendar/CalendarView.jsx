import React, { useState, useMemo, useEffect } from 'react'
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { TAB_CONFIG, fmtFull, getDayValue, calculateMaxDay } from './constants'
import { getTransactionValue, getDayCategory } from './transactionUtils'
import StatusCard from './StatusCard'
import SameDayComparison from './SameDayComparison'
import AccumulatedComparison from './AccumulatedComparison'
import CalendarHeader from './CalendarHeader'
import CalendarGrid from './CalendarGrid'
import TransactionList from './TransactionList'
import MonthlyOverview from './MonthlyOverview'

export function CalendarView({ 
  transactions = [], 
  activeTab = 'gasto', 
  currentDate, 
  onDaySelect, 
  filteredCategory, 
  allTransactions = [],
  periodType = 'month'
}) {
  const viewDate = currentDate instanceof Date ? currentDate : new Date()
  const year     = viewDate.getFullYear()
  const month    = viewDate.getMonth()
  const cfg      = TAB_CONFIG[activeTab] || TAB_CONFIG.gasto

  const isYearView = periodType === 'year' || periodType === '12months'

  const [selectedDay, setSelectedDay] = useState(
    periodType === 'today' ? today.getDate() : null
  )

  useEffect(() => {
    if (periodType === 'today') {
      setSelectedDay(new Date().getDate())
    } else if (!isYearView) {
      setSelectedDay(null)
    }
  }, [periodType, isYearView])

  const dayMap = useMemo(() => {
    if (isYearView) return {}
    const map = {}

    ;(transactions || []).forEach(t => {
      const refDate = t.data_pagamento ? new Date(t.data_pagamento).toLocaleDateString('en-CA') : t.data
      const [y, m] = refDate.split('-').map(Number)
      if (y !== year || m - 1 !== month) return

      const result = getTransactionValue(t, activeTab)
      
      if (result.matches) {
        if (!map[refDate]) map[refDate] = { entrada: 0, saida: 0, items: [] }
        if (result.isEntrada) map[refDate].entrada += result.value
        else map[refDate].saida += result.value
        map[refDate].items.push({ ...t, _isEntrada: result.isEntrada })
      }
      
      if (map[refDate]) {
        if (!map[refDate].cats) map[refDate].cats = new Set()
        const cat = getDayCategory(t, activeTab)
        if (cat) map[refDate].cats.add(cat)
      }
    })
    return map
  }, [transactions, year, month, activeTab, periodType, isYearView])

  const isInvestimento = activeTab === 'investimento'

  const maxDay = useMemo(() => {
    return calculateMaxDay(dayMap, isInvestimento)
  }, [dayMap, isInvestimento])

  const summary = useMemo(() => {
    const dias = Object.keys(dayMap)
    const diasComEntrada = dias.filter(d => dayMap[d].entrada > 0).length
    const diasComSaida   = dias.filter(d => dayMap[d].saida > 0).length
    const totalEntrada   = Object.values(dayMap).reduce((s, d) => s + d.entrada, 0)
    const totalSaida     = Object.values(dayMap).reduce((s, d) => s + d.saida, 0)
    return { diasComEntrada, diasComSaida, totalEntrada, totalSaida }
  }, [dayMap])

  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const totalCells  = Math.ceil((firstDay + daysInMonth) / 7) * 7

  const selectedKey  = selectedDay ? `${year}-${String(month + 1).padStart(2,'0')}-${String(selectedDay).padStart(2,'0')}` : null
  const selectedData = selectedKey ? dayMap[selectedKey] : null
  const valorDiaSelecionado = selectedData ? getDayValue(selectedData, isInvestimento, activeTab) : 0

  const weekDays = useMemo(() => {
    if (periodType !== 'week') return []
    const now = new Date()
    const day = now.getDay()
    const diffToMonday = day === 0 ? -6 : 1 - day
    const days = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday + i)
      if (d.getMonth() === month && d.getFullYear() === year) {
        days.push(d.getDate())
      }
    }
    return days
  }, [periodType, month, year])

  if (isYearView) {
    return (
      <MonthlyOverview
        allTransactions={allTransactions}
        activeTab={activeTab}
        currentDate={currentDate}
        periodType={periodType}
      />
    )
  }

  return (
    <div className="space-y-3">
      {/* Calendário */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <CalendarHeader 
          cfg={cfg} 
          year={year} 
          month={month} 
          filteredCategory={filteredCategory} 
          isInvestimento={isInvestimento} 
          summary={summary} 
        />

        <CalendarGrid 
          year={year}
          month={month}
          firstDay={firstDay}
          daysInMonth={daysInMonth}
          totalCells={totalCells}
          dayMap={dayMap}
          maxDay={maxDay}
          cfg={cfg}
          isInvestimento={isInvestimento}
          selectedDay={selectedDay}
          setSelectedDay={setSelectedDay}
          onDaySelect={onDaySelect}
          filteredCategory={filteredCategory}
          weekDays={weekDays}
        />

        {isInvestimento && (
          <div className="flex items-center justify-center gap-3 px-3 py-2 border-t border-gray-50">
            <div className="flex items-center gap-1">
              <ArrowUpRight size={8} className="text-emerald-500" />
              <span className="text-[7px] font-bold text-gray-400 uppercase">Entrada</span>
            </div>
            <div className="flex items-center gap-1">
              <ArrowDownLeft size={8} className="text-rose-500" />
              <span className="text-[7px] font-bold text-gray-400 uppercase">Saída</span>
            </div>
          </div>
        )}
      </div>

      {/* Painel de análise do dia selecionado */}
      {selectedData && selectedDay && (
        <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
          <StatusCard
            dayValue={valorDiaSelecionado}
            dayNumber={selectedDay}
            dayType={activeTab}
            currentDate={currentDate}
          />
          
          <TransactionList 
            items={selectedData.items} 
            isInvestimento={isInvestimento} 
            cfg={cfg} 
          />
          
          <SameDayComparison
            dayValue={valorDiaSelecionado}
            dayNumber={selectedDay}
            dayType={activeTab}
            currentDate={currentDate}
            allTransactions={allTransactions}
          />
          
          <AccumulatedComparison
            dayNumber={selectedDay}
            dayType={activeTab}
            currentDate={currentDate}
            allTransactions={allTransactions}
          />
        </div>
      )}
    </div>
  )
}

export default CalendarView
