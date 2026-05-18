export function captureError(error: unknown, context?: Record<string, unknown>): void {
  const err = error instanceof Error ? error : new Error(String(error))
  console.error('[RevendaClick]', err, context ?? '')
}
