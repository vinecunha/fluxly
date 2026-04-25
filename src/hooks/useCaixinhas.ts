import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { logger } from '../lib/logger'
import type { User } from '../types'

interface CaixinhaItem {
  transacao_id: string
  total: number
  items: unknown[]
}

interface UseCaixinhasReturn {
  saldoPorConta: Record<string, CaixinhaItem>
  guardar: (params: { transacaoId: string; valor: number; descricao?: string }) => Promise<{ ok?: boolean; data?: unknown[]; error?: string }>
  zerarCaixinha: (transacaoId: string) => Promise<void>
  loading: boolean
  refresh: () => Promise<void>
}

export function useCaixinhas(user: User | null, mesStr: string, onGuardarMeta: ((transacaoId: string, valor: number, descricao: string) => Promise<unknown>) | null = null): UseCaixinhasReturn {
  const [saldoPorConta, setSaldoPorConta] = useState<Record<string, CaixinhaItem>>({})
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!user?.id) {
      setSaldoPorConta({})
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const { data: caixinhas, error } = await supabase
        .from('caixinhas')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const agrupado: Record<string, CaixinhaItem> = {}
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

  const guardar = useCallback(async ({ transacaoId, valor, descricao }: { transacaoId: string; valor: number; descricao?: string }) => {
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

      if (onGuardarMeta) {
        const metaResult = await onGuardarMeta(transacaoId, Number(valor), descricao || '')
        return { ok: true, data, meta: metaResult }
      }

      return { ok: true, data }
    } catch (error) {
      logger.error('Erro ao guardar na caixinha:', error)
      return { error: (error as Error).message }
    }
  }, [user?.id, fetchData, onGuardarMeta])

  const zerarCaixinha = useCallback(async (transacaoId: string) => {
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