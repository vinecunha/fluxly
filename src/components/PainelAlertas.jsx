import React, { useState } from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X, ChevronDown, ChevronUp } from 'lucide-react'

const TIPO_CONFIG = {
  perigo:  { bg: 'bg-rose-50',   border: 'border-rose-100',  text: 'text-rose-700',   dot: 'bg-rose-500',   Icon: AlertCircle  },
  atencao: { bg: 'bg-amber-50',  border: 'border-amber-100', text: 'text-amber-700',  dot: 'bg-amber-400',  Icon: AlertTriangle },
  info:    { bg: 'bg-blue-50',   border: 'border-blue-100',  text: 'text-blue-700',   dot: 'bg-blue-400',   Icon: Info         },
  ok:      { bg: 'bg-emerald-50',border: 'border-emerald-100',text:'text-emerald-700',dot: 'bg-emerald-500', Icon: CheckCircle2  },
}

/**
 * PainelAlertas — substitui AlertBanner + AlertsSection
 *
 * Props:
 *   alertas   — array do useAlertas
 *   overdueCount, todayCount — para compatibilidade com AlertBanner
 */
export function PainelAlertas({ alertas = [], overdueCount = 0, todayCount = 0 }) {
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState(new Set())

  const visiveis = alertas.filter(a => !dismissed.has(a.id))
  const perigos  = visiveis.filter(a => a.tipo === 'perigo').length
  const atencoes = visiveis.filter(a => a.tipo === 'atencao').length

  const dismiss = (id, e) => {
    e.stopPropagation()
    setDismissed(prev => new Set([...prev, id]))
  }

  // Sem alertas relevantes
  if (visiveis.length === 0) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-2xl">
        <div className="w-7 h-7 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 size={14} className="text-emerald-600" />
        </div>
        <p className="text-[11px] font-black text-emerald-700 uppercase tracking-wide">Tudo em ordem por enquanto</p>
      </div>
    )
  }

  // Banner colapsado
  const bannerBg    = perigos > 0 ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'
  const bannerText  = perigos > 0 ? 'text-rose-700' : 'text-amber-700'
  const bannerDot   = perigos > 0 ? 'bg-rose-500' : 'bg-amber-400'

  return (
    <div className="space-y-2">
      {/* Header clicável */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all active:scale-[0.98] ${bannerBg}`}
        style={{ minHeight: 52 }}
      >
        {/* Dot pulsante */}
        <div className="relative flex-shrink-0">
          <div className={`w-2.5 h-2.5 rounded-full ${bannerDot}`} />
          {perigos > 0 && (
            <div className={`absolute inset-0 rounded-full ${bannerDot} animate-ping opacity-60`} />
          )}
        </div>

        <div className="flex-1 text-left min-w-0">
          <p className={`text-[11px] font-black uppercase tracking-wide ${bannerText}`}>
            {perigos > 0 && `${perigos} alerta${perigos>1?'s':''} urgente${perigos>1?'s':''}`}
            {perigos > 0 && atencoes > 0 && ' · '}
            {atencoes > 0 && `${atencoes} atenção`}
          </p>
          {!open && (
            <p className="text-[9px] font-bold text-gray-400 truncate mt-0.5">
              {visiveis[0]?.titulo}
            </p>
          )}
        </div>

        <div className={`flex items-center gap-1 text-[9px] font-black uppercase px-2.5 py-1.5 rounded-xl ${
          perigos > 0 ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
        }`}>
          {open ? 'Fechar' : 'Ver'}
          {open ? <ChevronUp size={10}/> : <ChevronDown size={10}/>}
        </div>
      </button>

      {/* Lista expandida */}
      {open && (
        <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
          {visiveis.map(alerta => {
            const cfg = TIPO_CONFIG[alerta.tipo] || TIPO_CONFIG.info
            const { Icon } = cfg
            return (
              <div key={alerta.id}
                className={`flex items-start gap-3 px-4 py-3 rounded-2xl border ${cfg.bg} ${cfg.border}`}>
                {/* Ícone */}
                <div className="flex-shrink-0 mt-0.5">
                  <span className="text-base leading-none">{alerta.emoji}</span>
                </div>

                {/* Texto */}
                <div className="flex-1 min-w-0">
                  <p className={`text-[11px] font-black ${cfg.text} leading-snug`}>
                    {alerta.titulo}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">
                    {alerta.texto}
                  </p>
                </div>

                {/* Dismiss */}
                <button
                  onClick={e => dismiss(alerta.id, e)}
                  className="flex-shrink-0 p-1 rounded-lg text-gray-300 hover:text-gray-500 active:scale-90 transition-all mt-0.5"
                  style={{ minHeight: 28, minWidth: 28 }}>
                  <X size={12} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}