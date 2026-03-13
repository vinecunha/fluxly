import { useMemo } from 'react'
import { getTodayString, getWeekRange } from '../lib/dateHelpers'

export function useTotals(data, currentDate) {
  const todayStr = getTodayString()

  return useMemo(() => {
    const { segundaFeira, domingo } = getWeekRange(todayStr)
    const viewMonth = currentDate.getMonth()
    const viewYear = currentDate.getFullYear()

    return (data || []).reduce((acc, t) => {
      const v = Number(t.valor) || 0
      const tDate = new Date(t.data + 'T12:00:00')
      const pDate = t.data_pagamento ? new Date(t.data_pagamento) : null

      const isDueThisMonth = tDate.getMonth() === viewMonth && tDate.getFullYear() === viewYear
      const isPaidThisMonth = pDate && pDate.getMonth() === viewMonth && pDate.getFullYear() === viewYear
      const isThisWeek = tDate >= segundaFeira && tDate <= domingo
      const isToday = t.data === todayStr

      if (t.tipo === 'reserva') {
        acc.reservaTotal += v
        return acc
      }

      if (!isDueThisMonth && !isPaidThisMonth) return acc

      if (t.tipo === 'renda') {
        acc.renda += v
        if (isToday) acc.rendaHoje += v
        if (isThisWeek) acc.rendaSemana += v
      } else {
        acc.gastosTotal += v
        if (isToday) acc.gastosHoje += v
        if (isThisWeek) acc.gastosSemana += v
        if (t.tipo === 'gasto_diario' || t.pago) acc.gastosPagos += v
      }

      return acc
    }, {
      renda: 0, rendaHoje: 0, rendaSemana: 0,
      gastosTotal: 0, gastosHoje: 0, gastosSemana: 0,
      gastosPagos: 0, reservaTotal: 0,
    })
  }, [data, currentDate, todayStr])
}
