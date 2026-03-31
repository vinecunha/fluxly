import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useMetas(user) {
  const [metas, setMetas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
      console.error('Erro ao buscar metas:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const criarMeta = useCallback(async (nome, valorObjetivo, prazo, categoria = null) => {
    if (!user?.id) return { error: 'Usuário não autenticado' }

    try {
      const { data, error: supabaseError } = await supabase
        .from('metas')
        .insert([{
          user_id: user.id,
          nome,
          valor_objetivo: valorObjetivo,
          valor_atual: 0,
          prazo,
          categoria,
          progresso: 0,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (supabaseError) throw supabaseError

      setMetas(prev => [data, ...prev])
      return { success: true, data }
    } catch (err) {
      console.error('Erro ao criar meta:', err)
      return { error: err.message }
    }
  }, [user?.id])

  const atualizarProgresso = useCallback(async (metaId, valorDepositado) => {
    if (!user?.id) return { error: 'Usuário não autenticado' }

    const meta = metas.find(m => m.id === metaId)
    if (!meta) return { error: 'Meta não encontrada' }

    const novoValor = (meta.valor_atual || 0) + valorDepositado
    const novoProgresso = Math.min((novoValor / meta.valor_objetivo) * 100, 100)
    const concluida = novoProgresso >= 100

    try {
      const { data, error: supabaseError } = await supabase
        .from('metas')
        .update({
          valor_atual: novoValor,
          progresso: novoProgresso,
          concluida,
          updated_at: new Date().toISOString()
        })
        .eq('id', metaId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (supabaseError) throw supabaseError

      setMetas(prev => prev.map(m => m.id === metaId ? data : m))
      return { success: true, data }
    } catch (err) {
      console.error('Erro ao atualizar meta:', err)
      return { error: err.message }
    }
  }, [user?.id, metas])

  const excluirMeta = useCallback(async (metaId) => {
    if (!user?.id) return { error: 'Usuário não autenticado' }

    try {
      const { error: supabaseError } = await supabase
        .from('metas')
        .delete()
        .eq('id', metaId)
        .eq('user_id', user.id)

      if (supabaseError) throw supabaseError

      setMetas(prev => prev.filter(m => m.id !== metaId))
      return { success: true }
    } catch (err) {
      console.error('Erro ao excluir meta:', err)
      return { error: err.message }
    }
  }, [user?.id])

  useEffect(() => {
    fetchMetas()
  }, [fetchMetas])

  return { metas, loading, error, criarMeta, atualizarProgresso, excluirMeta, refresh: fetchMetas }
}