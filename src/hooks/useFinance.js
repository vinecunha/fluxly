import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useFinance(user) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  async function refresh() {
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
        .eq('user_id', user.id)
        .order('data', { ascending: false })

      if (error) throw error

      setData(transacoes || [])
    } catch (error) {
      console.error('Erro ao buscar finanças:', error.message)
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [user?.id])

  return { data, loading, refresh }
}