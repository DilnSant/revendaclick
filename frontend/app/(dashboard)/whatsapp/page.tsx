import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getUserIdFromHeaders, getTenantForUser, getUsageFromAPI } from '@/lib/tenant'
import { createClient } from '@/lib/supabaseServer'
import { getSubscription } from '@/lib/billing'
import WhatsAppManager from '@/components/whatsapp/WhatsAppManager'

export const metadata = { title: 'Automação de Atendimento WhatsApp' }

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

  const [sub, usage] = await Promise.all([getSubscription(), getUsageFromAPI(token)])

  // Gate via feature flag — covers plan features AND admin-granted tenant_features overrides
  const hasAccess = usage?.has_central_atendimento ?? false

  if (!hasAccess) {
    return <CentralAtendimentoGate planDisplay={sub?.plan_display ?? 'Starter'} />
  }

  const status = await fetchStatus(token)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-graphite">Automação de Atendimento WhatsApp</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Transforme conversas em oportunidades e evite perder clientes por falta de acompanhamento.
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
    'Todo contato via WhatsApp vira lead automaticamente',
    'Histórico completo de conversas no CRM',
    'Equipe acompanha cada oportunidade em um único lugar',
    'Menos clientes esquecidos por falta de acompanhamento',
    'Mais chances de conversão com atendimento organizado',
    'Sem perder vendas por troca de atendentes',
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-graphite">Automação de Atendimento WhatsApp</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Transforme conversas em oportunidades e evite perder clientes por falta de acompanhamento.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-8">
        <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-primary/8 to-primary/4 border-b border-primary/15 px-8 py-7 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/10">
              <svg className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Automação de Atendimento WhatsApp</h2>
            <p className="mt-1.5 text-sm text-gray-500">
              Disponível com o <strong className="text-gray-700">Plano Premium</strong> ou Recurso Automação WhatsApp
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
              O que você ganha:
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

          {/* Why section */}
          <div className="px-8 pb-6 space-y-3">
            <p className="text-sm font-semibold text-gray-700">Por que ativar a Automação WhatsApp?</p>
            <p className="text-sm text-gray-500 leading-relaxed">
              Muitos clientes entram em contato e acabam ficando sem acompanhamento adequado.
              Com a Automação WhatsApp do RevendaClick, cada conversa é registrada automaticamente,
              permitindo que sua equipe acompanhe todas as oportunidades em um único lugar.
              Evite perder vendas por esquecimento, falta de organização ou troca de atendentes.
            </p>
            <div className="rounded-xl bg-green-50 border border-green-100 px-5 py-4 text-center">
              <p className="text-sm font-semibold text-green-800">
                Menos oportunidades perdidas.
                <br />Mais controle do atendimento.
                <br />Mais vendas.
              </p>
            </div>
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
