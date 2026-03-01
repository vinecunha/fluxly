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
import { Plus, LayoutDashboard, ReceiptText, BarChart3 } from 'lucide-react'

export default function App() {
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard') 
  const [isModalOpen, setModalOpen] = useState(false)
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
    return tDate.getMonth() === currentDate.getMonth() && 
           tDate.getFullYear() === currentDate.getFullYear()
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

  const handleQuickPay = async (id) => {
    try {
      const { error } = await supabase
        .from('transacoes')
        .update({ pago: true })
        .eq('id', id)
      
      if (error) throw error
      refresh()
    } catch (error) {
      console.error('Erro ao processar pagamento rápido:', error.message)
    }
  }

  const handleDelete = async (id, deleteSeries = false, recorrencia_id = null) => {
    try {
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
      console.error('Erro ao excluir:', error.message)
      alert('Erro ao excluir transação.')
    }
  }

  const handleSave = async (formData) => {
    const cleanPayload = {
      user_id: user.id,
      descricao: formData.descricao,
      valor: Number(formData.valor),
      tipo: formData.tipo,
      categoria: formData.categoria,
      pago: formData.pago ?? false,
      data: formData.data,
      repetir: formData.repetir || 'nao',
      recorrencia_limite: formData.recorrencia_limite || null,
      recorrencia_id: formData.recorrencia_id || null
    }

    try {
      if (editingTransaction) {
        // Se for uma conta recorrente, perguntamos se deseja alterar toda a série
        if (editingTransaction.recorrencia_id) {
          const alterarTodaSerie = window.confirm(
            "Esta é uma conta recorrente. Deseja aplicar as alterações de nome e valor a todas as parcelas futuras desta série?"
          )

          if (alterarTodaSerie) {
            // Atualiza todos os registros que possuem o mesmo recorrencia_id
            const { error } = await supabase
              .from('transacoes')
              .update({
                descricao: cleanPayload.descricao,
                valor: cleanPayload.valor,
                categoria: cleanPayload.categoria,
                tipo: cleanPayload.tipo,
                recorrencia_id: editingTransaction.recorrencia_id // Mantém o ID de grupo
              })
              .eq('recorrencia_id', editingTransaction.recorrencia_id)
            
            if (error) throw error
          } else {
            // Atualiza apenas o registro selecionado
            const { repetir, recorrencia_limite, ...updateData } = cleanPayload
            const { error } = await supabase
              .from('transacoes')
              .update(updateData)
              .eq('id', editingTransaction.id)
            
            if (error) throw error
          }
        } else {
          // Caso não seja recorrente, atualização simples
          const { repetir, recorrencia_limite, ...updateData } = cleanPayload
          const { error } = await supabase
            .from('transacoes')
            .update(updateData)
            .eq('id', editingTransaction.id)
          
          if (error) throw error
        }
      } else {
        // Lógica de Inserção (Novo Registro)
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
              pago: false
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
      
      refresh()
      setModalOpen(false)
      setEditingTransaction(null)
    } catch (error) {
      console.error('Erro ao salvar:', error.message)
      alert(`Erro ao salvar: ${error.message}`)
    }
  }

  const totais = filteredData.reduce((acc, t) => {
    const v = Number(t.valor) || 0
    if (t.tipo === 'renda') acc.renda += v
    else {
      acc.gastosTotal += v
      if (t.tipo === 'gasto_diario' || t.pago) acc.gastosPagos += v
    }
    return acc
  }, { renda: 0, gastosTotal: 0, gastosPagos: 0 })

  if (!user) return <AuthScreen />

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 overflow-x-hidden">
      <DashboardHeader 
        renda={totais.renda} 
        totalDespesas={totais.gastosTotal} 
        despesasPagas={totais.gastosPagos}
        currentDate={currentDate}
        onMonthChange={changeMonth}
        onLogout={() => supabase.auth.signOut()} 
      />
      
      <main className={`p-5 lg:max-w-4xl lg:mx-auto transition-all duration-300 transform 
        ${direction === 'slide-left' ? 'translate-x-full opacity-0' : 
          direction === 'slide-right' ? '-translate-x-full opacity-0' : 
          'translate-x-0 opacity-100'}`}>

        <div className="flex bg-gray-200/50 p-1 rounded-2xl mb-8 relative z-10 backdrop-blur-md">
          {['dashboard', 'analytics', 'bills'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === tab ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}
            >
              {tab === 'dashboard' ? <LayoutDashboard size={14} /> : tab === 'analytics' ? <BarChart3 size={14} /> : <ReceiptText size={14} />}
              {tab === 'dashboard' ? 'Início' : tab === 'analytics' ? 'Análise' : 'Agenda'}
            </button>
          ))}
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <AlertsSection 
              transactions={data || []} 
              onQuickPay={handleQuickPay} 
            />

            <div className="grid grid-cols-2 gap-4">
              <StatCard title="Ganhos" value={totais.renda} color="text-emerald-600" />
              <StatCard title="Despesas" value={totais.gastosTotal} color="text-rose-600" />
            </div>
            <RecentFlow transactions={filteredData} onDelete={handleDelete} onEdit={handleOpenModal} />
          </div>
        )}

        {activeTab === 'analytics' && <FinancialAnalytics transactions={filteredData} />}
        {activeTab === 'bills' && (
          <BillsList 
            transactions={filteredData} // Mantém o que aparece na lista (mês atual)
            allTransactions={data}      // Passa TUDO para o cálculo da série
            onTogglePaid={handleQuickPay} 
            onEdit={handleOpenModal}
            onDelete={handleDelete}
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