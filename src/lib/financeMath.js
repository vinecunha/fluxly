export function calculateCDIProjection(valor, dias, taxaAnual = 0.1315) {
  // Converte taxa anual para diária (convenção 252 dias úteis)
  const taxaDiaria = Math.pow(1 + taxaAnual, 1 / 252) - 1;
  // Simplificação para dias corridos (aproximadamente 21 dias úteis por mês)
  const diasUteisEstimados = Math.floor((dias / 30) * 21);
  
  return valor * Math.pow(1 + taxaDiaria, diasUteisEstimados);
}