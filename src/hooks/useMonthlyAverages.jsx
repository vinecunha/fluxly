import { useMemo } from 'react'

/**
 * useMonthlyAverages
 *
 * Calcula a média mensal dos últimos N meses (excluindo o mês atual)
 * por categoria, para exibir ao lado do valor atual no FinancialAnalytics.
 *
 * @param {Array}  allTransactions - todas as transações do usuário
 * @param {number} months          - quantos meses passados considerar (padrão: 3)
 * @returns {Object} { averageByCategory, averageRenda, averageDespesas }
 *
 * averageByCategory: { [categoria]: number }
 */
export function useMonthlyAverages(allTransactions, months = 3) {
  return useMemo(() => {
    if (!allTransactions?.length) {
      return { averageByCategory: {}, averageRenda: 0, averageDespesas: 0 }
    }

    const now = new Date()
    const targetMonths = []

    // Monta os N meses anteriores ao atual
    for (let i = 1; i <= months; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      targetMonths.push({ month: d.getMonth(), year: d.getFullYear() })
    }

    const categoryTotals = {}   // { categoria: { [monthKey]: number } }
    const rendaTotals = {}       // { monthKey: number }
    const despesasTotals = {}    // { monthKey: number }

    for (const t of allTransactions) {
      const d = new Date(t.data + 'T12:00:00')
      const match = targetMonths.find(m => m.month === d.getMonth() && m.year === d.getFullYear())
      if (!match) continue

      const monthKey = `${match.year}-${match.month}`
      const v = Number(t.valor) || 0

      if (t.tipo === 'renda') {
        rendaTotals[monthKey] = (rendaTotals[monthKey] || 0) + v
      } else if (t.tipo !== 'reserva') {
        despesasTotals[monthKey] = (despesasTotals[monthKey] || 0) + v

        if (t.categoria) {
          if (!categoryTotals[t.categoria]) categoryTotals[t.categoria] = {}
          categoryTotals[t.categoria][monthKey] = (categoryTotals[t.categoria][monthKey] || 0) + v
        }
      }
    }

    // Calcula médias por categoria
    const averageByCategory = {}
    for (const [cat, monthMap] of Object.entries(categoryTotals)) {
      const values = Object.values(monthMap)
      averageByCategory[cat] = values.reduce((a, b) => a + b, 0) / months
    }

    const rendaValues = Object.values(rendaTotals)
    const despesasValues = Object.values(despesasTotals)

    const averageRenda = rendaValues.length
      ? rendaValues.reduce((a, b) => a + b, 0) / months
      : 0

    const averageDespesas = despesasValues.length
      ? despesasValues.reduce((a, b) => a + b, 0) / months
      : 0

    return { averageByCategory, averageRenda, averageDespesas }
  }, [allTransactions, months])
}