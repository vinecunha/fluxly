import { useMemo } from 'react'
import { getTodayString, getWeekRange } from '../lib/dateHelpers'

export function useTotals(data, currentDate) {
  const todayStr = getTodayString()

  return useMemo(() => {
    // Calculamos o range da semana atual baseada no dia de HOJE real
    const { segundaFeira, domingo } = getWeekRange(todayStr)
    const viewMonth = currentDate.getMonth()
    const viewYear = currentDate.getFullYear()

    return (data || []).reduce((acc, t) => {
      const v = Number(t.valor) || 0
      // Garantimos que a data seja tratada sem problemas de fuso horário
      const tDate = new Date(t.data + 'T12:00:00')
      const pDate = t.data_pagamento ? new Date(t.data_pagamento + 'T12:00:00') : null

      // Lógica de Mês (para o total do Dashboard)
      const isDueThisMonth = tDate.getMonth() === viewMonth && tDate.getFullYear() === viewYear
      const isPaidThisMonth = pDate && pDate.getMonth() === viewMonth && pDate.getFullYear() === viewYear
      
      // Lógica Temporal Real (Hoje e Semana independem do mês que você está olhando)
      const isToday = t.data === todayStr
      const isThisWeek = tDate >= segundaFeira && tDate <= domingo

      // 1. Reservas (Independe de data, é saldo acumulado)
      if (t.tipo === 'reserva') {
        acc.reservaTotal += v
        return acc
      }

      // 2. Renda
      if (t.tipo === 'renda') {
        // Acumula no mês visualizado
        if (isDueThisMonth || isPaidThisMonth) acc.renda += v
        // Acumula no Hoje/Semana real (independente do mês selecionado)
        if (isToday) acc.rendaHoje += v
        if (isThisWeek) acc.rendaSemana += v
      } 
      // 3. Gastos
      else {
        // Acumula no mês visualizado
        if (isDueThisMonth || isPaidThisMonth) {
          acc.gastosTotal += v
          if (t.tipo === 'gasto_diario' || t.pago) acc.gastosPagos += v
        }
        // Acumula no Hoje/Semana real
        if (isToday) acc.gastosHoje += v
        if (isThisWeek) acc.gastosSemana += v
      }

      return acc
    }, {
      renda: 0, rendaHoje: 0, rendaSemana: 0,
      gastosTotal: 0, gastosHoje: 0, gastosSemana: 0,
      gastosPagos: 0, reservaTotal: 0,
    })
  }, [data, currentDate, todayStr])
}