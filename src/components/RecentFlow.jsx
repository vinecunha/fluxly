import React, { useState } from 'react'
import { 
  Calendar, Trash2, Edit3, ChevronLeft, ChevronRight, Fuel,
  ShoppingCart, Home, Car, Palmtree, Pill, GraduationCap, CreditCard, Banknote, Hexagon,
  TrendingUp, List, Clock, Repeat, AlertCircle, PiggyBank, Building2, ArrowDownCircle,
  ArrowUpCircle
} from 'lucide-react'
import { ActionConfirmationModal } from './BillsList'

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

export const RecentFlow = ({ transactions, onDelete, onEdit, isLoading, currentViewDate }) => {
  const [filter, setFilter] = useState('all')
  const [timeFilter, setTimeFilter] = useState('all') // Novo estado separado para tempo
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [actionTarget, setActionTarget] = useState(null)

  const filteredData = (transactions || []).filter(t => {
    const transDateStr = t.data;
    const pDate = t.data_pagamento ? new Date(t.data_pagamento) : null;
    const effectiveDate = pDate || new Date(t.data + 'T12:00:00');
    
    if (effectiveDate.getMonth() !== currentViewDate.getMonth() || 
        effectiveDate.getFullYear() !== currentViewDate.getFullYear()) return false

    const isFlowItem = t.tipo === 'renda' || t.tipo === 'gasto_diario' || t.tipo === 'reserva' || t.tipo === 'retirada' || t.pago
    if (!isFlowItem) return false

    // 1. Filtro de Tipo (Entrada/Saída)
    const isIncome = t.tipo === 'renda' || (t.tipo === 'reserva' && Number(t.valor) > 0)
    const isExpense = t.tipo === 'gasto_diario' || t.pago || t.tipo === 'retirada' || (t.tipo === 'reserva' && Number(t.valor) < 0)

    if (filter === 'incomes' && !isIncome) return false
    if (filter === 'expenses' && !isExpense) return false

    // 2. Filtro de Tempo (Hoje/7 Dias)
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
    if (timeFilter === 'today' && transDateStr !== todayStr) return false
    
    if (timeFilter === '7days') {
      const today = new Date(todayStr + 'T12:00:00');
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      const tDate = new Date(transDateStr + 'T12:00:00');
      if (!(tDate >= weekAgo && tDate <= today)) return false
    }
    
    return true
  }).sort((a, b) => {
    const dateA = a.data_pagamento ? new Date(a.data_pagamento) : new Date(a.data + 'T12:00:00')
    const dateB = b.data_pagamento ? new Date(b.data_pagamento) : new Date(b.data + 'T12:00:00')
    return dateB - dateA
  })

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage)

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
  }

  const handleConfirmAction = (allSeries) => {
    if (!actionTarget) return
    const { bill, type } = actionTarget
    if (type === 'delete') onDelete(bill.id, allSeries, bill.recorrencia_id)
    else if (type === 'edit') onEdit(bill, allSeries)
    setActionTarget(null)
  }

  return (
    <section className="space-y-5">
      <ActionConfirmationModal target={actionTarget} onClose={() => setActionTarget(null)} onConfirm={handleConfirmAction} />

      <div className="flex flex-col gap-4 px-1">
        <div className="flex items-center justify-between">
          <h4 className="text-gray-500 font-bold text-[10px] uppercase tracking-[0.2em]">Fluxo de Caixa</h4>
          <div className="flex items-center gap-2">
            <select 
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="text-[9px] font-black bg-white text-gray-400 border border-gray-100 rounded-lg px-2 py-1 outline-none shadow-sm appearance-none cursor-pointer"
              disabled={isLoading}
            >
              <option value={10}>10 LINHAS</option>
              <option value={20}>20 LINHAS</option>
            </select>
            <span className="text-[9px] bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-black uppercase tracking-tighter">
              {isLoading ? '...' : filteredData.length} Movimentações
            </span>
          </div>
        </div>

        {/* Filtros Separados */}
        <div className="flex flex-wrap items-center justify-between gap-y-3">
          {/* Lado Esquerdo: Tipo de Movimentação */}
          <div className="flex items-center gap-1 bg-gray-50/50 p-1 rounded-xl border border-gray-100">
            {[
              { id: 'all', label: 'Tudo', icon: <List size={10} /> },
              { id: 'incomes', label: 'Entradas', icon: <ArrowUpCircle size={10} /> },
              { id: 'expenses', label: 'Saídas', icon: <ArrowDownCircle size={10} /> },
            ].map((btn) => (
              <button 
                key={btn.id} 
                onClick={() => { setFilter(btn.id); setCurrentPage(1); }} 
                className={`flex items-center gap-1.5 text-[8px] font-black uppercase px-2.5 py-1.5 rounded-lg transition-all ${
                  filter === btn.id 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {btn.icon}
                {btn.label}
              </button>
            ))}
          </div>

          {/* Lado Direito: Período */}
          <div className="flex items-center gap-1 bg-gray-50/50 p-1 rounded-xl border border-gray-100">
            {[
              { id: 'all', label: 'Mês', icon: <Calendar size={10} /> },
              { id: 'today', label: 'Hoje', icon: <Clock size={10} /> },
              { id: '7days', label: '7D', icon: <Calendar size={10} /> }
            ].map((btn) => (
              <button 
                key={btn.id} 
                onClick={() => { setTimeFilter(btn.id); setCurrentPage(1); }} 
                className={`flex items-center gap-1.5 text-[8px] font-black uppercase px-2.5 py-1.5 rounded-lg transition-all ${
                  timeFilter === btn.id 
                  ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' 
                  : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {btn.icon}
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
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
        ) : paginatedData.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-[2rem] border-2 border-dashed border-gray-100 text-gray-400 text-[10px] italic">
            Nenhuma movimentação para o filtro selecionado.
          </div>
        ) : (
          paginatedData.map(item => {
            const isIncome = item.tipo === 'renda'
            const isReserva = item.tipo === 'reserva' && Number(item.valor) > 0
            const isRetirada = item.tipo === 'retirada' || (item.tipo === 'reserva' && Number(item.valor) < 0)
            
            let categoryInfo = categoryIcons[item.categoria] || categoryIcons["Outros"]
            
            if (isIncome) {
              categoryInfo = { icon: <TrendingUp size={14} />, color: "bg-emerald-50 text-emerald-600" }
            } else if (isReserva) {
              categoryInfo = { icon: <PiggyBank size={14} />, color: "bg-purple-50 text-purple-600" }
            } else if (isRetirada) {
              categoryInfo = { icon: <ArrowDownCircle size={14} />, color: "bg-orange-50 text-orange-600" }
            }

            const dueDate = new Date(item.data + 'T23:59:59')
            const paidDate = item.data_pagamento ? new Date(item.data_pagamento) : null
            const isLate = paidDate && paidDate > dueDate && item.tipo !== 'renda' && item.tipo !== 'gasto_diario' && !isReserva && !isRetirada

            return (
              <div key={item.id} className="bg-white p-3.5 rounded-[2rem] flex justify-between items-center border border-gray-100 shadow-sm gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm ${categoryInfo.color}`}>
                    {categoryInfo.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-gray-800 text-[13px] leading-tight truncate">{item.descricao}</p>
                      {item.recorrencia_id && <Repeat size={10} className="text-orange-400 flex-shrink-0" />}
                      {isLate && (
                        <span className="flex items-center gap-0.5 bg-rose-50 text-rose-500 text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase border border-rose-100">
                          <AlertCircle size={8} /> Atrasado
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[8px] font-black text-gray-400 uppercase mt-1">
                      <span className="whitespace-nowrap">
                        {item.data_pagamento 
                          ? new Date(item.data_pagamento).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                          : new Date(item.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                        }
                      </span>
                      {item.data_pagamento && (
                        <>
                          <span className="w-0.5 h-0.5 bg-gray-200 rounded-full" />
                          <span className={`${(isReserva || isRetirada) ? 'text-indigo-400' : 'text-orange-600'} flex items-center gap-0.5`}>
                            <Clock size={8} /> {new Date(item.data_pagamento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}
                          </span>
                        </>
                      )}
                      <span className="w-0.5 h-0.5 bg-gray-200 rounded-full" />
                      <span className={`${isReserva ? 'text-purple-500' : isRetirada ? 'text-orange-500' : 'text-indigo-400'} truncate`}>
                        {isReserva || isRetirada ? (item.destino_reserva || 'Reserva') : (item.categoria || 'Geral')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end flex-shrink-0">
                  <span className={`font-black text-xs whitespace-nowrap ${
                    isIncome ? 'text-emerald-600' : isRetirada ? 'text-orange-600' :
                    isReserva ? 'text-purple-600' : 
                    'text-rose-600'
                  }`}>
                    {isReserva ? '→ ' : isRetirada ? '← ' : ''} R$ {Math.abs(Number(item.valor)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <div className="flex gap-2 mt-1">
                    <button 
                      onClick={() => item.recorrencia_id ? setActionTarget({ bill: item, type: 'edit' }) : onEdit(item)}
                      className="p-1 text-gray-300 active:text-indigo-500 transition-colors"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button 
                      onClick={() => setActionTarget({ bill: item, type: 'delete' })}
                      className="p-1 text-gray-300 active:text-rose-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between px-1 pt-1">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{currentPage}/{totalPages}</p>
          <div className="flex gap-1.5">
            <button disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)} className="p-2 bg-white border border-gray-100 rounded-xl text-gray-500 disabled:opacity-20 shadow-sm active:scale-90"><ChevronLeft size={16} /></button>
            <button disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)} className="p-2 bg-white border border-gray-100 rounded-xl text-gray-500 disabled:opacity-20 shadow-sm active:scale-90"><ChevronRight size={16} /></button>
          </div>
        </div>
      )}
    </section>
  )
}