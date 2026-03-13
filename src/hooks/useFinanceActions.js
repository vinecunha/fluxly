import { useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { AUTO_PAID_TYPES, UI_ACTIONS } from '../lib/constants'
import { getTodayString } from '../lib/dateHelpers'

const UNDO_TIMEOUT = 5000 // ms antes de deletar de verdade

export function useFinanceActions({ user, data, refresh, dispatch, editingTransaction, onSessionExpired }) {

  // ─── Quick Pay ──────────────────────────────────────────────────────────────
  const handleQuickPay = useCallback(async (id, alterarTodaSerie = false, recorrencia_id = null, valorFinal = null) => {
    const transaction = data.find(t => t.id === id)
    if (!transaction) return

    dispatch({ type: UI_ACTIONS.START_SAVING, payload: 'Atualizando...' })

    try {
      const novoStatus = !transaction.pago
      const dataPagamento = novoStatus ? new Date().toISOString() : null
      const valorOriginal = Number(transaction.valor)
      const valorEfetivo = valorFinal || valorOriginal
      const diferencaJuros = valorEfetivo - valorOriginal

      let query = supabase.from('transacoes').update({ pago: novoStatus, data_pagamento: dataPagamento })
      query = alterarTodaSerie && recorrencia_id
        ? query.eq('recorrencia_id', recorrencia_id)
        : query.eq('id', id)

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
          recorrencia_id: null,
        }])
      }

      // Notificação push ao marcar como pago
      if (novoStatus) {
        sendLocalNotification(
          '✅ Pagamento confirmado',
          `${transaction.descricao} — R$ ${valorEfetivo.toFixed(2)}`
        )
      }

      dispatch({
        type: UI_ACTIONS.SHOW_TOAST,
        payload: {
          message: novoStatus ? `${transaction.descricao} marcado como pago` : 'Pagamento desmarcado',
          type: 'success',
        },
      })

      await refresh()
    } catch (error) {
      if (_isSessionError(error)) { onSessionExpired?.(); return }
      dispatch({ type: UI_ACTIONS.SHOW_TOAST, payload: { message: 'Erro ao atualizar pagamento.', type: 'error' } })
      refresh()
    } finally {
      dispatch({ type: UI_ACTIONS.STOP_SAVING })
    }
  }, [data, user, refresh, dispatch, onSessionExpired])

  // ─── Delete (com Desfazer) ───────────────────────────────────────────────────
  const handleDelete = useCallback(async (id, deleteSeries = false, recorrencia_id = null) => {
    // Guarda snapshot para desfazer
    const snapshot = deleteSeries && recorrencia_id
      ? data.filter(t => t.recorrencia_id === recorrencia_id)
      : data.filter(t => t.id === id)

    if (snapshot.length === 0) return

    // Remove otimisticamente do estado (não do banco ainda)
    // O timeout vai deletar de verdade. Cancelar = restaurar.
    const timerId = setTimeout(async () => {
      dispatch({ type: UI_ACTIONS.CLEAR_UNDO })
      dispatch({ type: UI_ACTIONS.START_SAVING, payload: 'Removendo...' })
      try {
        let query = supabase.from('transacoes').delete()
        query = deleteSeries && recorrencia_id
          ? query.eq('recorrencia_id', recorrencia_id)
          : query.eq('id', id)
        const { error } = await query
        if (error) throw error
        await refresh()
      } catch (error) {
        if (_isSessionError(error)) { onSessionExpired?.(); return }
        dispatch({ type: UI_ACTIONS.SHOW_TOAST, payload: { message: 'Erro ao remover transação.', type: 'error' } })
        refresh()
      } finally {
        dispatch({ type: UI_ACTIONS.STOP_SAVING })
      }
    }, UNDO_TIMEOUT)

    dispatch({
      type: UI_ACTIONS.SET_UNDO,
      payload: {
        label: snapshot.length > 1
          ? `${snapshot.length} registros removidos`
          : `"${snapshot[0].descricao}" removido`,
        timerId,
        restore: () => {
          clearTimeout(timerId)
          dispatch({ type: UI_ACTIONS.CLEAR_UNDO })
          // Não precisamos reinserir — refresh() já vai buscar do banco (não deletamos ainda)
          refresh()
        },
      },
    })
  }, [data, refresh, dispatch, onSessionExpired])

  // ─── Save ────────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async (formData, alterarTodaSerie = false) => {
    const valorNumerico = parseFloat(String(formData.valor).replace(',', '.'))
    if (isNaN(valorNumerico)) return

    dispatch({
      type: UI_ACTIONS.START_SAVING,
      payload: editingTransaction ? 'Salvando Alterações...' : 'Confirmando Lançamento...',
    })

    const isAutoPaid = AUTO_PAID_TYPES.includes(formData.tipo)
    const todayStr = getTodayString()

    const transactionPayload = {
      user_id: user.id,
      descricao: formData.descricao,
      valor: valorNumerico,
      tipo: formData.tipo,
      categoria: formData.categoria,
      subcategoria: formData.tipo === 'reserva' ? formData.descricao : (formData.subcategoria || null),
      destino_reserva: formData.destino_reserva || null,
      pago: isAutoPaid ? true : (formData.pago ?? false),
      data: formData.data,
      repetir: formData.repetir || 'nao',
      recorrencia_limite: formData.recorrencia_limite || null,
      recorrencia_id: formData.recorrencia_id || null,
      data_pagamento: isAutoPaid
        ? new Date(formData.data + 'T12:00:00').toISOString()
        : ((formData.pago && !formData.data_pagamento) ? new Date().toISOString() : (formData.data_pagamento || null)),
    }

    try {
      if (editingTransaction) {
        await _updateTransaction(transactionPayload, editingTransaction, alterarTodaSerie)
      } else {
        await _insertTransaction(transactionPayload, formData, isAutoPaid, user.id)
      }

      dispatch({
        type: UI_ACTIONS.SHOW_TOAST,
        payload: {
          message: editingTransaction ? 'Registro atualizado!' : 'Lançamento confirmado!',
          type: 'success',
        },
      })
      await refresh()
      dispatch({ type: UI_ACTIONS.CLOSE_MODAL })
    } catch (error) {
      if (_isSessionError(error)) { onSessionExpired?.(); return }
      dispatch({ type: UI_ACTIONS.SHOW_TOAST, payload: { message: 'Erro ao salvar transação.', type: 'error' } })
    } finally {
      dispatch({ type: UI_ACTIONS.STOP_SAVING })
    }
  }, [editingTransaction, user, refresh, dispatch, onSessionExpired])

  return { handleQuickPay, handleDelete, handleSave }
}

