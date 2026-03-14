import { useMemo } from 'react'
import { getTodayString, getWeekRange } from '../lib/dateHelpers'

export function useTotals(data, currentDate) {
  const todayStr = getTodayString()

  return useMemo(() => {
    const { segundaFeira, domingo } = getWeekRange(todayStr)
    const viewMonth = currentDate.getMonth()
    const viewYear  = currentDate.getFullYear()

    return (data || []).reduce((acc, t) => {
      // pagamento_cartao é quitação de dívida, não é gasto novo — ignora nos totais
      if (t.tipo === 'pagamento_cartao') return acc

      const v     = Number(t.valor) || 0
      const tDate = new Date(t.data + 'T12:00:00')
      const pDate = t.data_pagamento ? new Date(t.data_pagamento + 'T12:00:00') : null

      const isDueThisMonth  = tDate.getMonth() === viewMonth && tDate.getFullYear() === viewYear
      const isPaidThisMonth = pDate && pDate.getMonth() === viewMonth && pDate.getFullYear() === viewYear

      const isToday    = t.data === todayStr
      const isThisWeek = tDate >= segundaFeira && tDate <= domingo

      // 1. Reservas — saldo acumulado, independe de mês
      if (t.tipo === 'reserva') {
        acc.reservaTotal += v
        return acc
      }

      // 2. Renda
      if (t.tipo === 'renda') {
        if (isDueThisMonth || isPaidThisMonth) acc.renda += v
        if (isToday)    acc.rendaHoje   += v
        if (isThisWeek) acc.rendaSemana += v
        return acc
      }

      // 3. Gastos (gasto_diario, fixa, esporadica)
      if (isDueThisMonth || isPaidThisMonth) {
        acc.gastosTotal += v
        if (t.tipo === 'gasto_diario' || t.pago) acc.gastosPagos += v
      }
      if (isToday)    acc.gastosHoje   += v
      if (isThisWeek) acc.gastosSemana += v

      return acc
    }, {
      renda: 0, rendaHoje: 0, rendaSemana: 0,
      gastosTotal: 0, gastosHoje: 0, gastosSemana: 0,
      gastosPagos: 0, reservaTotal: 0,
    })
  }, [data, currentDate, todayStr])
}