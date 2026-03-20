import React, { useState, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  CheckCircle2, Circle, Edit3, Trash2, Repeat,
  ArrowUp, ArrowDown, Undo2, Tag, AlertTriangle, Filter,
  TrendingDown, Clock, CircleDollarSign
} from 'lucide-react'
import { categoryIcons } from '../lib/categories'

const fmt  = (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
const fmtK = (v) => {
  if (v >= 1000) return `R$${(v / 1000).toFixed(1)}k`
  return `R$${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

export const ActionConfirmationModal = ({ target, onClose, onConfirm }) => {
  if (!target) return null
  const { bill, type } = target

  const getModalConfig = () => {
    if (type === 'delete') return {
      title: 'Excluir Conta',
      desc: bill.recorrencia_id ? 'Excluir toda a série ou apenas esta?' : `Excluir "${bill.descricao}"?`,
      icon: <Trash2 size={28} />, iconClass: 'bg-rose-50 text-rose-500',
      btnClass: 'bg-rose-600 shadow-rose-100', primaryLabel: 'Apenas Esta',
      secondaryLabel: 'Toda a Série', seriesWarning: true,
    }
    if (type === 'status') {
      const isPaid = bill.pago
      return {
        title: isPaid ? 'Reabrir Conta' : 'Concluir Conta',
        desc: bill.recorrencia_id
          ? `${isPaid ? 'Reabrir' : 'Baixar'} toda a série ou apenas esta?`
          : `${isPaid ? 'Reabrir' : 'Pagar'} "${bill.descricao}"?`,
        icon: isPaid ? <Undo2 size={28} /> : <CheckCircle2 size={28} />,
        iconClass: isPaid ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500',
        btnClass: isPaid ? 'bg-amber-600 shadow-amber-100' : 'bg-emerald-600 shadow-emerald-100',
        primaryLabel: 'Apenas Esta', secondaryLabel: 'Toda a Série', seriesWarning: false,
      }
    }
    return {
      title: 'Editar Série',
      desc: 'Deseja alterar toda a série ou apenas esta parcela?',
      icon: <Edit3 size={28} />, iconClass: 'bg-slate-50 text-slate-500',
      btnClass: 'bg-slate-900 shadow-slate-100', primaryLabel: 'Apenas Esta',
      secondaryLabel: 'Toda a Série', seriesWarning: false,
    }
  }

  const config = getModalConfig()
  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative z-[10001] bg-white rounded-2xl p-6 max-w-[320px] w-full shadow-2xl animate-in zoom-in duration-200">
        <div className="text-center">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${config.iconClass}`}>{config.icon}</div>
          <h3 className="text-lg font-black text-gray-800 mb-2">{config.title}</h3>
          <p className="text-gray-500 text-[11px] mb-6 leading-relaxed px-2">{config.desc}</p>
          <div className="space-y-2.5">
            <button type="button" onClick={() => onConfirm(false)}
              className={`w-full py-3.5 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest ${config.btnClass} shadow-lg active:scale-95 transition-transform`}>
              {config.primaryLabel}
            </button>
            {bill.recorrencia_id && (
              <>
                {config.seriesWarning && (
                  <div className="flex items-start gap-2 bg-rose-50 border border-rose-100 rounded-2xl px-3 py-2 text-left">
                    <AlertTriangle size={12} className="text-rose-500 mt-0.5 flex-shrink-0" />
                    <p className="text-[9px] text-rose-500 font-bold leading-relaxed">Isso afetará permanentemente todos os registros vinculados.</p>
                  </div>
                )}
                <button type="button" onClick={() => onConfirm(true)}
                  className={`w-full py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-transform ${
                    config.seriesWarning ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                  {config.secondaryLabel}
                </button>
              </>
            )}
            <button type="button" onClick={onClose} className="w-full py-2 text-gray-400 font-bold text-[9px] uppercase tracking-widest pt-1">Cancelar</button>
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
  const onTouchMove  = (e) => {
    if (startXRef.current === null) return
    setSwipeX(Math.max(-THRESHOLD * 1.2, Math.min(THRESHOLD * 1.2, e.touches[0].clientX - startXRef.current)))
  }
  const onTouchEnd = () => {
    if (swipeX < -THRESHOLD) setActionTarget({ bill, type: 'delete' })
    else if (swipeX > THRESHOLD) setActionTarget({ bill, type: 'status' })
    setSwipeX(0); setSwiping(false); startXRef.current = null
  }

  const catInfo = categoryInfo || FALLBACK_CATEGORY

  // Urgência
  const hoje = new Date(); hoje.setHours(0,0,0,0)
  const venc = new Date(bill.data + 'T12:00:00'); venc.setHours(0,0,0,0)
  const dias = Math.ceil((venc - hoje) / 86400000)
  const isUrgente = !bill.pago && dias >= 0 && dias <= 3

  return (
    <div className="relative overflow-hidden rounded-2xl group">
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
        className={`bg-white border shadow-sm flex flex-col gap-2.5 p-3.5 rounded-2xl transition-colors ${
          isUrgente ? 'border-rose-100' : 'border-gray-100'
        }`}
        style={{ transform: `translateX(${swipeX}px)`, transition: swiping ? 'none' : 'transform 0.3s ease' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="flex justify-between items-center gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="relative flex-shrink-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
                bill.pago ? 'bg-gray-50 text-gray-300 opacity-50' : catInfo.color
              }`}>
                {catInfo.icon}
              </div>
              <button onClick={() => setActionTarget({ bill, type: 'status' })}
                className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center transition-colors shadow-sm ${
                  bill.pago ? 'bg-emerald-500 text-white' : 'bg-white text-gray-200'
                }`}>
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
              <div className="flex items-center gap-1.5 text-[8px] font-black text-gray-400 uppercase mt-1 flex-wrap">
                <span>{new Date(bill.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                <span className="w-0.5 h-0.5 bg-gray-200 rounded-full" />
                <span className={`truncate ${bill.pago ? 'text-gray-300' : 'text-slate-400'}`}>{bill.categoria || 'Geral'}</span>
                {isUrgente && (
                  <>
                    <span className="w-0.5 h-0.5 bg-gray-200 rounded-full" />
                    <span className="text-rose-500">
                      {dias === 0 ? 'hoje' : dias === 1 ? 'amanhã' : `${dias}d`}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => bill.recorrencia_id ? setActionTarget({ bill, type: 'edit' }) : onEdit(bill)}
                className="p-1.5 rounded-xl text-gray-300 hover:text-slate-500 hover:bg-slate-50 transition-colors">
                <Edit3 size={14} />
              </button>
              <button onClick={() => setActionTarget({ bill, type: 'delete' })}
                className="p-1.5 rounded-xl text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>

            <div className="flex flex-col items-end sm:hidden">
              <p className={`font-black text-xs whitespace-nowrap ${bill.pago ? 'text-gray-300' : 'text-rose-600'}`}>
                R$ {Number(bill.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <div className="flex gap-2 mt-1">
                <button onClick={() => bill.recorrencia_id ? setActionTarget({ bill, type: 'edit' }) : onEdit(bill)}
                  className="p-1 text-gray-300 active:text-slate-500 transition-colors"><Edit3 size={14} /></button>
                <button onClick={() => setActionTarget({ bill, type: 'delete' })}
                  className="p-1 text-gray-300 active:text-rose-500 transition-colors"><Trash2 size={14} /></button>
              </div>
            </div>

            <div className="hidden sm:flex flex-col items-end">
              <p className={`font-black text-xs whitespace-nowrap ${bill.pago ? 'text-gray-300' : isUrgente ? 'text-rose-600' : 'text-rose-600'}`}>
                R$ {Number(bill.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {stats && stats.total > 1 && !bill.pago && (
          <div className="space-y-1.5 mt-0.5">
            <div className="flex justify-between items-end px-1">
              <span className="text-[7px] text-gray-400 font-black uppercase tracking-widest">Progresso</span>
              <span className="text-[8px] text-slate-500 font-black tracking-tighter">{stats.paid}/{stats.total} parcelas</span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden border border-black/5">
              <div className="h-full bg-slate-500 rounded-full transition-all duration-500 ease-out" style={{ width: `${stats.percent}%` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Summary Bar ─────────────────────────────────────────────────────────────
function SummaryBar({ pending, paid }) {
  const totalPendente = pending.reduce((s, b) => s + (Number(b.valor) || 0), 0)
  const totalPago     = paid.reduce((s, b) => s + (Number(b.valor) || 0), 0)
  const totalGeral    = totalPendente + totalPago
  const pctPago       = totalGeral > 0 ? (totalPago / totalGeral) * 100 : 0

  const hoje = new Date(); hoje.setHours(0,0,0,0)
  const urgentes = pending.filter(b => {
    const venc = new Date(b.data + 'T12:00:00'); venc.setHours(0,0,0,0)
    return Math.ceil((venc - hoje) / 86400000) <= 3
  })

  if (totalGeral === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
        <div className="text-center">
          <p className="text-[7px] font-black text-gray-400 uppercase mb-0.5">Total do mês</p>
          <p className="text-sm font-black text-gray-800">{fmtK(totalGeral)}</p>
        </div>
        <div className="text-center">
          <p className="text-[7px] font-black text-emerald-500 uppercase mb-0.5">Pago</p>
          <p className="text-sm font-black text-emerald-600">{fmtK(totalPago)}</p>
        </div>
        <div className="text-center">
          <p className="text-[7px] font-black text-rose-500 uppercase mb-0.5">Pendente</p>
          <p className="text-sm font-black text-rose-600">{fmtK(totalPendente)}</p>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-[8px] font-black text-gray-400 uppercase">
          <span>Progresso do mês</span>
          <span>{pctPago.toFixed(0)}%</span>
        </div>
        <div className="h-2 w-full bg-rose-100 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all duration-700"
            style={{ width: `${pctPago}%` }} />
        </div>
        <div className="flex justify-between text-[7px] font-bold text-gray-300">
          <span>{paid.length} pagas</span>
          <span>{pending.length} pendentes</span>
        </div>
      </div>

      {urgentes.length > 0 && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
          <Clock size={11} className="text-rose-500 flex-shrink-0" />
          <p className="text-[9px] font-black text-rose-600">
            {urgentes.length} conta{urgentes.length !== 1 ? 's' : ''} vencem em até 3 dias
            {' · '}{fmtK(urgentes.reduce((s, b) => s + (Number(b.valor) || 0), 0))}
          </p>
        </div>
      )}
    </div>
  )
}

export const BillsList = ({ transactions, allTransactions, onTogglePaid, onEdit, onDelete, isLoading }) => {
  const [sortBy, setSortBy]             = useState('vencimento')
  const [isReversed, setIsReversed]     = useState(false)
  const [showPaid, setShowPaid]         = useState(false)
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

  const sorted = useMemo(() => [...rawBills].sort((a, b) => {
    let cmp = 0
    if (sortBy === 'vencimento') cmp = new Date(a.data + 'T12:00:00') - new Date(b.data + 'T12:00:00')
    else if (sortBy === 'valor') cmp = Number(a.valor) - Number(b.valor)
    else if (sortBy === 'az')   cmp = a.descricao.localeCompare(b.descricao)
    return isReversed ? -cmp : cmp
  }), [rawBills, sortBy, isReversed])

  const pending = useMemo(() => sorted.filter(b => !b.pago), [sorted])
  const paid    = useMemo(() => sorted.filter(b => b.pago),  [sorted])

  const handleConfirmAction = (allSeries) => {
    if (!actionTarget) return
    const { bill, type } = actionTarget
    if (type === 'delete' && onDelete)          onDelete(bill.id, allSeries, bill.recorrencia_id)
    else if (type === 'status' && onTogglePaid) onTogglePaid(bill.id, allSeries, bill.recorrencia_id)
    else if (type === 'edit' && onEdit)         onEdit(bill, allSeries)
    setActionTarget(null)
  }

  const renderBill = (bill) => {
    const rawStats = bill.recorrencia_id ? recurrenceStatsMap[bill.recorrencia_id] : null
    const stats = rawStats ? {
      total: rawStats.total, paid: rawStats.paid,
      percent: Math.round((rawStats.paid / rawStats.total) * 100),
    } : null
    return (
      <SwipeableBillItem key={bill.id} bill={bill} stats={stats}
        categoryInfo={categoryIcons[bill.categoria]} onEdit={onEdit} setActionTarget={setActionTarget} />
    )
  }

  return (
    <div className="space-y-4">
      <ActionConfirmationModal target={actionTarget} onClose={() => setActionTarget(null)} onConfirm={handleConfirmAction} />

      <div className="flex items-center justify-between px-1">
        <h4 className="text-gray-500 font-bold text-[10px] uppercase tracking-[0.2em]">Agenda</h4>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowPaid(p => !p)}
            className={`flex items-center gap-1 text-[9px] font-black uppercase px-2.5 py-1.5 rounded-2xl transition-all border ${
              showPaid ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-white text-gray-400 border-gray-100 shadow-sm'
            }`}>
            <Filter size={10} />
            {showPaid ? 'Todas' : 'Pendentes'}
          </button>
          {!isLoading && (
            <span className="text-[9px] bg-slate-50 text-slate-600 px-2.5 py-1 rounded-full font-black uppercase">
              {pending.length} pendentes
            </span>
          )}
        </div>
      </div>

      <p className="text-[8px] text-gray-300 font-bold px-1">← Deslize para pagar ou excluir →</p>

      {isLoading ? (
        <div className="space-y-2.5">
          {[1,2,3].map(i => <div key={i} className="bg-white p-3.5 rounded-2xl border border-gray-50 animate-pulse h-[72px]" />)}
        </div>
      ) : (
        <>
          <SummaryBar pending={pending} paid={paid} />

          <div className="space-y-5">
            {pending.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border-2 border-dashed border-gray-100 italic text-gray-400 text-[10px]">
                Nenhuma conta pendente 🎉
              </div>
            ) : (
              <div className="space-y-2.5">{pending.map(renderBill)}</div>
            )}

            {paid.length > 0 && (
              <div className="space-y-2">
                <button onClick={() => setShowPaid(p => !p)} className="flex items-center justify-between w-full px-2">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Pagas ({paid.length})</span>
                  {showPaid ? <ArrowUp size={12} className="text-gray-400" /> : <ArrowDown size={12} className="text-gray-400" />}
                </button>
                {showPaid && <div className="space-y-2.5 animate-in slide-in-from-top-2">{paid.map(renderBill)}</div>}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}