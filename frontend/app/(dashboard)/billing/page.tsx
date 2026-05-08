import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getUserIdFromHeaders, getTenantForUser } from '@/lib/tenant'
import { getSubscription } from '@/lib/billing'
import { statusLabel, statusColor, formatCurrency, formatDate } from '@/lib/billing-utils'

export const metadata = { title: 'Assinatura — RevendaClick' }

export default async function BillingPage() {
  const userId = await getUserIdFromHeaders()
  if (!userId) notFound()

  const tenant = await getTenantForUser(userId)
  if (!tenant) notFound()

  const sub = await getSubscription()

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-graphite">Assinatura</h1>
          <p className="mt-1 text-sm text-gray-500">Gerencie seu plano e pagamentos</p>
        </div>
        <Link
          href="/billing/plans"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
        >
          Ver planos
        </Link>
      </div>

      {!sub ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500">Nenhuma assinatura encontrada.</p>
          <Link
            href="/billing/plans"
            className="mt-4 inline-block rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-white"
          >
            Assinar agora
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Status card */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Status da assinatura</h2>
            <dl className="space-y-3">
              <Row label="Plano">
                <span className="font-semibold">{sub.plan_display}</span>
              </Row>
              <Row label="Status">
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor(sub.status)}`}>
                  {statusLabel(sub.status)}
                </span>
              </Row>
              <Row label="Ciclo">
                {sub.billing_cycle === 'yearly' ? 'Anual' : 'Mensal'}
              </Row>
              {sub.is_trialing && sub.trial_days_left != null && (
                <Row label="Trial">
                  <span className="font-semibold text-blue-600">
                    {sub.trial_days_left} {sub.trial_days_left === 1 ? 'dia restante' : 'dias restantes'}
                  </span>
                </Row>
              )}
              <Row label={sub.is_trialing ? 'Trial termina em' : 'Próximo vencimento'}>
                {formatDate(sub.is_trialing ? sub.trial_ends_at : sub.current_period_end)}
              </Row>
              <Row label="Valor mensal">
                {formatCurrency(sub.price_monthly)}
              </Row>
              <Row label="Valor anual">
                {formatCurrency(sub.price_yearly)}
                <span className="ml-1 text-xs text-green-600">(-17%)</span>
              </Row>
            </dl>
          </div>

          {/* Actions card */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Ações</h2>
            <div className="space-y-3">
              {sub.asaas_payment_link && (sub.is_trialing || sub.is_past_due) && (
                <a
                  href={sub.asaas_payment_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700"
                >
                  Pagar agora
                </a>
              )}

              <Link
                href="/billing/plans"
                className="flex w-full items-center justify-center rounded-lg border border-primary bg-white px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/5"
              >
                {sub.is_canceled ? 'Reativar assinatura' : 'Trocar de plano'}
              </Link>

              <Link
                href="/billing/history"
                className="flex w-full items-center justify-center rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50"
              >
                Ver histórico de cobranças
              </Link>

              {(sub.is_active || sub.is_trialing || sub.is_past_due) && (
                <CancelButton />
              )}
            </div>

            {sub.is_past_due && (
              <div className="mt-4 rounded-lg bg-orange-50 border border-orange-200 p-3 text-sm text-orange-700">
                Seu pagamento está atrasado. Clique em <strong>Pagar agora</strong> para regularizar e manter o acesso.
              </div>
            )}

            {sub.grace_until && sub.is_past_due && (
              <p className="mt-2 text-xs text-gray-500">
                Período de carência até {formatDate(sub.grace_until)}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0 last:pb-0">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900">{children}</dd>
    </div>
  )
}

// Client component for cancel action
function CancelButton() {
  return (
    <form action="/api/billing/cancel-action" method="POST">
      <Link
        href="/billing/plans"
        className="flex w-full items-center justify-center rounded-lg border border-red-200 px-4 py-3 text-sm text-red-600 hover:bg-red-50"
      >
        Cancelar assinatura
      </Link>
    </form>
  )
}
