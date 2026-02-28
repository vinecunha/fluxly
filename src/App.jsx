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
import { Plus, LayoutDashboard, ReceiptText, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react'

export default function App() {
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard') 
  const [isModalOpen, setModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  
  const [currentDate, setCurrentDate] = useState(new Date())

  const { data, loading, refresh } = useFinance(user?.id)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null))
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
    return () => authListener.subscription.unsubscribe()
  }, [])

  const filteredData = (data || []).filter(t => {
    const tDate = new Date(t.data + 'T12:00:00')
    return tDate.getMonth() === currentDate.getMonth() && 
           tDate.getFullYear() === currentDate.getFullYear()
  })

  const changeMonth = (offset) => {
    const newDate = new Date(currentDate.setMonth(currentDate.getMonth() + offset))
    setCurrentDate(new Date(newDate))
  }

  const handleOpenModal = (transaction = null) => {
    setEditingTransaction(transaction)
    setModalOpen(true)
  }

  const handleSave = async (formData) => {
    const payload = { ...formData, user_id: user.id }
    if (editingTransaction) {
      const { error } = await supabase.from('transacoes').update(payload).eq('id', editingTransaction.id)
      if (!error) refresh()
    } else {
      const { error } = await supabase.from('transacoes').insert([payload])
      if (!error) refresh()
    }
    setModalOpen(false)
    setEditingTransaction(null)
  }

  const handleDelete = async (id) => {
    const { error } = await supabase.from('transacoes').delete().eq('id', id)
    if (!error) refresh()
  }

  const handleTogglePaid = async (id, status) => {
    const { error } = await supabase.from('transacoes').update({ 
      pago: status,
      data_pagamento: status ? new Date().toISOString() : null 
    }).eq('id', id)
    if (!error) refresh()
  }

  const totais = filteredData.reduce((acc, t) => {
    const v = Number(t.valor) || 0
    if (t.tipo === 'renda') {
      acc.renda += v
    } else {
      acc.gastosTotal += v
      if (t.tipo === 'gasto_diario' || t.pago) {
        acc.gastosPagos += v
      }
    }
    return acc
  }, { renda: 0, gastosTotal: 0, gastosPagos: 0 })

  if (!user) return <AuthScreen />

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      <DashboardHeader 
        renda={totais.renda} 
        totalDespesas={totais.gastosTotal} 
        despesasPagas={totais.gastosPagos}
        currentDate={currentDate}
        onMonthChange={changeMonth}
        onLogout={() => supabase.auth.signOut()} 
      />
      
      <main className="p-5 lg:max-w-4xl lg:mx-auto">
        <div className="flex bg-gray-200/50 p-1 rounded-2xl mb-8 relative z-10 backdrop-blur-md">
          {['dashboard', 'analytics', 'bills'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === tab ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}
            >
              {tab === 'dashboard' && <LayoutDashboard size={14} />}
              {tab === 'analytics' && <BarChart3 size={14} />}
              {tab === 'bills' && <ReceiptText size={14} />}
              {tab === 'dashboard' ? 'Início' : tab === 'analytics' ? 'Análise' : 'Agenda'}
            </button>
          ))}
        </div>

        {activeTab === 'dashboard' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-2 gap-4 mb-8">
              <StatCard title="Ganhos" value={totais.renda} color="text-emerald-600" />
              {/* CORREÇÃO AQUI: valor alterado para totais.gastosTotal */}
              <StatCard title="Despesas" value={totais.gastosTotal} color="text-rose-600" />
            </div>
            <RecentFlow transactions={filteredData} onDelete={handleDelete} onEdit={handleOpenModal} />
          </div>
        )}

        {activeTab === 'analytics' && <FinancialAnalytics transactions={filteredData} />}
        {activeTab === 'bills' && <BillsList transactions={filteredData} onTogglePaid={handleTogglePaid} onDelete={handleDelete} onEdit={handleOpenModal} />}
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

      <TransactionModal isOpen={isModalOpen} onClose={() => { setModalOpen(false); setEditingTransaction(null); }} onSave={handleSave} initialData={editingTransaction} transactions={data} />
    </div>
  )
}