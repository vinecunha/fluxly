import { useMemo } from 'react'
import type { Transaction } from '../types'

interface ContaPendente extends Transaction {
  diasAteVencimento: number
  diasUtil: number
  valor: number
}

interface SaldoContaInfo {
  total?: number
  rendimento?: number
  original?: number
}

export function useIntelligence(allTransactions: Transaction[] = [], currentDate: Date) {
  const ref    = currentDate instanceof Date ? currentDate : new Date()
  const ano    = ref.getFullYear()
  const mes    = ref.getMonth()
  const mesStr = `${ano}-${String(mes + 1).padStart(2, '0')}`
  const hoje   = new Date()
  hoje.setHours(0, 0, 0, 0)

  const rendaHoje = useMemo(() => {
    const hojeStr = hoje.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
    return allTransactions
      .filter(t => t.tipo === 'renda' && t.data === hojeStr)
      .reduce((s, t) => s + (Number(t.valor) || 0), 0)
  }, [allTransactions])

  const contasPendentes = useMemo(() => {
    return allTransactions
      .filter(t => {
        if (t.tipo !== 'fixa' && t.tipo !== 'esporadica') return false
        if (t.pago) return false
        const d = new Date(t.data + 'T12:00:00')
        return d.getFullYear() === ano && d.getMonth() === mes
      })
      .map(t => {
        const venc = new Date(t.data + 'T12:00:00')
        venc.setHours(0, 0, 0, 0)
        const diasAteVencimento = Math.ceil((venc - hoje) / (1000 * 60 * 60 * 24))
        const diasUtil = Math.max(diasAteVencimento, 1)
        const valor = Number(t.valor) || 0
        return { ...t, diasAteVencimento, diasUtil, valor }
      })
      .sort((a, b) => a.diasAteVencimento - b.diasAteVencimento)
  }, [allTransactions, ano, mes])

  const enriquecerComSaldo = (saldoPorConta: Record<string, number | SaldoContaInfo> = {}) => {
    return contasPendentes.map(c => {
      const entrada    = saldoPorConta[c.id]
      const guardado   = entrada && typeof entrada === 'object' ? entrada.total : (entrada || 0)
      const falta      = Math.max(c.valor - guardado, 0)
      const porDia     = falta > 0 ? falta / Math.max(c.diasUtil, 1) : 0
      const urgente    = c.diasAteVencimento <= 2
      const quaseVence = c.diasAteVencimento <= 7
      return { ...c, guardado, falta, porDia, urgente, quaseVence }
    })
  }

  function calcularDistribuicao(rendaDisponivel: number, saldoPorConta: Record<string, number | SaldoContaInfo> = {}) {
    const contas = enriquecerComSaldo(saldoPorConta)
    let saldo = rendaDisponivel
    const resultado = []

    for (const conta of contas) {
      if (conta.falta <= 0) {
        resultado.push({ ...conta, alocar: 0, coberta: true, deficit: 0 })
        continue
      }
      if (saldo <= 0) {
        resultado.push({ ...conta, alocar: 0, coberta: false, deficit: conta.falta })
        continue
      }
      const alocar = Math.min(saldo, conta.falta)
      saldo -= alocar
      resultado.push({
        ...conta,
        alocar,
        coberta: alocar >= conta.falta,
        deficit: Math.max(conta.falta - alocar, 0),
      })
    }

    return { plano: resultado, sobra: saldo }
  }

  return { rendaHoje, mesStr, contasPendentes, enriquecerComSaldo, calcularDistribuicao }
}