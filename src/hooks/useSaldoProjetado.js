import { useMemo } from 'react'
import { getTodayString } from '../lib/dateHelpers'

/**
 * Calcula o saldo projetado para o fim do mês atual.
 *
 * Lógica:
 *  - Renda confirmada (já recebida)
 *  - + Fixas/recorrentes com vencimento futuro no mês (estimativa de entrada se for renda futura)
 *  - - Gastos já pagos
 *  - - Fixas/esporádicas pendentes com vencimento até fim do mês
 *  - - Faturas de cartão pendentes (saldo a pagar)
 *
 * Retorna também o "saldo de hoje" (o que entrou menos o que saiu hoje).
 */
export function useSaldoProjetado(transactions, faturas, currentDate) {
  const todayStr = getTodayString()

  return useMemo(() => {
    const hoje  = new Date(todayStr + 'T12:00:00')
    const viewM = currentDate.getMonth()
    const viewY = currentDate.getFullYear()
    const now   = new Date()
    const isCurrentMonth = now.getMonth() === viewM && now.getFullYear() === viewY

    const ultimoDia = new Date(viewY, viewM + 1, 0)

    let rendaConfirmada  = 0
    let gastosConfirmados = 0
    let pendentesSaida   = 0
    let rendaHoje        = 0
    let gastosHoje       = 0

    ;(transactions || []).forEach(t => {
      if (t.tipo === 'pagamento_cartao' || t.tipo === 'reserva') return

      const v     = Math.abs(Number(t.valor) || 0)
      const tDate = new Date(t.data + 'T12:00:00')
      const pDate = t.data_pagamento ? new Date(t.data_pagamento + 'T12:00:00') : null

      const noMes = tDate.getMonth() === viewM && tDate.getFullYear() === viewY
      if (!noMes) return

      const pago    = t.pago || t.tipo === 'gasto_diario'
      const dataRef = pago && pDate ? pDate : tDate

      const isHoje = dataRef.toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'}) === todayStr

      if (t.tipo === 'renda') {
        if (pago) {
          rendaConfirmada += v
          if (isHoje) rendaHoje += v
        }
        // renda futura não confirmada: não projetamos (conservador)
        return
      }

      // gastos
      if (pago) {
        gastosConfirmados += v
        if (isHoje) gastosHoje += v
      } else {
        // pendente: vence dentro do mês
        if (tDate <= ultimoDia) pendentesSaida += v
      }
    })

    // Faturas de cartão com saldo a pagar no mês
    let faturasPendentes = 0
    ;(faturas || []).forEach(fat => {
      if (!fat) return
      const saldo = fat.saldo || 0
      // fatura vence neste mês?
      if (fat.venc) {
        const vDate = fat.venc instanceof Date ? fat.venc : new Date(fat.venc)
        if (vDate.getMonth() === viewM && vDate.getFullYear() === viewY && saldo > 0) {
          faturasPendentes += saldo
        }
      }
    })

    const saldoAtual    = rendaConfirmada - gastosConfirmados
    const saldoProjetado = saldoAtual - pendentesSaida - faturasPendentes
    const saldoHoje     = rendaHoje - gastosHoje

    // Dias restantes no mês
    const daysInMonth   = ultimoDia.getDate()
    const currentDay    = isCurrentMonth ? hoje.getDate() : daysInMonth
    const diasRestantes = Math.max(daysInMonth - currentDay, 0)

    // Média diária de gasto atual
    const mediaDiariaGasto = currentDay > 0 ? gastosConfirmados / currentDay : 0
    // Projeção linear até fim do mês
    const projecaoGastos   = gastosConfirmados + mediaDiariaGasto * diasRestantes

    return {
      saldoAtual,
      saldoProjetado,
      saldoHoje,
      rendaConfirmada,
      gastosConfirmados,
      pendentesSaida,
      faturasPendentes,
      mediaDiariaGasto,
      projecaoGastos,
      diasRestantes,
      isCurrentMonth,
      rendaHoje,
      gastosHoje,
    }
  }, [transactions, faturas, currentDate, todayStr])
}