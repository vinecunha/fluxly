import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

export const AuthScreen = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) setError("Credenciais inválidas ou erro de conexão.")
    setLoading(false)
  }

  return (
    <div className="h-screen flex items-center justify-center p-6 bg-indigo-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-indigo-600 mb-2 italic tracking-tighter">Fluxly.</h1>
          <p className="text-gray-500 text-sm">Acesse sua conta para gerenciar seu fluxo.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-xs font-bold border border-rose-100">
              {error}
            </div>
          )}
          
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Email</label>
            <input 
              type="email" required
              className="w-full p-4 bg-white border-2 border-gray-100 rounded-2xl outline-none focus:border-indigo-500 transition-all shadow-sm"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Senha</label>
            <input 
              type="password" required
              className="w-full p-4 bg-white border-2 border-gray-100 rounded-2xl outline-none focus:border-indigo-500 transition-all shadow-sm"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar no Fluxly'}
          </button>
        </form>
      </div>
    </div>
  )
}