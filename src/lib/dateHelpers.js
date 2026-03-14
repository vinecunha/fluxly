export function getTodayString() {
  const agora = new Date();
  const offset = agora.getTimezoneOffset() * 60000;
  return new Date(agora - offset).toISOString().split('T')[0];
}

export function getWeekRange(referenceDateStr) {
  const date = new Date(referenceDateStr + 'T12:00:00');
  const day = date.getDay(); 
  
  const diffToMonday = day === 0 ? -6 : 1 - day;
  
  const segunda = new Date(date);
  segunda.setDate(date.getDate() + diffToMonday);
  segunda.setHours(0, 0, 0, 0);

  const domingo = new Date(segunda);
  domingo.setDate(segunda.getDate() + 6);
  domingo.setHours(23, 59, 59, 999); 

  return { segundaFeira: segunda, domingo: domingo };
}

export function isInMonth(dateStr, paymentDateStr, viewMonth, viewYear) {
  const tDate = new Date(dateStr + 'T12:00:00')
  const pDate = paymentDateStr ? new Date(paymentDateStr) : null
  const isDueThisMonth = tDate.getMonth() === viewMonth && tDate.getFullYear() === viewYear
  const isPaidThisMonth = pDate && pDate.getMonth() === viewMonth && pDate.getFullYear() === viewYear
  return isDueThisMonth || isPaidThisMonth
}
