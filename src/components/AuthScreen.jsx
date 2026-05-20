import React, { useState, useRef } from 'react'
import { supabase } from '@lib/supabase'
import { Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react'

const VIEWS = { LOGIN: 'login', REGISTER: 'register', FORGOT: 'forgot' }

const EMAIL_DOMAINS = [
  'gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com.br',
  'yahoo.com', 'icloud.com', 'live.com', 'uol.com.br', 'bol.com.br',
]

const parseLoginError = (message) => {
  if (message.includes('Email not confirmed'))
    return 'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.'
  if (message.includes('Invalid login credentials'))
    return 'E-mail ou senha incorretos. Verifique os dados e tente novamente.'
  if (message.includes('Too many requests'))
    return 'Muitas tentativas seguidas. Aguarde alguns minutos e tente novamente.'
  if (message.includes('User not found'))
    return 'Nenhuma conta encontrada com este e-mail.'
  if (message.includes('network') || message.includes('fetch'))
    return 'Erro de conexão. Verifique sua internet e tente novamente.'
  return 'Erro ao entrar. Tente novamente.'
}

const parseRegisterError = (message) => {
  if (message.includes('User already registered') || message.includes('already been registered'))
    return 'Este e-mail já está cadastrado. Tente fazer login ou recuperar a senha.'
  if (message.includes('Password should be'))
    return 'A senha deve ter pelo menos 6 caracteres.'
  if (message.includes('Unable to validate email'))
    return 'Endereço de e-mail inválido.'
  if (message.includes('Signup is disabled'))
    return 'Novos cadastros estão temporariamente desativados.'
  if (message.includes('network') || message.includes('fetch'))
    return 'Erro de conexão. Verifique sua internet e tente novamente.'
  return 'Erro ao criar conta. Tente novamente.'
}

const parseForgotError = (message) => {
  if (message.includes('User not found'))
    return 'Nenhuma conta encontrada com este e-mail.'
  if (message.includes('Too many requests'))
    return 'Muitas solicitações. Aguarde alguns minutos antes de tentar novamente.'
  if (message.includes('network') || message.includes('fetch'))
    return 'Erro de conexão. Verifique sua internet e tente novamente.'
  return 'Não foi possível enviar o e-mail. Verifique o endereço e tente novamente.'
}

// ─── EmailInput com sugestões de domínio ────────────────────────────────────

function EmailInput({ value, onChange, id }) {
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef(null)

  const handleChange = (e) => {
    const val = e.target.value
    onChange(val)

    const atIndex = val.indexOf('@')
    if (atIndex === -1 || atIndex === val.length - 1) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const typed = val.slice(atIndex + 1).toLowerCase()
    const local  = val.slice(0, atIndex)
    if (!local) { setSuggestions([]); setShowSuggestions(false); return }

    const filtered = typed
      ? EMAIL_DOMAINS.filter(d => d.startsWith(typed))
      : EMAIL_DOMAINS

    setSuggestions(filtered.map(d => `${local}@${d}`))
    setShowSuggestions(filtered.length > 0)
  }

  const handleSelect = (suggestion) => {
    onChange(suggestion)
    setSuggestions([])
    setShowSuggestions(false)
    inputRef.current?.blur()
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        id={id}
        type="email"
        required
        autoComplete="email"
        inputMode="email"
        className="w-full p-4 bg-white border-2 border-gray-100 rounded-2xl outline-none focus:border-slate-500 transition-all shadow-sm"
        placeholder="seu@email.com"
        value={value}
        onChange={handleChange}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
      />

      {showSuggestions && (
        <ul className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-150">
          {suggestions.slice(0, 5).map((s) => {
            const atIdx   = s.indexOf('@')
            const local   = s.slice(0, atIdx)
            const domain  = s.slice(atIdx)
            return (
              <li key={s}>
                <button
                  type="button"
                  onMouseDown={() => handleSelect(s)}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition-colors flex items-center gap-1 border-b border-gray-50 last:border-0"
                >
                  <span className="font-bold text-gray-700">{local}</span>
                  <span className="text-slate-500 font-black">{domain}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// ─── AuthScreen ──────────────────────────────────────────────────────────────

export const AuthScreen = () => {
  const [view, setView] = useState(VIEWS.LOGIN)

  return (
    <div className="h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-sm">
        <div className="text-start mb-10 flex flex-col items-start">
          <span className="text-[8px] font-bold tracking-[0.25em] text-slate-400 uppercase mb-1">
            Simples. Inteligente.
          </span>
          <h1 className="text-5xl font-black text-slate-600 -mt-2 tracking-tighter">
            Fluxly
          </h1>
          <p className="text-gray-500 text-sm mt-4">
            {view === VIEWS.LOGIN    && 'Acesse sua conta para gerenciar seu fluxo.'}
            {view === VIEWS.REGISTER && 'Crie sua conta e comece a controlar seu dinheiro.'}
            {view === VIEWS.FORGOT   && 'Informe seu e-mail para redefinir a senha.'}
          </p>
        </div>

        {view === VIEWS.LOGIN    && <LoginForm    onForgot={() => setView(VIEWS.FORGOT)} onRegister={() => setView(VIEWS.REGISTER)} />}
        {view === VIEWS.REGISTER && <RegisterForm onBack={() => setView(VIEWS.LOGIN)} onLoginSuggested={() => setView(VIEWS.LOGIN)} />}
        {view === VIEWS.FORGOT   && <ForgotForm   onBack={() => setView(VIEWS.LOGIN)} />}
      </div>
    </div>
  )
}

function ErrorBox({ message, action }) {
  return (
    <div role="alert" className="bg-rose-50 text-rose-700 p-4 rounded-2xl text-xs font-bold border border-rose-100 space-y-1">
      <p>{message}</p>
      {action && (
        <button type="button" onClick={action.fn} className="text-slate-600 underline underline-offset-2 font-black">
          {action.label}
        </button>
      )}
    </div>
  )
}

function LoginForm({ onForgot, onRegister }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        const msg = parseLoginError(error.message)
        setError({
          message: msg,
          action: error.message.includes('Invalid login credentials')
            ? { label: 'Esqueceu a senha?', fn: onForgot }
            : null,
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      {error && <ErrorBox message={error.message} action={error.action} />}

      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Email</label>
        <EmailInput value={email} onChange={setEmail} id="login-email" />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between ml-1">
          <label className="text-[10px] font-black uppercase text-gray-400">Senha</label>
          <button type="button" onClick={onForgot} className="text-[10px] font-black text-slate-500 uppercase hover:text-slate-700 transition-colors">
            Esqueci minha senha
          </button>
        </div>
        <div className="relative">
          <input
            type={showPw ? 'text' : 'password'}
            required
            className="w-full p-4 bg-white border-2 border-gray-100 rounded-2xl outline-none focus:border-slate-500 transition-all shadow-sm pr-12"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button
            type="button"
            aria-label={showPw ? 'Ocultar senha' : 'Mostrar senha'}
            onClick={() => setShowPw(p => !p)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-slate-500 transition-colors"
          >
            {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      <button
        type="submit" disabled={loading}
        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg shadow-lg shadow-slate-100 hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50"
      >
        {loading ? 'Entrando...' : 'Entrar no Fluxly'}
      </button>

      <p className="text-center text-[12px] text-gray-400 pt-1">
        Não tem uma conta?{' '}
        <button type="button" onClick={onRegister} className="text-slate-600 font-black hover:text-slate-800 transition-colors">
          Cadastrar
        </button>
      </p>
    </form>
  )
}

function RegisterForm({ onBack, onLoginSuggested }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [success, setSuccess]   = useState(false)

  const handleRegister = async (e) => {
    e.preventDefault()
    setError(null)
    if (password.length < 6) { setError({ message: 'A senha deve ter pelo menos 6 caracteres.' }); return }
    if (password !== confirm) { setError({ message: 'As senhas não coincidem.' }); return }

    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        const msg = parseRegisterError(error.message)
        const isAlreadyRegistered = error.message.includes('already registered') || error.message.includes('already been registered')
        setError({
          message: msg,
          action: isAlreadyRegistered ? { label: 'Ir para o login', fn: onLoginSuggested } : null,
        })
      } else {
        setSuccess(true)
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <h3 className="text-lg font-black text-gray-800">Conta criada!</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            Verifique seu e-mail para confirmar o cadastro antes de entrar.
          </p>
        </div>
        <button onClick={onBack} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg shadow-lg shadow-slate-100 hover:bg-slate-800 transition-all">
          Voltar para o login
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase hover:text-slate-600 transition-colors mb-2">
        <ArrowLeft size={13} /> Voltar
      </button>

      {error && <ErrorBox message={error.message} action={error.action} />}

      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Email</label>
        <EmailInput value={email} onChange={setEmail} id="register-email" />
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Senha</label>
        <div className="relative">
          <input
            type={showPw ? 'text' : 'password'}
            required minLength={6}
            className="w-full p-4 bg-white border-2 border-gray-100 rounded-2xl outline-none focus:border-slate-500 transition-all shadow-sm pr-12"
            placeholder="mínimo 6 caracteres"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button
            type="button"
            aria-label={showPw ? 'Ocultar senha' : 'Mostrar senha'}
            onClick={() => setShowPw(p => !p)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-slate-500 transition-colors"
          >
            {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Confirmar Senha</label>
        <input
          type={showPw ? 'text' : 'password'}
          required
          className={`w-full p-4 bg-white border-2 rounded-2xl outline-none focus:border-slate-500 transition-all shadow-sm ${
            confirm && confirm !== password ? 'border-rose-300' : 'border-gray-100'
          }`}
          placeholder="••••••••"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
        />
        {confirm && confirm !== password && (
          <p className="text-[10px] text-rose-500 font-bold ml-1">As senhas não coincidem.</p>
        )}
      </div>

      <button
        type="submit" disabled={loading}
        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg shadow-lg shadow-slate-100 hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50"
      >
        {loading ? 'Criando conta...' : 'Criar Conta'}
      </button>
    </form>
  )
}

function ForgotForm({ onBack }) {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [success, setSuccess] = useState(false)

  const handleForgot = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) setError({ message: parseForgotError(error.message) })
      else setSuccess(true)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
            <CheckCircle2 size={32} className="text-slate-500" />
          </div>
          <h3 className="text-lg font-black text-gray-800">E-mail enviado!</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            Verifique sua caixa de entrada e siga as instruções para redefinir a senha.
          </p>
        </div>
        <button onClick={onBack} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg shadow-lg shadow-slate-100 hover:bg-slate-800 transition-all">
          Voltar para o login
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleForgot} className="space-y-4">
      <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase hover:text-slate-600 transition-colors mb-2">
        <ArrowLeft size={13} /> Voltar
      </button>

      {error && <ErrorBox message={error.message} action={error.action} />}

      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Email</label>
        <EmailInput value={email} onChange={setEmail} id="forgot-email" />
      </div>

      <button
        type="submit" disabled={loading}
        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg shadow-lg shadow-slate-100 hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50"
      >
        {loading ? 'Enviando...' : 'Enviar link de redefinição'}
      </button>
    </form>
  )
}