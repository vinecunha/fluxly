import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@lib/supabase'
import type { Meta, User } from '@types'
import { logger } from '@lib/logger'

interface UseMetasReturn {
  metas: Meta[]
  loading: boolean
  error: string | null
  criarMeta: (nome: string, valorObjetivo: number, prazo: string, categoria?: string, contaId?: string) => Promise<{ success?: boolean; data?: Meta; error?: string }>
  criarMetaParaConta: (contaId: string, nome: string, valorObjetivo: number, prazo?: string) => Promise<{ success?: boolean; data?: Meta; error?: string }>
  depositarNaMeta: (metaId: string, valor: number) => Promise<{ success?: boolean; data?: Meta; progresso?: number; error?: string }>
  editarMeta: (metaId: string, updates: Partial<Meta>) => Promise<{ success?: boolean; data?: Meta; error?: string }>
  ajustarValorDepositado: (metaId: string, novoValorAtual: number, transacaoId?: string) => Promise<{ success?: boolean; data?: Meta; error?: string }>
  excluirMeta: (metaId: string) => Promise<{ success?: boolean; error?: string }>
  arquivarMeta: (metaId: string) => Promise<{ success?: boolean; error?: string }>
  alterarPrazo: (metaId: string, novoPrazo: string) => Promise<{ success?: boolean; data?: Meta; error?: string }>
  getMetaPorConta: (contaId: string) => Promise<Meta | null>
  sincronizarComCaixinhas: () => Promise<void>
  refresh: () => Promise<void>
}

