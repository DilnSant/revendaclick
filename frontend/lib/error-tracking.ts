// Error tracking abstraction — swap console.error for Sentry when DSN is configured.
// Usage: import { captureError } from '@/lib/error-tracking'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

export function captureError(error: unknown, context?: Record<string, unknown>): void {
  const err = error instanceof Error ? error : new Error(String(error))

  if (process.env.NODE_ENV === 'production' && SENTRY_DSN) {
    // Sentry is installed: import { captureException } from '@sentry/nextjs'
    // captureException(err, { extra: context })
    // Until Sentry is wired: structured log to console so log aggregators pick it up
    console.error(JSON.stringify({
      level: 'error',
      message: err.message,
      stack: err.stack,
      context,
      ts: new Date().toISOString(),
    }))
    return
  }

  console.error('[RevendaClick]', err, context ?? '')
}
