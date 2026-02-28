import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useFinance(userId) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  async function refresh() {
    if (!userId) return
    setLoading(true)
    const { data: transacoes } = await supabase
      .from('transacoes')
      .select('*')
      .order('data', { ascending: false })
    setData(transacoes || [])
    setLoading(false)
  }

  useEffect(() => { refresh() }, [userId])

  return { data, loading, refresh }
}