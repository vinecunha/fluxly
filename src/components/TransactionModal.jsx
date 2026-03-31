import React, { useState, useEffect, useMemo } from 'react'
import { X, ChevronRight, ChevronLeft, Check, Repeat, CreditCard } from 'lucide-react'
import { ActionConfirmationModal } from './BillsList'

const getToday = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
const fmt = (v) => Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})

const TIPOS = [
  { id:'renda',            label:'Receita', emoji:'💰', cor:'#10b981', bg:'#d1fae5' },
  { id:'gasto_diario',     label:'Gasto',   emoji:'💸', cor:'#ef4444', bg:'#fee2e2' },
  { id:'fixa',             label:'Fixa',    emoji:'🏠', cor:'#8b5cf6', bg:'#ede9fe' },
  { id:'esporadica',       label:'Extra',   emoji:'⚡', cor:'#f59e0b', bg:'#fef3c7' },
  { id:'reserva',          label:'Reserva', emoji:'🏦', cor:'#3b82f6', bg:'#dbeafe' },
  { id:'pagamento_cartao', label:'Fatura',  emoji:'💳', cor:'#6366f1', bg:'#e0e7ff' },
]
const CATS = [
  {label:'Combustível',emoji:'⛽'},{label:'Mercado',emoji:'🛒'},
  {label:'Saúde',emoji:'💊'},{label:'Educação',emoji:'📚'},
  {label:'Transporte por App',emoji:'🚗'},{label:'Delivery',emoji:'🍔'},
  {label:'Restaurantes',emoji:'🍽️'},{label:'Lazer',emoji:'🎮'},
  {label:'Carro',emoji:'🚙'},{label:'Casa',emoji:'🏡'},
  {label:'Assinaturas',emoji:'📱'},{label:'Aplicativos',emoji:'📲'},
  {label:'Empréstimos e Financiamentos',emoji:'🏦'},{label:'Seguros',emoji:'🛡️'},
  {label:'Telefone/Internet',emoji:'📡'},{label:'Cuidados Pessoais',emoji:'💆'},
  {label:'Pets',emoji:'🐾'},{label:'Viagens',emoji:'✈️'},
  {label:'Lojas e Sites',emoji:'🛍️'},{label:'Saque',emoji:'💵'},
  {label:'Boletos Diversos',emoji:'📄'},{label:'Transferências Diversas',emoji:'↔️'},
  {label:'Mesma Titularidade',emoji:'🔄'},{label:'Pagamento de Fatura',emoji:'💳'},
  {label:'Outros Gastos',emoji:'📦'},
]
const ORIGENS  = ['Aplicativos','Salário','Freelance','Particular','Vendas','Gorjeta']
const APPS     = ['Uber','99','iFood','Outros']
const BANCOS   = ['Nubank','Inter','Mercado Pago','CDB','Poupança','Outros']
const DEF = { descricao:'', valor:'', tipo:'renda', categoria:'Renda', subcategoria:'',
              destino_reserva:'', data:getToday(), repetir:'nao', recorrencia_limite:'', cartao_id:null,
              _reservaOp:'deposito', _cdiPct:'100', _cdiCarencia:'0' }

