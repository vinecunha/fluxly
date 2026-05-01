import { useMemo } from 'react'
import type { Transaction, SaldoProjetado, Alert as AlertType } from '../types'

const getTodayStr = (): string => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })

interface Alerta {
  id: string
  tipo: 'perigo' | 'atencao' | 'info' | 'ok'
  emoji: string
  titulo: string
  texto: string
  prioridade: number
}

export function useAlertas(transactions: Transaction[], saldo: SaldoProjetado | null, currentDate: Date): AlertType[] {
  const todayStr = getTodayStr()

  return useMemo(() => {
    const alertas: Alerta[] = []
    const hoje = new Date(todayStr + 'T12:00:00')
    const viewM = currentDate.getMonth()
    const viewY = currentDate.getFullYear()
    const isThisMonth = hoje.getMonth() === viewM && hoje.getFullYear() === viewY

    const txMes = (transactions || []).filter(t => {
      const d = new Date(t.data + 'T12:00:00')
      return d.getMonth() === viewM && d.getFullYear() === viewY
    })

    const faturasPendentes = (transactions || []).filter(t => {
      if (t.tipo !== 'pagamento_cartao' || t.pago) return false
      const venc = new Date(t.data + 'T12:00:00')
      const dias = Math.ceil((venc.getTime() - hoje.getTime()) / 86400000)
      return dias >= 0 && dias <= 3
    })
    faturasPendentes.forEach(f => {
      const venc = new Date(f.data + 'T12:00:00')
      const dias = Math.ceil((venc.getTime() - hoje.getTime()) / 86400000)
      alertas.push({
        id:       `fatura-${f.id}`,
        tipo:     dias === 0 ? 'perigo' : 'atencao',
        emoji:    '💳',
        titulo:   dias === 0 ? 'Fatura vence hoje!' : `Fatura vence em ${dias}d`,
        texto:    `${f.descricao} — R$ ${Number(f.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        prioridade: 10 - dias,
      })
    })

    const vencidas = (transactions || []).filter(t => {
      if (!['fixa','esporadica'].includes(t.tipo) || t.pago) return false
      const venc = new Date(t.data + 'T12:00:00')
      return venc < hoje
    })
    if (vencidas.length > 0) {
      const total = vencidas.reduce((s, t) => s + (Number(t.valor)||0), 0)
      alertas.push({
        id:         'vencidas',
        tipo:       'perigo',
        emoji:      '⚠️',
        titulo:     `${vencidas.length} conta${vencidas.length>1?'s':''} vencida${vencidas.length>1?'s':''}`,
        texto:      `Total de R$ ${total.toLocaleString('pt-BR',{minimumFractionDigits:2})} em atraso`,
        prioridade: 15,
      })
    }

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

    if (isThisMonth) {
      const mediasCat: Record<string, number[]> = {}
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
          mediasCat[cat].push(Number(t.valor)||0)
        })
      }

      const gastosCat: Record<string, number> = {}
      txMes.filter(t => t.tipo !== 'renda' && t.tipo !== 'reserva' && t.tipo !== 'pagamento_cartao')
           .forEach(t => {
             const cat = t.categoria || 'Outros'
              gastosCat[cat] = (gastosCat[cat]||0) + (Number(t.valor)||0)
           })

      Object.entries(gastosCat).forEach(([cat, gasto]) => {
        const hist = mediasCat[cat]
        if (!hist || hist.length < 2) return
        const media = hist.reduce((s,v)=>s+v,0) / hist.length
        const pct   = media > 0 ? ((gasto - media) / media) * 100 : 0
        if (pct >= 40 && gasto > 50) {
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

    const dividas = (transactions || []).filter(t =>
      t.tipo === 'fixa' &&
      (t.categoria || '').toLowerCase().includes('empr') &&
      !t.pago
    )
    const recIds = [...new Set(dividas.map(t => t.recorrencia_id).filter(Boolean))]
    recIds.forEach(rid => {
      const parcelas = (transactions || []).filter(t => t.recorrencia_id === rid)
      const pagas    = parcelas.filter(t => t.pago)
      const ultima   = pagas.sort((a,b) => new Date(b.data).getTime() - new Date(a.data).getTime())[0]
      if (!ultima) return
      const diasSemPagar = Math.floor((hoje.getTime() - new Date(ultima.data + 'T12:00:00').getTime()) / 86400000)
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

    return alertas.sort((a, b) => b.prioridade - a.prioridade).map(a => ({
      id: a.id,
      titulo: a.titulo,
      descricao: a.texto,
      tipo: a.tipo === 'perigo' ? 'error' : a.tipo === 'atencao' ? 'warning' : a.tipo === 'ok' ? 'success' : 'info'
    }))
  }, [transactions, saldo, currentDate, todayStr])
}