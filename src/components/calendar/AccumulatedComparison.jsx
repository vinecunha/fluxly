import React, { useState, useMemo } from 'react'
import { Target, ChevronDown, ChevronUp } from 'lucide-react'
import { MONTHS, fmtFull } from './constants'
import { getTransactionValue } from './transactionUtils'
import ComparisonStatus from './ComparisonStatus'

function AccumulatedComparison({ dayNumber, dayType, currentDate, allTransactions }) {
  const [expanded, setExpanded] = useState(false)
  
  const valorAtualAcumulado = useMemo(() => {
    let total = 0
    const ano = currentDate.getFullYear()
    const mes = currentDate.getMonth()
    for (let dia = 1; dia <= dayNumber; dia++) {
      const dataStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
      allTransactions.forEach(t => {
        const refDate = t.data_pagamento ? new Date(t.data_pagamento).toLocaleDateString('en-CA') : t.data
        if (refDate === dataStr) {
          const result = getTransactionValue(t, dayType)
          if (result.matches) total += result.value
        }
      })
    }
    return total
  }, [allTransactions, currentDate, dayNumber, dayType])
  
  const mediasAcumuladas = useMemo(() => {
    const anoAtual = currentDate.getFullYear()
    const mesAtual = currentDate.getMonth()
    const dia = dayNumber
    const resultados = []
    
    for (let i = 1; i <= 3; i++) {
      let mes = mesAtual - i
      let ano = anoAtual
      if (mes < 0) { mes += 12; ano -= 1 }
      
      const diasNoMes = new Date(ano, mes + 1, 0).getDate()
      const diasAComparar = Math.min(dia, diasNoMes)
      let totalAcumulado = 0
      
      for (let d = 1; d <= diasAComparar; d++) {
        const dataStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        allTransactions.forEach(t => {
          const refDate = t.data_pagamento ? new Date(t.data_pagamento).toLocaleDateString('en-CA') : t.data
          if (refDate === dataStr) {
            const result = getTransactionValue(t, dayType)
            if (result.matches) totalAcumulado += result.value
          }
        })
      }
      resultados.push({ mes: MONTHS[mes].slice(0, 3), ano: ano.toString().slice(-2), total: totalAcumulado })
    }
    return resultados
  }, [allTransactions, currentDate, dayNumber, dayType])
  
  const mediasValidas = mediasAcumuladas.filter(m => m.total > 0)
  const mediaAcumulada = mediasValidas.length > 0 ? mediasValidas.reduce((s, m) => s + m.total, 0) / mediasValidas.length : 0
  
  const diferenca = valorAtualAcumulado - mediaAcumulada
  const percentual = mediaAcumulada > 0 ? (diferenca / mediaAcumulada) * 100 : (valorAtualAcumulado > 0 ? 100 : 0)
  const isMelhor = dayType === 'gasto' ? diferenca <= 0 : diferenca >= 0
  
  const barColor = isMelhor ? 'bg-emerald-500' : 'bg-rose-500'
  const barWidth = mediaAcumulada > 0
    ? Math.min((valorAtualAcumulado / mediaAcumulada) * 100, 100)
    : (valorAtualAcumulado > 0 ? 100 : 0)
  
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Target size={12} className="text-gray-400" />
          <span className="text-[9px] font-black text-gray-600 uppercase tracking-wider">Acumulado do mês</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ComparisonStatus percentual={percentual} isMelhor={isMelhor} isGasto={dayType === 'gasto'} />
          {expanded ? <ChevronUp size={12} className="text-gray-400" /> : <ChevronDown size={12} className="text-gray-400" />}
        </div>
      </button>
      
      {expanded && (
        <div className="px-3 pb-3 space-y-3 animate-in slide-in-from-top-1 duration-200">
          {/* Card principal do acumulado */}
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-3">
            <div className="flex justify-between items-center mb-2">
              <div>
                <p className="text-[7px] font-black text-gray-400 uppercase">Até dia {dayNumber}</p>
                <p className="text-lg font-black text-gray-800">{fmtFull(valorAtualAcumulado)}</p>
              </div>
              <div className="text-right">
                <p className="text-[7px] font-black text-gray-400 uppercase">Média 3 meses</p>
                <p className="text-base font-black text-gray-500">{fmtFull(mediaAcumulada)}</p>
              </div>
            </div>
            
            {/* Barra de progresso */}
            <div className="space-y-1">
              <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${barWidth}%` }} />
              </div>
              <p className={`text-[8px] font-black text-center ${isMelhor ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isMelhor ? '✓ Acima da média' : '⚠️ Abaixo da média'}
              </p>
            </div>
          </div>
          
          {/* Histórico */}
          <div>
            <p className="text-[7px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Comparativo mensal</p>
            <div className="flex justify-around">
              {mediasAcumuladas.map((m, idx) => (
                <div key={idx} className="text-center">
                  <p className="text-[8px] font-black text-gray-500">{m.mes}/{m.ano}</p>
                  <p className={`text-[9px] font-black ${m.total > 0 ? 'text-gray-700' : 'text-gray-400'}`}>
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

export default AccumulatedComparison
