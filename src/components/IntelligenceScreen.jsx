import React, { useState, useMemo } from 'react'
import {
  Brain, CheckCircle2, AlertTriangle, Wallet,
  TrendingUp, CircleDollarSign, Zap, RefreshCw,
  PiggyBank, ChevronDown, ChevronUp, Flame
} from 'lucide-react'
import { useIntelligence } from '../hooks/useIntelligence'
import { useCaixinhas } from '../hooks/useCaixinhas'
import { categoryIcons } from '../lib/categories'

const fmt     = (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
const fmtK    = (v) => {
  if (v >= 1000) return `R$${(v / 1000).toFixed(1)}k`
  return `R$${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

function UrgencyBadge({ dias }) {
  if (dias <= 0)  return <span className="text-[7px] font-black bg-rose-600 text-white px-1.5 py-0.5 rounded-full uppercase flex items-center gap-0.5"><Flame size={8}/> Hoje</span>
  if (dias === 1) return <span className="text-[7px] font-black bg-rose-500 text-white px-1.5 py-0.5 rounded-full uppercase">Amanhã</span>
  if (dias <= 3)  return <span className="text-[7px] font-black bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full uppercase">{dias}d</span>
  if (dias <= 7)  return <span className="text-[7px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full uppercase">{dias}d</span>
  return <span className="text-[7px] font-black bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full uppercase">{dias}d</span>
}

function ContaCard({ conta, onGuardar, saving }) {
  const [expanded, setExpanded]     = useState(false)
  const [modo, setModo]             = useState('diario')
  const [valorCustom, setValorCustom] = useState('')

  const catInfo   = categoryIcons[conta.categoria] || { icon: null, color: 'bg-gray-100 text-gray-500' }
  const pctGuardado = conta.valor > 0 ? Math.min((conta.guardado / conta.valor) * 100, 100) : 0
  const pctAlocar   = conta.alocar && conta.valor > 0 ? Math.min((conta.alocar / conta.valor) * 100, 100) : 0

  const valorSugerido = modo === 'completar'
    ? conta.falta
    : modo === 'diario'
    ? conta.porDia
    : parseFloat(String(valorCustom).replace(',', '.')) || 0

  const handleGuardar = () => {
    const v = parseFloat(String(
      modo === 'custom' ? valorCustom : valorSugerido.toFixed(2)
    ).replace(',', '.'))
    if (!v || v <= 0) return
    onGuardar({ transacaoId: conta.id, valor: v, descricao: conta.descricao })
    setExpanded(false)
  }

  const borderColor = conta.coberta
    ? 'border-emerald-100'
    : conta.urgente
    ? 'border-rose-200'
    : conta.quaseVence
    ? 'border-amber-100'
    : 'border-gray-100'

  return (
    <div className={`bg-white rounded-2xl border shadow-sm ${borderColor}`}>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${catInfo.color}`}>
              {catInfo.icon || <PiggyBank size={14} />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-[13px] font-bold text-gray-800 truncate">{conta.descricao}</p>
                <UrgencyBadge dias={conta.diasAteVencimento} />
              </div>
              <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">
                {conta.diasAteVencimento <= 0
                  ? 'Vence hoje'
                  : conta.diasAteVencimento === 1
                  ? 'Vence amanhã'
                  : `Vence em ${conta.diasAteVencimento} dias`
                }
                {' · '}{conta.categoria || 'Geral'}
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs font-black text-gray-800">{fmt(conta.valor)}</p>
            {conta.coberta
              ? <p className="text-[9px] font-black text-emerald-600">✓ Coberta</p>
              : conta.deficit > 0
              ? <p className="text-[9px] font-black text-rose-500">-{fmtK(conta.deficit)}</p>
              : null
            }
          </div>
        </div>

        <div className="space-y-1.5 mb-3">
          <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full flex rounded-full overflow-hidden">
              {pctGuardado > 0 && (
                <div className="h-full bg-blue-400 transition-all duration-700" style={{ width: `${pctGuardado}%` }} />
              )}
              {pctAlocar > 0 && (
                <div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: `${Math.min(pctAlocar, 100 - pctGuardado)}%` }} />
              )}
            </div>
          </div>
          <div className="flex items-center justify-between text-[8px] font-black text-gray-400 uppercase">
            <div className="flex items-center gap-3">
              {conta.guardado > 0 && (
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
                  Guardado {fmt(conta.guardado)}
                </span>
              )}
              {conta.falta > 0 && (
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-300 inline-block" />
                  Falta {fmt(conta.falta)}
                </span>
              )}
            </div>
            <span className={pctGuardado + pctAlocar >= 100 ? 'text-emerald-600' : 'text-gray-400'}>
              {Math.min(pctGuardado + pctAlocar, 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {conta.falta > 0 && (
          <div className={`rounded-xl px-3 py-2 flex items-center justify-between ${
            conta.urgente ? 'bg-rose-50 border border-rose-100' : 'bg-slate-50'
          }`}>
            <div>
              {conta.urgente ? (
                <p className="text-[9px] font-black text-rose-600 uppercase">⚡ Urgente — vence logo!</p>
              ) : (
                <p className="text-[9px] font-black text-gray-500 uppercase">Ritmo sugerido</p>
              )}
              <p className={`text-sm font-black ${conta.urgente ? 'text-rose-600' : 'text-slate-700'}`}>
                {fmt(conta.porDia)}<span className="text-[9px] font-bold text-gray-400"> /dia</span>
              </p>
            </div>
            {!conta.coberta && (
              <button
                onClick={() => setExpanded(e => !e)}
                className="flex items-center gap-1 bg-slate-900 text-white text-[9px] font-black uppercase px-3 py-2 rounded-xl active:scale-95 transition-all"
              >
                Guardar
                {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              </button>
            )}
          </div>
        )}
      </div>

      {expanded && conta.falta > 0 && (
        <div className="border-t border-gray-50 p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Quanto guardar agora?</p>

          <div className="flex gap-2">
            {[
              { id: 'diario',    label: `${fmtK(conta.porDia)}/dia` },
              { id: 'completar', label: `Completar ${fmtK(conta.falta)}` },
              { id: 'custom',    label: 'Outro valor' },
            ].map(op => (
              <button
                key={op.id}
                onClick={() => setModo(op.id)}
                className={`flex-1 py-2 rounded-xl text-[8px] font-black uppercase transition-all border ${
                  modo === op.id
                    ? 'bg-slate-900 border-slate-700 text-white'
                    : 'bg-gray-50 border-transparent text-gray-500'
                }`}
              >
                {op.label}
              </button>
            ))}
          </div>

          {modo === 'custom' && (
            <input
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={valorCustom}
              onChange={e => setValorCustom(e.target.value.replace(/[^0-9.,-]/g, ''))}
              className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-200 outline-none text-sm font-black focus:ring-2 focus:ring-slate-500"
            />
          )}

          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
            <div>
              <p className="text-[8px] font-black text-gray-400 uppercase">Guardar agora</p>
              <p className="text-base font-black text-emerald-600">{fmt(valorSugerido)}</p>
            </div>
            <button
              onClick={handleGuardar}
              disabled={saving || valorSugerido <= 0}
              className="bg-emerald-600 text-white text-[9px] font-black uppercase px-4 py-2.5 rounded-xl active:scale-95 transition-all disabled:opacity-40"
            >
              {saving ? 'Salvando...' : 'Confirmar'}
            </button>
          </div>

          <p className="text-[8px] text-gray-300 font-bold text-center">
            Isso será lançado como reserva no seu fluxo
          </p>
        </div>
      )}
    </div>
  )
}

export function IntelligenceScreen({ allTransactions = [], currentDate, user }) {
  const { rendaHoje, mesStr, contasPendentes, enriquecerComSaldo, calcularDistribuicao } =
    useIntelligence(allTransactions, currentDate)

  const { saldoPorConta, guardar, loading: loadingCaixinhas } = useCaixinhas(user, mesStr)

  const [rendaInput, setRendaInput] = useState('')
  const [confirmado, setConfirmado] = useState(false)
  const [editando, setEditando]     = useState(false)
  const [saving, setSaving]         = useState(false)
  const [toast, setToast]           = useState(null)

  const contas = useMemo(() =>
    enriquecerComSaldo(saldoPorConta),
    [saldoPorConta, contasPendentes]
  )

  const rendaConfirmada = useMemo(() => {
    if (!confirmado) return null
    const v = parseFloat(String(rendaInput).replace(',', '.'))
    return isNaN(v) ? null : v
  }, [confirmado, rendaInput])

  const { plano, sobra } = useMemo(() => {
    if (rendaConfirmada === null) return { plano: contas, sobra: 0 }
    return calcularDistribuicao(rendaConfirmada, saldoPorConta)
  }, [rendaConfirmada, saldoPorConta, contas])

  const displayContas = rendaConfirmada !== null ? plano : contas

  const totalFalta    = contas.reduce((s, c) => s + c.falta, 0)
  const totalGuardado = contas.reduce((s, c) => s + c.guardado, 0)
  const urgentes      = contas.filter(c => c.urgente && c.falta > 0)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleGuardar = async (params) => {
    setSaving(true)
    const result = await guardar(params)
    setSaving(false)
    if (result?.ok) {
      showToast(`${fmt(params.valor)} guardado para "${params.descricao}"`)
    } else {
      showToast(result?.error || 'Erro ao guardar', 'error')
    }
  }

  const handleConfirmar = () => {
    const v = parseFloat(String(rendaInput).replace(',', '.'))
    if (!isNaN(v) && v > 0) { setConfirmado(true); setEditando(false) }
  }

  const contasCoberta  = displayContas.filter(p => p.coberta).length
  const contasDeficit  = displayContas.filter(p => p.deficit > 0).length
  const totalDeficit   = displayContas.reduce((s, p) => s + (p.deficit || 0), 0)

  return (
    <div className="space-y-4">

      {toast && (
        <div className={`fixed top-4 left-4 right-4 z-50 max-w-lg mx-auto px-4 py-3 rounded-2xl shadow-lg text-xs font-black text-white animate-in slide-in-from-top-2 duration-200 ${
          toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-slate-900 rounded-2xl flex items-center justify-center flex-shrink-0">
          <Brain size={16} className="text-white" />
        </div>
        <div>
          <h3 className="text-sm font-black text-gray-800">Inteligência Financeira</h3>
          <p className="text-[10px] text-gray-400 font-bold">
            {mesStr} · {contas.length} conta{contas.length !== 1 ? 's' : ''} pendente{contas.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {urgentes.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3 flex items-start gap-2.5">
          <Flame size={15} className="text-rose-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[10px] font-black text-rose-700 uppercase">Atenção — vence logo</p>
            <p className="text-sm font-black text-rose-600">
              {urgentes.map(u => u.descricao).join(', ')}
            </p>
            <p className="text-[9px] text-rose-400 font-bold mt-0.5">
              Guarde hoje para não ficar descoberto
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Distribuir renda</p>

        {rendaHoje > 0 && (!confirmado || editando) && (
          <button
            onClick={() => { setRendaInput(String(rendaHoje.toFixed(2)).replace('.', ',')); setConfirmado(false); setEditando(true) }}
            className="w-full flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Zap size={14} className="text-emerald-600 fill-emerald-200" />
              <div className="text-left">
                <p className="text-[10px] font-black text-emerald-700 uppercase">Renda detectada hoje</p>
                <p className="text-lg font-black text-emerald-600">{fmt(rendaHoje)}</p>
              </div>
            </div>
            <span className="text-[9px] font-black text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-xl uppercase">Usar</span>
          </button>
        )}

        {(!confirmado || editando) ? (
            <div className="flex gap-2 w-full">
                <input
                type="text"
                inputMode="decimal"
                placeholder={rendaHoje > 0 ? 'Outro valor' : 'Valor total'}
                value={rendaInput}
                onChange={e => setRendaInput(e.target.value.replace(/[^0-9.,-]/g, ''))}
                className="w-full min-w-0 p-3.5 sm:p-4 rounded-2xl bg-gray-50 ring-1 ring-gray-200 outline-none text-base sm:text-lg font-black focus:ring-2 focus:ring-slate-500 transition-all"
                />
                <button
                onClick={handleConfirmar}
                disabled={!rendaInput}
                className="shrink-0 px-4 sm:px-6 bg-slate-900 text-white rounded-2xl font-black text-[10px] sm:text-[11px] uppercase disabled:opacity-40 active:scale-95 transition-all whitespace-nowrap"
                >
                Ver plano
                </button>
            </div>
            ) : (
          <div className="flex items-center justify-between bg-slate-50 rounded-2xl px-4 py-3">
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase">Distribuindo</p>
              <p className="text-lg font-black text-slate-800">{fmt(rendaConfirmada)}</p>
            </div>
            <button onClick={() => { setEditando(true); setConfirmado(false) }} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors">
              <RefreshCw size={15} />
            </button>
          </div>
        )}
      </div>

      {rendaConfirmada !== null && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
          <div className="bg-emerald-50 rounded-2xl p-3 text-center">
            <CheckCircle2 size={14} className="text-emerald-600 mx-auto mb-1" />
            <p className="text-[8px] font-black text-gray-400 uppercase">Cobertas</p>
            <p className="text-base font-black text-emerald-600">{contasCoberta}</p>
          </div>
          <div className={`${contasDeficit > 0 ? 'bg-rose-50' : 'bg-gray-50'} rounded-2xl p-3 text-center`}>
            <AlertTriangle size={14} className={`${contasDeficit > 0 ? 'text-rose-500' : 'text-gray-300'} mx-auto mb-1`} />
            <p className="text-[8px] font-black text-gray-400 uppercase">Déficit</p>
            <p className={`text-base font-black ${contasDeficit > 0 ? 'text-rose-600' : 'text-gray-300'}`}>{contasDeficit}</p>
          </div>
          <div className={`${sobra > 0 ? 'bg-blue-50' : 'bg-gray-50'} rounded-2xl p-3 text-center`}>
            <Wallet size={14} className={`${sobra > 0 ? 'text-blue-500' : 'text-gray-300'} mx-auto mb-1`} />
            <p className="text-[8px] font-black text-gray-400 uppercase">Sobra</p>
            <p className={`text-base font-black ${sobra > 0 ? 'text-blue-600' : 'text-gray-300'}`}>{fmtK(sobra)}</p>
          </div>
        </div>
      )}

      {totalDeficit > 0 && (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl px-4 py-3 flex items-start gap-2.5">
          <AlertTriangle size={14} className="text-rose-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[10px] font-black text-rose-700 uppercase">Déficit total</p>
            <p className="text-sm font-black text-rose-600">{fmt(totalDeficit)} descobertos</p>
            <p className="text-[9px] text-rose-400 font-bold mt-0.5">
              {contasDeficit} conta{contasDeficit !== 1 ? 's' : ''} sem cobertura suficiente
            </p>
          </div>
        </div>
      )}

      {sobra > 0 && rendaConfirmada !== null && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 flex items-start gap-2.5">
          <CircleDollarSign size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[10px] font-black text-blue-700 uppercase">Sobra disponível</p>
            <p className="text-sm font-black text-blue-600">{fmt(sobra)} sem destino</p>
            <p className="text-[9px] text-blue-400 font-bold mt-0.5">Considere guardar em reservas ou adiantar próximas contas</p>
          </div>
        </div>
      )}

      {displayContas.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
            {rendaConfirmada !== null ? 'Plano de distribuição' : 'Contas do mês'}
          </p>
          {displayContas.map(conta => (
            <ContaCard
              key={conta.id}
              conta={conta}
              onGuardar={handleGuardar}
              saving={saving}
            />
          ))}
        </div>
      )}

      {displayContas.length === 0 && (
        <div className="text-center py-10 bg-white rounded-2xl border-2 border-dashed border-gray-100 text-gray-400 text-xs font-bold">
          Nenhuma conta pendente para este mês 🎉
        </div>
      )}
    </div>
  )
}