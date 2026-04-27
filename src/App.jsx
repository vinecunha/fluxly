import React, { useState, useEffect, useReducer, useCallback, lazy, Suspense, useMemo } from 'react'
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
import { useMetas } from './hooks/useMetas'
import { ErrorBoundary } from './components/ErrorBoundary'
import { InitialLoader, DataLoaderSkeleton } from './components/SkeletonLoader'

import { AuthScreen } from './components/AuthScreen'
import { DashboardHeader } from './components/DashboardHeader'
import { WidgetDia } from './components/WidgetDia'
import { useSaldoProjetado } from './hooks/useSaldoProjetado'
import { TabBar, BottomNav } from './components/TabBar'
import { useAlertas } from './hooks/useAlertas'
import { SavingSplash } from './components/SavingSplash'
import { Toast } from './components/Toast'
import { UndoToast } from './components/UndoToast'
import { OfflineBanner } from './components/OfflineBanner'
import { NotificationPrompt } from './components/NotificationPrompt'
import { TransactionModal } from './components/TransactionModal'
import { PullToRefreshIndicator } from './components/PullToRefreshIndicator'
import { IntelligenceScreen } from './components/IntelligenceScreen'
import { DashboardCards } from './components/DashboardCards'
import { AlertPriorityList } from './components/AlertPriorityList'

const BillsList = lazy(() => import('./components/BillsList').then(m => ({ default: m.BillsList })))
const RecentFlow = lazy(() => import('./components/RecentFlow').then(m => ({ default: m.RecentFlow })))
const FinancialAnalytics = lazy(() => import('./components/FinancialAnalytics').then(m => ({ default: m.FinancialAnalytics })))
const MetasScreen = lazy(() => import('./components/MetasScreen').then(m => ({ default: m.MetasScreen })))

const TAB_FALLBACK = (
  <div className="flex items-center justify-center py-20">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-600 rounded-2xl animate-spin" />
  </div>
)

