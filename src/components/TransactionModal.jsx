import React, { useState, useEffect } from 'react'
import { X, Calendar as CalendarIcon, Repeat } from 'lucide-react'

export const TransactionModal = ({ isOpen, onClose, onSave, initialData, transactions = [] }) => {
  const today = new Date().toISOString().split('T')[0]
  
  const [form, setForm] = useState({ 
    descricao: '', 
    valor: '', 
    tipo: 'renda',
    data: today,
    repetir: 'nao', // nao, semanal, mensal
    recorrencia_limite: '' // data final ou vazio para indefinido
  })

  const sugestoes = [...new Set(transactions.map(t => t.descricao))].sort()

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({
          descricao: initialData.descricao || '',
          valor: initialData.valor || '',
          tipo: initialData.tipo || 'renda',
          data: initialData.data || today,
          repetir: initialData.repetir || 'nao',
          recorrencia_limite: initialData.recorrencia_limite || ''
        })
      } else {
        setForm({ descricao: '', valor: '', tipo: 'renda', data: today, repetir: 'nao', recorrencia_limite: '' })
      }
    }
  }, [isOpen, initialData, today])

  if (!isOpen) return null

  const dateLabel = (form.tipo === 'fixa' || form.tipo === 'esporadica') 
    ? "Data de Vencimento" 
    : "Data do Lançamento"

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-t-[2rem] sm:rounded-[2rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-gray-800 tracking-tight">
            {initialData ? 'Editar Registro' : 'Novo Registro'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Categoria */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Categoria</label>
            <select 
              className="w-full p-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-200 outline-none focus:ring-2 focus:ring-indigo-500 appearance-none font-bold text-gray-700"
              value={form.tipo}
              onChange={e => setForm({...form, tipo: e.target.value})}
            >
              <option value="renda">💰 Renda Diária</option>
              <option value="gasto_diario">💸 Gasto Diário</option>
              <option value="fixa">🏠 Conta Fixa (Mensal)</option>
              <option value="esporadica">⚡ Conta Esporádica</option>
            </select>
          </div>

          {/* Descrição com Autocomplete */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Descrição</label>
            <input 
              type="text" list="descricoes-comuns" placeholder="Ex: Mercado, Uber, Aluguel..." required
              className="w-full p-4 rounded-2xl bg-gray-50 ring-1 ring-gray-200 outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.descricao}
              onChange={e => setForm({...form, descricao: e.target.value})}
            />
            <datalist id="descricoes-comuns">
              {sugestoes.map((s, i) => <option key={i} value={s} />)}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Valor</label>
              <input 
                type="number" step="0.01" placeholder="0,00" required
                className="w-full p-4 rounded-2xl bg-gray-50 ring-1 ring-gray-200 outline-none text-lg font-bold focus:ring-2 focus:ring-indigo-500"
                value={form.valor}
                onChange={e => setForm({...form, valor: e.target.value})}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-1">{dateLabel}</label>
              <input 
                type="date" required
                className="w-full p-4 rounded-2xl bg-gray-50 ring-1 ring-gray-200 outline-none text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                value={form.data}
                onChange={e => setForm({...form, data: e.target.value})}
              />
            </div>
          </div>

          {/* Seção de Recorrência */}
          <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Repeat size={14} className="text-indigo-600" />
              <span className="text-[10px] font-black uppercase text-indigo-600">Recorrência</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <select 
                className="w-full p-3 rounded-xl bg-white border-none ring-1 ring-indigo-100 outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-bold text-gray-600"
                value={form.repetir}
                onChange={e => setForm({...form, repetir: e.target.value})}
              >
                <option value="nao">Não repetir</option>
                <option value="semanal">Semanalmente</option>
                <option value="mensal">Mensalmente</option>
              </select>

              {form.repetir !== 'nao' && (
                <div className="animate-in fade-in zoom-in duration-200">
                  <input 
                    type="date"
                    className="w-full p-3 rounded-xl bg-white border-none ring-1 ring-indigo-100 outline-none focus:ring-2 focus:ring-indigo-500 text-[10px] font-bold"
                    value={form.recorrencia_limite}
                    title="Repetir até qual data?"
                    onChange={e => setForm({...form, recorrencia_limite: e.target.value})}
                  />
                  <p className="text-[8px] text-indigo-400 mt-1 ml-1 font-bold italic">* Deixe vazio para repetir para sempre</p>
                </div>
              )}
            </div>
          </div>

          <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all mt-4">
            {initialData ? 'Salvar Alterações' : 'Confirmar Lançamento'}
          </button>
        </form>
      </div>
    </div>
  )
}