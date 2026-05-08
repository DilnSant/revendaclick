'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabaseServer'
import type { Customer, CreateCustomerPayload, UpdateCustomerPayload } from '@/lib/customers'

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

export async function createCustomer(payload: CreateCustomerPayload): Promise<ApiResult<Customer>> {
  const result = await apiCall<Customer>('POST', '/api/customers', payload)
  if (!result.error) revalidatePath('/customers')
  return result
}

export async function updateCustomer(id: string, payload: UpdateCustomerPayload): Promise<ApiResult<Customer>> {
  const result = await apiCall<Customer>('PUT', `/api/customers/${id}`, payload)
  if (!result.error) revalidatePath('/customers')
  return result
}

export async function deleteCustomer(id: string): Promise<ApiResult<null>> {
  const result = await apiCall<null>('DELETE', `/api/customers/${id}`)
  if (!result.error) revalidatePath('/customers')
  return result
}
