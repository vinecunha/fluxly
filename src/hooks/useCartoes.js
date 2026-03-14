import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useCartoes(user) {
  const [cartoes, setCartoes] = useState([])
  const [faturas, setFaturas] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user?.id) { setLoading(false); return }
    setLoading(true)
    try {
      const [{ data: c }, { data: f }] = await Promise.all([
        supabase.from('cartoes').select('*').eq('user_id', user.id).eq('ativo', true).order('created_at'),
        supabase.from('fatura_cartao').select('*').eq('user_id', user.id),
      ])
      setCartoes(c || [])
      setFaturas(f || [])
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => { refresh() }, [refresh])

  const criarCartao = async (dados) => {
    const { error } = await supabase.from('cartoes').insert([{ ...dados, user_id: user.id }])
    if (error) throw error
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

  return { cartoes, faturas, loading, refresh, criarCartao, editarCartao, excluirCartao }
}