export const TransactionModal = ({ isOpen, onClose, onSave, initialData, transactions=[], cartoes=[] }) => {
  const [form, setForm]   = useState(DEF)
  const [step, setStep]   = useState(0)
  const [dir,  setDir]    = useState(0)
  const [confirmTarget, setConfirmTarget] = useState(null)

  const sugestoes = useMemo(() => [...new Set(transactions.map(t=>t.descricao))].sort(), [transactions])
  const sf = (k,v) => setForm(f=>({...f,[k]:v}))

  useEffect(() => {
    if (!isOpen) return
    setStep(0); setDir(0)
    if (initialData) {
      const isEdit    = !!initialData.id
      const isPrefill = !isEdit && !!(initialData.tipo || initialData.categoria)
      setForm({ descricao:initialData.descricao||'', valor:String(initialData.valor||''),
        tipo:initialData.tipo||'renda',
        categoria:initialData.categoria||(initialData.tipo==='renda'?'Renda':initialData.tipo==='reserva'?'Reserva':'Outros'),
        subcategoria:initialData.subcategoria||'', destino_reserva:initialData.destino_reserva||'',
        data:initialData.data||getToday(), repetir:initialData.repetir||'nao',
        recorrencia_limite:initialData.recorrencia_limite||'', cartao_id:initialData.cartao_id||null,
        _reservaOp: initialData.tipo==='reserva' && Number(initialData.valor)<0 ? 'retirada' : 'deposito',
        _cdiPct: initialData._cdiPct || '100',
        _cdiCarencia: initialData._cdiCarencia || '0' })
      setStep(isEdit ? 2 : isPrefill ? 1 : 2)
    } else { setForm({...DEF, data:getToday()}) }
  }, [isOpen, initialData])

  if (!isOpen) return null

  const tipo       = TIPOS.find(t=>t.id===form.tipo)||TIPOS[0]
  const isGasto    = ['gasto_diario','fixa','esporadica'].includes(form.tipo)
  const isPag      = form.tipo==='pagamento_cartao'
  const isRenda    = form.tipo==='renda'
  const isReserva  = form.tipo==='reserva'
  const showCartao = (isGasto||isPag) && cartoes.length>0

  const showApps = isGasto && form.categoria === 'Aplicativos'
  const steps = isPag                      ? ['tipo','cartao','valor','data']
              : isReserva                  ? ['tipo','banco','valor','data']
              : isRenda                    ? ['tipo','origem','valor','data']
              : isGasto&&showCartao&&showApps ? ['tipo','categoria','apps','cartao','valor','data']
              : isGasto&&showCartao         ? ['tipo','categoria','cartao','valor','data']
              : isGasto&&showApps           ? ['tipo','categoria','apps','valor','data']
              : ['tipo','categoria','valor','data']

  const cur      = steps[Math.min(step, steps.length-1)]
  const isLast   = step===steps.length-1
  
  // CORREÇÃO: Para reserva, aceita valor positivo (depósito) ou negativo (retirada)
  // Para outros tipos, aceita apenas positivo
  const valorNum = parseFloat(String(form.valor).replace(',','.'))||0
  let canGo = true
  
  if (cur === 'valor') {
    if (isReserva) {
      // Reserva: aceita qualquer valor diferente de zero
      canGo = valorNum !== 0 && (isPag || form.descricao.trim())
    } else {
      // Outros tipos: aceita apenas positivo
      canGo = valorNum > 0 && (isPag || form.descricao.trim())
    }
  }

  const advance = (namedOrNum) => {
    setDir(1)
    setTimeout(()=>{
      if (typeof namedOrNum === 'string') {
        const idx = steps.indexOf(namedOrNum)
        if (idx !== -1) setStep(idx)
        else setStep(s => s + 1)
      } else if (typeof namedOrNum === 'number') {
        setStep(namedOrNum)
      } else {
        setStep(s => s + 1)
      }
      setDir(0)
    }, 10)
  }
  const back = () => { setDir(-1); setTimeout(()=>{ setStep(s=>s-1); setDir(0) },10) }

  const submit = () => {
    if (!canGo) return
    
    // Para reserva, manter o sinal (positivo para depósito, negativo para retirada)
    // Para outros tipos, garantir valor positivo
    let formFinal = { ...form }
    
    if (isReserva) {
      // Reserva: mantém o valor como está (já tem o sinal correto pelo toggle)
      const valorFinal = parseFloat(String(form.valor).replace(',','.')) || 0
      const isRetirada = form._reservaOp === 'retirada'
      formFinal.valor = isRetirada ? -Math.abs(valorFinal) : Math.abs(valorFinal)
    } else {
      // Outros tipos: garantir positivo
      formFinal.valor = Math.abs(parseFloat(String(form.valor).replace(',','.')) || 0)
    }
    
    if (initialData?.recorrencia_id) {
      setConfirmTarget({bill:initialData,type:'edit'})
    } else {
      onSave(formFinal, false)
    }
  }

  const AUTO = ['tipo','categoria','apps','cartao','banco','origem']
  const showBtn = !AUTO.includes(cur)

  // Mensagem de erro para valor inválido
  const valorInvalido = cur === 'valor' && !canGo && valorNum !== 0
  const valorZeroMsg = cur === 'valor' && valorNum === 0

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose}/>
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-300">

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200"/>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            {step>0 && <button onClick={back} className="p-1.5 rounded-full hover:bg-gray-100 active:scale-95 transition-all"><ChevronLeft size={20} className="text-gray-600"/></button>}
            <h2 className="text-base font-black text-gray-800 truncate max-w-[220px]">
              {cur==='tipo' ? (initialData?'Editar registro':'Novo registro')
               : cur==='valor'||cur==='data' ? (form.descricao||`${tipo.emoji} ${tipo.label}`)
               : `${tipo.emoji} ${tipo.label}`}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full active:scale-95 transition-all"><X size={18} className="text-gray-400"/></button>
        </div>

        {/* Dots */}
        <div className="flex gap-1.5 justify-center pb-3 flex-shrink-0">
          {steps.map((_,i)=>(
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i===step?'w-6 bg-gray-800':i<step?'w-3 bg-gray-300':'w-3 bg-gray-100'}`}/>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 no-scrollbar">

          {/* TIPO */}
          {cur==='tipo' && (
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-4">O que quer registrar?</p>
              <div className="grid grid-cols-2 gap-3">
                {TIPOS.map(t=>(
                  <button key={t.id} type="button"
                    onClick={()=>{ setForm(f=>({...f,tipo:t.id,categoria:t.id==='renda'?'Renda':t.id==='reserva'?'Reserva':'Outros',subcategoria:'',destino_reserva:'',cartao_id:null})); advance() }}
                    className="flex items-center gap-3 p-4 rounded-2xl border-2 transition-all active:scale-95"
                    style={{borderColor:form.tipo===t.id?t.cor:'transparent',backgroundColor:t.bg}}>
                    <span className="text-2xl">{t.emoji}</span>
                    <span className="text-[13px] font-black text-gray-700">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CATEGORIA */}
          {cur==='categoria' && (
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-4">Qual categoria?</p>
              <div className="grid grid-cols-2 gap-2 max-h-[52vh] overflow-y-auto pr-1 no-scrollbar">
                {CATS.map(cat=>(
                  <button key={cat.label} type="button"
                    onClick={()=>{ setForm(f=>({...f,categoria:cat.label,subcategoria:''})); if(cat.label==='Aplicativos') advance('apps'); else advance() }}
                    className={`flex items-center gap-2 py-3 px-3 rounded-2xl font-bold text-[12px] transition-all active:scale-95 border-2 text-left ${form.categoria===cat.label?'border-slate-700 bg-slate-50 text-slate-800':'border-gray-100 bg-white text-gray-600'}`}>
                    <span className="text-base flex-shrink-0">{cat.emoji}</span>
                    <span className="leading-tight">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CARTÃO */}
          {cur==='cartao' && (
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-4">
                {isPag?'Qual cartão?':'Pagar com cartão?'}
              </p>
              <div className="space-y-2">
                {!isPag && (
                  <button type="button" onClick={()=>{ sf('cartao_id',null); advance() }}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all active:scale-95 ${form.cartao_id===null?'border-gray-800 bg-gray-50':'border-gray-100 bg-white'}`}>
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-lg">💵</div>
                    <span className="font-black text-gray-700">Dinheiro / Pix</span>
                    {form.cartao_id===null && <Check size={16} className="ml-auto text-gray-800"/>}
                  </button>
                )}
                {cartoes.map(c=>(
                  <button key={c.id} type="button" onClick={()=>{ sf('cartao_id',c.id); advance() }}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all active:scale-95 ${form.cartao_id===c.id?'border-indigo-500 bg-indigo-50':'border-gray-100 bg-white'}`}>
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-lg">💳</div>
                    <span className="font-black text-gray-700">{c.nome}</span>
                    {form.cartao_id===c.id && <Check size={16} className="ml-auto text-indigo-600"/>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ORIGEM (renda) */}
          {cur==='origem' && (
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-4">Qual a origem?</p>
              <div className="grid grid-cols-2 gap-2">
                {ORIGENS.map(sub=>(
                  <button key={sub} type="button" onClick={()=>{ sf('subcategoria',sub); advance() }}
                    className={`py-4 rounded-2xl font-black text-[13px] transition-all active:scale-95 border-2 ${form.subcategoria===sub?'border-emerald-500 bg-emerald-50 text-emerald-700':'border-gray-100 bg-white text-gray-600'}`}>
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* BANCO (reserva) */}
          {cur==='banco' && (
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-4">Onde está guardado?</p>
              <div className="grid grid-cols-2 gap-2">
                {BANCOS.map(b=>(
                  <button key={b} type="button" onClick={()=>{ sf('destino_reserva',b); advance() }}
                    className={`py-4 rounded-2xl font-black text-[13px] transition-all active:scale-95 border-2 ${form.destino_reserva===b?'border-blue-500 bg-blue-50 text-blue-700':'border-gray-100 bg-white text-gray-600'}`}>
                    {b}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* APPS */}
          {cur==='apps' && (
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-4">Qual aplicativo?</p>
              <div className="grid grid-cols-2 gap-2">
                {APPS.map(app=>(
                  <button key={app} type="button" onClick={()=>{ sf('subcategoria',app); advance() }}
                    className={`py-4 rounded-2xl font-black text-[13px] transition-all active:scale-95 border-2 ${form.subcategoria===app?'border-slate-700 bg-slate-50 text-slate-800':'border-gray-100 bg-white text-gray-600'}`}>
                    {app}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* VALOR + DESCRIÇÃO */}
          {cur==='valor' && (
            <div className="space-y-5">

              {/* Toggle depósito/retirada — só para reserva */}
              {isReserva && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {label:'Depósito', emoji:'➕', val:'deposito', cor:'#3b82f6', bg:'#dbeafe'},
                      {label:'Retirada', emoji:'➖', val:'retirada', cor:'#ef4444', bg:'#fee2e2'},
                    ].map(op=>(
                      <button key={op.val} type="button"
                        onClick={()=>sf('_reservaOp', op.val)}
                        className="flex items-center gap-2 p-3 rounded-2xl border-2 transition-all active:scale-95"
                        style={{
                          borderColor:(form._reservaOp||'deposito')===op.val?op.cor:'transparent',
                          backgroundColor:op.bg,
                        }}>
                        <span className="text-lg">{op.emoji}</span>
                        <span className="text-[13px] font-black text-gray-700">{op.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* CDI — só para depósito */}
                  {(form._reservaOp||'deposito')==='deposito' && (
                    <div className="p-4 bg-blue-50 rounded-2xl border-2 border-blue-100 space-y-3 animate-in fade-in duration-200">
                      <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Rendimento</p>
                      <div className="space-y-2">
                        <div>
                          <p className="text-[9px] font-bold text-gray-500 mb-1.5">% do CDI que rende</p>
                          <div className="flex gap-2">
                            {['100','110','120','Outro'].map(pct=>(
                              <button key={pct} type="button"
                                onClick={()=>sf('_cdiPct', pct==='Outro'?form._cdiPct:pct)}
                                className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all border-2 ${
                                  (form._cdiPct===pct||(pct==='Outro'&&!['100','110','120'].includes(form._cdiPct)))
                                  ?'border-blue-500 bg-white text-blue-700'
                                  :'border-transparent bg-white text-gray-500'
                                }`}>
                                {pct==='Outro'?'Outro':pct+'%'}
                              </button>
                            ))}
                          </div>
                          {!['100','110','120'].includes(form._cdiPct) && (
                            <input type="text" inputMode="decimal" placeholder="Ex: 105"
                              className="mt-2 w-full p-2.5 rounded-xl bg-white border-2 border-blue-200 focus:border-blue-500 outline-none text-sm font-bold text-gray-800"
                              value={form._cdiPct}
                              onChange={e=>sf('_cdiPct', e.target.value.replace(/[^0-9.]/g,''))}/>
                          )}
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-gray-500 mb-1.5">Carência (dias para resgatar)</p>
                          <div className="flex gap-2">
                            {['0','30','60','90'].map(d=>(
                              <button key={d} type="button"
                                onClick={()=>sf('_cdiCarencia', d)}
                                className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all border-2 ${
                                  form._cdiCarencia===d
                                  ?'border-blue-500 bg-white text-blue-700'
                                  :'border-transparent bg-white text-gray-500'
                                }`}>
                                {d==='0'?'D+0':d+'d'}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">Valor</p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-gray-400">R$</span>
                  <input type="text" inputMode="decimal" placeholder="0,00"
                    className="w-full pl-12 pr-4 py-5 rounded-2xl bg-gray-50 border-2 border-gray-100 focus:border-slate-500 outline-none text-3xl font-black text-gray-800 transition-all"
                    value={form.valor}
                    onChange={e=>sf('valor', e.target.value.replace(/[^0-9.,-]/g,''))}/>
                </div>
                
                {/* Mensagens de erro/aviso */}
                {valorZeroMsg && (
                  <p className="text-center text-[10px] font-black text-amber-500 mt-1.5">
                    ⚠️ Digite um valor
                  </p>
                )}
                {valorInvalido && !isReserva && (
                  <p className="text-center text-[10px] font-black text-rose-500 mt-1.5">
                    ⚠️ Valor deve ser maior que zero
                  </p>
                )}
                
                {valorNum !== 0 && (
                  <p className="text-center text-[11px] mt-1.5 font-black"
                    style={{color: isReserva&&(form._reservaOp||'deposito')==='retirada'?'#ef4444':'#3b82f6'}}>
                    {isReserva&&(form._reservaOp||'deposito')==='retirada'?'-':'+'}{fmt(Math.abs(valorNum))}
                  </p>
                )}
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">
                  {isReserva?'Nome da caixinha':isPag?'Descrição (opcional)':'Descrição'}
                </p>
                <input type="text" list="desc-sugg"
                  placeholder={isReserva?'Ex: Viagem...':isPag?'Ex: Fatura Março...':'Ex: Posto, Mercado...'}
                  className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-gray-100 focus:border-slate-500 outline-none font-bold text-gray-800 transition-all"
                  value={form.descricao}
                  onChange={e=>sf('descricao', e.target.value)}/>
                <datalist id="desc-sugg">
                  {sugestoes.map((s,i)=><option key={i} value={s}/>)}
                </datalist>
              </div>
            </div>
          )}

          {/* DATA + RECORRÊNCIA */}
          {cur==='data' && (
            <div className="space-y-5">
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">
                  {(form.tipo==='fixa'||form.tipo==='esporadica')?'Vencimento':'Data'}
                </p>
                <input type="date"
                  className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-gray-100 focus:border-slate-500 outline-none font-bold text-gray-800 transition-all"
                  value={form.data} onChange={e=>sf('data',e.target.value)}/>
              </div>
              {!isPag && (
                <div className="p-4 bg-gray-50 rounded-2xl border-2 border-gray-100 space-y-3">
                  <div className="flex items-center gap-2">
                    <Repeat size={13} className="text-gray-400"/>
                    <span className="text-[11px] font-black uppercase text-gray-400">Repetir?</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[['nao','🚫','Não'],['semanal','📅','Semanal'],['mensal','🔁','Mensal']].map(([val,ico,lbl])=>(
                      <button key={val} type="button" onClick={()=>sf('repetir',val)}
                        className={`py-3 rounded-xl flex flex-col items-center gap-1 transition-all border-2 ${form.repetir===val?'border-slate-700 bg-white text-slate-800':'border-transparent bg-white text-gray-400'}`}>
                        <span className="text-base">{ico}</span>
                        <span className="text-[9px] font-black uppercase">{lbl}</span>
                      </button>
                    ))}
                  </div>
                  {form.repetir!=='nao' && (
                    <div>
                      <p className="text-[10px] font-black uppercase text-gray-400 mb-1.5">Até quando?</p>
                      <input type="date"
                        className="w-full p-3 rounded-xl bg-white border-2 border-gray-100 focus:border-slate-500 outline-none text-sm font-bold text-gray-700"
                        value={form.recorrencia_limite} onChange={e=>sf('recorrencia_limite',e.target.value)}/>
                    </div>
                  )}
                </div>
              )}
              {/* Resumo */}
              <div className="rounded-2xl overflow-hidden border-2" style={{borderColor:tipo.cor+'40'}}>
                <div className="px-4 py-3 flex items-center gap-3" style={{backgroundColor:tipo.bg}}>
                  <span className="text-xl">{tipo.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase" style={{color:tipo.cor}}>{tipo.label}</p>
                    <p className="text-sm font-black text-gray-800 truncate">{form.descricao||'—'}</p>
                  </div>
                  <p className="text-base font-black flex-shrink-0" style={{color:tipo.cor}}>
                    {valorNum!==0?fmt(Math.abs(valorNum)):'—'}
                  </p>
                </div>
                {form.cartao_id && (
                  <div className="px-4 py-2 bg-white border-t flex items-center gap-2" style={{borderColor:tipo.cor+'20'}}>
                    <CreditCard size={12} className="text-gray-400"/>
                    <span className="text-[11px] text-gray-500 font-bold">
                      {cartoes.find(c=>c.id===form.cartao_id)?.nome||'Cartão'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Botão */}
        {showBtn && (
          <div className="px-4 pb-8 pt-3 flex-shrink-0 border-t border-gray-50">
            {isLast ? (
              <button type="button" onClick={submit} disabled={!canGo}
                className="w-full py-4 rounded-2xl font-black text-base text-white transition-all active:scale-[0.98] disabled:opacity-40"
                style={{backgroundColor:tipo.cor}}>
                {initialData?'Salvar alterações':'Confirmar lançamento'}
              </button>
            ) : (
              <button type="button" onClick={()=>advance()} disabled={!canGo}
                className="w-full py-4 rounded-2xl font-black text-base text-white bg-gray-900 transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2">
                Continuar <ChevronRight size={18}/>
              </button>
            )}
          </div>
        )}
      </div>

      {confirmTarget && (
        <ActionConfirmationModal
          target={confirmTarget}
          onClose={()=>setConfirmTarget(null)}
          onConfirm={(all)=>{ onSave(form,all); setConfirmTarget(null) }}
        />
      )}
    </>
  )
}