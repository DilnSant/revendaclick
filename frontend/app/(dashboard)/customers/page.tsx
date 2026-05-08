import { notFound } from 'next/navigation'
import { getUserIdFromHeaders, getTenantForUser } from '@/lib/tenant'
import { createClient } from '@/lib/supabaseServer'
import type { Customer } from '@/lib/customers'
import CustomersView from '@/components/customers/CustomersView'

export const metadata = { title: 'Clientes' }

const PAGE_SIZE = 20
const API = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

interface Props {
  searchParams: Promise<{
    page?: string
    search?: string
    state?: string
    active?: string
  }>
}

export default async function CustomersPage({ searchParams }: Props) {
  const query = await searchParams

  const userId = await getUserIdFromHeaders()
  if (!userId) notFound()

  const tenant = await getTenantForUser(userId)
  if (!tenant) notFound()

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token ?? ''

  const page   = Math.max(1, parseInt(query.page ?? '1', 10))
  const search = query.search ?? ''
  const state  = query.state ?? ''
  const active = query.active ?? ''

  const { customers, total } = await fetchCustomers(token, {
    page,
    search,
    state,
    active,
  })

  return (
    <div className="flex flex-col gap-6">
      <CustomersView
        customers={customers}
        total={total}
        page={page}
        search={search}
        filterState={state}
        filterActive={active}
      />
    </div>
  )
}

async function fetchCustomers(
  token: string,
  filter: { page: number; search: string; state: string; active: string },
): Promise<{ customers: Customer[]; total: number }> {
  const params = new URLSearchParams({
    limit:  String(PAGE_SIZE),
    offset: String((filter.page - 1) * PAGE_SIZE),
  })
  if (filter.search) params.set('search', filter.search)
  if (filter.state)  params.set('state', filter.state)
  if (filter.active) params.set('active', filter.active)

  try {
    const res = await fetch(`${API}/api/customers?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return { customers: [], total: 0 }
    const json = await res.json()
    return {
      customers: (json.data ?? []) as Customer[],
      total:     (json.meta?.total ?? 0) as number,
    }
  } catch {
    return { customers: [], total: 0 }
  }
}
