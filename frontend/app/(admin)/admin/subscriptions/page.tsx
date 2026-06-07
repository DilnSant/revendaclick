import { createServiceClient } from '@/lib/supabaseServer'

export const metadata = { title: 'Assinaturas — Admin RevendaClick' }

const STATUS_COLOR: Record<string, string> = {
  active:   'bg-green-900/40 text-green-400 border-green-800',
  trialing: 'bg-blue-900/40 text-blue-400 border-blue-800',
  past_due: 'bg-orange-900/40 text-orange-400 border-orange-800',
  canceled: 'bg-red-900/40 text-red-400 border-red-800',
  paused:   'bg-gray-700 text-gray-400 border-gray-600',
}

export default async function AdminSubscriptionsPage() {
  const db = createServiceClient()

  const { data: subs } = await db
    .from('subscriptions')
    .select(`
      id, status, billing_cycle, current_period_start, current_period_end,
      trial_ends_at, canceled_at, asaas_subscription_id, created_at,
      tenants!inner(slug, name, email),
      plans!inner(name, display_name, price_monthly)
    `)
    .order('created_at', { ascending: false })

  const { data: addons } = await db
    .from('subscription_addons')
    .select('tenant_id, addon_type, status, price_monthly')

  const addonsByTenant = (addons ?? []).reduce<Record<string, typeof addons>>((acc, a) => {
    if (!a) return acc
    const tid = (a as { tenant_id: string }).tenant_id
    if (!acc[tid]) acc[tid] = []
    acc[tid]!.push(a)
    return acc
  }, {})

  const rows = (subs ?? []) as Array<{
    id: string
    status: string
    billing_cycle: string
    current_period_start: string | null
    current_period_end: string | null
    trial_ends_at: string | null
    canceled_at: string | null
    asaas_subscription_id: string | null
    created_at: string
    tenants: { slug: string; name: string; email: string }
    plans: { name: string; display_name: string; price_monthly: number }
  }>

  const stats = {
    total:    rows.length,
    active:   rows.filter(s => s.status === 'active').length,
    trialing: rows.filter(s => s.status === 'trialing').length,
    past_due: rows.filter(s => s.status === 'past_due').length,
    canceled: rows.filter(s => s.status === 'canceled').length,
  }

  // MRR simples: somar price_monthly de assinaturas ativas
  const mrr = rows
    .filter(s => s.status === 'active' || s.status === 'past_due')
    .reduce((sum, s) => sum + (s.plans?.price_monthly ?? 0), 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-white">Assinaturas</h1>
        <p className="mt-0.5 text-sm text-gray-500">Todas as assinaturas da plataforma</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Ativas" value={stats.active} color="text-green-400" />
        <StatCard label="Trial" value={stats.trialing} color="text-blue-400" />
        <StatCard label="Past Due" value={stats.past_due} color="text-orange-400" />
        <StatCard label="Canceladas" value={stats.canceled} color="text-red-400" />
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">MRR est.</p>
          <p className="mt-1.5 text-2xl font-bold text-green-400">
            {mrr.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800 bg-gray-900/60">
          <h2 className="text-sm font-semibold text-gray-300">{rows.length} assinaturas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/80 text-left">
                {['Tenant', 'Plano', 'Valor/mês', 'Status', 'Add-ons', 'Período', 'Trial até', 'Criado'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {rows.map(s => {
                const tenantAddons = (addonsByTenant[(s as any).tenant_id] ?? []) as Array<{ addon_type: string; status: string; price_monthly: number }>
                const activeAddons = tenantAddons.filter(a => a.status === 'active')
                return (
                  <tr key={s.id} className="hover:bg-gray-900/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-200 whitespace-nowrap">{s.tenants?.name}</p>
                      <p className="text-xs text-gray-600">{s.tenants?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-300 whitespace-nowrap">
                      {s.plans?.display_name ?? s.plans?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {s.plans?.price_monthly != null
                        ? s.plans.price_monthly.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${STATUS_COLOR[s.status] ?? 'bg-gray-800 text-gray-500 border-gray-700'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {activeAddons.length > 0
                        ? activeAddons.map(a => a.addon_type).join(', ')
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                      {s.current_period_end
                        ? new Date(s.current_period_end).toLocaleDateString('pt-BR')
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                      {s.trial_ends_at
                        ? new Date(s.trial_ends_at).toLocaleDateString('pt-BR')
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                      {new Date(s.created_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {rows.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-700">Nenhuma assinatura encontrada.</div>
          )}
        </div>
      </div>
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
