import { useMemo } from 'react'
import type { Transaction } from '../types'

export function useIntelligenceInsights(_allTransactions: Transaction[] = [], _currentDate: Date) {
  return {
    saude: { score: 0, nivel: 'Bom', cor: 'blue', criterios: [] },
    previsao: null,
    gastoLivre: null,
    alertasGastos: [],
    diasCriticos: [],
    totais: { renda: 0, gastosTotal: 0, gastosPagos: 0, reserva: 0 },
    diaHoje: 1,
    daysInMonth: 30,
    diasRestantes: 30,
  }
}