import { notFound } from 'next/navigation'
import { getUserIdFromHeaders, getTenantForUser } from '@/lib/tenant'
import { createClient } from '@/lib/supabaseServer'
import AddonsClient from './_components/AddonsClient'

export const metadata = { title: 'Add-ons — RevendaClick' }

const API =
  process.env.INTERNAL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:8080'
const BASE = API.startsWith('http') ? API : `https://${API}`

async function getAddons(token: string) {
  try {
    const res = await fetch(`${BASE}/api/billing/addons`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return { available: [], active: [] }
    const env = await res.json()
    return env.data ?? { available: [], active: [] }
  } catch {
    return { available: [], active: [] }
  }
}

export default async function AddonsPage() {
  const userId = await getUserIdFromHeaders()
  if (!userId) notFound()

  const tenant = await getTenantForUser(userId)
  if (!tenant) notFound()

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) notFound()

  const addons = await getAddons(session.access_token)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-heading font-bold text-graphite">Add-ons</h1>
        <p className="mt-1 text-sm text-gray-500">
          Expanda sua assinatura com recursos adicionais. Ative ou cancele a qualquer momento.
        </p>
      </div>
      <AddonsClient available={addons.available ?? []} active={addons.active ?? []} />
    </div>
  )
}
