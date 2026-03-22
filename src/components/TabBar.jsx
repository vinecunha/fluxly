import { LayoutDashboard, BarChart3, ReceiptText, Plus, CreditCard, Brain, TrendingUp, TrendingDown, PiggyBank, Zap } from 'lucide-react'
import { TABS } from '../lib/constants'
import { useMemo } from 'react'

// ─── FAB inteligente ─────────────────────────────────────────────────────────
// Detecta contexto e sugere o tipo mais provável de lançamento
function useSmartFAB(activeTab, transactions = []) {
  return useMemo(() => {
    const hora = new Date().getHours()
    const diaSemana = new Date().getDay() // 0=dom, 6=sab

    // Contexto por tab
    if (activeTab === TABS.CARTOES) {
      return { tipo: 'pagamento_cartao', label: 'Pagar fatura', emoji: '💳', cor: '#6366f1' }
    }
    if (activeTab === TABS.ANALYTICS || activeTab === TABS.INTELLIGENCE) {
      return { tipo: 'renda', label: 'Registrar renda', emoji: '💰', cor: '#10b981' }
    }

    // Horário: manhã cedo → combustível (motoristas de app)
    if (hora >= 5 && hora < 9) {
      return { tipo: 'gasto_diario', label: 'Combustível', emoji: '⛽', cor: '#ef4444',
               prefill: { categoria: 'Combustível', descricao: 'GNV' } }
    }

    // Horário: fim do dia → renda (saques de app)
    if (hora >= 20 || hora < 5) {
      // Checar se tem padrão de renda no histórico recente
      const recentes = (transactions || [])
        .filter(t => {
          const d = new Date(t.data + 'T12:00:00')
          return (new Date() - d) < 7 * 24 * 60 * 60 * 1000
        })
      const temRendaRecente = recentes.some(t => t.tipo === 'renda')
      if (temRendaRecente) {
        return { tipo: 'renda', label: 'Registrar ganho', emoji: '💰', cor: '#10b981' }
      }
    }

    // Meio-dia / almoço → delivery/restaurante
    if (hora >= 11 && hora < 14) {
      return { tipo: 'gasto_diario', label: 'Almoço', emoji: '🍔', cor: '#f59e0b',
               prefill: { categoria: 'Delivery' } }
    }

    // Fim de semana → mercado/compras
    if (diaSemana === 0 || diaSemana === 6) {
      return { tipo: 'gasto_diario', label: 'Compras', emoji: '🛒', cor: '#ef4444',
               prefill: { categoria: 'Mercado' } }
    }

    // Padrão: mais usado pelo usuário nos últimos 30 dias
    const contagem = {}
    ;(transactions || []).forEach(t => {
      if (!['renda','reserva','pagamento_cartao'].includes(t.tipo)) {
        const cat = t.categoria || 'Outros'
        contagem[cat] = (contagem[cat] || 0) + 1
      }
    })
    const maisUsada = Object.entries(contagem).sort((a,b) => b[1]-a[1])[0]?.[0]

    if (maisUsada === 'Combustível') {
      return { tipo: 'gasto_diario', label: 'Combustível', emoji: '⛽', cor: '#ef4444',
               prefill: { categoria: 'Combustível' } }
    }

    // Default
    return { tipo: 'renda', label: 'Novo registro', emoji: '✨', cor: '#1e293b' }
  }, [activeTab, transactions])
}

const NAV_TABS = [
  { id: TABS.DASHBOARD,    label: 'Início',  Icon: LayoutDashboard },
  { id: TABS.BILLS,        label: 'Contas',  Icon: ReceiptText      },
  { id: TABS.ANALYTICS,    label: 'Análise', Icon: BarChart3        },
  { id: TABS.CARTOES,      label: 'Cartões', Icon: CreditCard       },
  { id: TABS.INTELLIGENCE, label: 'IA',      Icon: Brain            },
]

export function TabBar({ activeTab, onChangeTab }) {
  return (
    <div className="flex bg-gray-200/50 p-1 rounded-2xl relative z-10 backdrop-blur-md gap-1">
      {NAV_TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          onClick={() => onChangeTab(id)}
          className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-2xl text-[9px] font-black uppercase transition-all whitespace-nowrap ${
            activeTab === id
              ? 'bg-white  shadow-sm text-slate-700 ring-1 ring-black/5'
              : 'text-gray-500  hover:text-gray-700'
          }`}
        >
          <Icon size={14} className="flex-shrink-0" />
          <span className="tracking-tight hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}

export function BottomNav({ activeTab, onChangeTab, onAddNew, transactions = [] }) {
  const smart = useSmartFAB(activeTab, transactions)

  const handleFAB = () => {
    // Passa o prefill para o modal via callback
    onAddNew(smart.prefill ? { tipo: smart.tipo, ...smart.prefill } : { tipo: smart.tipo })
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white /90 backdrop-blur-md border-t border-gray-100  shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
      <div className="grid grid-cols-5 items-end w-full max-w-2xl mx-auto">

        <NavButton label="Início"  Icon={LayoutDashboard} active={activeTab === TABS.DASHBOARD}   onClick={() => onChangeTab(TABS.DASHBOARD)} />
        <NavButton label="Contas"  Icon={ReceiptText}     active={activeTab === TABS.BILLS}       onClick={() => onChangeTab(TABS.BILLS)} />

        {/* FAB inteligente */}
        <div className="flex flex-col items-center pb-2">
          <button
            onClick={handleFAB}
            className="w-14 h-14 -mt-5 rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-all border-4 border-white  relative group"
            style={{ backgroundColor: smart.cor }}
          >
            <span className="text-xl">{smart.emoji}</span>
            {/* Tooltip com sugestão */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] font-black px-2.5 py-1.5 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 shadow-lg">
              {smart.label}
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"/>
            </div>
          </button>
          <span className="text-[8px] font-black uppercase tracking-wide mt-1" style={{ color: smart.cor }}>
            {smart.label.split(' ')[0]}
          </span>
        </div>

        <NavButton label="Análise" Icon={BarChart3} active={activeTab === TABS.ANALYTICS}   onClick={() => onChangeTab(TABS.ANALYTICS)} />
        <NavButton label="IA"      Icon={Brain}     active={activeTab === TABS.INTELLIGENCE} onClick={() => onChangeTab(TABS.INTELLIGENCE)} />
      </div>
    </nav>
  )
}

function NavButton({ label, Icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center w-full py-2 transition-all active:scale-90 ${
        active ? 'text-slate-700' : 'text-gray-400 '
      }`}
    >
      <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
      <span className={`text-[9px] font-black uppercase tracking-wide mt-0.5 ${active ? 'text-slate-700' : 'text-gray-400 '}`}>
        {label}
      </span>
    </button>
  )
}