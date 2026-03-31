import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useOfflineSync(user, transactions, setTransactions) {
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
  }, [])

  const saveOffline = (transaction) => {
    const pending = JSON.parse(localStorage.getItem('pendingTransactions') || '[]')
    pending.push(transaction)
    localStorage.setItem('pendingTransactions', JSON.stringify(pending))
  }

  return { saveOffline }
}