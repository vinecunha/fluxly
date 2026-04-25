import type { Transaction } from '../types'
import { isInMonth } from '../lib/dateHelpers'
import { useMemo } from 'react'

export function useFilteredData(data: Transaction[], currentDate: Date): Transaction[] {
  return useMemo(() => {
    const viewMonth = currentDate.getMonth()
    const viewYear = currentDate.getFullYear()
    return (data || []).filter(t => isInMonth(t.data, t.pago_em, viewMonth, viewYear))
  }, [data, currentDate])
}