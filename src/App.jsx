import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { useFinance } from './hooks/useFinance'
import { DashboardHeader } from './components/DashboardHeader'
import { TransactionModal } from './components/TransactionModal'
import { AuthScreen } from './components/AuthScreen'
import { StatCard } from './components/StatCard'
import { BillsList } from './components/BillsList'
import { RecentFlow } from './components/RecentFlow'
import { FinancialAnalytics } from './components/FinancialAnalytics'
import { AlertsSection } from './components/AlertsSection'
import { Plus, LayoutDashboard, ReceiptText, BarChart3, TrendingUp, TrendingDown, Loader2 } from 'lucide-react'

const DashboardSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    <div className="h-28 bg-gray-200/50 rounded-[2.5rem] border border-gray-100" />
    <div className="grid grid-cols-2 gap-4">
      <div className="h-32 bg-gray-200/50 rounded-[2rem] border border-gray-100" />
      <div className="h-32 bg-gray-200/50 rounded-[2rem] border border-gray-100" />
    </div>
    <div className="space-y-4">
      <div className="h-4 bg-gray-200/50 rounded-full w-24 ml-2" />
      {[1, 2, 3].map(i => (
        <div key={i} className="h-20 bg-white rounded-[2rem] border border-gray-100" />
      ))}
    </div>
  </div>
)

const SavingSplash = ({ message }) => (
  <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/60 backdrop-blur-md animate-in fade-in duration-300">
    <div className="bg-white p-8 rounded-[3rem] shadow-2xl flex flex-col items-center gap-4 border border-gray-100">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-indigo-100 rounded-full" />
        <Loader2 className="absolute top-0 animate-spin text-indigo-600" size={48} />
      </div>
      <p className="text-sm font-black uppercase tracking-widest text-gray-800">{message}</p>
    </div>
  </div>
)

