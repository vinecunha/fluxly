import React, { useState } from 'react'
import { Target, Plus, ChevronRight, TrendingUp, Trash2, Edit3, CircleDollarSign, Calendar } from 'lucide-react'

const fmt = (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

function MetaCard({ meta, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const [valor, setValor] = useState('')
  const [loading, setLoading] = useState(false)

  const progresso = meta.progresso || 0
  const diasRestantes = meta.prazo ? Math.ceil((new Date(meta.prazo) - new Date()) / (1000 * 60 * 60 * 24)) : null
  const precisaPorDia = (meta.valor_objetivo - (meta.valor_atual || 0)) / Math.max(diasRestantes, 1)

  const handleDepositar = async () => {
    const v = parseFloat(String(valor).replace(',', '.'))
    if (!v || v <= 0) return

    setLoading(true)
    await onUpdate(meta.id, v)
    setValor('')
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
              <Target size={16} className="text-violet-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-gray-800 truncate">{meta.nome}</p>
              <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">
                {meta.categoria || 'Meta pessoal'}
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[11px] font-black text-gray-800">{fmt(meta.valor_atual || 0)}</p>
            <p className="text-[9px] text-gray-400">de {fmt(meta.valor_objetivo)}</p>
          </div>
        </div>

        <div className="space-y-1.5 mb-3">
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${progresso}%` }} />
          </div>
          <div className="flex justify-between text-[8px] font-black text-gray-400">
            <span>{progresso.toFixed(0)}% concluído</span>
            {diasRestantes !== null && (
              <span>{diasRestantes} {diasRestantes === 1 ? 'dia' : 'dias'} restantes</span>
            )}
          </div>
        </div>

        {progresso < 100 && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-full flex items-center justify-center gap-1 py-2 bg-gray-50 rounded-xl text-[9px] font-black text-gray-500 uppercase active:bg-gray-100 transition-colors"
          >
            {expanded ? 'Ocultar' : 'Depositar'} <ChevronRight size={10} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
        )}
      </div>

      {expanded && progresso < 100 && (
        <div className="border-t border-gray-50 p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
          {diasRestantes > 0 && (
            <div className="bg-blue-50 rounded-xl p-3">
              <p className="text-[8px] font-black text-blue-600 uppercase">Precisa guardar por dia</p>
              <p className="text-lg font-black text-blue-700">{fmt(precisaPorDia)}</p>
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="decimal"
              placeholder="Quanto quer guardar"
              value={valor}
              onChange={e => setValor(e.target.value.replace(/[^0-9.,-]/g, ''))}
              className="flex-1 p-3 rounded-xl bg-gray-50 ring-1 ring-gray-200 outline-none text-sm font-black focus:ring-2 focus:ring-violet-400"
            />
            <button
              onClick={handleDepositar}
              disabled={loading || !valor}
              className="px-4 bg-violet-600 text-white rounded-xl font-black text-[10px] uppercase disabled:opacity-40 active:scale-95 transition-all"
            >
              {loading ? '...' : 'Guardar'}
            </button>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => onDelete(meta.id)} className="p-1.5 text-gray-300 hover:text-rose-500 transition-colors">
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      )}

      {progresso >= 100 && (
        <div className="border-t border-emerald-100 bg-emerald-50 p-3">
          <p className="text-center text-[9px] font-black text-emerald-600">🎉 Meta alcançada! Parabéns!</p>
        </div>
      )}
    </div>
  )
}

export function MetasScreen({ metas = [], onCreate, onUpdate, onDelete, loading: loadingMetas }) {
  const [showForm, setShowForm] = useState(false)
  const [nome, setNome] = useState('')
  const [valor, setValor] = useState('')
  const [prazo, setPrazo] = useState('')
  const [categoria, setCategoria] = useState('')
  const [saving, setSaving] = useState(false)

  const handleCreate = async () => {
    const v = parseFloat(String(valor).replace(',', '.'))
    if (!nome || !v || v <= 0) return

    setSaving(true)
    await onCreate(nome, v, prazo, categoria || null)
    setNome('')
    setValor('')
    setPrazo('')
    setCategoria('')
    setShowForm(false)
    setSaving(false)
  }

  const metasAtivas = metas.filter(m => (m.progresso || 0) < 100)
  const metasConcluidas = metas.filter(m => (m.progresso || 0) >= 100)

  if (loadingMetas && metas.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-slate-500" />
            <h3 className="text-sm font-black text-gray-800">Minhas Metas</h3>
          </div>
        </div>
        <div className="space-y-3 animate-pulse">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 h-28" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target size={16} className="text-slate-500" />
          <h3 className="text-sm font-black text-gray-800">Minhas Metas</h3>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 bg-slate-900 text-white text-[9px] font-black uppercase px-3 py-2 rounded-xl active:scale-95 transition-all"
        >
          <Plus size={10} /> Nova Meta
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <input
            type="text"
            placeholder="Nome da meta (Ex: Viagem dos sonhos)"
            value={nome}
            onChange={e => setNome(e.target.value)}
            className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-200 outline-none text-sm font-bold focus:ring-2 focus:ring-slate-500"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              inputMode="decimal"
              placeholder="Valor objetivo"
              value={valor}
              onChange={e => setValor(e.target.value.replace(/[^0-9.,-]/g, ''))}
              className="p-3 rounded-xl bg-gray-50 ring-1 ring-gray-200 outline-none text-sm font-bold focus:ring-2 focus:ring-slate-500"
            />
            <input
              type="date"
              value={prazo}
              onChange={e => setPrazo(e.target.value)}
              className="p-3 rounded-xl bg-gray-50 ring-1 ring-gray-200 outline-none text-sm font-bold focus:ring-2 focus:ring-slate-500"
            />
          </div>
          <input
            type="text"
            placeholder="Categoria (opcional)"
            value={categoria}
            onChange={e => setCategoria(e.target.value)}
            className="w-full p-3 rounded-xl bg-gray-50 ring-1 ring-gray-200 outline-none text-sm font-bold focus:ring-2 focus:ring-slate-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={saving || !nome || !valor}
              className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase disabled:opacity-40 active:scale-95 transition-all"
            >
              {saving ? 'Criando...' : 'Criar Meta'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-3 bg-gray-100 text-gray-500 rounded-xl font-black text-[10px] uppercase active:scale-95 transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {metasAtivas.length > 0 && (
        <div className="space-y-3">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Em andamento</p>
          {metasAtivas.map(meta => (
            <MetaCard key={meta.id} meta={meta} onUpdate={onUpdate} onDelete={onDelete} />
          ))}
        </div>
      )}

      {metasConcluidas.length > 0 && (
        <div className="space-y-3">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Concluídas</p>
          {metasConcluidas.map(meta => (
            <MetaCard key={meta.id} meta={meta} onUpdate={onUpdate} onDelete={onDelete} />
          ))}
        </div>
      )}

      {metas.length === 0 && !showForm && (
        <div className="text-center py-10 bg-white rounded-2xl border-2 border-dashed border-gray-100">
          <Target size={28} className="text-gray-200 mx-auto mb-2" />
          <p className="text-[10px] text-gray-400 font-bold">Nenhuma meta cadastrada</p>
          <p className="text-[8px] text-gray-300 mt-1">Crie metas para acompanhar seus objetivos</p>
        </div>
      )}
    </div>
  )
}