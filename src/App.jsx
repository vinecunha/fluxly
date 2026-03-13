import React, { useState, useEffect, useReducer, useCallback, lazy, Suspense } from 'react'
import { supabase } from './lib/supabase'
import { TABS, UI_ACTIONS } from './lib/constants'
import { uiReducer, initialUIState } from './reducers/uiReducer'
import { useFinance } from './hooks/useFinance'
import { useTotals } from './hooks/useTotals'
import { useAlerts } from './hooks/useAlerts'
import { useFilteredData } from './hooks/useFilteredData'
import { useFinanceActions } from './hooks/useFinanceActions'
import { useServiceWorker } from './hooks/useServiceWorker'
import { useOffline } from './hooks/useOffline'

import { AuthScreen } from './components/AuthScreen'
import { DashboardHeader } from './components/DashboardHeader'
import { TabBar, BottomNav } from './components/TabBar'
import { AlertBanner } from './components/AlertBanner'
import { SavingSplash } from './components/SavingSplash'
import { Toast } from './components/Toast'
import { UndoToast } from './components/UndoToast'
import { OfflineBanner } from './components/OfflineBanner'
import { NotificationPrompt } from './components/NotificationPrompt'
import { TransactionModal } from './components/TransactionModal'

const BillsList        = lazy(() => import('./components/BillsList').then(m => ({ default: m.BillsList })))
const RecentFlow       = lazy(() => import('./components/RecentFlow').then(m => ({ default: m.RecentFlow })))
const FinancialAnalytics = lazy(() => import('./components/FinancialAnalytics').then(m => ({ default: m.FinancialAnalytics })))

const TAB_FALLBACK = (
  <div className="flex items-center justify-center py-20">
    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
  </div>
)

export default function App() {
  const [user, setUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [activeTab, setActiveTab] = useState(TABS.DASHBOARD)
  const [currentDate, setCurrentDate] = useState(new Date())

  const [uiState, dispatch] = useReducer(uiReducer, initialUIState)
  const { isModalOpen, editingTransaction, isSaving, savingMessage, toast, showAlerts, undo } = uiState

  useServiceWorker()
  const isOffline = useOffline()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthChecked(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSessionExpired = useCallback(async () => {
    await supabase.auth.signOut()
    dispatch({ type: UI_ACTIONS.SHOW_TOAST, payload: { message: 'Sessão expirada. Faça login novamente.', type: 'error' } })
  }, [])

  const { data, loading, refresh } = useFinance(user)
  const filteredData = useFilteredData(data, currentDate)
  const totals = useTotals(filteredData, currentDate)
  const { overdueCount, todayCount } = useAlerts(data)

  const { handleSave, handleDelete, handleQuickPay } = useFinanceActions({
    user,
    data,
    refresh,
    dispatch,
    editingTransaction,
    onSessionExpired: handleSessionExpired,
  })

  const changeMonth = useCallback((direction) => {
    setCurrentDate(prev => {
      const d = new Date(prev)
      d.setMonth(d.getMonth() + direction)
      return d
    })
  }, [])

  if (!authChecked) return null
  if (!user) return <AuthScreen />

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 max-w-2xl mx-auto relative">
      {isOffline && <OfflineBanner />}

      <DashboardHeader
        renda={totals.renda}
        totalDespesas={totals.gastosTotal}
        despesasPagas={totals.gastosPagos}
        reservaTotal={totals.reservaTotal}
        currentDate={currentDate}
        onMonthChange={changeMonth}
        onLogout={() => supabase.auth.signOut()}
        isLoading={loading}
        userEmail={user?.email ?? ''}
      />

      <div className="px-4 pt-3 space-y-3">
        {/* Permissão push — aparece uma vez */}
        <NotificationPrompt />

        {/* Alertas de vencimento */}
        {(overdueCount > 0 || todayCount > 0) && (
          <AlertBanner
            overdueCount={overdueCount}
            todayCount={todayCount}
            showAlerts={showAlerts}
            dispatch={dispatch}
            onQuickPay={handleQuickPay}
            transactions={data}
            isSaving={isSaving}
          />
        )}

        {/* Tabs */}
        <TabBar activeTab={activeTab} onChangeTab={setActiveTab} onAddClick={() => dispatch({ type: UI_ACTIONS.OPEN_MODAL, payload: null })}/>

        <Suspense fallback={TAB_FALLBACK}>
          {activeTab === TABS.DASHBOARD && (
            <RecentFlow
              transactions={filteredData}
              onEdit={(t) => dispatch({ type: UI_ACTIONS.OPEN_MODAL, payload: t })}
              onDelete={handleDelete}
            />
          )}

          {activeTab === TABS.BILLS && (
            <BillsList
              transactions={filteredData}
              currentDate={currentDate}
              onQuickPay={handleQuickPay}
              onEdit={(t) => dispatch({ type: UI_ACTIONS.OPEN_MODAL, payload: t })}
              onDelete={handleDelete}
            />
          )}

          {activeTab === TABS.ANALYTICS && (
            <FinancialAnalytics
              transactions={filteredData}
              allTransactions={data}
            />
          )}
        </Suspense>
      </div>

      {/* Modals & toasts */}
      {isModalOpen && (
        <TransactionModal
          isOpen={isModalOpen}
          onClose={() => dispatch({ type: UI_ACTIONS.CLOSE_MODAL })}
          onSave={handleSave}
          initialData={editingTransaction}
          transactions={data}
        />
      )}

      {isSaving && <SavingSplash message={savingMessage} />}

      <Toast
        message={toast?.message}
        type={toast?.type}
        dispatch={dispatch}
      />

      <UndoToast undo={undo} dispatch={dispatch} />
      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} onAddNew={() => dispatch({ type: UI_ACTIONS.OPEN_MODAL, payload: null })}/>
    </div>
  )
}