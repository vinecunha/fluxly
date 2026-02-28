import React from 'react'
import { Calendar, CheckCircle2, Circle, Clock } from 'lucide-react'

export const BillsList = ({ transactions, onTogglePaid }) => {
  const bills = transactions.filter(t => t.tipo === 'fixa' || t.tipo === 'esporadica')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-1">
        <h4 className="text-gray-500 font-bold text-[10px] uppercase tracking-[0.2em]">Agenda de Contas</h4>
        <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full font-bold">
          {bills.filter(b => !b.pago).length} Pendentes
        </span>
      </div>

      <div className="space-y-3">
        {bills.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-3xl border-2 border-dashed border-gray-100 italic text-gray-400 text-sm">
            Nenhuma conta agendada para este mês.
          </div>
        ) : (
          bills.map(bill => (
            <div key={bill.id} className="bg-white p-4 rounded-2xl flex justify-between items-center border border-gray-100 shadow-sm transition-all">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => onTogglePaid(bill.id, !bill.pago)}
                  className={`transition-colors ${bill.pago ? 'text-emerald-500' : 'text-gray-300'}`}
                >
                  {bill.pago ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                </button>
                
                <div>
                  <p className={`font-bold text-sm ${bill.pago ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                    {bill.descricao}
                  </p>
                  <div className="flex flex-col gap-1 mt-0.5">
                    <div className="flex items-center gap-1 text-[9px] text-gray-400 font-bold uppercase tracking-tighter">
                      <Calendar size={10} />
                      <span>Vence {new Date(bill.data + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                    </div>
                    {bill.pago && bill.data_pagamento && (
                      <div className="flex items-center gap-1 text-[9px] text-emerald-500 font-black uppercase tracking-tighter">
                        <Clock size={10} />
                        <span>Pago em {new Date(bill.data_pagamento).toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className={`font-black text-sm ${bill.pago ? 'text-gray-400' : 'text-rose-600'}`}>
                  R$ {Number(bill.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}