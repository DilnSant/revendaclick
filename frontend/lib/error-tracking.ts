import { logError } from './logger'

export function captureError(error: unknown, context?: Record<string, unknown>): void {
  const err = error instanceof Error ? error : new Error(String(error))
  console.error('[RevendaClick]', err.message, context ?? '')
  // Browser: proxied through /_betterstack/logs (added by withBetterStackNextConfig)
  // Server: sent directly to BetterStack ingestion endpoint
  logError(err.message, { ...context, stack: err.stack })
}
