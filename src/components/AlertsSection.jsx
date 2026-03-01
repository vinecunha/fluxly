import React, { useState } from 'react'
import { AlertCircle, Clock, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react'

export const AlertsSection = ({ transactions, onQuickPay }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const allPending = (transactions || []).filter(t => {
    if (t.tipo === 'renda' || t.tipo === 'gasto_diario' || t.pago) return false
    if (t.tipo !== 'fixa' && t.tipo !== 'esporadica') return false

    const dueDate = new Date(t.data + 'T12:00:00')
    dueDate.setHours(0, 0, 0, 0)
    
    const diffTime = dueDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return dueDate < today || (diffDays <= 3 && diffDays >= 0)
  }).sort((a, b) => new Date(a.data) - new Date(b.data))

  // Separação por categorias com limite de 3 cada
  const expiredBills = allPending.filter(t => new Date(t.data + 'T12:00:00') < today).slice(0, 3)
  const upcomingBills = allPending.filter(t => new Date(t.data + 'T12:00:00') >= today).slice(0, 3)
  
  // Lista final consolidada para a paginação
  const displayList = [...expiredBills, ...upcomingBills]

  if (displayList.length === 0) return null

  const currentBill = displayList[currentIndex]
  const isExpired = new Date(currentBill.data + 'T12:00:00') < today

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % displayList.length)
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + displayList.length) % displayList.length)

  return (
    <div className="mb-8 space-y-3 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex justify-between items-center px-2">
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
          Atenção Necessária ({currentIndex + 1}/{displayList.length})
        </p>
        {displayList.length > 1 && (
          <div className="flex gap-1">
            <button onClick={prevSlide} className="p-1.5 rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 transition-colors">
              <ChevronLeft size={14} strokeWidth={3} />
            </button>
            <button onClick={nextSlide} className="p-1.5 rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 transition-colors">
              <ChevronRight size={14} strokeWidth={3} />
            </button>
          </div>
        )}
      </div>

      <div className={`rounded-[2.5rem] p-4 flex items-center justify-between shadow-sm border transition-all duration-500 ${
        isExpired ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl text-white shadow-lg ${
            isExpired ? 'bg-rose-500 shadow-rose-200' : 'bg-amber-500 shadow-amber-200'
          }`}>
            {isExpired ? <AlertCircle size={20} /> : <Clock size={20} />}
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <p className={`text-[10px] font-black uppercase tracking-widest ${
                isExpired ? 'text-rose-400' : 'text-amber-500'
              }`}>
                {isExpired ? 'Urgente: Atrasada' : 'Vence em breve'}
              </p>
              <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-white/50 text-gray-500 font-black uppercase border border-black/5">
                {currentBill.tipo}
              </span>
            </div>
            <h3 className="text-sm font-bold text-gray-800 leading-none mt-1">
              {currentBill.descricao}
            </h3>
            <p className="text-[10px] font-bold text-gray-500 mt-1">
              R$ {Number(currentBill.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} • {new Date(currentBill.data + 'T12:00:00').toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        <button 
          onClick={() => onQuickPay(currentBill.id)}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-black text-[10px] uppercase transition-all active:scale-90 shadow-md ${
            isExpired 
            ? 'bg-rose-500 text-white shadow-rose-200' 
            : 'bg-amber-500 text-white shadow-amber-200'
          }`}
        >
          <CheckCircle2 size={16} strokeWidth={3} />
          Paguei
        </button>
      </div>

      {/* Indicadores Visuais de Paginação */}
      {displayList.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {displayList.map((_, idx) => (
            <div 
              key={idx}
              className={`h-1 rounded-full transition-all duration-300 ${
                idx === currentIndex 
                ? (isExpired ? 'w-4 bg-rose-400' : 'w-4 bg-amber-400') 
                : 'w-1 bg-gray-200'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}