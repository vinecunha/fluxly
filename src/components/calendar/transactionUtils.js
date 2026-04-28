/**
 * Utilitários compartilhados para cálculos de transações
 */

export const getTransactionValue = (transaction, dayType) => {
  const refDate = transaction.data_pagamento 
    ? new Date(transaction.data_pagamento).toLocaleDateString('en-CA') 
    : transaction.data
  
  if (dayType === 'renda' && transaction.tipo === 'renda') {
    return { matches: true, value: Number(transaction.valor) || 0, isEntrada: true }
  }
  
  if (dayType === 'gasto' && 
      transaction.tipo !== 'renda' && 
      transaction.tipo !== 'reserva' && 
      transaction.tipo !== 'pagamento_cartao' && 
      transaction.pago) {
    return { matches: true, value: Math.abs(Number(transaction.valor)) || 0, isEntrada: false }
  }
  
  if (dayType === 'investimento' && transaction.tipo === 'reserva' && Number(transaction.valor) >= 0) {
    return { matches: true, value: Number(transaction.valor) || 0, isEntrada: true }
  }
  
  return { matches: false, value: 0, isEntrada: false }
}

export const calculateDayValue = (transactions, dateStr, dayType) => {
  let total = 0
  let isEntrada = false
  
  transactions.forEach(t => {
    const refDate = t.data_pagamento ? new Date(t.data_pagamento).toLocaleDateString('en-CA') : t.data
    if (refDate === dateStr) {
      const result = getTransactionValue(t, dayType)
      if (result.matches) {
        total += result.value
        if (result.isEntrada) isEntrada = true
      }
    }
  })
  
  return { total, isEntrada }
}

export const calculateAccumulatedValue = (transactions, year, month, dayNumber, dayType) => {
  let total = 0
  
  for (let dia = 1; dia <= dayNumber; dia++) {
    const dataStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
    const result = calculateDayValue(transactions, dataStr, dayType)
    total += result.total
  }
  
  return total
}

export const getStatusInfo = (percentual, isMelhorWhenGasto) => {
  const absPercent = Math.abs(percentual)
  
  if (absPercent < 5) {
    return { text: 'Na média', color: 'text-gray-500', bg: 'bg-gray-100', isNeutral: true }
  }
  
  if (isMelhorWhenGasto) {
    return { text: `${absPercent.toFixed(0)}% melhor`, color: 'text-emerald-600', bg: 'bg-emerald-100', isBetter: true }
  }
  
  return { text: `${absPercent.toFixed(0)}% pior`, color: 'text-rose-600', bg: 'bg-rose-100', isWorse: true }
}

export const getDayCategory = (transaction, dayType) => {
  if (dayType === 'renda') return transaction.subcategoria || transaction.descricao
  if (dayType === 'investimento') return transaction.destino_reserva || 'Outros'
  return transaction.categoria
}
