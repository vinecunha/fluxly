export type TransactionType = 
  | 'gasto_diario' 
  | 'fixa' 
  | 'esporadica' 
  | 'renda' 
  | 'reserva' 
  | 'retirada' 
  | 'pagamento_cartao'

export interface Transaction {
  id: string
  user_id: string
  descricao: string
  valor: number
  tipo: TransactionType
  data: string
  pago: boolean
  cartao_id?: string
  recorrencia_id?: string
  data_pagamento?: string | null
  categoria?: string
  created_at?: string
  updated_at?: string
}

export interface Cartao {
  id: string
  user_id: string
  nome: string
  limite: number
  dia_fechamento: number
  dia_vencimento: number
  cor?: string
  ativa: boolean
  created_at?: string
}

export interface Fatura {
  id: string
  user_id: string
  cartao_id: string
  mes: string
  valor_fatura: number
  valor_pago?: number
  fechada: boolean
  pago: boolean
  created_at?: string
}

export interface Meta {
  id: string
  user_id: string
  descricao: string
  valor_objetivo: number
  valor_depositado: number
  prazo: string
  ativa: boolean
  arquivada: boolean
  conta_id?: string
  created_at?: string
  updated_at?: string
}

export interface Caixinha {
  id: string
  user_id: string
  nome: string
  valor_inicial: number
  descricao?: string
  ativa: boolean
  created_at?: string
}

export interface User {
  id: string
  email: string
  created_at?: string
}

export interface Alert {
  id: string
  titulo: string
  descricao: string
  tipo: 'warning' | 'error' | 'info' | 'success'
  acao?: () => void
}

export interface ToastMessage {
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
}

export interface UndoAction {
  label: string
  restore: () => Promise<void>
  timerId: ReturnType<typeof setTimeout>
}

export interface UIState {
  isModalOpen: boolean
  editingTransaction: Transaction | null
  isSaving: boolean
  savingMessage: string
  toast: ToastMessage | null
  showAlerts: boolean
  undo: UndoAction | null
}

export type TabType = 
  | 'dashboard' 
  | 'bills' 
  | 'flow' 
  | 'analytics' 
  | 'cartoes' 
  | 'intelligence' 
  | 'metas'

export interface Totals {
  renda: number
  gastosTotal: number
  gastosPagos: number
  reservaTotal: number
  rendaHoje: number
  rendaSemana: number
  gastosHoje: number
  gastosSemana: number
}

export interface SaldoProjetado {
  saldoProjetado: number
  entradas: number
  saidas: number
}