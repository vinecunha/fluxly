export type PeriodType = 'today' | 'week' | 'month' | 'year' | '12months' | 'custom'

export interface PeriodState {
  type: PeriodType
  referenceDate: Date
  customStart?: string
  customEnd?: string
}

export interface PeriodRange {
  start: Date
  end: Date
}

function fmtDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0')
  const mon = String(d.getMonth() + 1).padStart(2, '0')
  return `${day}/${mon}`
}

function fmtMonth(d: Date): string {
  return d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '').toUpperCase()
}

function fmtMonthShort(d: Date): string {
  return d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase()
}

function toStartOfDay(d: Date): Date {
  const r = new Date(d)
  r.setHours(0, 0, 0, 0)
  return r
}

function toEndOfDay(d: Date): Date {
  const r = new Date(d)
  r.setHours(23, 59, 59, 999)
  return r
}

export function getPeriodRange(period: PeriodState): PeriodRange {
  const ref = period.referenceDate
  switch (period.type) {
    case 'today': {
      const start = toStartOfDay(ref)
      const end = toEndOfDay(ref)
      return { start, end }
    }
    case 'week': {
      const day = ref.getDay()
      const diffToMonday = day === 0 ? -6 : 1 - day
      const start = toStartOfDay(new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() + diffToMonday))
      const end = toEndOfDay(new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6))
      return { start, end }
    }
    case 'month': {
      const start = new Date(ref.getFullYear(), ref.getMonth(), 1)
      const end = toEndOfDay(new Date(ref.getFullYear(), ref.getMonth() + 1, 0))
      return { start, end }
    }
    case 'year': {
      const start = new Date(ref.getFullYear(), 0, 1)
      const end = toEndOfDay(new Date(ref.getFullYear(), 11, 31))
      return { start, end }
    }
    case '12months': {
      const end = toEndOfDay(new Date(ref.getFullYear(), ref.getMonth() + 1, 0))
      const start = toStartOfDay(new Date(end.getFullYear() - 1, end.getMonth(), 1))
      return { start, end }
    }
    case 'custom': {
      const start = period.customStart ? toStartOfDay(new Date(period.customStart + 'T12:00:00')) : new Date(0)
      const end = period.customEnd ? toEndOfDay(new Date(period.customEnd + 'T12:00:00')) : new Date()
      return { start, end }
    }
  }
}

export function getPeriodLabel(period: PeriodState): string {
  const ref = period.referenceDate
  switch (period.type) {
    case 'today':
      return `HOJE, ${ref.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '').toUpperCase()}`
    case 'week': {
      const r = getPeriodRange(period)
      return `${fmtDate(r.start)} - ${fmtDate(r.end)}`
    }
    case 'month':
      return fmtMonth(ref)
    case 'year':
      return String(ref.getFullYear())
    case '12months': {
      const r = getPeriodRange(period)
      return `${fmtMonthShort(r.start)}/${r.start.getFullYear()} - ${fmtMonthShort(r.end)}/${r.end.getFullYear()}`
    }
    case 'custom':
      return 'Personalizado'
  }
}

export function navigatePeriod(period: PeriodState, direction: -1 | 1): PeriodState {
  const ref = new Date(period.referenceDate)
  switch (period.type) {
    case 'today':
      ref.setDate(ref.getDate() + direction)
      return { ...period, referenceDate: ref }
    case 'week':
      ref.setDate(ref.getDate() + direction * 7)
      return { ...period, referenceDate: ref }
    case 'month':
      ref.setMonth(ref.getMonth() + direction)
      return { ...period, referenceDate: ref }
    case 'year':
      ref.setFullYear(ref.getFullYear() + direction)
      return { ...period, referenceDate: ref }
    case '12months':
      ref.setFullYear(ref.getFullYear() + direction)
      return { ...period, referenceDate: ref }
    case 'custom':
      return period
  }
}

export function isInPeriod(dateStr: string, paymentDateStr: string | null, period: PeriodState): boolean {
  const range = getPeriodRange(period)
  const tDate = new Date(dateStr + 'T12:00:00')
  if (tDate >= range.start && tDate <= range.end) return true
  if (paymentDateStr) {
    const pDate = new Date(paymentDateStr + 'T12:00:00')
    if (pDate >= range.start && pDate <= range.end) return true
  }
  return false
}

export function isCurrentPeriod(period: PeriodState): boolean {
  const now = new Date()
  switch (period.type) {
    case 'today':
      return period.referenceDate.toDateString() === now.toDateString()
    case 'week': {
      const cur = getPeriodRange({ type: 'week', referenceDate: now })
      const rng = getPeriodRange(period)
      return rng.start.toDateString() === cur.start.toDateString()
    }
    case 'month':
      return period.referenceDate.getMonth() === now.getMonth() && period.referenceDate.getFullYear() === now.getFullYear()
    case 'year':
      return period.referenceDate.getFullYear() === now.getFullYear()
    case '12months': {
      const cur = getPeriodRange({ type: '12months', referenceDate: now })
      const rng = getPeriodRange(period)
      return rng.start.toDateString() === cur.start.toDateString() && rng.end.toDateString() === cur.end.toDateString()
    }
    case 'custom':
      return false
  }
}

export function getCurrentDateFromPeriod(period: PeriodState): Date {
  switch (period.type) {
    case 'today':
    case 'week':
    case 'month':
      return new Date(period.referenceDate)
    case 'year':
      return new Date(period.referenceDate.getFullYear(), 0, 1)
    case '12months':
      return new Date(period.referenceDate)
    case 'custom':
      return period.customStart ? new Date(period.customStart) : new Date()
  }
}

export function createDefaultPeriod(type: PeriodType): PeriodState {
  return { type, referenceDate: new Date() }
}