export default function App() {
  const [user, setUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [activeTab, setActiveTab] = useState(TABS.DASHBOARD)
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

  const mesStr = useMemo(() => {
    return `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
  }, [currentDate])

  const { data, loading, refresh } = useFinance(user)
  const { cartoes, faturas, criarCartao, editarCartao, excluirCartao } = useCartoes(user)
  const saldo = useSaldoProjetado(
    data,
    faturas ? Object.values(faturas).flat() : [],
    currentDate
  )
  const alertas = useAlertas(data, saldo, currentDate)
  const { zerarCaixinha } = useCaixinhas(user)
  
  const filteredData = useFilteredData(data, currentDate)
  const totals = useTotals(filteredData, currentDate)
  
  const { overdueCount, todayCount } = useAlerts(data)

  const { 
    metas, 
    criarMeta, 
    depositarNaMeta, 
    editarMeta,           
    ajustarValorDepositado,
    excluirMeta, 
    arquivarMeta,
    alterarPrazo,
    criarMetaParaConta,
    loading: loadingMetas 
  } = useMetas(user)

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

  // NOVA FUNÇÃO - Importação de Extratos
  const handleImportTransactions = useCallback(async (transacoes) => {
    if (!user?.id) return
    
    dispatch({ type: UI_ACTIONS.START_SAVING, payload: 'Importando...' })
    
    try {
      const transacoesComUser = transacoes.map(t => ({
        ...t,
        user_id: user.id,
        data: t.data || new Date().toLocaleDateString('en-CA')
      }))
      
      const { error } = await supabase.from('transacoes').insert(transacoesComUser)
      if (error) throw error
      
      await refresh()
      dispatch({ 
        type: UI_ACTIONS.SHOW_TOAST, 
        payload: { message: `${transacoes.length} transações importadas!`, type: 'success' } 
      })
    } catch (error) {
      console.error('Erro na importação:', error)
      dispatch({ 
        type: UI_ACTIONS.SHOW_TOAST, 
        payload: { message: 'Erro ao importar', type: 'error' } 
      })
    } finally {
      dispatch({ type: UI_ACTIONS.STOP_SAVING })
    }
  }, [user, refresh, dispatch])

  const { pullDistance, isPulling, isRefreshing } = usePullToRefresh(refresh)

  const changeMonth = useCallback((direction) => {
    setCurrentDate(prev => {
      const d = new Date(prev)
      d.setMonth(d.getMonth() + direction)
      return d
    })
  }, [])

  // Calcular saldo atual
  const saldoAtual = useMemo(() => {
    return (totals.renda || 0) - (totals.gastosPagos || 0)
  }, [totals.renda, totals.gastosPagos])

  if (!authChecked) return <InitialLoader />
  if (!user) return <AuthScreen />

  return (
    <ErrorBoundary>
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
          reservaTotal={totals.reservaTotal}
          currentDate={currentDate}
          onMonthChange={changeMonth}
          onLogout={() => supabase.auth.signOut()}
          isLoading={loading}
          onRefresh={refresh}
          isRefreshing={isRefreshing}
          onOpenAnalytics={() => setActiveTab(TABS.ANALYTICS)}
          saldoProjetado={saldo?.saldoProjetado}
          alertas={alertas}
          onQuickPay={handleQuickPay}
          isSaving={isSaving}
        />

        <div className="px-4 pt-3 space-y-4">
          <NotificationPrompt />

          {loading ? (
            <DataLoaderSkeleton type="dashboard" />
          ) : (
            <DashboardCards 
              renda={totals.renda}
              gastos={totals.gastosTotal}
              despesasPagas={totals.gastosPagos}
              reserva={totals.reservaTotal}
              saldoProjetado={saldo?.saldoProjetado}
              saldoAtual={saldoAtual}
              saldo={saldo}
              totals={totals}
              onVerDetalhes={() => setActiveTab(TABS.ANALYTICS)}
              isLoading={loading}
            />
          )}

          <TabBar activeTab={activeTab} onChangeTab={setActiveTab} />

          <Suspense fallback={TAB_FALLBACK}>
            {activeTab === TABS.DASHBOARD && (
              loading ? (
                <DataLoaderSkeleton type="list" />
              ) : (
                <RecentFlow
                  transactions={filteredData}
                  onEdit={(t) => dispatch({ type: UI_ACTIONS.OPEN_MODAL, payload: t })}
                  onDelete={handleDelete}
                />
              )
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
                onCriarCartao={criarCartao}
                onEditarCartao={editarCartao}
                onExcluirCartao={excluirCartao}
              />
            )}
            {activeTab === TABS.ANALYTICS && (
              <FinancialAnalytics
                transactions={filteredData}
                allTransactions={data}
                currentDate={currentDate}
              />
            )}
            {activeTab === TABS.INTELLIGENCE && (
              <IntelligenceScreen
                allTransactions={data}
                currentDate={currentDate}
                user={user}
                metas={metas}
                onVerMeta={(metaId) => {
                  setActiveTab(TABS.METAS)
                  // Opcional: scroll para a meta
                }}
                onCriarMetaParaConta={async (conta) => {
                  const result = await criarMetaParaConta(
                    conta.id,
                    `Pagar: ${conta.descricao}`,
                    conta.valor
                  )
                  if (result.success) {
                    setActiveTab(TABS.METAS)
                  }
                }}
              />
            )}
            {activeTab === TABS.METAS && (
                <MetasScreen
                  metas={metas}
                  onCreate={criarMeta}
                  onDepositar={depositarNaMeta}
                  onEditar={editarMeta}                   
                  onAjustarValor={ajustarValorDepositado}  
                  onDelete={excluirMeta}
                  onArquivar={arquivarMeta}
                  onAlterarPrazo={alterarPrazo}
                  loading={loadingMetas}
                  rendaHoje={totals?.rendaHoje || 0}
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
    </ErrorBoundary>
  )
}