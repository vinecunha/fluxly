/**
 * Utilitários centralizados de formatação
 * Elimina duplicação de fmt, fmtK, fmtFull em todo o projeto
 */

export const fmt = (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export const fmtK = (v) => {
  if (Math.abs(v) >= 1000) return `R$${(v / 1000).toFixed(1)}k`
  return `R$${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`
}

export const fmtFull = (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export const fmtShort = (v) => {
  if (v >= 1000) return `R$${(v/1000).toFixed(1)}k`
  return `R$${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export const fmtCurrency = (v) => Number(v||0).toLocaleString('pt-BR', {style:'currency', currency:'BRL'})

export const fmtDate = (dateStr, options = {}) => {
  if (!dateStr) return '--'
  const d = new Date(dateStr + 'T12:00:00')
  return isNaN(d.getTime()) ? '--' : d.toLocaleDateString('pt-BR', options)
}

export const fmtDateShort = (dateStr) => fmtDate(dateStr, { day: '2-digit', month: '2-digit' })

export const fmtDateLong = (dateStr) => fmtDate(dateStr, { month: 'long', year: 'numeric' })

export const fmtMonthYear = (date) => {
  return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '').toUpperCase()
}

export const toUSDate = (dateStr) => {
  if (!dateStr) return ''
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr
  const parts = dateStr.split('/')
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`
  return dateStr
}

export const getToday = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })

/**
 * Formata valor monetário para input (centavos)
 */
export const formatCurrencyInput = (value) => {
  let numericValue = value.replace(/\D/g, '')
  if (numericValue === '') return ''
  const numeric = parseInt(numericValue, 10) / 100
  return numeric.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

/**
 * Converte valor formatado para número
 */
export const parseCurrencyValue = (formattedValue) => {
  if (!formattedValue) return 0
  const numeric = formattedValue
    .replace(/[^\d,]/g, '')
    .replace(',', '.')
  return parseFloat(numeric) || 0
}

/**
 * Paleta de cores para gráficos
 */
export const PALETTE = [
  '#1e293b', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316',
  '#64748b', '#a78bfa', '#34d399', '#fbbf24', '#fb923c',
]
