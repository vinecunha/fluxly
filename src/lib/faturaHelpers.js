/**
 * Lógica real de cartão de crédito.
 *
 * Para um dado viewDate (mês sendo visualizado):
 *
 *   Período de GASTOS do ciclo ref:
 *     início = dia (fechamento + 1) do mês anterior ao viewDate
 *     fim    = dia fechamento do viewDate
 *
 *   Pagamentos são atribuídos ao ciclo cujo período de cobrança os contém:
 *     cobrança começa no dia seguinte ao fechamento do viewDate
 *     e vai até o fechamento do mês seguinte
 *
 *   Regra de qual ciclo mostrar no mês X:
 *     - A fatura cujo VENCIMENTO cai no mês X deve aparecer em março
 *     - Vencimento = dia vencimento do viewDate
 */
export function calcFatura(cartao, allTransactions, viewDate) {
  const ref    = viewDate instanceof Date ? viewDate : new Date()
  const anoRef = ref.getFullYear()
  const mesRef = ref.getMonth()

  const diaFech = cartao.fechamento
  const diaVenc = cartao.vencimento

  // Período de GASTOS: fechamento do mês anterior + 1 até fechamento deste mês
  const mesIni = mesRef === 0 ? 11 : mesRef - 1
  const anoIni = mesRef === 0 ? anoRef - 1 : anoRef

  const inicioGastos = new Date(anoIni, mesIni, diaFech + 1, 0, 0, 0)
  const fimGastos    = new Date(anoRef, mesRef, diaFech, 23, 59, 59)

  // Período de COBRANÇA: dia seguinte ao fechamento até fechamento do próximo mês
  const mesCobFim = mesRef === 11 ? 0 : mesRef + 1
  const anoCobFim = mesRef === 11 ? anoRef + 1 : anoRef
  const inicioCob = new Date(anoRef,    mesRef,    diaFech + 1, 0, 0, 0)
  const fimCob    = new Date(anoCobFim, mesCobFim, diaFech,     23, 59, 59)

  // Vencimento cai neste mês
  const venc    = new Date(anoRef, mesRef, diaVenc)
  const vencStr = venc.toLocaleDateString('en-CA')

  // Gastos dentro do período de gastos deste ciclo
  const gastos = (allTransactions || []).filter(t => {
    if (t.cartao_id !== cartao.id || t.tipo === 'pagamento_cartao') return false
    const d = new Date(t.data + 'T12:00:00')
    return d >= inicioGastos && d <= fimGastos
  })

  // Pagamentos dentro do período de cobrança deste ciclo
  // Usa t.data (data do lançamento) para evitar que gastos com data_pagamento
  // no período de cobrança sejam contados erroneamente como pagamentos de fatura
  const pagamentos = (allTransactions || []).filter(t => {
    if (t.cartao_id !== cartao.id || t.tipo !== 'pagamento_cartao') return false
    if (!t.pago) return false
    const d = new Date(t.data + 'T12:00:00')
    return d >= inicioCob && d <= fimCob
  })

  const totalGasto = gastos.reduce((s, t) => s + (Math.abs(Number(t.valor)) || 0), 0)
  const totalPago  = pagamentos.reduce((s, t) => s + (Math.abs(Number(t.valor)) || 0), 0)
  const saldo      = Math.max(totalGasto - totalPago, 0)

  const nomeMes = (d) => d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
  const periodo = `${inicioGastos.getDate()} ${nomeMes(inicioGastos)} – ${fimGastos.getDate()} ${nomeMes(fimGastos)}`
  const pago    = totalGasto > 0 && saldo <= 0

  // Status baseado em hoje vs período de cobrança
  const hoje = new Date(); hoje.setHours(0,0,0,0)
  const status = pago ? 'quitada'
    : hoje >= inicioCob ? 'cobrança'
    : 'aberta'

  return {
    totalGasto, totalPago, saldo,
    qtdGastos: gastos.length,
    periodo, vencStr, pago, status,
    gastos, pagamentos,
    inicioGastos, fimGastos, inicioCob, fimCob, venc,
  }
}

/**
 * Para o BillsList e CartoesScreen:
 * Sempre retorna UMA fatura por cartão — a do mês visualizado.
 * O vencimento cai no próprio mês do viewDate, então em março
 * aparecem as faturas que vencem em março.
 */
export function getFaturasExibicao(cartao, allTransactions, viewDate) {
  const f = calcFatura(cartao, allTransactions, viewDate)
  return [{ ...f, _label: 'Fatura' }]
}