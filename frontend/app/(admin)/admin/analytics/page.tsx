import { createServiceClient } from '@/lib/supabaseServer'

export const metadata = { title: 'Analytics — Admin RevendaClick' }

export default async function AdminAnalyticsPage() {
  const db = createServiceClient()

  const [
    { data: tenants },
    { data: subscriptions },
    { data: invoices },
    { data: users },
    { data: leads },
    { data: vehicles },
    { data: landingLeads },
    { data: plans },
  ] = await Promise.all([
    db.from('tenants').select('id, is_active, created_at'),
    db.from('subscriptions').select('id, tenant_id, status, created_at, canceled_at, plans!inner(price_monthly)'),
    db.from('billing_invoices').select('value, status, paid_at, created_at'),
    db.from('users').select('id, created_at'),
    db.from('leads').select('id, created_at'),
    db.from('vehicles').select('id, created_at'),
    db.from('landing_leads').select('id, created_at, status'),
    db.from('plans').select('name, display_name, price_monthly'),
  ])

  const now = new Date()
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

  // MRR: assinaturas ativas × price_monthly do plano
  const activeSubs = (subscriptions ?? []).filter((s: any) => s.status === 'active' || s.status === 'past_due')
  const mrr = activeSubs.reduce((sum: number, s: any) => sum + Number(s.plans?.price_monthly ?? 0), 0)
  const arr = mrr * 12

  // Churn: cancelamentos no mês atual
  const churnedThisMonth = (subscriptions ?? []).filter((s: any) =>
    s.canceled_at && new Date(s.canceled_at) >= thisMonth
  ).length

  // Novos tenants este mês
  const newTenantsMonth = (tenants ?? []).filter((t: any) =>
    new Date(t.created_at) >= thisMonth
  ).length

  // Novos usuários este mês
  const newUsersMonth = (users ?? []).filter((u: any) =>
    new Date(u.created_at) >= thisMonth
  ).length

  // Receita recebida este mês
  const revenueMonth = (invoices ?? [])
    .filter((i: any) => (i.status === 'RECEIVED' || i.status === 'CONFIRMED') && i.paid_at && new Date(i.paid_at) >= thisMonth)
    .reduce((sum: number, i: any) => sum + Number(i.value), 0)

  // Receita total histórica
  const revenueTotal = (invoices ?? [])
    .filter((i: any) => i.status === 'RECEIVED' || i.status === 'CONFIRMED')
    .reduce((sum: number, i: any) => sum + Number(i.value), 0)

  // Conversão: landing leads convertidos / total
  const totalLanding = (landingLeads ?? []).length
  const convertedLanding = (landingLeads ?? []).filter((l: any) => l.status === 'convertido').length
  const conversionRate = totalLanding > 0 ? ((convertedLanding / totalLanding) * 100).toFixed(1) : '0.0'

  // Distribuição de planos
  const planDistrib = (subscriptions ?? []).reduce<Record<string, number>>((acc, s: any) => {
    const pname = s.plans?.name ?? 'unknown'
    acc[pname] = (acc[pname] ?? 0) + 1
    return acc
  }, {})

  // Tenants por status
  const subStatusDistrib = (subscriptions ?? []).reduce<Record<string, number>>((acc, s: any) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-white">Analytics</h1>
        <p className="mt-0.5 text-sm text-gray-500">Métricas computadas da plataforma</p>
      </div>

      {/* Financial KPIs */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-3">Financeiro</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MetricCard label="MRR" value={mrr.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} color="text-green-400" />
          <MetricCard label="ARR" value={arr.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} color="text-green-300" />
          <MetricCard label="Receita mês" value={revenueMonth.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} color="text-emerald-400" />
          <MetricCard label="Receita total" value={revenueTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} color="text-emerald-300" />
        </div>
      </section>

      {/* Growth KPIs */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-3">Crescimento</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Tenants totais" value={(tenants ?? []).length} />
          <StatCard label="Novos (mês)" value={newTenantsMonth} color="text-blue-400" />
          <StatCard label="Usuários totais" value={(users ?? []).length} />
          <StatCard label="Novos usuários (mês)" value={newUsersMonth} color="text-blue-300" />
        </div>
      </section>

      {/* Retention KPIs */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-3">Retenção</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Assinaturas ativas" value={activeSubs.length} color="text-green-400" />
          <StatCard label="Churn (mês)" value={churnedThisMonth} color="text-red-400" />
          <StatCard label="Leads landing" value={totalLanding} />
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">Taxa conversão</p>
            <p className="mt-1.5 text-3xl font-bold text-yellow-400">{conversionRate}%</p>
            <p className="text-[10px] text-gray-700 mt-1">{convertedLanding}/{totalLanding} leads</p>
          </div>
        </div>
      </section>

      {/* Product KPIs */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-3">Produto</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Veículos cadastrados" value={(vehicles ?? []).length} />
          <StatCard label="Leads no CRM" value={(leads ?? []).length} />
          <StatCard label="Faturas geradas" value={(invoices ?? []).length} />
          <StatCard label="Tenants ativos" value={(tenants ?? []).filter((t: any) => t.is_active).length} color="text-green-400" />
        </div>
      </section>

      {/* Distribuição de planos */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-3">Distribuição de planos</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {(plans ?? []).map((p: any) => (
            <div key={p.name} className="rounded-xl border border-gray-800 bg-gray-900 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">{p.display_name}</p>
              <p className="mt-1.5 text-3xl font-bold text-white">{planDistrib[p.name] ?? 0}</p>
              <p className="text-[10px] text-gray-700 mt-1">
                {p.price_monthly.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Status das assinaturas */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-3">Status de assinaturas</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {['active', 'trialing', 'past_due', 'canceled', 'paused'].map(s => (
            <div key={s} className="rounded-xl border border-gray-800 bg-gray-900 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">{s}</p>
              <p className="mt-1.5 text-3xl font-bold text-white">{subStatusDistrib[s] ?? 0}</p>
            </div>
          ))}
        </div>
      </section>
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

function MetricCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">{label}</p>
      <p className={`mt-1.5 text-xl font-bold ${color ?? 'text-white'}`}>{value}</p>
    </div>
  )
}
