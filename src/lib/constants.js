export const AUTO_PAID_TYPES = ['gasto_diario', 'renda', 'reserva', 'retirada', 'pagamento_cartao']

export const TABS = {
  DASHBOARD: 'dashboard',
  BILLS:     'bills',
  FLOW:      'flow',
  ANALYTICS: 'analytics',
  CARTOES:   'cartoes',
}

export const TRANSACTION_TYPES = [
  { id: 'gasto_diario', label: 'Gasto Diário' },
  { id: 'fixa', label: 'Conta Fixa' },
  { id: 'esporadica', label: 'Gasto Esporádico' },
  { id: 'renda', label: 'Renda/Entrada' },
  { id: 'reserva', label: 'Reserva' },
  { id: 'pagamento_cartao', label: 'Pagamento de Fatura' },
]

export const UI_ACTIONS = {
  OPEN_MODAL:   'OPEN_MODAL',
  CLOSE_MODAL:  'CLOSE_MODAL',
  START_SAVING: 'START_SAVING',
  STOP_SAVING:  'STOP_SAVING',
  SHOW_TOAST:   'SHOW_TOAST',
  CLEAR_TOAST:  'CLEAR_TOAST',
  TOGGLE_ALERTS:'TOGGLE_ALERTS',
  SET_UNDO:     'SET_UNDO',
  CLEAR_UNDO:   'CLEAR_UNDO',
}