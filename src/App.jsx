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
import { usePullToRefresh } from './hooks/usePullToRefresh'
import { useCartoes } from './hooks/useCartoes'
import { useCaixinhas } from './hooks/useCaixinhas'

import { AuthScreen } from './components/AuthScreen'
import { DashboardHeader } from './components/DashboardHeader'
import { WidgetDia } from './components/WidgetDia'
import { useSaldoProjetado } from './hooks/useSaldoProjetado'
import { StatCard } from './components/StatCard'
import { TabBar, BottomNav } from './components/TabBar'
import { AlertBanner } from './components/AlertBanner'
import { SavingSplash } from './components/SavingSplash'
import { Toast } from './components/Toast'
import { UndoToast } from './components/UndoToast'
import { OfflineBanner } from './components/OfflineBanner'
import { NotificationPrompt } from './components/NotificationPrompt'
import { TransactionModal } from './components/TransactionModal'
import { PullToRefreshIndicator } from './components/PullToRefreshIndicator'
import { CartoesScreen } from './components/CartoesScreen'
import { IntelligenceScreen } from './components/IntelligenceScreen'

import { TrendingUp, TrendingDown } from 'lucide-react'

const BillsList          = lazy(() => import('./components/BillsList').then(m => ({ default: m.BillsList })))
const RecentFlow         = lazy(() => import('./components/RecentFlow').then(m => ({ default: m.RecentFlow })))
const FinancialAnalytics = lazy(() => import('./components/FinancialAnalytics').then(m => ({ default: m.FinancialAnalytics })))

const TAB_FALLBACK = (
  <div className="flex items-center justify-center py-20">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-600 rounded-2xl animate-spin" />
  </div>
)

export default function App() {
  const [user, setUser]               = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [activeTab, setActiveTab]     = useState(TABS.DASHBOARD)
  const [currentDate, setCurrentDate] = useState(new Date())

  const [uiState, dispatch] = useReducer(uiReducer, initialUIState)
  const { isModalOpen, editingTransaction, isSaving, savingMessage, toast, showAlerts, undo } = uiState
  const [fabPrefill, setFabPrefill] = useState(null)

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

  const mesStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`

  const { data, loading, refresh }   = useFinance(user)
  const { cartoes, faturas, criarCartao, editarCartao, excluirCartao } = useCartoes(user)
  const saldo = useSaldoProjetado(
    data,
    faturas ? Object.values(faturas).flat() : [],
    currentDate
  )
  const { zerarCaixinha }            = useCaixinhas(user, mesStr)
  const filteredData = useFilteredData(data, currentDate)
  const totals       = useTotals(filteredData, currentDate)
  const { overdueCount, todayCount } = useAlerts(data)

  const { handleSave, handleDelete, handleQuickPay: _handleQuickPay } = useFinanceActions({
    user, data, refresh, dispatch, editingTransaction,
    onSessionExpired: handleSessionExpired,
  })

  const handleQuickPay = useCallback(async (id, alterarTodaSerie, recorrencia_id, valorFinal) => {
    await _handleQuickPay(id, alterarTodaSerie, recorrencia_id, valorFinal)
    const t = data.find(t => t.id === id)
    if (t && (t.tipo === 'fixa' || t.tipo === 'esporadica') && !t.pago) {
      await zerarCaixinha(id)
    }
  }, [_handleQuickPay, data, zerarCaixinha])

  const { pullDistance, isPulling, isRefreshing } = usePullToRefresh(refresh)

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

      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isPulling={isPulling}
        isRefreshing={isRefreshing}
      />

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
        onRefresh={refresh}
        isRefreshing={isRefreshing}
        onOpenAnalytics={() => setActiveTab(TABS.ANALYTICS)}
        saldoProjetado={saldo?.saldoProjetado}
      />

      <WidgetDia
        saldo={saldo}
        totals={totals}
        userName={user?.email}
        onVerDetalhes={() => setActiveTab(TABS.ANALYTICS)}
        isLoading={loading}
      />

      <div className="px-4 pt-3 space-y-3">
        <NotificationPrompt />

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



        <TabBar activeTab={activeTab} onChangeTab={setActiveTab} />

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
              allTransactions={data}
              onTogglePaid={handleQuickPay}
              onEdit={(t) => dispatch({ type: UI_ACTIONS.OPEN_MODAL, payload: t })}
              onDelete={handleDelete}
              isLoading={loading}
              cartoes={cartoes}
              currentDate={currentDate}
            />
          )}
          {activeTab === TABS.ANALYTICS && (
            <FinancialAnalytics
              transactions={filteredData}
              allTransactions={data}
              currentDate={currentDate}
            />
          )}
          {activeTab === TABS.CARTOES && (
            <CartoesScreen
              cartoes={cartoes}
              faturas={faturas}
              onCriar={criarCartao}
              onEditar={editarCartao}
              onExcluir={excluirCartao}
              allTransactions={data}
              currentDate={currentDate}
            />
          )}
          {activeTab === TABS.INTELLIGENCE && (
            <IntelligenceScreen
              allTransactions={data}
              currentDate={currentDate}
              user={user}
            />
          )}
        </Suspense>
      </div>

      {isModalOpen && (
        <TransactionModal
          isOpen={isModalOpen}
          onClose={() => { dispatch({ type: UI_ACTIONS.CLOSE_MODAL }); setFabPrefill(null) }}
          onSave={(form, all) => { setFabPrefill(null); handleSave(form, all) }}
          initialData={editingTransaction || fabPrefill || null}
          transactions={data}
          cartoes={cartoes}
        />
      )}

      {isSaving && <SavingSplash message={savingMessage} />}

      <Toast message={toast?.message} type={toast?.type} dispatch={dispatch} />
      <UndoToast undo={undo} dispatch={dispatch} />

      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        transactions={data}
        onAddNew={(prefill) => {
          setFabPrefill(prefill || null)
          dispatch({ type: UI_ACTIONS.OPEN_MODAL, payload: null })
        }}
      />
    </div>
  )
}