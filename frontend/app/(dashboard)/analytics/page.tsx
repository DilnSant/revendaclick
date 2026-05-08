import { notFound } from 'next/navigation'
import { getUserIdFromHeaders, getTenantForUser } from '@/lib/tenant'
import { createClient } from '@/lib/supabaseServer'

export const metadata = { title: 'Analytics' }

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

interface AnalyticsSummary {
  total_leads: number
  new_leads: number
  in_progress_leads: number
  proposal_leads: number
  won_leads: number
  lost_leads: number
  conversion_rate: number
  leads_by_source: { source: string; count: number }[]
  total_vehicles: number
  available_vehicles: number
  reserved_vehicles: number
  sold_vehicles: number
  month_revenue: number
  month_sales: number
  avg_sale_value: number
  revenue_history: { month: string; revenue: number; sales: number }[]
}

export default async function AnalyticsPage() {
  const userId = await getUserIdFromHeaders()
  if (!userId) notFound()

  const tenant = await getTenantForUser(userId)
  if (!tenant) notFound()

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token ?? ''

  const summary = await fetchSummary(token)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-graphite">Analytics</h1>
        <p className="mt-0.5 text-sm text-gray-500">Métricas da sua loja</p>
      </div>

      {/* Financial KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="Receita este mês"   value={fmtBRL(summary.month_revenue)} />
        <KPICard label="Vendas este mês"    value={summary.month_sales} />
        <KPICard label="Ticket médio"       value={fmtBRL(summary.avg_sale_value)} />
        <KPICard label="Taxa de conversão"  value={`${summary.conversion_rate.toFixed(1)}%`} isText />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Lead funnel */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            Funil de leads
            <span className="ml-2 text-sm font-normal text-gray-400">({summary.total_leads} total)</span>
          </h2>
          <div className="space-y-2.5">
            <FunnelBar label="Novos"        count={summary.new_leads}        total={summary.total_leads} color="bg-blue-500" />
            <FunnelBar label="Em andamento" count={summary.in_progress_leads} total={summary.total_leads} color="bg-yellow-500" />
            <FunnelBar label="Proposta"     count={summary.proposal_leads}   total={summary.total_leads} color="bg-purple-500" />
            <FunnelBar label="Ganhos"       count={summary.won_leads}        total={summary.total_leads} color="bg-green-500" />
            <FunnelBar label="Perdidos"     count={summary.lost_leads}       total={summary.total_leads} color="bg-red-400" />
          </div>
        </div>

        {/* Leads by source */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Leads por origem</h2>
          {summary.leads_by_source.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhum lead ainda.</p>
          ) : (
            <div className="space-y-2.5">
              {summary.leads_by_source.map(({ source, count }) => (
                <FunnelBar
                  key={source}
                  label={SOURCE_LABELS[source] ?? source}
                  count={count}
                  total={summary.total_leads}
                  color="bg-red-500"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Vehicle stock */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          Estoque
          <span className="ml-2 text-sm font-normal text-gray-400">({summary.total_vehicles} veículos)</span>
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StockCard label="Disponíveis" value={summary.available_vehicles} color="text-green-600 bg-green-50" />
          <StockCard label="Reservados"  value={summary.reserved_vehicles}  color="text-yellow-600 bg-yellow-50" />
          <StockCard label="Vendidos"    value={summary.sold_vehicles}      color="text-gray-600 bg-gray-100" />
          <StockCard label="Inativos"    value={summary.total_vehicles - summary.available_vehicles - summary.reserved_vehicles - summary.sold_vehicles}
                     color="text-red-600 bg-red-50" />
        </div>
      </div>

      {/* Revenue history */}
      {summary.revenue_history.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Receita — últimos 6 meses</h2>
          <RevenueChart history={summary.revenue_history} />
        </div>
      )}
    </div>
  )
}

// ─── Components ───────────────────────────────────────────────────────────────

function KPICard({ label, value, isText }: { label: string; value: string | number; isText?: boolean }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-1 font-bold text-gray-900 ${isText ? 'text-xl' : 'text-3xl'}`}>{value}</p>
    </div>
  )
}

function FunnelBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">{count} ({pct}%)</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function StockCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-lg px-4 py-3 ${color}`}>
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className="mt-0.5 text-2xl font-heading font-bold">{value}</p>
    </div>
  )
}

function RevenueChart({ history }: { history: { month: string; revenue: number; sales: number }[] }) {
  const max = Math.max(...history.map((h) => h.revenue), 1)
  return (
    <div className="flex items-end gap-3 h-32">
      {history.map((h) => {
        const pct = Math.round((h.revenue / max) * 100)
        const [year, month] = h.month.split('-')
        const label = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('pt-BR', { month: 'short' })
        return (
          <div key={h.month} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] font-medium text-gray-500">{fmtBRL(h.revenue, true)}</span>
            <div className="w-full rounded-t bg-red-100 flex flex-col justify-end" style={{ height: '80px' }}>
              <div
                className="w-full rounded-t bg-red-500 transition-all"
                style={{ height: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-400 capitalize">{label}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Utils ────────────────────────────────────────────────────────────────────

const SOURCE_LABELS: Record<string, string> = {
  marketplace: 'Marketplace',
  whatsapp:    'WhatsApp',
  referral:    'Indicação',
  direct:      'Direto',
  social:      'Redes Sociais',
  other:       'Outro',
}

function fmtBRL(value: number, compact = false): string {
  if (compact && value >= 1000) {
    return `R$ ${(value / 1000).toFixed(1)}k`
  }
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

async function fetchSummary(token: string): Promise<AnalyticsSummary> {
  const empty: AnalyticsSummary = {
    total_leads: 0, new_leads: 0, in_progress_leads: 0, proposal_leads: 0,
    won_leads: 0, lost_leads: 0, conversion_rate: 0, leads_by_source: [],
    total_vehicles: 0, available_vehicles: 0, reserved_vehicles: 0, sold_vehicles: 0,
    month_revenue: 0, month_sales: 0, avg_sale_value: 0, revenue_history: [],
  }
  if (!token) return empty
  try {
    const res = await fetch(`${API}/api/analytics/summary`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return empty
    return await res.json() as AnalyticsSummary
  } catch {
    return empty
  }
}
