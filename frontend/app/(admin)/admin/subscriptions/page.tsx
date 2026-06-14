import { createServiceClient } from '@/lib/supabaseServer'
import { SubscriptionsTable, type SubRow } from './_components/SubscriptionsTable'

export const metadata = { title: 'Assinaturas — Admin RevendaClick' }
export const revalidate = 0

export default async function AdminSubscriptionsPage() {
  const db = createServiceClient()

  const [{ data: subs }, { data: addons }] = await Promise.all([
    db.from('subscriptions').select(`
      id, tenant_id, status, billing_cycle, current_period_start, current_period_end,
      trial_ends_at, grace_until, canceled_at, asaas_subscription_id, created_at,
      tenants!inner(slug, name, email),
      plans!inner(name, display_name, price_monthly)
    `).order('created_at', { ascending: false }),
    db.from('subscription_addons').select('tenant_id, addon_type, status, price_monthly'),
  ])

  const addonsByTenant = (addons ?? []).reduce<Record<string, { addon_type: string; status: string }[]>>((acc, a) => {
    if (!a) return acc
    const tid = (a as { tenant_id: string }).tenant_id
    if (!acc[tid]) acc[tid] = []
    acc[tid].push(a as { addon_type: string; status: string })
    return acc
  }, {})

  const rawRows = (subs ?? []) as Array<{
    id: string
    tenant_id: string
    status: string
    billing_cycle: string
    current_period_start: string | null
    current_period_end: string | null
    trial_ends_at: string | null
    grace_until: string | null
    canceled_at: string | null
    asaas_subscription_id: string | null
    created_at: string
    tenants: { slug: string; name: string; email: string }
    plans: { name: string; display_name: string; price_monthly: number }
  }>

  const rows: SubRow[] = rawRows.map(s => ({
    id:                   s.id,
    tenant_id:            s.tenant_id,
    status:               s.status,
    billing_cycle:        s.billing_cycle,
    current_period_end:   s.current_period_end,
    trial_ends_at:        s.trial_ends_at,
    grace_until:          s.grace_until,
    canceled_at:          s.canceled_at,
    asaas_subscription_id: s.asaas_subscription_id,
    created_at:           s.created_at,
    tenant_slug:          s.tenants?.slug ?? '',
    tenant_name:          s.tenants?.name ?? '',
    tenant_email:         s.tenants?.email ?? '',
    plan_name:            s.plans?.name ?? '',
    plan_display:         s.plans?.display_name ?? '',
    price_monthly:        s.plans?.price_monthly ?? 0,
    active_addons:        (addonsByTenant[s.tenant_id] ?? [])
                            .filter(a => a.status === 'active')
                            .map(a => a.addon_type),
  }))

  const stats = {
    total:    rows.length,
    active:   rows.filter(s => s.status === 'active').length,
    trialing: rows.filter(s => s.status === 'trialing').length,
    past_due: rows.filter(s => s.status === 'past_due').length,
    canceled: rows.filter(s => s.status === 'canceled').length,
  }
  const mrr = rows
    .filter(s => s.status === 'active' || s.status === 'past_due')
    .reduce((sum, s) => sum + s.price_monthly, 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-white">Assinaturas</h1>
        <p className="mt-0.5 text-sm text-gray-500">Todas as assinaturas da plataforma</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total"      value={stats.total} />
        <StatCard label="Ativas"     value={stats.active}   color="text-green-400" />
        <StatCard label="Trial"      value={stats.trialing} color="text-blue-400" />
        <StatCard label="Past Due"   value={stats.past_due} color="text-orange-400" />
        <StatCard label="Canceladas" value={stats.canceled} color="text-red-400" />
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">MRR est.</p>
          <p className="mt-1.5 text-2xl font-bold text-green-400">
            {mrr.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
      </div>

      <SubscriptionsTable rows={rows} />
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">{label}</p>
      <p className={`mt-1.5 text-3xl font-bold ${color ?? 'text-white'}`}>{value}</p>
    </div>
  )
}
