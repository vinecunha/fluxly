/**
 * env.js — Variáveis de ambiente tipadas e validadas.
 * Importe SEMPRE daqui, nunca use import.meta.env diretamente.
 */

function requireEnv(key) {
  const value = import.meta.env[key]
  if (!value || value.trim() === '') {
    throw new Error(
      `[Fluxly] Variável de ambiente ausente: "${key}"\n` +
      `Adicione-a no arquivo .env.local:\n  ${key}=seu_valor_aqui`
    )
  }
  return value.trim()
}

function optionalEnv(key, fallback = '') {
  const value = import.meta.env[key]
  return value?.trim() || fallback
}

// Lança em tempo de inicialização se algo estiver faltando
export const env = {
  SUPABASE_URL: requireEnv('VITE_SUPABASE_URL'),
  SUPABASE_ANON_KEY: requireEnv('VITE_SUPABASE_ANON_KEY'),

  // Opcional: chave pública do VAPID para Web Push
  VAPID_PUBLIC_KEY: optionalEnv('VITE_VAPID_PUBLIC_KEY'),

  // Conveniências
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
  BASE_URL: import.meta.env.BASE_URL || '/',
}