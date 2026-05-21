export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.BETTER_STACK_SOURCE_TOKEN) {
    const { logInfo } = await import('./lib/logger')
    logInfo('frontend server started', { runtime: 'nodejs' })
  }
}
