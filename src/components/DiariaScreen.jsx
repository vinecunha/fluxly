import React, { useState, useMemo, useEffect } from 'react'
import { CarFront, Clock, Fuel, Zap, Target, CheckCircle2, ChevronDown, BarChart3, TrendingUp, TrendingDown, Minus, Plus, Trash2, DollarSign, Calendar } from 'lucide-react'
import { fmt, getToday } from '@lib/formatters'
import { getPeriodRange, getCurrentDateFromPeriod } from '@lib/periodHelpers'
import { logger } from '@lib/logger'

const FORMA_KM = [
  { id: 'a', label: 'Hodômetro inicial + final', desc: 'Informe os dois valores do hodômetro' },
  { id: 'b', label: 'KM rodado + hodômetro atual', desc: 'Informe quanto rodou e o hodômetro agora' },
  { id: 'c', label: 'Só KM rodado', desc: 'Apenas os km que rodou hoje' },
]

const FORMA_TEMPO = [
  { id: 'a', label: 'Horário que começou', desc: 'Diga que horas ligou o carro' },
  { id: 'b', label: 'Tempo direto do painel', desc: 'Informe as horas que o painel marca' },
]

function formatDecimalHours(h) {
  const horas = Math.floor(h)
  const minutos = Math.round((h - horas) * 60)
  return `${horas}h${minutos > 0 ? minutos + 'min' : ''}`
}

function hoursFromTime(str) {
  if (!str) return 0
  const [h, m] = str.split(':').map(Number)
  return h + (m || 0) / 60
}

function pct(v) {
  const s = v >= 0 ? '+' : ''
  return `${s}${v.toFixed(1)}%`
}

