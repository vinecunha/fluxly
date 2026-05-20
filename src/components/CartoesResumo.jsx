import React, { useState, useMemo } from 'react'
import { CreditCard, ChevronRight, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { getFaturasExibicao } from '@lib/faturaHelpers'
import { fmt, fmtShort } from '@lib/formatters'
import { logger } from '@lib/logger'

const CORES = [
  { id: 'slate', bg: 'bg-slate-800', hex: '#1e293b' },
  { id: 'indigo', bg: 'bg-indigo-600', hex: '#4f46e5' },
  { id: 'emerald', bg: 'bg-emerald-600', hex: '#059669' },
  { id: 'amber', bg: 'bg-amber-500', hex: '#f59e0b' },
]

const corBg = (cor) => CORES.find(c => c.id === cor)?.bg || 'bg-slate-800'

export function CartoesResumo({ cartoes, onCriar, onEditar, onExcluir, allTransactions = [], currentDate, onVerTodos }) {
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({ nome: '', limite: '', vencimento: '', fechamento: '', cor: 'slate' })
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState(null)

  const viewDate = currentDate instanceof Date ? currentDate : new Date()

  const cartoesComFatura = useMemo(() =>
    (cartoes || []).map(c => {
      const faturas = getFaturasExibicao(c, allTransactions, viewDate)
      const faturaAtiva = faturas[0]
      const pctUso = c.limite > 0 ? Math.min((faturaAtiva.totalGasto / c.limite) * 100, 100) : 0
      return { ...c, faturas, fatura: faturaAtiva, pctUso }
    }).slice(0, 3),
    [cartoes, allTransactions, viewDate]
  )

  const handleSalvar = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const dados = {
        nome: form.nome.trim(),
        limite: parseFloat(String(form.limite).replace(',', '.')) || 0,
        vencimento: parseInt(form.vencimento) || 10,
        fechamento: parseInt(form.fechamento) || 5,
        cor: form.cor,
      }
      
      if (editando) {
        await onEditar(editando, dados)
      } else {
        await onCriar(dados)
      }
      
      setShowForm(false)
      setForm({ nome: '', limite: '', vencimento: '', fechamento: '', cor: 'slate' })
    } catch (err) {
      logger.error('Erro ao salvar cartão:', err)
    } finally {
      setSaving(false)
    }
  }

  if (cartoesComFatura.length === 0 && !showForm) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CreditCard size={14} className="text-gray-400" />
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Cartões</h3>
          </div>
          <button onClick={() => setShowForm(true)} className="text-[9px] font-black text-slate-600 uppercase">
            + Adicionar
          </button>
        </div>
        <div className="text-center py-6">
          <CreditCard size={28} className="text-gray-200 mx-auto mb-2" />
          <p className="text-[10px] text-gray-400">Nenhum cartão cadastrado</p>
          <button onClick={() => setShowForm(true)} className="text-[9px] font-black text-slate-500 underline mt-1">
            Adicionar agora
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard size={14} className="text-gray-400" />
          <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Cartões Cadastrados</h3>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 bg-slate-900 text-white text-[9px] font-black uppercase px-3 py-2 rounded-xl active:scale-95 transition-all">
            {showForm ? 'Cancelar' : '+ Novo'}
          </button>
          {onVerTodos && cartoes.length > 3 && (
            <button onClick={onVerTodos} className="text-[9px] font-black text-gray-400 uppercase flex items-center gap-0.5">
              Ver todos <ChevronRight size={10} />
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="p-4 border-b border-gray-50 bg-gray-50">
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Nome do cartão"
              value={form.nome}
              onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              className="w-full p-2.5 rounded-xl bg-white border border-gray-200 text-sm font-bold"
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                step="0.01"
                placeholder="Limite"
                value={form.limite}
                onChange={e => setForm(f => ({ ...f, limite: e.target.value }))}
                className="p-2.5 rounded-xl bg-white border border-gray-200 text-sm"
              />
              <input
                type="number"
                placeholder="Vencimento"
                value={form.vencimento}
                onChange={e => setForm(f => ({ ...f, vencimento: e.target.value }))}
                className="p-2.5 rounded-xl bg-white border border-gray-200 text-sm"
              />
              <input
                type="number"
                placeholder="Fechamento"
                value={form.fechamento}
                onChange={e => setForm(f => ({ ...f, fechamento: e.target.value }))}
                className="p-2.5 rounded-xl bg-white border border-gray-200 text-sm"
              />
            </div>
            <div className="flex gap-2">
              {CORES.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, cor: c.id }))}
                  className={`w-8 h-8 rounded-full ${c.bg} ${form.cor === c.id ? 'ring-2 ring-offset-1 ring-slate-900' : ''}`}
                />
              ))}
            </div>
            <button
              onClick={handleSalvar}
              disabled={saving || !form.nome}
              className="w-full py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase disabled:opacity-40"
            >
              {saving ? 'Salvando...' : editando ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </div>
      )}

      <div className="divide-y divide-gray-50">
        {cartoesComFatura.map(c => {
          const isExpanded = expandedId === c.id
          const f = c.fatura
          const barColor = c.pctUso >= 90 ? '#ef4444' : c.pctUso >= 70 ? '#f59e0b' : '#10b981'
          return (
            <div key={c.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl ${corBg(c.cor)} flex items-center justify-center`}>
                    <CreditCard size={14} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[13px] font-black text-gray-800">{c.nome}</p>
                    <p className="text-[8px] text-gray-400">
                      Vence {c.vencimento} · Fecha {c.fechamento}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-[11px] font-black ${f.saldo > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {fmtK(f.saldo || f.totalGasto)}
                  </p>
                  {c.limite > 0 && (
                    <div className="w-20 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${c.pctUso}%`, backgroundColor: barColor }} />
                    </div>
                  )}
                </div>
              </div>

              {f.gastos?.length > 0 && (
                <button
                  onClick={() => setExpandedId(isExpanded ? null : c.id)}
                  className="w-full mt-2 flex items-center justify-center gap-1 py-1.5 text-[8px] font-black text-gray-400 uppercase"
                >
                  {isExpanded ? 'Ocultar' : `Ver ${f.gastos.length} compra${f.gastos.length !== 1 ? 's' : ''}`}
                  {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                </button>
              )}

              {isExpanded && f.gastos?.slice(0, 5).map((g, i) => (
                <div key={i} className="flex items-center justify-between mt-2 pt-2 text-[10px] border-t border-gray-50">
                  <span className="text-gray-600 truncate flex-1">{g.descricao}</span>
                  <span className="text-rose-600 font-black">-{fmt(Math.abs(g.valor))}</span>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}