import { type NextRequest, NextResponse } from 'next/server'
import { logError, flushLogger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  try {
    const { message, stack, context } = await req.json() as {
      message?: string
      stack?: string
      context?: Record<string, unknown>
    }
    logError(message ?? 'client error', { stack, ...context, source: 'client' })
    await flushLogger()
  } catch {
    // never surface logging errors to the caller
  }
  return NextResponse.json({ ok: true })
}
