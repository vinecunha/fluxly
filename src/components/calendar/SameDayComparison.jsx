import React, { useState, useMemo } from 'react'
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react'
import { MONTHS, fmtFull } from './constants'
import { getTransactionValue } from './transactionUtils'
import ComparisonStatus from './ComparisonStatus'

function SameDayComparison({ dayValue, dayNumber, dayType, currentDate, allTransactions }) {
  const [expanded, setExpanded] = useState(false)
  
  const valoresMesesAnteriores = useMemo(() => {
    const anoAtual = currentDate.getFullYear()
    const mesAtual = currentDate.getMonth()
    const dia = dayNumber
    const resultados = []
    
    for (let i = 1; i <= 3; i++) {
      let mes = mesAtual - i
      let ano = anoAtual
      if (mes < 0) { mes += 12; ano -= 1 }
      
      const diasNoMes = new Date(ano, mes + 1, 0).getDate()
      if (dia > diasNoMes) continue
      
      const dataStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
      let valorDia = 0
      
      allTransactions.forEach(t => {
        const refDate = t.data_pagamento ? new Date(t.data_pagamento).toLocaleDateString('en-CA') : t.data
        if (refDate === dataStr) {
          const result = getTransactionValue(t, dayType)
          if (result.matches) valorDia += result.value
        }
      })
      
      resultados.push({ mes: MONTHS[mes].slice(0, 3), ano: ano.toString().slice(-2), valor: valorDia })
    }
    return resultados
  }, [allTransactions, currentDate, dayNumber, dayType])
  
  const valoresValidos = valoresMesesAnteriores.filter(v => v.valor > 0)
  const media = valoresValidos.length > 0 ? valoresValidos.reduce((s, v) => s + v.valor, 0) / valoresValidos.length : 0
  
  const diferenca = dayValue - media
  const percentual = media > 0 ? (diferenca / media) * 100 : (dayValue > 0 ? 100 : 0)
  const isMelhor = dayType === 'gasto' ? diferenca <= 0 : diferenca >= 0
  const isRuim = dayType === 'gasto' ? diferenca > 0 : diferenca < 0
  
  const barColor = isMelhor ? 'bg-emerald-500' : isRuim ? 'bg-rose-500' : 'bg-gray-400'
  
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Calendar size={12} className="text-gray-400" />
          <span className="text-[9px] font-black text-gray-600 uppercase tracking-wider">Comparado com mesmo dia</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ComparisonStatus percentual={percentual} isMelhor={isMelhor} isGasto={dayType === 'gasto'} />
          {expanded ? <ChevronUp size={12} className="text-gray-400" /> : <ChevronDown size={12} className="text-gray-400" />}
        </div>
      </button>
      
      {expanded && (
        <div className="px-3 pb-3 space-y-3 animate-in slide-in-from-top-1 duration-200">
          {/* Barras de comparação */}
          <div className="bg-gray-50 rounded-xl p-2.5">
            <div className="flex justify-between text-[8px] font-black text-gray-500 mb-1">
              <span>Média 3 meses</span>
              <span>Este dia</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gray-400 rounded-full" style={{ width: `${Math.min((media / Math.max(dayValue, media)) * 100, 100)}%` }} />
              </div>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min((dayValue / Math.max(dayValue, media)) * 100, 100)}%` }} />
              </div>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] font-black text-gray-700">{fmtFull(media)}</span>
              <span className={`text-[9px] font-black ${dayValue > 0 ? 'text-gray-700' : 'text-gray-400'}`}>{dayValue > 0 ? fmtFull(dayValue) : '—'}</span>
            </div>
          </div>
          
          {/* Histórico compacto */}
          <div>
            <p className="text-[7px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Últimos 3 meses</p>
            <div className="flex justify-around">
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

export default SameDayComparison
