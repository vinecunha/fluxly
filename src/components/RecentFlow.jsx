import React, { useState, useMemo, useRef } from 'react'
import { ChevronLeft, ChevronRight, Search, X, ArrowUpDown, Filter, CheckCircle2, Edit3, Trash2 } from 'lucide-react'
import { categoryIcons } from '../lib/categories'

const ITEMS_PER_PAGE = 8
const SORT_OPTIONS = [
  { id: 'data_desc',  label: 'Mais recentes' },
  { id: 'data_asc',   label: 'Mais antigas'  },
  { id: 'valor_desc', label: 'Maior valor'   },
  { id: 'valor_asc',  label: 'Menor valor'   },
]

const TIPOS = [
  { id: 'renda',        label: 'Renda'   },
  { id: 'gasto_diario', label: 'Gasto'   },
  { id: 'fixa',         label: 'Fixa'    },
  { id: 'esporadica',   label: 'Extra'   },
  { id: 'reserva',      label: 'Reserva' },
]

export function RecentFlow({ transactions = [], onEdit, onDelete }) {
  const [search, setSearch]           = useState('')
  const [sortBy, setSortBy]           = useState('data_desc')
  const [filterCat, setFilterCat]     = useState(null)
  const [filterTipo, setFilterTipo]   = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const todayStr = useMemo(() =>
    new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }), [])

  const availableCategories = useMemo(() =>
    [...new Set(transactions.map(t => t.categoria).filter(Boolean))].sort(),
    [transactions]
  )

  const filtered = useMemo(() => {
    let list = [...transactions]

    list = list.filter(t => {
      if (t.tipo === 'fixa' || t.tipo === 'esporadica') return t.pago === true
      return true
    })

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(t => t.descricao?.toLowerCase().includes(q))
    }

    if (filterCat)  list = list.filter(t => t.categoria === filterCat)
    if (filterTipo) list = list.filter(t => t.tipo === filterTipo)

    list.sort((a, b) => {
      const dateA = a.data_pagamento ? new Date(a.data_pagamento) : new Date(a.data + 'T12:00:00')
      const dateB = b.data_pagamento ? new Date(b.data_pagamento) : new Date(b.data + 'T12:00:00')

      switch (sortBy) {
        case 'data_asc':   return dateA - dateB
        case 'data_desc':  return dateB - dateA
        case 'valor_desc': return Number(b.valor) - Number(a.valor)
        case 'valor_asc':  return Number(a.valor) - Number(b.valor)
        default: return 0
      }
    })

    return list
  }, [transactions, search, filterCat, filterTipo, sortBy])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filtered.slice(start, start + ITEMS_PER_PAGE)
  }, [filtered, currentPage])

  const handleSearch     = (v) => { setSearch(v);  setCurrentPage(1) }
  const handleSortBy     = (v) => { setSortBy(v);  setCurrentPage(1) }
  const handleFilterCat  = (v) => { setFilterCat(p  => p === v ? null : v); setCurrentPage(1) }
  const handleFilterTipo = (v) => { setFilterTipo(p => p === v ? null : v); setCurrentPage(1) }

  const activeFiltersCount = [filterCat, filterTipo].filter(Boolean).length

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

      <div className="p-5 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-gray-800 font-black text-sm">Fluxo de Caixa</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={sortBy}
                onChange={e => handleSortBy(e.target.value)}
                className="appearance-none bg-gray-50 border-none text-[10px] font-black text-gray-500 pr-5 pl-2 py-1.5 rounded-2xl outline-none cursor-pointer"
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
              <ArrowUpDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            <button
              onClick={() => setShowFilters(p => !p)}
              className={`flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1.5 rounded-2xl transition-all ${
                activeFiltersCount > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-50 text-gray-500'
              }`}
            >
              <Filter size={11} />
              Filtrar
              {activeFiltersCount > 0 && (
                <span className="bg-indigo-600 text-white rounded-full w-4 h-4 text-[8px] flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por descrição..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 bg-gray-50 rounded-2xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-300"
          />
          {search && (
            <button onClick={() => handleSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
              <X size={14} />
            </button>
          )}
        </div>

        {showFilters && (
          <div className="mt-3 space-y-2 animate-in slide-in-from-top-2 duration-200">
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase mb-1.5">Tipo</p>
              <div className="flex flex-wrap gap-1.5">
                {TIPOS.map(t => (
                  <button
                    key={t.id}
                    onClick={() => handleFilterTipo(t.id)}
                    className={`px-2.5 py-1 rounded-2xl text-[10px] font-black uppercase transition-all ${
                      filterTipo === t.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {availableCategories.length > 0 && (
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase mb-1.5">Categoria</p>
                <div className="flex flex-wrap gap-1.5">
                  {availableCategories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => handleFilterCat(cat)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-2xl text-[10px] font-black uppercase transition-all ${
                        filterCat === cat ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <span className={filterCat === cat ? '' : categoryIcons[cat]?.color}>
                        {categoryIcons[cat]?.icon || '📦'}
                      </span>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeFiltersCount > 0 && (
              <button
                onClick={() => { setFilterCat(null); setFilterTipo(null); setCurrentPage(1) }}
                className="text-[10px] font-black text-rose-500 uppercase"
              >
                Limpar filtros
              </button>
            )}
          </div>
        )}
      </div>

      <div className="divide-y divide-gray-50">
        {paginated.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-xs font-bold">
            Nenhuma transação encontrada.
          </div>
        ) : (
          paginated.map(t => (
            <SwipeableFlowItem
              key={t.id}
              transaction={t}
              todayStr={todayStr}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
            className="p-1.5 rounded-2xl bg-gray-50 disabled:opacity-30 active:scale-90 transition-all"
          >
            <ChevronLeft size={14} className="text-gray-500" />
          </button>
          <span className="text-[10px] font-black text-gray-400 uppercase">
            {currentPage} / {totalPages} · {filtered.length} registros
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
            className="p-1.5 rounded-2xl bg-gray-50 disabled:opacity-30 active:scale-90 transition-all"
          >
            <ChevronRight size={14} className="text-gray-500" />
          </button>
        </div>
      )}
    </div>
  )
}


function SwipeableFlowItem({ transaction: t, todayStr, onEdit, onDelete }) {
  const startX = useRef(null)
  const [offset, setOffset] = useState(0)
  const [swiping, setSwiping] = useState(false)
  const THRESHOLD = 80

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX
    setSwiping(true)
  }

  const handleTouchMove = (e) => {
    if (startX.current === null) return
    const diff = e.touches[0].clientX - startX.current
    setOffset(Math.max(-120, Math.min(120, diff)))
  }

  const handleTouchEnd = () => {
    if (offset > THRESHOLD)       onEdit(t)
    else if (offset < -THRESHOLD) onDelete(t.id)
    setOffset(0)
    setSwiping(false)
    startX.current = null
  }

  const isRenda    = t.tipo === 'renda'
  const isReserva  = t.tipo === 'reserva' && Number(t.valor) >= 0  
  const isRetirada = t.tipo === 'reserva' && Number(t.valor) < 0   
  const isToday    = t.data === todayStr
  const valor      = Math.abs(Number(t.valor))

  const colorClass = isRenda    ? 'text-emerald-600'
                  : isReserva  ? 'text-purple-600'
                  : isRetirada ? 'text-rose-500'
                  :              'text-rose-500'

  const prefix = isRenda || isReserva ? '+' : '-'

  return (
    <div className="relative overflow-hidden group">
      <div className="absolute inset-0 flex items-center justify-between px-5 pointer-events-none">
        <span className="text-[10px] font-black text-indigo-500 uppercase">Editar ✏️</span>
        <span className="text-[10px] font-black text-rose-500 uppercase">🗑️ Excluir</span>
      </div>

      <div
        className={`relative flex items-center gap-3 px-5 py-3 bg-white ${swiping ? '' : 'transition-transform duration-200'}`}
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 ${
          categoryIcons[t.categoria]?.color || 'bg-gray-100 text-gray-600'
        }`}>
          {categoryIcons[t.categoria]?.icon || <span className="text-base">📦</span>}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-gray-800 truncate">{t.descricao}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-gray-400">
              {new Date(t.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            </span>
            {isToday && (
              <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-2xl uppercase">Hoje</span>
            )}
            {t.categoria && (
              <span className="text-[8px] font-bold text-gray-300 uppercase truncate">{t.categoria}</span>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(t)}
              className="p-1.5 rounded-xl text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
              title="Editar"
            >
              <Edit3 size={14} />
            </button>
            <button
              onClick={() => onDelete(t.id)}
              className="p-1.5 rounded-xl text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
              title="Excluir"
            >
              <Trash2 size={14} />
            </button>
          </div>

          <div className="text-right">
            <p className={`text-sm font-black ${colorClass}`}>
              {prefix} R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            {t.pago !== undefined && (
              t.pago
                ? <CheckCircle2 size={13} className="text-emerald-500 ml-auto mt-0.5" />
                : <span className="text-[9px] font-black uppercase text-amber-500">Pendente</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}