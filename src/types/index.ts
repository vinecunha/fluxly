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
  email: string | undefined
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

export interface Diaria {
  id: string
  user_id: string
  data: string
  km_rodados: number
  hodometro_inicial?: number | null
  hodometro_final?: number | null
  horas_operacao: number
  custo_gnv: number
  volume_gnv: number
  preco_gnv?: number | null
  gnv_entries_jsonb?: any[] | null
  custo_gasolina: number
  litros_gasolina: number
  preco_gasolina?: number | null
  gasolina_entries_jsonb?: any[] | null
  ganhos: number
  outros_gastos: number
  created_at?: string
  updated_at?: string
}

export interface PerfilMotorista {
  id: string
  user_id: string
  preco_gnv?: number | null
  preco_gasolina?: number | null
  ultimo_hodometro?: number | null
  created_at?: string
  updated_at?: string
}

export interface DiariaState {
  etapa: 'km' | 'tempo' | 'gnv' | 'gasolina' | 'resumo' | 'salvo'
  km_rodados: number
  hodometro_inicial: number | null
  hodometro_final: number | null
  horas_operacao: number
  volume_gnv: number
  preco_gnv: number | null
  custo_gnv: number
  litros_gasolina: number
  preco_gasolina: number | null
  custo_gasolina: number
  ganhos: number
  km_por_hora: number
  custo_por_km: number
}

export type TabType = 
  | 'dashboard' 
  | 'bills' 
  | 'flow' 
  | 'analytics' 
  | 'cartoes' 
  | 'diarias'
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

// Re-export CSV types
export type { CSVRow, CSVColumn, PapaParseError, PapaParseMeta, ParseResult } from './csv'