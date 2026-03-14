import { TrendingUp, AlertCircle, AlertTriangle, ChevronDown } from 'lucide-react'
import { AlertsSection } from './AlertsSection'
import { UI_ACTIONS } from '../lib/constants'

export function AlertBanner({ overdueCount, todayCount, showAlerts, dispatch, onQuickPay, transactions, isSaving }) {
  if (showAlerts) {
    return (
      <div className="relative pt-3">
        <AlertsSection transactions={transactions} onQuickPay={onQuickPay} isSaving={isSaving}/>
        <button
          onClick={() => dispatch({ type: UI_ACTIONS.TOGGLE_ALERTS })}
          className="absolute mt-5 -top-12 -right-1 bg-indigo-500 shadow-lg border border-indigo-400 p-2 rounded-2xl text-white transition-all z-30 active:scale-90"
        >
          <ChevronDown size={14} className="rotate-180" />
        </button>
      </div>
    )
  }

  return (
    <div
      onClick={() => dispatch({ type: UI_ACTIONS.TOGGLE_ALERTS })}
      className="bg-white border border-gray-100 p-3.5 rounded-2xl shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all group"
    >
      <div className="flex items-center gap-3 ml-1">
        {overdueCount > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="bg-rose-100 p-1.5 rounded-2xl flex-shrink-0">
              <AlertCircle size={14} className="text-rose-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-rose-600 uppercase tracking-tighter leading-none">{overdueCount} Atrasadas</span>
              <span className="text-[7px] text-gray-400 font-bold uppercase mt-0.5 tracking-widest">Pendentes</span>
            </div>
          </div>
        )}
        {todayCount > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="bg-amber-100 p-1.5 rounded-2xl flex-shrink-0">
              <AlertTriangle size={14} className="text-amber-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-amber-600 uppercase tracking-tighter leading-none">{todayCount} Hoje</span>
              <span className="text-[7px] text-gray-400 font-bold uppercase mt-0.5 tracking-widest">Atenção</span>
            </div>
          </div>
        )}
        {overdueCount === 0 && todayCount === 0 && (
          <div className="flex items-center gap-2">
            <div className="bg-emerald-100 p-1.5 rounded-2xl">
              <TrendingUp size={12} className="text-emerald-600" />
            </div>
            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">Sem Alertas</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1.5 text-indigo-500 font-black text-[8px] uppercase tracking-widest bg-indigo-50/50 py-2 px-3 rounded-2xl transition-all">
        Ver
        <ChevronDown size={10} />
      </div>
    </div>
  )
}
