import React, { useState, useMemo } from 'react'
import { Plus, CreditCard, Trash2, Edit3, X, Check, ChevronDown, ChevronUp, TrendingDown, AlertCircle, ArrowDownCircle } from 'lucide-react'
import { getFaturasExibicao } from '../lib/faturaHelpers'

const CORES = [
  { id: 'slate',   bg: 'bg-slate-800',   hex: '#1e293b' },
  { id: 'indigo',  bg: 'bg-indigo-600',  hex: '#4f46e5' },
  { id: 'violet',  bg: 'bg-violet-600',  hex: '#7c3aed' },
  { id: 'rose',    bg: 'bg-rose-600',    hex: '#e11d48' },
  { id: 'emerald', bg: 'bg-emerald-600', hex: '#059669' },
  { id: 'amber',   bg: 'bg-amber-500',   hex: '#f59e0b' },
]

const corBg  = (cor) => CORES.find(c => c.id === cor)?.bg  || 'bg-slate-800'
const corHex = (cor) => CORES.find(c => c.id === cor)?.hex || '#1e293b'

const defaultForm = { nome: '', limite: '', vencimento: '', fechamento: '', cor: 'slate' }

const fmt  = (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
const fmtK = (v) => Math.abs(v) >= 1000
  ? `R$${(Math.abs(v) / 1000).toFixed(1)}k`
  : `R$${Number(Math.abs(v)).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`

// ─── Fatura Detalhe com paginação ────────────────────────────────────────────
const PER_PAGE = 8

function FaturaDetalhe({ faturas, corHex, fmt }) {
  const [pages, setPages] = React.useState({}) // { fi: pageIndex }

  const getPage = (fi) => pages[fi] || 0
  const setPage = (fi, p) => setPages(prev => ({ ...prev, [fi]: p }))

  return (
    <div className="bg-white border-x border-b border-gray-100 rounded-b-[1.75rem] animate-in slide-in-from-top-1 duration-200">
      {faturas.map((fat, fi) => {
        // Misturar gastos e pagamentos ordenados por data desc
        const itens = [
          ...(fat.gastos || []).map(t => ({ ...t, _isPagamento: false })),
          ...(fat.pagamentos || []).map(t => ({ ...t, _isPagamento: true })),
        ].sort((a, b) => new Date(b.data) - new Date(a.data))

        const total    = itens.length
        const totalPag = Math.ceil(total / PER_PAGE)
        const page     = getPage(fi)
        const slice    = itens.slice(page * PER_PAGE, (page + 1) * PER_PAGE)
        const nGastos  = (fat.gastos || []).length
        const nPagtos  = (fat.pagamentos || []).length

        return (
          <div key={fi} className={`p-4 ${fi > 0 ? 'border-t border-gray-100' : ''}`}>

            {/* Cabeçalho */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                  {fat._label} · {fat.periodo}
                </p>
                <p className="text-[8px] text-gray-400 mt-0.5">
                  {nGastos} compra{nGastos !== 1 ? 's' : ''}
                  {nPagtos > 0 ? ` · ${nPagtos} pagamento${nPagtos !== 1 ? 's' : ''}` : ''}
                </p>
              </div>
              <span className={`text-[7px] font-black px-2 py-0.5 rounded-full uppercase ${
                fat.pago ? 'bg-emerald-100 text-emerald-700' :
                fat.status === 'cobrança' ? 'bg-rose-100 text-rose-700' :
                'bg-gray-100 text-gray-500'
              }`}>
                {fat.pago ? 'Quitada' : fat.status === 'cobrança' ? 'A pagar' : 'Aberta'}
              </span>
            </div>

            {/* Lista misturada: gastos + pagamentos */}
            <div className="space-y-0">
              {slice.map((t, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                  <div className={`w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center ${
                    t._isPagamento ? 'bg-emerald-50' : ''
                  }`} style={!t._isPagamento ? { backgroundColor: corHex + '18' } : {}}>
                    {t._isPagamento
                      ? <Check size={11} className="text-emerald-600" />
                      : <TrendingDown size={11} style={{ color: corHex }} />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-gray-800 truncate">{t.descricao}</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase">
                      {new Date(t.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      {t._isPagamento ? ' · Pagamento' : t.categoria ? ` · ${t.categoria}` : ''}
                    </p>
                  </div>
                  <p className={`text-[11px] font-black flex-shrink-0 ${t._isPagamento ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t._isPagamento ? '+' : '-'}{fmt(Math.abs(Number(t.valor)))}
                  </p>
                </div>
              ))}
              {total === 0 && (
                <p className="text-[9px] text-gray-300 font-bold py-2">Sem movimentações neste período</p>
              )}
            </div>

            {/* Paginação */}
            {totalPag > 1 && (
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                <button
                  onClick={() => setPage(fi, Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="flex items-center gap-1 text-[9px] font-black text-gray-500 uppercase px-2.5 py-1.5 rounded-xl bg-gray-50 disabled:opacity-30 active:scale-95 transition-all"
                  style={{ minHeight: 36 }}>
                  ‹ Anterior
                </button>
                <span className="text-[9px] font-black text-gray-400">
                  {page + 1} / {totalPag} · {total} itens
                </span>
                <button
                  onClick={() => setPage(fi, Math.min(totalPag - 1, page + 1))}
                  disabled={page === totalPag - 1}
                  className="flex items-center gap-1 text-[9px] font-black text-gray-500 uppercase px-2.5 py-1.5 rounded-xl bg-gray-50 disabled:opacity-30 active:scale-95 transition-all"
                  style={{ minHeight: 36 }}>
                  Próxima ›
                </button>
              </div>
            )}

            {/* Resumo */}
            <div className="space-y-1 mt-3">
              {fat.creditoAnt > 0 && (
                <div className="flex items-center justify-between bg-blue-50 rounded-xl px-3 py-2">
                  <span className="text-[9px] font-black text-blue-600 uppercase">Crédito anterior</span>
                  <span className="text-xs font-black text-blue-700">-{fmt(fat.creditoAnt)}</span>
                </div>
              )}
              {fat.totalPago > 0 && (
                <div className="flex items-center justify-between bg-emerald-50 rounded-xl px-3 py-2">
                  <span className="text-[9px] font-black text-emerald-600 uppercase">Pago</span>
                  <span className="text-xs font-black text-emerald-700">{fmt(fat.totalPagoEfetivo ?? fat.totalPago)}</span>
                </div>
              )}
              <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                <span className="text-[9px] font-black text-gray-500 uppercase">
                  {fat.saldo > 0 ? 'Saldo' : fat.credito > 0 ? 'Crédito p/ próxima' : 'Quitada'}
                </span>
                <span className={`text-xs font-black ${fat.saldo > 0 ? 'text-rose-600' : fat.credito > 0 ? 'text-blue-600' : 'text-emerald-600'}`}>
                  {fat.saldo > 0 ? fmt(fat.saldo) : fat.credito > 0 ? fmt(fat.credito) : '✓ R$0,00'}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function CartoesScreen({ cartoes, onCriar, onEditar, onExcluir, allTransactions = [], currentDate }) {
  const [showForm, setShowForm]             = useState(false)
  const [editando, setEditando]             = useState(null)
  const [form, setForm]                     = useState(defaultForm)
  const [saving, setSaving]                 = useState(false)
  const [error, setError]                   = useState(null)
  const [expandedId, setExpandedId]         = useState(null)
  const [confirmExcluir, setConfirmExcluir] = useState(null)

  const abrirNovo = () => { setForm(defaultForm); setEditando(null); setShowForm(true); setError(null) }
  const abrirEdit = (c) => {
    setForm({ nome: c.nome, limite: String(c.limite), vencimento: String(c.vencimento), fechamento: String(c.fechamento), cor: c.cor || 'slate' })
    setEditando(c.id); setShowForm(true); setError(null)
  }

  const handleSalvar = async (e) => {
    e.preventDefault(); setError(null); setSaving(true)
    try {
      const dados = {
        nome: form.nome.trim(),
        limite: parseFloat(String(form.limite).replace(',', '.')) || 0,
        vencimento: parseInt(form.vencimento),
        fechamento: parseInt(form.fechamento),
        cor: form.cor,
      }
      if (editando) await onEditar(editando, dados)
      else          await onCriar(dados)
      setShowForm(false)
    } catch { setError('Erro ao salvar cartão.') }
    finally   { setSaving(false) }
  }

  const viewDate = currentDate instanceof Date ? currentDate : new Date()

  const cartaoesComFatura = useMemo(() =>
    (cartoes || []).map(c => {
      const faturas    = getFaturasExibicao(c, allTransactions, viewDate)
      const faturaAtiva = faturas[0] // a mais relevante (em cobrança ou atual)
      const pctUso     = c.limite > 0 ? Math.min((faturaAtiva.totalGasto / c.limite) * 100, 100) : 0
      const disponivel = Math.max((c.limite || 0) - faturaAtiva.totalGasto, 0)
      return { ...c, faturas, fatura: faturaAtiva, pctUso, disponivel }
    }),
    [cartoes, allTransactions, viewDate]
  )

  return (
    <div className="space-y-4">

      <div className="flex items-center justify-between px-1">
        <h3 className="text-gray-800 font-black text-[11px] uppercase tracking-tighter">Meus Cartões</h3>
        <button onClick={abrirNovo}
          className="flex items-center gap-1.5 bg-slate-900 text-white text-[10px] font-black uppercase px-4 py-2.5 rounded-2xl active:scale-95 transition-all shadow-sm"
          style={{ minHeight: 40 }}>
          <Plus size={14} /> Novo
        </button>
      </div>

      {cartaoesComFatura.length === 0 && (
        <div className="text-center py-14 bg-white rounded-2xl border-2 border-dashed border-gray-100">
          <CreditCard size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-[11px] font-black text-gray-400 uppercase mb-1">Nenhum cartão cadastrado</p>
          <button onClick={abrirNovo} className="text-[10px] font-black text-slate-600 underline underline-offset-2">
            Adicionar agora
          </button>
        </div>
      )}

      <div className="space-y-3">
        {cartaoesComFatura.map(c => {
          const isExpanded = expandedId === c.id
          const f          = c.fatura
          const barColor   = c.pctUso >= 90 ? '#ef4444' : c.pctUso >= 70 ? '#f59e0b' : 'rgba(255,255,255,0.8)'
          const preview5   = f.gastos.sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, 5)

          return (
            <div key={c.id} className="rounded-[1.75rem] overflow-hidden shadow-sm">

              <div className={`${corBg(c.cor)} p-5 text-white relative overflow-hidden`}>
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
                <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-black/10" />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xl font-black tracking-tight leading-none">{c.nome}</p>
                      <div className="flex items-center gap-2 mt-1 opacity-60">
                        <span className="text-[8px] font-black uppercase tracking-wider">Fecha {c.fechamento}</span>
                        <span className="text-[8px] opacity-40">·</span>
                        <span className="text-[8px] font-black uppercase tracking-wider">Vence {c.vencimento}</span>
                        <span className="text-[8px] opacity-40">·</span>
                        <span className="text-[8px] font-black uppercase tracking-wider opacity-60">{f.periodo}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => abrirEdit(c)}
                        className="p-2.5 rounded-xl bg-white/15 active:bg-white/30 transition-colors"
                        style={{ minHeight: 40, minWidth: 40 }}>
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => setConfirmExcluir(c.id)}
                        className="p-2.5 rounded-xl bg-white/15 active:bg-rose-400/40 transition-colors"
                        style={{ minHeight: 40, minWidth: 40 }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {c.limite > 0 && (
                    <div className="mb-4">
                      <div className="flex justify-between mb-1.5">
                        <span className="text-[8px] font-black opacity-50 uppercase">Limite usado na fatura</span>
                        <span className="text-[8px] font-black opacity-70">{c.pctUso.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 bg-black/25 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${c.pctUso}%`, backgroundColor: barColor }} />
                      </div>
                    </div>
                  )}

                  <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div className="bg-black/20 rounded-2xl p-3">
                      <p className="text-[7px] font-black opacity-50 uppercase mb-0.5">Fatura</p>
                      <p className={`text-sm font-black ${f.pago ? 'text-emerald-300' : ''}`}>
                        {fmtK(f.totalGasto)}
                      </p>
                    </div>
                    <div className="bg-black/20 rounded-2xl p-3">
                      <p className="text-[7px] font-black opacity-50 uppercase mb-0.5">Pago</p>
                      <p className="text-sm font-black text-emerald-300">{fmtK(f.totalPagoEfetivo ?? f.totalPago)}</p>
                      {f.creditoAnt > 0 && (
                        <p className="text-[7px] font-black text-emerald-400 opacity-70">+{fmtK(f.creditoAnt)} crédito</p>
                      )}
                    </div>
                    <div className="bg-black/20 rounded-2xl p-3">
                      <p className="text-[7px] font-black opacity-50 uppercase mb-0.5">Saldo</p>
                      <p className={`text-sm font-black ${f.saldo > 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
                        {fmtK(f.saldo)}
                      </p>
                    </div>
                  </div>

                  {c.limite > 0 && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div className="bg-black/20 rounded-2xl p-3">
                        <p className="text-[7px] font-black opacity-50 uppercase mb-0.5">Disponível</p>
                        <p className="text-sm font-black">{fmtK(c.disponivel)}</p>
                      </div>
                      <div className="bg-black/20 rounded-2xl p-3">
                        <p className="text-[7px] font-black opacity-50 uppercase mb-0.5">Limite total</p>
                        <p className="text-sm font-black">{fmtK(c.limite)}</p>
                      </div>
                    </div>
                  )}

                  {c.faturas.some(fat => fat.gastos.length > 0) && (
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : c.id)}
                      className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 bg-black/20 rounded-2xl text-[9px] font-black uppercase active:bg-black/30 transition-colors"
                      style={{ minHeight: 40 }}>
                      {isExpanded ? 'Ocultar' : 'Ver detalhes'}
                      {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                    </button>
                  )}

                  {!c.faturas.some(fat => fat.gastos.length > 0) && (
                    <p className="mt-3 text-center text-[9px] opacity-40 font-bold uppercase">Nenhuma compra nesta fatura</p>
                  )}
                </div>
              </div>

              {isExpanded && (
                <FaturaDetalhe faturas={c.faturas} corHex={corHex(c.cor)} fmt={fmt} />
              )}
            </div>
          )
        })}
      </div>

      {confirmExcluir && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setConfirmExcluir(null)} />
          <div className="relative z-10 bg-white rounded-2xl p-6 max-w-[300px] w-full shadow-2xl animate-in zoom-in duration-200 text-center">
            <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} className="text-rose-500" />
            </div>
            <h3 className="text-base font-black text-gray-800 mb-1">Excluir cartão?</h3>
            <p className="text-[11px] text-gray-400 mb-5 leading-relaxed">Os lançamentos vinculados não serão excluídos.</p>
            <div className="space-y-2">
              <button onClick={() => { onExcluir(confirmExcluir); setConfirmExcluir(null) }}
                className="w-full py-3.5 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase active:scale-95 transition-all">
                Excluir
              </button>
              <button onClick={() => setConfirmExcluir(null)}
                className="w-full py-2 text-gray-400 font-bold text-[9px] uppercase">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-t-[2rem] sm:rounded-[2rem] p-7 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xl font-black text-gray-800 tracking-tighter">
                {editando ? 'Editar Cartão' : 'Novo Cartão'}
              </h4>
              <button onClick={() => setShowForm(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                style={{ minHeight: 40, minWidth: 40 }}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="space-y-5">
              {error && <p className="text-xs text-rose-600 font-black bg-rose-50 px-4 py-3 rounded-2xl">{error}</p>}

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Nome do cartão</label>
                <input type="text" required placeholder="Ex: Nubank, Inter..."
                  style={{ minHeight: 52 }}
                  className="w-full p-4 bg-gray-50 rounded-2xl ring-1 ring-gray-100 outline-none focus:ring-2 focus:ring-slate-900 font-bold text-gray-700"
                  value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Limite (R$)</label>
                <input type="text" inputMode="decimal" placeholder="0,00 (opcional)"
                  style={{ minHeight: 52 }}
                  className="w-full p-4 bg-gray-50 rounded-2xl ring-1 ring-gray-100 outline-none focus:ring-2 focus:ring-slate-900 font-bold text-gray-700"
                  value={form.limite} onChange={e => setForm(f => ({ ...f, limite: e.target.value.replace(/[^0-9.,]/g, '') }))} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Dia fechamento</label>
                  <input type="number" min="1" max="31" required placeholder="Ex: 8"
                    style={{ minHeight: 52 }}
                    className="w-full p-4 bg-gray-50 rounded-2xl ring-1 ring-gray-100 outline-none focus:ring-2 focus:ring-slate-900 font-bold text-gray-700"
                    value={form.fechamento} onChange={e => setForm(f => ({ ...f, fechamento: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Dia vencimento</label>
                  <input type="number" min="1" max="31" required placeholder="Ex: 15"
                    style={{ minHeight: 52 }}
                    className="w-full p-4 bg-gray-50 rounded-2xl ring-1 ring-gray-100 outline-none focus:ring-2 focus:ring-slate-900 font-bold text-gray-700"
                    value={form.vencimento} onChange={e => setForm(f => ({ ...f, vencimento: e.target.value }))} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Cor</label>
                <div className="flex gap-3 bg-gray-50 p-4 rounded-2xl ring-1 ring-gray-100 justify-around">
                  {CORES.map(c => (
                    <button key={c.id} type="button" onClick={() => setForm(f => ({ ...f, cor: c.id }))}
                      style={{ minHeight: 44, minWidth: 44 }}
                      className={`w-11 h-11 rounded-2xl ${c.bg} flex items-center justify-center transition-all active:scale-90 ${
                        form.cor === c.id ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : 'opacity-45'
                      }`}>
                      {form.cor === c.id && <Check size={16} className="text-white" strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`${corBg(form.cor)} rounded-2xl p-4 text-white`}>
                <p className="text-[7px] font-black opacity-40 uppercase mb-1">Prévia</p>
                <p className="text-base font-black">{form.nome || 'Nome do cartão'}</p>
                <div className="flex gap-3 mt-0.5 opacity-50">
                  {form.fechamento && <span className="text-[8px] font-black uppercase">Fecha {form.fechamento}</span>}
                  {form.vencimento && <span className="text-[8px] font-black uppercase">Vence {form.vencimento}</span>}
                </div>
              </div>

              <button type="submit" disabled={saving}
                style={{ minHeight: 56 }}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest active:scale-[0.98] transition-all disabled:opacity-50">
                {saving ? 'Salvando...' : editando ? 'Salvar Alterações' : 'Adicionar Cartão'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}