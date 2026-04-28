import { TrendingUp, TrendingDown, PiggyBank } from 'lucide-react'

export const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
export const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export const TAB_CONFIG = {
  gasto:        { color: 'text-rose-500',    bg: 'bg-rose-50',    bar: 'bg-rose-400',    label: 'Gastos',  prefix: '-', Icon: TrendingDown },
  renda:        { color: 'text-emerald-600', bg: 'bg-emerald-50', bar: 'bg-emerald-400', label: 'Renda',   prefix: '+', Icon: TrendingUp   },
  investimento: { color: 'text-blue-500',    bg: 'bg-blue-50',    bar: 'bg-blue-400',    label: 'Reserva', prefix: '',  Icon: PiggyBank    },
}

export const fmt = (v) => {
  if (v >= 1000) return `R$${(v/1000).toFixed(1)}k`
  return `R$${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export const fmtFull = (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export const getDayValue = (data, isInvestimento, activeTab) => {
  if (!data) return 0
  return isInvestimento ? (activeTab === 'investimento' ? data.entrada : data.entrada + data.saida) : data.entrada + data.saida
}

export const calculateMaxDay = (dayMap, isInvestimento) => {
  const vals = Object.values(dayMap).map(d => isInvestimento ? Math.max(d.entrada, d.saida) : d.entrada + d.saida)
  return Math.max(...vals, 1)
}
