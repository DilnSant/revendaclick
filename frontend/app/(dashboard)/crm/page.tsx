import { notFound } from 'next/navigation'
import { getUserIdFromHeaders, getTenantForUser } from '@/lib/tenant'
import { createClient } from '@/lib/supabaseServer'
import type { Lead } from '@/lib/crm'

export const metadata = { title: 'CRM' }

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

const PIPELINE_STAGES = [
  { key: 'new',          label: 'Novos',       color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { key: 'in_progress',  label: 'Em andamento', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { key: 'proposal',     label: 'Proposta',     color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { key: 'closed_won',   label: 'Ganho',        color: 'bg-green-100 text-green-700 border-green-200' },
  { key: 'closed_lost',  label: 'Perdido',      color: 'bg-red-100 text-red-600 border-red-200' },
]

const SOURCE_LABELS: Record<string, string> = {
  marketplace: 'Marketplace',
  whatsapp:    'WhatsApp',
  referral:    'Indicação',
  direct:      'Direto',
  social:      'Redes Sociais',
  other:       'Outro',
}

export default async function CRMPage() {
  const userId = await getUserIdFromHeaders()
  if (!userId) notFound()

  const tenant = await getTenantForUser(userId)
  if (!tenant) notFound()

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token ?? ''

  const leads = await fetchLeads(token)

  // Aggregate data
  const byStatus = PIPELINE_STAGES.map(stage => ({
    ...stage,
    count: leads.filter(l => l.status === stage.key).length,
  }))

  const bySource = Object.entries(
    leads.reduce<Record<string, number>>((acc, l) => {
      acc[l.source] = (acc[l.source] ?? 0) + 1
      return acc
    }, {})
  ).sort((a, b) => b[1] - a[1])

  const recentLeads = leads.slice(0, 8)

  const total       = leads.length
  const wonLeads    = leads.filter(l => l.status === 'closed_won').length
  const lostLeads   = leads.filter(l => l.status === 'closed_lost').length
  const convRate    = total > 0 ? Math.round((wonLeads / total) * 100) : 0
  const activeLeads = leads.filter(l => !['closed_won', 'closed_lost'].includes(l.status)).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CRM</h1>
          <p className="mt-0.5 text-sm text-gray-500">Visão geral do pipeline de vendas</p>
        </div>
        <a href="/leads" className="btn-primary shrink-0">
          Ver leads completos
        </a>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="Total de leads"      value={total} />
        <KPICard label="Leads ativos"        value={activeLeads} />
        <KPICard label="Ganhos"             value={wonLeads} highlight />
        <KPICard label="Taxa de conversão"   value={`${convRate}%`} isText />
      </div>

      {/* Pipeline funnel */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm space-y-3">
        <h2 className="text-base font-semibold text-gray-900">Pipeline</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          {byStatus.map(({ key, label, count, color }) => (
            <div
              key={key}
              className={`flex-1 rounded-lg border px-4 py-3 text-center ${color}`}
            >
              <p className="text-2xl font-bold">{count}</p>
              <p className="mt-0.5 text-xs font-medium">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Leads by source */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm space-y-3">
          <h2 className="text-base font-semibold text-gray-900">Por origem</h2>
          {bySource.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhum lead ainda.</p>
          ) : (
            <div className="space-y-2">
              {bySource.map(([source, count]) => (
                <div key={source} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{SOURCE_LABELS[source] ?? source}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-red-500 transition-all"
                        style={{ width: `${total > 0 ? Math.round((count / total) * 100) : 0}%` }}
                      />
                    </div>
                    <span className="w-6 text-right text-gray-500">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent leads */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Leads recentes</h2>
            <a href="/leads" className="text-xs font-medium text-red-600 hover:text-red-700">Ver todos →</a>
          </div>
          {recentLeads.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhum lead ainda.</p>
          ) : (
            <div className="space-y-2.5">
              {recentLeads.map(l => (
                <div key={l.id} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                    {l.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{l.name}</p>
                    <p className="text-xs text-gray-400 truncate">{l.email || l.phone || '—'}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    PIPELINE_STAGES.find(s => s.key === l.status)?.color ?? 'bg-gray-100 text-gray-600'
                  }`}>
                    {PIPELINE_STAGES.find(s => s.key === l.status)?.label ?? l.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function KPICard({ label, value, highlight, isText }: { label: string; value: string | number; highlight?: boolean; isText?: boolean }) {
  return (
    <div className={`rounded-xl border p-5 shadow-sm ${highlight ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-white'}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-1 font-bold text-gray-900 ${isText ? 'text-2xl' : 'text-3xl'}`}>{value}</p>
    </div>
  )
}

async function fetchLeads(token: string): Promise<Lead[]> {
  if (!token) return []
  try {
    const res = await fetch(`${API}/api/leads?limit=500`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return []
    const json = await res.json()
    return (json.data ?? []) as Lead[]
  } catch {
    return []
  }
}
