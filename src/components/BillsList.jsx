import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { 
  Calendar, CheckCircle2, Circle, Edit3, Trash2, Repeat, ArrowUp, ArrowDown, Fuel,
  ShoppingCart, Home, Car, Palmtree, Pill, GraduationCap, CreditCard, Banknote, Hexagon,
  Undo2, Tag
} from 'lucide-react'

const categoryIcons = {
  "Mercado": { icon: <ShoppingCart size={14} />, color: "bg-amber-100 text-amber-600" },
  "Casa": { icon: <Home size={14} />, color: "bg-indigo-100 text-indigo-600" },
  "Carro": { icon: <Car size={14} />, color: "bg-blue-100 text-blue-600" },
  "Combustível": { icon: <Fuel size={14} />, color: "bg-sky-100 text-sky-600" },
  "Lazer": { icon: <Palmtree size={14} />, color: "bg-emerald-100 text-emerald-600" },
  "Saúde": { icon: <Pill size={14} />, color: "bg-rose-100 text-rose-600" },
  "Educação": { icon: <GraduationCap size={14} />, color: "bg-violet-100 text-violet-600" },
  "Assinaturas": { icon: <CreditCard size={14} />, color: "bg-sky-100 text-sky-600" },
  "Empréstimos": { icon: <Banknote size={14} />, color: "bg-green-100 text-green-600" },
  "Outros": { icon: <Hexagon size={14} />, color: "bg-gray-100 text-gray-600" }
}

