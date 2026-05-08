import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getUserIdFromHeaders, getTenantForUser } from '@/lib/tenant'
import { getInvoices } from '@/lib/billing'
import { invoiceStatusLabel, invoiceStatusColor, formatCurrency, formatDate } from '@/lib/billing-utils'
import type { Invoice } from '@/lib/billing-utils'

export const metadata = { title: 'Histórico de cobranças — RevendaClick' }

export default async function BillingHistoryPage() {
  const userId = await getUserIdFromHeaders()
  if (!userId) notFound()

  const tenant = await getTenantForUser(userId)
  if (!tenant) notFound()

  const invoices = await getInvoices()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-graphite">Histórico de cobranças</h1>
          <p className="mt-1 text-sm text-gray-500">Todos os seus pagamentos e faturas</p>
        </div>
        <Link
          href="/billing"
          className="text-sm text-primary hover:underline"
        >
          ← Voltar
        </Link>
      </div>

      {invoices.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500">Nenhuma fatura encontrada ainda.</p>
          <p className="mt-1 text-sm text-gray-400">
            Suas cobranças aparecerão aqui após o primeiro pagamento.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Vencimento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Descrição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(invoices as Invoice[]).map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                    {formatDate(inv.due_date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                    {inv.description || 'RevendaClick'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">
                    {formatCurrency(inv.value)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {billingTypeLabel(inv.billing_type)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${invoiceStatusColor(inv.status)}`}
                    >
                      {invoiceStatusLabel(inv.status)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {inv.invoice_url ? (
                      <a
                        href={inv.invoice_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Ver fatura
                      </a>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function billingTypeLabel(type?: string): string {
  const map: Record<string, string> = {
    BOLETO: 'Boleto',
    PIX: 'PIX',
    CREDIT_CARD: 'Cartão',
  }
  return type ? (map[type] ?? type) : '—'
}
