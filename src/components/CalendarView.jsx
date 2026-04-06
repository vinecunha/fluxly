import React, { useState, useMemo } from 'react'
import { TrendingUp, TrendingDown, PiggyBank, ArrowUpRight, ArrowDownLeft, BarChart3, TrendingUp as TrendUp, TrendingDown as TrendDown, Minus, Calendar, Target, ChevronDown, ChevronUp } from 'lucide-react'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS   = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const fmt = (v) => {
  if (v >= 1000) return `R$${(v/1000).toFixed(1)}k`
  return `R$${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}
const fmtFull = (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const TAB_CONFIG = {
  gasto:        { color: 'text-rose-500',    bg: 'bg-rose-50',    bar: 'bg-rose-400',    label: 'Gastos',  prefix: '-', Icon: TrendingDown },
  renda:        { color: 'text-emerald-600', bg: 'bg-emerald-50', bar: 'bg-emerald-400', label: 'Renda',   prefix: '+', Icon: TrendingUp   },
  investimento: { color: 'text-blue-500',    bg: 'bg-blue-50',    bar: 'bg-blue-400',    label: 'Reserva', prefix: '',  Icon: PiggyBank    },
}

// ─── Card de análise comparativa (versão mobile-first) ───────────────────────
function ComparativeAnalysisCard({ dayValue, dayNumber, dayType, currentDate, allTransactions }) {
  const [expanded, setExpanded] = useState(false)
  
  // Buscar valores do mesmo dia nos últimos 3 meses
  const valoresMesesAnteriores = useMemo(() => {
    const anoAtual = currentDate.getFullYear()
    const mesAtual = currentDate.getMonth()
    const dia = dayNumber
    
    const resultados = []
    
    for (let i = 1; i <= 3; i++) {
      let mes = mesAtual - i
      let ano = anoAtual
      if (mes < 0) {
        mes += 12
        ano -= 1
      }
      
      const diasNoMes = new Date(ano, mes + 1, 0).getDate()
      if (dia > diasNoMes) continue
      
      const dataStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
      
      let valorDia = 0
      
      allTransactions.forEach(t => {
        const refDate = t.data_pagamento
          ? new Date(t.data_pagamento).toLocaleDateString('en-CA')
          : t.data
        if (refDate === dataStr) {
          if (dayType === 'renda' && t.tipo === 'renda') {
            valorDia += Number(t.valor) || 0
          } else if (dayType === 'gasto' && t.tipo !== 'renda' && t.tipo !== 'reserva' && t.tipo !== 'pagamento_cartao' && t.pago) {
            valorDia += Math.abs(Number(t.valor)) || 0
          } else if (dayType === 'investimento' && t.tipo === 'reserva' && Number(t.valor) >= 0) {
            valorDia += Number(t.valor) || 0
          }
        }
      })
      
      resultados.push({
        mes: MONTHS[mes].slice(0, 3),
        ano: ano.toString().slice(-2),
        valor: valorDia
      })
    }
    
    return resultados
  }, [allTransactions, currentDate, dayNumber, dayType])
  
  const valoresValidos = valoresMesesAnteriores.filter(v => v.valor > 0)
  const media = valoresValidos.length > 0 
    ? valoresValidos.reduce((s, v) => s + v.valor, 0) / valoresValidos.length 
    : 0
  
  const diferenca = dayValue - media
  const percentual = media > 0 ? (diferenca / media) * 100 : (dayValue > 0 ? 100 : 0)
  const isMelhor = dayType === 'gasto' ? diferenca <= 0 : diferenca >= 0
  
  const getStatusColor = () => {
    if (Math.abs(percentual) < 5) return 'text-gray-400'
    if (isMelhor) return 'text-emerald-600'
    return 'text-rose-600'
  }
  
  const getStatusText = () => {
    if (Math.abs(percentual) < 5) return 'Dentro da média'
    if (isMelhor) {
      return dayType === 'gasto' 
        ? `${Math.abs(percentual).toFixed(0)}% abaixo`
        : `${Math.abs(percentual).toFixed(0)}% acima`
    }
    return dayType === 'gasto'
      ? `${Math.abs(percentual).toFixed(0)}% acima`
      : `${Math.abs(percentual).toFixed(0)}% abaixo`
  }
  
  const getBarColor = () => {
    if (Math.abs(percentual) < 5) return 'bg-gray-300'
    if (isMelhor) return 'bg-emerald-500'
    return 'bg-rose-500'
  }
  
  const barWidth = Math.min(Math.abs(percentual), 100)
  
  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between py-1"
      >
        <div className="flex items-center gap-1.5">
          <BarChart3 size={12} className="text-gray-400" />
          <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider">
            Mesmo dia nos últimos 3 meses
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className={`text-[9px] font-black ${getStatusColor()}`}>
            {getStatusText()}
          </span>
          {expanded ? <ChevronUp size={12} className="text-gray-400" /> : <ChevronDown size={12} className="text-gray-400" />}
        </div>
      </button>
      
      {expanded && (
        <div className="mt-2 space-y-2 animate-in slide-in-from-top-1 duration-200">
          {/* Cards de comparação */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-50 rounded-xl p-2.5">
              <p className="text-[7px] font-black text-gray-400 uppercase">Média</p>
              <p className="text-sm font-black text-gray-800">{fmtFull(media)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-2.5">
              <p className="text-[7px] font-black text-gray-400 uppercase">Este dia</p>
              <p className={`text-sm font-black ${dayValue > 0 ? 'text-gray-800' : 'text-gray-400'}`}>
                {dayValue > 0 ? fmtFull(dayValue) : '—'}
              </p>
            </div>
          </div>
          
          {/* Barra de progresso */}
          {media > 0 && (
            <div className="space-y-0.5">
              <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getBarColor()}`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              <p className={`text-[8px] font-black text-center ${getStatusColor()}`}>
                {getStatusText()}
              </p>
            </div>
          )}
          
          {/* Histórico */}
          <div className="bg-gray-50 rounded-xl p-2.5">
            <p className="text-[7px] font-black text-gray-400 mb-1.5 uppercase tracking-wider">Histórico</p>
            <div className="flex justify-between">
              {valoresMesesAnteriores.map((v, idx) => (
                <div key={idx} className="text-center">
                  <p className="text-[8px] font-black text-gray-500">{v.mes}/{v.ano}</p>
                  <p className={`text-[10px] font-black ${v.valor > 0 ? 'text-gray-700' : 'text-gray-400'}`}>
                    {v.valor > 0 ? fmtFull(v.valor) : '—'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Card de análise acumulada (versão mobile-first) ─────────────────────────
function CumulativeAnalysisCard({ dayNumber, dayType, currentDate, allTransactions }) {
  const [expanded, setExpanded] = useState(false)
  
  // Calcular valor acumulado do dia 1 até o dia selecionado no mês atual
  const valorAtualAcumulado = useMemo(() => {
    let total = 0
    const ano = currentDate.getFullYear()
    const mes = currentDate.getMonth()
    
    for (let dia = 1; dia <= dayNumber; dia++) {
      const dataStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
      
      allTransactions.forEach(t => {
        const refDate = t.data_pagamento
          ? new Date(t.data_pagamento).toLocaleDateString('en-CA')
          : t.data
        if (refDate === dataStr) {
          if (dayType === 'renda' && t.tipo === 'renda') {
            total += Number(t.valor) || 0
          } else if (dayType === 'gasto' && t.tipo !== 'renda' && t.tipo !== 'reserva' && t.tipo !== 'pagamento_cartao' && t.pago) {
            total += Math.abs(Number(t.valor)) || 0
          } else if (dayType === 'investimento' && t.tipo === 'reserva' && Number(t.valor) >= 0) {
            total += Number(t.valor) || 0
          }
        }
      })
    }
    
    return total
  }, [allTransactions, currentDate, dayNumber, dayType])
  
  // Calcular médias acumuladas dos últimos 3 meses
  const mediasAcumuladas = useMemo(() => {
    const anoAtual = currentDate.getFullYear()
    const mesAtual = currentDate.getMonth()
    const dia = dayNumber
    
    const resultados = []
    
    for (let i = 1; i <= 3; i++) {
      let mes = mesAtual - i
      let ano = anoAtual
      if (mes < 0) {
        mes += 12
        ano -= 1
      }
      
      const diasNoMes = new Date(ano, mes + 1, 0).getDate()
      const diasAComparar = Math.min(dia, diasNoMes)
      
      let totalAcumulado = 0
      
      for (let d = 1; d <= diasAComparar; d++) {
        const dataStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        
        allTransactions.forEach(t => {
          const refDate = t.data_pagamento
            ? new Date(t.data_pagamento).toLocaleDateString('en-CA')
            : t.data
          if (refDate === dataStr) {
            if (dayType === 'renda' && t.tipo === 'renda') {
              totalAcumulado += Number(t.valor) || 0
            } else if (dayType === 'gasto' && t.tipo !== 'renda' && t.tipo !== 'reserva' && t.tipo !== 'pagamento_cartao' && t.pago) {
              totalAcumulado += Math.abs(Number(t.valor)) || 0
            } else if (dayType === 'investimento' && t.tipo === 'reserva' && Number(t.valor) >= 0) {
              totalAcumulado += Number(t.valor) || 0
            }
          }
        })
      }
      
      resultados.push({
        mes: MONTHS[mes].slice(0, 3),
        ano: ano.toString().slice(-2),
        total: totalAcumulado,
        dias: diasAComparar
      })
    }
    
    return resultados
  }, [allTransactions, currentDate, dayNumber, dayType])
  
  const mediasValidas = mediasAcumuladas.filter(m => m.total > 0)
  const mediaAcumulada = mediasValidas.length > 0 
    ? mediasValidas.reduce((s, m) => s + m.total, 0) / mediasValidas.length 
    : 0
  
  const diferenca = valorAtualAcumulado - mediaAcumulada
  const percentual = mediaAcumulada > 0 ? (diferenca / mediaAcumulada) * 100 : (valorAtualAcumulado > 0 ? 100 : 0)
  const isMelhor = dayType === 'gasto' ? diferenca <= 0 : diferenca >= 0
  
  const getStatusColor = () => {
    if (Math.abs(percentual) < 5) return 'text-gray-400'
    if (isMelhor) return 'text-emerald-600'
    return 'text-rose-600'
  }
  
  const getStatusText = () => {
    if (Math.abs(percentual) < 5) return 'Dentro da média'
    if (isMelhor) {
      return dayType === 'gasto' 
        ? `${Math.abs(percentual).toFixed(0)}% abaixo`
        : `${Math.abs(percentual).toFixed(0)}% acima`
    }
    return dayType === 'gasto'
      ? `${Math.abs(percentual).toFixed(0)}% acima`
      : `${Math.abs(percentual).toFixed(0)}% abaixo`
  }
  
  const getBarColor = () => {
    if (Math.abs(percentual) < 5) return 'bg-gray-300'
    if (isMelhor) return 'bg-emerald-500'
    return 'bg-rose-500'
  }
  
  const barWidth = Math.min(Math.abs(percentual), 100)
  
  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between py-1"
      >
        <div className="flex items-center gap-1.5">
          <Target size={12} className="text-gray-400" />
          <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider">
            Acumulado até dia {dayNumber}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className={`text-[9px] font-black ${getStatusColor()}`}>
            {getStatusText()}
          </span>
          {expanded ? <ChevronUp size={12} className="text-gray-400" /> : <ChevronDown size={12} className="text-gray-400" />}
        </div>
      </button>
      
      {expanded && (
        <div className="mt-2 space-y-2 animate-in slide-in-from-top-1 duration-200">
          {/* Cards de comparação */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-50 rounded-xl p-2.5">
              <p className="text-[7px] font-black text-gray-400 uppercase">Média acumulada</p>
              <p className="text-sm font-black text-gray-800">{fmtFull(mediaAcumulada)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-2.5">
              <p className="text-[7px] font-black text-gray-400 uppercase">Este mês</p>
              <p className={`text-sm font-black ${valorAtualAcumulado > 0 ? 'text-gray-800' : 'text-gray-400'}`}>
                {valorAtualAcumulado > 0 ? fmtFull(valorAtualAcumulado) : '—'}
              </p>
            </div>
          </div>
          
          {/* Barra de progresso */}
          {mediaAcumulada > 0 && (
            <div className="space-y-0.5">
              <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getBarColor()}`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              <p className={`text-[8px] font-black text-center ${getStatusColor()}`}>
                {getStatusText()}
              </p>
            </div>
          )}
          
          {/* Histórico */}
          <div className="bg-gray-50 rounded-xl p-2.5">
            <p className="text-[7px] font-black text-gray-400 mb-1.5 uppercase tracking-wider">Histórico acumulado</p>
            <div className="flex justify-between">
              {mediasAcumuladas.map((m, idx) => (
                <div key={idx} className="text-center">
                  <p className="text-[8px] font-black text-gray-500">{m.mes}/{m.ano}</p>
                  <p className={`text-[10px] font-black ${m.total > 0 ? 'text-gray-700' : 'text-gray-400'}`}>
                    {m.total > 0 ? fmtFull(m.total) : '—'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── CalendarView principal (mobile-first) ───────────────────────────────────
export function CalendarView({ transactions = [], activeTab = 'gasto', currentDate, onDaySelect, filteredCategory, allTransactions = [] }) {
  const today    = new Date()
  const viewDate = currentDate instanceof Date ? currentDate : new Date()
  const year     = viewDate.getFullYear()
  const month    = viewDate.getMonth()
  const cfg      = TAB_CONFIG[activeTab] || TAB_CONFIG.gasto

  const [selectedDay, setSelectedDay] = useState(null)

  const dayMap = useMemo(() => {
    setSelectedDay(null)
    const map = {}

    const add = (refDate, t, v, isEntrada) => {
      if (!map[refDate]) map[refDate] = { entrada: 0, saida: 0, items: [] }
      if (isEntrada) map[refDate].entrada += v
      else           map[refDate].saida   += v
      map[refDate].items.push({ ...t, _isEntrada: isEntrada })
    }

    ;(transactions || []).forEach(t => {
      const refDate = t.data_pagamento
        ? new Date(t.data_pagamento).toLocaleDateString('en-CA')
        : t.data
      const [y, m] = refDate.split('-').map(Number)
      if (y !== year || m - 1 !== month) return

      const v = Math.abs(Number(t.valor)) || 0

      if (activeTab === 'renda' && t.tipo === 'renda') {
        add(refDate, t, v, true)
      } else if (activeTab === 'investimento' && t.tipo === 'reserva') {
        add(refDate, t, v, Number(t.valor) >= 0)
      } else if (activeTab === 'gasto' && t.tipo !== 'renda' && t.tipo !== 'reserva' && t.tipo !== 'pagamento_cartao' && t.pago) {
        add(refDate, t, v, false)
      }
      if (map[refDate]) {
        if (!map[refDate].cats) map[refDate].cats = new Set()
        const cat = activeTab === 'renda'
          ? (t.subcategoria || t.descricao)
          : activeTab === 'investimento'
          ? (t.destino_reserva || 'Outros')
          : t.categoria
        if (cat) map[refDate].cats.add(cat)
      }
    })
    return map
  }, [transactions, year, month, activeTab])

  const isInvestimento = activeTab === 'investimento'

  const maxDay = useMemo(() => {
    const vals = Object.values(dayMap).map(d => isInvestimento ? Math.max(d.entrada, d.saida) : d.entrada + d.saida)
    return Math.max(...vals, 1)
  }, [dayMap, isInvestimento])

  const summary = useMemo(() => {
    const dias = Object.keys(dayMap)
    const diasComEntrada = dias.filter(d => dayMap[d].entrada > 0).length
    const diasComSaida   = dias.filter(d => dayMap[d].saida > 0).length
    const totalEntrada   = Object.values(dayMap).reduce((s, d) => s + d.entrada, 0)
    const totalSaida     = Object.values(dayMap).reduce((s, d) => s + d.saida, 0)
    return { diasComEntrada, diasComSaida, totalEntrada, totalSaida }
  }, [dayMap])

  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const totalCells  = Math.ceil((firstDay + daysInMonth) / 7) * 7

  const selectedKey  = selectedDay
    ? `${year}-${String(month + 1).padStart(2,'0')}-${String(selectedDay).padStart(2,'0')}`
    : null
  const selectedData = selectedKey ? dayMap[selectedKey] : null
  
  const valorDiaSelecionado = selectedData 
    ? (isInvestimento 
        ? (activeTab === 'investimento' ? selectedData.entrada : selectedData.entrada + selectedData.saida)
        : selectedData.entrada + selectedData.saida)
    : 0

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">

        <div className={`flex items-center justify-center gap-1.5 py-2.5 border-b border-gray-50 rounded-t-2xl ${cfg.bg}`}>
          <cfg.Icon size={11} className={cfg.color} />
          <span className={`text-[9px] font-black uppercase ${cfg.color}`}>
            {filteredCategory ? filteredCategory : cfg.label} — {MONTHS[month]} {year}
          </span>
        </div>

        {/* Resumo do mês */}
        <div className={`border-b border-gray-50 px-3 py-2.5 ${isInvestimento ? '' : ''}`}>
          {isInvestimento ? (
            <div className="grid grid-cols-4 gap-1">
              <div className="text-center">
                <p className="text-[7px] font-black text-gray-400 uppercase">Entrada</p>
                <p className="text-[10px] font-black text-emerald-600">{summary.diasComEntrada}d</p>
              </div>
              <div className="text-center">
                <p className="text-[7px] font-black text-gray-400 uppercase">Total</p>
                <p className="text-[10px] font-black text-emerald-600">{fmt(summary.totalEntrada)}</p>
              </div>
              <div className="text-center">
                <p className="text-[7px] font-black text-gray-400 uppercase">Saída</p>
                <p className="text-[10px] font-black text-rose-500">{summary.diasComSaida}d</p>
              </div>
              <div className="text-center">
                <p className="text-[7px] font-black text-gray-400 uppercase">Total</p>
                <p className="text-[10px] font-black text-rose-500">{fmt(summary.totalSaida)}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center">
                <p className="text-[7px] font-black text-gray-400 uppercase">
                  Dias com {activeTab === 'renda' ? 'renda' : 'gastos'}
                </p>
                <p className={`text-[11px] font-black ${cfg.color}`}>
                  {activeTab === 'renda' ? summary.diasComEntrada : summary.diasComSaida}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[7px] font-black text-gray-400 uppercase">Total</p>
                <p className={`text-[11px] font-black ${cfg.color}`}>
                  {fmtFull(activeTab === 'renda' ? summary.totalEntrada : summary.totalSaida)}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-7 border-b border-gray-50">
          {WEEKDAYS.map(d => (
            <div key={d} className="py-1.5 text-center text-[8px] font-black text-gray-400 uppercase">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {Array.from({ length: totalCells }).map((_, i) => {
            const dayNum  = i - firstDay + 1
            const isValid = dayNum >= 1 && dayNum <= daysInMonth
            const dateKey = isValid
              ? `${year}-${String(month + 1).padStart(2,'0')}-${String(dayNum).padStart(2,'0')}`
              : null
            const data       = dateKey ? dayMap[dateKey] : null
            const isToday    = isValid && today.getDate() === dayNum && today.getMonth() === month && today.getFullYear() === year
            const isSelected = isValid && selectedDay === dayNum

            const mainVal = data ? (isInvestimento ? data.entrada + data.saida : data.entrada + data.saida) : 0
            const pct     = data ? Math.max((mainVal / maxDay) * 100, 8) : 0

            const hasEntrada = data && data.entrada > 0
            const hasSaida   = data && data.saida > 0

            return (
              <button
                key={i}
                disabled={!isValid}
                onClick={() => {
                  if (!isValid) return
                  const next = selectedDay === dayNum ? null : dayNum
                  setSelectedDay(next)
                  if (onDaySelect) {
                    const key = next
                      ? `${year}-${String(month+1).padStart(2,'0')}-${String(next).padStart(2,'0')}`
                      : null
                    onDaySelect(key)
                  }
                }}
                style={{ minHeight: 52 }}
                className={`p-0.5 border-b border-r border-gray-50 flex flex-col items-center justify-start transition-all ${
                  !isValid ? 'bg-gray-50/30'
                  : isSelected ? cfg.bg
                  : filteredCategory && data?.cats?.has(filteredCategory) ? cfg.bg
                  : filteredCategory && data && !data.cats?.has(filteredCategory) ? 'opacity-20'
                  : filteredCategory && !data ? 'opacity-10'
                  : 'hover:bg-gray-50 active:bg-gray-100'
                }`}
              >
                {isValid && (
                  <>
                    <span className={`text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full mb-0.5 flex-shrink-0 ${
                      isToday    ? 'bg-slate-900 text-white text-[9px]' :
                      isSelected ? cfg.color                 :
                      'text-gray-600'
                    }`}>
                      {dayNum}
                    </span>
                    {data && (
                      <div className="w-full px-0.5">
                        {isInvestimento ? (
                          <>
                            {hasEntrada && (
                              <div className="w-full bg-gray-100 rounded-full overflow-hidden mb-0.5" style={{ height: 2 }}>
                                <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.max((data.entrada / maxDay) * 100, 8)}%` }} />
                              </div>
                            )}
                            {hasSaida && (
                              <div className="w-full bg-gray-100 rounded-full overflow-hidden mb-0.5" style={{ height: 2 }}>
                                <div className="h-full rounded-full bg-rose-400" style={{ width: `${Math.max((data.saida / maxDay) * 100, 8)}%` }} />
                              </div>
                            )}
                            <span className="text-[6px] font-black w-full text-center block truncate text-blue-500">
                              {hasEntrada && hasSaida
                                ? `+${fmt(data.entrada)} -${fmt(data.saida)}`
                                : hasEntrada ? `+${fmt(data.entrada)}` : `-${fmt(data.saida)}`
                              }
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="w-full bg-gray-100 rounded-full overflow-hidden" style={{ height: 2 }}>
                              <div className={`h-full rounded-full ${cfg.bar}`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className={`text-[6px] font-black w-full text-center block truncate ${cfg.color}`}>
                              {fmt(data.entrada + data.saida)}
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}
              </button>
            )
          })}
        </div>

        {isInvestimento && (
          <div className="flex items-center justify-center gap-3 px-3 py-2 border-t border-gray-50">
            <div className="flex items-center gap-1">
              <ArrowUpRight size={8} className="text-emerald-500" />
              <span className="text-[7px] font-bold text-gray-400 uppercase">Entrada</span>
            </div>
            <div className="flex items-center gap-1">
              <ArrowDownLeft size={8} className="text-rose-500" />
              <span className="text-[7px] font-bold text-gray-400 uppercase">Saída</span>
            </div>
          </div>
        )}
      </div>

      {selectedData && selectedDay && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 animate-in slide-in-from-top-2 duration-200">
          {/* Cabeçalho do dia */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
              {String(selectedDay).padStart(2,'0')}/{String(month+1).padStart(2,'0')}/{year}
            </p>
            {isInvestimento ? (
              <div className="flex items-center gap-2">
                {selectedData.entrada > 0 && (
                  <p className="text-[11px] font-black text-emerald-600">+{fmtFull(selectedData.entrada)}</p>
                )}
                {selectedData.saida > 0 && (
                  <p className="text-[11px] font-black text-rose-500">-{fmtFull(selectedData.saida)}</p>
                )}
              </div>
            ) : (
              <p className={`text-[11px] font-black ${cfg.color}`}>
                {cfg.prefix} {fmtFull(selectedData.entrada + selectedData.saida)}
              </p>
            )}
          </div>

          {/* Lista de transações do dia */}
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {selectedData.items
              .sort((a, b) => Math.abs(Number(b.valor)) - Math.abs(Number(a.valor)))
              .map(t => {
                const v       = Math.abs(Number(t.valor))
                const total   = selectedData.entrada + selectedData.saida
                const pctItem = total > 0 ? (v / total) * 100 : 0
                const isEnt   = t._isEntrada
                const itemColor = isInvestimento
                  ? (isEnt ? 'text-emerald-600' : 'text-rose-500')
                  : cfg.color
                const itemPrefix = isInvestimento ? (isEnt ? '+' : '-') : cfg.prefix

                return (
                  <div key={t.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-gray-700 truncate">{t.descricao}</p>
                      <p className="text-[7px] text-gray-400 font-bold uppercase">
                        {isInvestimento && (isEnt ? '↑ entrada' : '↓ saída')}
                        {!isInvestimento && (t.categoria || t.tipo)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className={`text-[10px] font-black ${itemColor}`}>{itemPrefix} {fmtFull(v)}</p>
                      <p className="text-[7px] text-gray-400">{pctItem.toFixed(0)}%</p>
                    </div>
                  </div>
                )
              })}
          </div>
          
          {/* Análises comparativas */}
          <ComparativeAnalysisCard
            dayValue={valorDiaSelecionado}
            dayNumber={selectedDay}
            dayType={activeTab}
            currentDate={currentDate}
            allTransactions={allTransactions}
          />
          
          <CumulativeAnalysisCard
            dayNumber={selectedDay}
            dayType={activeTab}
            currentDate={currentDate}
            allTransactions={allTransactions}
          />
        </div>
      )}
    </div>
  )
}