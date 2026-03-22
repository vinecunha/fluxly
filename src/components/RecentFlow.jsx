import React, { useState, useMemo, useRef } from 'react'
import { ChevronLeft, ChevronRight, Search, X, ArrowUpDown, Filter, CheckCircle2, Edit3, Trash2, TrendingUp, TrendingDown, PiggyBank, CreditCard } from 'lucide-react'
import { categoryIcons } from '../lib/categories'

const ITEMS_PER_PAGE = 8
const SORT_OPTIONS = [
  { id: 'data_desc',  label: 'Mais recentes' },
  { id: 'data_asc',   label: 'Mais antigas'  },
  { id: 'valor_desc', label: 'Maior valor'   },
  { id: 'valor_asc',  label: 'Menor valor'   },
]

const TIPOS = [
  { id: 'renda',            label: 'Renda'   },
  { id: 'gasto_diario',     label: 'Gasto'   },
  { id: 'fixa',             label: 'Fixa'    },
  { id: 'esporadica',       label: 'Extra'   },
  { id: 'reserva',          label: 'Reserva' },
  { id: 'pagamento_cartao', label: 'Fatura'  },
]

const fmtK = (v) => {
  if (v >= 1000) return `R$${(v/1000).toFixed(1)}k`
  return `R$${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

// Quais tipos pertencem a cada grupo de total
const TOTAL_TIPO_MAP = {
  renda:    (t) => t.tipo === 'renda',
  gastos:   (t) => t.tipo !== 'renda' && t.tipo !== 'reserva' && t.tipo !== 'pagamento_cartao',
  reserva:  (t) => t.tipo === 'reserva' && Number(t.valor) >= 0,
  retirada: (t) => t.tipo === 'reserva' && Number(t.valor) < 0,
  fatura:   (t) => t.tipo === 'pagamento_cartao',
}

export function RecentFlow({ transactions = [], onEdit, onDelete }) {
  const [search, setSearch]           = useState('')
  const [sortBy, setSortBy]           = useState('data_desc')
  const [filterCat, setFilterCat]     = useState(null)
  const [filterTipo, setFilterTipo]   = useState(null)
  const [filterTotal, setFilterTotal] = useState(null) // 'renda' | 'gastos' | 'reserva' | 'retirada'
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

    // Filtro por grupo de total
    if (filterTotal && TOTAL_TIPO_MAP[filterTotal]) {
      list = list.filter(TOTAL_TIPO_MAP[filterTotal])
    }

    list.sort((a, b) => {
      if (sortBy === 'data_desc' || sortBy === 'data_asc') {
        const parseDate = (item) => {
          const raw = item.data_pagamento || (item.data + 'T12:00:00')
          const date = new Date(typeof raw === 'string' ? raw.replace(' ', 'T') : raw)
          return date.getTime() || 0
        }
        const diff = sortBy === 'data_desc'
          ? parseDate(b) - parseDate(a)
          : parseDate(a) - parseDate(b)
        if (diff !== 0) return diff
        return (b.id || '').toString().localeCompare((a.id || '').toString())
      }
      if (sortBy === 'valor_desc') return Number(b.valor) - Number(a.valor)
      if (sortBy === 'valor_asc')  return Number(a.valor) - Number(b.valor)
      return 0
    })

    return list
  }, [transactions, search, filterCat, filterTipo, filterTotal, sortBy])

  // Totais sempre calculados sobre a lista sem o filtro de total (para não sumir os outros)
  const baseList = useMemo(() => {
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
    return list
  }, [transactions, search, filterCat, filterTipo])

  const totals = useMemo(() => {
    return baseList.reduce((acc, t) => {
      const v = Math.abs(Number(t.valor)) || 0
      if (t.tipo === 'renda')                                acc.renda    += v
      else if (t.tipo === 'reserva' && Number(t.valor) >= 0) acc.reserva  += v
      else if (t.tipo === 'reserva' && Number(t.valor) < 0)  acc.retirada += v
      else if (t.tipo === 'pagamento_cartao')                 acc.fatura   += v
      else                                                    acc.gastos   += v
      return acc
    }, { renda: 0, gastos: 0, reserva: 0, retirada: 0, fatura: 0 })
  }, [baseList])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filtered.slice(start, start + ITEMS_PER_PAGE)
  }, [filtered, currentPage])

  const handleSearch     = (v) => { setSearch(v);       setCurrentPage(1) }
  const handleSortBy     = (v) => { setSortBy(v);       setCurrentPage(1) }
  const handleFilterCat  = (v) => { setFilterCat(p  => p === v ? null : v); setCurrentPage(1) }
  const handleFilterTipo = (v) => { setFilterTipo(p => p === v ? null : v); setCurrentPage(1) }
  const handleFilterTotal = (key) => {
    setFilterTotal(p => p === key ? null : key)
    setCurrentPage(1)
  }

  const activeFiltersCount = [filterCat, filterTipo].filter(Boolean).length

  const TOTAL_CARDS = [
    { key: 'renda',    label: 'Renda',    value: totals.renda,    Icon: TrendingUp,   active: 'bg-emerald-500 text-white', idle: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-600' },
    { key: 'gastos',   label: 'Gastos',   value: totals.gastos,   Icon: TrendingDown, active: 'bg-rose-500 text-white',    idle: 'bg-rose-50',    text: 'text-rose-700',    icon: 'text-rose-500'   },
    { key: 'reserva',  label: 'Reserva',  value: totals.reserva,  Icon: PiggyBank,    active: 'bg-blue-500 text-white',    idle: 'bg-blue-50',    text: 'text-blue-700',    icon: 'text-blue-500'   },
    { key: 'retirada', label: 'Retirada', value: totals.retirada, Icon: PiggyBank,    active: 'bg-orange-500 text-white',  idle: 'bg-orange-50',  text: 'text-orange-700',  icon: 'text-orange-500' },
    { key: 'fatura',   label: 'Fatura',   value: totals.fatura,   Icon: CreditCard,   active: 'bg-slate-700 text-white',   idle: 'bg-slate-50',   text: 'text-slate-700',   icon: 'text-slate-500'  },
  ].filter(c => c.value > 0)

  return (
    <div className="bg-white  rounded-2xl border border-gray-100  shadow-sm overflow-hidden">
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-gray-800  font-black text-sm">Fluxo de Caixa</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={sortBy}
                onChange={e => handleSortBy(e.target.value)}
                className="appearance-none bg-gray-50  border-none text-[10px] font-black text-gray-500  pr-5 pl-2 py-1.5 rounded-2xl outline-none cursor-pointer"
              >
                {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
              <ArrowUpDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400  pointer-events-none" />
            </div>

            <button
              onClick={() => setShowFilters(p => !p)}
              className={`flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1.5 rounded-2xl transition-all ${
                activeFiltersCount > 0 ? 'bg-slate-100 text-slate-700' : 'bg-gray-50  text-gray-500 '
              }`}
            >
              <Filter size={11} />
              Filtrar
              {activeFiltersCount > 0 && (
                <span className="bg-slate-900  text-white rounded-full w-4 h-4 text-[8px] flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 " />
          <input
            type="text"
            placeholder="Buscar por descrição..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 bg-gray-50  rounded-2xl text-xs font-medium outline-none focus:ring-2 focus:ring-slate-300"
          />
          {search && (
            <button onClick={() => handleSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 ">
              <X size={14} />
            </button>
          )}
        </div>

        {showFilters && (
          <div className="mt-3 space-y-2 animate-in slide-in-from-top-2 duration-200">
            <div>
              <p className="text-[9px] font-black text-gray-400  uppercase mb-1.5">Tipo</p>
              <div className="flex flex-wrap gap-1.5">
                {TIPOS.map(t => (
                  <button key={t.id} onClick={() => handleFilterTipo(t.id)}
                    className={`px-2.5 py-1.5 rounded-2xl text-[10px] font-black uppercase transition-all ${
                      filterTipo === t.id ? 'bg-gray-900 text-white' : 'bg-gray-100  text-gray-500 '
                    }`}
                    style={{ minHeight: 36 }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {availableCategories.length > 0 && (
              <div>
                <p className="text-[9px] font-black text-gray-400  uppercase mb-1.5">Categoria</p>
                <div className="flex flex-wrap gap-1.5">
                  {availableCategories.map(cat => (
                    <button key={cat} onClick={() => handleFilterCat(cat)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-2xl text-[10px] font-black uppercase transition-all ${
                        filterCat === cat ? 'bg-slate-900  text-white' : 'bg-gray-100  text-gray-500 '
                      }`}
                      style={{ minHeight: 36 }}>
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
              <button onClick={() => { setFilterCat(null); setFilterTipo(null); setCurrentPage(1) }}
                className="text-[10px] font-black text-rose-500 uppercase">
                Limpar filtros
              </button>
            )}
          </div>
        )}

        {/* Totais clicáveis */}
        {TOTAL_CARDS.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            {TOTAL_CARDS.map(({ key, label, value, Icon, active, idle, text, icon }) => {
              const isActive = filterTotal === key
              return (
                <button
                  key={key}
                  onClick={() => handleFilterTotal(key)}
                  style={{ minHeight: 44 }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-2xl transition-all active:scale-95 ${
                    isActive ? active : idle
                  }`}
                >
                  <Icon size={13} className={isActive ? 'text-white' : icon} />
                  <div className="min-w-0 text-left">
                    <p className={`text-[7px] font-black uppercase leading-none ${isActive ? 'text-white/70' : icon}`}>
                      {label}
                    </p>
                    <p className={`text-[12px] font-black leading-tight truncate ${isActive ? 'text-white' : text}`}>
                      {fmtK(value)}
                    </p>
                  </div>
                  {isActive && (
                    <span className="ml-auto text-white/70 text-[8px] font-black uppercase flex-shrink-0">
                      ✕
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Indicador de filtro ativo por total */}
        {filterTotal && (
          <div className="mt-2 flex items-center justify-between">
            <p className="text-[9px] font-black text-gray-400  uppercase">
              Mostrando apenas: <span className="text-slate-600">{TOTAL_CARDS.find(c => c.key === filterTotal)?.label}</span>
              {' · '}{filtered.length} registro{filtered.length !== 1 ? 's' : ''}
            </p>
            <button onClick={() => { setFilterTotal(null); setCurrentPage(1) }}
              className="text-[9px] font-black text-rose-500 uppercase">
              Limpar
            </button>
          </div>
        )}
      </div>

      <div className="divide-y divide-gray-50">
        {paginated.length === 0 ? (
          <div className="py-10 text-center text-gray-400  text-xs font-bold">
            Nenhuma transação encontrada.
          </div>
        ) : (
          paginated.map(t => (
            <SwipeableFlowItem key={t.id} transaction={t} todayStr={todayStr} onEdit={onEdit} onDelete={onDelete} />
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50 ">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}
            className="p-2 rounded-2xl bg-gray-50  disabled:opacity-30 active:scale-90 transition-all"
            style={{ minHeight: 40, minWidth: 40 }}>
            <ChevronLeft size={14} className="text-gray-500 " />
          </button>
          <span className="text-[10px] font-black text-gray-400  uppercase">
            {currentPage} / {totalPages} · {filtered.length} registros
          </span>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}
            className="p-2 rounded-2xl bg-gray-50  disabled:opacity-30 active:scale-90 transition-all"
            style={{ minHeight: 40, minWidth: 40 }}>
            <ChevronRight size={14} className="text-gray-500 " />
          </button>
        </div>
      )}
    </div>
  )
}

function SwipeableFlowItem({ transaction: t, todayStr, onEdit, onDelete }) {
  const startX   = useRef(null)
  const startY   = useRef(null)
  const [offset, setOffset]       = useState(0)
  const [swiping, setSwiping]     = useState(false)
  const [pending, setPending]     = useState(false) // aguardando confirmação
  const [direction, setDirection] = useState(null)  // 'left' | 'right'
  const THRESHOLD  = 80
  const SNAP_DELETE = 120  // distância que trava antes de confirmar

  const haptic = () => { try { navigator.vibrate?.(30) } catch(_){} }

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
    setSwiping(true)
    setPending(false)
  }

  const handleTouchMove = (e) => {
    if (startX.current === null) return
    const dx = e.touches[0].clientX - startX.current
    const dy = e.touches[0].clientY - startY.current
    // Ignorar swipe se movimento vertical maior que horizontal
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dx) < 10) return
    const clamped = Math.max(-SNAP_DELETE, Math.min(SNAP_DELETE, dx))
    setOffset(clamped)
    setDirection(clamped < 0 ? 'left' : clamped > 0 ? 'right' : null)
    // Haptic ao cruzar threshold
    if (Math.abs(clamped) === SNAP_DELETE) haptic()
  }

  const handleTouchEnd = () => {
    setSwiping(false)
    if (offset > THRESHOLD) {
      // Swipe direita → editar (imediato)
      setOffset(0); setDirection(null)
      onEdit(t)
    } else if (offset < -THRESHOLD) {
      // Swipe esquerda → travar e pedir confirmação
      setOffset(-SNAP_DELETE)
      setPending(true)
      haptic()
    } else {
      setOffset(0); setDirection(null)
    }
    startX.current = null; startY.current = null
  }

  const confirmDelete = () => {
    haptic()
    setPending(false)
    setOffset(0)
    setDirection(null)
    onDelete(t.id)
  }

  const cancelDelete = () => {
    setPending(false)
    setOffset(0)
    setDirection(null)
  }

  const isRenda    = t.tipo === 'renda'
  const isReserva  = t.tipo === 'reserva' && Number(t.valor) >= 0
  const isRetirada = t.tipo === 'reserva' && Number(t.valor) < 0
  const isFatura   = t.tipo === 'pagamento_cartao'
  const rawDate    = t.data_pagamento || t.data
  const dateStr    = typeof rawDate === 'string' ? rawDate.split(' ')[0] : ''
  const isToday    = dateStr === todayStr
  const valor      = Math.abs(Number(t.valor))

  const colorClass = isRenda    ? 'text-emerald-600'
                   : isReserva  ? 'text-blue-600'
                   : isRetirada ? 'text-rose-500'
                   : isFatura   ? 'text-slate-700'
                   :              'text-rose-500'

  const prefix = isRenda || isReserva ? '+' : '-'

  const formattedDate = useMemo(() => {
    const raw  = t.data_pagamento || (t.data + 'T12:00:00')
    const date = new Date(typeof raw === 'string' ? raw.replace(' ', 'T') : raw)
    return isNaN(date.getTime())
      ? '--/--'
      : date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }, [t.data_pagamento, t.data])

  return (
    <div className="relative overflow-hidden group rounded-xl">
      {/* Background esquerda — editar */}
      <div className={`absolute inset-y-0 left-0 flex items-center px-5 transition-opacity duration-150 ${direction==='right'?'opacity-100':'opacity-0'}`}
        style={{ backgroundColor:'#1e293b', width: Math.max(offset,0) }}>
        <span className="text-[10px] font-black text-white uppercase whitespace-nowrap">✏️ Editar</span>
      </div>

      {/* Background direita — deletar */}
      <div className={`absolute inset-y-0 right-0 flex items-center justify-end px-5 transition-all duration-150 ${direction==='left'?'opacity-100':'opacity-0'}`}
        style={{ backgroundColor: pending ? '#b91c1c' : '#ef4444', width: Math.abs(Math.min(offset,0)) }}>
        {pending
          ? <div className="flex items-center gap-2">
              <button onTouchEnd={e=>{e.stopPropagation();confirmDelete()}}
                onClick={confirmDelete}
                className="text-[10px] font-black text-white bg-white/20 px-2 py-1 rounded-lg whitespace-nowrap active:scale-95">
                ✓ Confirmar
              </button>
              <button onTouchEnd={e=>{e.stopPropagation();cancelDelete()}}
                onClick={cancelDelete}
                className="text-[10px] font-black text-white/70 whitespace-nowrap active:scale-95">
                ✕
              </button>
            </div>
          : <span className="text-[10px] font-black text-white uppercase whitespace-nowrap">🗑️ Excluir</span>
        }
      </div>

      <div
        className={`relative flex items-center gap-3 px-4 py-3 bg-white  ${swiping ? '' : 'transition-transform duration-300'}`}
        style={{ transform: `translateX(${offset}px)`, minHeight: 60 }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 ${
          isFatura
            ? 'bg-slate-800  text-white'
            : categoryIcons[t.categoria]?.color || 'bg-gray-100  text-gray-600 '
        }`}>
          {isFatura
            ? <CreditCard size={15} />
            : categoryIcons[t.categoria]?.icon || <span className="text-base">📦</span>
          }
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-bold text-gray-800  truncate">{t.descricao}</p>
            {isFatura && (
              <span className="text-[7px] font-black bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full uppercase flex-shrink-0">Fatura</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-[10px] text-gray-400 ">{formattedDate}</span>
            {isToday && (
              <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-2xl uppercase">Hoje</span>
            )}
            {!isFatura && t.categoria && (
              <span className="text-[8px] font-bold text-gray-300  uppercase truncate">{t.categoria}</span>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(t)} className="p-1.5 rounded-xl text-gray-300  hover:text-slate-500 hover:bg-slate-50 transition-colors">
              <Edit3 size={14} />
            </button>
            <button onClick={() => onDelete(t.id)} className="p-1.5 rounded-xl text-gray-300  hover:text-rose-500 hover:bg-rose-50 transition-colors">
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