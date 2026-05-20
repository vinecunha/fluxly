import type { Transaction, Cartao } from '@types'

interface FaturaResult {
  totalGasto: number
  totalPago: number
  totalPagoEfetivo: number
  saldo: number
  credito: number
  creditoAnt: number
  qtdGastos: number
  periodo: string
  vencStr: string
  pago: boolean
  status: 'quitada' | 'cobrança' | 'aberta'
  gastos: Transaction[]
  pagamentos: Transaction[]
  inicioGastos: Date
  fimGastos: Date
  inicioCob: Date
  fimCob: Date
  venc: Date
  cicloMes: number
  cicloAno: number
}

function _calcFaturaParaCicloSemCredito(cartao: Cartao, allTransactions: Transaction[], cicloMes: number, cicloAno: number): FaturaResult {
  const diaFech = cartao.dia_fechamento
  const diaVenc = cartao.dia_vencimento

  const mesIniGasto = cicloMes === 0 ? 11 : cicloMes - 1
  const anoIniGasto = cicloMes === 0 ? cicloAno - 1 : cicloAno

  const inicioGastos = new Date(anoIniGasto, mesIniGasto, diaFech,     0,  0,  0)
  const fimGastos    = new Date(cicloAno,    cicloMes,    diaFech - 1, 23, 59, 59)

  const mesCobFim = cicloMes === 11 ? 0  : cicloMes + 1
  const anoCobFim = cicloMes === 11 ? cicloAno + 1 : cicloAno

  const inicioCob = new Date(cicloAno,  cicloMes,  diaFech,     0,  0,  0)
  const fimCob    = new Date(anoCobFim, mesCobFim, diaFech - 1, 23, 59, 59)

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

  const antMes = cicloMes === 0 ? 11 : cicloMes - 1
  const antAno = cicloMes === 0 ? cicloAno - 1 : cicloAno
  const ant    = _calcBase(cartao, allTransactions, antMes, antAno)
  const creditoAnt = ant ? (ant.credito || 0) : 0

  const totalPagoEfetivo = totalPago + creditoAnt
  const saldo  = Math.max(totalGasto - totalPagoEfetivo, 0)
  const creditoFinal = totalPagoEfetivo > totalGasto
    ? Math.round((totalPagoEfetivo - totalGasto) * 100) / 100
    : 0

  const nomeMes = (d: Date) => d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
  const periodo = `${inicioGastos.getDate()} ${nomeMes(inicioGastos)} – ${fimGastos.getDate()} ${nomeMes(fimGastos)}`
  const pago    = totalGasto > 0 && saldo <= 0

  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  const status = pago ? 'quitada' : hoje >= inicioCob ? 'cobrança' : 'aberta'

  return {
    totalGasto, totalPago, totalPagoEfetivo, saldo,
    credito: creditoFinal, creditoAnt,
    qtdGastos: gastos.length,
    periodo, vencStr, pago, status,
    gastos, pagamentos,
    inicioGastos, fimGastos, inicioCob, fimCob, venc,
    cicloMes, cicloAno,
  }
}

function _calcBase(cartao: Cartao, allTransactions: Transaction[], cicloMes: number, cicloAno: number) {
  const diaFech = cartao.dia_fechamento
  const mesIniGasto = cicloMes === 0 ? 11 : cicloMes - 1
  const anoIniGasto = cicloMes === 0 ? cicloAno - 1 : cicloAno
  const inicioGastos = new Date(anoIniGasto, mesIniGasto, diaFech, 0, 0, 0)
  const fimGastos    = new Date(cicloAno, cicloMes, diaFech - 1, 23, 59, 59)
  const mesCobFim    = cicloMes === 11 ? 0 : cicloMes + 1
  const anoCobFim    = cicloMes === 11 ? cicloAno + 1 : cicloAno
  const inicioCob    = new Date(cicloAno, cicloMes, diaFech, 0, 0, 0)
  const fimCob       = new Date(anoCobFim, mesCobFim, diaFech - 1, 23, 59, 59)

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
  const credito    = totalPago > totalGasto
    ? Math.round((totalPago - totalGasto) * 100) / 100
    : 0
  return { totalGasto, totalPago, credito }
}

export function calcFatura(cartao: Cartao, allTransactions: Transaction[], viewDate: Date): FaturaResult {
  const ref    = viewDate instanceof Date ? viewDate : new Date()
  const anoRef = ref.getFullYear()
  const mesRef = ref.getMonth()

  const hoje      = new Date(); hoje.setHours(0, 0, 0, 0)
  const isHojeMes = anoRef === hoje.getFullYear() && mesRef === hoje.getMonth()
  const jáFechou  = isHojeMes && hoje.getDate() >= cartao.dia_fechamento

  let cicloMes, cicloAno
  if (jáFechou) {
    cicloMes = mesRef === 11 ? 0 : mesRef + 1
    cicloAno = mesRef === 11 ? anoRef + 1 : anoRef
  } else {
    cicloMes = mesRef
    cicloAno = anoRef
  }

  return _calcFaturaParaCicloSemCredito(cartao, allTransactions, cicloMes, cicloAno)
}

export function getFaturasExibicao(cartao: Cartao, allTransactions: Transaction[], viewDate: Date): (FaturaResult & { _label: string })[] {
  const ref    = viewDate instanceof Date ? viewDate : new Date()
  const anoRef = ref.getFullYear()
  const mesRef = ref.getMonth()

  const hoje      = new Date(); hoje.setHours(0, 0, 0, 0)
  const isHojeMes = anoRef === hoje.getFullYear() && mesRef === hoje.getMonth()
  const jáFechou  = isHojeMes && hoje.getDate() >= cartao.dia_fechamento

  if (jáFechou && isHojeMes) {
    const fatFechada = _calcFaturaParaCicloSemCredito(cartao, allTransactions, mesRef, anoRef)
    const proxMes = mesRef === 11 ? 0 : mesRef + 1
    const proxAno = mesRef === 11 ? anoRef + 1 : anoRef
    const fatProxima = _calcFaturaParaCicloSemCredito(cartao, allTransactions, proxMes, proxAno)
    return [
      { ...fatFechada, _label: 'Fatura em cobrança' },
      { ...fatProxima, _label: 'Próxima fatura'     },
    ]
  }

  const fat = _calcFaturaParaCicloSemCredito(cartao, allTransactions, mesRef, anoRef)
  const label = fat.status === 'quitada' ? 'Fatura quitada'
    : fat.status === 'cobrança' ? 'Fatura em cobrança'
    : 'Fatura'
  return [{ ...fat, _label: label }]
}