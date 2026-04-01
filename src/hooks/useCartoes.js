import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// useCartoes apenas gerencia os metadados dos cartões (nome, limite, fechamento, vencimento, cor)
// O cálculo de fatura é feito no frontend via calcFatura (faturaHelpers.js)
// usando allTransactions do useFinance — sem depender de views do BD

export function useCartoes(user) {
  const [cartoes, setCartoes] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user?.id) { setLoading(false); return }
    setLoading(true)
    try {
      const { data: c } = await supabase
        .from('cartoes')
        .select('*')
        .eq('user_id', user.id)
        .eq('ativo', true)
        .order('created_at')
      setCartoes(c || [])
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => { refresh() }, [refresh])

  const criarCartao = async (dados) => {
    console.log('🔵 criarCartao chamado com:', dados) // ✅ LOG
    const { error } = await supabase.from('cartoes').insert([{ ...dados, user_id: user.id }])
    if (error) {
      console.error('🔴 Erro ao criar cartão:', error)
      throw error
    }
    console.log('✅ Cartão criado com sucesso')
    await refresh()
  }

  const editarCartao = async (id, dados) => {
    const { error } = await supabase.from('cartoes').update(dados).eq('id', id)
    if (error) throw error
    await refresh()
  }

  const excluirCartao = async (id) => {
    const { error } = await supabase.from('cartoes').update({ ativo: false }).eq('id', id)
    if (error) throw error
    await refresh()
  }

  return { cartoes, faturas: [], loading, refresh, criarCartao, editarCartao, excluirCartao }
}