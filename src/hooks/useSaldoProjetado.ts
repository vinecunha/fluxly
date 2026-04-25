import { useMemo } from 'react'
import type { Transaction, SaldoProjetado } from '../types'
import { getTodayString } from '../lib/dateHelpers'

interface FaturaInfo {
  saldo?: number
  venc?: Date
}

export function useSaldoProjetado(transactions: Transaction[], faturas: FaturaInfo[], currentDate: Date): SaldoProjetado {
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
      const pDate = t.pago_em ? new Date(t.pago_em + 'T12:00:00') : null

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
        return
      }

      if (pago) {
        gastosConfirmados += v
        if (isHoje) gastosHoje += v
      } else {
        if (tDate <= ultimoDia) pendentesSaida += v
      }
    })

    let faturasPendentes = 0
    ;(faturas || []).forEach(fat => {
      if (!fat) return
      const saldo = fat.saldo || 0
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

    const daysInMonth   = ultimoDia.getDate()
    const currentDay    = isCurrentMonth ? hoje.getDate() : daysInMonth
    const diasRestantes = Math.max(daysInMonth - currentDay, 0)

    const mediaDiariaGasto = currentDay > 0 ? gastosConfirmados / currentDay : 0
    const projecaoGastos   = gastosConfirmados + mediaDiariaGasto * diasRestantes

    return {
      saldoAtual,
      saldoProjetado,
      saldoHoje,
      entradas: rendaConfirmada,
      saidas: gastosConfirmados,
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