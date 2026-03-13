import { useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { AUTO_PAID_TYPES, UI_ACTIONS } from '../lib/constants'
import { getTodayString } from '../lib/dateHelpers'

export function useFinanceActions({ user, data, refresh, dispatch, editingTransaction, onSessionExpired }) {
  const handleAuthError = useCallback((error) => {
    if (error?.message?.includes('JWT') || error?.status === 401 || error?.status === 403) {
      onSessionExpired?.()
      return true
    }
    return false
  }, [onSessionExpired])

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

      await refresh()
      dispatch({ type: UI_ACTIONS.SHOW_TOAST, payload: { message: novoStatus ? 'Pagamento registrado!' : 'Conta reaberta.', type: 'success' } })
    } catch (error) {
      if (!handleAuthError(error)) {
        dispatch({ type: UI_ACTIONS.SHOW_TOAST, payload: { message: 'Erro ao atualizar pagamento.', type: 'error' } })
      }
      refresh()
    } finally {
      dispatch({ type: UI_ACTIONS.STOP_SAVING })
    }
  }, [data, user, refresh, dispatch, handleAuthError])

  const handleDelete = useCallback(async (id, deleteSeries = false, recorrencia_id = null) => {
    dispatch({ type: UI_ACTIONS.START_SAVING, payload: 'Removendo...' })

    try {
      let query = supabase.from('transacoes').delete()
      query = deleteSeries && recorrencia_id
        ? query.eq('recorrencia_id', recorrencia_id)
        : query.eq('id', id)

      const { error } = await query
      if (error) throw error

      await refresh()
      dispatch({ type: UI_ACTIONS.SHOW_TOAST, payload: { message: 'Transação removida.', type: 'success' } })
    } catch (error) {
      if (!handleAuthError(error)) {
        dispatch({ type: UI_ACTIONS.SHOW_TOAST, payload: { message: 'Erro ao remover transação.', type: 'error' } })
      }
    } finally {
      dispatch({ type: UI_ACTIONS.STOP_SAVING })
    }
  }, [refresh, dispatch, handleAuthError])

  const handleSave = useCallback(async (formData, alterarTodaSerie = false) => {
    const valorNumerico = parseFloat(String(formData.valor).replace(',', '.'))
    if (isNaN(valorNumerico)) return

    dispatch({
      type: UI_ACTIONS.START_SAVING,
      payload: editingTransaction ? 'Salvando Alterações...' : 'Confirmando Lançamento...',
    })

    const isAutoPaid = AUTO_PAID_TYPES.includes(formData.tipo)

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
        await _insertTransaction(transactionPayload, formData, isAutoPaid)
      }

      await refresh()
      dispatch({ type: UI_ACTIONS.CLOSE_MODAL })
      dispatch({ type: UI_ACTIONS.SHOW_TOAST, payload: { message: editingTransaction ? 'Alterações salvas!' : 'Lançamento confirmado!', type: 'success' } })
    } catch (error) {
      if (!handleAuthError(error)) {
        dispatch({ type: UI_ACTIONS.SHOW_TOAST, payload: { message: 'Erro ao salvar transação.', type: 'error' } })
      }
    } finally {
      dispatch({ type: UI_ACTIONS.STOP_SAVING })
    }
  }, [editingTransaction, user, refresh, dispatch, handleAuthError])

  return { handleQuickPay, handleDelete, handleSave }
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
      if (formData.repetir === 'mensal') dataAtual.setMonth(dataAtual.getMonth() + 1)
      else if (formData.repetir === 'semanal') dataAtual.setDate(dataAtual.getDate() + 7)
    }

    const { error } = await supabase.from('transacoes').insert(transactions)
    if (error) throw error
  } else {
    const { error } = await supabase.from('transacoes').insert([payload])
    if (error) throw error
  }
}
