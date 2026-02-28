import React from 'react'

export const FinancialAnalytics = ({ transactions }) => {
  // 1. FILTRO INTELIGENTE:
  // - Ignora rendas
  // - Se for 'gasto_diario', entra direto (pois já aconteceu)
  // - Se for 'fixa' ou 'esporadica', só entra se estiver PAGO
  const expenses = transactions.filter(t => {
    if (t.tipo === 'renda') return false
    if (t.tipo === 'gasto_diario') return true
    return t.pago === true // Fixas e Esporádicas só entram se concluídas
  })

  const groupedData = expenses.reduce((acc, current) => {
    const desc = current.descricao.trim().toLowerCase()
    const valor = Number(current.valor)
    
    if (!acc[desc]) {
      acc[desc] = { 
        label: current.descricao, 
        total: 0, 
        count: 0,
        tipo: current.tipo 
      }
    }
    acc[desc].total += valor
    acc[desc].count += 1
    return acc
  }, {})

  const sortedData = Object.values(groupedData).sort((a, b) => b.total - a.total)
  const totalExpenses = sortedData.reduce((sum, item) => sum + item.total, 0)

  return (
    <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="px-1">
        <div className="flex justify-between items-center">
          <h4 className="text-gray-400 font-black text-[10px] uppercase tracking-[0.2em]">Análise de Gastos Reais</h4>
          <span className="text-[9px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-bold uppercase">Apenas Concluídos</span>
        </div>
        <p className="text-2xl font-black text-gray-800">R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
      </div>

      <div className="space-y-5">
        {sortedData.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-gray-200 text-gray-400 text-xs italic">
            Nenhuma despesa concluída para análise.
          </div>
        ) : (
          sortedData.map((item, index) => {
            const percentage = totalExpenses > 0 ? ((item.total / totalExpenses) * 100).toFixed(1) : 0
            
            return (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-end px-1">
                  <div>
                    <span className="text-sm font-bold text-gray-700 capitalize">{item.label}</span>
                    <span className="text-[10px] text-gray-400 font-bold ml-2 uppercase">({item.count}x)</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-gray-900">R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <p className="text-[10px] text-indigo-500 font-bold">{percentage}%</p>
                  </div>
                </div>
                
                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}