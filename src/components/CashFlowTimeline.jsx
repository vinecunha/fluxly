import React, { useMemo } from 'react'
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react'

const fmt = (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

export function CashFlowTimeline({ transactions, currentDate }) {
  const timelineData = useMemo(() => {
    const ano = currentDate.getFullYear()
    const mes = currentDate.getMonth()
    const diasNoMes = new Date(ano, mes + 1, 0).getDate()

    // Inicializar arrays
    const saldoDiario = new Array(diasNoMes + 1).fill(0)
    const receitasDiarias = new Array(diasNoMes + 1).fill(0)
    const despesasDiarias = new Array(diasNoMes + 1).fill(0)

    // Filtrar transações do mês
    const txMes = transactions.filter(t => {
      const d = new Date(t.data + 'T12:00:00')
      return d.getFullYear() === ano && d.getMonth() === mes
    })

    // Acumular por dia
    txMes.forEach(t => {
      const dia = new Date(t.data + 'T12:00:00').getDate()
      const valor = Number(t.valor) || 0

      if (t.tipo === 'renda') {
        receitasDiarias[dia] += valor
      } else if (t.tipo !== 'reserva') {
        despesasDiarias[dia] += Math.abs(valor)
      }
    })

    // Calcular saldo acumulado
    let acumulado = 0
    for (let i = 1; i <= diasNoMes; i++) {
      acumulado += receitasDiarias[i] - despesasDiarias[i]
      saldoDiario[i] = acumulado
    }

    // Encontrar máximos para escala
    const maxSaldo = Math.max(...saldoDiario.slice(1), 0)
    const minSaldo = Math.min(...saldoDiario.slice(1), 0)

    return { saldoDiario, receitasDiarias, despesasDiarias, diasNoMes, maxSaldo, minSaldo }
  }, [transactions, currentDate])

  const { saldoDiario, diasNoMes, maxSaldo, minSaldo } = timelineData
  const alturaMaxima = 80
  const maxAbs = Math.max(Math.abs(maxSaldo), Math.abs(minSaldo), 1)

  const getBarHeight = (valor) => {
    if (valor === 0) return 2
    const percent = Math.abs(valor) / maxAbs
    return Math.max(4, Math.min(alturaMaxima, percent * alturaMaxima))
  }

  const getBarColor = (valor) => {
    if (valor > 0) return 'bg-emerald-500'
    if (valor < 0) return 'bg-rose-500'
    return 'bg-gray-300'
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-slate-500" />
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
            Fluxo de Caixa Diário
          </p>
        </div>
        <div className="flex items-center gap-2 text-[8px] font-black">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-gray-400">Positivo</span>
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-gray-400">Negativo</span>
          </span>
        </div>
      </div>

      <div className="relative h-[90px] mb-2">
        {Array.from({ length: diasNoMes }, (_, i) => {
          const dia = i + 1
          const saldo = saldoDiario[dia] || 0
          const altura = getBarHeight(saldo)
          const cor = getBarColor(saldo)

          return (
            <div
              key={dia}
              className="absolute bottom-0 w-6 rounded-t-md transition-all duration-300 hover:opacity-80"
              style={{
                left: `${(dia - 1) * (100 / diasNoMes)}%`,
                width: `${Math.max(4, 90 / diasNoMes)}%`,
                height: `${altura}px`,
                backgroundColor: cor === 'bg-emerald-500' ? '#10b981' : cor === 'bg-rose-500' ? '#ef4444' : '#d1d5db'
              }}
              title={`Dia ${dia}: ${fmt(saldo)}`}
            />
          )
        })}
      </div>

      <div className="flex justify-between text-[8px] font-black text-gray-400 mt-1">
        <span>1</span>
        <span>{Math.floor(diasNoMes / 4)}</span>
        <span>{Math.floor(diasNoMes / 2)}</span>
        <span>{Math.floor(diasNoMes * 3 / 4)}</span>
        <span>{diasNoMes}</span>
      </div>
    </div>
  )
}