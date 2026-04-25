import { useMemo } from 'react'
import type { Transaction } from '../types'
import { getTodayString } from '../lib/dateHelpers'

export function useAlerts(data: Transaction[]) {
  const todayStr = getTodayString()

  return useMemo(() => {
    const all = data || []
    const overdueCount = all.filter(
      t => t.tipo !== 'renda' && !t.pago && new Date(t.data + 'T23:59:59') < new Date()
    ).length
    const todayCount = all.filter(
      t => t.tipo !== 'renda' && !t.pago && t.data === todayStr
    ).length
    return { overdueCount, todayCount }
  }, [data, todayStr])
}