export function useMetas(user: User | null): UseMetasReturn {
  const [metas, setMetas] = useState<Meta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMetas = useCallback(async () => {
    if (!user?.id) {
      setMetas([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const { data, error: supabaseError } = await supabase
        .from('metas')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (supabaseError) throw supabaseError
      setMetas(data || [])
    } catch (err) {
      logger.error('Erro ao buscar metas:', err)
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const getMetaPorConta = useCallback(async (contaId: string): Promise<Meta | null> => {
    if (!user?.id || !contaId) return null
    
    try {
      const { data, error } = await supabase
        .from('metas')
        .select('*')
        .eq('user_id', user.id)
        .eq('conta_id', contaId)
        .maybeSingle()
      
      if (error) throw error
      return data
    } catch (err) {
      logger.error('Erro ao buscar meta por conta:', err)
      return null
    }
  }, [user?.id])

  const criarMetaParaConta = useCallback(async (contaId: string, nome: string, valorObjetivo: number, prazo?: string) => {
    if (!user?.id) return { error: 'Usuário não autenticado' }

    const metaExistente = await getMetaPorConta(contaId)
    if (metaExistente) {
      return { error: 'Já existe uma meta para esta conta', data: metaExistente }
    }

    const prazoFinal = prazo || (() => {
      const d = new Date()
      d.setMonth(d.getMonth() + 3)
      return d.toISOString().split('T')[0]
    })()

    try {
      const { data, error } = await supabase
        .from('metas')
        .insert([{
          user_id: user.id,
          descricao: nome,
          valor_objetivo: valorObjetivo,
          valor_depositado: 0,
          prazo: prazoFinal,
          ativa: true,
          arquivada: false,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error

      setMetas(prev => [data, ...prev])
      return { success: true, data }
    } catch (err) {
      logger.error('Erro ao criar meta para conta:', err)
      return { error: (err as Error).message }
    }
  }, [user?.id, getMetaPorConta])

  const editarMeta = useCallback(async (metaId: string, updates: Partial<Meta>) => {
    if (!user?.id) return { error: 'Usuário não autenticado' }

    const meta = metas.find(m => m.id === metaId)
    if (!meta) return { error: 'Meta não encontrada' }

    try {
      const { data, error } = await supabase
        .from('metas')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', metaId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      setMetas(prev => prev.map(m => m.id === metaId ? data : m))
      return { success: true, data }
    } catch (err) {
      logger.error('Erro ao editar meta:', err)
      return { error: (err as Error).message }
    }
  }, [user?.id, metas])

  const ajustarValorDepositado = useCallback(async (metaId: string, novoValorAtual: number, transacaoId?: string) => {
    if (!user?.id) return { error: 'Usuário não autenticado' }

    const meta = metas.find(m => m.id === metaId)
    if (!meta) return { error: 'Meta não encontrada' }

     void Math.min((novoValorAtual / meta.valor_objetivo) * 100, 100)

     try {
      const { data, error } = await supabase
        .from('metas')
        .update({
          valor_depositado: novoValorAtual,
          updated_at: new Date().toISOString()
        })
        .eq('id', metaId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      if (transacaoId) {
        await supabase
          .from('caixinhas')
          .update({ valor: novoValorAtual })
          .eq('transacao_id', transacaoId)
          .eq('user_id', user.id)
      }

      setMetas(prev => prev.map(m => m.id === metaId ? data : m))
      return { success: true, data }
    } catch (err) {
      logger.error('Erro ao ajustar valor da meta:', err)
      return { error: (err as Error).message }
    }
  }, [user?.id, metas])

  const depositarNaMeta = useCallback(async (metaId: string, valor: number) => {
    if (!user?.id) return { error: 'Usuário não autenticado' }
    
    const meta = metas.find(m => m.id === metaId)
    if (!meta) return { error: 'Meta não encontrada' }

     const novoValor = (meta.valor_depositado || 0) + valor
     const novoProgresso = Math.min((novoValor / meta.valor_objetivo) * 100, 100)

     try {
      const { data, error } = await supabase
        .from('metas')
        .update({
          valor_depositado: novoValor,
          updated_at: new Date().toISOString()
        })
        .eq('id', metaId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      setMetas(prev => prev.map(m => m.id === metaId ? data : m))
      
      await supabase
        .from('caixinhas')
        .insert([{
          user_id: user.id,
          transacao_id: meta.id,
          valor,
          descricao: `Depósito na meta: ${meta.descricao}`,
          created_at: new Date().toISOString()
        }])

      return { success: true, data, progresso: novoProgresso }
    } catch (err) {
      logger.error('Erro ao depositar na meta:', err)
      return { error: (err as Error).message }
    }
  }, [user?.id, metas])

  const criarMeta = useCallback(async (nome: string, valorObjetivo: number, prazo: string, _categoria?: string, _contaId?: string) => {
    if (!user?.id) return { error: 'Usuário não autenticado' }

    try {
      const { data, error } = await supabase
        .from('metas')
        .insert([{
          user_id: user.id,
          descricao: nome,
          valor_objetivo: valorObjetivo,
          valor_depositado: 0,
          prazo,
          ativa: true,
          arquivada: false,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error

      setMetas(prev => [data, ...prev])
      return { success: true, data }
    } catch (err) {
      logger.error('Erro ao criar meta:', err)
      return { error: (err as Error).message }
    }
  }, [user?.id])

  const excluirMeta = useCallback(async (metaId: string) => {
    if (!user?.id) return { error: 'Usuário não autenticado' }

    try {
      const { error } = await supabase
        .from('metas')
        .delete()
        .eq('id', metaId)
        .eq('user_id', user.id)

      if (error) throw error

      setMetas(prev => prev.filter(m => m.id !== metaId))
      return { success: true }
    } catch (err) {
      logger.error('Erro ao excluir meta:', err)
      return { error: (err as Error).message }
    }
  }, [user?.id])

  const arquivarMeta = useCallback(async (metaId: string) => {
    if (!user?.id) return { error: 'Usuário não autenticado' }

    try {
      const { error } = await supabase
        .from('metas')
        .update({ arquivada: true, updated_at: new Date().toISOString() })
        .eq('id', metaId)
        .eq('user_id', user.id)

      if (error) throw error

      setMetas(prev => prev.map(m => m.id === metaId ? { ...m, arquivada: true } : m))
      return { success: true }
    } catch (err) {
      logger.error('Erro ao arquivar meta:', err)
      return { error: (err as Error).message }
    }
  }, [user?.id])

  const alterarPrazo = useCallback(async (metaId: string, novoPrazo: string) => {
    if (!user?.id) return { error: 'Usuário não autenticado' }

    try {
      const { data, error } = await supabase
        .from('metas')
        .update({ 
          prazo: novoPrazo,
          updated_at: new Date().toISOString()
        })
        .eq('id', metaId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      setMetas(prev => prev.map(m => m.id === metaId ? data : m))
      return { success: true, data }
    } catch (err) {
      logger.error('Erro ao alterar prazo da meta:', err)
      return { error: (err as Error).message }
    }
  }, [user?.id])

  const sincronizarComCaixinhas = useCallback(async () => {
    if (!user?.id) return

    try {
      const { data: caixinhas } = await supabase
        .from('caixinhas')
        .select('transacao_id, valor')
        .eq('user_id', user.id)

      const totalPorConta: Record<string, number> = {}
      caixinhas?.forEach(c => {
        if (c.transacao_id) {
          totalPorConta[c.transacao_id] = (totalPorConta[c.transacao_id] || 0) + c.valor
        }
      })

      const { data: metasComConta } = await supabase
        .from('metas')
        .select('id, conta_id, valor_objetivo')
        .eq('user_id', user.id)
        .not('conta_id', 'is', null)

       for (const meta of (metasComConta ?? [])) {
        const valorAtual = totalPorConta[meta.conta_id] || 0
        const progresso = Math.min((valorAtual / meta.valor_objetivo) * 100, 100)
        
        await supabase
          .from('metas')
          .update({
            valor_depositado: valorAtual,
            arquivada: progresso >= 100
          })
          .eq('id', meta.id)
          .eq('user_id', user.id)
      }

      await fetchMetas()
    } catch (err) {
      logger.error('Erro ao sincronizar metas com caixinhas:', err)
    }
  }, [user?.id, fetchMetas])

  useEffect(() => {
    fetchMetas()
  }, [fetchMetas])

  return {
    metas,
    loading,
    error,
    criarMeta,
    criarMetaParaConta,
    depositarNaMeta,
    editarMeta,
    ajustarValorDepositado,
    excluirMeta,
    arquivarMeta,
    alterarPrazo,
    getMetaPorConta,
    sincronizarComCaixinhas,
    refresh: fetchMetas
  }
}