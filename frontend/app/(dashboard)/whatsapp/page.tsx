import { notFound } from 'next/navigation'
import { getUserIdFromHeaders, getTenantForUser } from '@/lib/tenant'
import { createClient } from '@/lib/supabaseServer'
import WhatsAppManager from '@/components/whatsapp/WhatsAppManager'

export const metadata = { title: 'Central de Atendimento' }

const API = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

export interface InstanceStatus {
  instance_name: string
  status: string
}

export default async function AttendanceCenterPage() {
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
        <h1 className="text-2xl font-heading font-bold text-graphite">Central de Atendimento</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Conecte seu canal de atendimento para receber e gerenciar leads automaticamente no CRM
        </p>
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
