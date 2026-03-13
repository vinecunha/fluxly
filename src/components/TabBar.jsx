import { LayoutDashboard, BarChart3, ReceiptText } from 'lucide-react'

const ICONS = {
  dashboard: LayoutDashboard,
  analytics: BarChart3,
  bills: ReceiptText,
}

const TABS = [
  { id: 'dashboard', label: 'Início' },
  { id: 'analytics', label: 'Análise' },
  { id: 'bills', label: 'Contas' },
]

export function TabBar({ activeTab, onTabChange }) {
  return (
    <div className="flex bg-gray-200/50 p-1 rounded-[1.8rem] mb-6 relative z-10 backdrop-blur-md gap-1">
      {TABS.map(({ id, label }) => {
        const Icon = ICONS[id]
        return (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-[1.2rem] text-[9px] font-black uppercase transition-all whitespace-nowrap ${
              activeTab === id
                ? 'bg-white shadow-sm text-indigo-600 ring-1 ring-black/5'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={14} className="flex-shrink-0" />
            <span className="tracking-tight">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
