import React, { useState, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  CheckCircle2, Circle, Edit3, Trash2, Repeat,
  ArrowUp, ArrowDown, Undo2, Tag, AlertTriangle, Filter,
  TrendingDown, Clock, CreditCard, ChevronDown, ChevronUp
} from 'lucide-react'
import { categoryIcons } from '@lib/categories'
import { getFaturasExibicao } from '@lib/faturaHelpers'
import { CartoesResumo } from './CartoesResumo'

const fmt  = (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
const fmtK = (v) => {
  if (v >= 1000) return `R$${(v / 1000).toFixed(1)}k`
  return `R$${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

// ─── Action Confirmation Modal (exportado) ───────────────────────────────────
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
      btnClass: 'bg-slate-900  shadow-slate-100', primaryLabel: 'Apenas Esta',
      secondaryLabel: 'Toda a Série', seriesWarning: false,
    }
  }

  const config = getModalConfig()
  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-900 /60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
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

// ─── Fatura Virtual Item ──────────────────────────────────────────────────────
function FaturaVirtualItem({ bill }) {
  const f            = bill._fatura
  const pctPago      = f.totalGasto > 0 ? Math.min((f.totalPago / f.totalGasto) * 100, 100) : 0
  const [expanded, setExpanded] = React.useState(false)

  const fmtVal = (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

  const allItems = [
    ...f.gastos.map(t => ({ ...t, _kind: 'gasto' })),
    ...(f.pagamentos || []).map(t => ({ ...t, _kind: 'pagamento' })),
  ].sort((a, b) => new Date(b.data) - new Date(a.data))

  const hasItems = allItems.length > 0

  return (
    <div className={`bg-slate-50 border rounded-2xl shadow-sm overflow-hidden ${f.pago ? 'border-emerald-100' : 'border-slate-200'}`}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm flex-shrink-0 ${
              f.pago ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-800 text-white'
            }`}>
              <CreditCard size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className={`font-bold text-[13px] leading-tight truncate ${f.pago ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                  {bill.descricao}
                </p>
                <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase ${
                  f.pago ? 'bg-emerald-100 text-emerald-700' :
                  f.status === 'cobrança' ? 'bg-rose-100 text-rose-700' :
                  'bg-slate-200 text-slate-700'
                }`}>
                  {f.pago ? 'Quitada' : f.status === 'cobrança' ? 'A pagar' : 'Aberta'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[8px] font-black text-gray-400 uppercase mt-1 flex-wrap">
                <span>Vence {new Date(bill.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                {f.periodo && (
                  <>
                    <span className="w-0.5 h-0.5 bg-gray-200 rounded-full" />
                    <span className="text-slate-400">{f.periodo}</span>
                  </>
                )}
                {f.qtdGastos > 0 && (
                  <>
                    <span className="w-0.5 h-0.5 bg-gray-200 rounded-full" />
                    <span className="text-rose-400">{f.qtdGastos} compra{f.qtdGastos !== 1 ? 's' : ''}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end flex-shrink-0">
            <p className={`font-black text-xs whitespace-nowrap ${f.pago ? 'text-gray-300' : 'text-slate-700'}`}>
              {fmtVal(f.totalGasto)}
            </p>
            {f.totalPago > 0 && !f.pago && (
              <p className="text-[9px] text-emerald-600 font-bold whitespace-nowrap">
                pago {fmtVal(f.totalPago)}
              </p>
            )}
            {f.pago
              ? <p className="text-[9px] font-black text-emerald-600 mt-0.5">✓ Quitada</p>
              : f.saldo > 0
              ? <p className="text-[9px] font-black text-rose-500 mt-0.5">
                  Falta {fmtVal(f.saldo)}
                </p>
              : null
            }
          </div>
        </div>

        {/* Barra de progresso */}
        {f.totalGasto > 0 && (
          <div className="space-y-1 mb-2">
            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${pctPago}%` }} />
            </div>
            <p className="text-[8px] text-gray-400 font-bold text-center">
              {f.totalPago > 0
                ? `${fmtVal(f.totalPago)} pago de ${fmtVal(f.totalGasto)}`
                : 'Nenhum pagamento registrado'
              }
            </p>
          </div>
        )}

        {/* Botão expandir */}
        {hasItems && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-full flex items-center justify-center gap-1.5 py-2 bg-white border border-gray-100 rounded-xl text-[9px] font-black uppercase text-gray-500 active:bg-gray-50 transition-colors mt-1"
            style={{ minHeight: 36 }}
          >
            {expanded ? 'Ocultar' : `Ver ${allItems.length} lançamento${allItems.length !== 1 ? 's' : ''}`}
            {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          </button>
        )}
      </div>

      {/* Flow expandido */}
      {expanded && hasItems && (
        <div className="border-t border-gray-100 divide-y divide-gray-50 animate-in slide-in-from-top-1 duration-200">
          {allItems.map((t, i) => {
            const isPagamento = t._kind === 'pagamento'
            const v = Math.abs(Number(t.valor))
            const dateDisplay = (() => {
              const raw = t.data_pagamento || (t.data + 'T12:00:00')
              const d = new Date(typeof raw === 'string' ? raw.replace(' ', 'T') : raw)
              return isNaN(d.getTime()) ? '--' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
            })()
            return (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isPagamento ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-50 text-rose-500'
                }`}>
                  {isPagamento
                    ? <CheckCircle2 size={14} />
                    : <TrendingDown size={14} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-gray-800 truncate">{t.descricao}</p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase">
                    {dateDisplay}
                    {t.categoria ? ` · ${t.categoria}` : ''}
                    {isPagamento && <span className="text-emerald-500"> · pagamento</span>}
                  </p>
                </div>
                <p className={`text-[11px] font-black flex-shrink-0 ${
                  isPagamento ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {isPagamento ? '+' : '-'}{fmtVal(v)}
                </p>
              </div>
            )
          })}

          {/* Resumo no rodapé */}
          <div className="px-4 py-3 bg-gray-50">
            <div className="flex justify-between text-[9px] font-black text-gray-500 uppercase mb-1">
              <span>Compras</span>
              <span className="text-rose-600">-{fmtVal(f.totalGasto)}</span>
            </div>
            {f.totalPago > 0 && (
              <div className="flex justify-between text-[9px] font-black text-gray-500 uppercase mb-1">
                <span>Pagamentos</span>
                <span className="text-emerald-600">+{fmtVal(f.totalPago)}</span>
              </div>
            )}
            <div className="flex justify-between text-[10px] font-black uppercase border-t border-gray-200 pt-1.5 mt-1">
              <span className={f.saldo > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                {f.saldo > 0 ? 'Saldo a pagar' : 'Quitada'}
              </span>
              <span className={f.saldo > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                {f.saldo > 0 ? fmtVal(f.saldo) : '✓'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Swipeable Bill Item ─────────────────────────────────────────────────────
const SwipeableBillItem = ({ bill, stats, categoryInfo, onEdit, setActionTarget }) => {
  const startXRef = useRef(null)
  const startYRef = useRef(null)
  const [swipeX, setSwipeX]   = useState(0)
  const [swiping, setSwiping] = useState(false)
  const [pending, setPending] = useState(false)
  const [dir, setDir]         = useState(null)
  const THRESHOLD = 72
  const SNAP = 90

  const haptic = () => { try { navigator.vibrate?.(30) } catch(_){} }

  const onTouchStart = (e) => {
    startXRef.current = e.touches[0].clientX
    startYRef.current = e.touches[0].clientY
    setSwiping(true); setPending(false)
  }
  const onTouchMove = (e) => {
    if (startXRef.current === null) return
    const dx = e.touches[0].clientX - startXRef.current
    const dy = e.touches[0].clientY - startYRef.current
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dx) < 10) return
    const clamped = Math.max(-SNAP, Math.min(SNAP, dx))
    setSwipeX(clamped)
    setDir(clamped < 0 ? 'left' : clamped > 0 ? 'right' : null)
    if (Math.abs(clamped) === SNAP) haptic()
  }
  const onTouchEnd = () => {
    setSwiping(false)
    if (swipeX > THRESHOLD) {
      setSwipeX(0); setDir(null)
      setActionTarget({ bill, type: 'status' })
    } else if (swipeX < -THRESHOLD) {
      setSwipeX(-SNAP); setPending(true); haptic()
    } else {
      setSwipeX(0); setDir(null)
    }
    startXRef.current = null; startYRef.current = null
  }
  const confirmDelete = () => {
    haptic(); setPending(false); setSwipeX(0); setDir(null)
    setActionTarget({ bill, type: 'delete' })
  }
  const cancelDelete = () => { setPending(false); setSwipeX(0); setDir(null) }

  const catInfo = categoryInfo || FALLBACK_CATEGORY

  const hoje = new Date(); hoje.setHours(0,0,0,0)
  const venc = new Date(bill.data + 'T12:00:00'); venc.setHours(0,0,0,0)
  const dias = Math.ceil((venc - hoje) / 86400000)
  const isUrgente = !bill.pago && dias >= 0 && dias <= 3

  return (
    <div className="relative overflow-hidden rounded-2xl group">
      {/* Fundo esquerda — pagar/reabrir */}
      <div className={`absolute inset-y-0 left-0 flex items-center px-4 transition-opacity duration-150 ${dir==='right'?'opacity-100':'opacity-0'}`}
        style={{ backgroundColor:'#10b981', width: Math.max(swipeX,0) }}>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 size={16} className="text-white"/>
          <span className="text-[9px] font-black text-white uppercase whitespace-nowrap">{bill.pago ? 'Reabrir' : 'Pagar'}</span>
        </div>
      </div>
      {/* Fundo direita — deletar */}
      <div className={`absolute inset-y-0 right-0 flex items-center justify-end px-4 transition-all duration-150 ${dir==='left'?'opacity-100':'opacity-0'}`}
        style={{ backgroundColor: pending ? '#b91c1c' : '#ef4444', width: Math.abs(Math.min(swipeX,0)) }}>
        {pending
          ? <div className="flex items-center gap-2">
              <button onTouchEnd={e=>{e.stopPropagation();confirmDelete()}} onClick={confirmDelete}
                className="text-[10px] font-black text-white bg-white/20 px-2 py-1 rounded-lg whitespace-nowrap active:scale-95">
                ✓ Confirmar
              </button>
              <button onTouchEnd={e=>{e.stopPropagation();cancelDelete()}} onClick={cancelDelete}
                className="text-[9px] font-black text-white/70 whitespace-nowrap active:scale-95">✕</button>
            </div>
          : <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-black text-white uppercase whitespace-nowrap">Excluir</span>
              <Trash2 size={16} className="text-white"/>
            </div>
        }
      </div>

      <div
        className={`bg-white border shadow-sm flex flex-col gap-2.5 p-3.5 rounded-2xl transition-colors ${
          isUrgente ? 'border-rose-100' : 'border-gray-100'
        }`}
        style={{ transform: `translateX(${swipeX}px)`, transition: swiping ? 'none' : 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}
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

// ─── Main BillsList Component ────────────────────────────────────────────────
export const BillsList = ({ 
  transactions, 
  allTransactions, 
  onTogglePaid, 
  onEdit, 
  onDelete, 
  isLoading, 
  cartoes = [], 
  currentDate,
  onCriarCartao,
  onEditarCartao,
  onExcluirCartao
}) => {
  const [sortBy, setSortBy]             = useState('vencimento')
  const [isReversed, setIsReversed]     = useState(false)
  const [showPaid, setShowPaid]         = useState(false)
  const [actionTarget, setActionTarget] = useState(null)

  const faturasBills = useMemo(() => {
    const bills = []
    ;(cartoes || []).forEach(c => {
      const faturas = getFaturasExibicao(c, allTransactions, currentDate)
      faturas.forEach((f, fi) => {
        bills.push({
          id:             `fatura-virtual-${c.id}-${fi}`,
          _isFatura:      true,
          _cartaoId:      c.id,
          _cartaoNome:    c.nome,
          _fatura:        f,
          _label:         f._label,
          tipo:           'pagamento_cartao',
          descricao:      fi === 0 ? `Fatura ${c.nome}` : `Próx. Fatura ${c.nome}`,
          valor:          f.saldo,
          pago:           f.pago,
          data:           f.vencStr,
          categoria:      'Cartão',
          recorrencia_id: null,
        })
      })
    })
    return bills
  }, [cartoes, allTransactions, currentDate])

  const rawBills = useMemo(() => {
    const contas = (transactions || []).filter(t => t.tipo === 'fixa' || t.tipo === 'esporadica')
    return [...contas, ...faturasBills]
  }, [transactions, faturasBills])

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

  // Separar dívidas
  const isDivida = (b) => {
    const cat = (b.categoria || '').toLowerCase()
    const desc = (b.descricao || '').toLowerCase()
    return cat.includes('empr') || cat.includes('financ') || cat.includes('dívida') ||
           desc.includes('empr') || desc.includes('financ') || desc.includes('parcel') ||
           desc.includes('itau') || desc.includes('shopee') || desc.includes('mercado pago') ||
           desc.includes('bradesco') || desc.includes('sonia') || desc.includes('dasmei')
  }
  const pendingDividas = useMemo(() => pending.filter(isDivida),  [pending])
  const pendingContas  = useMemo(() => pending.filter(b => !isDivida(b) && !b._isFatura), [pending])
  const pendingFaturas = useMemo(() => pending.filter(b => b._isFatura), [pending])

  const handleConfirmAction = (allSeries) => {
    if (!actionTarget) return
    const { bill, type } = actionTarget
    if (type === 'delete' && onDelete)          onDelete(bill.id, allSeries, bill.recorrencia_id)
    else if (type === 'status' && onTogglePaid) onTogglePaid(bill.id, allSeries, bill.recorrencia_id)
    else if (type === 'edit' && onEdit)         onEdit(bill, allSeries)
    setActionTarget(null)
  }

  const renderBill = (bill) => {
    if (!bill) return null
    
    if (bill._isFatura) {
      return <FaturaVirtualItem key={bill.id} bill={bill} onEdit={onEdit} setActionTarget={setActionTarget} />
    }
    const rawStats = bill.recorrencia_id ? recurrenceStatsMap[bill.recorrencia_id] : null
    const stats = rawStats ? {
      total: rawStats.total, 
      paid: rawStats.paid,
      percent: Math.round((rawStats.paid / rawStats.total) * 100),
    } : null
    
    const categoryInfo = categoryIcons && bill.categoria ? categoryIcons[bill.categoria] : FALLBACK_CATEGORY
    
    return (
      <SwipeableBillItem 
        key={bill.id} 
        bill={bill} 
        stats={stats}
        categoryInfo={categoryInfo || FALLBACK_CATEGORY} 
        onEdit={onEdit} 
        setActionTarget={setActionTarget} 
      />
    )
  }

  return (
    <div className="space-y-4">
      <ActionConfirmationModal target={actionTarget} onClose={() => setActionTarget(null)} onConfirm={handleConfirmAction} />

      {/* Cartões Resumo no topo */}
      <CartoesResumo
        cartoes={cartoes}
        allTransactions={allTransactions}
        currentDate={currentDate}
        onCriar={onCriarCartao}
        onEditar={onEditarCartao}
        onExcluir={onExcluirCartao}
      />

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
            {/* Faturas de cartão */}
            {pendingFaturas.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"/>
                  <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">
                    Faturas · {pendingFaturas.length}
                  </span>
                </div>
                <div className="space-y-2.5">{pendingFaturas.map(renderBill)}</div>
              </div>
            )}

            {/* Contas do mês */}
            {pendingContas.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400"/>
                  <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">
                    Contas · {pendingContas.length}
                  </span>
                </div>
                <div className="space-y-2.5">{pendingContas.map(renderBill)}</div>
              </div>
            )}

            {/* Dívidas */}
            {pendingDividas.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500"/>
                    <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest">
                      Dívidas · {pendingDividas.length}
                    </span>
                  </div>
                  <span className="text-[9px] font-black text-rose-500">
                    R$ {pendingDividas.reduce((s,b)=>s+(parseFloat(b.valor)||0),0)
                          .toLocaleString('pt-BR',{minimumFractionDigits:2})}
                  </span>
                </div>
                <div className="space-y-2.5">{pendingDividas.map(renderBill)}</div>
              </div>
            )}

            {pending.length === 0 && (
              <div className="text-center py-10 bg-white rounded-2xl border-2 border-dashed border-gray-100 italic text-gray-400 text-[10px]">
                Nenhuma conta pendente 🎉
              </div>
            )}

            {/* Pagas */}
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