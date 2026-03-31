import React from 'react'
import { AlertTriangle, Flame, Calendar, CheckCircle2 } from 'lucide-react'

export function AlertPriorityList({ alertas, onQuickPay, isSaving }) {
  // Filtrar apenas alertas de prioridade alta
  const urgentes = alertas.filter(a => a.tipo === 'perigo' || a.tipo === 'atencao').slice(0, 3)
  
  if (urgentes.length === 0) {
    return (
      <div className="bg-emerald-50 rounded-2xl p-4 flex items-center gap-3">
        <CheckCircle2 size={20} className="text-emerald-500" />
        <div>
          <p className="text-[11px] font-black text-emerald-700">Tudo em ordem!</p>
          <p className="text-[9px] text-emerald-600">Nenhum alerta urgente no momento</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">
        ⚠️ Ações urgentes
      </p>
      {urgentes.map((alerta, i) => (
        <div key={i} className={`rounded-2xl p-4 ${
          alerta.tipo === 'perigo' ? 'bg-rose-50 border border-rose-100' : 'bg-amber-50 border border-amber-100'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-xl ${
              alerta.tipo === 'perigo' ? 'bg-rose-100' : 'bg-amber-100'
            }`}>
              {alerta.tipo === 'perigo' ? (
                <Flame size={16} className="text-rose-600" />
              ) : (
                <AlertTriangle size={16} className="text-amber-600" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-black text-gray-800">{alerta.titulo}</p>
              <p className="text-[9px] text-gray-500 mt-0.5">{alerta.texto}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}