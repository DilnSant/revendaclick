'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabaseServer'
import type { Lead, LeadActivity, LeadStatus, ActivityType } from '@/lib/crm'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function getToken(): Promise<string> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Unauthenticated')
  return session.access_token
}

// ─── Generic fetch wrapper ────────────────────────────────────────────────────

type ApiOk<T>  = { data: T;    error: null }
type ApiErr    = { data: null; error: { code: string; message: string; upgrade_required?: boolean } }
type ApiResult<T> = ApiOk<T> | ApiErr

async function apiCall<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<ApiResult<T>> {
  const token = await getToken()
  const res = await fetch(`${API}${path}`, {
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

// ─── Lead mutations ───────────────────────────────────────────────────────────

export async function updateLeadStatus(
  leadId: string,
  status: LeadStatus,
): Promise<ApiResult<Lead>> {
  const result = await apiCall<Lead>('PUT', `/api/leads/${leadId}`, { status })
  if (!result.error) revalidatePath('/leads')
  return result
}

export async function assignSeller(
  leadId: string,
  sellerId: string | null,
): Promise<ApiResult<Lead>> {
  const result = await apiCall<Lead>('PUT', `/api/leads/${leadId}`, { seller_id: sellerId })
  if (!result.error) revalidatePath('/leads')
  return result
}

export async function updateLeadNotes(
  leadId: string,
  notes: string,
): Promise<ApiResult<Lead>> {
  const result = await apiCall<Lead>('PUT', `/api/leads/${leadId}`, { notes })
  if (!result.error) revalidatePath('/leads')
  return result
}

export async function updateLeadKanbanPosition(
  leadId: string,
  status: LeadStatus,
  position?: number,
): Promise<ApiResult<Lead>> {
  const result = await apiCall<Lead>('PUT', `/api/leads/${leadId}`, {
    status,
    kanban_position: position,
  })
  if (!result.error) revalidatePath('/leads')
  return result
}

export async function createLead(payload: {
  name: string
  phone: string
  email?: string
  message?: string
  seller_id?: string
  vehicle_id?: string
  source?: string
}): Promise<ApiResult<Lead>> {
  const result = await apiCall<Lead>('POST', '/api/leads', {
    ...payload,
    source: payload.source ?? 'direct',
  })
  if (!result.error) revalidatePath('/leads')
  return result
}

export async function deleteLead(leadId: string): Promise<ApiResult<null>> {
  const result = await apiCall<null>('DELETE', `/api/leads/${leadId}`)
  if (!result.error) revalidatePath('/leads')
  return result
}

// ─── Activities ───────────────────────────────────────────────────────────────

export async function fetchLeadActivities(leadId: string): Promise<LeadActivity[]> {
  const token = await getToken()
  const res = await fetch(`${API}/api/leads/${leadId}/activities`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!res.ok) return []
  const json = await res.json()
  return (json.data ?? []) as LeadActivity[]
}

export async function addActivity(
  leadId: string,
  type: ActivityType,
  description: string,
): Promise<ApiResult<LeadActivity>> {
  return apiCall<LeadActivity>('POST', `/api/leads/${leadId}/activities`, { type, description })
}
