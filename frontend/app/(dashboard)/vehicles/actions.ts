'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabaseServer'
import type { Vehicle, CreateVehiclePayload, VehicleStatus } from '@/lib/vehicles'

const API = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

async function getToken(): Promise<string> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Unauthenticated')
  return session.access_token
}

type ApiOk<T>  = { data: T;    error: null }
type ApiErr    = { data: null; error: { code: string; message: string; upgrade_required?: boolean } }
export type ApiResult<T> = ApiOk<T> | ApiErr

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

// ─── Actions ──────────────────────────────────────────────────────────────────

export async function createVehicle(
  payload: CreateVehiclePayload,
): Promise<ApiResult<Vehicle>> {
  const result = await apiCall<Vehicle>('POST', '/api/vehicles', payload)
  if (!result.error) revalidatePath('/vehicles')
  return result
}

export async function updateVehicle(
  id: string,
  payload: Partial<CreateVehiclePayload> & { status?: VehicleStatus; is_featured?: boolean },
): Promise<ApiResult<Vehicle>> {
  const result = await apiCall<Vehicle>('PUT', `/api/vehicles/${id}`, payload)
  if (!result.error) revalidatePath('/vehicles')
  return result
}

export async function deleteVehicle(id: string): Promise<ApiResult<null>> {
  const result = await apiCall<null>('DELETE', `/api/vehicles/${id}`)
  if (!result.error) revalidatePath('/vehicles')
  return result
}

export async function toggleVehicleStatus(
  id: string,
  status: VehicleStatus,
): Promise<ApiResult<Vehicle>> {
  return updateVehicle(id, { status })
}

export async function toggleVehicleFeatured(
  id: string,
  is_featured: boolean,
): Promise<ApiResult<Vehicle>> {
  return updateVehicle(id, { is_featured })
}
