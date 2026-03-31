import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { logger } from '../lib/logger'

export function useCaixinhas(user, mesStr) {
  const [saldoPorConta, setSaldoPorConta] = useState({})
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!user?.id) {
      setSaldoPorConta({})
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      // Buscar caixinhas
      const { data: caixinhas, error } = await supabase
        .from('caixinhas')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Agrupar por transacao_id
      const agrupado = {}
      ;(caixinhas || []).forEach(c => {
        const txId = c.transacao_id
        if (!agrupado[txId]) {
          agrupado[txId] = { total: 0, items: [] }
        }
        agrupado[txId].total += Number(c.valor) || 0
        agrupado[txId].items.push(c)
      })

      setSaldoPorConta(agrupado)
    } catch (error) {
      logger.error('Erro ao buscar caixinhas:', error)
      setSaldoPorConta({})
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const guardar = useCallback(async ({ transacaoId, valor, descricao }) => {
    if (!user?.id) return { error: 'Usuário não autenticado' }

    try {
      const { data, error } = await supabase
        .from('caixinhas')
        .insert([{
          user_id: user.id,
          transacao_id: transacaoId,
          valor: Number(valor),
          descricao,
          created_at: new Date().toISOString()
        }])
        .select()

      if (error) throw error

      await fetchData()
      return { ok: true, data }
    } catch (error) {
      logger.error('Erro ao guardar na caixinha:', error)
      return { error: error.message }
    }
  }, [user?.id, fetchData])

  const zerarCaixinha = useCallback(async (transacaoId) => {
    if (!user?.id) return

    try {
      const { error } = await supabase
        .from('caixinhas')
        .delete()
        .eq('user_id', user.id)
        .eq('transacao_id', transacaoId)

      if (error) throw error
      await fetchData()
    } catch (error) {
      logger.error('Erro ao zerar caixinha:', error)
    }
  }, [user?.id, fetchData])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { saldoPorConta, guardar, zerarCaixinha, loading, refresh: fetchData }
}