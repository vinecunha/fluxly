import React, { useState, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  Calendar, CheckCircle2, Circle, Edit3, Trash2, Repeat,
  ArrowUp, ArrowDown, Banknote, Undo2, Tag, AlertTriangle, Filter
} from 'lucide-react'
import { categoryIcons } from '../lib/categories'


export const ActionConfirmationModal = ({ target, onClose, onConfirm }) => {
  if (!target) return null
  const { bill, type } = target

  const getModalConfig = () => {
    if (type === 'delete') return {
      title: 'Excluir Conta',
      desc: bill.recorrencia_id ? 'Excluir toda a série ou apenas esta?' : `Excluir "${bill.descricao}"?`,
      icon: <Trash2 size={28} />,
      iconClass: 'bg-rose-50 text-rose-500',
      btnClass: 'bg-rose-600 shadow-rose-100',
      primaryLabel: 'Apenas Esta',
      secondaryLabel: 'Toda a Série',
      seriesWarning: true,
    }
    if (type === 'status') {
      const isPaid = bill.pago
      return {
        title: isPaid ? 'Reabrir Conta' : 'Concluir Conta',
        desc: bill.recorrencia_id ? `${isPaid ? 'Reabrir' : 'Baixar'} toda a série ou apenas esta?` : `${isPaid ? 'Reabrir' : 'Pagar'} "${bill.descricao}"?`,
        icon: isPaid ? <Undo2 size={28} /> : <CheckCircle2 size={28} />,
        iconClass: isPaid ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500',
        btnClass: isPaid ? 'bg-amber-600 shadow-amber-100' : 'bg-emerald-600 shadow-emerald-100',
        primaryLabel: 'Apenas Esta',
        secondaryLabel: 'Toda a Série',
        seriesWarning: false,
      }
    }
    return {
      title: 'Editar Série',
      desc: 'Deseja alterar toda a série ou apenas esta parcela?',
      icon: <Edit3 size={28} />,
      iconClass: 'bg-indigo-50 text-indigo-500',
      btnClass: 'bg-indigo-600 shadow-indigo-100',
      primaryLabel: 'Apenas Esta',
      secondaryLabel: 'Toda a Série',
      seriesWarning: false,
    }
  }

  const config = getModalConfig()

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 outline-none">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      <div className="relative z-[10001] bg-white rounded-[2.5rem] p-6 max-w-[320px] w-full shadow-2xl animate-in zoom-in duration-200">
        <div className="text-center">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${config.iconClass}`}>
            {config.icon}
          </div>
          <h3 className="text-lg font-black text-gray-800 mb-2">{config.title}</h3>
          <p className="text-gray-500 text-[11px] mb-6 leading-relaxed px-2">{config.desc}</p>
          
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => onConfirm(false)}
              className={`w-full py-3.5 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest ${config.btnClass} shadow-lg active:scale-95 transition-transform`}
            >
              {config.primaryLabel}
            </button>

            {bill.recorrencia_id && (
              <>
                {config.seriesWarning && (
                  <div className="flex items-start gap-2 bg-rose-50 border border-rose-100 rounded-2xl px-3 py-2 text-left">
                    <AlertTriangle size={12} className="text-rose-500 mt-0.5 flex-shrink-0" />
                    <p className="text-[9px] text-rose-500 font-bold leading-relaxed">
                      Isso afetará permanentemente todos os registros vinculados.
                    </p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => onConfirm(true)}
                  className={`w-full py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-transform ${
                    config.seriesWarning ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {config.secondaryLabel}
                </button>
              </>
            )}
            
            <button 
              type="button"
              onClick={onClose} 
              className="w-full py-2 text-gray-400 font-bold text-[9px] uppercase tracking-widest pt-1"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

const FALLBACK_CATEGORY = { icon: <Tag size={14} />, color: 'bg-gray-100 text-gray-500' }

