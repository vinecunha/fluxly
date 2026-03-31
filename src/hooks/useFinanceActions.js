import { useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { AUTO_PAID_TYPES, UI_ACTIONS } from '../lib/constants'
import { logger } from '../lib/logger'

const UNDO_TIMEOUT = 5000
const MAX_RECORRENCIAS = 120

// Sanitização de texto para notificações
function sanitizeText(text) {
  if (!text) return ''
  const div = document.createElement('div')
  div.textContent = text
  return div.textContent
}

function sendLocalNotification(title, body) {
  try {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      const sanitizedTitle = sanitizeText(title)
      const sanitizedBody = sanitizeText(body)
      new Notification(sanitizedTitle, { 
        body: sanitizedBody, 
        icon: '/icon-192.png' 
      })
    }
  } catch (error) {
    logger.warn('Notificação falhou:', error)
  }
}

function _isSessionError(error) {
  return error?.message?.includes('JWT') || error?.status === 401
}

export function useFinanceActions({ user, data, refresh, dispatch, editingTransaction, onSessionExpired }) {

  const handleQuickPay = useCallback(async (id, alterarTodaSerie = false, recorrencia_id = null, valorFinal = null) => {
    if (!user?.id) {
      logger.warn('Tentativa de pagamento sem sessão')
      return
    }
    
    const transaction = data.find(t => t.id === id)
    if (!transaction) return
    
    // Verifica que a transação pertence ao usuário logado
    if (transaction.user_id !== user.id) {
      logger.warn(`Tentativa de acesso a transação de outro usuário: ${id}`)
      return
    }

    dispatch({ type: UI_ACTIONS.START_SAVING, payload: 'Atualizando...' })

    try {
      const novoStatus = !transaction.pago
      const dataPagamento = novoStatus ? new Date().toISOString() : null
      const valorOriginal = Number(transaction.valor)
      const valorEfetivo = valorFinal || valorOriginal
      const diferencaJuros = valorEfetivo - valorOriginal

      let query = supabase.from('transacoes').update({ 
        pago: novoStatus, 
        data_pagamento: dataPagamento 
      })
      
      if (alterarTodaSerie && recorrencia_id) {
        query = query
          .eq('recorrencia_id', recorrencia_id)
          .eq('user_id', user.id)
      } else {
        query = query
          .eq('id', id)
          .eq('user_id', user.id)
      }

      const { error: mainError } = await query
      if (mainError) throw mainError

      if (novoStatus && diferencaJuros > 0) {
        const { error: jurosError } = await supabase.from('transacoes').insert([{
          user_id: user.id,
          descricao: `Juros/Encargos: ${transaction.descricao}`,
          valor: diferencaJuros,
          tipo: 'gasto_diario',
          categoria: 'Outros gastos',
          pago: true,
          data: new Date().toLocaleDateString('en-CA'),
          data_pagamento: new Date().toISOString(),
          recorrencia_id: null,
        }])
        
        if (jurosError) logger.error('Erro ao registrar juros:', jurosError)
      }

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
      if (_isSessionError(error)) { 
        onSessionExpired?.()
        return 
      }
      logger.error('Erro ao atualizar pagamento:', error)
      dispatch({ 
        type: UI_ACTIONS.SHOW_TOAST, 
        payload: { message: 'Erro ao atualizar pagamento.', type: 'error' } 
      })
      refresh()
    } finally {
      dispatch({ type: UI_ACTIONS.STOP_SAVING })
    }
  }, [data, user, refresh, dispatch, onSessionExpired])

  const handleDelete = useCallback(async (id, deleteSeries = false, recorrencia_id = null) => {
    if (!user?.id) {
      logger.warn('Tentativa de exclusão sem sessão')
      return
    }
    
    const snapshot = deleteSeries && recorrencia_id
      ? data.filter(t => t.recorrencia_id === recorrencia_id && t.user_id === user.id)
      : data.filter(t => t.id === id && t.user_id === user.id)

    if (snapshot.length === 0) return

    const timerId = setTimeout(async () => {
      dispatch({ type: UI_ACTIONS.CLEAR_UNDO })
      dispatch({ type: UI_ACTIONS.START_SAVING, payload: 'Removendo...' })
      try {
        let query = supabase.from('transacoes').delete().eq('user_id', user.id)
        
        if (deleteSeries && recorrencia_id) {
          query = query.eq('recorrencia_id', recorrencia_id)
        } else {
          query = query.eq('id', id)
        }
        
        const { error } = await query
        if (error) throw error
        await refresh()
      } catch (error) {
        if (_isSessionError(error)) { 
          onSessionExpired?.()
          return 
        }
        logger.error('Erro ao remover transação:', error)
        dispatch({ 
          type: UI_ACTIONS.SHOW_TOAST, 
          payload: { message: 'Erro ao remover transação.', type: 'error' } 
        })
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
          refresh()
        },
      },
    })
  }, [data, user, refresh, dispatch, onSessionExpired])

  const handleSave = useCallback(async (formData, alterarTodaSerie = false) => {
    if (!user?.id) {
      logger.warn('Tentativa de salvar sem sessão')
      dispatch({ 
        type: UI_ACTIONS.SHOW_TOAST, 
        payload: { message: 'Sessão expirada. Faça login novamente.', type: 'error' } 
      })
      return
    }

    const valorNumerico = parseFloat(String(formData.valor).replace(',', '.'))
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      dispatch({ 
        type: UI_ACTIONS.SHOW_TOAST, 
        payload: { message: 'Valor inválido. Digite um número positivo.', type: 'error' } 
      })
      return
    }

    // Sanitização de campos de texto
    const descricaoSafe = String(formData.descricao || '').trim().slice(0, 200)
    if (!descricaoSafe && formData.tipo !== 'pagamento_cartao') {
      dispatch({ 
        type: UI_ACTIONS.SHOW_TOAST, 
        payload: { message: 'Descrição é obrigatória.', type: 'error' } 
      })
      return
    }

    dispatch({
      type: UI_ACTIONS.START_SAVING,
      payload: editingTransaction ? 'Salvando Alterações...' : 'Confirmando Lançamento...',
    })

    const isAutoPaid = AUTO_PAID_TYPES.includes(formData.tipo)

    const dataLancamento = new Date(formData.data + 'T12:00:00')
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const isDataPassadaOuHoje = dataLancamento <= hoje

    const devePagar = isAutoPaid || (formData.tipo === 'esporadica' && isDataPassadaOuHoje)

    const transactionPayload = {
      user_id: user.id,
      descricao: descricaoSafe,
      valor: valorNumerico,
      tipo: formData.tipo,
      categoria: formData.categoria,
      subcategoria: formData.tipo === 'reserva' ? descricaoSafe : (formData.subcategoria || null),
      destino_reserva: formData.destino_reserva || null,
      cartao_id: formData.cartao_id || null,
      pago: devePagar ? true : (formData.pago ?? false),
      data: formData.data,
      repetir: formData.repetir || 'nao',
      recorrencia_limite: formData.recorrencia_limite || null,
      recorrencia_id: formData.recorrencia_id || null,
      data_pagamento: devePagar
        ? new Date(formData.data + 'T12:00:00').toISOString()
        : ((formData.pago && !formData.data_pagamento) ? new Date().toISOString() : (formData.data_pagamento || null)),
    }

    try {
      if (editingTransaction) {
        // Verifica que a transação sendo editada pertence ao usuário
        if (editingTransaction.user_id !== user.id) {
          throw new Error('Acesso negado: você não pode editar esta transação')
        }
        await _updateTransaction(transactionPayload, editingTransaction, alterarTodaSerie, user.id)
      } else {
        await _insertTransaction(transactionPayload, formData, devePagar, user.id)
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
      if (_isSessionError(error)) { 
        onSessionExpired?.()
        return 
      }
      logger.error('Erro ao salvar transação:', error)
      dispatch({ 
        type: UI_ACTIONS.SHOW_TOAST, 
        payload: { message: error.message || 'Erro ao salvar transação.', type: 'error' } 
      })
    } finally {
      dispatch({ type: UI_ACTIONS.STOP_SAVING })
    }
  }, [editingTransaction, user, refresh, dispatch, onSessionExpired])

  return { handleQuickPay, handleDelete, handleSave }
}

