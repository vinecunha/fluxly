import React, { useState, useEffect, useMemo } from 'react'
import { X, Repeat, Layers, PiggyBank, CreditCard } from 'lucide-react'
import { ActionConfirmationModal } from './BillsList'

const getToday = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })

const tiposFluxo = [
  { id: 'renda',             label: 'Renda',    icon: '💰' },
  { id: 'gasto_diario',      label: 'Gasto',    icon: '💸' },
  { id: 'reserva',           label: 'Reserva',  icon: '🏦' },
  { id: 'fixa',              label: 'Fixa',     icon: '🏠' },
  { id: 'esporadica',        label: 'Extra',    icon: '⚡' },
  { id: 'pagamento_cartao',  label: 'Fatura',   icon: '💳' },
]

const categorias = [
  'Aplicativos', 'Assinaturas', 'Carro', 'Casa', 'Combustível',
  'Educação', 'Empréstimos', 'Lazer', 'Mercado', 'Outros', 'Renda', 'Saúde',
]

const subcategoriasRenda  = ['Salário', 'Freelance', 'Aplicativos', 'Vendas', 'Particular', 'Gorjeta']
const subcategoriasApp    = ['Uber', '99', 'iFood', 'Outros']
const bancosReserva       = ['Nubank', 'Inter', 'CDB', 'Poupança', 'Outros']

const defaultForm = {
  descricao: '', valor: '', tipo: 'renda',
  categoria: 'Renda', subcategoria: '', destino_reserva: '',
  data: getToday(), repetir: 'nao', recorrencia_limite: '',
  cartao_id: null,
}

