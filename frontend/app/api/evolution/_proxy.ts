// Shared helper for Evolution API proxy routes
import { createClient } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'

export const BACKEND = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

export async function getToken(): Promise<string> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? ''
}

export function unauthorized() {
  return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
}

export async function proxyTo(
  backendPath: string,
  method: string,
  token: string,
  body?: BodyInit,
): Promise<NextResponse> {
  try {
    const res = await fetch(`${BACKEND}${backendPath}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body,
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error(`[evolution proxy] ${method} ${backendPath}`, err)
    return NextResponse.json(
      { error: { code: 'evolution_unavailable', message: 'Serviço WhatsApp temporariamente indisponível.' } },
      { status: 503 },
    )
  }
}
