import { LayoutDashboard, BarChart3, ReceiptText, Plus } from 'lucide-react'
import { TABS } from '../lib/constants'

const NAV_TABS = [
  { id: TABS.DASHBOARD, label: 'Início',  Icon: LayoutDashboard },
  { id: TABS.BILLS,     label: 'Contas',  Icon: ReceiptText },
  { id: TABS.ANALYTICS, label: 'Análise', Icon: BarChart3 },
]

export function TabBar({ activeTab, onChangeTab }) {
  return (
    <div className="flex bg-gray-200/50 p-1 rounded-2xl relative z-10 backdrop-blur-md gap-1">
      {NAV_TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          onClick={() => onChangeTab(id)}
          className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-2xl text-[9px] font-black uppercase transition-all whitespace-nowrap ${
            activeTab === id
              ? 'bg-white shadow-sm text-slate-600 ring-1 ring-black/5'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Icon size={14} className="flex-shrink-0" />
          <span className="tracking-tight">{label}</span>
        </button>
      ))}
    </div>
  )
}

export function BottomNav({ activeTab, onChangeTab, onAddNew }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-gray-100 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
      <div className="grid grid-cols-4 items-end w-full">

        <NavButton
          label="Início"
          Icon={LayoutDashboard}
          active={activeTab === TABS.DASHBOARD}
          onClick={() => onChangeTab(TABS.DASHBOARD)}
        />

        <NavButton
          label="Contas"
          Icon={ReceiptText}
          active={activeTab === TABS.BILLS}
          onClick={() => onChangeTab(TABS.BILLS)}
        />

        <NavButton
          label="Análise"
          Icon={BarChart3}
          active={activeTab === TABS.ANALYTICS}
          onClick={() => onChangeTab(TABS.ANALYTICS)}
        />

        {/* Botão + na última coluna */}
        <div className="flex flex-col items-center pb-2">
          <button
            onClick={onAddNew}
            className="w-14 h-14 -mt-5 bg-slate-900 rounded-full shadow-lg shadow-slate-200 flex items-center justify-center active:scale-90 transition-all hover:bg-slate-800 border-4 border-white"
          >
            <Plus size={24} className="text-white" strokeWidth={3} />
          </button>
          <span className="text-[8px] font-black text-slate-600 uppercase tracking-wide mt-1">Novo</span>
        </div>

      </div>
    </nav>
  )
}

function NavButton({ label, Icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center w-full py-2 transition-all active:scale-90 ${
        active ? 'text-slate-600' : 'text-gray-400'
      }`}
    >
      <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
      <span className={`text-[9px] font-black uppercase tracking-wide mt-0.5 ${
        active ? 'text-slate-600' : 'text-gray-400'
      }`}>
        {label}
      </span>
    </button>
  )
}