export const TransactionModal = ({ isOpen, onClose, onSave, initialData, transactions = [], cartoes = [] }) => {
  const [form, setForm]               = useState(defaultForm)
  const [confirmTarget, setConfirmTarget] = useState(null)

  const sugestoes = useMemo(() =>
    [...new Set(transactions.map(t => t.descricao))].sort(),
    [transactions]
  )

  useEffect(() => {
    if (!isOpen) return
    if (initialData) {
      setForm({
        descricao:          initialData.descricao || '',
        valor:              initialData.valor || '',
        tipo:               initialData.tipo || 'renda',
        categoria:          initialData.categoria || (initialData.tipo === 'renda' ? 'Renda' : 'Outros'),
        subcategoria:       initialData.subcategoria || '',
        destino_reserva:    initialData.destino_reserva || '',
        data:               initialData.data || getToday(),
        repetir:            initialData.repetir || 'nao',
        recorrencia_limite: initialData.recorrencia_limite || '',
        cartao_id:          initialData.cartao_id || null,
      })
    } else {
      setForm({ ...defaultForm, data: getToday() })
    }
  }, [isOpen, initialData])

  if (!isOpen) return null

  const isPagamentoCartao = form.tipo === 'pagamento_cartao'
  const showCartaoSelect  = ['gasto_diario', 'fixa', 'esporadica', 'pagamento_cartao'].includes(form.tipo) && cartoes.length > 0
  const dateLabel         = (form.tipo === 'fixa' || form.tipo === 'esporadica') ? 'Vencimento' : 'Data'

  const handleSubmit = (e) => {
    e.preventDefault()
    if (initialData?.recorrencia_id) {
      setConfirmTarget({ bill: initialData, type: 'edit' })
    } else {
      onSave(form, false)
    }
  }

  const handleFinalConfirm = (allSeries) => {
    onSave(form, allSeries)
    setConfirmTarget(null)
  }

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }))

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white w-full max-w-lg rounded-t-2xl p-8 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[95vh] overflow-y-auto no-scrollbar">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-gray-800 tracking-tight">
              {initialData ? 'Editar Registro' : 'Novo Registro'}
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Tipo de Fluxo</label>
              <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
                {tiposFluxo.map(t => (
                  <button
                    key={t.id} type="button"
                    onClick={() => setForm(f => ({
                      ...f,
                      tipo: t.id,
                      categoria:       t.id === 'renda' ? 'Renda' : t.id === 'reserva' ? 'Reserva' : t.id === 'pagamento_cartao' ? 'Cartão' : 'Outros',
                      subcategoria:    '',
                      destino_reserva: '',
                      cartao_id:       ['gasto_diario','fixa','esporadica','pagamento_cartao'].includes(t.id) ? f.cartao_id : null,
                    }))}
                    className={`py-3 rounded-2xl flex flex-col items-center gap-1 transition-all border ${
                      form.tipo === t.id
                        ? 'bg-slate-900 border-slate-600 text-white shadow-md'
                        : 'bg-gray-50 border-transparent text-gray-400'
                    }`}
                  >
                    <span className="text-sm">{t.icon}</span>
                    <span className="text-[8px] font-black uppercase">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {showCartaoSelect && (
              <div className="space-y-2 animate-in fade-in duration-200">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1 flex items-center gap-1">
                  <CreditCard size={10} />
                  {isPagamentoCartao ? 'Qual fatura está pagando?' : 'Pagar com cartão? (opcional)'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {!isPagamentoCartao && (
                    <button
                      type="button"
                      onClick={() => setField('cartao_id', null)}
                      className={`py-2.5 rounded-2xl text-[10px] font-black uppercase transition-all border ${
                        form.cartao_id === null
                          ? 'bg-slate-900 border-slate-700 text-white shadow-sm'
                          : 'bg-gray-50 border-transparent text-gray-400'
                      }`}
                    >
                      Dinheiro / Débito
                    </button>
                  )}
                  {cartoes.map(c => (
                    <button
                      key={c.id} type="button"
                      onClick={() => setField('cartao_id', c.id)}
                      className={`py-2.5 rounded-2xl text-[10px] font-black uppercase transition-all border ${
                        form.cartao_id === c.id
                          ? 'bg-slate-900 border-slate-700 text-white shadow-sm'
                          : 'bg-gray-50 border-transparent text-gray-400'
                      }`}
                    >
                      💳 {c.nome}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {form.tipo === 'renda' && (
              <div className="space-y-2 animate-in fade-in duration-300">
                <label className="text-[10px] font-black uppercase text-emerald-600 ml-1 flex items-center gap-1">
                  <Layers size={10} /> Origem da Renda
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {subcategoriasRenda.map(sub => (
                    <button key={sub} type="button" onClick={() => setField('subcategoria', sub)}
                      className={`py-2.5 rounded-2xl text-[9px] font-black uppercase transition-all border ${
                        form.subcategoria === sub
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm ring-1 ring-emerald-500'
                          : 'bg-gray-50 border-transparent text-gray-500'
                      }`}>{sub}</button>
                  ))}
                </div>
              </div>
            )}

            {!['renda', 'reserva', 'pagamento_cartao'].includes(form.tipo) && (
              <div className="space-y-2 animate-in fade-in duration-300">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Categoria</label>
                <div className="grid grid-cols-3 gap-2">
                  {categorias.map(cat => (
                    <button key={cat} type="button"
                      onClick={() => setForm(f => ({ ...f, categoria: cat, subcategoria: cat === 'Aplicativos' ? 'Uber' : '' }))}
                      className={`py-2.5 rounded-2xl text-[9px] font-black uppercase transition-all border ${
                        form.categoria === cat
                          ? 'bg-white border-slate-500 text-slate-600 shadow-sm ring-1 ring-slate-500'
                          : 'bg-gray-50 border-transparent text-gray-500'
                      }`}>{cat}</button>
                  ))}
                </div>
              </div>
            )}

            {form.categoria === 'Aplicativos' && !['reserva', 'pagamento_cartao'].includes(form.tipo) && (
              <div className="space-y-2 animate-in zoom-in-95 duration-200">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1 flex items-center gap-1">
                  <Layers size={10} /> Qual aplicativo?
                </label>
                <div className="flex gap-2">
                  {subcategoriasApp.map(sub => (
                    <button key={sub} type="button" onClick={() => setField('subcategoria', sub)}
                      className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all border ${
                        form.subcategoria === sub
                          ? 'bg-slate-100 border-slate-300 text-slate-700'
                          : 'bg-white border-gray-100 text-gray-400'
                      }`}>{sub}</button>
                  ))}
                </div>
              </div>
            )}

            {form.tipo === 'reserva' && (
              <div className="space-y-2 animate-in zoom-in-95 duration-200">
                <label className="text-[10px] font-black uppercase text-blue-600 ml-1 flex items-center gap-1">
                  <PiggyBank size={12} /> Onde está guardado?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {bancosReserva.map(banco => (
                    <button key={banco} type="button" onClick={() => setField('destino_reserva', banco)}
                      className={`py-3 rounded-2xl text-[10px] font-black uppercase transition-all border ${
                        form.destino_reserva === banco
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                          : 'bg-blue-50 border-transparent text-blue-400'
                      }`}>{banco}</button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-1">
                {form.tipo === 'reserva'           ? 'Nome da Caixinha (Objetivo)'
                 : form.tipo === 'pagamento_cartao' ? 'Descrição (ex: Fatura Março)'
                 : 'Descrição'}
              </label>
              <input
                type="text" list="descricoes-comuns" required
                placeholder={
                  form.tipo === 'reserva'            ? 'Ex: Viagem, Emergência...'
                  : form.tipo === 'pagamento_cartao' ? 'Ex: Fatura Nubank Março...'
                  : 'Ex: Mercado mensal...'
                }
                className="w-full p-4 rounded-2xl bg-gray-50 ring-1 ring-gray-200 outline-none focus:ring-2 focus:ring-slate-500 font-medium"
                value={form.descricao}
                onChange={e => setField('descricao', e.target.value)}
              />
              <datalist id="descricoes-comuns">
                {sugestoes.map((s, i) => <option key={i} value={s} />)}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Valor</label>
                <input
                  type="text" inputMode="decimal" placeholder="0,00" required
                  className="w-full p-4 rounded-2xl bg-gray-50 ring-1 ring-gray-200 outline-none text-lg font-black focus:ring-2 focus:ring-slate-500"
                  value={form.valor}
                  onChange={e => setField('valor', e.target.value.replace(/[^0-9.,-]/g, ''))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">{dateLabel}</label>
                <input
                  type="date" required
                  className="w-full p-4 rounded-2xl bg-gray-50 ring-1 ring-gray-200 outline-none text-sm font-bold focus:ring-2 focus:ring-slate-500"
                  value={form.data}
                  onChange={e => setField('data', e.target.value)}
                />
              </div>
            </div>

            {!isPagamentoCartao && (
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Repeat size={14} className="text-gray-400" />
                  <span className="text-[10px] font-black uppercase text-gray-400">Recorrência</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <select
                    className="w-full p-3 rounded-2xl bg-white border-none ring-1 ring-gray-200 outline-none focus:ring-2 focus:ring-slate-500 text-xs font-bold text-gray-600"
                    value={form.repetir}
                    onChange={e => setField('repetir', e.target.value)}
                  >
                    <option value="nao">Não repetir</option>
                    <option value="semanal">Semanalmente</option>
                    <option value="mensal">Mensalmente</option>
                  </select>
                  {form.repetir !== 'nao' && (
                    <div className="animate-in fade-in zoom-in duration-200">
                      <input
                        type="date"
                        className="w-full p-3 rounded-2xl bg-white border-none ring-1 ring-gray-200 outline-none focus:ring-2 focus:ring-slate-500 text-[10px] font-bold"
                        value={form.recorrencia_limite}
                        onChange={e => setField('recorrencia_limite', e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            <button type="submit" className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-lg shadow-lg active:scale-[0.98] transition-all mt-4">
              {initialData ? 'Salvar Alterações' : 'Confirmar Lançamento'}
            </button>
          </form>
        </div>
      </div>

      {confirmTarget && (
        <ActionConfirmationModal
          target={confirmTarget}
          onClose={() => setConfirmTarget(null)}
          onConfirm={handleFinalConfirm}
        />
      )}
    </>
  )
}