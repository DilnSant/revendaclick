import { headers } from 'next/headers'
import { cache } from 'react'
import { createServiceClient } from './supabaseServer'

// ─── Types ────────────────────────────────────────────────────────────────────

export type Tenant = {
  id: string
  slug: string
  name: string
  email: string
  phone_whatsapp: string
  logo_url: string | null
  description: string | null
  address: Record<string, unknown> | null
  social_links: Record<string, string>
  custom_domain: string | null
  seo_title: string | null
  seo_description: string | null
  theme: { primary_color: string; font: string }
  is_active: boolean
  created_at: string
  updated_at: string
}

/** Minimal context injected by middleware into request headers. */
export type TenantContext = {
  id: string
  slug: string
  name: string
  phone_whatsapp: string
}

export type PlanUsage = {
  vehicles_count: number
  users_count: number
  leads_count: number
  max_vehicles: number
  max_users: number
  max_leads: number
  vehicles_pct: number
  users_pct: number
  plan_name: string
  plan_display: string
  subscription_status: string
  vehicles_alert: 'ok' | 'warning' | 'critical' | 'blocked'
  users_alert: 'ok' | 'warning' | 'critical' | 'blocked'
  // Feature flags (populated when fetched from backend API)
  features?: string[]
  has_crm?: boolean
  has_analytics?: boolean
  has_whatsapp?: boolean
  has_kanban?: boolean
  has_api_access?: boolean
  has_white_label?: boolean
}

// ─── Header extraction (public routes) ───────────────────────────────────────

/**
 * Reads tenant context injected by middleware into the request headers.
 * Available in all server components on public routes.
 */
export async function getTenantFromHeaders(): Promise<TenantContext | null> {
  const headersList = await headers()
  const id = headersList.get('x-tenant-id')
  if (!id) return null

  return {
    id,
    slug: headersList.get('x-tenant-slug') ?? '',
    name: headersList.get('x-tenant-name') ?? '',
    phone_whatsapp: headersList.get('x-tenant-whatsapp') ?? '',
  }
}

/**
 * Reads the authenticated user ID injected by middleware on dashboard routes.
 */
export async function getUserIdFromHeaders(): Promise<string | null> {
  const headersList = await headers()
  return headersList.get('x-user-id')
}

// ─── Full tenant fetch (cached per request) ──────────────────────────────────

/**
 * Fetches the full Tenant row by ID.
 * Cached with React cache — runs at most once per server request regardless of
 * how many components call it.
 */
export const getTenantById = cache(async (id: string): Promise<Tenant | null> => {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (error || !data) return null
  return data as Tenant
})

/**
 * Fetches the full Tenant row by slug.
 * Cached per request.
 */
export const getTenantBySlug = cache(async (slug: string): Promise<Tenant | null> => {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error || !data) return null
  return data as Tenant
})

// ─── Dashboard tenant resolution ─────────────────────────────────────────────

/**
 * For dashboard server components: look up the tenant for the authenticated user.
 * Falls back to a DB lookup from the users table.
 */
export const getTenantForUser = cache(async (userId: string): Promise<TenantContext | null> => {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('users')
    .select('tenant_id, tenants(id, slug, name, phone_whatsapp)')
    .eq('id', userId)
    .eq('is_active', true)
    .single()

  if (error || !data?.tenants) return null

  const t = data.tenants as unknown as TenantContext
  return { id: t.id, slug: t.slug, name: t.name, phone_whatsapp: t.phone_whatsapp }
})

// ─── Plan usage (dashboard) ──────────────────────────────────────────────────

function computeAlert(pct: number, max: number): PlanUsage['vehicles_alert'] {
  if (max === -1) return 'ok'
  if (pct >= 100) return 'blocked'
  if (pct >= 85) return 'critical'
  if (pct >= 80) return 'warning'
  return 'ok'
}

export const getTenantUsage = cache(async (tenantId: string): Promise<PlanUsage | null> => {
  const supabase = createServiceClient()
  const { data, error } = await supabase.rpc('get_tenant_usage', { p_tenant_id: tenantId })

  if (error || !data?.[0]) return null

  const row = data[0]
  return {
    vehicles_count:      row.vehicles_count,
    users_count:         row.users_count,
    leads_count:         row.leads_count,
    max_vehicles:        row.max_vehicles,
    max_users:           row.max_users,
    max_leads:           row.max_leads,
    vehicles_pct:        row.vehicles_pct,
    users_pct:           row.users_pct,
    plan_name:           row.plan_name,
    plan_display:        row.plan_display,
    subscription_status: row.sub_status,
    vehicles_alert:      computeAlert(row.vehicles_pct, row.max_vehicles),
    users_alert:         computeAlert(row.users_pct, row.max_users),
  }
})

// ─── Backend API usage (includes feature flags) ───────────────────────────────

const API = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

export async function getUsageFromAPI(token: string): Promise<PlanUsage | null> {
  if (!token) return null
  try {
    const res = await fetch(`${API}/api/usage`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const envelope = await res.json()
    const data = envelope.data ?? {}
    return {
      vehicles_count:      data.vehicles_count,
      users_count:         data.users_count,
      leads_count:         data.leads_count,
      max_vehicles:        data.max_vehicles,
      max_users:           data.max_users,
      max_leads:           data.max_leads,
      vehicles_pct:        data.vehicles_pct,
      users_pct:           data.users_pct,
      plan_name:           data.plan_name,
      plan_display:        data.plan_display,
      subscription_status: data.subscription_status,
      vehicles_alert:      data.vehicles_alert ?? computeAlert(data.vehicles_pct, data.max_vehicles),
      users_alert:         data.users_alert ?? computeAlert(data.users_pct, data.max_users),
      features:            data.features ?? [],
      has_crm:             data.has_crm ?? false,
      has_analytics:       data.has_analytics ?? false,
      has_whatsapp:        data.has_whatsapp ?? false,
      has_kanban:          data.has_kanban ?? false,
      has_api_access:      data.has_api_access ?? false,
      has_white_label:     data.has_white_label ?? false,
    }
  } catch {
    return null
  }
}

// ─── WhatsApp helper ─────────────────────────────────────────────────────────

export function buildWhatsAppUrl(phone: string, message: string): string {
  const clean = phone.replace(/\D/g, '')
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`
}
