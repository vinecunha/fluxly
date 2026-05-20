import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@lib/supabase'
import type { User, Diaria, PerfilMotorista } from '@types'
import { logger } from '@lib/logger'

export interface UseDiariasReturn {
  diariaHoje: Diaria | null
  historico: Diaria[]
  perfil: PerfilMotorista | null
  loading: boolean
  salvarDiaria: (dados: Partial<Diaria>, data?: string) => Promise<{ success: boolean; data?: Diaria; error?: string }>
  atualizarPerfil: (dados: Partial<PerfilMotorista>) => Promise<{ success: boolean; error?: string }>
  refresh: () => Promise<void>
}

export function useDiarias(user: User | null): UseDiariasReturn {
  const [diariaHoje, setDiariaHoje] = useState<Diaria | null>(null)
  const [historico, setHistorico] = useState<Diaria[]>([])
  const [perfil, setPerfil] = useState<PerfilMotorista | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setDiariaHoje(null)
      setHistorico([])
      setPerfil(null)
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      const hoje = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })

      const [diariasRes, perfilRes] = await Promise.all([
        supabase
          .from('diarias')
          .select('*')
          .eq('user_id', user.id)
          .order('data', { ascending: false })
          .limit(365),
        supabase
          .from('perfil_motorista')
          .select('*')
          .eq('user_id', user.id)
          .single(),
      ])

      if (diariasRes.error) throw diariasRes.error

      const todas = (diariasRes.data || []) as Diaria[]
      const deHoje = todas.find(d => d.data === hoje) || null
      const historicoSemHoje = todas.filter(d => d.data !== hoje)

      setDiariaHoje(deHoje)
      setHistorico(historicoSemHoje)

      if (perfilRes.error && perfilRes.error.code !== 'PGRST116') {
        logger.error('Erro ao buscar perfil:', perfilRes.error)
      }
      setPerfil((perfilRes.data as PerfilMotorista) || null)

    } catch (err) {
      logger.error('Erro em useDiarias.refresh:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    refresh()
  }, [refresh])

  const salvarDiaria = useCallback(async (dados: Partial<Diaria>, data?: string) => {
    if (!user?.id) return { success: false, error: 'Usuário não autenticado' }

    const dataAlvo = data || new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
    const ehHoje = dataAlvo === new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })

    try {
      const { data: existing, error: queryError } = await supabase
        .from('diarias')
        .select('id')
        .eq('user_id', user.id)
        .eq('data', dataAlvo)
        .maybeSingle()

      if (queryError) throw queryError

      let result: Diaria
      if (existing) {
        const { data: updated, error } = await supabase
          .from('diarias')
          .update({ ...dados, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
          .select()
          .single()

        if (error) throw error
        result = updated as Diaria
      } else {
        const { data: created, error } = await supabase
          .from('diarias')
          .insert([{ ...dados, user_id: user.id, data: dataAlvo }])
          .select()
          .single()

        if (error) throw error
        result = created as Diaria
      }

      if (ehHoje) {
        setDiariaHoje(result)
      } else {
        setHistorico(prev => {
          const sem = prev.filter(d => d.data !== dataAlvo)
          return [result, ...sem].sort((a, b) => b.data.localeCompare(a.data))
        })
      }
      return { success: true, data: result }
    } catch (err: any) {
      logger.error('Erro ao salvar diária:', err)
      return { success: false, error: err.message || 'Erro ao salvar' }
    }
  }, [user?.id])

  const atualizarPerfil = useCallback(async (dados: Partial<PerfilMotorista>) => {
    if (!user?.id) return { success: false, error: 'Usuário não autenticado' }

    try {
      if (perfil?.id) {
        const { error } = await supabase
          .from('perfil_motorista')
          .update({ ...dados, updated_at: new Date().toISOString() })
          .eq('id', perfil.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('perfil_motorista')
          .insert([{ ...dados, user_id: user.id }])

        if (error) throw error
      }

      setPerfil(prev => prev ? { ...prev, ...dados } : { id: '', user_id: user.id, ...dados } as PerfilMotorista)
      return { success: true }
    } catch (err: any) {
      logger.error('Erro ao atualizar perfil:', err)
      return { success: false, error: err.message || 'Erro ao atualizar perfil' }
    }
  }, [user?.id, perfil])

  return {
    diariaHoje,
    historico,
    perfil,
    loading,
    salvarDiaria,
    atualizarPerfil,
    refresh,
  }
}
