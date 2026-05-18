import { notFound } from 'next/navigation'
import { getUserIdFromHeaders, getTenantForUser } from '@/lib/tenant'
import { createClient } from '@/lib/supabaseServer'
import type { User } from '@/lib/users'
import VendorsClient from './_components/VendorsClient'

export const metadata = { title: 'Vendedores' }

const API = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

export default async function VendorsPage() {
  const userId = await getUserIdFromHeaders()
  if (!userId) notFound()

  const tenant = await getTenantForUser(userId)
  if (!tenant) notFound()

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token ?? ''

  const users = await fetchUsers(token)

  return (
    <div className="space-y-6">
      <VendorsClient users={users} currentUserId={userId} />
    </div>
  )
}

async function fetchUsers(token: string): Promise<User[]> {
  if (!token) return []
  try {
    const res = await fetch(`${API}/api/users`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return []
    const json = await res.json()
    return (json.data ?? []) as User[]
  } catch {
    return []
  }
}
