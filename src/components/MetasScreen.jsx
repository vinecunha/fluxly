import React, { useState, useMemo } from 'react'
import { Target, Plus, ChevronRight, TrendingUp, Trash2, Edit3, CircleDollarSign, Calendar, Archive, CheckCircle2, AlertCircle, X, Save } from 'lucide-react'

const fmt = (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

const formatDateToBR = (dateStr) => {
  if (!dateStr) return 'Sem prazo'
  if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) return dateStr
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return dateStr
}

const formatDateToUS = (dateStr) => {
  if (!dateStr) return ''
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr
  const parts = dateStr.split('/')
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`
  }
  return dateStr
}

function MetaCard({ meta, onDepositar, onEditar, onAjustarValor, onDelete, onArquivar, onAlterarPrazo }) {
  const [expanded, setExpanded] = useState(false)
  const [editando, setEditando] = useState(false)
  const [valor, setValor] = useState('')
  const [loading, setLoading] = useState(false)
  const [editandoPrazo, setEditandoPrazo] = useState(false)
  const [editandoValorAtual, setEditandoValorAtual] = useState(false)
  const [novoPrazo, setNovoPrazo] = useState(formatDateToUS(meta.prazo))
  const [novoValorAtual, setNovoValorAtual] = useState(meta.valor_atual || 0)
  const [formEdit, setFormEdit] = useState({
    nome: meta.nome,
    valor_objetivo: meta.valor_objetivo,
    categoria: meta.categoria || '',
    prazo: formatDateToUS(meta.prazo)
  })

  const progresso = meta.progresso || 0
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  
  const dataPrazo = meta.prazo ? new Date(meta.prazo + 'T12:00:00') : null
  const prazoValido = dataPrazo && !isNaN(dataPrazo.getTime())
  const prazoPassou = prazoValido && dataPrazo < hoje
  const diasRestantes = prazoValido && !prazoPassou 
    ? Math.ceil((dataPrazo - hoje) / (1000 * 60 * 60 * 24))
    : null
  
  const valorFalta = Math.max(meta.valor_objetivo - (meta.valor_atual || 0), 0)
  const precisaPorDia = (diasRestantes > 0 && valorFalta > 0) 
    ? valorFalta / diasRestantes 
    : null

  const estaConcluida = meta.concluida || progresso >= 100

  const handleDepositar = async () => {
    const v = parseFloat(String(valor).replace(',', '.'))
    if (!v || v <= 0) return

    setLoading(true)
    const result = await onDepositar(meta.id, v)
    setLoading(false)
    if (result?.success) {
      setValor('')
      setExpanded(false)
    }
  }

  const handleAjustarValorAtual = async () => {
    const v = parseFloat(String(novoValorAtual).replace(',', '.'))
    if (isNaN(v)) return

    setLoading(true)
    const result = await onAjustarValor(meta.id, v, meta.conta_id)
    setLoading(false)
    if (result?.success) {
      setEditandoValorAtual(false)
    }
  }

  const handleSalvarEdicao = async () => {
    const v = parseFloat(String(formEdit.valor_objetivo).replace(',', '.'))
    if (!formEdit.nome || !v) return

    setLoading(true)
    const result = await onEditar(meta.id, {
      nome: formEdit.nome,
      valor_objetivo: v,
      categoria: formEdit.categoria || null,
      prazo: formEdit.prazo || null
    })
    setLoading(false)
    if (result?.success) {
      setEditando(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Modo de edição */}
      {editando ? (
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[11px] font-black text-gray-500 uppercase">Editar Meta</h4>
            <button onClick={() => setEditando(false)} className="p-1">
              <X size={14} className="text-gray-400" />
            </button>
          </div>
          <input
            type="text"
            placeholder="Nome da meta"
            value={formEdit.nome}
            onChange={e => setFormEdit(f => ({ ...f, nome: e.target.value }))}
            className="w-full p-2 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold"
          />
          <input
            type="text"
            inputMode="decimal"
            placeholder="Valor objetivo"
            value={formEdit.valor_objetivo}
            onChange={e => setFormEdit(f => ({ ...f, valor_objetivo: e.target.value.replace(/[^0-9.,-]/g, '') }))}
            className="w-full p-2 rounded-xl bg-gray-50 border border-gray-200 text-sm"
          />
          <input
            type="date"
            value={formEdit.prazo}
            onChange={e => setFormEdit(f => ({ ...f, prazo: e.target.value }))}
            className="w-full p-2 rounded-xl bg-gray-50 border border-gray-200 text-sm"
          />
          <input
            type="text"
            placeholder="Categoria"
            value={formEdit.categoria}
            onChange={e => setFormEdit(f => ({ ...f, categoria: e.target.value }))}
            className="w-full p-2 rounded-xl bg-gray-50 border border-gray-200 text-sm"
          />
          <button
            onClick={handleSalvarEdicao}
            disabled={loading}
            className="w-full py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase disabled:opacity-40"
          >
            {loading ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      ) : (
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                <Target size={16} className="text-violet-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-gray-800 truncate">{meta.nome}</p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <p className="text-[9px] text-gray-400 font-bold uppercase">
                    {meta.categoria || 'Meta pessoal'}
                  </p>
                  {meta.conta_id && (
                    <span className="text-[7px] font-black bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full">
                      🔗 Vinculada
                    </span>
                  )}
                  {prazoPassou && !estaConcluida && (
                    <span className="text-[7px] font-black bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                      <AlertCircle size={8} /> Prazo expirado
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setEditando(true)} className="p-1.5 text-gray-300 hover:text-slate-500 transition-colors">
                <Edit3 size={12} />
              </button>
              <button onClick={() => onDelete(meta.id)} className="p-1.5 text-gray-300 hover:text-rose-500 transition-colors">
                <Trash2 size={12} />
              </button>
            </div>
          </div>

          <div className="space-y-1.5 mb-3">
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${progresso}%` }} />
            </div>
            <div className="flex justify-between text-[8px] font-black text-gray-400">
              <span>{progresso.toFixed(0)}% concluído</span>
              {prazoValido && !prazoPassou && diasRestantes !== null && (
                <span>{diasRestantes} {diasRestantes === 1 ? 'dia' : 'dias'} restantes</span>
              )}
            </div>
          </div>

          {/* Valor atual editável */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-black text-gray-500">Valor atual:</span>
              {editandoValorAtual ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={novoValorAtual}
                    onChange={e => setNovoValorAtual(e.target.value.replace(/[^0-9.,-]/g, ''))}
                    className="w-20 p-1 text-xs rounded bg-gray-50 border border-gray-200"
                  />
                  <button onClick={handleAjustarValorAtual} className="p-1 text-emerald-500">
                    <Save size={12} />
                  </button>
                  <button onClick={() => setEditandoValorAtual(false)} className="p-1 text-gray-400">
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-[11px] font-black text-gray-800">{fmt(meta.valor_atual || 0)}</span>
                  <button onClick={() => setEditandoValorAtual(true)} className="p-0.5 text-gray-300 hover:text-slate-500">
                    <Edit3 size={10} />
                  </button>
                </>
              )}
            </div>
            <span className="text-[10px] font-black text-gray-400">de {fmt(meta.valor_objetivo)}</span>
          </div>

          {/* Botões de ação */}
          {!estaConcluida && !prazoPassou && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="w-full flex items-center justify-center gap-1 py-2 bg-gray-50 rounded-xl text-[9px] font-black text-gray-500 uppercase active:bg-gray-100 transition-colors"
            >
              {expanded ? 'Ocultar' : 'Depositar'} <ChevronRight size={10} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
            </button>
          )}
        </div>
      )}

      {/* Expandido para depósito */}
      {expanded && !editando && !estaConcluida && !prazoPassou && (
        <div className="border-t border-gray-50 p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
          {precisaPorDia !== null && precisaPorDia > 0 && (
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
            <button onClick={() => onArquivar?.(meta.id)} className="p-1.5 text-gray-300 hover:text-blue-500 transition-colors" title="Arquivar">
              <Archive size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Prazo expirado */}
      {prazoPassou && !estaConcluida && !editando && (
        <div className="border-t border-amber-100 bg-amber-50 p-3 flex items-center justify-between">
          <p className="text-[8px] font-black text-amber-700">⏰ O prazo para esta meta expirou</p>
          <button onClick={() => onArquivar?.(meta.id)} className="text-[8px] font-black text-amber-600 underline">
            Arquivar
          </button>
        </div>
      )}

      {/* Meta concluída */}
      {estaConcluida && !editando && (
        <div className="border-t border-emerald-100 bg-emerald-50 p-3 flex items-center justify-between">
          <p className="text-[9px] font-black text-emerald-600">🎉 Meta alcançada!</p>
          <button onClick={() => onArquivar?.(meta.id)} className="text-[8px] font-black text-emerald-500 underline">
            Arquivar
          </button>
        </div>
      )}
    </div>
  )
}

export function MetasScreen({ metas = [], onCreate, onDepositar, onEditar, onAjustarValor, onDelete, onArquivar, onAlterarPrazo, loading: loadingMetas }) {
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
    await onCreate(nome, v, prazo || null, categoria || null)
    setNome('')
    setValor('')
    setPrazo('')
    setCategoria('')
    setShowForm(false)
    setSaving(false)
  }

  const metasAtivas = metas.filter(m => !m.concluida && (m.progresso || 0) < 100)
  const metasConcluidas = metas.filter(m => m.concluida || (m.progresso || 0) >= 100)

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
            <MetaCard
              key={meta.id}
              meta={meta}
              onDepositar={onDepositar}
              onEditar={onEditar}
              onAjustarValor={onAjustarValor}
              onDelete={onDelete}
              onArquivar={onArquivar}
              onAlterarPrazo={onAlterarPrazo}
            />
          ))}
        </div>
      )}

      {metasConcluidas.length > 0 && (
        <div className="space-y-3">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Concluídas / Arquivadas</p>
          {metasConcluidas.map(meta => (
            <MetaCard
              key={meta.id}
              meta={meta}
              onDepositar={onDepositar}
              onEditar={onEditar}
              onAjustarValor={onAjustarValor}
              onDelete={onDelete}
              onArquivar={onArquivar}
              onAlterarPrazo={onAlterarPrazo}
            />
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