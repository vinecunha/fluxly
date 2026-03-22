import { useMemo } from 'react'

const getTodayStr = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })

/**
 * Gera alertas inteligentes contextuais.
 * Retorna array de alertas ordenados por prioridade.
 *
 * Tipos:
 *  - 'perigo'   → vermelho  (fatura vencendo, projeção negativa, dívida cara)
 *  - 'atencao'  → âmbar     (gasto acima da média, margem apertada)
 *  - 'info'     → azul      (dica, conquista próxima)
 *  - 'ok'       → verde     (mês positivo, meta atingida)
 */
export function useAlertas(transactions, saldo, currentDate) {
  const todayStr = getTodayStr()

  return useMemo(() => {
    const alertas = []
    const hoje = new Date(todayStr + 'T12:00:00')
    const viewM = currentDate.getMonth()
    const viewY = currentDate.getFullYear()
    const isThisMonth = hoje.getMonth() === viewM && hoje.getFullYear() === viewY

    const txMes = (transactions || []).filter(t => {
      const d = new Date(t.data + 'T12:00:00')
      return d.getMonth() === viewM && d.getFullYear() === viewY
    })

    // ── 1. Fatura do cartão vencendo em até 3 dias ────────────────────────────
    const faturasPendentes = (transactions || []).filter(t => {
      if (t.tipo !== 'pagamento_cartao' || t.pago) return false
      const venc = new Date(t.data + 'T12:00:00')
      const dias = Math.ceil((venc - hoje) / 86400000)
      return dias >= 0 && dias <= 3
    })
    faturasPendentes.forEach(f => {
      const venc = new Date(f.data + 'T12:00:00')
      const dias = Math.ceil((venc - hoje) / 86400000)
      alertas.push({
        id:       `fatura-${f.id}`,
        tipo:     dias === 0 ? 'perigo' : 'atencao',
        emoji:    '💳',
        titulo:   dias === 0 ? 'Fatura vence hoje!' : `Fatura vence em ${dias}d`,
        texto:    `${f.descricao} — R$ ${Number(f.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        prioridade: 10 - dias,
      })
    })

    // ── 2. Contas vencidas (fixa/esporadica não pagas) ────────────────────────
    const vencidas = (transactions || []).filter(t => {
      if (!['fixa','esporadica'].includes(t.tipo) || t.pago) return false
      const venc = new Date(t.data + 'T12:00:00')
      return venc < hoje
    })
    if (vencidas.length > 0) {
      const total = vencidas.reduce((s, t) => s + (parseFloat(t.valor)||0), 0)
      alertas.push({
        id:         'vencidas',
        tipo:       'perigo',
        emoji:      '⚠️',
        titulo:     `${vencidas.length} conta${vencidas.length>1?'s':''} vencida${vencidas.length>1?'s':''}`,
        texto:      `Total de R$ ${total.toLocaleString('pt-BR',{minimumFractionDigits:2})} em atraso`,
        prioridade: 15,
      })
    }

    // ── 3. Projeção negativa ──────────────────────────────────────────────────
    if (isThisMonth && saldo?.saldoProjetado != null && saldo.saldoProjetado < 0) {
      alertas.push({
        id:         'projecao-negativa',
        tipo:       'perigo',
        emoji:      '📉',
        titulo:     'Projeção negativa',
        texto:      `Você vai fechar o mês com -R$ ${Math.abs(saldo.saldoProjetado).toLocaleString('pt-BR',{minimumFractionDigits:2})}. Revise os gastos pendentes.`,
        prioridade: 12,
      })
    } else if (isThisMonth && saldo?.saldoProjetado != null && saldo.saldoProjetado < 300) {
      alertas.push({
        id:         'margem-apertada',
        tipo:       'atencao',
        emoji:      '⚡',
        titulo:     'Margem apertada',
        texto:      `Você vai fechar o mês com apenas R$ ${saldo.saldoProjetado.toLocaleString('pt-BR',{minimumFractionDigits:2})}.`,
        prioridade: 8,
      })
    }

    // ── 4. Categoria acima da média ───────────────────────────────────────────
    if (isThisMonth) {
      // Construir médias dos últimos 3 meses por categoria
      const mediasCat = {}
      for (let i = 1; i <= 3; i++) {
        const m = new Date(viewY, viewM - i, 1)
        const txAnt = (transactions || []).filter(t => {
          const d = new Date(t.data + 'T12:00:00')
          return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear()
            && t.tipo !== 'renda' && t.tipo !== 'reserva' && t.tipo !== 'pagamento_cartao'
        })
        txAnt.forEach(t => {
          const cat = t.categoria || 'Outros'
          if (!mediasCat[cat]) mediasCat[cat] = []
          mediasCat[cat].push(parseFloat(t.valor)||0)
        })
      }

      // Gastos do mês atual por categoria
      const gastosCat = {}
      txMes.filter(t => t.tipo !== 'renda' && t.tipo !== 'reserva' && t.tipo !== 'pagamento_cartao')
           .forEach(t => {
             const cat = t.categoria || 'Outros'
             gastosCat[cat] = (gastosCat[cat]||0) + (parseFloat(t.valor)||0)
           })

      Object.entries(gastosCat).forEach(([cat, gasto]) => {
        const hist = mediasCat[cat]
        if (!hist || hist.length < 2) return
        const media = hist.reduce((s,v)=>s+v,0) / hist.length
        const pct   = media > 0 ? ((gasto - media) / media) * 100 : 0
        if (pct >= 40 && gasto > 50) { // acima 40% da média e valor relevante
          alertas.push({
            id:         `cat-alta-${cat}`,
            tipo:       'atencao',
            emoji:      '📊',
            titulo:     `${cat} acima da média`,
            texto:      `R$ ${gasto.toLocaleString('pt-BR',{minimumFractionDigits:0})} este mês (+${pct.toFixed(0)}% vs média de R$ ${media.toLocaleString('pt-BR',{minimumFractionDigits:0})})`,
            prioridade: 5,
          })
        }
      })
    }

    // ── 5. Mês positivo ───────────────────────────────────────────────────────
    if (isThisMonth && saldo?.saldoProjetado != null && saldo.saldoProjetado >= 500) {
      alertas.push({
        id:         'mes-positivo',
        tipo:       'ok',
        emoji:      '🎯',
        titulo:     'Mês no azul!',
        texto:      `Projeção de R$ ${saldo.saldoProjetado.toLocaleString('pt-BR',{minimumFractionDigits:2})} positivo até o fim do mês.`,
        prioridade: 1,
      })
    }

    // ── 6. Dívida com juros altos sem pagamento recente ───────────────────────
    const dividas = (transactions || []).filter(t =>
      t.tipo === 'fixa' &&
      (t.categoria || '').toLowerCase().includes('empr') &&
      !t.pago
    )
    // Agrupar por recorrencia_id e ver se alguma está sem pagamento há mais de 35 dias
    const recIds = [...new Set(dividas.map(t => t.recorrencia_id).filter(Boolean))]
    recIds.forEach(rid => {
      const parcelas = (transactions || []).filter(t => t.recorrencia_id === rid)
      const pagas    = parcelas.filter(t => t.pago)
      const ultima   = pagas.sort((a,b) => new Date(b.data) - new Date(a.data))[0]
      if (!ultima) return
      const diasSemPagar = Math.floor((hoje - new Date(ultima.data + 'T12:00:00')) / 86400000)
      if (diasSemPagar > 40) {
        const desc = dividas.find(t => t.recorrencia_id === rid)?.descricao || 'Empréstimo'
        alertas.push({
          id:         `divida-${rid}`,
          tipo:       'atencao',
          emoji:      '🏦',
          titulo:     `${desc} sem pagamento`,
          texto:      `Último pagamento há ${diasSemPagar} dias. Verifique se está em dia.`,
          prioridade: 7,
        })
      }
    })

    // Ordenar por prioridade (maior = mais urgente)
    return alertas.sort((a, b) => b.prioridade - a.prioridade)
  }, [transactions, saldo, currentDate, todayStr])
}