export default function App() {
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard') 
  const [isModalOpen, setModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [savingMessage, setSavingMessage] = useState('')
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [direction, setDirection] = useState('')
  const { data, loading, refresh } = useFinance(user?.id)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null))
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
    return () => authListener.subscription.unsubscribe()
  }, [])

  const filteredData = (data || []).filter(t => {
    const tDate = new Date(t.data + 'T12:00:00')
    const pDate = t.data_pagamento ? new Date(t.data_pagamento) : null
    const viewMonth = currentDate.getMonth()
    const viewYear = currentDate.getFullYear()
    const isDueThisMonth = tDate.getMonth() === viewMonth && tDate.getFullYear() === viewYear
    const isPaidThisMonth = pDate && pDate.getMonth() === viewMonth && pDate.getFullYear() === viewYear
    return isDueThisMonth || isPaidThisMonth
  })

  const changeMonth = (offset) => {
    setDirection(offset > 0 ? 'slide-left' : 'slide-right')
    setTimeout(() => {
      const newDate = new Date(currentDate.setMonth(currentDate.getMonth() + offset))
      setCurrentDate(new Date(newDate))
      setDirection('')
    }, 10)
  }

  const handleOpenModal = (transaction = null) => {
    setEditingTransaction(transaction)
    setModalOpen(true)
  }

  const handleQuickPay = async (id, alterarTodaSerie = false, recorrencia_id = null, valorFinal = null) => {
    try {
      setIsSaving(true)
      setSavingMessage('Atualizando...')
      const transaction = data.find(t => t.id === id)
      if (!transaction) return
      const novoStatus = !transaction.pago
      const dataPagamento = novoStatus ? new Date().toISOString() : null
      const valorOriginal = Number(transaction.valor)
      const valorEfetivo = valorFinal || valorOriginal
      const diferencaJuros = valorEfetivo - valorOriginal
      let query = supabase.from('transacoes').update({ pago: novoStatus, data_pagamento: dataPagamento })
      if (alterarTodaSerie && recorrencia_id) {
        query = query.eq('recorrencia_id', recorrencia_id)
      } else {
        query = query.eq('id', id)
      }
      const { error: mainError } = await query
      if (mainError) throw mainError
      if (novoStatus && diferencaJuros > 0) {
        await supabase.from('transacoes').insert([{
          user_id: user.id,
          descricao: `Juros/Encargos: ${transaction.descricao}`,
          valor: diferencaJuros,
          tipo: 'gasto_diario',
          categoria: 'Outros',
          pago: true,
          data: new Date().toLocaleDateString('en-CA'),
          data_pagamento: new Date().toISOString(),
          recorrencia_id: null
        }])
      }
      await refresh()
    } catch (error) {
      console.error(error.message)
      refresh()
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id, deleteSeries = false, recorrencia_id = null) => {
    try {
      setIsSaving(true)
      setSavingMessage('Removendo...')
      let query = supabase.from('transacoes').delete()
      if (deleteSeries && recorrencia_id) {
        query = query.eq('recorrencia_id', recorrencia_id)
      } else {
        query = query.eq('id', id)
      }
      const { error } = await query
      if (error) throw error
      refresh()
    } catch (error) {
      console.error(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSave = async (formData, alterarTodaSerie = false) => {
    setIsSaving(true)
    setSavingMessage(editingTransaction ? 'Salvando Alterações...' : 'Confirmando Lançamento...')
    
    const isDaily = formData.tipo === 'gasto_diario'
    const cleanPayload = {
      user_id: user.id,
      descricao: formData.descricao,
      valor: Number(formData.valor),
      tipo: formData.tipo,
      categoria: formData.categoria,
      subcategoria: formData.tipo === 'reserva' ? formData.descricao : (formData.subcategoria || null),
      destino_reserva: formData.destino_reserva || null,
      pago: isDaily ? true : (formData.pago ?? false),
      data: formData.data,
      repetir: formData.repetir || 'nao',
      recorrencia_limite: formData.recorrencia_limite || null,
      recorrencia_id: formData.recorrencia_id || null,
      data_pagamento: isDaily ? new Date(formData.data + 'T12:00:00').toISOString() : ((formData.pago && !formData.data_pagamento) ? new Date().toISOString() : (formData.data_pagamento || null))
    }

    try {
      if (editingTransaction) {
        if (editingTransaction.recorrencia_id && alterarTodaSerie) {
          const { error } = await supabase.from('transacoes').update({
            descricao: cleanPayload.descricao,
            valor: cleanPayload.valor,
            categoria: cleanPayload.categoria,
            subcategoria: cleanPayload.subcategoria,
            destino_reserva: cleanPayload.destino_reserva,
            tipo: cleanPayload.tipo
          }).eq('recorrencia_id', editingTransaction.recorrencia_id)
          if (error) throw error
        } else {
          const { repetir, recorrencia_limite, ...updateData } = cleanPayload
          const { error } = await supabase.from('transacoes').update(updateData).eq('id', editingTransaction.id)
          if (error) throw error
        }
      } else {
        if (formData.repetir !== 'nao' && formData.recorrencia_limite) {
          const transactionsToInsert = []
          const groupID = crypto.randomUUID()
          let dataAtual = new Date(formData.data + 'T12:00:00')
          const dataLimite = new Date(formData.recorrencia_limite + 'T12:00:00')
          while (dataAtual <= dataLimite) {
            transactionsToInsert.push({
              ...cleanPayload,
              data: dataAtual.toISOString().split('T')[0],
              recorrencia_id: groupID,
              pago: isDaily ? true : false,
              data_pagamento: isDaily ? dataAtual.toISOString() : null
            })
            if (formData.repetir === 'mensal') {
              dataAtual.setMonth(dataAtual.getMonth() + 1)
            } else if (formData.repetir === 'semanal') {
              dataAtual.setDate(dataAtual.getDate() + 7)
            }
          }
          const { error } = await supabase.from('transacoes').insert(transactionsToInsert)
          if (error) throw error
        } else {
          const { error } = await supabase.from('transacoes').insert([cleanPayload])
          if (error) throw error
        }
      }
      await refresh()
      setModalOpen(false)
      setEditingTransaction(null)
    } catch (error) {
      console.error(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  // Correção do Fuso Horário para Estatísticas (Brasil UTC-3)
  const getTodayString = () => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
  }
  
  const todayStr = getTodayString()
  const hojeRef = new Date(todayStr + 'T12:00:00')
  const diaSemana = hojeRef.getDay()
  const diffSegunda = hojeRef.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1)
  const segundaFeira = new Date(hojeRef.getFullYear(), hojeRef.getMonth(), diffSegunda, 0, 0, 0)
  const domingo = new Date(segundaFeira)
  domingo.setDate(segundaFeira.getDate() + 6)
  domingo.setHours(23, 59, 59, 999)

  const totais = (data || []).reduce((acc, t) => {
    const v = Number(t.valor) || 0
    const tDate = new Date(t.data + 'T12:00:00')
    const pDate = t.data_pagamento ? new Date(t.data_pagamento) : null
    const viewMonth = currentDate.getMonth()
    const viewYear = currentDate.getFullYear()
    
    const isDueThisMonth = tDate.getMonth() === viewMonth && tDate.getFullYear() === viewYear
    const isPaidThisMonth = pDate && pDate.getMonth() === viewMonth && pDate.getFullYear() === viewYear
    const isThisWeek = tDate >= segundaFeira && tDate <= domingo
    const isToday = t.data === todayStr

    if (t.tipo === 'reserva') acc.reservaTotal += v
    
    if (isDueThisMonth || isPaidThisMonth) {
      if (t.tipo === 'renda') {
        acc.renda += v
        if (isToday) acc.rendaHoje += v
        if (isThisWeek) acc.rendaSemana += v
      } else if (t.tipo !== 'reserva') { 
        acc.gastosTotal += v
        if (isToday) acc.gastosHoje += v
        if (isThisWeek) acc.gastosSemana += v
        if (t.tipo === 'gasto_diario' || t.pago) acc.gastosPagos += v
      }
    }
    return acc
  }, { 
    renda: 0, rendaHoje: 0, rendaSemana: 0, 
    gastosTotal: 0, gastosHoje: 0, gastosSemana: 0, 
    gastosPagos: 0, reservaTotal: 0 
  })

  if (!user) return <AuthScreen />

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 overflow-x-hidden">
      {isSaving && <SavingSplash message={savingMessage} />}
      <DashboardHeader 
        renda={totais.renda} 
        totalDespesas={totais.gastosTotal} 
        despesasPagas={totais.gastosPagos}
        reservaTotal={totais.reservaTotal}
        currentDate={currentDate}
        onMonthChange={changeMonth}
        onLogout={() => supabase.auth.signOut()} 
        isLoading={loading}
        userEmail={user?.email}
      />
      <main className={`p-5 lg:max-w-4xl lg:mx-auto transition-all duration-300 transform 
        ${direction === 'slide-left' ? 'translate-x-full opacity-0' : 
          direction === 'slide-right' ? '-translate-x-full opacity-0' : 
          'translate-x-0 opacity-100'}`}>
        <div className="flex bg-gray-200/50 p-1.5 rounded-[2rem] mb-8 relative z-10 backdrop-blur-md gap-1">
          {[
            { id: 'dashboard', label: 'Início', icon: <LayoutDashboard size={14} /> },
            { id: 'analytics', label: 'Análise', icon: <BarChart3 size={14} /> },
            { id: 'bills', label: 'Contas', icon: <ReceiptText size={14} /> }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-[1.4rem] text-[9px] font-black uppercase transition-all whitespace-nowrap px-1 ${
                activeTab === tab.id 
                  ? 'bg-white shadow-sm text-indigo-600 ring-1 ring-black/5' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="flex-shrink-0">{tab.icon}</span>
              <span className="tracking-tight">{tab.label}</span>
            </button>
          ))}
        </div>
        {activeTab === 'dashboard' && (
          loading && data.length === 0 ? (
            <DashboardSkeleton />
          ) : (
            <div className="space-y-8">
              <AlertsSection transactions={data || []} onQuickPay={handleQuickPay} />
              <div className="grid grid-cols-2 gap-4">
                <StatCard 
                  title="Ganhos" 
                  value={totais.renda}
                  valueSemana={totais.rendaSemana}
                  valueHoje={totais.rendaHoje}
                  color="text-emerald-600" 
                  bgLight="bg-emerald-50"
                  icon={<TrendingUp />} 
                  isLoading={loading}
                />
                <StatCard 
                  title="Despesas" 
                  value={totais.gastosTotal}
                  valueSemana={totais.gastosSemana}
                  valueHoje={totais.gastosHoje}
                  color="text-rose-600" 
                  bgLight="bg-rose-50"
                  icon={<TrendingDown />} 
                  isLoading={loading}
                />
              </div>
              <RecentFlow 
                transactions={filteredData} 
                onDelete={handleDelete} 
                onEdit={handleOpenModal} 
                isLoading={loading}
                currentViewDate={currentDate}
              />
            </div>
          )
        )}
        {activeTab === 'analytics' && <FinancialAnalytics transactions={filteredData} />}
        {activeTab === 'bills' && (
          <BillsList 
            transactions={filteredData} 
            allTransactions={data}      
            onTogglePaid={handleQuickPay} 
            onEdit={handleOpenModal}
            onDelete={handleDelete}
            isLoading={loading}
          />
        )}
      </main>
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-100 p-4 pb-6 flex justify-around items-center z-40">
        <button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'text-indigo-600' : 'text-gray-400'}>
          <LayoutDashboard size={24} />
        </button>
        <button onClick={() => setActiveTab('analytics')} className={activeTab === 'analytics' ? 'text-indigo-600' : 'text-gray-400'}>
          <BarChart3 size={24} />
        </button>
        <button onClick={() => handleOpenModal()} className="bg-indigo-600 p-4 rounded-2xl text-white shadow-xl -mt-14 border-4 border-[#F8FAFC] active:scale-90 transition-transform">
          <Plus size={30} strokeWidth={3} />
        </button>
        <button onClick={() => setActiveTab('bills')} className={activeTab === 'bills' ? 'text-indigo-600' : 'text-gray-400'}>
          <ReceiptText size={24} />
        </button>
      </nav>
      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => { setModalOpen(false); setEditingTransaction(null); }} 
        onSave={handleSave} 
        initialData={editingTransaction} 
        transactions={data} 
      />
    </div>
  )
}