export const ActionConfirmationModal = ({ target, onClose, onConfirm }) => {
  if (!target) return null
  const { bill, type } = target

  const getModalConfig = () => {
    if (type === 'delete') {
      return {
        title: 'Excluir Conta',
        desc: bill.recorrencia_id ? 'Excluir toda a série ou apenas esta?' : `Excluir "${bill.descricao}"?`,
        icon: <Trash2 size={28} />,
        iconClass: 'bg-rose-50 text-rose-500',
        btnClass: 'bg-rose-600 shadow-rose-100',
        primaryLabel: 'Apenas Esta',
        secondaryLabel: 'Toda a Série'
      }
    }
    if (type === 'status') {
      if (bill.pago) {
        return {
          title: 'Reabrir Conta',
          desc: bill.recorrencia_id ? 'Reabrir toda a série ou apenas esta?' : `Reabrir "${bill.descricao}"?`,
          icon: <Undo2 size={28} />,
          iconClass: 'bg-amber-50 text-amber-500',
          btnClass: 'bg-amber-600 shadow-amber-100',
          primaryLabel: 'Apenas Esta',
          secondaryLabel: 'Toda a Série'
        }
      }
      return {
        title: 'Concluir Conta',
        desc: bill.recorrencia_id ? 'Baixar toda a série ou apenas esta?' : `Pagar "${bill.descricao}"?`,
        icon: <CheckCircle2 size={28} />,
        iconClass: 'bg-emerald-50 text-emerald-500',
        btnClass: 'bg-emerald-600 shadow-emerald-100',
        primaryLabel: 'Apenas Esta',
        secondaryLabel: 'Toda a Série'
      }
    }
    return {
      title: 'Editar Série',
      desc: 'Afetar todas as parcelas ou apenas esta?',
      icon: <Edit3 size={28} />,
      iconClass: 'bg-indigo-50 text-indigo-500',
      btnClass: 'bg-indigo-600 shadow-indigo-100',
      primaryLabel: 'Apenas Esta',
      secondaryLabel: 'Toda a Série'
    }
  }

  const config = getModalConfig()

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in" onClick={onClose} />
      <div className="relative bg-white rounded-[2.5rem] p-6 max-w-[320px] w-full shadow-2xl animate-in zoom-in duration-200">
        <div className="text-center">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${config.iconClass}`}>
            {config.icon}
          </div>
          <h3 className="text-lg font-black text-gray-800 mb-2">{config.title}</h3>
          <p className="text-gray-500 text-[11px] mb-6 leading-relaxed px-2">{config.desc}</p>
          <div className="space-y-2.5">
            <button 
              onClick={() => onConfirm(false)} 
              className={`w-full py-3.5 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest ${config.btnClass} shadow-lg active:scale-95 transition-transform`}
            >
              {config.primaryLabel}
            </button>
            {bill.recorrencia_id && (
              <button 
                onClick={() => onConfirm(true)} 
                className="w-full py-3.5 bg-gray-100 text-gray-600 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-transform"
              >
                {config.secondaryLabel}
              </button>
            )}
            <button onClick={onClose} className="w-full py-2 text-gray-400 font-bold text-[9px] uppercase tracking-widest pt-1">Cancelar</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export const BillsList = ({ transactions, allTransactions, onTogglePaid, onEdit, onDelete, isLoading }) => {
  const [sortBy, setSortBy] = useState('vencimento')
  const [isReversed, setIsReversed] = useState(false)
  const [actionTarget, setActionTarget] = useState(null)

  const rawBills = (transactions || []).filter(t => t.tipo === 'fixa' || t.tipo === 'esporadica')

  const handleSort = (type) => {
    if (sortBy === type) setIsReversed(!isReversed)
    else { setSortBy(type); setIsReversed(false); }
  }

  const sortedBills = [...rawBills].sort((a, b) => {
    let comparison = 0
    if (sortBy === 'vencimento') comparison = new Date(a.data + 'T12:00:00') - new Date(b.data + 'T12:00:00')
    else if (sortBy === 'valor') comparison = Number(a.valor) - Number(b.valor)
    else if (sortBy === 'az') comparison = a.descricao.localeCompare(b.descricao)
    return isReversed ? comparison * -1 : comparison
  })

  const getRecurrenceStats = (recorrenciaId) => {
    if (!recorrenciaId || !allTransactions) return null
    const series = allTransactions.filter(t => t.recorrencia_id === recorrenciaId)
    const total = series.length
    const paid = series.filter(t => t.pago).length
    const lastDate = series.length > 0 
      ? new Date(Math.max(...series.map(t => new Date(t.data + 'T12:00:00'))))
      : null

    return {
      total,
      paid,
      percent: Math.round((paid / total) * 100),
      lastDate: lastDate ? lastDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : null
    }
  }

  const handleConfirmAction = (allSeries) => {
    if (!actionTarget) return
    const { bill, type } = actionTarget
    if (type === 'delete') onDelete(bill.id, allSeries, bill.recorrencia_id)
    else if (type === 'status') onTogglePaid(bill.id, allSeries, bill.recorrencia_id)
    else if (type === 'edit') onEdit(bill, allSeries)
    setActionTarget(null)
  }

  return (
    <div className="space-y-5">
      <ActionConfirmationModal target={actionTarget} onClose={() => setActionTarget(null)} onConfirm={handleConfirmAction} />
      
      <div className="flex flex-col gap-3 px-1">
        <div className="flex items-center justify-between">
          <h4 className="text-gray-500 font-bold text-[10px] uppercase tracking-[0.2em]">Agenda</h4>
          <span className="text-[9px] bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-black uppercase tracking-tighter">
            {isLoading ? '...' : rawBills.filter(b => !b.pago).length} Pendentes
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'vencimento', label: 'Vencimento', icon: <Calendar size={10} /> }, 
            { id: 'valor', label: 'Valor', icon: <Banknote size={10} /> }, 
            { id: 'az', label: 'Término', icon: <Tag size={10} /> }
          ].map((btn) => (
            <button 
              key={btn.id} 
              onClick={() => handleSort(btn.id)} 
              disabled={isLoading}
              className={`flex items-center gap-1.5 text-[8px] font-black uppercase px-3 py-2 rounded-xl transition-all border whitespace-nowrap ${
                sortBy === btn.id 
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                  : 'bg-white text-gray-400 border-gray-100 shadow-sm'
              } ${isLoading ? 'opacity-50' : ''}`}
            >
              <span className={sortBy === btn.id ? 'text-white' : 'text-gray-300'}>{btn.icon}</span>
              {btn.label}
              {sortBy === btn.id && (
                <span className="ml-0.5">
                  {isReversed ? <ArrowUp size={8} strokeWidth={4} /> : <ArrowDown size={8} strokeWidth={4} />}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white p-3.5 rounded-[2rem] border border-gray-50 shadow-sm animate-pulse flex justify-between items-center">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 bg-gray-100 rounded-full w-2/3" />
                  <div className="h-2 bg-gray-50 rounded-full w-1/3" />
                </div>
              </div>
              <div className="h-4 w-16 bg-gray-50 rounded-full" />
            </div>
          ))
        ) : sortedBills.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-[2rem] border-2 border-dashed border-gray-100 italic text-gray-400 text-[10px]">Vazio.</div>
        ) : (
          sortedBills.map(bill => {
            const stats = getRecurrenceStats(bill.recorrencia_id)
            const categoryInfo = categoryIcons[bill.categoria] || categoryIcons["Outros"]

            return (
              <div key={bill.id} className="bg-white p-3.5 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col gap-2.5">
                <div className="flex justify-between items-center gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${bill.pago ? 'bg-gray-50 text-gray-300 opacity-50' : categoryInfo.color}`}>
                        {categoryInfo.icon}
                      </div>
                      <button 
                        onClick={() => bill.recorrencia_id ? setActionTarget({ bill, type: 'status' }) : onTogglePaid(bill.id, false, null)} 
                        className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center transition-colors shadow-sm ${bill.pago ? 'bg-emerald-500 text-white' : 'bg-white text-gray-200'}`}
                      >
                        {bill.pago ? <CheckCircle2 size={10} strokeWidth={4} /> : <Circle size={10} strokeWidth={4} />}
                      </button>
                    </div>
                    
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className={`font-bold text-[13px] leading-tight truncate ${bill.pago ? 'text-gray-300 line-through font-medium' : 'text-gray-800'}`}>
                          {bill.descricao}
                        </p>
                        {bill.recorrencia_id && <Repeat size={10} className={`${bill.pago ? 'text-gray-200' : 'text-orange-400'} flex-shrink-0`} />}
                      </div>
                      <div className="flex items-center gap-1.5 text-[8px] font-black text-gray-400 uppercase mt-1">
                        <span className="whitespace-nowrap">{new Date(bill.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                        <span className="w-0.5 h-0.5 bg-gray-200 rounded-full" />
                        <span className={`truncate ${bill.pago ? 'text-gray-300' : 'text-indigo-400'}`}>{bill.categoria || "Geral"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end flex-shrink-0">
                    <p className={`font-black text-xs whitespace-nowrap ${bill.pago ? 'text-gray-300' : 'text-rose-600'}`}>
                      R$ {Number(bill.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <div className="flex gap-2 mt-1">
                      <button 
                        onClick={() => bill.recorrencia_id ? setActionTarget({ bill, type: 'edit' }) : onEdit(bill)} 
                        className="p-1 text-gray-300 active:text-indigo-500 transition-colors"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button 
                        onClick={() => setActionTarget({ bill, type: 'delete' })} 
                        className="p-1 text-gray-300 active:text-rose-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {stats && !bill.pago && (
                  <div className="space-y-1.5 mt-0.5">
                    <div className="flex justify-between items-end px-1">
                      <span className="text-[7px] text-gray-400 font-black uppercase tracking-widest">Progresso do pagamento</span>
                      <span className="text-[8px] text-indigo-500 font-black tracking-tighter">{stats.paid}/{stats.total} parcelas</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden border border-black/5">
                      <div 
                        className="h-full bg-indigo-500 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${stats.percent}%` }}
                      />
                    </div>
                    <div className="bg-gray-50/50 rounded-xl py-1 px-3 text-[7px] text-gray-400 font-bold uppercase tracking-[0.15em] text-center border border-gray-100/50">
                      Dívida termina em: {stats.lastDate}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}