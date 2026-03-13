import { useEffect, useRef } from 'react'
import { Undo2 } from 'lucide-react'
import { UI_ACTIONS } from '../lib/constants'

const UNDO_TIMEOUT = 5000

/**
 * UndoToast
 *
 * Aparece quando há uma ação pendente de desfazer.
 * Mostra uma barra de progresso que vai a zero em 5s.
 * Se o usuário clicar em "Desfazer", chama undo.restore().
 *
 * Props:
 *   undo: { label: string, restore: Function, timerId: number } | null
 *   dispatch: Function
 */
export function UndoToast({ undo, dispatch }) {
  const barRef = useRef(null)

  useEffect(() => {
    if (!undo || !barRef.current) return

    // Anima a barra de progresso de 100% para 0%
    const el = barRef.current
    el.style.transition = 'none'
    el.style.width = '100%'

    // Força reflow para a animação iniciar corretamente
    void el.offsetWidth

    el.style.transition = `width ${UNDO_TIMEOUT}ms linear`
    el.style.width = '0%'
  }, [undo])

  if (!undo) return null

  const handleUndo = () => {
    undo.restore()
    dispatch({ type: UI_ACTIONS.CLEAR_UNDO })
  }

  return (
    <div className="fixed bottom-28 left-4 right-4 z-50 bg-gray-900 text-white rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      {/* Barra de progresso */}
      <div
        ref={barRef}
        className="h-0.5 bg-indigo-400"
        style={{ width: '100%' }}
      />

      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm font-medium truncate pr-2">{undo.label}</span>
        <button
          onClick={handleUndo}
          className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-400 active:scale-95 transition-all px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wide flex-shrink-0"
        >
          <Undo2 size={13} />
          Desfazer
        </button>
      </div>
    </div>
  )
}