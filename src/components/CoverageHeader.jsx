import React from 'react'
import { CheckCircle2, Target, AlertCircle } from 'lucide-react'

export const CoverageHeader = ({ rendaNoMes, totalDespesas, totalPago }) => {
  const porcentagemCoberta = totalDespesas > 0 ? (totalPago / totalDespesas) * 100 : 0
  const faltaPagar = totalDespesas - totalPago
  const rendaInsuficiente = rendaNoMes < totalDespesas
  const faltaRenda = totalDespesas - rendaNoMes

  // Lógica de Meta Diária / Status
  const renderMetaStatus = () => {
    if (rendaInsuficiente) {
      return (
        <div className="flex items-center gap-2 text-rose-600">
          <div className="bg-rose-50 p-2 rounded-xl">
            <AlertCircle size={18} className="animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Atenção</p>
            <p className="text-xs font-black">Renda Insuficiente</p>
          </div>
        </div>
      )
    }

    if (totalPago >= totalDespesas && totalDespesas > 0) {
      return (
        <div className="flex items-center gap-2 text-emerald-600">
          <div className="bg-emerald-50 p-2 rounded-xl">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Status</p>
            <p className="text-xs font-black">Meta Batida! 🎉</p>
          </div>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2 text-indigo-600">
        <div className="bg-indigo-50 p-2 rounded-xl">
          <Target size={18} />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Fazer Diariamente</p>
          <p className="text-xs font-black">
            R$ {((totalDespesas - totalPago) / 30).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-indigo-900/20 relative overflow-hidden">
      {/* Barra de Progresso de Fundo */}
      <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gray-100">
        <div 
          className={`h-full transition-all duration-1000 ease-out ${rendaInsuficiente ? 'bg-rose-500' : 'bg-indigo-600'}`}
          style={{ width: `${Math.min(porcentagemCoberta, 100)}%` }}
        />
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-1">Cobertura de Gastos</h4>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-gray-900">
                R$ {rendaNoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-gray-400 text-[10px] font-bold uppercase mt-1">Renda no Mês</p>
          </div>

          <div className="text-right">
            <p className={`text-lg font-black ${rendaInsuficiente ? 'text-rose-600' : 'text-gray-900'}`}>
              R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-gray-400 text-[10px] font-bold uppercase">Alvo Acumulado</p>
          </div>
        </div>

        {/* Linha de Progresso Visual Principal */}
        <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`absolute top-0 left-0 h-full transition-all duration-1000 ${rendaInsuficiente ? 'bg-rose-500' : 'bg-indigo-600'}`}
            style={{ width: `${Math.min(porcentagemCoberta, 100)}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-50 p-2.5 rounded-2xl text-emerald-600">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Já Pago</p>
              <p className="text-sm font-black text-gray-800">
                R$ {totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {renderMetaStatus()}
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-gray-50">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            {porcentagemCoberta.toFixed(0)}% das contas cobertas
          </span>
          
          {rendaInsuficiente ? (
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-500 animate-pulse">
              Faltam R$ {faltaRenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de Renda
            </span>
          ) : (
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
              Faltam R$ {faltaPagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para pagar
            </span>
          )}
        </div>
      </div>
    </div>
  )
}