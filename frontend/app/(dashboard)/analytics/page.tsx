import { notFound } from 'next/navigation'
import { getUserIdFromHeaders, getTenantForUser, getTenantUsage } from '@/lib/tenant'
import { createClient } from '@/lib/supabaseServer'
import type { PlanUsage } from '@/lib/tenant'

export const metadata = { title: 'Analytics' }

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

interface LeadStats { status: string; count: number }
interface VehicleStats { status: string; count: number }

export default async function AnalyticsPage() {
  const userId = await getUserIdFromHeaders()
  if (!userId) notFound()

  const tenant = await getTenantForUser(userId)
  if (!tenant) notFound()

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token ?? ''

  const [usage, leadStats, vehicleStats] = await Promise.all([
    getTenantUsage(tenant.id),
    fetchLeadStats(token),
    fetchVehicleStats(token),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-0.5 text-sm text-gray-500">Métricas da sua loja</p>
      </div>

      {/* KPIs */}
      {usage && <KPIGrid usage={usage} />}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Leads by status */}
        <StatsCard title="Leads por status" items={leadStats} emptyMessage="Nenhum lead registrado ainda." />

        {/* Vehicles by status */}
        <StatsCard title="Estoque por status" items={vehicleStats} emptyMessage="Nenhum veículo cadastrado ainda." />
      </div>

      {/* Usage limits */}
      {usage && (
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Limites do plano — {usage.plan_display}</h2>
          <div className="space-y-3">
            <LimitBar label="Veículos" count={usage.vehicles_count} max={usage.max_vehicles} alert={usage.vehicles_alert} />
            <LimitBar label="Usuários" count={usage.users_count} max={usage.max_users} alert={usage.users_alert} />
            <LimitBar label="Leads" count={usage.leads_count} max={usage.max_leads} alert="ok" />
          </div>
        </div>
      )}
    </div>
  )
}

function KPIGrid({ usage }: { usage: PlanUsage }) {
  const cards = [
    { label: 'Veículos ativos', value: usage.vehicles_count },
    { label: 'Leads totais',    value: usage.leads_count },
    { label: 'Usuários',        value: usage.users_count },
    { label: 'Plano',           value: usage.plan_display, isText: true },
  ]
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ label, value, isText }) => (
        <div key={label} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
          <p className={`mt-1 font-bold text-gray-900 ${isText ? 'text-lg' : 'text-3xl'}`}>{value}</p>
        </div>
      ))}
    </div>
  )
}

const STATUS_LABELS: Record<string, string> = {
  new:          'Novo',
  in_progress:  'Em andamento',
  proposal:     'Proposta',
  closed_won:   'Ganho',
  closed_lost:  'Perdido',
  available:    'Disponível',
  reserved:     'Reservado',
  sold:         'Vendido',
  inactive:     'Inativo',
}

const STATUS_COLORS: Record<string, string> = {
  new:         'bg-blue-500',
  in_progress: 'bg-yellow-500',
  proposal:    'bg-purple-500',
  closed_won:  'bg-green-500',
  closed_lost: 'bg-red-400',
  available:   'bg-green-500',
  reserved:    'bg-yellow-500',
  sold:        'bg-gray-400',
  inactive:    'bg-gray-300',
}

function StatsCard({ title, items, emptyMessage }: { title: string; items: { status: string; count: number }[]; emptyMessage: string }) {
  const total = items.reduce((s, i) => s + i.count, 0)

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400">{emptyMessage}</p>
      ) : (
        <div className="space-y-2.5">
          {items.map(({ status, count }) => {
            const pct = total > 0 ? Math.round((count / total) * 100) : 0
            return (
              <div key={status}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-gray-700">{STATUS_LABELS[status] ?? status}</span>
                  <span className="text-gray-500">{count} ({pct}%)</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full transition-all ${STATUS_COLORS[status] ?? 'bg-gray-400'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const ALERT_BAR: Record<string, string> = {
  ok:       'bg-green-500',
  warning:  'bg-yellow-500',
  critical: 'bg-orange-500',
  blocked:  'bg-red-600',
}

function LimitBar({ label, count, max, alert }: { label: string; count: number; max: number; alert: string }) {
  const pct    = max === -1 ? 0 : Math.min(100, Math.round((count / max) * 100))
  const isUnlimited = max === -1

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">
          {count} / {isUnlimited ? '∞' : max}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-all ${ALERT_BAR[alert] ?? ALERT_BAR.ok}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  )
}

async function fetchLeadStats(token: string): Promise<LeadStats[]> {
  if (!token) return []
  try {
    const res = await fetch(`${API}/api/leads?limit=500`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return []
    const json = await res.json()
    const leads = (json.data ?? []) as Array<{ status: string }>

    const counts: Record<string, number> = {}
    for (const l of leads) {
      counts[l.status] = (counts[l.status] ?? 0) + 1
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([status, count]) => ({ status, count }))
  } catch {
    return []
  }
}

async function fetchVehicleStats(token: string): Promise<VehicleStats[]> {
  if (!token) return []
  try {
    const res = await fetch(`${API}/api/vehicles?limit=500`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return []
    const json = await res.json()
    const vehicles = (json.data ?? []) as Array<{ status: string }>

    const counts: Record<string, number> = {}
    for (const v of vehicles) {
      counts[v.status] = (counts[v.status] ?? 0) + 1
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([status, count]) => ({ status, count }))
  } catch {
    return []
  }
}
