import { useMemo } from 'react'
import { isInMonth } from '../lib/dateHelpers'

export function useFilteredData(data, currentDate) {
  return useMemo(() => {
    const viewMonth = currentDate.getMonth()
    const viewYear = currentDate.getFullYear()
    return (data || []).filter(t => isInMonth(t.data, t.data_pagamento, viewMonth, viewYear))
  }, [data, currentDate])
}
