import React from 'react'
import { WifiOff } from 'lucide-react'

export function OfflineBanner() {
  return (
    <div className="fixed top-0 left-0 right-0 z-[200] bg-gray-900 text-white px-4 py-2 flex items-center justify-center gap-2 text-xs font-bold">
      <WifiOff size={14} />
      Você está offline. Algumas ações não estão disponíveis.
    </div>
  )
}
