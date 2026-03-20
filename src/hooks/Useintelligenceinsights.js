import { useMemo } from 'react'

export function useIntelligenceInsights(allTransactions = [], currentDate) {
  const ref    = currentDate instanceof Date ? currentDate : new Date()
  const ano    = ref.getFullYear()
  const mes    = ref.getMonth()
  const hoje   = new Date()
  hoje.setHours(0, 0, 0, 0)

  const isCurrentMonth = hoje.getFullYear() === ano && hoje.getMonth() === mes
  const daysInMonth    = new Date(ano, mes + 1, 0).getDate()
  const diaHoje        = isCurrentMonth ? hoje.getDate() : daysInMonth
  const diasRestantes  = isCurrentMonth ? Math.max(daysInMonth - diaHoje, 1) : 1

  const mesAtual = useMemo(() => {
    return allTransactions.filter(t => {
      const d = new Date(t.data + 'T12:00:00')
      return d.getFullYear() === ano && d.getMonth() === mes
    })
  }, [allTransactions, ano, mes])

  const ultimos3Meses = useMemo(() => {
    return allTransactions.filter(t => {
      const d = new Date(t.data + 'T12:00:00')
      const diffMeses = (ano - d.getFullYear()) * 12 + (mes - d.getMonth())
      return diffMeses >= 1 && diffMeses <= 3
    })
  }, [allTransactions, ano, mes])

  // ── Totais do mês ──────────────────────────────────────────────────────────
  const totais = useMemo(() => {
    return mesAtual.reduce((acc, t) => {
      if (t.tipo === 'pagamento_cartao') return acc
      const v = Math.abs(Number(t.valor)) || 0
      if (t.tipo === 'renda')    acc.renda   += v
      if (t.tipo === 'reserva' && Number(t.valor) >= 0) acc.reserva += v
      if (t.tipo !== 'renda' && t.tipo !== 'reserva' && t.tipo !== 'pagamento_cartao') {
        acc.gastosTotal += v
        if (t.tipo === 'gasto_diario' || t.pago) acc.gastosPagos += v
      }
      return acc
    }, { renda: 0, gastosTotal: 0, gastosPagos: 0, reserva: 0 })
  }, [mesAtual])

  const contasPendentes = useMemo(() =>
    mesAtual.filter(t => (t.tipo === 'fixa' || t.tipo === 'esporadica') && !t.pago),
    [mesAtual]
  )
  const totalPendente = contasPendentes.reduce((s, t) => s + (Number(t.valor) || 0), 0)

  // ── Saúde financeira (score 0-100) ─────────────────────────────────────────
  const saude = useMemo(() => {
    const criterios = []

    // 1. Renda cobre despesas totais (25pts)
    const cobertura = totais.gastosTotal > 0 ? totais.renda / totais.gastosTotal : 1
    const ptsCob = cobertura >= 1 ? 25 : Math.round(cobertura * 25)
    criterios.push({ label: 'Renda cobre despesas', pts: ptsCob, max: 25, ok: cobertura >= 1 })

    // 2. Está guardando reserva (20pts)
    const pctReserva = totais.renda > 0 ? totais.reserva / totais.renda : 0
    const ptsRes = Math.min(Math.round(pctReserva * 100), 20)
    criterios.push({ label: 'Guardando reserva', pts: ptsRes, max: 20, ok: pctReserva >= 0.1 })

    // 3. Nenhuma conta urgente pendente (20pts)
    const urgentes = contasPendentes.filter(t => {
      const venc = new Date(t.data + 'T12:00:00')
      venc.setHours(0, 0, 0, 0)
      return Math.ceil((venc - hoje) / 86400000) <= 3
    })
    const ptsUrg = urgentes.length === 0 ? 20 : Math.max(20 - urgentes.length * 7, 0)
    criterios.push({ label: 'Sem contas urgentes', pts: ptsUrg, max: 20, ok: urgentes.length === 0 })

    // 4. Gastos dentro do ritmo (20pts)
    const ritmoEsperado = isCurrentMonth ? (totais.gastosTotal / diaHoje) * daysInMonth : totais.gastosTotal
    const dentroRitmo = totais.renda >= ritmoEsperado * 0.9
    const ptsRitmo = dentroRitmo ? 20 : Math.max(20 - Math.round((ritmoEsperado - totais.renda) / ritmoEsperado * 20), 0)
    criterios.push({ label: 'Gastos no ritmo', pts: ptsRitmo, max: 20, ok: dentroRitmo })

    // 5. Sobra positiva esperada (15pts)
    const sobraEsperada = totais.renda - totais.gastosTotal - totalPendente
    const ptsSobra = sobraEsperada > 0 ? 15 : Math.max(15 + Math.round(sobraEsperada / (totais.renda || 1) * 15), 0)
    criterios.push({ label: 'Sobra prevista positiva', pts: ptsSobra, max: 15, ok: sobraEsperada > 0 })

    const score = criterios.reduce((s, c) => s + c.pts, 0)
    const nivel = score >= 80 ? 'Ótimo' : score >= 60 ? 'Bom' : score >= 40 ? 'Atenção' : 'Crítico'
    const cor   = score >= 80 ? 'emerald' : score >= 60 ? 'blue' : score >= 40 ? 'amber' : 'rose'

    return { score, nivel, cor, criterios }
  }, [totais, contasPendentes, totalPendente, diaHoje, daysInMonth, isCurrentMonth])

  // ── Previsão de fechamento ─────────────────────────────────────────────────
  const previsao = useMemo(() => {
    if (!isCurrentMonth) return null
    const mediaGastoDia = diaHoje > 0 ? totais.gastosPagos / diaHoje : 0
    const gastosProjetados = totais.gastosPagos + (mediaGastoDia * diasRestantes) + totalPendente
    const sobraProjetada = totais.renda - gastosProjetados
    const precisaGanharPorDia = sobraProjetada < 0 ? Math.abs(sobraProjetada) / diasRestantes : 0
    return { gastosProjetados, sobraProjetada, precisaGanharPorDia, mediaGastoDia }
  }, [totais, totalPendente, diaHoje, diasRestantes, isCurrentMonth])

  // ── Quanto posso gastar hoje ───────────────────────────────────────────────
  const gastoLivre = useMemo(() => {
    if (!isCurrentMonth) return null
    const sobraAtual = totais.renda - totais.gastosPagos - totalPendente - totais.reserva
    const porDia     = sobraAtual > 0 ? sobraAtual / diasRestantes : 0
    return { sobraAtual, porDia }
  }, [totais, totalPendente, diasRestantes, isCurrentMonth])

  // ── Alerta de padrão de gastos ────────────────────────────────────────────
  const alertasGastos = useMemo(() => {
    const catAtual = mesAtual.reduce((acc, t) => {
      if (t.tipo === 'gasto_diario' || (t.tipo !== 'renda' && t.tipo !== 'reserva' && t.pago)) {
        const cat = t.categoria || 'Outros'
        acc[cat] = (acc[cat] || 0) + (Math.abs(Number(t.valor)) || 0)
      }
      return acc
    }, {})

    const catHistorico = ultimos3Meses.reduce((acc, t) => {
      if (t.tipo === 'gasto_diario' || (t.tipo !== 'renda' && t.tipo !== 'reserva' && t.pago)) {
        const cat = t.categoria || 'Outros'
        acc[cat] = (acc[cat] || 0) + (Math.abs(Number(t.valor)) || 0)
      }
      return acc
    }, {})

    const alertas = []
    Object.entries(catAtual).forEach(([cat, valor]) => {
      const mediaHistorica = (catHistorico[cat] || 0) / 3
      if (mediaHistorica > 0 && valor > mediaHistorica * 1.3) {
        const pct = Math.round(((valor - mediaHistorica) / mediaHistorica) * 100)
        alertas.push({ cat, valor, mediaHistorica, pct })
      }
      if (totais.renda > 0) {
        const pctRenda = (valor / totais.renda) * 100
        if (pctRenda > 40) {
          alertas.push({ cat, valor, pctRenda: Math.round(pctRenda), tipo: 'pct_renda' })
        }
      }
    })

    return alertas.sort((a, b) => (b.pct || b.pctRenda || 0) - (a.pct || a.pctRenda || 0)).slice(0, 3)
  }, [mesAtual, ultimos3Meses, totais.renda])

  // ── Dias críticos ─────────────────────────────────────────────────────────
  const diasCriticos = useMemo(() => {
    const map = {}
    contasPendentes.forEach(t => {
      const d = new Date(t.data + 'T12:00:00').getDate()
      if (!map[d]) map[d] = { dia: d, total: 0, contas: [] }
      map[d].total += Number(t.valor) || 0
      map[d].contas.push(t.descricao)
    })
    return Object.values(map).sort((a, b) => a.dia - b.dia)
  }, [contasPendentes])

  return {
    saude, previsao, gastoLivre,
    alertasGastos, diasCriticos,
    totais, diaHoje, daysInMonth, diasRestantes,
  }
}