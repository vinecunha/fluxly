import { TrendingUp, AlertCircle, AlertTriangle, ChevronDown, X } from 'lucide-react'
import { AlertsSection } from './AlertsSection'
import { UI_ACTIONS } from '../lib/constants'

export function AlertBanner({ overdueCount, todayCount, showAlerts, dispatch, onQuickPay, transactions, isSaving }) {
  if (showAlerts) {
    return (
      <div className="relative">
        {/* Botão fechar fixo no topo direito do painel */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Alertas</p>
          <button
            onClick={() => dispatch({ type: UI_ACTIONS.TOGGLE_ALERTS })}
            className="flex items-center gap-1 bg-gray-100 text-gray-500 text-[9px] font-black uppercase px-2.5 py-1.5 rounded-xl active:scale-90 transition-all"
            style={{ minHeight: 32 }}>
            <X size={11} />
            Fechar
          </button>
        </div>
        <AlertsSection transactions={transactions} onQuickPay={onQuickPay} isSaving={isSaving} />
      </div>
    )
  }

  const hasAlerts = overdueCount > 0 || todayCount > 0

  return (
    <button
      onClick={() => dispatch({ type: UI_ACTIONS.TOGGLE_ALERTS })}
      className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all active:scale-[0.98] ${
        overdueCount > 0
          ? 'bg-rose-50 border-rose-100'
          : todayCount > 0
          ? 'bg-amber-50 border-amber-100'
          : 'bg-white border-gray-100 shadow-sm'
      }`}
      style={{ minHeight: 52 }}
    >
      <div className="flex items-center gap-2.5">
        {overdueCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="bg-rose-100 p-1.5 rounded-xl">
              <AlertCircle size={13} className="text-rose-600" />
            </div>
            <div>
              <span className="text-[10px] font-black text-rose-600 uppercase leading-none block">
                {overdueCount} atrasada{overdueCount !== 1 ? 's' : ''}
              </span>
              <span className="text-[8px] text-rose-400 font-bold uppercase">Vencidas</span>
            </div>
          </div>
        )}
        {todayCount > 0 && (
          <div className={`flex items-center gap-2 ${overdueCount > 0 ? 'pl-2.5 border-l border-amber-200' : ''}`}>
            <div className="bg-amber-100 p-1.5 rounded-xl">
              <AlertTriangle size={13} className="text-amber-600" />
            </div>
            <div>
              <span className="text-[10px] font-black text-amber-600 uppercase leading-none block">
                {todayCount} hoje
              </span>
              <span className="text-[8px] text-amber-400 font-bold uppercase">Atenção</span>
            </div>
          </div>
        )}
        {!hasAlerts && (
          <div className="flex items-center gap-2">
            <div className="bg-emerald-100 p-1.5 rounded-xl">
              <TrendingUp size={13} className="text-emerald-600" />
            </div>
            <span className="text-[10px] font-black text-emerald-600 uppercase">Sem alertas</span>
          </div>
        )}
      </div>

      <div className={`flex items-center gap-1 text-[9px] font-black uppercase px-2.5 py-1.5 rounded-xl ${
        overdueCount > 0 ? 'bg-rose-100 text-rose-600'
        : todayCount > 0 ? 'bg-amber-100 text-amber-600'
        : 'bg-gray-100 text-gray-500'
      }`}>
        Ver
        <ChevronDown size={10} />
      </div>
    </button>
  )
}