const requireEnv = (key: string): string => {
  const value = import.meta.env[key]
  if (!value || value.trim() === '') {
    throw new Error(
      `[Fluxly] Variável de ambiente ausente: "${key}"\n` +
      `Adicione-a no arquivo .env.local:\n  ${key}=seu_valor_aqui`
    )
  }
  return value.trim()
}

const optionalEnv = (key: string, fallback = ''): string => {
  const value = import.meta.env[key]
  return value?.trim() || fallback
}

const supabaseUrl = requireEnv('VITE_SUPABASE_URL')
const supabaseKey = requireEnv('VITE_SUPABASE_ANON_KEY')

if (!supabaseUrl.startsWith('https://')) {
  throw new Error('[Fluxly] VITE_SUPABASE_URL deve começar com "https://"')
}
if (supabaseKey.length < 100) {
  throw new Error('[Fluxly] VITE_SUPABASE_ANON_KEY parece inválida (muito curta)')
}

export const env = {
  SUPABASE_URL: supabaseUrl,
  SUPABASE_ANON_KEY: supabaseKey,
  VAPID_PUBLIC_KEY: optionalEnv('VITE_VAPID_PUBLIC_KEY'),
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
  BASE_URL: import.meta.env.BASE_URL || '/',
}