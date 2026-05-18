import Link from 'next/link'
import type { Subscription } from '@/lib/billing-utils'
import { formatDate } from '@/lib/billing-utils'

interface Props {
  sub: Subscription | null
}

export default function SubscriptionBanner({ sub }: Props) {
  if (!sub) return null

  if (sub.is_trialing && sub.trial_days_left != null) {
    if (sub.trial_days_left > 3) return null // Don't nag until 3 days left

    return (
      <div className="border-b border-blue-300 bg-blue-50 px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <p className="text-sm font-medium text-blue-800">
            Seu trial termina em <strong>{sub.trial_days_left} {sub.trial_days_left === 1 ? 'dia' : 'dias'}</strong>.
            {sub.asaas_payment_link ? ' Ative sua assinatura para não perder o acesso.' : ''}
          </p>
          <div className="flex shrink-0 gap-2">
            {sub.asaas_payment_link && (
              <a
                href={sub.asaas_payment_link}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Pagar agora
              </a>
            )}
            <Link
              href="/billing/plans"
              className="rounded-md border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
            >
              Ver planos
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (sub.is_past_due) {
    return (
      <div className="border-b border-orange-400 bg-orange-50 px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <p className="text-sm font-medium text-orange-800">
            Pagamento em atraso.{' '}
            {sub.grace_until ? `Período de carência até ${formatDate(sub.grace_until)}.` : ''}
            {' '}Regularize para manter acesso completo.
          </p>
          <div className="flex shrink-0 gap-2">
            {sub.asaas_payment_link && (
              <a
                href={sub.asaas_payment_link}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-700"
              >
                Pagar agora
              </a>
            )}
            <Link
              href="/billing"
              className="rounded-md border border-orange-300 bg-white px-3 py-1.5 text-xs font-semibold text-orange-700"
            >
              Gerenciar
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (sub.is_canceled) {
    return (
      <div className="border-b border-red-400 bg-red-50 px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <p className="text-sm font-medium text-red-800">
            Assinatura cancelada. Vendas e WhatsApp estão bloqueados.
          </p>
          <Link
            href="/billing/plans"
            className="shrink-0 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
          >
            Reativar
          </Link>
        </div>
      </div>
    )
  }

  return null
}
