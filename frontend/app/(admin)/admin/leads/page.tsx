import Link from 'next/link'
import { createServiceClient } from '@/lib/supabaseServer'
import { LeadStatusBadge } from './_components/LeadStatusBadge'
import { QuickStatusForm } from './_components/QuickStatusForm'

export const metadata = { title: 'Leads Landing — Admin RevendaClick' }
export const revalidate = 0

const PAGE_SIZE = 25

const STATUS_TABS = [
  { key: 'todos',          label: 'Todos'          },
  { key: 'novo',           label: 'Novos'          },
  { key: 'contatado',      label: 'Contatados'     },
  { key: 'em_negociacao',  label: 'Em negociação'  },
  { key: 'convertido',     label: 'Convertidos'    },
  { key: 'perdido',        label: 'Perdidos'       },
] as const

interface Lead {
  id: string
  name: string
  phone: string
  city: string | null
  state: string | null
  vehicles_count: string | null
  utm_source: string | null
  utm_campaign: string | null
  status: string
  next_action: string | null
  last_contact_at: string | null
  created_at: string
}

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string }>
}

export default async function AdminLeadsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const activeStatus = params.status ?? 'todos'
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = createServiceClient()

  // Leads sem contato há mais de 4h para alerta
  // eslint-disable-next-line react-hooks/purity
  const alertCutoff = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
  const { count: alertCount } = await supabase
    .from('landing_leads')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'novo')
    .lt('created_at', alertCutoff)

  let query = supabase
    .from('landing_leads')
    .select(
      'id, name, phone, city, state, vehicles_count, utm_source, utm_campaign, status, next_action, last_contact_at, created_at',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, to)

  if (activeStatus !== 'todos') {
    query = query.eq('status', activeStatus)
  }

  const { data: leads, error, count } = await query

  if (error) {
    return (
      <div className="rounded-xl border border-red-800 bg-red-900/20 p-6 text-sm text-red-400">
        Erro ao carregar leads: {error.message}
      </div>
    )
  }

  const rows = (leads ?? []) as Lead[]
  const total = count ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  function pageUrl(p: number) {
    const q = new URLSearchParams()
    if (activeStatus !== 'todos') q.set('status', activeStatus)
    if (p > 1) q.set('page', String(p))
    const qs = q.toString()
    return `/admin/leads${qs ? `?${qs}` : ''}`
  }

  function statusUrl(s: string) {
    const q = new URLSearchParams()
    if (s !== 'todos') q.set('status', s)
    const qs = q.toString()
    return `/admin/leads${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Leads Landing</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {total} lead{total !== 1 ? 's' : ''}
            {activeStatus !== 'todos' ? ` · ${STATUS_TABS.find(t => t.key === activeStatus)?.label ?? activeStatus}` : ' no total'}
          </p>
        </div>
      </div>

      {/* Alerta: leads novos sem contato */}
      {(alertCount ?? 0) > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-yellow-700/50 bg-yellow-900/20 px-4 py-3">
          <span className="mt-0.5 text-yellow-400">⚠</span>
          <div className="text-sm">
            <span className="font-semibold text-yellow-300">
              {alertCount} lead{(alertCount ?? 0) !== 1 ? 's' : ''} sem contato há mais de 4h
            </span>
            <span className="text-yellow-500"> · </span>
            <Link href={statusUrl('novo')} className="text-yellow-400 underline hover:text-yellow-200">
              Ver novos
            </Link>
          </div>
        </div>
      )}

      {/* Status tabs */}
      <div className="flex flex-wrap gap-1">
        {STATUS_TABS.map((tab) => {
          const active = activeStatus === tab.key
          return (
            <Link
              key={tab.key}
              href={statusUrl(tab.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? 'bg-primary text-white'
                  : 'bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-10 text-center text-sm text-gray-600">
          Nenhum lead{activeStatus !== 'todos' ? ` com status "${activeStatus}"` : ''}.
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-gray-800">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-900/80 text-left">
                    {['Nome', 'Telefone', 'Cidade', 'UF', 'Estoque', 'Campanha', 'Status', 'Próxima ação', 'Recebido', ''].map((h) => (
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
                    <tr key={lead.id} className="transition-colors hover:bg-gray-900/40">
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-200">
                        <Link href={`/admin/leads/${lead.id}`} className="hover:text-white hover:underline">
                          {lead.name}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-400">
                        {formatPhone(lead.phone)}
                      </td>
                      <td className="px-4 py-3 text-gray-400">{lead.city ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-400">{lead.state ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-400">{lead.vehicles_count ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {lead.utm_campaign ?? lead.utm_source ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <LeadStatusBadge status={lead.status} />
                      </td>
                      <td className="max-w-[180px] truncate px-4 py-3 text-xs text-gray-500" title={lead.next_action ?? ''}>
                        {lead.next_action ?? '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-600">
                        {formatDate(lead.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <QuickStatusForm
                          id={lead.id}
                          currentStatus={lead.status as import('./actions').LeadStatus}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Página {page} de {totalPages}</span>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={pageUrl(page - 1)}
                    className="rounded-lg bg-gray-900 px-3 py-1.5 font-medium hover:bg-gray-800 hover:text-gray-200"
                  >
                    ← Anterior
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={pageUrl(page + 1)}
                    className="rounded-lg bg-gray-900 px-3 py-1.5 font-medium hover:bg-gray-800 hover:text-gray-200"
                  >
                    Próxima →
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
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
