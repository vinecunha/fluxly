import React, { useState } from 'react'
import { Calendar, MoreVertical, Trash2, Edit3, ChevronLeft, ChevronRight } from 'lucide-react'

export const RecentFlow = ({ transactions, onDelete, onEdit }) => {
  const [filter, setFilter] = useState('all')
  const [activeMenu, setActiveMenu] = useState(null)
  
  // Estados de Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // 1. Filtragem Inicial
  const filteredData = transactions.filter(t => {
    if (t.tipo !== 'renda' && t.tipo !== 'gasto_diario') return false
    const transDateString = new Date(t.data).toISOString().split('T')[0]
    const todayString = new Date().toISOString().split('T')[0]

    if (filter === 'today') return transDateString === todayString
    if (filter === '7days') {
      const transDate = new Date(t.data)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return transDate >= weekAgo
    }
    return true
  })

  // 2. Lógica de Paginação
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage)

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <section className="space-y-4">
      {/* Header com Filtros */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between px-1">
        <h4 className="text-gray-400 font-black text-[10px] uppercase tracking-[0.2em]">Fluxo de Caixa</h4>
        
        <div className="flex items-center gap-3">
          {/* Seletor de Itens por Página */}
          <select 
            value={itemsPerPage}
            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
            className="text-[10px] font-bold bg-gray-200/50 text-gray-500 rounded-lg px-2 py-1 outline-none border-none"
          >
            <option value={10}>10 linhas</option>
            <option value={20}>20 linhas</option>
            <option value={50}>50 linhas</option>
          </select>

          <div className="flex gap-2 bg-gray-200/50 p-1 rounded-lg">
            {['all', 'today', '7days'].map((f) => (
              <button key={f} onClick={() => { setFilter(f); setCurrentPage(1); }} className={`text-[9px] px-2 py-1 rounded-md font-bold uppercase transition-all ${filter === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}>
                {f === 'all' ? 'Tudo' : f === 'today' ? 'Hoje' : '7D'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de Itens */}
      <div className="space-y-3">
        {paginatedData.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-2xl border border-gray-100 text-gray-400 text-xs">Nenhum lançamento.</div>
        ) : (
          paginatedData.map(item => (
            <div key={item.id} className="relative bg-white p-4 rounded-2xl flex justify-between items-center border border-gray-100 shadow-sm transition-all hover:border-indigo-100">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${item.tipo === 'renda' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {item.tipo === 'renda' ? '💰' : '💸'}
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-sm leading-tight">{item.descricao}</p>
                  <div className="flex items-center gap-2 text-[10px] font-medium text-gray-400 uppercase mt-1">
                    <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(item.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`font-black text-sm ${item.tipo === 'renda' ? 'text-emerald-600' : 'text-rose-600'}`}>
                   R$ {Number(item.valor).toLocaleString()}
                </span>
                
                <div className="relative">
                  <button 
                    onClick={() => setActiveMenu(activeMenu === item.id ? null : item.id)}
                    className="p-1 text-gray-300 hover:text-gray-600 transition-colors"
                  >
                    <MoreVertical size={18} />
                  </button>

                  {activeMenu === item.id && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)}></div>
                      <div className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in duration-150">
                        <button onClick={() => { onEdit(item); setActiveMenu(null) }} className="w-full flex items-center gap-2 px-4 py-2 text-[10px] font-bold text-gray-600 hover:bg-gray-50">
                          <Edit3 size={14} /> EDITAR
                        </button>
                        <button onClick={() => { if(confirm('Excluir?')) onDelete(item.id); setActiveMenu(null) }} className="w-full flex items-center gap-2 px-4 py-2 text-[10px] font-bold text-rose-600 hover:bg-rose-50">
                          <Trash2 size={14} /> EXCLUIR
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Controles de Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1 pt-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase">
            Página {currentPage} de {totalPages}
          </p>
          <div className="flex gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="p-2 bg-white border border-gray-100 rounded-xl text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm active:scale-95 transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="p-2 bg-white border border-gray-100 rounded-xl text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm active:scale-95 transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </section>
  )
}