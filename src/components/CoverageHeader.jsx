import React from 'react'
import { CheckCircle2, Target, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react'

export const CoverageHeader = ({ rendaNoMes, totalDespesas, totalPago }) => {
  const porcentagemRenda = totalDespesas > 0 ? (rendaNoMes / totalDespesas) * 100 : 0
  const porcentagemPaga = totalDespesas > 0 ? (totalPago / totalDespesas) * 100 : 0
  const rendaInsuficiente = rendaNoMes < totalDespesas

  const today = new Date()
  const currentDay = today.getDate()
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const progressoIdealPercent = (currentDay / daysInMonth) * 100
  const valorIdealAteHoje = (totalDespesas / daysInMonth) * currentDay
  
  const statusRenda = rendaNoMes >= valorIdealAteHoje ? 'positive' : 'negative'

  const renderMetaStatus = () => {
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

    const metaDiaria = (totalDespesas - rendaNoMes) / (daysInMonth - currentDay + 1)

    return (
      <div className="flex items-center gap-2 text-indigo-600">
        <div className="bg-indigo-50 p-2 rounded-xl">
          <Target size={18} />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Meta Diária Restante</p>
          <p className="text-xs font-black">
            R$ {Math.max(0, metaDiaria).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-indigo-900/20 relative overflow-hidden">
      <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gray-100">
        <div 
          className="h-full bg-emerald-400 transition-all duration-1000 ease-out opacity-30"
          style={{ width: `${Math.min(porcentagemPaga, 100)}%` }}
        />
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-1">Renda vs Alvo</h4>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-gray-900">
                R$ {rendaNoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1">
                {statusRenda === 'positive' ? (
                    <span className="flex items-center gap-1 text-emerald-500 font-black text-[9px] uppercase bg-emerald-50 px-2 py-0.5 rounded-full">
                        <TrendingUp size={10} /> No caminho certo!
                    </span>
                ) : (
                    <span className="flex items-center gap-1 text-amber-500 font-black text-[9px] uppercase bg-amber-50 px-2 py-0.5 rounded-full animate-pulse">
                        <TrendingDown size={10} /> Acelere o passo
                    </span>
                )}
            </div>
          </div>
          <div className="text-right">
            <p className={`text-lg font-black ${rendaInsuficiente ? 'text-rose-600' : 'text-gray-900'}`}>
              R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-gray-400 text-[10px] font-bold uppercase text-[8px]">Ideal até hoje: R$ {valorIdealAteHoje.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
          </div>
        </div>

        <div className="relative h-4 bg-gray-100 rounded-full my-2">
          <div 
            className={`absolute top-0 left-0 h-full transition-all duration-1000 rounded-full z-10 ${statusRenda === 'positive' ? 'bg-indigo-600' : 'bg-amber-500'}`}
            style={{ width: `${Math.min(porcentagemRenda, 100)}%` }}
          />
          
          <div 
            className="absolute top-[-6px] bottom-[-6px] w-1 bg-gray-900 z-20 shadow-sm"
            style={{ left: `${progressoIdealPercent}%` }}
          >
              <div className="absolute top-[-14px] left-1/2 -translate-x-1/2 text-[7px] font-black bg-gray-900 text-white px-1.5 py-0.5 rounded-sm whitespace-nowrap">
                  DIA {currentDay}
              </div>
          </div>
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
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                Progresso: {porcentagemRenda.toFixed(0)}%
            </span>
            <span className="text-[8px] font-bold text-gray-300">IDEAL PARA HOJE: {progressoIdealPercent.toFixed(0)}%</span>
          </div>
          
          {rendaNoMes < valorIdealAteHoje ? (
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 animate-pulse bg-amber-50 px-3 py-1 rounded-lg border border-amber-100">
               Faltam R$ {(valorIdealAteHoje - rendaNoMes).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para o ritmo
            </span>
          ) : (
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
              Você superou o ritmo! 🎉
            </span>
          )}
        </div>
      </div>
    </div>
  )
}