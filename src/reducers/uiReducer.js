import { UI_ACTIONS } from '../lib/constants'

export const initialUIState = {
  isModalOpen: false,
  editingTransaction: null,
  isSaving: false,
  savingMessage: '',
  toast: null,        // { message: string, type: 'success' | 'error' }
  showAlerts: false,
  undo: null,         // { label: string, restore: Function, timerId: number }
}

export function uiReducer(state, action) {
  switch (action.type) {
    case UI_ACTIONS.OPEN_MODAL:
      return { ...state, isModalOpen: true, editingTransaction: action.payload ?? null }
    case UI_ACTIONS.CLOSE_MODAL:
      return { ...state, isModalOpen: false, editingTransaction: null }
    case UI_ACTIONS.START_SAVING:
      return { ...state, isSaving: true, savingMessage: action.payload ?? 'Salvando...' }
    case UI_ACTIONS.STOP_SAVING:
      return { ...state, isSaving: false, savingMessage: '' }
    case UI_ACTIONS.SHOW_TOAST:
      return { ...state, toast: { message: action.payload.message, type: action.payload.type ?? 'error' } }
    case UI_ACTIONS.CLEAR_TOAST:
      return { ...state, toast: null }
    case UI_ACTIONS.TOGGLE_ALERTS:
      return { ...state, showAlerts: !state.showAlerts }
    case UI_ACTIONS.SET_UNDO:
      return { ...state, undo: action.payload }
    case UI_ACTIONS.CLEAR_UNDO:
      return { ...state, undo: null }
    default:
      return state
  }
}