const SwipeableBillItem = ({ bill, stats, categoryInfo, onEdit, setActionTarget }) => {
  const startXRef = useRef(null)
  const [swipeX, setSwipeX] = useState(0)
  const [swiping, setSwiping] = useState(false)
  const THRESHOLD = 72

  const onTouchStart = (e) => { startXRef.current = e.touches[0].clientX; setSwiping(true) }
  const onTouchMove = (e) => {
    if (startXRef.current === null) return
    setSwipeX(Math.max(-THRESHOLD * 1.2, Math.min(THRESHOLD * 1.2, e.touches[0].clientX - startXRef.current)))
  }
  const onTouchEnd = () => {
    if (swipeX < -THRESHOLD) {
      setActionTarget({ bill, type: 'delete' })
    } else if (swipeX > THRESHOLD) {
      setActionTarget({ bill, type: 'status' })
    }
    setSwipeX(0); setSwiping(false); startXRef.current = null
  }

  const catInfo = categoryInfo || FALLBACK_CATEGORY

  return (
    <div className="relative overflow-hidden rounded-[2rem]">
      <div className="absolute inset-0 flex items-center justify-between px-5 pointer-events-none">
        <div className={`flex items-center gap-1.5 transition-opacity ${swipeX > 20 ? 'opacity-100' : 'opacity-0'}`}>
          <CheckCircle2 size={18} className="text-emerald-500" />
          <span className="text-[9px] font-black text-emerald-600 uppercase">{bill.pago ? 'Reabrir' : 'Pagar'}</span>
        </div>
        <div className={`flex items-center gap-1.5 transition-opacity ${swipeX < -20 ? 'opacity-100' : 'opacity-0'}`}>
          <span className="text-[9px] font-black text-rose-600 uppercase">Excluir</span>
          <Trash2 size={18} className="text-rose-500" />
        </div>
      </div>

      <div
        className="bg-white border border-gray-100 shadow-sm flex flex-col gap-2.5 p-3.5 rounded-[2rem] touch-pan-y"
        style={{ transform: `translateX(${swipeX}px)`, transition: swiping ? 'none' : 'transform 0.3s ease' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="flex justify-between items-center gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="relative flex-shrink-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${bill.pago ? 'bg-gray-50 text-gray-300 opacity-50' : catInfo.color}`}>
                {catInfo.icon}
              </div>
              <button
                onClick={() => setActionTarget({ bill, type: 'status' })}
                className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center transition-colors shadow-sm ${
                  bill.pago ? 'bg-emerald-500 text-white' : 'bg-white text-gray-200'
                }`}
              >
                {bill.pago ? <CheckCircle2 size={10} strokeWidth={4} /> : <Circle size={10} strokeWidth={4} />}
              </button>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className={`font-bold text-[13px] leading-tight truncate ${bill.pago ? 'text-gray-300 line-through font-medium' : 'text-gray-800'}`}>
                  {bill.descricao}
                </p>
                {bill.recorrencia_id && (
                  <Repeat size={10} className={`${bill.pago ? 'text-gray-200' : 'text-orange-400'} flex-shrink-0`} />
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[8px] font-black text-gray-400 uppercase mt-1">
                <span>{new Date(bill.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                <span className="w-0.5 h-0.5 bg-gray-200 rounded-full" />
                <span className={`truncate ${bill.pago ? 'text-gray-300' : 'text-indigo-400'}`}>{bill.categoria || 'Geral'}</span>
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

        {stats && stats.total > 1 && !bill.pago && (
          <div className="space-y-1.5 mt-0.5">
            <div className="flex justify-between items-end px-1">
              <span className="text-[7px] text-gray-400 font-black uppercase tracking-widest">Progresso</span>
              <span className="text-[8px] text-indigo-500 font-black tracking-tighter">{stats.paid}/{stats.total} parcelas</span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden border border-black/5">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${stats.percent}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export const BillsList = ({ transactions, allTransactions, onTogglePaid, onEdit, onDelete, isLoading }) => {
  const [sortBy, setSortBy] = useState('vencimento')
  const [isReversed, setIsReversed] = useState(false)
  const [showPaid, setShowPaid] = useState(false)
  const [actionTarget, setActionTarget] = useState(null)

  const rawBills = useMemo(() =>
    (transactions || []).filter(t => t.tipo === 'fixa' || t.tipo === 'esporadica'),
    [transactions]
  )

  const recurrenceStatsMap = useMemo(() => {
    if (!allTransactions) return {}
    return allTransactions.reduce((acc, t) => {
      if (!t.recorrencia_id) return acc
      if (!acc[t.recorrencia_id]) acc[t.recorrencia_id] = { total: 0, paid: 0, lastTs: 0 }
      const entry = acc[t.recorrencia_id]
      entry.total++
      if (t.pago) entry.paid++
      const ts = new Date(t.data + 'T12:00:00').getTime()
      if (ts > entry.lastTs) entry.lastTs = ts
      return acc
    }, {})
  }, [allTransactions])

  const sorted = useMemo(() => {
    return [...rawBills].sort((a, b) => {
      let cmp = 0
      if (sortBy === 'vencimento') cmp = new Date(a.data + 'T12:00:00') - new Date(b.data + 'T12:00:00')
      else if (sortBy === 'valor') cmp = Number(a.valor) - Number(b.valor)
      else if (sortBy === 'az') cmp = a.descricao.localeCompare(b.descricao)
      return isReversed ? -cmp : cmp
    })
  }, [rawBills, sortBy, isReversed])

  const pending = useMemo(() => sorted.filter(b => !b.pago), [sorted])
  const paid    = useMemo(() => sorted.filter(b => b.pago),  [sorted])

  const handleConfirmAction = (allSeries) => {
    if (!actionTarget) return
    const { bill, type } = actionTarget
    
    if (type === 'delete' && onDelete) onDelete(bill.id, allSeries, bill.recorrencia_id)
    else if (type === 'status' && onTogglePaid) onTogglePaid(bill.id, allSeries, bill.recorrencia_id)
    else if (type === 'edit' && onEdit) onEdit(bill, allSeries)
    
    setActionTarget(null)
  }

  const renderBill = (bill) => {
    const rawStats = bill.recorrencia_id ? recurrenceStatsMap[bill.recorrencia_id] : null
    const stats = rawStats ? {
      total: rawStats.total,
      paid: rawStats.paid,
      percent: Math.round((rawStats.paid / rawStats.total) * 100),
      lastDate: rawStats.lastTs
        ? new Date(rawStats.lastTs).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
        : null,
    } : null

    return (
      <SwipeableBillItem
        key={bill.id}
        bill={bill}
        stats={stats}
        categoryInfo={categoryIcons[bill.categoria]}
        onEdit={onEdit}
        setActionTarget={setActionTarget}
      />
    )
  }

  return (
    <div className="space-y-5">
      <ActionConfirmationModal 
        target={actionTarget} 
        onClose={() => setActionTarget(null)} 
        onConfirm={handleConfirmAction} 
      />

      <div className="flex flex-col gap-3 px-1">
        <div className="flex items-center justify-between">
          <h4 className="text-gray-500 font-bold text-[10px] uppercase tracking-[0.2em]">Agenda</h4>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPaid(p => !p)}
              className={`flex items-center gap-1 text-[9px] font-black uppercase px-2.5 py-1.5 rounded-xl transition-all border ${
                showPaid ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-white text-gray-400 border-gray-100 shadow-sm'
              }`}
            >
              <Filter size={10} />
              {showPaid ? 'Todas' : 'Pendentes'}
            </button>
            <span className="text-[9px] bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-black uppercase tracking-tighter">
              {isLoading ? '...' : `${pending.length} pendentes`}
            </span>
          </div>
        </div>
        
        <p className="text-[8px] text-gray-300 font-bold px-1">← Deslize para pagar ou excluir →</p>
      </div>

      {isLoading ? (
        <div className="space-y-2.5">
          {[1, 2, 3].map(i => <div key={i} className="bg-white p-3.5 rounded-[2rem] border border-gray-50 animate-pulse h-[72px]" />)}
        </div>
      ) : (
        <div className="space-y-5">
          {pending.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-[2rem] border-2 border-dashed border-gray-100 italic text-gray-400 text-[10px]">
              Nenhuma conta pendente 🎉
            </div>
          ) : (
            <div className="space-y-2.5">{pending.map(renderBill)}</div>
          )}

          {paid.length > 0 && (
            <div className="space-y-2">
              <button onClick={() => setShowPaid(!showPaid)} className="flex items-center justify-between w-full px-2">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Pagas ({paid.length})</span>
                {showPaid ? <ArrowUp size={12} className="text-gray-400" /> : <ArrowDown size={12} className="text-gray-400" />}
              </button>
              {showPaid && <div className="space-y-2.5 animate-in slide-in-from-top-2">{paid.map(renderBill)}</div>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}