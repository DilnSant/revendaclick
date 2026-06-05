import { notFound } from 'next/navigation'
import { getUserIdFromHeaders, getTenantForUser, getTenantById } from '@/lib/tenant'
import { createClient } from '@/lib/supabaseServer'
import type { User } from '@/lib/users'
import SettingsTabs from './_components/SettingsTabs'
import { getSubscription, getStoreContact } from './actions'
import type { SubscriptionData, StoreContactData } from './actions'

export const metadata = { title: 'Configurações' }

const API = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

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

  const [tenant, users, subscriptionResult, storeContactResult] = await Promise.all([
    getTenantById(tenantCtx.id),
    fetchUsers(token),
    getSubscription(),
    getStoreContact(),
  ])

  if (!tenant) notFound()

  const subscription: SubscriptionData | null = subscriptionResult.error ? null : subscriptionResult.data
  const storeContact: StoreContactData | null = storeContactResult.error ? null : storeContactResult.data

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
          cpf_cnpj:        tenant.cpf_cnpj ?? null,
          description:     tenant.description ?? null,
          seo_title:       tenant.seo_title ?? null,
          seo_description: tenant.seo_description ?? null,
          logo_url:        tenant.logo_url ?? null,
          theme:           (tenant.theme as { primary_color?: string } | null) ?? null,
          address:         (tenant.address as { city?: string; state?: string; street?: string } | null) ?? null,
        }}
        users={users}
        subscription={subscription}
        storeContact={storeContact}
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
