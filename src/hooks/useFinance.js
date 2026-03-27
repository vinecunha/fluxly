import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useFinance(user) {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setData([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const { data: transacoes, error } = await supabase
        .from('transacoes')
        .select('*')
        .eq('user_id', user.id)       // filtro primário (RLS faz a mesma coisa no BD)
        .order('data', { ascending: false })

      if (error) throw error

      // Defesa extra: descartar qualquer registro que não pertença ao usuário logado
      // (proteção em caso de bug de RLS ou dados corrompidos)
      const userId = user.id
      const safe = (transacoes || []).filter(t => t.user_id === userId)

      setData(safe)
    } catch (error) {
      console.error('Erro ao buscar finanças:', error.message)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { data, loading, refresh }
}