import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Cartao, User } from '../types'

interface UseCartoesReturn {
  cartoes: Cartao[]
  faturas: unknown[]
  loading: boolean
  refresh: () => Promise<void>
  criarCartao: (dados: Partial<Cartao>) => Promise<void>
  editarCartao: (id: string, dados: Partial<Cartao>) => Promise<void>
  excluirCartao: (id: string) => Promise<void>
}

export function useCartoes(user: User | null): UseCartoesReturn {
  const [cartoes, setCartoes] = useState<Cartao[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user?.id) { setLoading(false); return }
    setLoading(true)
    try {
      const { data: c } = await supabase
        .from('cartoes')
        .select('*')
        .eq('user_id', user.id)
        .eq('ativa', true)
        .order('created_at')
      setCartoes(c || [])
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => { refresh() }, [refresh])

  const criarCartao = async (dados: Partial<Cartao>) => {
    console.log('🔵 criarCartao chamado com:', dados)
    const { error } = await supabase.from('cartoes').insert([{ ...dados, user_id: user?.id }])
    if (error) {
      console.error('🔴 Erro ao criar cartão:', error)
      throw error
    }
    console.log('✅ Cartão criado com sucesso')
    await refresh()
  }

  const editarCartao = async (id: string, dados: Partial<Cartao>) => {
    if (!user?.id) return
    const { error } = await supabase.from('cartoes').update(dados).eq('id', id).eq('user_id', user.id)
    if (error) throw error
    await refresh()
  }

  const excluirCartao = async (id: string) => {
    if (!user?.id) return
    const { error } = await supabase.from('cartoes').update({ ativa: false }).eq('id', id).eq('user_id', user.id)
    if (error) throw error
    await refresh()
  }

  return { cartoes, faturas: [], loading, refresh, criarCartao, editarCartao, excluirCartao }
}