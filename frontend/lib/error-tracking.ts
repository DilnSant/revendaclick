export function captureError(error: unknown, context?: Record<string, unknown>): void {
  const err = error instanceof Error ? error : new Error(String(error))
  console.error('[RevendaClick]', err.message, context ?? '')
  // Client errors are forwarded server-side to avoid exposing the BetterStack token
  fetch('/api/log/error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: err.message, stack: err.stack, context }),
  }).catch(() => {})
}
