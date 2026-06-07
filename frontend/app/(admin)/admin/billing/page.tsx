import { createServiceClient } from '@/lib/supabaseServer'

export const metadata = { title: 'Billing — Admin RevendaClick' }

const STATUS_COLOR: Record<string, string> = {
  RECEIVED:           'bg-green-900/40 text-green-400 border-green-800',
  CONFIRMED:          'bg-green-900/40 text-green-400 border-green-800',
  PENDING:            'bg-yellow-900/40 text-yellow-400 border-yellow-800',
  OVERDUE:            'bg-red-900/40 text-red-400 border-red-800',
  REFUNDED:           'bg-purple-900/40 text-purple-400 border-purple-800',
  REFUND_REQUESTED:   'bg-purple-900/40 text-purple-300 border-purple-800',
  CHARGEBACK_DISPUTE: 'bg-orange-900/40 text-orange-400 border-orange-800',
  DUNNING_REQUESTED:  'bg-orange-900/40 text-orange-300 border-orange-700',
  DUNNING_RECEIVED:   'bg-orange-900/40 text-orange-300 border-orange-700',
}

export default async function AdminBillingPage() {
  const db = createServiceClient()

  const { data: invoices } = await db
    .from('billing_invoices')
    .select(`
      id, value, status, billing_type, due_date, paid_at, description, created_at,
      tenants!inner(slug, name)
    `)
    .order('created_at', { ascending: false })
    .limit(200)

  const rows = (invoices ?? []) as Array<{
    id: string
    value: number
    status: string
    billing_type: string
    due_date: string | null
    paid_at: string | null
    description: string | null
    created_at: string
    tenants: { slug: string; name: string }
  }>

  const paid = rows.filter(i => i.status === 'RECEIVED' || i.status === 'CONFIRMED')
  const pending = rows.filter(i => i.status === 'PENDING')
  const overdue = rows.filter(i => i.status === 'OVERDUE')

  const totalReceived = paid.reduce((s, i) => s + Number(i.value), 0)
  const totalPending  = pending.reduce((s, i) => s + Number(i.value), 0)
  const totalOverdue  = overdue.reduce((s, i) => s + Number(i.value), 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-white">Billing</h1>
        <p className="mt-0.5 text-sm text-gray-500">Faturas e pagamentos da plataforma</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total faturas" value={rows.length} />
        <StatCard label="Pagas" value={paid.length} color="text-green-400" />
        <StatCard label="Pendentes" value={pending.length} color="text-yellow-400" />
        <StatCard label="Inadimplentes" value={overdue.length} color="text-red-400" />
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">Recebido</p>
          <p className="mt-1.5 text-xl font-bold text-green-400">
            {totalReceived.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">Inadimpl.</p>
          <p className="mt-1.5 text-xl font-bold text-red-400">
            {totalOverdue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800 bg-gray-900/60">
          <h2 className="text-sm font-semibold text-gray-300">Últimas {rows.length} faturas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/80 text-left">
                {['Tenant', 'Valor', 'Status', 'Tipo', 'Vencimento', 'Pago em', 'Descrição'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {rows.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-900/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-200 whitespace-nowrap">{inv.tenants?.name ?? '—'}</p>
                    <p className="text-xs text-gray-600">{inv.tenants?.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-200 whitespace-nowrap">
                    {Number(inv.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${STATUS_COLOR[inv.status] ?? 'bg-gray-800 text-gray-500 border-gray-700'}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{inv.billing_type ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                    {inv.due_date ? new Date(inv.due_date).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                    {inv.paid_at ? new Date(inv.paid_at).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate">
                    {inv.description ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-700">Nenhuma fatura encontrada.</div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">{label}</p>
      <p className={`mt-1.5 text-3xl font-bold ${color ?? 'text-white'}`}>{value}</p>
    </div>
  )
}
