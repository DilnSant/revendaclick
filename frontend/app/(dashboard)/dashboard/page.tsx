import { getUserIdFromHeaders, getTenantForUser, getTenantUsage } from '@/lib/tenant'
import { notFound } from 'next/navigation'
import UsageBar from '@/components/ui/UsageBar'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const userId = await getUserIdFromHeaders()
  if (!userId) notFound()

  const tenant = await getTenantForUser(userId)
  if (!tenant) notFound()

  const usage = await getTenantUsage(tenant.id)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Bem-vindo, {tenant.name}
        </p>
      </div>

      {/* Metrics */}
      {usage && (
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard
            label="Veículos"
            count={usage.vehicles_count}
            max={usage.max_vehicles}
            pct={usage.vehicles_pct}
            alert={usage.vehicles_alert}
          />
          <MetricCard
            label="Usuários"
            count={usage.users_count}
            max={usage.max_users}
            pct={usage.users_pct}
            alert={usage.users_alert}
          />
          <MetricCard
            label="Leads"
            count={usage.leads_count}
            max={usage.max_leads === -1 ? null : usage.max_leads}
            pct={null}
            alert="ok"
          />
        </div>
      )}

      {/* Plan banner */}
      {usage && (
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Plano atual: {usage.plan_display}</p>
              <p className="mt-0.5 text-xs text-gray-500">Status: {usage.subscription_status}</p>
            </div>
            <a href="/settings?tab=plan" className="btn-primary text-xs">
              Gerenciar plano
            </a>
          </div>
        </div>
      )}

      {/* Store link */}
      <div className="card p-6">
        <p className="text-sm font-medium text-gray-900">Sua loja está no ar:</p>
        <a
          href={`/${tenant.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 block text-primary hover:underline"
        >
          revendaclick.com.br/{tenant.slug}
        </a>
      </div>
    </div>
  )
}

function MetricCard({
  label, count, max, pct, alert,
}: {
  label: string
  count: number
  max: number | null
  pct: number | null
  alert: string
}) {
  const alertColors: Record<string, string> = {
    ok: 'bg-green-50 border-green-100',
    warning: 'bg-yellow-50 border-yellow-200',
    critical: 'bg-orange-50 border-orange-200',
    blocked: 'bg-red-50 border-red-200',
  }

  return (
    <div className={`card border p-5 ${alertColors[alert] ?? alertColors.ok}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-gray-900">{count}</p>
      {max !== null && <p className="text-xs text-gray-400">de {max === -1 ? '∞' : max}</p>}
      {pct !== null && max !== null && max !== -1 && (
        <UsageBar pct={pct} alert={alert} className="mt-3" />
      )}
    </div>
  )
}
