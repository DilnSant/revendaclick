import Link from 'next/link'
import { getUserIdFromHeaders, getTenantForUser, getUsageFromAPI } from '@/lib/tenant'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabaseServer'
import UsageBar from '@/components/ui/UsageBar'
import OnboardingChecklist from '@/components/onboarding/OnboardingChecklist'
import type { ChecklistData } from '@/components/onboarding/OnboardingChecklist'
import type { Lead } from '@/lib/crm'

export const metadata = { title: 'Dashboard' }

const API = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

interface Sale { id: string; sale_price: number; status: string }
interface CashFlowMonth { month: string; total_income: number; total_expense: number; net_balance: number }

export default async function DashboardPage() {
  const userId = await getUserIdFromHeaders()
  if (!userId) notFound()

  const tenant = await getTenantForUser(userId)
  if (!tenant) notFound()

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token ?? ''

  const [usage, checklist, sales, cashFlow, followUps] = await Promise.all([
    getUsageFromAPI(token),
    fetchChecklist(token),
    fetchSales(token),
    fetchCashFlow(token),
    fetchFollowUps(token),
  ])

  const completedSales = sales.filter(s => s.status === 'completed')
  const pendingSales   = sales.filter(s => s.status === 'pending')
  const monthRevenue   = cashFlow[cashFlow.length - 1]?.total_income ?? 0
  const monthExpense   = cashFlow[cashFlow.length - 1]?.total_expense ?? 0
  const monthBalance   = monthRevenue - monthExpense

  const checklistWithFlags: ChecklistData | null = checklist
    ? { ...checklist, has_central_atendimento: usage?.has_central_atendimento ?? false }
    : null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-heading font-bold text-graphite">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Bem-vindo, {tenant.name}</p>
      </div>

      {/* Onboarding checklist — visible until completed */}
      {checklistWithFlags && <OnboardingChecklist checklist={checklistWithFlags} />}

      {/* Revenue KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Receita do mês"
          value={fmt(monthRevenue)}
          color="text-green-600"
          href="/financial"
        />
        <KPICard
          label="Saldo líquido"
          value={fmt(monthBalance)}
          color={monthBalance >= 0 ? 'text-green-700' : 'text-red-700'}
          href="/financial"
        />
        <KPICard
          label="Vendas concluídas"
          value={String(completedSales.length)}
          color="text-gray-900"
          href="/sales"
          isCount
        />
        <KPICard
          label="Vendas pendentes"
          value={String(pendingSales.length)}
          color="text-yellow-600"
          href="/sales"
          isCount
        />
      </div>

      {/* Plan usage metrics */}
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

      {/* Cash flow mini-table */}
      {cashFlow.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Fluxo de caixa — últimos meses</h2>
            <Link href="/financial" className="text-xs font-medium text-red-600 hover:text-red-700">Ver completo →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                  <th className="pb-2 pr-6">Mês</th>
                  <th className="pb-2 pr-6 text-right text-green-600">Receita</th>
                  <th className="pb-2 pr-6 text-right text-red-600">Despesas</th>
                  <th className="pb-2 text-right">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {cashFlow.slice(-3).map(row => (
                  <tr key={row.month}>
                    <td className="py-2 pr-6 font-medium text-gray-700">{fmtMonth(row.month)}</td>
                    <td className="py-2 pr-6 text-right text-green-600">{fmt(row.total_income)}</td>
                    <td className="py-2 pr-6 text-right text-red-500">{fmt(row.total_expense)}</td>
                    <td className={`py-2 text-right font-semibold ${row.net_balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {fmt(row.net_balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Follow-ups due today / overdue */}
      {followUps.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Follow-ups pendentes</h2>
            <Link href="/leads" className="text-xs font-medium text-red-600 hover:text-red-700">Ver leads →</Link>
          </div>
          <div className="space-y-2">
            {followUps.slice(0, 5).map(lead => {
              const due = new Date(lead.follow_up_at!)
              const isOverdue = due < new Date()
              return (
                <div key={lead.id} className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2">
                  <div className={`h-2 w-2 rounded-full shrink-0 ${isOverdue ? 'bg-red-500' : 'bg-blue-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{lead.name}</p>
                    {lead.follow_up_note && (
                      <p className="text-xs text-gray-400 truncate">{lead.follow_up_note}</p>
                    )}
                  </div>
                  <span className={`text-xs shrink-0 font-medium ${isOverdue ? 'text-red-600' : 'text-blue-600'}`}>
                    {isOverdue ? 'Atrasado' : due.toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Plan banner */}
        {usage && (
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Plano atual: {usage.plan_display}</p>
                <p className="mt-0.5 text-xs text-gray-500">Status: {usage.subscription_status}</p>
              </div>
              <Link href="/billing" className="btn-primary text-xs">Gerenciar</Link>
            </div>
          </div>
        )}

        {/* Store link */}
        <div className="card p-6">
          <p className="text-sm font-medium text-gray-900">Sua loja pública:</p>
          <a
            href={`/${tenant.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 block text-primary hover:underline text-sm"
          >
            revendaclick.com.br/{tenant.slug}
          </a>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KPICard({
  label, value, color, href, isCount,
}: {
  label: string; value: string; color?: string; href?: string; isCount?: boolean
}) {
  const inner = (
    <div className="card p-5 hover:shadow-card-hover transition-shadow">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`mt-2 font-heading font-bold text-gray-900 ${isCount ? 'text-3xl' : 'text-2xl'} ${color ?? ''}`}>{value}</p>
    </div>
  )
  return href ? <a href={href}>{inner}</a> : inner
}

function MetricCard({
  label, count, max, pct, alert,
}: {
  label: string; count: number; max: number | null; pct: number | null; alert: string
}) {
  const alertColors: Record<string, string> = {
    ok: 'bg-green-50 border-green-100',
    warning: 'bg-yellow-50 border-yellow-200',
    critical: 'bg-orange-50 border-orange-200',
    blocked: 'bg-red-50 border-red-200',
  }

  return (
    <div className={`card border p-5 ${alertColors[alert] ?? alertColors.ok}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-2 text-3xl font-heading font-bold text-graphite">{count}</p>
      {max !== null && <p className="text-xs text-gray-400">de {max === -1 ? '∞' : max}</p>}
      {pct !== null && max !== null && max !== -1 && (
        <UsageBar pct={pct} alert={alert} className="mt-3" />
      )}
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtMonth(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchSales(token: string): Promise<Sale[]> {
  if (!token) return []
  try {
    const res = await fetch(`${API}/api/sales?limit=200`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return []
    const json = await res.json()
    return (json.data ?? []) as Sale[]
  } catch { return [] }
}

async function fetchCashFlow(token: string): Promise<CashFlowMonth[]> {
  if (!token) return []
  try {
    const res = await fetch(`${API}/api/financial/cash-flow?months=3`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return []
    const json = await res.json()
    return (json.data ?? json ?? []) as CashFlowMonth[]
  } catch { return [] }
}

async function fetchChecklist(token: string): Promise<ChecklistData | null> {
  if (!token) return null
  try {
    const res = await fetch(`${API}/api/onboarding`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const json = await res.json()
    return (json.data ?? null) as ChecklistData | null
  } catch { return null }
}

async function fetchFollowUps(token: string): Promise<Lead[]> {
  if (!token) return []
  try {
    const res = await fetch(`${API}/api/leads/follow-ups`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return []
    const json = await res.json()
    return (json.data ?? json ?? []) as Lead[]
  } catch { return [] }
}
