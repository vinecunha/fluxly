import { Loader2 } from 'lucide-react'

export function SavingSplash({ message = 'Salvando...' }) {
  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl px-8 py-6 shadow-2xl flex flex-col items-center gap-3 animate-in zoom-in-95 duration-200">
        <Loader2 size={28} className="text-indigo-600 animate-spin" />
        <p className="text-sm font-black text-gray-700 uppercase tracking-wide">{message}</p>
      </div>
    </div>
  )
}