// ─── Helpers privados ────────────────────────────────────────────────────────

function _isSessionError(error) {
  return error?.message?.includes('JWT') || error?.status === 401
}

function sendLocalNotification(title, body) {
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/icon-192.png' })
  }
}

async function _updateTransaction(payload, editingTransaction, alterarTodaSerie) {
  if (editingTransaction.recorrencia_id && alterarTodaSerie) {
    const { error } = await supabase.from('transacoes').update({
      descricao: payload.descricao,
      valor: payload.valor,
      categoria: payload.categoria,
      subcategoria: payload.subcategoria,
      destino_reserva: payload.destino_reserva,
      tipo: payload.tipo,
    }).eq('recorrencia_id', editingTransaction.recorrencia_id)
    if (error) throw error
  } else {
    const { repetir, recorrencia_limite, ...updateData } = payload
    const { error } = await supabase.from('transacoes').update(updateData).eq('id', editingTransaction.id)
    if (error) throw error
  }
}

async function _insertTransaction(payload, formData, isAutoPaid) {
  if (formData.repetir !== 'nao' && formData.recorrencia_limite) {
    const groupID = crypto.randomUUID()
    const transactions = []
    let dataAtual = new Date(formData.data + 'T12:00:00')
    const dataLimite = new Date(formData.recorrencia_limite + 'T12:00:00')

    while (dataAtual <= dataLimite) {
      transactions.push({
        ...payload,
        data: dataAtual.toISOString().split('T')[0],
        recorrencia_id: groupID,
        pago: isAutoPaid,
        data_pagamento: isAutoPaid ? dataAtual.toISOString() : null,
      })

      if (formData.repetir === 'mensal') {
        dataAtual.setMonth(dataAtual.getMonth() + 1)
      } else if (formData.repetir === 'semanal') {
        dataAtual.setDate(dataAtual.getDate() + 7)
      }
    }

    const { error } = await supabase.from('transacoes').insert(transactions)
    if (error) throw error
  } else {
    const { error } = await supabase.from('transacoes').insert([payload])
    if (error) throw error
  }
}