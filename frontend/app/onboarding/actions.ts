'use server'

import { createClient } from '@/lib/supabaseServer'

const API = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

type ApiOk<T> = { data: T; error: null }
type ApiErr   = { data: null; error: { code: string; message: string } }
export type ApiResult<T> = ApiOk<T> | ApiErr

interface SetupPayload {
  tenant_slug: string
  tenant_name: string
  tenant_email: string
  phone_whatsapp: string
  user_name: string
}

interface SetupResult {
  tenant_id: string
  tenant_slug: string
  tenant_name: string
}

export async function setupTenant(payload: SetupPayload): Promise<ApiResult<SetupResult>> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) {
    return { data: null, error: { code: 'unauthorized', message: 'Sessão expirada. Faça login novamente.' } }
  }

  const res = await fetch(`${API}/api/onboarding/setup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  })

  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { data: null, error: json.error ?? { code: 'error', message: 'Erro ao criar loja. Tente novamente.' } }
  }
  return { data: (json.data ?? json) as SetupResult, error: null }
}
