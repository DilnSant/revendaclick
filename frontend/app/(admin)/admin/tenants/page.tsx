import { createClient } from '@/lib/supabaseServer'
import AdminTenantsTable from '../_components/AdminTenantsTable'
import type { TenantSummary } from '../_components/AdminTenantsTable'

export const metadata = { title: 'Tenants — Admin RevendaClick' }

const API = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

export default async function AdminTenantsPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token ?? ''

  const tenants = await fetchTenants(token)

  const stats = {
    total:    tenants.length,
    active:   tenants.filter(t => t.sub_status === 'active').length,
    trialing: tenants.filter(t => t.sub_status === 'trialing').length,
    blocked:  tenants.filter(t => !t.is_active || t.sub_status === 'canceled').length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Tenants</h1>
        <p className="mt-0.5 text-sm text-gray-500">Gerencie assinaturas, planos e features por tenant</p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total',      value: stats.total,    color: 'text-white' },
          { label: 'Ativos',     value: stats.active,   color: 'text-green-400' },
          { label: 'Trial',      value: stats.trialing, color: 'text-blue-400' },
          { label: 'Bloqueados', value: stats.blocked,  color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-gray-800 bg-gray-900 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">{s.label}</p>
            <p className={`mt-1.5 text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <AdminTenantsTable tenants={tenants} />
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
