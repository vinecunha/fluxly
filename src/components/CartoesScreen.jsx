import React, { useState } from 'react'
import { Plus, CreditCard, Trash2, Edit3, X, Check } from 'lucide-react'

const CORES = [
  { id: 'slate',   bg: 'bg-slate-800' },
  { id: 'indigo', bg: 'bg-indigo-600' },
  { id: 'violet', bg: 'bg-violet-600' },
  { id: 'rose',    bg: 'bg-rose-600'    },
  { id: 'emerald', bg: 'bg-emerald-600' },
  { id: 'amber',   bg: 'bg-amber-500' },
]

const corBg = (cor) => CORES.find(c => c.id === cor)?.bg || 'bg-slate-800'
const defaultForm = { nome: '', limite: '', vencimento: '', fechamento: '', cor: 'slate' }

export function CartoesScreen({ cartoes, onCriar, onEditar, onExcluir }) {
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm]         = useState(defaultForm)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState(null)

  const abrirNovo = () => { setForm(defaultForm); setEditando(null); setShowForm(true); setError(null) }
  const abrirEdit = (c) => {
    setForm({ 
      nome: c.nome, 
      limite: String(c.limite), 
      vencimento: String(c.vencimento), 
      fechamento: String(c.fechamento), 
      cor: c.cor || 'slate' 
    })
    setEditando(c.id)
    setShowForm(true)
    setError(null)
  }

  const handleSalvar = async (e) => {
    e.preventDefault()
    setError(null)
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
      <div className="flex items-center justify-between px-1">
        <h3 className="text-gray-800 font-black text-[11px] uppercase tracking-tighter">Meus Cartões</h3>
        <button
          onClick={abrirNovo}
          className="flex items-center gap-1.5 bg-slate-900 text-white text-[10px] font-black uppercase px-4 py-2.5 rounded-2xl active:scale-95 transition-all shadow-sm"
        >
          <Plus size={14} /> Novo Cartão
        </button>
      </div>

      <div className="grid gap-4">
        {cartoes?.map(c => (
          <div key={c.id} className="group relative">
            <div className={`${corBg(c.cor)} p-6 rounded-[2rem] text-white flex items-center justify-between shadow-sm overflow-hidden min-h-[110px]`}>
              <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
              
              <div className="relative z-10 space-y-1">
                <p className="text-xl font-black tracking-tighter leading-none">{c.nome}</p>
                <div className="flex items-center gap-3 opacity-70">
                  <span className="text-[9px] font-black uppercase tracking-wider">Fecha dia {c.fechamento}</span>
                  <div className="w-1 h-1 bg-white/30 rounded-full" />
                  <span className="text-[9px] font-black uppercase tracking-wider">Vence dia {c.vencimento}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 relative z-10">
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mr-2">
                  <button onClick={() => abrirEdit(c)} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                    <Edit3 size={16} />
                  </button>
                  <button onClick={() => onExcluir(c.id)} className="p-2 hover:bg-rose-500/20 rounded-xl transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                  <CreditCard size={22} className="opacity-90" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-xl font-black text-gray-800 tracking-tighter">{editando ? 'Editar Cartão' : 'Novo Cartão'}</h4>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="space-y-5">
              {error && <p className="text-xs text-rose-600 font-black bg-rose-50 px-5 py-4 rounded-2xl border border-rose-100">{error}</p>}

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-2 tracking-widest">Identificação</label>
                <input
                  type="text" required placeholder="Ex: Nubank Ultra"
                  className="w-full p-4 bg-gray-50 rounded-2xl ring-1 ring-gray-100 outline-none focus:ring-2 focus:ring-slate-900 font-bold text-gray-700 transition-all"
                  value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-2 tracking-widest">Limite Total (R$)</label>
                <input
                  type="text" inputMode="decimal" placeholder="0,00"
                  className="w-full p-4 bg-gray-50 rounded-2xl ring-1 ring-gray-100 outline-none focus:ring-2 focus:ring-slate-900 font-bold text-gray-700 transition-all"
                  value={form.limite} onChange={e => setForm(f => ({ ...f, limite: e.target.value.replace(/[^0-9.,]/g, '') }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-2 tracking-widest">Dia Fechamento</label>
                  <input
                    type="number" min="1" max="31" required
                    className="w-full p-4 bg-gray-50 rounded-2xl ring-1 ring-gray-100 outline-none focus:ring-2 focus:ring-slate-900 font-bold text-gray-700 transition-all"
                    value={form.fechamento} onChange={e => setForm(f => ({ ...f, fechamento: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-2 tracking-widest">Dia Vencimento</label>
                  <input
                    type="number" min="1" max="31" required
                    className="w-full p-4 bg-gray-50 rounded-2xl ring-1 ring-gray-100 outline-none focus:ring-2 focus:ring-slate-900 font-bold text-gray-700 transition-all"
                    value={form.vencimento} onChange={e => setForm(f => ({ ...f, vencimento: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-2 tracking-widest">Cor</label>
                <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl ring-1 ring-gray-100">
                  {CORES.map(c => (
                    <button
                      key={c.id} type="button" onClick={() => setForm(f => ({ ...f, cor: c.id }))}
                      className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center transition-all ${form.cor === c.id ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : 'opacity-40 hover:opacity-100'}`}
                    >
                      {form.cor === c.id && <Check size={18} className="text-white" strokeWidth={4} />}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit" disabled={saving}
                className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 mt-4"
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