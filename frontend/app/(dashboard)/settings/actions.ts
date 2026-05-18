'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabaseServer'

const API = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

type ApiOk<T> = { data: T; error: null }
type ApiErr   = { data: null; error: { code: string; message: string } }
export type ApiResult<T> = ApiOk<T> | ApiErr

async function getToken(): Promise<string> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Unauthenticated')
  return session.access_token
}

async function apiCall<T>(method: string, path: string, body?: unknown): Promise<ApiResult<T>> {
  const token = await getToken()
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { data: null, error: json.error ?? { code: 'error', message: 'Erro inesperado' } }
  }
  return { data: (json.data ?? json) as T, error: null }
}

export interface TenantUpdatePayload {
  name?: string
  phone_whatsapp?: string
  description?: string
  seo_title?: string
  seo_description?: string
}

export async function updateTenantProfile(payload: TenantUpdatePayload): Promise<ApiResult<{ id: string; name: string }>> {
  const result = await apiCall<{ id: string; name: string }>('PUT', '/api/tenants/me', payload)
  if (!result.error) revalidatePath('/settings')
  return result
}

// ── Billing ───────────────────────────────────────────────────────────────────

export interface SubscriptionData {
  id: string
  plan_name: string
  plan_display: string
  status: string
  billing_cycle: string
  current_period_end: string
  trial_ends_at: string | null
  grace_until: string | null
  asaas_subscription_id: string
  asaas_payment_link: string
  price_monthly: number
  price_yearly: number
}

export async function getSubscription(): Promise<ApiResult<SubscriptionData>> {
  return apiCall<SubscriptionData>('GET', '/api/billing/subscription')
}

export async function subscribePlan(planName: string, billingCycle: string): Promise<ApiResult<SubscriptionData>> {
  const result = await apiCall<SubscriptionData>('POST', '/api/billing/subscribe', {
    plan_name: planName,
    billing_cycle: billingCycle,
  })
  if (!result.error) revalidatePath('/settings')
  return result
}
