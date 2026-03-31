import { useState } from 'react'
import { supabase } from '../lib/supabase'

export function useAIInsights(user, transactions, saldo, currentDate) {
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const gerarInsights = async () => {
    if (!user?.id) return

    setLoading(true)
    setError(null)

    try {
      // Preparar resumo dos dados
      const resumo = {
        mes: currentDate.getMonth() + 1,
        ano: currentDate.getFullYear(),
        totalRenda: transactions.filter(t => t.tipo === 'renda').reduce((s, t) => s + (Number(t.valor) || 0), 0),
        totalGastos: transactions.filter(t => t.tipo !== 'renda' && t.tipo !== 'reserva').reduce((s, t) => s + (Number(t.valor) || 0), 0),
        gastosPorCategoria: {},
        maioresGastos: [],
        saldoProjetado: saldo?.saldoProjetado || 0,
      }

      // Agrupar gastos por categoria
      transactions.forEach(t => {
        if (t.tipo !== 'renda' && t.tipo !== 'reserva') {
          const cat = t.categoria || 'Outros'
          resumo.gastosPorCategoria[cat] = (resumo.gastosPorCategoria[cat] || 0) + (Number(t.valor) || 0)
        }
      })

      // Pegar top 3 maiores gastos
      resumo.maioresGastos = transactions
        .filter(t => t.tipo !== 'renda' && t.tipo !== 'reserva')
        .sort((a, b) => (Number(b.valor) || 0) - (Number(a.valor) || 0))
        .slice(0, 3)
        .map(t => ({ descricao: t.descricao, valor: Number(t.valor) }))

      // Chamar Edge Function do Supabase
      const { data, error: fnError } = await supabase.functions.invoke('ai-insights', {
        body: { resumo }
      })

      if (fnError) throw fnError

      setInsights(data)
      return data
    } catch (err) {
      console.error('Erro ao gerar insights IA:', err)
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  return { insights, loading, error, gerarInsights }
}