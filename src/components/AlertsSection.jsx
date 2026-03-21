import React, { useState, useMemo, useEffect } from 'react'
import { AlertCircle, Clock, CheckCircle2, ChevronRight, ChevronLeft, X } from 'lucide-react'

const AlertSlider = ({ title, list, isExpired, onQuickPay, isSaving }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPayPromptOpen, setIsPayPromptOpen] = useState(false)
  const [paidValue, setPaidValue] = useState('')
  const [justPaid, setJustPaid] = useState(false)

  useEffect(() => {
    if (currentIndex >= list.length && list.length > 0) setCurrentIndex(list.length - 1)
  }, [list.length, currentIndex])

  if (list.length === 0) return null

  const currentBill = list[currentIndex]

  const next = () => { setCurrentIndex(p => (p + 1) % list.length); setIsPayPromptOpen(false) }
  const prev = () => { setCurrentIndex(p => (p - 1 + list.length) % list.length); setIsPayPromptOpen(false) }

  const handlePayClick = () => {
    const today = new Date(); today.setHours(0,0,0,0)
    const due   = new Date(currentBill.data + 'T12:00:00'); due.setHours(0,0,0,0)
    if (due <= today) {
      setPaidValue(currentBill.valor.toString())
      setIsPayPromptOpen(true)
    } else {
      triggerPay(currentBill.id, null)
    }
  }

  const confirmPayment = () => {
    triggerPay(currentBill.id, Number(paidValue))
    setIsPayPromptOpen(false)
    setPaidValue('')
  }

  const triggerPay = (id, valorFinal) => {
    setJustPaid(true)
    setTimeout(() => setJustPaid(false), 1500)
    onQuickPay(id, false, null, valorFinal)
  }

  const accent     = isExpired ? 'rose' : 'amber'
  const bgCard     = isExpired ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'
  const bgBtn      = isExpired ? 'bg-rose-500 shadow-rose-200' : 'bg-amber-500 shadow-amber-200'
  const textAccent = isExpired ? 'text-rose-500' : 'text-amber-500'
  const dotActive  = isExpired ? 'bg-rose-400' : 'bg-amber-400'

  return (
    <div className="space-y-2">
      {/* Título + navegação */}
      <div className="flex items-center justify-between px-1">
        <p className={`text-[9px] font-black uppercase tracking-widest ${textAccent}`}>
          {title} · {currentIndex + 1}/{list.length}
        </p>
        {list.length > 1 && (
          <div className="flex gap-1">
            <button onClick={prev} className="p-1.5 rounded-xl bg-white border border-gray-100 text-gray-400 active:scale-90 transition-all shadow-sm" style={{ minHeight: 32, minWidth: 32 }}>
              <ChevronLeft size={12} strokeWidth={3} />
            </button>
            <button onClick={next} className="p-1.5 rounded-xl bg-white border border-gray-100 text-gray-400 active:scale-90 transition-all shadow-sm" style={{ minHeight: 32, minWidth: 32 }}>
              <ChevronRight size={12} strokeWidth={3} />
            </button>
          </div>
        )}
      </div>

      {/* Card */}
      <div className={`relative overflow-hidden rounded-2xl border ${bgCard}`} style={{ minHeight: 72 }}>

        {/* Feedback pago */}
        {justPaid && (
          <div className="absolute inset-0 flex items-center justify-center bg-emerald-50/95 rounded-2xl z-10 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={20} className="text-emerald-500" />
              <p className="text-[11px] font-black text-emerald-600 uppercase">Registrado!</p>
            </div>
          </div>
        )}

        {/* Conteúdo */}
        <div className={`flex items-center gap-3 p-3.5 transition-all duration-200 ${isPayPromptOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <div className={`p-2.5 rounded-xl text-white flex-shrink-0 ${bgBtn}`}>
            {isExpired ? <AlertCircle size={16} /> : <Clock size={16} />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className={`text-[8px] font-black uppercase ${textAccent}`}>
                {isExpired ? 'Vencida' : 'Vence em breve'}
              </span>
              <span className="text-[7px] px-1 py-0.5 rounded bg-white/60 text-gray-500 font-bold uppercase">
                {currentBill.tipo}
              </span>
            </div>
            <p className="text-[13px] font-bold text-gray-800 leading-tight truncate">{currentBill.descricao}</p>
            <p className="text-[9px] font-bold text-gray-400 mt-0.5">
              R$ {Number(currentBill.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              {' · '}
              {new Date(currentBill.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            </p>
          </div>
          <button
            onClick={handlePayClick}
            disabled={isSaving || justPaid}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl font-black text-[9px] uppercase transition-all active:scale-95 shadow-md flex-shrink-0 disabled:opacity-50 text-white ${bgBtn}`}
            style={{ minHeight: 40 }}>
            <CheckCircle2 size={13} strokeWidth={3} />
            {isSaving ? '...' : 'Paguei'}
          </button>
        </div>

        {/* Prompt valor */}
        {isPayPromptOpen && (
          <div className="absolute inset-0 flex items-center p-3.5 bg-rose-50/95 animate-in fade-in slide-in-from-right-2 duration-200">
            <div className="flex-1 space-y-2">
              <p className="text-[9px] font-black text-rose-500 uppercase">Valor final pago</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-rose-400">R$</span>
                  <input
                    type="number" value={paidValue} onChange={e => setPaidValue(e.target.value)}
                    autoFocus
                    className="w-full bg-white border border-rose-200 rounded-xl py-2 pl-8 pr-2 text-sm font-bold text-rose-700 outline-none focus:ring-2 ring-rose-300"
                    style={{ minHeight: 40 }}
                  />
                </div>
                <button onClick={confirmPayment} disabled={isSaving}
                  className="bg-rose-500 text-white px-3.5 rounded-xl font-black text-[9px] uppercase active:scale-95 disabled:opacity-50"
                  style={{ minHeight: 40 }}>
                  {isSaving ? '...' : 'Ok'}
                </button>
                <button onClick={() => setIsPayPromptOpen(false)}
                  className="p-2 text-rose-400 active:scale-90"
                  style={{ minHeight: 40, minWidth: 40 }}>
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dots */}
      {list.length > 1 && (
        <div className="flex justify-center gap-1">
          {list.map((_, idx) => (
            <div key={idx} className={`h-1 rounded-full transition-all duration-300 ${
              idx === currentIndex ? `w-4 ${dotActive}` : 'w-1 bg-gray-200'
            }`} />
          ))}
        </div>
      )}
    </div>
  )
}

export function AlertsSection({ transactions, onQuickPay, isSaving }) {
  const { expiredBills, upcomingBills } = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0)
    const expired = [], upcoming = []
    for (const t of transactions || []) {
      if (t.tipo === 'renda' || t.tipo === 'reserva' || t.tipo === 'gasto_diario' || t.pago) continue
      const due = new Date(t.data + 'T12:00:00'); due.setHours(0,0,0,0)
      const diff = Math.ceil((due - today) / 86400000)
      if (due < today) expired.push(t)
      else if (diff <= 3) upcoming.push(t)
    }
    expired.sort((a, b) => new Date(a.data) - new Date(b.data))
    upcoming.sort((a, b) => new Date(a.data) - new Date(b.data))
    return { expiredBills: expired, upcomingBills: upcoming }
  }, [transactions])

  if (expiredBills.length === 0 && upcomingBills.length === 0) return null

  return (
    <div className="space-y-4">
      <AlertSlider title="Vencidas" list={expiredBills} isExpired={true} onQuickPay={onQuickPay} isSaving={isSaving} />
      <AlertSlider title="Próximos vencimentos" list={upcomingBills} isExpired={false} onQuickPay={onQuickPay} isSaving={isSaving} />
    </div>
  )
}