async function _updateTransaction(payload, editingTransaction, alterarTodaSerie, userId) {
  if (!userId) throw new Error('Usuário não autenticado')
  
  if (editingTransaction.recorrencia_id && alterarTodaSerie) {
    const { error } = await supabase.from('transacoes').update({
      descricao: payload.descricao,
      valor: payload.valor,
      categoria: payload.categoria,
      subcategoria: payload.subcategoria,
      destino_reserva: payload.destino_reserva,
      cartao_id: payload.cartao_id,
      tipo: payload.tipo,
    })
      .eq('recorrencia_id', editingTransaction.recorrencia_id)
      .eq('user_id', userId)
    if (error) throw error
  } else {
    const { repetir, recorrencia_limite, ...updateData } = payload
    const { error } = await supabase.from('transacoes')
      .update(updateData)
      .eq('id', editingTransaction.id)
      .eq('user_id', userId)
    if (error) throw error
  }
}

async function _insertTransaction(payload, formData, devePagar, userId) {
  if (!userId) throw new Error('Usuário não autenticado')
  
  if (formData.repetir !== 'nao' && formData.recorrencia_limite) {
    const groupID = crypto.randomUUID()
    const transactions = []
    let dataAtual = new Date(formData.data + 'T12:00:00')
    const dataLimite = new Date(formData.recorrencia_limite + 'T12:00:00')

    let recCount = 0
    while (dataAtual <= dataLimite && recCount < MAX_RECORRENCIAS) {
      transactions.push({
        ...payload,
        data: dataAtual.toISOString().split('T')[0],
        recorrencia_id: groupID,
        pago: devePagar,
        data_pagamento: devePagar ? dataAtual.toISOString() : null,
      })

      if (formData.repetir === 'mensal') {
        dataAtual.setMonth(dataAtual.getMonth() + 1)
      } else if (formData.repetir === 'semanal') {
        dataAtual.setDate(dataAtual.getDate() + 7)
      }
      recCount++
    }

    const { error } = await supabase.from('transacoes').insert(transactions)
    if (error) throw error
  } else {
    const { error } = await supabase.from('transacoes').insert([payload])
    if (error) throw error
  }
}