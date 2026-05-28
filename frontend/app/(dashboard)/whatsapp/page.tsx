import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getUserIdFromHeaders, getTenantForUser } from '@/lib/tenant'
import { createClient } from '@/lib/supabaseServer'
import { getSubscription } from '@/lib/billing'
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

  const sub = await getSubscription()

  // Central de Atendimento requer plano Pro ou superior (feature "central_atendimento")
  const planName = sub?.plan_name ?? 'start'
  const hasAccess = planName !== 'start'

  if (!hasAccess) {
    return <CentralAtendimentoGate planDisplay={sub?.plan_display ?? 'Start'} />
  }

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

function CentralAtendimentoGate({ planDisplay }: { planDisplay: string }) {
  const benefits = [
    'WhatsApp conectado via QR Code — em segundos',
    'Leads criados automaticamente ao receber mensagens',
    'CRM completo com kanban e linha do tempo',
    'Analytics avançado de atendimento',
    'Histórico completo de conversas',
    'Resposta rápida com templates',
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-graphite">Central de Atendimento</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Conecte seu canal de atendimento para receber e gerenciar leads automaticamente no CRM
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-8">
        <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-primary/8 to-primary/4 border-b border-primary/15 px-8 py-7 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/10">
              <svg className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Central de Atendimento</h2>
            <p className="mt-1.5 text-sm text-gray-500">
              Disponível a partir do <strong className="text-gray-700">Plano Pro</strong>
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Seu plano atual: {planDisplay}
            </div>
          </div>

          {/* Benefits */}
          <div className="px-8 py-6">
            <p className="mb-4 text-sm font-semibold text-gray-700">
              O que você ganha no Plano Pro:
            </p>
            <ul className="space-y-3">
              {benefits.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100">
                    <svg className="h-3 w-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-600">{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <div className="border-t border-gray-100 bg-gray-50 px-8 py-5 text-center">
            <p className="mb-4 text-sm text-gray-500">
              A partir de <span className="font-bold text-gray-900">R$ 197/mês</span>
              <span className="ml-1.5 text-xs text-green-600 font-medium">(7 dias grátis)</span>
            </p>
            <Link
              href="/billing/plans"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              Ver planos e fazer upgrade
            </Link>
            <p className="mt-3 text-xs text-gray-400">Cancele quando quiser. Sem taxas ocultas.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
