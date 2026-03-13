import React, { useState, useEffect, useReducer, useCallback } from 'react'
import { supabase } from './lib/supabase'
import { useFinance } from './hooks/useFinance'
import { useFinanceActions } from './hooks/useFinanceActions'
import { useTotals } from './hooks/useTotals'
import { useAlerts } from './hooks/useAlerts'
import { useFilteredData } from './hooks/useFilteredData'
import { useServiceWorker } from './hooks/useServiceWorker'
import { useOffline } from './hooks/useOffline'
import { uiReducer, initialUIState } from './reducers/uiReducer'
import { UI_ACTIONS } from './lib/constants'

import { DashboardHeader } from './components/DashboardHeader'
import { TransactionModal } from './components/TransactionModal'
import { AuthScreen } from './components/AuthScreen'
import { StatCard } from './components/StatCard'
import { BillsList } from './components/BillsList'
import { RecentFlow } from './components/RecentFlow'
import { FinancialAnalytics } from './components/FinancialAnalytics'
import { AlertBanner } from './components/AlertBanner'
import { TabBar } from './components/TabBar'
import { Toast } from './components/Toast'
import { OfflineBanner } from './components/OfflineBanner'

import { Plus, LayoutDashboard, BarChart3, ReceiptText, TrendingUp, TrendingDown, Loader2 } from 'lucide-react'

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
  const [authChecked, setAuthChecked] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [direction, setDirection] = useState('')
  const [ui, dispatch] = useReducer(uiReducer, initialUIState)

  useServiceWorker()
  const isOffline = useOffline()

  const { data, loading, refresh } = useFinance(user?.id)
  const filteredData = useFilteredData(data, currentDate)
  const totais = useTotals(data, currentDate)
  const { overdueCount, todayCount } = useAlerts(data)

  const handleSessionExpired = useCallback(() => {
    supabase.auth.signOut()
    setUser(null)
    dispatch({ type: UI_ACTIONS.SHOW_TOAST, payload: { message: 'Sessão expirada. Faça login novamente.', type: 'error' } })
  }, [])

  const { handleSave, handleDelete, handleQuickPay } = useFinanceActions({
    user,
    data,
    refresh,
    dispatch,
    editingTransaction: ui.editingTransaction,
    onSessionExpired: handleSessionExpired,
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthChecked(true)
    })
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => authListener.subscription.unsubscribe()
  }, [])

  const changeMonth = useCallback((offset) => {
    setDirection(offset > 0 ? 'slide-left' : 'slide-right')
    setTimeout(() => {
      setCurrentDate(prev => {
        const d = new Date(prev)
        d.setMonth(d.getMonth() + offset)
        return d
      })
      setDirection('')
    }, 10)
  }, [])

  const handleOpenModal = useCallback((transaction = null) => {
    dispatch({ type: UI_ACTIONS.OPEN_MODAL, payload: transaction })
  }, [])

  if (!authChecked) return null
  if (!user) return <AuthScreen />

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {isOffline && <OfflineBanner />}
      {ui.isSaving && <SavingSplash message={ui.savingMessage} />}
      {ui.toast && <Toast message={ui.toast.message} type={ui.toast.type} dispatch={dispatch} />}

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

      <main className={`p-4 lg:max-w-4xl lg:mx-auto transition-all duration-300 transform 
        ${direction === 'slide-left' ? 'translate-x-full opacity-0' :
          direction === 'slide-right' ? '-translate-x-full opacity-0' :
          'translate-x-0 opacity-100'} ${isOffline ? 'mt-8' : ''}`}>

        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'dashboard' && (
          loading && (data || []).length === 0 ? (
            <DashboardSkeleton />
          ) : (
            <div className="space-y-6 mt-2">
              <AlertBanner
                overdueCount={overdueCount}
                todayCount={todayCount}
                showAlerts={ui.showAlerts}
                dispatch={dispatch}
                onQuickPay={handleQuickPay}
                transactions={data || []}
              />
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  title="Ganhos"
                  value={totais.renda}
                  valueSemana={totais.rendaSemana}
                  valueHoje={totais.rendaHoje}
                  color="text-emerald-600"
                  bgLight="bg-emerald-50"
                  icon={<TrendingUp size={18} />}
                  isLoading={loading}
                />
                <StatCard
                  title="Despesas"
                  value={totais.gastosTotal}
                  valueSemana={totais.gastosSemana}
                  valueHoje={totais.gastosHoje}
                  color="text-rose-600"
                  bgLight="bg-rose-50"
                  icon={<TrendingDown size={18} />}
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

        {activeTab === 'analytics' && (
          <FinancialAnalytics
            transactions={filteredData}
            allTransactions={data}
          />
        )}

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

      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-100 p-3 pb-6 flex justify-around items-center z-40">
        <button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'text-indigo-600' : 'text-gray-400'}>
          <LayoutDashboard size={22} />
        </button>
        <button onClick={() => setActiveTab('analytics')} className={activeTab === 'analytics' ? 'text-indigo-600' : 'text-gray-400'}>
          <BarChart3 size={22} />
        </button>
        <button
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 p-3.5 rounded-2xl text-white shadow-xl -mt-12 border-4 border-[#F8FAFC] active:scale-90 transition-transform"
        >
          <Plus size={28} strokeWidth={3} />
        </button>
        <button onClick={() => setActiveTab('bills')} className={activeTab === 'bills' ? 'text-indigo-600' : 'text-gray-400'}>
          <ReceiptText size={22} />
        </button>
      </nav>

      <TransactionModal
        isOpen={ui.isModalOpen}
        onClose={() => dispatch({ type: UI_ACTIONS.CLOSE_MODAL })}
        onSave={handleSave}
        initialData={ui.editingTransaction}
        transactions={data}
      />
    </div>
  )
}
