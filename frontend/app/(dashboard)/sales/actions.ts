'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabaseServer'

const API = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

async function getToken(): Promise<string> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Unauthenticated')
  return session.access_token
}

type ApiOk<T>  = { data: T;    error: null }
type ApiErr    = { data: null; error: { code: string; message: string } }
type ApiResult<T> = ApiOk<T> | ApiErr

async function apiCall<T>(method: string, path: string, body?: unknown): Promise<ApiResult<T>> {
  const token = await getToken()
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) return { data: null, error: json.error ?? { code: 'error', message: 'Erro inesperado' } }
  return { data: (json.data ?? json) as T, error: null }
}

export interface Sale {
  id: string
  vehicle_id: string
  lead_id?: string
  seller_id?: string
  customer_id?: string
  sale_price: number
  list_price: number
  discount: number
  financing_type: string
  financing_amount?: number
  payment_method: string
  status: string
  sold_at?: string
  notes?: string
  created_at: string
  updated_at: string
}

export async function createSale(payload: {
  vehicle_id: string
  lead_id?: string
  seller_id?: string
  customer_id?: string
  sale_price: number
  list_price: number
  discount: number
  financing_type: string
  financing_amount?: number
  payment_method: string
  notes?: string
}): Promise<ApiResult<Sale>> {
  const result = await apiCall<Sale>('POST', '/api/sales', payload)
  if (!result.error) revalidatePath('/sales')
  return result
}

export async function completeSale(saleId: string): Promise<ApiResult<Sale>> {
  const result = await apiCall<Sale>('POST', `/api/sales/${saleId}/complete`)
  if (!result.error) {
    revalidatePath('/sales')
    revalidatePath('/financial')
    revalidatePath('/vehicles')
  }
  return result
}

export async function cancelSale(saleId: string): Promise<ApiResult<Sale>> {
  const result = await apiCall<Sale>('POST', `/api/sales/${saleId}/cancel`)
  if (!result.error) revalidatePath('/sales')
  return result
}
