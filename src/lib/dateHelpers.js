export function getTodayString() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

export function getWeekRange(todayStr) {
  const hojeRef = new Date(todayStr + 'T12:00:00')
  const diaSemana = hojeRef.getDay()
  const diffSegunda = hojeRef.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1)
  const segundaFeira = new Date(hojeRef.getFullYear(), hojeRef.getMonth(), diffSegunda, 0, 0, 0)
  const domingo = new Date(segundaFeira)
  domingo.setDate(segundaFeira.getDate() + 6)
  domingo.setHours(23, 59, 59, 999)
  return { segundaFeira, domingo }
}

export function isInMonth(dateStr, paymentDateStr, viewMonth, viewYear) {
  const tDate = new Date(dateStr + 'T12:00:00')
  const pDate = paymentDateStr ? new Date(paymentDateStr) : null
  const isDueThisMonth = tDate.getMonth() === viewMonth && tDate.getFullYear() === viewYear
  const isPaidThisMonth = pDate && pDate.getMonth() === viewMonth && pDate.getFullYear() === viewYear
  return isDueThisMonth || isPaidThisMonth
}
