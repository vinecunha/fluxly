import type { Transaction } from '../types'
import { isInPeriod } from '../lib/periodHelpers'
import type { PeriodState } from '../lib/periodHelpers'
import { useMemo } from 'react'

export function useFilteredData(data: Transaction[], period: PeriodState): Transaction[] {
  return useMemo(() => {
    return (data || []).filter(t => isInPeriod(t.data, t.data_pagamento ?? null, period))
  }, [data, period])
}