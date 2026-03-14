import React, { useState } from 'react'
import { Plus, CreditCard, Trash2, Edit3, X, Check, Receipt } from 'lucide-react'

const CORES = [
  { id: 'slate',   bg: 'bg-slate-800',   label: 'Escuro'  },
  { id: 'indigo', bg: 'bg-indigo-600',  label: 'Índigo'  },
  { id: 'violet', bg: 'bg-violet-600',  label: 'Violeta' },
  { id: 'rose',    bg: 'bg-rose-600',    label: 'Rosa'    },
  { id: 'emerald', bg: 'bg-emerald-600', label: 'Verde'   },
  { id: 'amber',   bg: 'bg-amber-500',   label: 'Dourado' },
]

const corBg = (cor) => CORES.find(c => c.id === cor)?.bg || 'bg-slate-800'
const fmt = (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
const defaultForm = { nome: '', limite: '', vencimento: '', fechamento: '', cor: 'slate' }

export function CartoesScreen({ cartoes, faturas, onCriar, onEditar, onExcluir, onPagarFatura }) {
  const [showForm, setShowForm]     = useState(false)
  const [editando, setEditando]     = useState(null)
  const [form, setForm]             = useState(defaultForm)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState(null)

  const faturaMap = Object.fromEntries((faturas || []).map(f => [f.cartao_id, f]))

  const abrirNovo = () => { setForm(defaultForm); setEditando(null); setShowForm(true); setError(null) }
  const abrirEdit = (c) => {
    setForm({ nome: c.nome, limite: c.limite, vencimento: c.vencimento, fechamento: c.fechamento, cor: c.cor || 'slate' })
    setEditando(c.id)
    setShowForm(true)
    setError(null)
  }

  const handleSalvar = async (e) => {
    e.preventDefault()
    setError(null)
    if (!form.nome.trim()) { setError('Nome obrigatório.'); return }
    if (!form.vencimento || !form.fechamento) { setError('Informe vencimento e fechamento.'); return }

    setSaving(true)
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
    } catch {
      setError('Erro ao salvar cartão.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-gray-800 font-black text-sm">Meus Cartões</h3>
        <button
          onClick={abrirNovo}
          className="flex items-center gap-1.5 bg-slate-900 text-white text-[10px] font-black uppercase px-3 py-2 rounded-2xl active:scale-95 transition-all"
        >
          <Plus size={13} /> Novo Cartão
        </button>
      </div>

      {cartoes.length === 0 && !showForm && (
        <div className="text-center py-10 bg-white rounded-2xl border-2 border-dashed border-gray-100 text-gray-400 text-xs italic">
          Nenhum cartão cadastrado.
        </div>
      )}

      <div className="space-y-3">
        {cartoes.map(c => {
          const fat = faturaMap[c.id]
          const usado = fat?.total_gasto || 0
          const limite = c.limite || 1
          const pct = Math.min((usado / limite) * 100, 100)
          const disponivel = Math.max(limite - usado, 0)

          return (
            <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className={`${corBg(c.cor)} p-4 text-white`}>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-70">Cartão de Crédito</p>
                    <p className="text-lg font-black tracking-tight mt-0.5">{c.nome}</p>
                  </div>
                  <CreditCard size={24} className="opacity-60" />
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[8px] opacity-60 uppercase font-bold">Limite disponível</p>
                    <p className="text-xl font-black">{fmt(disponivel)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] opacity-60 uppercase font-bold">Fatura atual</p>
                    <p className="text-base font-black">{fmt(usado)}</p>
                  </div>
                </div>
              </div>

              <div className="px-4 pt-3">
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${pct > 80 ? 'bg-rose-500' : pct > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 mb-3">
                  <span className="text-[9px] text-gray-400 font-bold">{pct.toFixed(0)}% usado</span>
                  <span className="text-[9px] text-gray-400 font-bold">Limite {fmt(limite)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between px-4 pb-3 border-t border-gray-50 pt-2">
                <button 
                  onClick={() => onPagarFatura({ 
                    tipo: 'pagamento_cartao', 
                    valor: usado, 
                    descricao: `Pagamento Fatura ${c.nome}`,
                    cartao_id: c.id,
                    categoria: 'Cartão',
                    data: new Date().toISOString().split('T')[0]
                  })}
                  className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-black uppercase hover:bg-emerald-50 px-2 py-1.5 rounded-xl transition-colors"
                >
                  <Receipt size={14} /> Pagar Fatura
                </button>
                <div className="flex items-center gap-1">
                  <button onClick={() => abrirEdit(c)} className="p-1.5 rounded-xl text-gray-300 hover:text-slate-600 hover:bg-slate-50 transition-colors">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => onExcluir(c.id)} className="p-1.5 rounded-xl text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-black text-gray-800">{editando ? 'Editar Cartão' : 'Novo Cartão'}</h4>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="space-y-4">
              {error && <p className="text-xs text-rose-600 font-bold bg-rose-50 px-4 py-3 rounded-2xl">{error}</p>}

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Nome do Cartão</label>
                <input
                  type="text" required
                  placeholder="Ex: Nubank, Itaú Visa..."
                  className="w-full p-4 bg-gray-50 rounded-2xl ring-1 ring-gray-200 outline-none focus:ring-2 focus:ring-slate-500 font-medium"
                  value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Limite (R$)</label>
                <input
                  type="text" inputMode="decimal"
                  placeholder="0,00"
                  className="w-full p-4 bg-gray-50 rounded-2xl ring-1 ring-gray-200 outline-none focus:ring-2 focus:ring-slate-500 font-medium"
                  value={form.limite}
                  onChange={e => setForm(f => ({ ...f, limite: e.target.value.replace(/[^0-9.,]/g, '') }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Fecha (dia)</label>
                  <input
                    type="number" min="1" max="31" required
                    placeholder="Ex: 3"
                    className="w-full p-4 bg-gray-50 rounded-2xl ring-1 ring-gray-200 outline-none focus:ring-2 focus:ring-slate-500 font-medium"
                    value={form.fechamento}
                    onChange={e => setForm(f => ({ ...f, fechamento: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Vence (dia)</label>
                  <input
                    type="number" min="1" max="31" required
                    placeholder="Ex: 10"
                    className="w-full p-4 bg-gray-50 rounded-2xl ring-1 ring-gray-200 outline-none focus:ring-2 focus:ring-slate-500 font-medium"
                    value={form.vencimento}
                    onChange={e => setForm(f => ({ ...f, vencimento: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Cor</label>
                <div className="flex gap-2 flex-wrap">
                  {CORES.map(c => (
                    <button
                      key={c.id} type="button"
                      onClick={() => setForm(f => ({ ...f, cor: c.id }))}
                      className={`w-8 h-8 rounded-xl ${c.bg} flex items-center justify-center transition-all ${form.cor === c.id ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'opacity-60'}`}
                    >
                      {form.cor === c.id && <Check size={14} className="text-white" strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit" disabled={saving}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-base shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
              >
                {saving ? 'Salvando...' : editando ? 'Salvar Alterações' : 'Adicionar Cartão'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}