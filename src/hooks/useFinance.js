import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useFinance(userId) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  async function refresh() {
    // Se não houver userId (usuário deslogado ou carregando auth), 
    // não fazemos a requisição e limpamos os dados.
    if (!userId) {
      setData([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const { data: transacoes, error } = await supabase
        .from('transacoes')
        .select('*')
        .eq('user_id', userId) // FILTRO CRUCIAL: Garante que buscamos apenas os dados deste user
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

  // O useEffect observa o userId. Se o usuário deslogar ou trocar, 
  // o hook recarrega os dados automaticamente.
  useEffect(() => { 
    refresh() 
  }, [userId])

  return { data, loading, refresh }
}