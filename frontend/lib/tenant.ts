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

export const getTenantUsage = cache(async (tenantId: string): Promise<PlanUsage | null> => {
  const supabase = createServiceClient()
  const { data, error } = await supabase.rpc('get_tenant_usage', { p_tenant_id: tenantId })

  if (error || !data?.[0]) return null
  return data[0] as PlanUsage
})

// ─── WhatsApp helper ─────────────────────────────────────────────────────────

export function buildWhatsAppUrl(phone: string, message: string): string {
  const clean = phone.replace(/\D/g, '')
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`
}
