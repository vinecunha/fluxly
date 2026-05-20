import { useState } from 'react'
import { Bell, X } from 'lucide-react'
import { usePushNotifications } from '@hooks/usePushNotifications'

/**
 * NotificationPrompt
 *
 * Exibe um banner discreto pedindo permissão de notificações.
 * Aparece uma vez; o usuário pode dispensar permanentemente.
 * Coloque no App.jsx logo abaixo do OfflineBanner.
 */
export function NotificationPrompt() {
  const { permission, requestPermission } = usePushNotifications()
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('fluxly_notif_dismissed') === '1'
  )

  // Não mostra se já tem permissão, negou, ou dispensou o banner
  if (permission !== 'default' || dismissed) return null

  const handleDismiss = () => {
    localStorage.setItem('fluxly_notif_dismissed', '1')
    setDismissed(true)
  }

  const handleAllow = async () => {
    const result = await requestPermission()
    if (result !== 'default') setDismissed(true) // sai do banner após decisão
  }

  return (
    <div className="mx-4 mb-3 bg-slate-50 border border-slate-100 rounded-2xl-2xl px-4 py-3 flex items-center gap-3 animate-in slide-in-from-top duration-300">
      <div className="bg-slate-100 p-2 rounded-2xl-xl flex-shrink-0">
        <Bell size={16} className="text-slate-600" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-black text-slate-800 leading-tight">Ativar lembretes de vencimento</p>
        <p className="text-[10px] text-slate-500 mt-0.5">Receba avisos antes das contas vencerem.</p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleAllow}
          className="bg-slate-900 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-2xl-xl active:scale-95 transition-all"
        >
          Ativar
        </button>
        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-slate-600 transition-colors p-1"
          aria-label="Dispensar"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}