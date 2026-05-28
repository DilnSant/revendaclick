import { createClient } from '@/lib/supabaseServer'
import AdminTenantsTable from './_components/AdminTenantsTable'

export const metadata = { title: 'Admin — RevendaClick' }

const API = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

export interface TenantSummary {
  id: string
  slug: string
  name: string
  email: string
  is_active: boolean
  created_at: string
  sub_status: string
  plan_name: string
  plan_display: string
  trial_ends_at?: string
  period_end?: string
  vehicle_count: number
  user_count: number
  lead_count: number
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token ?? ''

  const tenants = await fetchTenants(token)

  const stats = {
    total: tenants.length,
    active: tenants.filter(t => t.sub_status === 'active').length,
    trialing: tenants.filter(t => t.sub_status === 'trialing').length,
    blocked: tenants.filter(t => !t.is_active || t.sub_status === 'canceled').length,
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Tenants</h1>
        <p className="mt-1 text-sm text-gray-500">Gerencie assinaturas, planos e features por tenant</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Ativos" value={stats.active} color="text-green-400" />
        <StatCard label="Trial" value={stats.trialing} color="text-blue-400" />
        <StatCard label="Bloqueados" value={stats.blocked} color="text-red-400" />
      </div>

      <AdminTenantsTable tenants={tenants} />
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${color ?? 'text-white'}`}>{value}</p>
    </div>
  )
}

async function fetchTenants(token: string): Promise<TenantSummary[]> {
  if (!token) return []
  try {
    const res = await fetch(`${API}/api/admin/tenants`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return []
    const json = await res.json()
    return (json.data?.tenants ?? json.tenants ?? []) as TenantSummary[]
  } catch { return [] }
}
