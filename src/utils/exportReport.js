import { saveAs } from 'file-saver'

const fmt = (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

export function exportToCSV(transactions, currentDate) {
  const mes = currentDate.getMonth() + 1
  const ano = currentDate.getFullYear()

  const headers = ['Data', 'Descrição', 'Tipo', 'Categoria', 'Valor', 'Pago']
  const rows = transactions.map(t => [
    t.data,
    t.descricao,
    t.tipo,
    t.categoria,
    Number(t.valor).toFixed(2),
    t.pago ? 'Sim' : 'Não'
  ])

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  saveAs(blob, `fluxly-${ano}-${String(mes).padStart(2, '0')}.csv`)
}

export async function exportToPDF(transactions, currentDate) {
  // Placeholder - implementar com jspdf se necessário
  console.log('PDF export ainda não implementado')
  alert('Exportação PDF em desenvolvimento')
}