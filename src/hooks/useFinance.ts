import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@lib/supabase'
import { logger } from '@lib/logger'
import type { Transaction, User } from '@types'

interface UseFinanceReturn {
  data: Transaction[]
  loading: boolean
  refresh: () => Promise<void>
}

export function useFinance(user: User | null): UseFinanceReturn {
  const [data, setData] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setData([])
      setLoading(false)
      return
    }

    setLoading(true)
    const startTime = performance.now()
    
    try {
      const { data: transacoes, error } = await supabase
        .from('transacoes')
        .select('*')
        .eq('user_id', user.id)
        .order('data', { ascending: false })

      if (error) throw error

      const userId = user.id
      const safe = (transacoes || []).filter(t => t.user_id === userId)

      setData(safe)
      
      const duration = performance.now() - startTime
      logger.performance('useFinance.refresh', duration)
      
    } catch (err) {
      logger.error('Erro ao buscar finanças:', (err as Error).message)
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