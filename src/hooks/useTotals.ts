import { useMemo } from 'react'
import type { Transaction, Totals } from '../types'
import { getTodayString, getWeekRange } from '../lib/dateHelpers'

export function useTotals(data: Transaction[], currentDate: Date): Totals {
  const todayStr = getTodayString()

  return useMemo(() => {
    const { segundaFeira, domingo } = getWeekRange(todayStr)
    const viewMonth = currentDate.getMonth()
    const viewYear  = currentDate.getFullYear()

    return (data || []).reduce((acc, t) => {
      if (t.tipo === 'pagamento_cartao') return acc

      const v     = Number(t.valor) || 0
      const tDate = new Date(t.data + 'T12:00:00')
      const pDate = t.pago_em ? new Date(t.pago_em) : null

      const isDueThisMonth  = tDate.getMonth() === viewMonth && tDate.getFullYear() === viewYear
      const isPaidThisMonth = pDate && pDate.getMonth() === viewMonth && pDate.getFullYear() === viewYear

      const pDateStr       = pDate ? pDate.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }) : null
      const isPaidToday    = pDateStr === todayStr
      const isPaidThisWeek = pDate && pDate >= segundaFeira && pDate <= domingo

      if (t.tipo === 'reserva') {
        acc.reservaTotal += v
        return acc
      }

      if (t.tipo === 'renda') {
        if (isDueThisMonth || isPaidThisMonth) acc.renda       += v
        if (isPaidToday)                       acc.rendaHoje   += v
        if (isPaidThisWeek)                    acc.rendaSemana += v
        return acc
      }

      if (isDueThisMonth || isPaidThisMonth) {
        acc.gastosTotal += v
        if (t.tipo === 'gasto_diario' || t.pago) acc.gastosPagos += v
      }
      if (isPaidToday    && (t.tipo === 'gasto_diario' || t.pago)) acc.gastosHoje   += v
      if (isPaidThisWeek && (t.tipo === 'gasto_diario' || t.pago)) acc.gastosSemana += v

      return acc
    }, {
      renda: 0, rendaHoje: 0, rendaSemana: 0,
      gastosTotal: 0, gastosHoje: 0, gastosSemana: 0,
      gastosPagos: 0, reservaTotal: 0,
    })
  }, [data, currentDate, todayStr])
}