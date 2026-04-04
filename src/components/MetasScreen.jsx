import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Target, Plus, ChevronRight, Trash2, Edit3, Archive, AlertCircle, X, Save, CheckCircle2, PiggyBank, TrendingUp, Calendar, Settings, Zap } from 'lucide-react'

const fmt = (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

const formatDateToUS = (dateStr) => {
  if (!dateStr) return ''
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr
  const parts = dateStr.split('/')
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`
  return dateStr
}

// ─── Componente de Meta Diária/Mensal ────────────────────────────────────────
function DailyGoalCard({ rendaHoje, onUpdateGoal, metas }) {
  const [showSettings, setShowSettings] = useState(false)
  const [dailyGoal, setDailyGoal] = useState(() => {
    const saved = localStorage.getItem('fluxly_daily_goal')
    return saved ? parseFloat(saved) : 0
  })
  const [tempGoal, setTempGoal] = useState(dailyGoal.toString())

  // Calcular necessidade baseada nas metas ativas
  const necessidadeDiaria = useMemo(() => {
    const metasAtivas = metas.filter(m => !m.concluida && (m.progresso || 0) < 100)
    if (metasAtivas.length === 0) return 0
    
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    
    let somaNecessidades = 0
    
    metasAtivas.forEach(meta => {
      // Se não tem prazo, considerar o fim do mês atual
      let dataPrazo = meta.prazo ? new Date(meta.prazo + 'T12:00:00') : null
      
      if (!dataPrazo || isNaN(dataPrazo.getTime())) {
        // Sem prazo: usar último dia do mês atual
        dataPrazo = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
        dataPrazo.setHours(0, 0, 0, 0)
      }
      
      // Se o prazo já passou, ignorar (ou considerar 0)
      if (dataPrazo < hoje) return
      
      const diasRestantes = Math.max(Math.ceil((dataPrazo - hoje) / (1000 * 60 * 60 * 24)), 1)
      const falta = Math.max(meta.valor_objetivo - (meta.valor_atual || 0), 0)
      const necessidadeDiariaMeta = falta / diasRestantes
      
      somaNecessidades += necessidadeDiariaMeta
    })
    
    return somaNecessidades
  }, [metas])

  // Determinar qual meta está sendo usada
  const metaAtual = dailyGoal > 0 ? dailyGoal : necessidadeDiaria
  const progresso = rendaHoje > 0 ? Math.min((rendaHoje / metaAtual) * 100, 100) : 0
  const falta = Math.max(metaAtual - rendaHoje, 0)
  const metaAlcancada = rendaHoje >= metaAtual && metaAtual > 0

  const salvarMeta = () => {
    let valor = parseFloat(String(tempGoal).replace(',', '.'))
    if (isNaN(valor)) valor = 0
    setDailyGoal(valor)
    localStorage.setItem('fluxly_daily_goal', valor.toString())
    setShowSettings(false)
    onUpdateGoal?.(valor)
  }

  const usarNecessidade = () => {
    setDailyGoal(necessidadeDiaria)
    localStorage.setItem('fluxly_daily_goal', necessidadeDiaria.toString())
    setShowSettings(false)
    onUpdateGoal?.(necessidadeDiaria)
  }

  const limparMeta = () => {
    setDailyGoal(0)
    localStorage.removeItem('fluxly_daily_goal')
    setShowSettings(false)
    onUpdateGoal?.(0)
  }

  return (
    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target size={18} className="text-white/80" />
          <p className="text-[9px] font-black uppercase tracking-widest text-white/80">Meta de Ganho Diário</p>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
        >
          <Settings size={14} />
        </button>
      </div>

      <div className="flex items-end justify-between mb-2">
        <div>
          <p className="text-3xl font-black">{fmt(rendaHoje)}</p>
          <p className="text-[8px] text-white/60 mt-0.5">ganhos hoje</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-black">{fmt(metaAtual)}</p>
          <p className="text-[8px] text-white/60">
            {dailyGoal > 0 ? 'meta personalizada' : 'necessidade das metas'}
          </p>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="space-y-1 mb-3">
        <div className="h-2 w-full bg-white/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-400 rounded-full transition-all duration-700"
            style={{ width: `${Math.min(progresso, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-[8px] font-black text-white/60">
          <span>{progresso.toFixed(0)}% concluído</span>
          {falta > 0 && <span>faltam {fmt(falta)}</span>}
          {metaAlcancada && <span className="text-emerald-300">✓ Meta alcançada!</span>}
        </div>
      </div>

      {/* Painel de configuração */}
      {showSettings && (
        <div className="mt-3 pt-3 border-t border-white/20 space-y-2 animate-in fade-in duration-200">
          <p className="text-[8px] font-black text-white/70 uppercase">Definir meta diária</p>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="decimal"
              placeholder="Ex: 500,00"
              value={tempGoal}
              onChange={e => setTempGoal(e.target.value.replace(/[^0-9.,-]/g, ''))}
              className="flex-1 p-2 rounded-xl bg-white text-gray-800 text-sm font-bold outline-none"
            />
            <button
              onClick={salvarMeta}
              className="px-3 py-2 bg-white/20 rounded-xl text-[9px] font-black uppercase hover:bg-white/30 transition-colors"
            >
              Salvar
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={usarNecessidade}
              className="flex-1 py-2 bg-white/10 rounded-xl text-[8px] font-black uppercase hover:bg-white/20 transition-colors"
            >
              Usar necessidade ({fmt(necessidadeDiaria)}/dia)
            </button>
            <button
              onClick={limparMeta}
              className="px-3 py-2 bg-white/10 rounded-xl text-[8px] font-black uppercase hover:bg-white/20 transition-colors"
            >
              Limpar
            </button>
          </div>
          <p className="text-[7px] text-white/50 mt-1">
            💡 A necessidade é calculada com base nas suas metas ativas
          </p>
        </div>
      )}
    </div>
  )
}

// ─── SwipeableMetaCard ──────────────────────────────────────────────────────
function SwipeableMetaCard({ meta, onDepositar, onEditar, onAjustarValor, onDelete, onArquivar }) {
  // swipe state
  const startX    = useRef(null)
  const startY    = useRef(null)
  const [offset, setOffset]       = useState(0)
  const [swiping, setSwiping]     = useState(false)
  const [pending, setPending]     = useState(false)
  const [direction, setDirection] = useState(null)
  const THRESHOLD   = 80
  const SNAP_DELETE = 120

  // card state
  const [expanded, setExpanded]                 = useState(false)
  const [editando, setEditando]                 = useState(false)
  const [depositando, setDepositando]           = useState(false)
  const [loadingDeposit, setLoadingDeposit]     = useState(false)
  const [valorDeposito, setValorDeposito]       = useState('')
  const [editandoValorAtual, setEditandoValorAtual] = useState(false)
  const [novoValorAtual, setNovoValorAtual]     = useState(meta.valor_atual || 0)
  const [loadingEdit, setLoadingEdit]           = useState(false)
  const [formEdit, setFormEdit] = useState({
    nome:           meta.nome,
    valor_objetivo: meta.valor_objetivo,
    categoria:      meta.categoria || '',
    prazo:          formatDateToUS(meta.prazo),
  })

  const haptic = () => { try { navigator.vibrate?.(30) } catch(_){} }

  // ── Swipe handlers ──
  const handleTouchStart = (e) => {
    if (editando || expanded) return
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
    setSwiping(true)
    setPending(false)
  }

  const handleTouchMove = (e) => {
    if (startX.current === null) return
    const dx = e.touches[0].clientX - startX.current
    const dy = e.touches[0].clientY - startY.current
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dx) < 10) return
    const clamped = Math.max(-SNAP_DELETE, Math.min(SNAP_DELETE, dx))
    setOffset(clamped)
    setDirection(clamped < 0 ? 'left' : clamped > 0 ? 'right' : null)
    if (Math.abs(clamped) === SNAP_DELETE) haptic()
  }

  const handleTouchEnd = () => {
    setSwiping(false)
    if (offset > THRESHOLD) {
      setOffset(0); setDirection(null)
      setEditando(true)
    } else if (offset < -THRESHOLD) {
      setOffset(-SNAP_DELETE)
      setPending(true)
      haptic()
    } else {
      setOffset(0); setDirection(null)
    }
    startX.current = null; startY.current = null
  }

  const confirmDelete = () => {
    haptic(); setPending(false); setOffset(0); setDirection(null)
    onDelete(meta.id)
  }
  const cancelDelete = () => { setPending(false); setOffset(0); setDirection(null) }

  // ── Cálculos ──
  const progresso     = meta.progresso || 0
  const hoje          = new Date(); hoje.setHours(0,0,0,0)
  const dataPrazo     = meta.prazo ? new Date(meta.prazo + 'T12:00:00') : null
  const prazoValido   = dataPrazo && !isNaN(dataPrazo.getTime())
  const prazoPassou   = prazoValido && dataPrazo < hoje
  const diasRestantes = prazoValido && !prazoPassou
    ? Math.ceil((dataPrazo - hoje) / (1000*60*60*24)) : null
  const valorFalta    = Math.max(meta.valor_objetivo - (meta.valor_atual || 0), 0)
  const precisaPorDia = diasRestantes > 0 && valorFalta > 0 ? valorFalta / diasRestantes : null
  const estaConcluida = meta.concluida || progresso >= 100

  // ── Ações ──
  const handleDepositar = async () => {
    const v = parseFloat(String(valorDeposito).replace(',', '.'))
    if (!v || v <= 0) return
    setLoadingDeposit(true)
    const result = await onDepositar(meta.id, v)
    setLoadingDeposit(false)
    if (result?.success) { setValorDeposito(''); setExpanded(false) }
  }

  const handleAjustarValorAtual = async () => {
    const v = parseFloat(String(novoValorAtual).replace(',', '.'))
    if (isNaN(v)) return
    setLoadingEdit(true)
    const result = await onAjustarValor(meta.id, v, meta.conta_id)
    setLoadingEdit(false)
    if (result?.success) setEditandoValorAtual(false)
  }

  const handleSalvarEdicao = async () => {
    const v = parseFloat(String(formEdit.valor_objetivo).replace(',', '.'))
    if (!formEdit.nome || !v) return
    setLoadingEdit(true)
    const result = await onEditar(meta.id, {
      nome:           formEdit.nome,
      valor_objetivo: v,
      categoria:      formEdit.categoria || null,
      prazo:          formEdit.prazo || null,
    })
    setLoadingEdit(false)
    if (result?.success) setEditando(false)
  }

  // ── Render ──
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

      {/* Modo edição (abre como painel interno, sem swipe) */}
      {editando ? (
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Editar Meta</h4>
            <button onClick={() => setEditando(false)} className="p-1 text-gray-300 hover:text-gray-500">
              <X size={14} />
            </button>
          </div>
          <input
            type="text"
            placeholder="Nome da meta"
            value={formEdit.nome}
            onChange={e => setFormEdit(f => ({ ...f, nome: e.target.value }))}
            className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold outline-none focus:ring-2 focus:ring-slate-300"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text" inputMode="decimal"
              placeholder="Valor objetivo"
              value={formEdit.valor_objetivo}
              onChange={e => setFormEdit(f => ({ ...f, valor_objetivo: e.target.value.replace(/[^0-9.,-]/g, '') }))}
              className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-slate-300"
            />
            <input
              type="date"
              value={formEdit.prazo}
              onChange={e => setFormEdit(f => ({ ...f, prazo: e.target.value }))}
              className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>
          <input
            type="text"
            placeholder="Categoria (opcional)"
            value={formEdit.categoria}
            onChange={e => setFormEdit(f => ({ ...f, categoria: e.target.value }))}
            className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-slate-300"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSalvarEdicao}
              disabled={loadingEdit}
              className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase disabled:opacity-40 active:scale-95 transition-all"
            >
              {loadingEdit ? 'Salvando...' : 'Salvar alterações'}
            </button>
            <button
              onClick={() => setEditando(false)}
              className="px-4 py-3 bg-gray-100 text-gray-500 rounded-xl font-black text-[10px] uppercase active:scale-95 transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>

      ) : (
        /* ── Modo normal: swipeable ── */
        <div className="relative overflow-hidden group">

          {/* BG esquerda — editar */}
          <div
            className={`absolute inset-y-0 left-0 flex items-center px-5 transition-opacity duration-150 ${direction==='right' ? 'opacity-100' : 'opacity-0'}`}
            style={{ backgroundColor: '#1e293b', width: Math.max(offset, 0) }}
          >
            <span className="text-[10px] font-black text-white uppercase whitespace-nowrap">✏️ Editar</span>
          </div>

          {/* BG direita — deletar */}
          <div
            className={`absolute inset-y-0 right-0 flex items-center justify-end px-5 transition-all duration-150 ${direction==='left' ? 'opacity-100' : 'opacity-0'}`}
            style={{ backgroundColor: pending ? '#b91c1c' : '#ef4444', width: Math.abs(Math.min(offset, 0)) }}
          >
            {pending
              ? <div className="flex items-center gap-2">
                  <button
                    onTouchEnd={e => { e.stopPropagation(); confirmDelete() }}
                    onClick={confirmDelete}
                    className="text-[10px] font-black text-white bg-white/20 px-2 py-1 rounded-lg whitespace-nowrap active:scale-95"
                  >✓ Confirmar</button>
                  <button
                    onTouchEnd={e => { e.stopPropagation(); cancelDelete() }}
                    onClick={cancelDelete}
                    className="text-[10px] font-black text-white/70 whitespace-nowrap active:scale-95"
                  >✕</button>
                </div>
              : <span className="text-[10px] font-black text-white uppercase whitespace-nowrap">🗑️ Excluir</span>
            }
          </div>

          {/* Conteúdo principal */}
          <div
            className={`relative bg-white px-4 pt-4 pb-3 ${swiping ? '' : 'transition-transform duration-300'}`}
            style={{ transform: `translateX(${offset}px)` }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Header: ícone + info + botões desktop */}
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
                    {diasRestantes !== null && !prazoPassou && (
                      <span className="text-[7px] font-bold text-gray-400">
                        {diasRestantes} {diasRestantes === 1 ? 'dia' : 'dias'} restantes
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Ícones de ação — visíveis no hover (desktop), ocultos no mobile */}
              <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button
                  onClick={() => setEditando(true)}
                  className="p-1.5 rounded-xl text-gray-300 hover:text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={() => onDelete(meta.id)}
                  className="p-1.5 rounded-xl text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Barra de progresso */}
            <div className="space-y-1 mb-3">
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(progresso, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[8px] font-black text-gray-400">
                <span>{progresso.toFixed(0)}% concluído</span>
              </div>
            </div>

            {/* Valor atual editável inline */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black text-gray-500">Atual:</span>
                {editandoValorAtual ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text" inputMode="decimal"
                      value={novoValorAtual}
                      onChange={e => setNovoValorAtual(e.target.value.replace(/[^0-9.,-]/g, ''))}
                      className="w-24 p-1 text-xs rounded-lg bg-gray-50 border border-gray-200 outline-none"
                    />
                    <button onClick={handleAjustarValorAtual} disabled={loadingEdit} className="p-1 text-emerald-500 disabled:opacity-40">
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

            {/* Botão depositar — só se não concluída/expirada */}
            {!estaConcluida && !prazoPassou && (
              <button
                onClick={() => setExpanded(e => !e)}
                className="w-full flex items-center justify-center gap-1 py-2 bg-gray-50 rounded-xl text-[9px] font-black text-gray-500 uppercase active:bg-gray-100 transition-colors"
              >
                {expanded ? 'Ocultar' : <><PiggyBank size={11} /> Depositar</>}
                <ChevronRight size={10} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
              </button>
            )}
          </div>

          {/* Painel depósito */}
          {expanded && !editando && !estaConcluida && !prazoPassou && (
            <div className="border-t border-gray-50 px-4 pb-4 pt-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
              {precisaPorDia !== null && precisaPorDia > 0 && (
                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-[8px] font-black text-blue-600 uppercase">Precisa guardar por dia</p>
                  <p className="text-lg font-black text-blue-700">{fmt(precisaPorDia)}</p>
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text" inputMode="decimal"
                  placeholder="Quanto quer guardar"
                  value={valorDeposito}
                  onChange={e => setValorDeposito(e.target.value.replace(/[^0-9.,-]/g, ''))}
                  className="flex-1 p-3 rounded-xl bg-gray-50 ring-1 ring-gray-200 outline-none text-sm font-black focus:ring-2 focus:ring-violet-400"
                />
                <button
                  onClick={handleDepositar}
                  disabled={loadingDeposit || !valorDeposito}
                  className="px-4 bg-violet-600 text-white rounded-xl font-black text-[10px] uppercase disabled:opacity-40 active:scale-95 transition-all"
                >
                  {loadingDeposit ? '...' : 'Guardar'}
                </button>
              </div>
              <div className="flex justify-end">
                <button onClick={() => onArquivar?.(meta.id)} title="Arquivar"
                  className="p-1.5 text-gray-300 hover:text-blue-500 transition-colors"
                >
                  <Archive size={12} />
                </button>
              </div>
            </div>
          )}

          {/* Prazo expirado */}
          {prazoPassou && !estaConcluida && !editando && (
            <div className="border-t border-amber-100 bg-amber-50 px-4 py-2.5 flex items-center justify-between">
              <p className="text-[8px] font-black text-amber-700">⏰ O prazo para esta meta expirou</p>
              <button onClick={() => onArquivar?.(meta.id)} className="text-[8px] font-black text-amber-600 underline">
                Arquivar
              </button>
            </div>
          )}

          {/* Meta concluída */}
          {estaConcluida && !editando && (
            <div className="border-t border-emerald-100 bg-emerald-50 px-4 py-2.5 flex items-center justify-between">
              <p className="text-[9px] font-black text-emerald-600 flex items-center gap-1">
                <CheckCircle2 size={11} /> Meta alcançada!
              </p>
              <button onClick={() => onArquivar?.(meta.id)} className="text-[8px] font-black text-emerald-500 underline">
                Arquivar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── MetasScreen ────────────────────────────────────────────────────────────
export function MetasScreen({ 
  metas = [], 
  onCreate, 
  onDepositar, 
  onEditar, 
  onAjustarValor, 
  onDelete, 
  onArquivar, 
  onAlterarPrazo, 
  loading: loadingMetas,
  rendaHoje = 0
}) {
  const [showForm, setShowForm] = useState(false)
  const [nome, setNome]         = useState('')
  const [valor, setValor]       = useState('')
  const [prazo, setPrazo]       = useState('')
  const [categoria, setCategoria] = useState('')
  const [saving, setSaving]     = useState(false)

  const handleCreate = async () => {
    const v = parseFloat(String(valor).replace(',', '.'))
    if (!nome || !v || v <= 0) return
    setSaving(true)
    await onCreate(nome, v, prazo || null, categoria || null)
    setNome(''); setValor(''); setPrazo(''); setCategoria('')
    setShowForm(false)
    setSaving(false)
  }

  const metasAtivas     = metas.filter(m => !m.concluida && (m.progresso || 0) < 100)
  const metasConcluidas = metas.filter(m =>  m.concluida || (m.progresso || 0) >= 100)

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
          {[1,2].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 h-28" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
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

      {/* Card de Meta Diária */}
      <DailyGoalCard
        rendaHoje={rendaHoje}
        onUpdateGoal={() => {}}
        metas={metas}
      />

      {/* Formulário de criação */}
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
              type="text" inputMode="decimal"
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

      {/* Metas ativas */}
      {metasAtivas.length > 0 && (
        <div className="space-y-3">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Em andamento</p>
          {metasAtivas.map(meta => (
            <SwipeableMetaCard
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

      {/* Metas concluídas */}
      {metasConcluidas.length > 0 && (
        <div className="space-y-3">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Concluídas / Arquivadas</p>
          {metasConcluidas.map(meta => (
            <SwipeableMetaCard
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

      {/* Empty state */}
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