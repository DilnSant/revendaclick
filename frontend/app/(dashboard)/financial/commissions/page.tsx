import { notFound } from 'next/navigation'
import { getUserIdFromHeaders, getTenantForUser } from '@/lib/tenant'
import { createClient } from '@/lib/supabaseServer'
import CommissionsClient from './_components/CommissionsClient'

export const metadata = { title: 'Comissões — RevendaClick' }

const API = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

export interface Commission {
  id: string
  sale_id: string
  seller_id: string
  type: string
  rate?: number
  amount: number
  status: 'pending' | 'paid'
  paid_at?: string
  notes?: string
  created_at: string
}

export interface Seller {
  id: string
  name: string
}

export default async function CommissionsPage() {
  const userId = await getUserIdFromHeaders()
  if (!userId) notFound()

  const tenant = await getTenantForUser(userId)
  if (!tenant) notFound()

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token ?? ''

  const [commissions, sellers] = await Promise.all([
    fetchCommissions(token),
    fetchSellers(token),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-graphite">Comissões</h1>
          <p className="mt-0.5 text-sm text-gray-500">Gerencie o pagamento de comissões dos vendedores</p>
        </div>
      </div>
      <CommissionsClient commissions={commissions} sellers={sellers} />
    </div>
  )
}

async function fetchCommissions(token: string): Promise<Commission[]> {
  try {
    const res = await fetch(`${API}/api/commissions`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return []
    const json = await res.json()
    return (json.data ?? []) as Commission[]
  } catch { return [] }
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
  } catch { return [] }
}
