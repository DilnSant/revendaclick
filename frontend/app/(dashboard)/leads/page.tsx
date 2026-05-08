import { notFound } from 'next/navigation'
import { getUserIdFromHeaders, getTenantForUser } from '@/lib/tenant'
import { createClient } from '@/lib/supabaseServer'
import type { Lead, Seller } from '@/lib/crm'
import LeadKanban from '@/components/crm/LeadKanban'
import LeadList from '@/components/crm/LeadList'

export const metadata = { title: 'Leads' }

interface Props {
  searchParams: Promise<{
    view?: string
    status?: string
    seller?: string
  }>
}

export default async function LeadsPage({ searchParams }: Props) {
  const query   = await searchParams
  const view    = query.view === 'list' ? 'list' : 'kanban'

  const userId = await getUserIdFromHeaders()
  if (!userId) notFound()

  const tenant = await getTenantForUser(userId)
  if (!tenant) notFound()

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token ?? ''

  const [{ leads, total }, sellers] = await Promise.all([
    fetchLeads(token, query),
    fetchSellers(token),
  ])

  return (
    <div className="flex h-full flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-graphite">Leads</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {total} lead{total !== 1 ? 's' : ''} no total
          </p>
        </div>

        {/* View switcher */}
        <div className="flex items-center rounded-lg border border-gray-200 bg-white p-1">
          <a
            href="/leads"
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              view === 'kanban'
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Kanban
          </a>
          <a
            href="/leads?view=list"
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              view === 'list'
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Lista
          </a>
        </div>
      </div>

      {/* Content */}
      {view === 'kanban' ? (
        <LeadKanban leads={leads} sellers={sellers} />
      ) : (
        <LeadList leads={leads} sellers={sellers} total={total} />
      )}
    </div>
  )
}

// ─── Server-side data fetchers ─────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

async function fetchLeads(
  token: string,
  filter: { status?: string; seller?: string },
): Promise<{ leads: Lead[]; total: number }> {
  const params = new URLSearchParams({ limit: '200' })
  if (filter.status) params.set('status', filter.status)
  if (filter.seller) params.set('seller_id', filter.seller)

  try {
    const res = await fetch(`${API}/api/leads?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return { leads: [], total: 0 }
    const json = await res.json()
    return {
      leads: (json.data ?? []) as Lead[],
      total: (json.meta?.total ?? 0) as number,
    }
  } catch {
    return { leads: [], total: 0 }
  }
}

async function fetchSellers(token: string): Promise<Seller[]> {
  try {
    const res = await fetch(`${API}/api/users/sellers`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return []
    const json = await res.json()
    return (json.data ?? []) as Seller[]
  } catch {
    return []
  }
}