function diaStr(d) {
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

function inicioSemana(d) {
  const r = new Date(d)
  const dia = r.getDay()
  const diff = dia === 0 ? -6 : 1 - dia
  r.setDate(r.getDate() + diff)
  return r
}

function fimSemana(d) {
  const r = inicioSemana(d)
  r.setDate(r.getDate() + 6)
  return r
}

function inicioMes(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function fimMes(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}

function agregar(lista) {
  return lista.reduce((s, d) => ({
    km: s.km + (d.km_rodados || 0),
    horas: s.horas + (d.horas_operacao || 0),
    custoGnv: s.custoGnv + (d.custo_gnv || 0),
    custoGas: s.custoGas + (d.custo_gasolina || 0),
    ganhos: s.ganhos + (d.ganhos || 0),
    outrosGastos: s.outrosGastos + (d.outros_gastos || 0),
  }), { km: 0, horas: 0, custoGnv: 0, custoGas: 0, ganhos: 0, outrosGastos: 0 })
}

// ─── Insights ────────────────────────────────────────────────────────────────
function InsightsCards({ historicoFull, hoje }) {
  const cards = useMemo(() => {
    const agora = new Date()
    const hojeStr = diaStr(agora)
    const ontem = new Date(agora); ontem.setDate(ontem.getDate() - 1)
    const ontemStr = diaStr(ontem)

    const semanaAtualInicio = inicioSemana(agora)
    const semanaAtualFim = fimSemana(agora)
    const semanaPassadaInicio = new Date(semanaAtualInicio); semanaPassadaInicio.setDate(semanaPassadaInicio.getDate() - 7)
    const semanaPassadaFim = new Date(semanaAtualInicio); semanaPassadaFim.setDate(semanaPassadaFim.getDate() - 1)

    const mesAtualInicio = inicioMes(agora)
    const mesAtualFim = fimMes(agora)
    const mesPassadoInicio = inicioMes(new Date(agora.getFullYear(), agora.getMonth() - 1, 1))
    const mesPassadoFim = fimMes(new Date(agora.getFullYear(), agora.getMonth() - 1, 1))

    const todas = historicoFull || []
    const resultados = []

    // ── Hoje vs Ontem ──
    const hojeEntry = todas.find(d => d.data === hojeStr)
    const ontemEntry = todas.find(d => d.data === ontemStr)
    if (hojeEntry && hojeEntry.km_rodados > 0 && ontemEntry && ontemEntry.km_rodados > 0) {
      const h = hojeEntry; const o = ontemEntry
      const custoHoje = (h.custo_gnv || 0) + (h.custo_gasolina || 0)
      const custoOntem = (o.custo_gnv || 0) + (o.custo_gasolina || 0)
      const lucroHoje = (h.ganhos || 0) - custoHoje
      const lucroOntem = (o.ganhos || 0) - custoOntem
      const itens = [
        { label: 'KM', valor: `${h.km_rodados} km`, vs: `${o.km_rodados} km`, diff: ((h.km_rodados - o.km_rodados) / o.km_rodados) * 100, bom: h.km_rodados >= o.km_rodados },
        { label: 'Ganhos', valor: fmt(h.ganhos || 0), vs: fmt(o.ganhos || 0), diff: o.ganhos > 0 ? ((h.ganhos - o.ganhos) / o.ganhos) * 100 : 0, bom: (h.ganhos || 0) >= (o.ganhos || 0) },
        { label: 'Custo/km', valor: `${fmt(h.km_rodados > 0 ? custoHoje / h.km_rodados : 0)}/km`, vs: `${fmt(o.km_rodados > 0 ? custoOntem / o.km_rodados : 0)}/km`, diff: o.km_rodados > 0 ? -((custoHoje / h.km_rodados - custoOntem / o.km_rodados) / (custoOntem / o.km_rodados)) * 100 : 0, bom: true },
        { label: 'Lucro', valor: fmt(lucroHoje), vs: fmt(lucroOntem), diff: lucroOntem !== 0 ? ((lucroHoje - lucroOntem) / Math.abs(lucroOntem)) * 100 : 0, bom: lucroHoje >= lucroOntem },
      ]
      if (h.horas_operacao > 0 && o.horas_operacao > 0) {
        itens.push({ label: 'Lucro/h', valor: `${fmt(lucroHoje / h.horas_operacao)}/h`, vs: `${fmt(lucroOntem / o.horas_operacao)}/h`, diff: ((lucroHoje / h.horas_operacao - lucroOntem / o.horas_operacao) / (lucroOntem / o.horas_operacao)) * 100, bom: lucroHoje / h.horas_operacao >= lucroOntem / o.horas_operacao })
      }
      resultados.push({ titulo: '🔄 Hoje vs Ontem', itens })
    }

    // ── Semana Atual vs Semana Passada ──
    const semanaAtual = agregar(todas.filter(d => d.data >= diaStr(semanaAtualInicio) && d.data <= diaStr(semanaAtualFim)))
    const semanaPassada = agregar(todas.filter(d => d.data >= diaStr(semanaPassadaInicio) && d.data <= diaStr(semanaPassadaFim)))
    if (semanaAtual.km > 0 && semanaPassada.km > 0) {
      const custoAtual = semanaAtual.custoGnv + semanaAtual.custoGas
      const custoPassado = semanaPassada.custoGnv + semanaPassada.custoGas
      const lucroAtual = semanaAtual.ganhos - custoAtual
      const lucroPassado = semanaPassada.ganhos - custoPassado
      const itens = [
        { label: 'KM', valor: `${semanaAtual.km.toFixed(0)} km`, vs: `${semanaPassada.km.toFixed(0)} km`, diff: ((semanaAtual.km - semanaPassada.km) / semanaPassada.km) * 100, bom: semanaAtual.km >= semanaPassada.km },
        { label: 'Ganhos', valor: fmt(semanaAtual.ganhos), vs: fmt(semanaPassada.ganhos), diff: semanaPassada.ganhos > 0 ? ((semanaAtual.ganhos - semanaPassada.ganhos) / semanaPassada.ganhos) * 100 : 0, bom: semanaAtual.ganhos >= semanaPassada.ganhos },
        { label: 'Custo total', valor: fmt(custoAtual), vs: fmt(custoPassado), diff: -((custoAtual - custoPassado) / custoPassado) * 100, bom: custoAtual <= custoPassado },
        { label: 'Lucro', valor: fmt(lucroAtual), vs: fmt(lucroPassado), diff: lucroPassado !== 0 ? ((lucroAtual - lucroPassado) / Math.abs(lucroPassado)) * 100 : 0, bom: lucroAtual >= lucroPassado },
      ]
      if (semanaAtual.horas > 0 && semanaPassada.horas > 0) {
        const kmhAtual = semanaAtual.km / semanaAtual.horas
        const kmhPassado = semanaPassada.km / semanaPassada.horas
        itens.push({ label: 'KM/h', valor: `${kmhAtual.toFixed(1)} km/h`, vs: `${kmhPassado.toFixed(1)} km/h`, diff: ((kmhAtual - kmhPassado) / kmhPassado) * 100, bom: kmhAtual >= kmhPassado })
        itens.push({ label: 'Lucro/h', valor: `${fmt(lucroAtual / semanaAtual.horas)}/h`, vs: `${fmt(lucroPassado / semanaPassada.horas)}/h`, diff: lucroPassado / semanaPassada.horas > 0 ? ((lucroAtual / semanaAtual.horas - lucroPassado / semanaPassada.horas) / (lucroPassado / semanaPassada.horas)) * 100 : 0, bom: lucroAtual / semanaAtual.horas >= lucroPassado / semanaPassada.horas })
      }
      resultados.push({ titulo: '📅 Esta Semana vs Semana Passada', itens })
    }

    // ── Mês Atual vs Mês Passado ──
    const mesAtual = agregar(todas.filter(d => d.data >= diaStr(mesAtualInicio) && d.data <= diaStr(mesAtualFim)))
    const mesPassado = agregar(todas.filter(d => d.data >= diaStr(mesPassadoInicio) && d.data <= diaStr(mesPassadoFim)))
    if (mesAtual.km > 0 && mesPassado.km > 0) {
      const custoAtualM = mesAtual.custoGnv + mesAtual.custoGas
      const custoPassadoM = mesPassado.custoGnv + mesPassado.custoGas
      const lucroAtualM = mesAtual.ganhos - custoAtualM
      const lucroPassadoM = mesPassado.ganhos - custoPassadoM
      const itens = [
        { label: 'KM', valor: `${mesAtual.km.toFixed(0)} km`, vs: `${mesPassado.km.toFixed(0)} km`, diff: ((mesAtual.km - mesPassado.km) / mesPassado.km) * 100, bom: mesAtual.km >= mesPassado.km },
        { label: 'Ganhos', valor: fmt(mesAtual.ganhos), vs: fmt(mesPassado.ganhos), diff: mesPassado.ganhos > 0 ? ((mesAtual.ganhos - mesPassado.ganhos) / mesPassado.ganhos) * 100 : 0, bom: mesAtual.ganhos >= mesPassado.ganhos },
        { label: 'Custo total', valor: fmt(custoAtualM), vs: fmt(custoPassadoM), diff: -((custoAtualM - custoPassadoM) / custoPassadoM) * 100, bom: custoAtualM <= custoPassadoM },
        { label: 'Lucro', valor: fmt(lucroAtualM), vs: fmt(lucroPassadoM), diff: lucroPassadoM !== 0 ? ((lucroAtualM - lucroPassadoM) / Math.abs(lucroPassadoM)) * 100 : 0, bom: lucroAtualM >= lucroPassadoM },
        { label: 'Lucro/km', valor: `${fmt(mesAtual.km > 0 ? lucroAtualM / mesAtual.km : 0)}/km`, bom: true },
      ]
      if (mesAtual.horas > 0) {
        itens.push({ label: 'Lucro/h', valor: `${fmt(lucroAtualM / mesAtual.horas)}/h`, bom: true })
        itens.push({ label: 'KM/h médio', valor: `${(mesAtual.km / mesAtual.horas).toFixed(1)} km/h`, bom: true })
      }
      resultados.push({ titulo: '📆 Mês Atual vs Mês Passado', itens })
    }

    return resultados
  }, [historicoFull])

  if (!cards.length) return null

  return (
    <div className="space-y-3">
      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Insights de desempenho</p>
      {cards.map((card, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <p className="text-[11px] font-black text-slate-800">{card.titulo}</p>
          <div className="space-y-2.5">
            {card.itens.map((item, j) => (
              <div key={j} className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-gray-500">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-800">{item.valor}</span>
                  {item.vs && <span className="text-[8px] text-gray-400">({item.vs})</span>}
                  {item.diff !== undefined && (
                    <span className={`flex items-center gap-0.5 text-[9px] font-black ${Math.abs(item.diff) < 1 ? 'text-gray-400' : item.bom ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {Math.abs(item.diff) < 1 ? <Minus size={10} /> : item.bom ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {pct(item.diff)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Resumo ──────────────────────────────────────────────────────────────────
function ResumoCard({ km, horas, kmPorHora, custoGnv, custoGasolina, volumeGnvExibido, litrosGasolinaExibido, custoCombustivel, outrosGastos, totalGastos, custoPorKm, ganhos, lucroBruto, lucroLiquido }) {
  const temKm = km > 0
  const temTempo = horas > 0
  const temGanhos = ganhos > 0
  const temOutros = outrosGastos > 0
  const temCombustivel = custoCombustivel > 0

  if (!temKm && !temTempo && !temGanhos && !temCombustivel) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-2">
          <Target size={14} className="text-slate-600" />
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Resumo</p>
        </div>
        <p className="text-[10px] text-gray-400 font-bold">Preencha os módulos abaixo para ver o resumo do dia.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Target size={14} className="text-slate-600" />
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Resumo do dia</p>
      </div>
      <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3">
        {temKm && (<><div className="flex items-center justify-between"><span className="text-[9px] font-bold text-white/60 uppercase">Km rodados</span><span className="text-sm font-black">{km.toFixed(0)} km</span></div><div className="h-px bg-white/10" /></>)}
        {temTempo && (<><div className="flex items-center justify-between"><span className="text-[9px] font-bold text-white/60 uppercase">Tempo operação</span><span className="text-sm font-black">{formatDecimalHours(horas)}</span></div><div className="h-px bg-white/10" /></>)}
        {temKm && temTempo && (<><div className="flex items-center justify-between"><span className="text-[9px] font-bold text-white/60 uppercase">Média km/h</span><span className="text-sm font-black">{kmPorHora.toFixed(1)} km/h</span></div><div className="h-px bg-white/10" /></>)}

        {custoGnv > 0 && (<><div className="flex items-center justify-between"><span className="text-[9px] font-bold text-white/60 uppercase">GNV</span><span className="text-sm font-black text-emerald-400">{volumeGnvExibido ? `${volumeGnvExibido.toFixed(1)} m³ ` : ''}{fmt(custoGnv)}</span></div><div className="h-px bg-white/10" /></>)}
        {custoGasolina > 0 && (<><div className="flex items-center justify-between"><span className="text-[9px] font-bold text-white/60 uppercase">Gasolina</span><span className="text-sm font-black text-amber-400">{litrosGasolinaExibido ? `${litrosGasolinaExibido.toFixed(1)} L ` : ''}{fmt(custoGasolina)}</span></div><div className="h-px bg-white/10" /></>)}
        {temCombustivel && (<><div className="flex items-center justify-between"><span className="text-[9px] font-bold text-white/60 uppercase">Total combustível</span><span className="text-sm font-black">{fmt(custoCombustivel)}</span></div><div className="h-px bg-white/10" /></>)}

        {temOutros && (<><div className="flex items-center justify-between"><span className="text-[9px] font-bold text-white/60 uppercase">Outros gastos</span><span className="text-sm font-black text-rose-400">{fmt(outrosGastos)}</span></div><div className="h-px bg-white/10" /></>)}
        {temGanhos && (<><div className="flex items-center justify-between"><span className="text-[9px] font-bold text-white/60 uppercase">Ganhos do dia</span><span className="text-sm font-black text-emerald-400">{fmt(ganhos)}</span></div><div className="h-px bg-white/10" /></>)}

        {/* Receita vs Custos */}
        {temGanhos && (
          <div className="bg-white/5 rounded-xl p-3 space-y-2">
            <p className="text-[8px] font-black text-white/40 uppercase tracking-wider text-center">Demonstrativo</p>
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-bold text-white/70">(+) Ganhos</span>
              <span className="font-black text-emerald-400">{fmt(ganhos)}</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-bold text-white/70">(−) Combustível</span>
              <span className="font-black text-amber-400">−{fmt(custoCombustivel)}</span>
            </div>
            {temOutros && (
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-white/70">(−) Outros gastos</span>
                <span className="font-black text-rose-400">−{fmt(outrosGastos)}</span>
              </div>
            )}
            <div className="h-px bg-white/20" />
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-bold text-white/70">= Lucro Bruto</span>
              <span className={`font-black ${lucroBruto >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{fmt(lucroBruto)}</span>
            </div>
            {temOutros && (
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-white/70">= Lucro Líquido</span>
                <span className={`font-black ${lucroLiquido >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{fmt(lucroLiquido)}</span>
              </div>
            )}
          </div>
        )}

        {/* Indicadores por km/hora */}
        {temKm && temCombustivel && (
          <div className="flex items-center justify-between"><span className="text-[9px] font-bold text-white/60 uppercase">Custo combustível/km</span><span className="text-sm font-black">{fmt(custoPorKm)}/km</span></div>
        )}
        {temKm && temGanhos && (
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-white/60 uppercase">Lucro líquido/km</span>
            <span className={`text-lg font-black ${lucroLiquido >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{fmt(lucroLiquido / km)}/km</span>
          </div>
        )}
        {temGanhos && horas > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-white/60 uppercase">Lucro líquido/hora</span>
            <span className={`text-sm font-black ${lucroLiquido >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{fmt(lucroLiquido / horas)}/h</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Resumo do período (modo agregado) ──────────────────────────────────────
function PeriodSummaryCard({ a, totalDias }) {
  const cc = a.custoGnv + a.custoGas
  const tg = cc + a.outrosGastos
  const g = a.ganhos
  const km = a.km
  const h = a.horas
  const lb = g - cc
  const ll = g - tg

  if (!km && !h && !g && !cc) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 size={14} className="text-slate-600" />
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Período</p>
        </div>
        <p className="text-[10px] text-gray-400 font-bold">Nenhum dado de desempenho neste período.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 size={14} className="text-slate-600" />
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Resumo do período</p>
      </div>
      <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between"><span className="text-[9px] font-bold text-white/60 uppercase">Dias com registro</span><span className="text-sm font-black">{totalDias || '—'}</span></div>
        <div className="h-px bg-white/10" />
        {km > 0 && (<><div className="flex items-center justify-between"><span className="text-[9px] font-bold text-white/60 uppercase">Km rodados</span><span className="text-sm font-black">{km.toFixed(0)} km</span></div><div className="h-px bg-white/10" /></>)}
        {h > 0 && (<><div className="flex items-center justify-between"><span className="text-[9px] font-bold text-white/60 uppercase">Tempo operação</span><span className="text-sm font-black">{formatDecimalHours(h)}</span></div><div className="h-px bg-white/10" /></>)}
        {km > 0 && h > 0 && (<><div className="flex items-center justify-between"><span className="text-[9px] font-bold text-white/60 uppercase">Média km/h</span><span className="text-sm font-black">{(km / h).toFixed(1)} km/h</span></div><div className="h-px bg-white/10" /></>)}

        {a.custoGnv > 0 && (<><div className="flex items-center justify-between"><span className="text-[9px] font-bold text-white/60 uppercase">GNV</span><span className="text-sm font-black text-emerald-400">{fmt(cc)}</span></div><div className="h-px bg-white/10" /></>)}
        {a.custoGas > 0 && (<><div className="flex items-center justify-between"><span className="text-[9px] font-bold text-white/60 uppercase">Gasolina</span><span className="text-sm font-black text-amber-400">{fmt(cc)}</span></div><div className="h-px bg-white/10" /></>)}
        {cc > 0 && (<><div className="flex items-center justify-between"><span className="text-[9px] font-bold text-white/60 uppercase">Total combustível</span><span className="text-sm font-black">{fmt(cc)}</span></div><div className="h-px bg-white/10" /></>)}

        {a.outrosGastos > 0 && (<><div className="flex items-center justify-between"><span className="text-[9px] font-bold text-white/60 uppercase">Outros gastos</span><span className="text-sm font-black text-rose-400">{fmt(a.outrosGastos)}</span></div><div className="h-px bg-white/10" /></>)}
        {g > 0 && (<><div className="flex items-center justify-between"><span className="text-[9px] font-bold text-white/60 uppercase">Ganhos</span><span className="text-sm font-black text-emerald-400">{fmt(g)}</span></div><div className="h-px bg-white/10" /></>)}

        {g > 0 && (
          <div className="bg-white/5 rounded-xl p-3 space-y-2">
            <p className="text-[8px] font-black text-white/40 uppercase tracking-wider text-center">Demonstrativo</p>
            <div className="flex items-center justify-between text-[10px]"><span className="font-bold text-white/70">(+) Ganhos</span><span className="font-black text-emerald-400">{fmt(g)}</span></div>
            <div className="flex items-center justify-between text-[10px]"><span className="font-bold text-white/70">(−) Combustível</span><span className="font-black text-amber-400">−{fmt(cc)}</span></div>
            {a.outrosGastos > 0 && <div className="flex items-center justify-between text-[10px]"><span className="font-bold text-white/70">(−) Outros gastos</span><span className="font-black text-rose-400">−{fmt(a.outrosGastos)}</span></div>}
            <div className="h-px bg-white/20" />
            <div className="flex items-center justify-between text-[10px]"><span className="font-bold text-white/70">= Lucro Bruto</span><span className={`font-black ${lb >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{fmt(lb)}</span></div>
            {a.outrosGastos > 0 && <div className="flex items-center justify-between text-[10px]"><span className="font-bold text-white/70">= Lucro Líquido</span><span className={`font-black ${ll >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{fmt(ll)}</span></div>}
          </div>
        )}

        {km > 0 && cc > 0 && <div className="flex items-center justify-between"><span className="text-[9px] font-bold text-white/60 uppercase">Custo combustível/km</span><span className="text-sm font-black">{fmt(cc / km)}/km</span></div>}
        {km > 0 && g > 0 && <div className="flex items-center justify-between"><span className="text-[9px] font-bold text-white/60 uppercase">Lucro líquido/km</span><span className={`text-lg font-black ${ll >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{fmt(ll / km)}/km</span></div>}
        {g > 0 && h > 0 && <div className="flex items-center justify-between"><span className="text-[9px] font-bold text-white/60 uppercase">Lucro líquido/hora</span><span className={`text-sm font-black ${ll >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{fmt(ll / h)}/h</span></div>}
      </div>
    </div>
  )
}

function ModuleCard({ icon: Icon, titulo, resumo, aberto, onToggle, children, preenchido }) {
  return (
    <div className={`bg-white rounded-2xl border transition-all ${aberto ? 'border-slate-200 shadow-sm' : 'border-gray-100'}`}>
      <button onClick={onToggle} className="w-full flex items-center justify-between p-5 text-left active:scale-[0.99] transition-all">
        <div className="flex items-center gap-3">
          <Icon size={14} className={preenchido ? 'text-emerald-500' : 'text-slate-400'} />
          <div>
            <p className="text-[11px] font-black text-slate-800">{titulo}</p>
            {resumo && <p className="text-[9px] font-bold text-gray-400 mt-0.5">{resumo}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {preenchido && <CheckCircle2 size={12} className="text-emerald-400" />}
          <ChevronDown size={14} className={`text-gray-300 transition-transform ${aberto ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {aberto && <div className="px-5 pb-5 space-y-3 border-t border-gray-50 pt-4">{children}</div>}
    </div>
  )
}

function Input({ label, placeholder, value, onChange, type = 'number', step, hint }) {
  return (
    <div>
      {label && <label className="text-[8px] font-black text-gray-400 uppercase block mb-1">{label}</label>}
      <input type={type} step={step} value={value} onChange={onChange}
        className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm font-bold text-slate-800 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-slate-200" placeholder={placeholder} />
      {hint && <p className="text-[8px] text-gray-400 mt-1 font-bold">{hint}</p>}
    </div>
  )
}

export function DiariaScreen({ user, diariasHook, period, transacoes }) {
  const { diariaHoje, historico, perfil, loading, salvarDiaria, atualizarPerfil } = diariasHook

  // ─── Modo: dia específico ou agregado ────────────────────────────────────
  const ehModoDia = period?.type === 'today'

  // ─── Unfiltered historico (for comparisons) ───────────────────────────────
  const historicoFull = useMemo(() => {
    const hojeStr = diaStr(new Date())
    const base = [...(historico || [])]
    if (diariaHoje && !base.some(d => d.data === diariaHoje.data)) {
      base.unshift(diariaHoje)
    }
    return base
  }, [historico, diariaHoje])

  // ─── Range do período (para modo agregado) ───────────────────────────────
  const periodRange = useMemo(() => {
    if (!period) return null
    return getPeriodRange(period)
  }, [period])

  // ─── Diárias filtradas pelo range ─────────────────────────────────────────
  const diariasDoPeriodo = useMemo(() => {
    if (!periodRange || ehModoDia) return []
    const startStr = diaStr(periodRange.start)
    const endStr = diaStr(periodRange.end)
    return historicoFull.filter(d => d.data >= startStr && d.data <= endStr)
  }, [historicoFull, periodRange, ehModoDia])

  // ─── Agregado do período ─────────────────────────────────────────────────
  const agregadoPeriodo = useMemo(() => {
    return agregar(diariasDoPeriodo)
  }, [diariasDoPeriodo])

  // ─── Data alvo (para modo dia) ────────────────────────────────────────────
  const dataAlvo = useMemo(() => {
    if (!period) return new Date()
    return getCurrentDateFromPeriod(period)
  }, [period])

  const dataAlvoStr = dataAlvo.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
  const dataAlvoLabel = dataAlvo.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '').toUpperCase()
  const ehHoje = dataAlvoStr === diaStr(new Date())

  const diariaAlvo = useMemo(() => {
    return ehModoDia ? (historicoFull.find(d => d.data === dataAlvoStr) || null) : null
  }, [historicoFull, dataAlvoStr, ehModoDia])

  const [cardAberto, setCardAberto] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)
  const [mensagem, setMensagem] = useState('')

  // ─── KM ────────────────────────────────────────────────────────────────────
  const [formaKm, setFormaKm] = useState(null)
  const [hodInicial, setHodInicial] = useState('')
  const [hodFinal, setHodFinal] = useState('')
  const [kmRodados, setKmRodados] = useState('')
  const [hodAtual, setHodAtual] = useState('')
  const [kmCalculado, setKmCalculado] = useState(null)

  // ─── Tempo ─────────────────────────────────────────────────────────────────
  const [formaTempo, setFormaTempo] = useState(null)
  const [horaInicio, setHoraInicio] = useState('')
  const [horaFim, setHoraFim] = useState('')
  const [encerrou, setEncerrou] = useState(null)
  const [tempoPainel, setTempoPainel] = useState('')
  const [horasDecorridas, setHorasDecorridas] = useState(null)

  // ─── GNV (multi-abastecimento) ─────────────────────────────────────────────
  const [gnvEntries, setGnvEntries] = useState([])
  const [gnvFormAberto, setGnvFormAberto] = useState(false)
  const [gnvForma, setGnvForma] = useState(null)
  const [gnvVolume, setGnvVolume] = useState('')
  const [gnvValor, setGnvValor] = useState('')
  const [gnvPreco, setGnvPreco] = useState('')

  // ─── Gasolina (multi-abastecimento) ────────────────────────────────────────
  const [gasEntries, setGasEntries] = useState([])
  const [gasFormAberto, setGasFormAberto] = useState(false)
  const [gasForma, setGasForma] = useState(null)
  const [gasLitros, setGasLitros] = useState('')
  const [gasValor, setGasValor] = useState('')
  const [gasPreco, setGasPreco] = useState('')
  const [gasDias, setGasDias] = useState('1')

  // ─── Ganhos ────────────────────────────────────────────────────────────────
  const [ganhosValor, setGanhosValor] = useState('')
  const [ganhosSalvos, setGanhosSalvos] = useState(false)

  // ─── Outros Gastos ──────────────────────────────────────────────────────────
  const [outrosGastos, setOutrosGastos] = useState('')
  const [outrosGastosSalvos, setOutrosGastosSalvos] = useState(false)

  const ganhosTransacoes = useMemo(() => {
    if (!transacoes) return []
    const hojeStr = diaStr(new Date())
    return transacoes.filter(t =>
      t.data === hojeStr &&
      t.categoria === 'renda' &&
      t.subcategoria === 'aplicativos' &&
      t.pago !== false
    )
  }, [transacoes])

  const ganhosTransacoesTotal = useMemo(() => {
    return ganhosTransacoes.reduce((s, t) => s + (parseFloat(t.valor) || 0), 0)
  }, [ganhosTransacoes])

  // ─── Sugestões do perfil ───────────────────────────────────────────────────
  const precoGnvSugerido = perfil?.preco_gnv || null
  const precoGasolinaSugerido = perfil?.preco_gasolina || null
  const ultimoHodometro = perfil?.ultimo_hodometro || null

  // ─── Inicializar entries a partir do diariaAlvo ────────────────────────────
  useEffect(() => {
    const d = diariaAlvo
    const gnvList = d?.gnv_entries_jsonb
    if (gnvList?.length) {
      setGnvEntries(gnvList)
    } else if (d?.custo_gnv && gnvEntries.length === 0) {
      setGnvEntries([{ volume: d.volume_gnv || 0, valor: d.custo_gnv, preco: d.preco_gnv || 0, custo: d.custo_gnv }])
    }
    const gasList = d?.gasolina_entries_jsonb
    if (gasList?.length) {
      setGasEntries(gasList)
    } else if (d?.custo_gasolina && gasEntries.length === 0) {
      setGasEntries([{ litros: d.litros_gasolina || 0, valor: d.custo_gasolina, preco: d.preco_gasolina || 0, custo: d.custo_gasolina, dias: 1 }])
    }
    if (d?.ganhos) {
      setGanhosValor(String(d.ganhos))
      setGanhosSalvos(true)
    }
    if (d?.outros_gastos) {
      setOutrosGastos(String(d.outros_gastos))
      setOutrosGastosSalvos(true)
    }
  }, [diariaAlvo])

  // ─── Totais acumulados ────────────────────────────────────────────────────
  const gnvTotalVolume = useMemo(() => gnvEntries.reduce((s, e) => s + (e.volume || 0), 0), [gnvEntries])
  const gnvTotalCusto = useMemo(() => gnvEntries.reduce((s, e) => s + (e.custo || e.valor || 0), 0), [gnvEntries])
  const gasTotalLitros = useMemo(() => gasEntries.reduce((s, e) => s + ((e.litros || 0) / Math.max(e.dias || 1, 1)), 0), [gasEntries])
  const gasTotalCusto = useMemo(() => gasEntries.reduce((s, e) => s + ((e.custo || e.valor || 0) / Math.max(e.dias || 1, 1)), 0), [gasEntries])

  const ultimoPrecoGnv = gnvEntries.length > 0 ? gnvEntries[gnvEntries.length - 1].preco : (precoGnvSugerido || '')
  const ultimoPrecoGas = gasEntries.length > 0 ? gasEntries[gasEntries.length - 1].preco : (precoGasolinaSugerido || '')

  // ─── Cálculos em tempo real (hoje) ─────────────────────────────────────────
  const kmFinal = kmCalculado !== null ? kmCalculado : (kmRodados ? parseFloat(kmRodados) : diariaHoje?.km_rodados || 0)
  const horasFinal = horasDecorridas !== null ? horasDecorridas : (tempoPainel ? parseFloat(tempoPainel.replace(',', '.')) : diariaHoje?.horas_operacao || 0)
  const kmPorHora = horasFinal > 0 ? kmFinal / horasFinal : 0
  const custoCombustivel = gnvTotalCusto + gasTotalCusto
  const custoPorKm = kmFinal > 0 ? custoCombustivel / kmFinal : 0
  const ganhosFinal = parseFloat(ganhosValor) || ganhosTransacoesTotal || diariaHoje?.ganhos || 0
  const outrosGastosFinal = parseFloat(outrosGastos) || diariaHoje?.outros_gastos || 0
  const totalGastos = custoCombustivel + outrosGastosFinal
  const lucroBruto = ganhosFinal - custoCombustivel
  const lucroLiquido = ganhosFinal - totalGastos

  // ─── Valores efetivos (hoje = local state, passado = diariaAlvo) ──────────
  const ef = useMemo(() => {
    if (ehHoje) return {
      km: kmFinal, horas: horasFinal, kmPorHora: kmPorHora,
      custoGnv: gnvTotalCusto, custoGasolina: gasTotalCusto,
      volumeGnv: gnvTotalVolume, litrosGasolina: gasTotalLitros,
      custoCombustivel: custoCombustivel, outrosGastos: outrosGastosFinal,
      totalGastos: totalGastos, custoPorKm: custoPorKm,
      ganhos: ganhosFinal, lucroBruto: lucroBruto, lucroLiquido: lucroLiquido,
    }
    const d = diariaAlvo
    const cc = (d?.custo_gnv || 0) + (d?.custo_gasolina || 0)
    const og = d?.outros_gastos || 0
    const tg = cc + og
    const g = d?.ganhos || 0
    const km = d?.km_rodados || 0
    const h = d?.horas_operacao || 0
    return {
      km, horas: h, kmPorHora: h > 0 ? km / h : 0,
      custoGnv: d?.custo_gnv || 0, custoGasolina: d?.custo_gasolina || 0,
      volumeGnv: d?.volume_gnv || 0, litrosGasolina: d?.litros_gasolina || 0,
      custoCombustivel: cc, outrosGastos: og, totalGastos: tg,
      custoPorKm: km > 0 ? cc / km : 0, ganhos: g,
      lucroBruto: g - cc, lucroLiquido: g - tg,
    }
  }, [ehHoje, kmFinal, horasFinal, kmPorHora, gnvTotalCusto, gasTotalCusto,
      gnvTotalVolume, gasTotalLitros, custoCombustivel, outrosGastosFinal,
      totalGastos, custoPorKm, ganhosFinal, lucroBruto, lucroLiquido, diariaAlvo])

  // ─── Salvar módulo ─────────────────────────────────────────────────────────
  const salvarModulo = async (dadosModulo, dadosPerfil = {}) => {
    setSalvando(true)
    setErro(null)
    setMensagem('')
    const dataParaSalvar = ehModoDia ? dataAlvoStr : undefined
    const result = await salvarDiaria(dadosModulo, dataParaSalvar)
    if (!result.success) { setErro(result.error); setSalvando(false); return false }
    if (Object.keys(dadosPerfil).length > 0) { await atualizarPerfil(dadosPerfil) }
    setSalvando(false)
    setMensagem('Salvo com sucesso!')
    setTimeout(() => setMensagem(''), 3000)
    return true
  }

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleSalvarKm = async () => {
    if (formaKm === 'a') {
      const inicial = parseFloat(hodInicial); const fin = parseFloat(hodFinal)
      if (!inicial || !fin || fin <= inicial) { setErro('Hodômetro final deve ser maior que o inicial'); return }
      const km = fin - inicial; setKmCalculado(km)
      const ok = await salvarModulo({ km_rodados: km, hodometro_inicial: inicial, hodometro_final: fin }, { ultimo_hodometro: fin })
      if (ok) setCardAberto(null)
    } else if (formaKm === 'b') {
      const km = parseFloat(kmRodados); const hod = parseFloat(hodAtual)
      if (!km || !hod || hod <= km) { setErro('Hodômetro atual deve ser maior que os km rodados'); return }
      setKmCalculado(km)
      const ok = await salvarModulo({ km_rodados: km, hodometro_inicial: hod - km, hodometro_final: hod }, { ultimo_hodometro: hod })
      if (ok) setCardAberto(null)
    } else if (formaKm === 'c') {
      const km = parseFloat(kmRodados)
      if (!km) { setErro('Informe quantos km rodou'); return }
      setKmCalculado(km)
      const ok = await salvarModulo({ km_rodados: km })
      if (ok) setCardAberto(null)
    }
  }

  const handleSalvarTempo = async () => {
    if (formaTempo === 'a') {
      if (!horaInicio) { setErro('Informe o horário que começou'); return }
      let horas
      if (encerrou === true) {
        if (!horaFim) { setErro('Informe o horário que encerrou'); return }
        const inicio = hoursFromTime(horaInicio); const fim = hoursFromTime(horaFim)
        if (fim <= inicio) { setErro('Horário de término deve ser após o início'); return }
        horas = fim - inicio
      } else if (encerrou === false) {
        const agora = new Date()
        const inicioDate = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), ...horaInicio.split(':').map(Number))
        if (agora <= inicioDate) { setErro('Horário de início não pode ser no futuro'); return }
        horas = (agora - inicioDate) / (1000 * 60 * 60)
      } else { setErro('Informe se já encerrou o expediente'); return }
      setHorasDecorridas(horas)
      const ok = await salvarModulo({ horas_operacao: Math.round(horas * 100) / 100 })
      if (ok) setCardAberto(null)
    } else if (formaTempo === 'b') {
      const t = parseFloat(tempoPainel.replace(',', '.'))
      if (!t || t <= 0) { setErro('Informe o tempo que o painel marca'); return }
      setHorasDecorridas(t)
      const ok = await salvarModulo({ horas_operacao: Math.round(t * 100) / 100 })
      if (ok) setCardAberto(null)
    }
  }

  const handleSalvarGanhos = async () => {
    const val = parseFloat(ganhosValor)
    if (!val && !ganhosTransacoesTotal) { setErro('Informe quanto ganhou hoje'); return }
    const total = val || ganhosTransacoesTotal
    setGanhosSalvos(true)
    await salvarModulo({ ganhos: Math.round(total * 100) / 100 })
    setCardAberto(null)
  }

  const handleSalvarOutrosGastos = async () => {
    const val = parseFloat(outrosGastos)
    setOutrosGastosSalvos(true)
    await salvarModulo({ outros_gastos: Math.round((val || 0) * 100) / 100 })
    setCardAberto(null)
  }

  // ─── GNV ───────────────────────────────────────────────────────────────────
  const handleAddGnv = async () => {
    const preco = parseFloat(gnvPreco || ultimoPrecoGnv)
    if (!preco || preco <= 0) { setErro('Informe o preço por m³ do GNV'); return }
    let volume = 0, valor = 0
    if (gnvForma === 'volume') {
      volume = parseFloat(gnvVolume); if (!volume) { setErro('Informe quantos m³ abasteceu'); return }
      valor = volume * preco
    } else {
      valor = parseFloat(gnvValor); if (!valor) { setErro('Informe o valor gasto'); return }
      volume = valor / preco
    }
    const entry = { volume: Math.round(volume * 100) / 100, valor: Math.round(valor * 100) / 100, preco: parseFloat(preco) || 0, custo: Math.round(valor * 100) / 100 }
    const novaLista = [...gnvEntries, entry]
    setGnvEntries(novaLista)
    setGnvFormAberto(false); setGnvForma(null); setGnvVolume(''); setGnvValor(''); setGnvPreco('')
    const totalVolume = novaLista.reduce((s, e) => s + (e.volume || 0), 0)
    const totalCusto = novaLista.reduce((s, e) => s + (e.custo || e.valor || 0), 0)
    const precoMedio = totalVolume > 0 ? totalCusto / totalVolume : preco
    await salvarModulo({
      custo_gnv: Math.round(totalCusto * 100) / 100, volume_gnv: Math.round(totalVolume * 100) / 100,
      preco_gnv: Math.round(precoMedio * 100) / 100, gnv_entries_jsonb: novaLista,
    }, { preco_gnv: Math.round(precoMedio * 100) / 100 })
  }

  const handleRemoveGnv = async (idx) => {
    const novaLista = gnvEntries.filter((_, i) => i !== idx)
    setGnvEntries(novaLista)
    const totalVolume = novaLista.reduce((s, e) => s + (e.volume || 0), 0)
    const totalCusto = novaLista.reduce((s, e) => s + (e.custo || e.valor || 0), 0)
    const precoMedio = totalVolume > 0 ? totalCusto / totalVolume : 0
    await salvarModulo({ custo_gnv: Math.round(totalCusto * 100) / 100, volume_gnv: Math.round(totalVolume * 100) / 100, preco_gnv: Math.round(precoMedio * 100) / 100 || null, gnv_entries_jsonb: novaLista },
      precoMedio > 0 ? { preco_gnv: Math.round(precoMedio * 100) / 100 } : {})
  }

  // ─── Gasolina ──────────────────────────────────────────────────────────────
  const handleAddGas = async () => {
    const preco = parseFloat(gasPreco || ultimoPrecoGas); const dias = Math.max(1, parseInt(gasDias) || 1)
    let litros = 0, valor = 0
    if (gasForma === 'litros') {
      litros = parseFloat(gasLitros); if (!litros) { setErro('Informe quantos litros abasteceu'); return }
      valor = litros * preco
    } else {
      valor = parseFloat(gasValor); if (!valor) { setErro('Informe o valor gasto'); return }
      litros = valor / preco
    }
    const entry = { litros: Math.round(litros * 100) / 100, valor: Math.round(valor * 100) / 100, preco: parseFloat(preco) || 0, custo: Math.round(valor * 100) / 100, dias: Math.max(1, parseInt(gasDias) || 1) }
    const novaLista = [...gasEntries, entry]
    setGasEntries(novaLista)
    setGasFormAberto(false); setGasForma(null); setGasLitros(''); setGasValor(''); setGasPreco(''); setGasDias('1')
    const totalLitros = novaLista.reduce((s, e) => s + ((e.litros || 0) / Math.max(e.dias || 1, 1)), 0)
    const totalCusto = novaLista.reduce((s, e) => s + ((e.custo || e.valor || 0) / Math.max(e.dias || 1, 1)), 0)
    const totalLitrosBruto = novaLista.reduce((s, e) => s + (e.litros || 0), 0)
    const precoMedio = totalLitrosBruto > 0 ? novaLista.reduce((s, e) => s + ((e.custo || e.valor || 0)), 0) / totalLitrosBruto : preco
    await salvarModulo({ custo_gasolina: Math.round(totalCusto * 100) / 100, litros_gasolina: Math.round(totalLitros * 100) / 100, preco_gasolina: Math.round(precoMedio * 100) / 100, gasolina_entries_jsonb: novaLista },
      { preco_gasolina: Math.round(precoMedio * 100) / 100 })
  }

  const handleRemoveGas = async (idx) => {
    const novaLista = gasEntries.filter((_, i) => i !== idx)
    setGasEntries(novaLista)
    const totalLitros = novaLista.reduce((s, e) => s + ((e.litros || 0) / Math.max(e.dias || 1, 1)), 0)
    const totalCusto = novaLista.reduce((s, e) => s + ((e.custo || e.valor || 0) / Math.max(e.dias || 1, 1)), 0)
    const totalLitrosBruto = novaLista.reduce((s, e) => s + (e.litros || 0), 0)
    const precoMedio = totalLitrosBruto > 0 ? novaLista.reduce((s, e) => s + ((e.custo || e.valor || 0)), 0) / totalLitrosBruto : 0
    await salvarModulo({ custo_gasolina: Math.round(totalCusto * 100) / 100, litros_gasolina: Math.round(totalLitros * 100) / 100, preco_gasolina: Math.round(precoMedio * 100) / 100 || null, gasolina_entries_jsonb: novaLista },
      precoMedio > 0 ? { preco_gasolina: Math.round(precoMedio * 100) / 100 } : {})
  }

  const reiniciarCard = (modo) => {
    if (modo === 'km') { setFormaKm(null); setHodInicial(''); setHodFinal(''); setKmRodados(''); setHodAtual(''); if (!diariaHoje?.km_rodados) setKmCalculado(null) }
    else if (modo === 'tempo') { setFormaTempo(null); setHoraInicio(''); setHoraFim(''); setEncerrou(null); setTempoPainel(''); if (!diariaHoje?.horas_operacao) setHorasDecorridas(null) }
    else if (modo === 'gnv') { setGnvFormAberto(false); setGnvForma(null); setGnvVolume(''); setGnvValor(''); setGnvPreco('') }
    else if (modo === 'gasolina') { setGasFormAberto(false); setGasForma(null); setGasLitros(''); setGasValor(''); setGasPreco(''); setGasDias('1') }
    else if (modo === 'ganhos') { setGanhosValor(''); setGanhosSalvos(false) }
    else if (modo === 'outros') { setOutrosGastos(''); setOutrosGastosSalvos(false) }
    setErro(null)
  }

  const kmPreenchido = ef.km > 0
  const tempoPreenchido = ef.horas > 0
  const gnvPreenchido = ef.custoGnv > 0
  const gasolinaPreenchido = ef.custoGasolina > 0
  const ganhosPreenchido = ef.ganhos > 0
  const outrosPreenchido = ef.outrosGastos > 0

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    )
  }

  return (
    <section className="space-y-4 animate-in fade-in duration-300 pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CarFront size={18} className="text-slate-700" />
          <div>
            <h2 className="text-sm font-black text-slate-800">Desempenho</h2>
            <p className="text-[9px] text-gray-500 font-bold">
              {ehModoDia ? (ehHoje ? getToday() : dataAlvoLabel) : (periodRange ? `${diaStr(periodRange.start)} → ${diaStr(periodRange.end)}` : '')}
            </p>
          </div>
        </div>
      </div>

      {!ehModoDia && diariasDoPeriodo.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-center">
          <p className="text-[10px] font-bold text-gray-400">Nenhum dado de desempenho neste período.</p>
          <p className="text-[8px] text-gray-300 mt-1">Registre diárias para ver estatísticas agregadas.</p>
        </div>
      )}

      {ehModoDia && !ehHoje && !diariaAlvo && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-center">
          <p className="text-[10px] font-bold text-gray-400">Nenhum dado de desempenho para {dataAlvoLabel}.</p>
          <p className="text-[8px] text-gray-300 mt-1">Preencha os módulos abaixo para registrar.</p>
        </div>
      )}

      {ehModoDia && ehHoje && diariaHoje && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-2">
          <CheckCircle2 size={12} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-[9px] font-bold text-amber-700">
            Dados de hoje já registrados ({diariaHoje.km_rodados ? diariaHoje.km_rodados + ' km' : ''}{diariaHoje.horas_operacao ? ', ' + formatDecimalHours(diariaHoje.horas_operacao) : ''}{diariaHoje.ganhos ? ', ' + fmt(diariaHoje.ganhos) : ''}).
          </p>
        </div>
      )}

      {!ehModoDia ? (
        /* ─── Modo agregado ──────────────────────────────────────────────── */
        diariasDoPeriodo.length > 0 ? (
          <PeriodSummaryCard a={agregadoPeriodo} totalDias={diariasDoPeriodo.length} />
        ) : null
      ) : (
        /* ─── Modo dia ───────────────────────────────────────────────────── */
        <>
      <ResumoCard
        km={ef.km} horas={ef.horas} kmPorHora={ef.kmPorHora}
        custoGnv={ef.custoGnv} custoGasolina={ef.custoGasolina}
        volumeGnvExibido={ef.volumeGnv} litrosGasolinaExibido={ef.litrosGasolina}
        custoCombustivel={ef.custoCombustivel} outrosGastos={ef.outrosGastos} totalGastos={ef.totalGastos}
        custoPorKm={ef.custoPorKm}
        ganhos={ef.ganhos} lucroBruto={ef.lucroBruto} lucroLiquido={ef.lucroLiquido}
      />

      {mensagem && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2">
          <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" />
          <p className="text-[9px] font-bold text-emerald-700">{mensagem}</p>
        </div>
      )}
      {erro && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
          <p className="text-[9px] font-bold text-rose-500">{erro}</p>
        </div>
      )}

      {/* ─── Módulos editáveis ─────────────────────────────────────────── */}
      <ModuleCard icon={DollarSign} titulo="Ganhos do dia"
        resumo={ganhosPreenchido ? fmt(ganhosFinal) : 'Não informado'}
        aberto={cardAberto === 'ganhos'} onToggle={() => setCardAberto(cardAberto === 'ganhos' ? null : 'ganhos')}
        preenchido={ganhosPreenchido}>
        {ganhosTransacoes.length > 0 && (
          <div className="bg-emerald-50 rounded-xl p-3 space-y-1.5">
            <p className="text-[8px] font-black text-emerald-600 uppercase">Encontrado nas transações</p>
            {ganhosTransacoes.map((t, i) => (
              <div key={i} className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-emerald-700">{t.descricao || 'Renda app'}</span>
                <span className="font-black text-emerald-700">{fmt(t.valor)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between text-[10px] border-t border-emerald-200 pt-1.5 mt-1.5">
              <span className="font-black text-emerald-700 uppercase">Total automático</span>
              <span className="font-black text-emerald-700">{fmt(ganhosTransacoesTotal)}</span>
            </div>
          </div>
        )}
        <div className="space-y-3">
          <Input label={ganhosTransacoesTotal > 0 ? 'Ajustar / complementar (opcional)' : 'Quanto você ganhou hoje?'}
            placeholder="Ex: 250.00" value={ganhosValor} onChange={e => setGanhosValor(e.target.value)} />
          <button onClick={handleSalvarGanhos} disabled={salvando}
            className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase active:scale-95 transition-all disabled:opacity-50">
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </ModuleCard>

      {/* ─── KM ──────────────────────────────────────────────────────────── */}
      <ModuleCard icon={CarFront} titulo="Quilometragem"
        resumo={kmPreenchido ? `${kmFinal.toFixed(0)} km` : 'Não informado'}
        aberto={cardAberto === 'km'} onToggle={() => setCardAberto(cardAberto === 'km' ? null : 'km')}
        preenchido={kmPreenchido}>
        {!formaKm ? (
          <div className="space-y-2">
            {FORMA_KM.map(f => (
              <button key={f.id} onClick={() => { setFormaKm(f.id); setErro(null) }}
                className="w-full text-left p-4 rounded-2xl border border-gray-100 hover:border-gray-200 active:scale-[0.98] transition-all space-y-1">
                <p className="text-[11px] font-black text-slate-800">{f.label}</p>
                <p className="text-[9px] text-gray-400 font-bold">{f.desc}</p>
              </button>
            ))}
          </div>
        ) : formaKm === 'a' ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Hodômetro inicial" placeholder="00000" value={hodInicial} onChange={e => setHodInicial(e.target.value)} />
              <Input label="Hodômetro final" placeholder="00000" value={hodFinal} onChange={e => setHodFinal(e.target.value)} />
            </div>
            <button onClick={handleSalvarKm} disabled={salvando}
              className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase active:scale-95 transition-all disabled:opacity-50">{salvando ? 'Salvando...' : 'Salvar'}</button>
            <button onClick={() => reiniciarCard('km')} className="w-full py-2 text-[9px] font-bold text-gray-400 active:scale-95">Voltar</button>
          </div>
        ) : formaKm === 'b' ? (
          <div className="space-y-3">
            <Input label="KM rodados hoje" placeholder="KM rodados" value={kmRodados} onChange={e => setKmRodados(e.target.value)} />
            <Input label="Hodômetro atual" placeholder="00000" value={hodAtual} onChange={e => setHodAtual(e.target.value)} />
            <button onClick={handleSalvarKm} disabled={salvando}
              className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase active:scale-95 transition-all disabled:opacity-50">{salvando ? 'Salvando...' : 'Salvar'}</button>
            <button onClick={() => reiniciarCard('km')} className="w-full py-2 text-[9px] font-bold text-gray-400 active:scale-95">Voltar</button>
          </div>
        ) : (
          <div className="space-y-3">
            <Input label="Quantos km você rodou hoje?" placeholder="KM rodados" value={kmRodados} onChange={e => setKmRodados(e.target.value)} />
            {ultimoHodometro && <p className="text-[9px] text-gray-400 font-bold">Último hodômetro registrado: {ultimoHodometro.toFixed(0)} km</p>}
            <button onClick={handleSalvarKm} disabled={salvando}
              className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase active:scale-95 transition-all disabled:opacity-50">{salvando ? 'Salvando...' : 'Salvar'}</button>
            <button onClick={() => reiniciarCard('km')} className="w-full py-2 text-[9px] font-bold text-gray-400 active:scale-95">Voltar</button>
          </div>
        )}
      </ModuleCard>

      {/* ─── Tempo ────────────────────────────────────────────────────────── */}
      <ModuleCard icon={Clock} titulo="Tempo de operação"
        resumo={tempoPreenchido ? formatDecimalHours(horasFinal) : 'Não informado'}
        aberto={cardAberto === 'tempo'} onToggle={() => setCardAberto(cardAberto === 'tempo' ? null : 'tempo')}
        preenchido={tempoPreenchido}>
        {!formaTempo ? (
          <div className="space-y-2">
            {FORMA_TEMPO.map(f => (
              <button key={f.id} onClick={() => { setFormaTempo(f.id); setErro(null) }}
                className="w-full text-left p-4 rounded-2xl border border-gray-100 hover:border-gray-200 active:scale-[0.98] transition-all space-y-1">
                <p className="text-[11px] font-black text-slate-800">{f.label}</p>
                <p className="text-[9px] text-gray-400 font-bold">{f.desc}</p>
              </button>
            ))}
          </div>
        ) : formaTempo === 'a' ? (
          <div className="space-y-3">
            <Input label="Que horas você ligou o carro?" type="time" value={horaInicio} onChange={e => { setHoraInicio(e.target.value); setErro(null) }} />
            {horaInicio && encerrou === null && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-gray-600">Já encerrou o expediente?</p>
                <div className="flex gap-2">
                  <button onClick={() => setEncerrou(true)} className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase active:scale-95 transition-all">Sim, já encerrei</button>
                  <button onClick={() => setEncerrou(false)} className="flex-1 py-3 bg-gray-100 text-slate-700 rounded-xl text-[10px] font-black uppercase active:scale-95 transition-all">Ainda estou trabalhando</button>
                </div>
              </div>
            )}
            {encerrou === true && <Input label="Que horas você encerrou?" type="time" value={horaFim} onChange={e => setHoraFim(e.target.value)} />}
            {encerrou !== null && (
              <button onClick={handleSalvarTempo} disabled={salvando}
                className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase active:scale-95 transition-all disabled:opacity-50">{salvando ? 'Salvando...' : 'Salvar'}</button>
            )}
            <button onClick={() => reiniciarCard('tempo')} className="w-full py-2 text-[9px] font-bold text-gray-400 active:scale-95">Voltar</button>
          </div>
        ) : (
          <div className="space-y-3">
            <Input label="Quantas horas o painel marca?" placeholder="Ex: 5.30 ou 5:30" value={tempoPainel} onChange={e => setTempoPainel(e.target.value)} />
            <button onClick={handleSalvarTempo} disabled={salvando}
              className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase active:scale-95 transition-all disabled:opacity-50">{salvando ? 'Salvando...' : 'Salvar'}</button>
            <button onClick={() => reiniciarCard('tempo')} className="w-full py-2 text-[9px] font-bold text-gray-400 active:scale-95">Voltar</button>
          </div>
        )}
      </ModuleCard>

      {/* ─── GNV ──────────────────────────────────────────────────────────── */}
      <ModuleCard icon={Zap} titulo="GNV"
        resumo={gnvPreenchido ? `${gnvTotalVolume.toFixed(1)} m³ · ${fmt(gnvTotalCusto)}` : 'Não informado'}
        aberto={cardAberto === 'gnv'} onToggle={() => setCardAberto(cardAberto === 'gnv' ? null : 'gnv')}
        preenchido={gnvPreenchido}>
        {gnvEntries.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[8px] font-black text-gray-400 uppercase">Abastecimentos de hoje</p>
            {gnvEntries.map((entry, idx) => (
              <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-gray-400">#{idx + 1}</span>
                  <span className="text-[10px] font-bold text-slate-800">
                    {entry.volume > 0 ? `${entry.volume.toFixed(1)} m³` : ''}
                    {entry.valor > 0 ? ` ${fmt(entry.valor)}` : ''}
                  </span>
                  <span className="text-[8px] text-gray-400">× R$ {entry.preco.toFixed(2)}/m³</span>
                </div>
                <button onClick={() => handleRemoveGnv(idx)} className="text-rose-400 hover:text-rose-600 active:scale-90 transition-all p-1"><Trash2 size={11} /></button>
              </div>
            ))}
            <div className="flex items-center justify-between bg-slate-100 rounded-xl px-3 py-2 mt-1">
              <span className="text-[9px] font-black text-gray-500 uppercase">Total</span>
              <span className="text-[10px] font-black text-slate-800">{gnvTotalVolume.toFixed(1)} m³ · {fmt(gnvTotalCusto)}</span>
            </div>
          </div>
        )}
        {!gnvFormAberto ? (
          <button onClick={() => { setGnvFormAberto(true); setErro(null) }}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-xl text-[10px] font-black text-gray-400 hover:border-gray-300 active:scale-[0.98] transition-all">
            <Plus size={12} /> {gnvEntries.length > 0 ? 'Adicionar outro abastecimento' : 'Adicionar abastecimento'}
          </button>
        ) : (
          <div className="space-y-3 bg-gray-50 rounded-2xl p-4">
            <p className="text-[9px] font-black text-gray-400 uppercase">{gnvEntries.length > 0 ? `Abastecimento #${gnvEntries.length + 1}` : 'Novo abastecimento'}</p>
            {!gnvForma ? (
              <div className="flex gap-2">
                <button onClick={() => { setGnvForma('volume'); setErro(null) }} className="flex-1 py-3 rounded-xl border border-gray-200 text-[10px] font-bold text-slate-700 active:scale-[0.98] transition-all">Volume (m³)</button>
                <button onClick={() => { setGnvForma('valor'); setErro(null) }} className="flex-1 py-3 rounded-xl border border-gray-200 text-[10px] font-bold text-slate-700 active:scale-[0.98] transition-all">Valor (R$)</button>
              </div>
            ) : (
              <>
                {gnvForma === 'volume' ? <Input label="m³ abastecidos" placeholder="Ex: 8.5" value={gnvVolume} onChange={e => setGnvVolume(e.target.value)} />
                  : <Input label="Valor gasto (R$)" placeholder="Ex: 38.00" value={gnvValor} onChange={e => setGnvValor(e.target.value)} />}
                <Input label="Preço por m³ (R$)" placeholder={ultimoPrecoGnv ? `Ex: ${ultimoPrecoGnv}` : "Ex: 4.50"}
                  value={gnvPreco || (ultimoPrecoGnv ? String(ultimoPrecoGnv) : '')}
                  onChange={e => setGnvPreco(e.target.value)}
                  hint={ultimoPrecoGnv ? `Último: R$ ${ultimoPrecoGnv.toFixed(2)}/m³` : 'Preço do GNV no posto'} />
                <div className="flex gap-2">
                  <button onClick={handleAddGnv} disabled={salvando} className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase active:scale-95 transition-all disabled:opacity-50">{salvando ? 'Salvando...' : 'Adicionar'}</button>
                  <button onClick={() => reiniciarCard('gnv')} className="py-3 px-4 text-[9px] font-bold text-gray-400 active:scale-95">Cancelar</button>
                </div>
              </>
            )}
            {gnvForma && <button onClick={() => setGnvForma(null)} className="text-[8px] font-bold text-gray-400 active:scale-95">← Voltar</button>}
          </div>
        )}
      </ModuleCard>

      {/* ─── Gasolina ─────────────────────────────────────────────────────── */}
      <ModuleCard icon={Fuel} titulo="Gasolina"
        resumo={gasolinaPreenchido ? `${gasTotalLitros.toFixed(1)} L · ${fmt(gasTotalCusto)}` : 'Não informado'}
        aberto={cardAberto === 'gasolina'} onToggle={() => setCardAberto(cardAberto === 'gasolina' ? null : 'gasolina')}
        preenchido={gasolinaPreenchido}>
        {gasEntries.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[8px] font-black text-gray-400 uppercase">Abastecimentos de hoje</p>
            {gasEntries.map((entry, idx) => (
              <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-gray-400">#{idx + 1}</span>
                  <span className="text-[10px] font-bold text-slate-800">
                    {entry.litros > 0 ? `${entry.litros.toFixed(1)} L` : ''}
                    {entry.valor > 0 ? ` ${fmt(entry.valor)}` : ''}
                  </span>
                  <span className="text-[8px] text-gray-400">× R$ {entry.preco.toFixed(2)}/L</span>
                  {entry.dias > 1 && <span className="text-[8px] text-amber-500 font-bold">{entry.dias}d</span>}
                </div>
                <button onClick={() => handleRemoveGas(idx)} className="text-rose-400 hover:text-rose-600 active:scale-90 transition-all p-1"><Trash2 size={11} /></button>
              </div>
            ))}
            <div className="flex items-center justify-between bg-slate-100 rounded-xl px-3 py-2 mt-1">
              <span className="text-[9px] font-black text-gray-500 uppercase">Total (por dia)</span>
              <span className="text-[10px] font-black text-slate-800">{gasTotalLitros.toFixed(1)} L · {fmt(gasTotalCusto)}</span>
            </div>
          </div>
        )}
        {!gasFormAberto ? (
          <button onClick={() => { setGasFormAberto(true); setErro(null) }}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-xl text-[10px] font-black text-gray-400 hover:border-gray-300 active:scale-[0.98] transition-all">
            <Plus size={12} /> {gasEntries.length > 0 ? 'Adicionar outro abastecimento' : 'Adicionar abastecimento'}
          </button>
        ) : (
          <div className="space-y-3 bg-gray-50 rounded-2xl p-4">
            <p className="text-[9px] font-black text-gray-400 uppercase">{gasEntries.length > 0 ? `Abastecimento #${gasEntries.length + 1}` : 'Novo abastecimento'}</p>
            {!gasForma ? (
              <div className="flex gap-2">
                <button onClick={() => { setGasForma('litros'); setErro(null) }} className="flex-1 py-3 rounded-xl border border-gray-200 text-[10px] font-bold text-slate-700 active:scale-[0.98] transition-all">Volume (L)</button>
                <button onClick={() => { setGasForma('valor'); setErro(null) }} className="flex-1 py-3 rounded-xl border border-gray-200 text-[10px] font-bold text-slate-700 active:scale-[0.98] transition-all">Valor (R$)</button>
              </div>
            ) : (
              <>
                {gasForma === 'litros' ? <Input label="Litros abastecidos" placeholder="Ex: 15.5" value={gasLitros} onChange={e => setGasLitros(e.target.value)} />
                  : <Input label="Valor gasto (R$)" placeholder="Ex: 90.00" value={gasValor} onChange={e => setGasValor(e.target.value)} />}
                <Input label="Preço por litro (R$)" placeholder={ultimoPrecoGas ? `Ex: ${ultimoPrecoGas}` : "Ex: 5.80"}
                  value={gasPreco || (ultimoPrecoGas ? String(ultimoPrecoGas) : '')}
                  onChange={e => setGasPreco(e.target.value)}
                  hint={ultimoPrecoGas ? `Último: R$ ${ultimoPrecoGas.toFixed(2)}/L` : 'Preço da gasolina no posto'} />
                <Input label="Distribuir por quantos dias?" type="number" min="1" value={gasDias} onChange={e => setGasDias(e.target.value)}
                  hint="Se o tanque durar mais de um dia, o custo será rateado" />
                <div className="flex gap-2">
                  <button onClick={handleAddGas} disabled={salvando} className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase active:scale-95 transition-all disabled:opacity-50">{salvando ? 'Salvando...' : 'Adicionar'}</button>
                  <button onClick={() => reiniciarCard('gasolina')} className="py-3 px-4 text-[9px] font-bold text-gray-400 active:scale-95">Cancelar</button>
                </div>
              </>
            )}
            {gasForma && <button onClick={() => setGasForma(null)} className="text-[8px] font-bold text-gray-400 active:scale-95">← Voltar</button>}
          </div>
        )}
      </ModuleCard>

      </>
      )}
      {/* ─── Insights ─────────────────────────────────────────────────────── */}
      {(ehModoDia ? (kmPreenchido || ganhosPreenchido || gnvPreenchido) : (agregadoPeriodo.km > 0 || agregadoPeriodo.ganhos > 0 || agregadoPeriodo.custoGnv > 0)) && (
        <InsightsCards historicoFull={historicoFull} />
      )}
    </section>
  )
}
