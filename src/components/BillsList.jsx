import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { Calendar, CheckCircle2, Circle, Edit2, Trash2, Repeat, ArrowUp, ArrowDown, X } from 'lucide-react'

export const BillsList = ({ transactions, allTransactions, onTogglePaid, onEdit, onDelete }) => {
  const [sortBy, setSortBy] = useState('vencimento')
  const [isReversed, setIsReversed] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const rawBills = (transactions || []).filter(t => t.tipo === 'fixa' || t.tipo === 'esporadica')

  const handleSort = (type) => {
    if (sortBy === type) {
      setIsReversed(!isReversed)
    } else {
      setSortBy(type)
      setIsReversed(false)
    }
  }

  const sortedBills = [...rawBills].sort((a, b) => {
    let comparison = 0
    if (sortBy === 'vencimento') {
      comparison = new Date(a.data + 'T12:00:00') - new Date(b.data + 'T12:00:00')
    } else if (sortBy === 'valor') {
      comparison = Number(a.valor) - Number(b.valor)
    } else if (sortBy === 'az') {
      comparison = a.descricao.localeCompare(b.descricao)
    }
    return isReversed ? comparison * -1 : comparison
  })

  const confirmDelete = (bill) => {
    // Agora define o alvo de deleção para qualquer tipo de conta
    setDeleteTarget(bill)
  }

  const getLastInstallment = (recorrenciaId) => {
    if (!recorrenciaId || !allTransactions) return null
    const installments = allTransactions
      .filter(t => t.recorrencia_id === recorrenciaId)
      .map(t => new Date(t.data + 'T12:00:00'))
    if (installments.length === 0) return null
    return new Date(Math.max(...installments))
  }

  // Componente de Modal usando Portal para garantir que fique ACIMA do Header
  const DeleteConfirmationModal = () => {
    if (!deleteTarget) return null

    const isRecorrente = !!deleteTarget.recorrencia_id

    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden">
        <div 
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setDeleteTarget(null)}
        />
        
        <div className="relative bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-[0_20px_60px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in duration-200">
          <div className="text-center">
            <div className="bg-rose-50 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 text-rose-500">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-black text-gray-800 mb-2 tracking-tight">Excluir Conta</h3>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              {isRecorrente 
                ? "Esta conta faz parte de uma série recorrente. Como deseja prosseguir?"
                : `Deseja realmente excluir "${deleteTarget.descricao}"?`}
            </p>
            
            <div className="space-y-3">
              {isRecorrente ? (
                <>
                  <button
                    onClick={() => {
                      onDelete(deleteTarget.id, true, deleteTarget.recorrencia_id)
                      setDeleteTarget(null)
                    }}
                    className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-200"
                  >
                    Toda a Série
                  </button>
                  <button
                    onClick={() => {
                      onDelete(deleteTarget.id, false, deleteTarget.recorrencia_id)
                      setDeleteTarget(null)
                    }}
                    className="w-full py-4 bg-gray-100 text-gray-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                  >
                    Apenas Este
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    onDelete(deleteTarget.id)
                    setDeleteTarget(null)
                  }}
                  className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-200"
                >
                  Confirmar Exclusão
                </button>
              )}
              
              <button
                onClick={() => setDeleteTarget(null)}
                className="w-full py-2 text-gray-400 font-bold text-[10px] uppercase tracking-widest pt-2 hover:text-gray-600 transition-colors"
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

  return (
    <div className="space-y-6">
      <DeleteConfirmationModal />

      <div className="flex items-center justify-between px-1">
        <div className="flex flex-col gap-1">
          <h4 className="text-gray-500 font-bold text-[10px] uppercase tracking-[0.2em]">Agenda de Contas</h4>
          <div className="flex items-center gap-1.5">
            {[
              { id: 'vencimento', label: 'Vencimento' },
              { id: 'valor', label: 'Valor' },
              { id: 'az', label: 'A-Z' }
            ].map((btn) => (
              <button 
                key={btn.id}
                onClick={() => handleSort(btn.id)}
                className={`flex items-center gap-1 text-[8px] font-black uppercase px-2 py-1 rounded-lg transition-all ${
                  sortBy === btn.id ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-white text-gray-400 border border-gray-100'
                }`}
              >
                {btn.label}
                {sortBy === btn.id && (
                  isReversed ? <ArrowUp size={8} strokeWidth={4} /> : <ArrowDown size={8} strokeWidth={4} />
                )}
              </button>
            ))}
          </div>
        </div>
        <span className="text-[10px] bg-indigo-100 text-indigo-600 px-3 py-1.5 rounded-2xl font-bold shadow-sm">
          {rawBills.filter(b => !b.pago).length} Pendentes
        </span>
      </div>

      <div className="space-y-3">
        {sortedBills.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-3xl border-2 border-dashed border-gray-100 italic text-gray-400 text-sm">
            Nenhuma conta agendada para este mês.
          </div>
        ) : (
          sortedBills.map(bill => {
            const lastDateObj = getLastInstallment(bill.recorrencia_id)
            const lastDateStr = lastDateObj ? lastDateObj.toLocaleDateString('pt-BR') : null
            
            return (
              <div key={bill.id} className="group bg-white p-4 rounded-2xl border border-gray-100 shadow-sm transition-all hover:border-indigo-200">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => onTogglePaid(bill.id)}
                      className={`transition-colors ${bill.pago ? 'text-emerald-500' : 'text-gray-300 hover:text-indigo-400'}`}
                    >
                      {bill.pago ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                    </button>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`font-bold text-sm ${bill.pago ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                          {bill.descricao}
                        </p>
                        {bill.recorrencia_id && (
                          <span className="flex items-center gap-1 text-[7px] bg-orange-50 text-orange-500 px-1.5 py-0.5 rounded font-black uppercase">
                            <Repeat size={8} /> Recorrente
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 mt-1">
                        <div className="flex items-center gap-1 text-[9px] text-gray-400 font-bold uppercase">
                          <Calendar size={10} />
                          <span>Vence {new Date(bill.data + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                        </div>
                        
                        {lastDateStr && (
                          <div className="flex items-center gap-1 text-[8px] text-gray-400 font-bold">
                            <span className="text-indigo-500">Última parcela em:</span> {lastDateStr}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <p className={`font-black text-sm ${bill.pago ? 'text-gray-400' : 'text-rose-600'}`}>
                      R$ {Number(bill.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => onEdit(bill)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => confirmDelete(bill)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}