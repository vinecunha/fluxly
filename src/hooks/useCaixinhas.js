import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'

// ─── Cálculo de rendimento CDI ────────────────────────────────────────────────
// taxaAnualCDI: ex 0.1065 (10.65% aa)
// pctCDI:       ex 100 (100% do CDI), 110, 120...
// diasAplicado: dias corridos desde o depósito
// carencia:     dias de carência antes de render
// retorna o valor bruto com rendimento (sem IR — exibição simples)
function calcRendimento(valorOriginal, taxaAnualCDI, pctCDI = 100, diasAplicado = 0, carencia = 0) {
  if (!valorOriginal || valorOriginal <= 0 || !taxaAnualCDI) return valorOriginal

  const diasEfetivos = Math.max(0, diasAplicado - carencia)
  if (diasEfetivos <= 0) return valorOriginal

  // CDI diário ajustado pelo percentual contratado
  const taxaDiaria = Math.pow(1 + taxaAnualCDI, 1 / 252) - 1
  const taxaEfetiva = taxaDiaria * (pctCDI / 100)

  // Dias úteis estimados (69% dos dias corridos)
  const diasUteis = Math.floor(diasEfetivos * 0.69)

  return valorOriginal * Math.pow(1 + taxaEfetiva, diasUteis)
}

// ─── Hook principal ───────────────────────────────────────────────────────────
export function useCaixinhas(user, mesRef) {
  const [caixinhas, setCaixinhas] = useState([])
  const [loading, setLoading]     = useState(false)
  const [cdiAnual, setCdiAnual]   = useState(0.1065) // fallback 10.65% aa

  // Buscar taxa CDI atual da API pública
  useEffect(() => {
    fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.4391/dados/ultimos/1?formato=json')
      .then(r => r.json())
      .then(data => {
        // valor vem como taxa diária em %
        const taxaDiaria = parseFloat(data[0]?.valor) / 100
        // Anualizar: (1 + taxaDiaria)^252 - 1
        const taxaAnual = Math.pow(1 + taxaDiaria, 252) - 1
        if (!isNaN(taxaAnual) && taxaAnual > 0) setCdiAnual(taxaAnual)
      })
      .catch(() => {}) // mantém fallback
  }, [])

  const fetchData = useCallback(async () => {
    if (!user || !mesRef) return
    setLoading(true)

    // Buscar caixinhas do mês
    const { data: caixinhasData } = await supabase
      .from('caixinhas')
      .select('*')
      .eq('user_id', user.id)
      .eq('mes_ref', mesRef)
      .order('created_at', { ascending: false })

    setCaixinhas(caixinhasData || [])
    setLoading(false)
  }, [user, mesRef])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Buscar transações de reserva para pegar parâmetros CDI ────────────────
  // As transações de reserva têm _cdiPct e _cdiCarencia na subcategoria
  // Padrão: guardar como JSON na coluna subcategoria quando criar reserva
  // Ex: subcategoria = '{"cdiPct":110,"carencia":30}'

  const parseCdiParams = (subcategoria) => {
    try {
      const parsed = JSON.parse(subcategoria || '{}')
      return {
        pctCDI:   Number(parsed.cdiPct)    || 100,
        carencia: Number(parsed.carencia)  || 0,
      }
    } catch {
      return { pctCDI: 100, carencia: 0 }
    }
  }

  // ── Saldo com rendimento por transacao_id ─────────────────────────────────
  const saldoPorConta = useMemo(() => {
    const hoje = new Date()
    return (caixinhas || []).reduce((acc, c) => {
      const dataDeposito = new Date(c.created_at)
      const diasAplicado = Math.floor((hoje - dataDeposito) / (1000 * 60 * 60 * 24))

      const { pctCDI, carencia } = parseCdiParams(c.descricao)

      const valorComRendimento = calcRendimento(
        Number(c.valor),
        cdiAnual,
        pctCDI,
        diasAplicado,
        carencia
      )

      if (!acc[c.transacao_id]) {
        acc[c.transacao_id] = { total: 0, rendimento: 0, original: 0, pctCDI, carencia }
      }
      acc[c.transacao_id].original    += Number(c.valor)
      acc[c.transacao_id].total       += valorComRendimento
      acc[c.transacao_id].rendimento  += valorComRendimento - Number(c.valor)
      return acc
    }, {})
  }, [caixinhas, cdiAnual])

  // ── Guardar na caixinha ───────────────────────────────────────────────────
  // Agora aceita pctCDI e carencia, salva como JSON na descricao
  const guardar = useCallback(async ({ transacaoId, valor, descricao, pctCDI = 100, carencia = 0 }) => {
    if (!user || !mesRef || !valor || valor <= 0) return { error: 'Valor inválido' }

    // Serializar params CDI na descricao para recuperar depois
    const descricaoJson = JSON.stringify({
      label:    descricao || 'Reserva',
      cdiPct:   pctCDI,
      carencia: carencia,
    })

    // 1. Inserir na tabela caixinhas
    const { error: errCaixinha } = await supabase.from('caixinhas').insert([{
      user_id:      user.id,
      transacao_id: transacaoId,
      valor,
      mes_ref:      mesRef,
      descricao:    descricaoJson,
    }])
    if (errCaixinha) return { error: errCaixinha.message }

    // 2. Lançar como reserva no fluxo de transações
    const hoje = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
    const { error: errReserva } = await supabase.from('transacoes').insert([{
      user_id:         user.id,
      descricao:       descricao || 'Reserva para conta',
      valor,
      tipo:            'reserva',
      categoria:       'Reserva',
      subcategoria:    descricaoJson, // params CDI aqui também
      destino_reserva: 'Caixinha',
      pago:            true,
      data:            hoje,
      data_pagamento:  new Date().toISOString(),
    }])
    if (errReserva) return { error: errReserva.message }

    await fetchData()
    return { ok: true }
  }, [user, mesRef, fetchData])

  // ── Zerar caixinha ao pagar a conta ──────────────────────────────────────
  const zerarCaixinha = useCallback(async (transacaoId) => {
    if (!user || !transacaoId) return
    await supabase
      .from('caixinhas')
      .delete()
      .eq('user_id', user.id)
      .eq('transacao_id', transacaoId)
    await fetchData()
  }, [user, fetchData])

  // ── Resumo geral ──────────────────────────────────────────────────────────
  const resumo = useMemo(() => {
    const contas = Object.values(saldoPorConta)
    return {
      totalOriginal:   contas.reduce((s, c) => s + c.original,   0),
      totalAtual:      contas.reduce((s, c) => s + c.total,      0),
      totalRendimento: contas.reduce((s, c) => s + c.rendimento, 0),
      cdiAnual,
    }
  }, [saldoPorConta, cdiAnual])

  return {
    caixinhas,
    saldoPorConta,  // { [transacaoId]: { total, rendimento, original, pctCDI, carencia } }
    resumo,         // { totalOriginal, totalAtual, totalRendimento, cdiAnual }
    loading,
    guardar,
    zerarCaixinha,
    refresh: fetchData,
  }
}