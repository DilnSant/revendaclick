// log is a singleton that auto-reads BETTER_STACK_SOURCE_TOKEN and BETTER_STACK_INGESTING_URL.
// Falls back to console when env vars are not set (safe in development).
import { log } from '@logtail/next'

export { log }

export function logInfo(message: string, ctx?: Record<string, unknown>): void {
  log.info(message, { ...ctx, service: 'revendaclick-frontend' })
}

export function logWarn(message: string, ctx?: Record<string, unknown>): void {
  log.warn(message, { ...ctx, service: 'revendaclick-frontend' })
}

export function logError(message: string, ctx?: Record<string, unknown>): void {
  log.error(message, { ...ctx, service: 'revendaclick-frontend' })
}

export async function flushLogger(): Promise<void> {
  await log.flush()
}
