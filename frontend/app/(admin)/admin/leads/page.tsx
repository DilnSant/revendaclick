import { createServiceClient } from '@/lib/supabaseServer'

export const metadata = { title: 'Leads Landing — Admin RevendaClick' }
export const revalidate = 0

interface Lead {
  id: string
  name: string
  phone: string
  city: string | null
  state: string | null
  vehicles_count: string | null
  source: string
  utm_source: string | null
  utm_campaign: string | null
  created_at: string
}

export default async function AdminLeadsPage() {
  const supabase = createServiceClient()

  const { data: leads, error } = await supabase
    .from('landing_leads')
    .select('id, name, phone, city, state, vehicles_count, source, utm_source, utm_campaign, created_at')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    return (
      <div className="rounded-xl border border-red-800 bg-red-900/20 p-6 text-sm text-red-400">
        Erro ao carregar leads: {error.message}
      </div>
    )
  }

  const rows = (leads ?? []) as Lead[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Leads Landing</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {rows.length} lead{rows.length !== 1 ? 's' : ''} capturado{rows.length !== 1 ? 's' : ''}
            {rows.length === 200 ? ' (exibindo últimos 200)' : ''}
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-10 text-center text-sm text-gray-600">
          Nenhum lead capturado ainda.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-800">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/80 text-left">
                  {['Nome', 'Telefone', 'Cidade', 'UF', 'Estoque', 'Origem', 'Campanha', 'Data'].map((h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {rows.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-900/40 transition-colors">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-200">
                      {lead.name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-400">
                      {formatPhone(lead.phone)}
                    </td>
                    <td className="px-4 py-3 text-gray-400">{lead.city ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{lead.state ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{lead.vehicles_count ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-gray-800 px-2 py-0.5 text-[11px] font-medium text-gray-400">
                        {lead.utm_source ?? lead.source}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{lead.utm_campaign ?? '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-600">
                      {formatDate(lead.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, '')
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return phone
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}
