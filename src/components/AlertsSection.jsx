import React, { useState, useMemo } from 'react'
import { AlertCircle, Clock, CheckCircle2, ChevronRight, ChevronLeft, X } from 'lucide-react'

const AlertSlider = ({ title, list, isExpired, onQuickPay }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPayPromptOpen, setIsPayPromptOpen] = useState(false)
  const [paidValue, setPaidValue] = useState('')

  if (list.length === 0) return null

  const currentBill = list[currentIndex]

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % list.length)
    setIsPayPromptOpen(false)
  }
  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + list.length) % list.length)
    setIsPayPromptOpen(false)
  }

  const handleInitialPayClick = () => {
    if (isExpired) {
      setPaidValue(currentBill.valor.toString())
      setIsPayPromptOpen(true)
    } else {
      onQuickPay(currentBill.id)
    }
  }

  const confirmPayment = () => {
    onQuickPay(currentBill.id, false, null, Number(paidValue))
    setIsPayPromptOpen(false)
    setPaidValue('')
    if (list.length > 1) nextSlide()
  }

  return (
    <div className="space-y-3 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex justify-between items-center px-2">
        <p className={`text-[9px] font-black uppercase tracking-widest ${isExpired ? 'text-rose-500' : 'text-gray-400'}`}>
          {title} ({currentIndex + 1}/{list.length})
        </p>
        {list.length > 1 && (
          <div className="flex gap-1">
            <button onClick={prevSlide} className="p-1.5 rounded-full bg-gray-100 text-gray-400 active:scale-90 transition-all">
              <ChevronLeft size={12} strokeWidth={3} />
            </button>
            <button onClick={nextSlide} className="p-1.5 rounded-full bg-gray-100 text-gray-400 active:scale-90 transition-all">
              <ChevronRight size={12} strokeWidth={3} />
            </button>
          </div>
        )}
      </div>

      <div className={`relative overflow-hidden rounded-[2.5rem] p-4 shadow-sm border transition-all duration-500 ${
        isExpired ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'
      }`}>
        <div className={`flex items-center justify-between gap-3 transition-all duration-300 ${isPayPromptOpen ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={`p-2.5 rounded-2xl text-white shadow-lg flex-shrink-0 ${
              isExpired ? 'bg-rose-500 shadow-rose-200' : 'bg-amber-500 shadow-amber-200'
            }`}>
              {isExpired ? <AlertCircle size={18} /> : <Clock size={18} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className={`text-[8px] font-black uppercase tracking-wider ${isExpired ? 'text-rose-400' : 'text-amber-500'}`}>
                  {isExpired ? 'Atrasada' : 'Vence em breve'}
                </p>
                <span className="text-[7px] px-1 py-0.5 rounded-full bg-white/50 text-gray-500 font-black uppercase border border-black/5">
                  {currentBill.tipo}
                </span>
              </div>
              <h3 className="text-[13px] font-bold text-gray-800 leading-tight mt-0.5 truncate">{currentBill.descricao}</h3>
              <p className="text-[9px] font-bold text-gray-500 mt-0.5">
                R$ {Number(currentBill.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} • {new Date(currentBill.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              </p>
            </div>
          </div>
          <button
            onClick={handleInitialPayClick}
            className={`flex items-center gap-1.5 px-4 py-3 rounded-2xl font-black text-[9px] uppercase transition-all active:scale-95 shadow-md flex-shrink-0 ${
              isExpired ? 'bg-rose-500 text-white shadow-rose-200' : 'bg-amber-500 text-white shadow-amber-200'
            }`}
          >
            <CheckCircle2 size={14} strokeWidth={3} /> Paguei
          </button>
        </div>

        {isPayPromptOpen && (
          <div className="absolute inset-0 flex items-center p-4 bg-rose-50/95 backdrop-blur-sm animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex-1 space-y-2">
              <p className="text-[9px] font-black text-rose-500 uppercase">Valor final pago (com juros?)</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-rose-400">R$</span>
                  <input
                    type="number"
                    value={paidValue}
                    onChange={(e) => setPaidValue(e.target.value)}
                    autoFocus
                    className="w-full bg-white border border-rose-200 rounded-xl py-2 pl-8 pr-3 text-[13px] font-bold text-rose-600 outline-none focus:ring-2 ring-rose-300"
                  />
                </div>
                <button onClick={confirmPayment} className="bg-rose-500 text-white px-4 rounded-xl font-black text-[9px] uppercase shadow-lg active:scale-95">
                  Confirmar
                </button>
                <button onClick={() => setIsPayPromptOpen(false)} className="p-2 text-rose-400"><X size={18} /></button>
              </div>
            </div>
          </div>
        )}
      </div>

      {list.length > 1 && (
        <div className="flex justify-center gap-1 mt-1">
          {list.map((_, idx) => (
            <div key={idx} className={`h-1 rounded-full transition-all duration-300 ${
              idx === currentIndex ? `w-4 ${isExpired ? 'bg-rose-400' : 'bg-amber-400'}` : 'w-1 bg-gray-200'
            }`} />
          ))}
        </div>
      )}
    </div>
  )
}

export const AlertsSection = ({ transactions, onQuickPay }) => {
  const { expiredBills, upcomingBills } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const expiredBills = []
    const upcomingBills = []

    for (const t of transactions || []) {
      if (t.tipo === 'renda' || t.tipo === 'reserva' || t.tipo === 'gasto_diario' || t.pago) continue
      const dueDate = new Date(t.data + 'T12:00:00')
      dueDate.setHours(0, 0, 0, 0)
      const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24))
      if (dueDate < today) expiredBills.push(t)
      else if (diffDays <= 3) upcomingBills.push(t)
    }

    expiredBills.sort((a, b) => new Date(a.data) - new Date(b.data))
    upcomingBills.sort((a, b) => new Date(a.data) - new Date(b.data))
    return { expiredBills, upcomingBills }
  }, [transactions])

  if (expiredBills.length === 0 && upcomingBills.length === 0) return null

  return (
    <div className="mb-8 space-y-6">
      <AlertSlider title="🚨 Contas Vencidas" list={expiredBills} isExpired={true} onQuickPay={onQuickPay} />
      <AlertSlider title="⏳ Próximos Vencimentos (Em até 3 dias)" list={upcomingBills} isExpired={false} onQuickPay={onQuickPay} />
    </div>
  )
}