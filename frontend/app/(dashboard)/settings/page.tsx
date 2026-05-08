import { notFound } from 'next/navigation'
import { getUserIdFromHeaders, getTenantForUser, getTenantById } from '@/lib/tenant'
import { createClient } from '@/lib/supabaseServer'
import type { User } from '@/lib/users'
import SettingsTabs from './_components/SettingsTabs'
import { getSubscription } from './actions'
import type { SubscriptionData } from './actions'

export const metadata = { title: 'Configurações' }

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

interface Props {
  searchParams: Promise<{ tab?: string }>
}

export default async function SettingsPage({ searchParams }: Props) {
  const query = await searchParams
  const tab   = query.tab ?? 'store'

  const userId = await getUserIdFromHeaders()
  if (!userId) notFound()

  const tenantCtx = await getTenantForUser(userId)
  if (!tenantCtx) notFound()

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token ?? ''

  const [tenant, users, subscriptionResult] = await Promise.all([
    getTenantById(tenantCtx.id),
    fetchUsers(token),
    getSubscription(),
  ])

  if (!tenant) notFound()

  const subscription: SubscriptionData | null = subscriptionResult.error ? null : subscriptionResult.data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-graphite">Configurações</h1>
        <p className="mt-0.5 text-sm text-gray-500">{tenant.name}</p>
      </div>

      <SettingsTabs
        tab={tab}
        tenant={{
          id:              tenant.id,
          slug:            tenant.slug,
          name:            tenant.name,
          email:           tenant.email,
          phone_whatsapp:  tenant.phone_whatsapp,
          description:     tenant.description ?? null,
          seo_title:       tenant.seo_title ?? null,
          seo_description: tenant.seo_description ?? null,
        }}
        users={users}
        subscription={subscription}
      />
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
