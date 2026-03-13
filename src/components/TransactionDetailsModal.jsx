import React from 'react'
import { 
  X, Calendar, Tag, Info, DollarSign, CheckCircle2, 
  AlertCircle, ArrowRightLeft, Clock 
} from 'lucide-react'

export const TransactionDetailsModal = ({ isOpen, onClose, transaction }) => {
  if (!isOpen || !transaction) return null

  const isIncome = transaction.tipo === 'renda' || (transaction.tipo === 'reserva' && Number(transaction.valor) > 0)
  
  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date + 'T12:00:00').toLocaleDateString('pt-BR')
  }

  const formatDateTime = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo'
    })
  }

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
        <div className={`p-6 pb-8 flex justify-between items-start ${
          isIncome ? 'bg-emerald-50' : 'bg-rose-50'
        }`}>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Detalhes da Transação</p>
            <h3 className="text-xl font-black text-gray-800 leading-tight">{transaction.descricao}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-full transition-colors text-gray-400">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 -mt-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${isIncome ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                <DollarSign size={18} />
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase">Valor</p>
                <p className={`text-lg font-black ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                  R$ {Math.abs(Number(transaction.valor)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            {transaction.pago ? (
              <span className="flex items-center gap-1 bg-emerald-50 text-emerald-600 text-[8px] font-black px-2 py-1 rounded-lg uppercase">
                <CheckCircle2 size={10} /> Pago
              </span>
            ) : (
              <span className="flex items-center gap-1 bg-amber-50 text-amber-600 text-[8px] font-black px-2 py-1 rounded-lg uppercase">
                <AlertCircle size={10} /> Aberto
              </span>
            )}
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-[8px] font-bold text-gray-400 uppercase flex items-center gap-1"><Tag size={10}/> Categoria</p>
              <p className="text-[11px] font-black text-gray-700">{transaction.categoria || 'Geral'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[8px] font-bold text-gray-400 uppercase flex items-center gap-1"><Calendar size={10}/> Data Ref.</p>
              <p className="text-[11px] font-black text-gray-700">{formatDate(transaction.data)}</p>
            </div>
            <div className="col-span-2 space-y-1">
              <p className="text-[8px] font-bold text-gray-400 uppercase flex items-center gap-1"><Clock size={10}/> Data do Pagamento / Fluxo</p>
              <p className="text-[11px] font-black text-gray-700">{transaction.data_pagamento ? formatDateTime(transaction.data_pagamento) : 'Não registrado'}</p>
            </div>
          </div>

          {(transaction.destino_reserva || transaction.subcategoria) && (
            <div className="pt-4 border-t border-gray-50 space-y-2">
              {transaction.destino_reserva && (
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-400 font-bold uppercase flex items-center gap-1.5"><ArrowRightLeft size={12}/> Destino</span>
                  <span className="text-indigo-600 font-black">{transaction.destino_reserva}</span>
                </div>
              )}
              {transaction.subcategoria && (
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-400 font-bold uppercase">Subcategoria</span>
                  <span className="text-gray-700 font-black">{transaction.subcategoria}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 pt-0">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-gray-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-gray-800 transition-all active:scale-95"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}