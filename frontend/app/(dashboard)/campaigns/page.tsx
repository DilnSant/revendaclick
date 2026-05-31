import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getUserIdFromHeaders, getTenantForUser, getUsageFromAPI } from '@/lib/tenant'
import { createClient } from '@/lib/supabaseServer'

export const metadata = { title: 'Campanhas' }

export default async function CampaignsPage() {
  const userId = await getUserIdFromHeaders()
  if (!userId) notFound()

  const tenant = await getTenantForUser(userId)
  if (!tenant) notFound()

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token ?? ''

  const usage = await getUsageFromAPI(token)
  if (!usage?.has_campaigns) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-graphite">Campanhas</h1>
        <p className="mt-0.5 text-sm text-gray-500">Crie e gerencie campanhas de marketing para sua loja</p>
      </div>

      {/* Em breve */}
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
          <svg className="h-7 w-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900">Em breve</h2>
        <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
          Criação de campanhas, segmentação de audiência e acompanhamento de resultados estão em desenvolvimento.
          Seu plano já inclui acesso assim que for lançado.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/analytics"
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Ver Analytics
          </Link>
          <Link
            href="/crm"
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Gerenciar Leads
          </Link>
        </div>
      </div>
    </div>
  )
}
