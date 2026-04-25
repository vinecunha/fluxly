export function calculateCDIProjection(valor: number, dias: number, taxaAnual = 0.1315): number {
  const taxaDiaria = Math.pow(1 + taxaAnual, 1 / 252) - 1
  const diasUteisEstimados = Math.floor((dias / 30) * 21)
  
  return valor * Math.pow(1 + taxaDiaria, diasUteisEstimados)
}