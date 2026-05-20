import { useState } from 'react'
import { Bell, X } from 'lucide-react'
import { usePushNotifications } from '@hooks/usePushNotifications'

export function NotificationPrompt() {
  const { permission, requestPermission } = usePushNotifications()
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('fluxly_notif_dismissed') === '1'
  )

  if (permission !== 'default' || dismissed) return null

  const handleDismiss = () => {
    localStorage.setItem('fluxly_notif_dismissed', '1')
    setDismissed(true)
  }

  const handleAllow = async () => {
    const result = await requestPermission()
    if (result !== 'default') setDismissed(true)
  }

  return (
    <div className="mx-4 mb-4 bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-lg shadow-blue-200 animate-in slide-in-from-top duration-300">
      <div className="bg-white/20 p-2.5 rounded-xl flex-shrink-0">
        <Bell size={20} className="text-white" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white leading-tight">Ativar lembretes de vencimento</p>
        <p className="text-xs text-blue-100 mt-0.5">Receba avisos antes das contas vencerem.</p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleAllow}
          className="bg-white text-blue-600 text-xs font-bold uppercase px-5 py-2.5 rounded-xl active:scale-95 transition-all hover:bg-blue-50 shadow-md"
        >
          Ativar
        </button>
        <button
          onClick={handleDismiss}
          className="text-white/60 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-lg"
          aria-label="Dispensar"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}