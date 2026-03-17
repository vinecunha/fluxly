import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useCaixinhas(user, mesRef) {
  const [caixinhas, setCaixinhas] = useState([])
  const [loading, setLoading]     = useState(false)

  const fetch = useCallback(async () => {
    if (!user || !mesRef) return
    setLoading(true)
    const { data } = await supabase
      .from('caixinhas')
      .select('*')
      .eq('user_id', user.id)
      .eq('mes_ref', mesRef)
      .order('created_at', { ascending: false })
    setCaixinhas(data || [])
    setLoading(false)
  }, [user, mesRef])

  useEffect(() => { fetch() }, [fetch])

  // Soma guardado por transacao_id
  const saldoPorConta = (caixinhas || []).reduce((acc, c) => {
    acc[c.transacao_id] = (acc[c.transacao_id] || 0) + Number(c.valor)
    return acc
  }, {})

  const guardar = useCallback(async ({ transacaoId, valor, descricao }) => {
    if (!user || !mesRef || !valor || valor <= 0) return { error: 'Valor inválido' }

    const mesAtual = mesRef

    // 1. Inserir na tabela caixinhas
    const { error: errCaixinha } = await supabase.from('caixinhas').insert([{
      user_id:     user.id,
      transacao_id: transacaoId,
      valor,
      mes_ref:     mesAtual,
      descricao:   descricao || null,
    }])
    if (errCaixinha) return { error: errCaixinha.message }

    // 2. Lançar como reserva no fluxo normal
    const hoje = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
    const { error: errReserva } = await supabase.from('transacoes').insert([{
      user_id:         user.id,
      descricao:       descricao || `Reserva para conta`,
      valor,
      tipo:            'reserva',
      categoria:       'Reserva',
      subcategoria:    descricao || null,
      destino_reserva: 'Caixinha',
      pago:            true,
      data:            hoje,
      data_pagamento:  new Date().toISOString(),
    }])
    if (errReserva) return { error: errReserva.message }

    await fetch()
    return { ok: true }
  }, [user, mesRef, fetch])

  // Zera caixinha ao pagar a conta
  const zerarCaixinha = useCallback(async (transacaoId) => {
    if (!user || !transacaoId) return
    await supabase
      .from('caixinhas')
      .delete()
      .eq('user_id', user.id)
      .eq('transacao_id', transacaoId)
    await fetch()
  }, [user, fetch])

  return { caixinhas, saldoPorConta, loading, guardar, zerarCaixinha, refresh: fetch }
}