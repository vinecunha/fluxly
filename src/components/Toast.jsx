import React, { useEffect } from 'react'
import { X, CheckCircle2, AlertCircle } from 'lucide-react'
import { UI_ACTIONS } from '@lib/constants'

export function Toast({ message, type = 'error', dispatch }) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => dispatch({ type: UI_ACTIONS.CLEAR_TOAST }), 3500)
    return () => clearTimeout(timer)
  }, [message, dispatch])

  if (!message) return null

  const isSuccess = type === 'success'

  return (
    <div className={`fixed bottom-28 left-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between animate-in slide-in-from-bottom-4 duration-300 ${
      isSuccess ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
    }`}>
      <div className="flex items-center gap-2">
        {isSuccess ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
        <span className="text-sm font-semibold">{message}</span>
      </div>
      <button onClick={() => dispatch({ type: UI_ACTIONS.CLEAR_TOAST })}>
        <X size={16} />
      </button>
    </div>
  )
}
