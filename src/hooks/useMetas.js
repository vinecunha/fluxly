import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { logger } from '../lib/logger'

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

  // Buscar meta por conta_id
  const getMetaPorConta = useCallback(async (contaId) => {
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
      console.error('Erro ao buscar meta por conta:', err)
      return null
    }
  }, [user?.id])

  // Criar meta vinculada a uma conta
  const criarMetaParaConta = useCallback(async (contaId, nome, valorObjetivo, prazo = null) => {
    if (!user?.id) return { error: 'Usuário não autenticado' }

    const metaExistente = await getMetaPorConta(contaId)
    if (metaExistente) {
      return { error: 'Já existe uma meta para esta conta', meta: metaExistente }
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
          nome,
          valor_objetivo: valorObjetivo,
          valor_atual: 0,
          prazo: prazoFinal,
          categoria: 'Conta',
          conta_id: contaId,
          progresso: 0,
          concluida: false,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error

      setMetas(prev => [data, ...prev])
      return { success: true, data }
    } catch (err) {
      console.error('Erro ao criar meta para conta:', err)
      return { error: err.message }
    }
  }, [user?.id, getMetaPorConta])

  // ✅ EDITAR META (dados básicos)
  const editarMeta = useCallback(async (metaId, updates) => {
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
      console.error('Erro ao editar meta:', err)
      return { error: err.message }
    }
  }, [user?.id, metas])

  // ✅ AJUSTAR VALOR DEPOSITADO (corrigir lançamento)
  const ajustarValorDepositado = useCallback(async (metaId, novoValorAtual, transacaoId = null) => {
    if (!user?.id) return { error: 'Usuário não autenticado' }

    const meta = metas.find(m => m.id === metaId)
    if (!meta) return { error: 'Meta não encontrada' }

    const novoProgresso = Math.min((novoValorAtual / meta.valor_objetivo) * 100, 100)
    const concluida = novoProgresso >= 100

    try {
      // Atualizar meta
      const { data, error } = await supabase
        .from('metas')
        .update({
          valor_atual: novoValorAtual,
          progresso: novoProgresso,
          concluida,
          updated_at: new Date().toISOString()
        })
        .eq('id', metaId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      // Se tiver transacao_id, atualizar também a caixinha
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
      console.error('Erro ao ajustar valor da meta:', err)
      return { error: err.message }
    }
  }, [user?.id, metas])

  // Depositar na meta
  const depositarNaMeta = useCallback(async (metaId, valor) => {
    if (!user?.id) return { error: 'Usuário não autenticado' }
    
    const meta = metas.find(m => m.id === metaId)
    if (!meta) return { error: 'Meta não encontrada' }

    const novoValor = (meta.valor_atual || 0) + valor
    const novoProgresso = Math.min((novoValor / meta.valor_objetivo) * 100, 100)
    const concluida = novoProgresso >= 100

    try {
      const { data, error } = await supabase
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

      if (error) throw error

      setMetas(prev => prev.map(m => m.id === metaId ? data : m))
      
      // Registrar na caixinha
      await supabase
        .from('caixinhas')
        .insert([{
          user_id: user.id,
          transacao_id: meta.conta_id,
          valor,
          descricao: `Depósito na meta: ${meta.nome}`,
          created_at: new Date().toISOString()
        }])

      return { success: true, data, progresso: novoProgresso }
    } catch (err) {
      console.error('Erro ao depositar na meta:', err)
      return { error: err.message }
    }
  }, [user?.id, metas])

  const criarMeta = useCallback(async (nome, valorObjetivo, prazo, categoria = null, contaId = null) => {
    if (!user?.id) return { error: 'Usuário não autenticado' }

    try {
      const { data, error } = await supabase
        .from('metas')
        .insert([{
          user_id: user.id,
          nome,
          valor_objetivo: valorObjetivo,
          valor_atual: 0,
          prazo,
          categoria,
          conta_id: contaId,
          progresso: 0,
          concluida: false,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error

      setMetas(prev => [data, ...prev])
      return { success: true, data }
    } catch (err) {
      console.error('Erro ao criar meta:', err)
      return { error: err.message }
    }
  }, [user?.id])

  const excluirMeta = useCallback(async (metaId) => {
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
      console.error('Erro ao excluir meta:', err)
      return { error: err.message }
    }
  }, [user?.id])

  const arquivarMeta = useCallback(async (metaId) => {
    if (!user?.id) return { error: 'Usuário não autenticado' }

    try {
      const { error } = await supabase
        .from('metas')
        .update({ concluida: true, updated_at: new Date().toISOString() })
        .eq('id', metaId)
        .eq('user_id', user.id)

      if (error) throw error

      setMetas(prev => prev.map(m => m.id === metaId ? { ...m, concluida: true } : m))
      return { success: true }
    } catch (err) {
      console.error('Erro ao arquivar meta:', err)
      return { error: err.message }
    }
  }, [user?.id])

  const alterarPrazo = useCallback(async (metaId, novoPrazo) => {
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
      console.error('Erro ao alterar prazo da meta:', err)
      return { error: err.message }
    }
  }, [user?.id])

  const sincronizarComCaixinhas = useCallback(async () => {
    if (!user?.id) return

    try {
      const { data: caixinhas } = await supabase
        .from('caixinhas')
        .select('transacao_id, valor')
        .eq('user_id', user.id)

      const totalPorConta = {}
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

      for (const meta of metasComConta) {
        const valorAtual = totalPorConta[meta.conta_id] || 0
        const progresso = Math.min((valorAtual / meta.valor_objetivo) * 100, 100)
        
        await supabase
          .from('metas')
          .update({
            valor_atual: valorAtual,
            progresso,
            concluida: progresso >= 100
          })
          .eq('id', meta.id)
          .eq('user_id', user.id)
      }

      await fetchMetas()
    } catch (err) {
      console.error('Erro ao sincronizar metas com caixinhas:', err)
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