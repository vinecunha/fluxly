const isDev = import.meta.env.DEV
const isTest = import.meta.env.MODE === 'test'

const shouldLog = isDev || isTest

export const logger = {
  error: (...args: unknown[]) => {
    if (shouldLog) {
      console.error('[Fluxly]', ...args)
    }
  },
  
  warn: (...args: unknown[]) => {
    if (shouldLog) {
      console.warn('[Fluxly]', ...args)
    }
  },
  
  info: (...args: unknown[]) => {
    if (shouldLog) {
      console.info('[Fluxly]', ...args)
    }
  },
  
  debug: (...args: unknown[]) => {
    if (shouldLog && import.meta.env.DEV) {
      console.debug('[Fluxly]', ...args)
    }
  },
  
  performance: (label: string, duration: number) => {
    if (shouldLog && duration > 100) {
      console.warn(`[Fluxly] Performance: ${label} levou ${duration}ms`)
    }
  }
}