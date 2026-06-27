import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getUserIdFromHeaders, getTenantForUser } from '@/lib/tenant'
import { createClient } from '@/lib/supabaseServer'
import StoreActions from './_components/StoreActions'
import StoreMetrics from './_components/StoreMetrics'

export const metadata = { title: 'Página da Loja' }
export const dynamic = 'force-dynamic'

const API = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

interface ChecklistData {
  published_store: boolean
  received_first_lead: boolean
}

interface LeadList { data?: Array<{ id: string; created_at: string }> }

export default async function StorePage() {
  const userId = await getUserIdFromHeaders()
  if (!userId) notFound()

  const tenant = await getTenantForUser(userId)
  if (!tenant) notFound()

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token ?? ''

  // Fetch checklist + leads (for metrics) + public contact existence in parallel
  const [checklistRes, leadsRes, contactRes] = await Promise.all([
    fetch(`${API}/api/onboarding`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    }).then(r => r.ok ? r.json() : null).catch(() => null),

    fetch(`${API}/api/leads?limit=500`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    }).then(r => r.ok ? r.json() as LeadList : { data: [] }).catch(() => ({ data: [] })),

    fetch(`${API}/api/store-contact`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    }).then(r => r.ok ? r.json() : null).catch(() => null),
  ])

  const checklist: ChecklistData | null = checklistRes?.data ?? null
  const published = checklist?.published_store === true
  const leads = leadsRes.data ?? []

  const publicUrl = `app.revendaclick.com.br/${tenant.slug}`
  const fullUrl = `https://${publicUrl}`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-heading font-bold text-graphite">Página da Loja</h1>
            {published ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-2.5 py-1 text-[11px] font-semibold text-green-700">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Publicada
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Não publicada
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Sua vitrine pública com SEO automático. Compartilhe com clientes para receber leads.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/${tenant.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="store-open-external"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Ver Minha Loja
          </Link>
          <Link
            href="/settings?tab=contact"
            data-testid="store-edit"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
            Editar Loja
          </Link>
        </div>
      </div>

      {/* CTA: not published */}
      {!published && (
        <div
          data-testid="store-cta-not-published"
          className="rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <h2 className="text-base font-semibold text-amber-900">Sua Página da Loja ainda não está publicada.</h2>
              </div>
              <p className="mt-2 text-sm text-amber-800">
                Configure o contato público (WhatsApp, endereço, horário) para que sua loja apareça para visitantes.
                A vitrine já existe, mas só fica visível para o público após esta etapa.
              </p>
            </div>
            <Link
              href="/settings?tab=contact"
              data-testid="store-configure-now"
              className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 transition-colors"
            >
              Configurar Agora
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      )}

      {/* URL pública + ações */}
      <StoreActions slug={tenant.slug} publicUrl={publicUrl} fullUrl={fullUrl} />

      {/* Métricas */}
      <StoreMetrics
        published={published}
        leadsCount={leads.length}
        hasFirstLead={checklist?.received_first_lead === true}
      />

      {/* Dicas */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">Como divulgar sua loja</h2>
        <ul className="mt-3 space-y-2 text-sm text-gray-600">
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            Compartilhe o link <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">{publicUrl}</code> no Instagram e Facebook da sua revenda.
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            Coloque o link na bio do WhatsApp Business.
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            Envie para sua base de clientes por WhatsApp com uma mensagem personalizada.
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            Cada lead gerado pela vitrine aparece automaticamente em <Link href="/leads" className="font-medium text-primary hover:underline">Interessados</Link>.
          </li>
        </ul>
      </div>
    </div>
  )
}