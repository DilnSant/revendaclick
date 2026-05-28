import Link from 'next/link'
import { createClient } from '@/lib/supabaseServer'

export const metadata = { title: 'Admin — RevendaClick' }

const API = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

interface TenantSummary {
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

const STATUS_COLOR: Record<string, string> = {
  active:   'bg-green-900/40 text-green-400 border-green-800',
  trialing: 'bg-blue-900/40 text-blue-400 border-blue-800',
  past_due: 'bg-orange-900/40 text-orange-400 border-orange-800',
  canceled: 'bg-red-900/40 text-red-400 border-red-800',
  paused:   'bg-gray-700 text-gray-400 border-gray-600',
  none:     'bg-gray-800 text-gray-500 border-gray-700',
}

export default async function AdminOverviewPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token ?? ''

  const tenants = await fetchTenants(token)

  const now = new Date()
  const in7Days = new Date(now.getTime() + 7 * 86400_000)

  const stats = {
    total:     tenants.length,
    active:    tenants.filter(t => t.sub_status === 'active').length,
    trialing:  tenants.filter(t => t.sub_status === 'trialing').length,
    past_due:  tenants.filter(t => t.sub_status === 'past_due').length,
    canceled:  tenants.filter(t => t.sub_status === 'canceled').length,
    blocked:   tenants.filter(t => !t.is_active).length,
    trials_expiring: tenants.filter(t =>
      t.sub_status === 'trialing' &&
      t.trial_ends_at &&
      new Date(t.trial_ends_at) <= in7Days
    ).length,
    total_vehicles: tenants.reduce((s, t) => s + t.vehicle_count, 0),
    total_leads:    tenants.reduce((s, t) => s + t.lead_count, 0),
    total_users:    tenants.reduce((s, t) => s + t.user_count, 0),
  }

  const recentTenants = [...tenants]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-white">Overview</h1>
        <p className="mt-0.5 text-sm text-gray-500">Visão global da plataforma RevendaClick</p>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <KPICard label="Total Tenants"   value={stats.total}    />
        <KPICard label="Ativos"          value={stats.active}   color="text-green-400"  />
        <KPICard label="Em Trial"        value={stats.trialing} color="text-blue-400"   />
        <KPICard label="Inadimplentes"   value={stats.past_due} color="text-orange-400" />
        <KPICard label="Cancelados"      value={stats.canceled} color="text-red-400"    />
        <KPICard label="Bloqueados"      value={stats.blocked}  color="text-red-500"    />
        <KPICard label="Trials (7d)"     value={stats.trials_expiring} color="text-yellow-400" />
        <KPICard label="Total Veículos"  value={stats.total_vehicles} />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <MetricCard label="Total Leads"    value={stats.total_leads}   icon="📥" />
        <MetricCard label="Total Usuários" value={stats.total_users}   icon="👤" />
        <MetricCard label="Revendas ativas" value={stats.active + stats.trialing} icon="🏪" />
      </div>

      {/* Recent tenants */}
      <div className="rounded-xl border border-gray-800 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800 bg-gray-900/60">
          <h2 className="text-sm font-semibold text-gray-300">Tenants recentes</h2>
          <Link
            href="/admin/tenants"
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Ver todos →
          </Link>
        </div>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900/80 text-left">
              {['Tenant', 'Plano', 'Status', 'Veículos', 'Leads', 'Criado'].map(h => (
                <th key={h} className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-600">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {recentTenants.map(t => (
              <tr key={t.id} className="hover:bg-gray-900/30 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-200">{t.name}</p>
                  <p className="text-xs text-gray-600">{t.slug}</p>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">{t.plan_display || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[t.sub_status] ?? STATUS_COLOR.none}`}>
                    {t.sub_status}
                  </span>
                  {!t.is_active && (
                    <span className="ml-1 inline-flex rounded-full border border-red-800 bg-red-900/40 px-2 py-0.5 text-xs font-medium text-red-400">
                      bloqueado
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center text-gray-500">{t.vehicle_count}</td>
                <td className="px-4 py-3 text-center text-gray-500">{t.lead_count}</td>
                <td className="px-4 py-3 text-xs text-gray-600">
                  {new Date(t.created_at).toLocaleDateString('pt-BR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {recentTenants.length === 0 && (
          <div className="py-8 text-center text-sm text-gray-700">Nenhum tenant encontrado.</div>
        )}
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KPICard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">{label}</p>
      <p className={`mt-1.5 text-3xl font-bold ${color ?? 'text-white'}`}>{value}</p>
    </div>
  )
}

function MetricCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-800 bg-gray-900 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-800 text-xl">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">{label}</p>
        <p className="mt-0.5 text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  )
}

// ─── Data fetching ────────────────────────────────────────────────────────────

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
