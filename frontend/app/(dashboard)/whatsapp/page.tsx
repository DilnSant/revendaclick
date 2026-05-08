import { notFound } from 'next/navigation'
import { getUserIdFromHeaders, getTenantForUser } from '@/lib/tenant'
import { createClient } from '@/lib/supabaseServer'
import WhatsAppManager from '@/components/whatsapp/WhatsAppManager'

export const metadata = { title: 'WhatsApp' }

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

export interface InstanceStatus {
  instance_name: string
  status: string
}

export default async function WhatsAppPage() {
  const userId = await getUserIdFromHeaders()
  if (!userId) notFound()

  const tenant = await getTenantForUser(userId)
  if (!tenant) notFound()

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token ?? ''

  const status = await fetchStatus(token)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-graphite">WhatsApp</h1>
        <p className="mt-0.5 text-sm text-gray-500">Conecte seu WhatsApp para receber leads automaticamente</p>
      </div>
      <WhatsAppManager initialStatus={status} tenantSlug={tenant.slug} />
    </div>
  )
}

async function fetchStatus(token: string): Promise<InstanceStatus> {
  const fallback: InstanceStatus = { instance_name: '', status: 'disconnected' }
  if (!token) return fallback
  try {
    const res = await fetch(`${API}/api/evolution/status`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return fallback
    const json = await res.json()
    return (json.data ?? fallback) as InstanceStatus
  } catch { return fallback }
}
