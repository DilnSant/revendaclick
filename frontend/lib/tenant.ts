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
}