import { useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Transaction, User } from '../types'

interface UseOfflineSyncParams {
  user: User | null
  transactions: Transaction[]
  setTransactions: (tx: Transaction[]) => void
  refresh: () => Promise<void>
}

export function useOfflineSync({ user, transactions, setTransactions, refresh }: UseOfflineSyncParams): { saveOffline: (transaction: Partial<Transaction>) => void } {
  useEffect(() => {
    const syncOnReconnect = async () => {
      if (navigator.onLine && localStorage.getItem('pendingTransactions')) {
        const pending = JSON.parse(localStorage.getItem('pendingTransactions'))
        for (const tx of pending) {
          await supabase.from('transacoes').insert(tx)
        }
        localStorage.removeItem('pendingTransactions')
        await refresh()
      }
    }

    window.addEventListener('online', syncOnReconnect)
    return () => window.removeEventListener('online', syncOnReconnect)
  }, [refresh])

  const saveOffline = useCallback((transaction: Partial<Transaction>) => {
    const pending = JSON.parse(localStorage.getItem('pendingTransactions') || '[]')
    pending.push(transaction)
    localStorage.setItem('pendingTransactions', JSON.stringify(pending))
  }, [])

  return { saveOffline }
}