/**
 * Lógica real de cartão de crédito Itaú (e maioria dos bancos BR).
 *
 * O fechamento marca o FIM do ciclo anterior e o INÍCIO do novo:
 *   - Compras feitas NO dia do fechamento já entram na PRÓXIMA fatura
 *   - Período de gastos: do dia do fechamento (inclusive) do mês anterior
 *                        até o dia anterior ao fechamento do mês atual
 *
 * Fechamento = 8, Vencimento = 15:
 *   Fatura março:
 *     gastos:   08/fev (inclusive) → 07/mar (inclusive)
 *     vence:    15/mar
 *     cobrança: 08/mar → 07/abr
 *
 *   Fatura abril:
 *     gastos:   08/mar (inclusive) → 07/abr (inclusive)
 *     vence:    15/abr
 *     cobrança: 08/abr → 07/mai
 *
 * Qual ciclo mostrar para um viewDate:
 *   - Se hoje >= fechamento no mês atual → ciclo do PRÓXIMO mês (fatura aberta acumulando)
 *   - Caso contrário → ciclo do mês visualizado
 */

function calcFaturaParaCiclo(cartao, allTransactions, cicloMes, cicloAno) {
  const diaFech = cartao.fechamento
  const diaVenc = cartao.vencimento

  // Período de GASTOS:
  //   início = dia fechamento do mês anterior (inclusive)
  //   fim    = dia (fechamento - 1) do mês atual (inclusive)
  const mesIniGasto = cicloMes === 0 ? 11 : cicloMes - 1
  const anoIniGasto = cicloMes === 0 ? cicloAno - 1 : cicloAno

  const inicioGastos = new Date(anoIniGasto, mesIniGasto, diaFech,     0,  0,  0)
  const fimGastos    = new Date(cicloAno,    cicloMes,    diaFech - 1, 23, 59, 59)

  // Período de COBRANÇA:
  //   início = dia fechamento do ciclo atual (quando a fatura fecha e entra em cobrança)
  //   fim    = dia (fechamento - 1) do próximo mês (inclusive)
  const mesCobFim = cicloMes === 11 ? 0  : cicloMes + 1
  const anoCobFim = cicloMes === 11 ? cicloAno + 1 : cicloAno

  const inicioCob = new Date(cicloAno,  cicloMes,  diaFech,     0,  0,  0)
  const fimCob    = new Date(anoCobFim, mesCobFim, diaFech - 1, 23, 59, 59)

  // Vencimento
  const venc    = new Date(cicloAno, cicloMes, diaVenc)
  const vencStr = venc.toLocaleDateString('en-CA')

  const gastos = (allTransactions || []).filter(t => {
    if (t.cartao_id !== cartao.id || t.tipo === 'pagamento_cartao') return false
    const d = new Date(t.data + 'T12:00:00')
    return d >= inicioGastos && d <= fimGastos
  })

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

  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  const status = pago           ? 'quitada'
    : hoje >= inicioCob         ? 'cobrança'
    : 'aberta'

  return {
    totalGasto, totalPago, saldo,
    qtdGastos: gastos.length,
    periodo, vencStr, pago, status,
    gastos, pagamentos,
    inicioGastos, fimGastos, inicioCob, fimCob, venc,
    cicloMes, cicloAno,
  }
}

export function calcFatura(cartao, allTransactions, viewDate) {
  const ref    = viewDate instanceof Date ? viewDate : new Date()
  const anoRef = ref.getFullYear()
  const mesRef = ref.getMonth()

  const hoje      = new Date(); hoje.setHours(0, 0, 0, 0)
  const isHojeMes = anoRef === hoje.getFullYear() && mesRef === hoje.getMonth()
  const jáFechou  = isHojeMes && hoje.getDate() >= cartao.fechamento

  let cicloMes, cicloAno
  if (jáFechou) {
    cicloMes = mesRef === 11 ? 0 : mesRef + 1
    cicloAno = mesRef === 11 ? anoRef + 1 : anoRef
  } else {
    cicloMes = mesRef
    cicloAno = anoRef
  }

  return calcFaturaParaCiclo(cartao, allTransactions, cicloMes, cicloAno)
}

export function getFaturasExibicao(cartao, allTransactions, viewDate) {
  const ref    = viewDate instanceof Date ? viewDate : new Date()
  const anoRef = ref.getFullYear()
  const mesRef = ref.getMonth()

  const hoje      = new Date(); hoje.setHours(0, 0, 0, 0)
  const isHojeMes = anoRef === hoje.getFullYear() && mesRef === hoje.getMonth()
  const jáFechou  = isHojeMes && hoje.getDate() >= cartao.fechamento

  if (jáFechou) {
    // Fatura que fechou hoje/passou: ciclo atual
    const fatFechada = calcFaturaParaCiclo(cartao, allTransactions, mesRef, anoRef)
    // Próxima: ciclo do mês seguinte
    const proxMes = mesRef === 11 ? 0 : mesRef + 1
    const proxAno = mesRef === 11 ? anoRef + 1 : anoRef
    const fatProxima = calcFaturaParaCiclo(cartao, allTransactions, proxMes, proxAno)
    return [
      { ...fatFechada,  _label: 'Fatura em cobrança' },
      { ...fatProxima,  _label: 'Próxima fatura'     },
    ]
  }

  const fat = calcFaturaParaCiclo(cartao, allTransactions, mesRef, anoRef)
  return [{ ...fat, _label: 'Fatura' }]
}