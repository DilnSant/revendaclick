import { createClient } from './supabaseServer'

// INTERNAL_API_URL is a runtime-only server-side var (http://backend:8080 in Docker).
// Falls back to NEXT_PUBLIC_API_URL (baked at build time) for local dev.
const BACKEND = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

// ─── Types ────────────────────────────────────────────────────────────────────

type ApiOk<T> = { data: T; error: null }
type ApiErr = { data: null; error: { code: string; message: string; upgrade_required?: boolean } }
export type ApiResult<T> = ApiOk<T> | ApiErr

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function getAccessToken(): Promise<string> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Unauthenticated')
  return session.access_token
}

// ─── Core request ─────────────────────────────────────────────────────────────

export async function apiCall<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<ApiResult<T>> {
  const token = await getAccessToken()

  const res = await fetch(`${BACKEND}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })

  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { data: null, error: json.error ?? { code: 'error', message: 'Erro inesperado' } }
  }
  return { data: (json.data ?? json) as T, error: null }
}

// ─── Public (no auth) ─────────────────────────────────────────────────────────

export async function publicFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BACKEND}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    const json = await res.json()
    return (json.data ?? json) as T
  } catch {
    return null
  }
}
