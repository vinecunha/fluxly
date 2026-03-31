/**
 * logger.js - Sistema de logging seguro
 * Em produção, logs são silenciados automaticamente
 */

const isDev = import.meta.env.DEV
const isTest = import.meta.env.MODE === 'test'

const shouldLog = isDev || isTest

export const logger = {
  error: (...args) => {
    if (shouldLog) {
      console.error('[Fluxly]', ...args)
    }
  },
  
  warn: (...args) => {
    if (shouldLog) {
      console.warn('[Fluxly]', ...args)
    }
  },
  
  info: (...args) => {
    if (shouldLog) {
      console.info('[Fluxly]', ...args)
    }
  },
  
  debug: (...args) => {
    if (shouldLog && import.meta.env.DEV) {
      console.debug('[Fluxly]', ...args)
    }
  },
  
  // Para logs específicos de performance
  performance: (label, duration) => {
    if (shouldLog && duration > 100) {
      console.warn(`[Fluxly] Performance: ${label} levou ${duration}ms`)
    }
  }
}