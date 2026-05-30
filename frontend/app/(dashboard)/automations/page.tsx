import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getUserIdFromHeaders, getTenantForUser, getUsageFromAPI } from '@/lib/tenant'
import { createClient } from '@/lib/supabaseServer'

export const metadata = { title: 'Automações' }

export default async function AutomationsPage() {
  const userId = await getUserIdFromHeaders()
  if (!userId) notFound()

  const tenant = await getTenantForUser(userId)
  if (!tenant) notFound()

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token ?? ''

  const usage = await getUsageFromAPI(token)
  if (!usage?.has_api_access) notFound()

  const hasWhatsApp = usage?.has_central_atendimento ?? false

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-graphite">Automações</h1>
        <p className="mt-0.5 text-sm text-gray-500">Automatize processos e integrações da sua loja</p>
      </div>

      {/* Em breve */}
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
          <svg className="h-7 w-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900">Em breve</h2>
        <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
          Automações de fluxo de trabalho, gatilhos por evento e integrações via API estão sendo desenvolvidas.
          Seu plano já inclui acesso assim que for lançado.
        </p>
      </div>

      {/* Add-on WhatsApp */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Automação via WhatsApp</h3>
            <p className="mt-0.5 text-sm text-gray-500">
              Disparo automático de mensagens, follow-up de leads e recuperação de clientes inativos.
              {hasWhatsApp
                ? ' Você já tem esse add-on ativo.'
                : ' Disponível como add-on — R$39/mês.'}
            </p>
          </div>
          {hasWhatsApp ? (
            <Link
              href="/whatsapp"
              className="shrink-0 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Abrir Central de Atendimento
            </Link>
          ) : (
            <Link
              href="/billing/addons"
              className="shrink-0 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Contratar add-on →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
