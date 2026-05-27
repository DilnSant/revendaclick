import { notFound } from 'next/navigation'
import { getUserIdFromHeaders, getTenantForUser } from '@/lib/tenant'
import { getSubscription, getPlans } from '@/lib/billing'
import { formatCurrency } from '@/lib/billing-utils'
import type { Plan } from '@/lib/billing-utils'
import PlanCard from './_components/PlanCard'
import type { Subscription } from '@/lib/billing-utils'

export const metadata = { title: 'Planos — RevendaClick' }

export default async function PlansPage() {
  const userId = await getUserIdFromHeaders()
  if (!userId) notFound()

  const tenant = await getTenantForUser(userId)
  if (!tenant) notFound()

  const [sub, plans] = await Promise.all([getSubscription(), getPlans()])

  const STATUS_LABEL: Record<string, string> = {
    active: 'Ativo', trialing: 'Trial', past_due: 'Em atraso',
    canceled: 'Cancelado', paused: 'Pausado',
  }
  const STATUS_COLOR: Record<string, string> = {
    active: 'bg-green-100 text-green-700', trialing: 'bg-blue-100 text-blue-700',
    past_due: 'bg-orange-100 text-orange-700', canceled: 'bg-red-100 text-red-700',
    paused: 'bg-gray-100 text-gray-700',
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-heading font-bold text-graphite">Planos</h1>
        <p className="mt-1 text-sm text-gray-500">
          Escolha o plano ideal para sua revenda. Cancele quando quiser.
        </p>
      </div>

      {/* Current subscription summary */}
      {sub && (
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold text-gray-900">
              Plano atual: <span className="text-gray-700">{sub.plan_display}</span>
            </p>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[sub.status] ?? STATUS_COLOR.canceled}`}>
              {STATUS_LABEL[sub.status] ?? sub.status}
            </span>
            {sub.is_trialing && sub.trial_days_left != null && (
              <span className="text-xs text-blue-600 font-medium">
                {sub.trial_days_left} dia{sub.trial_days_left !== 1 ? 's' : ''} de trial restante{sub.trial_days_left !== 1 ? 's' : ''}
              </span>
            )}
            {!sub.is_trialing && sub.current_period_end && (
              <span className="text-xs text-gray-500">
                Renova em {new Date(sub.current_period_end).toLocaleDateString('pt-BR')}
              </span>
            )}
            {sub.is_trialing && sub.trial_ends_at && (
              <span className="text-xs text-gray-500">
                Trial até {new Date(sub.trial_ends_at).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>
        </div>
      )}

      {plans.length === 0 ? (
        <p className="text-gray-500">Erro ao carregar planos. Tente novamente.</p>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {(plans as Plan[]).map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                currentPlanName={sub?.plan_name}
                currentCycle={sub?.billing_cycle ?? 'monthly'}
                subscription={sub as Subscription | null}
              />
            ))}
          </div>

          <div className="rounded-xl bg-gray-50 border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Comparativo de recursos</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-2 text-left font-medium text-gray-500">Recurso</th>
                    {(plans as Plan[]).map((p) => (
                      <th key={p.id} className="pb-2 text-center font-medium text-gray-700">
                        {p.display_name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <FeatureRow label="Veículos" values={(plans as Plan[]).map((p) => fmt(p.max_vehicles))} />
                  <FeatureRow label="Usuários" values={(plans as Plan[]).map((p) => fmt(p.max_users))} />
                  <FeatureRow label="Leads/mês" values={(plans as Plan[]).map((p) => fmt(p.max_leads))} />
                  <FeatureRow label="CRM" values={(plans as Plan[]).map((p) => hasFeature(p.features, 'crm'))} />
                  <FeatureRow label="Kanban" values={(plans as Plan[]).map((p) => hasFeature(p.features, 'kanban'))} />
                  <FeatureRow label="Domínio custom" values={(plans as Plan[]).map((p) => hasFeature(p.features, 'custom_domain'))} />
                  <FeatureRow label="Analytics" values={(plans as Plan[]).map((p) => hasFeature(p.features, 'analytics'))} />
                  <FeatureRow label="Suporte prioritário" values={(plans as Plan[]).map((p) => hasFeature(p.features, 'priority_support'))} />
                  <FeatureRow label="Acesso API" values={(plans as Plan[]).map((p) => hasFeature(p.features, 'api_access'))} />
                  <tr>
                    <td className="py-2 pr-4 text-gray-500">Valor mensal</td>
                    {(plans as Plan[]).map((p) => (
                      <td key={p.id} className="py-2 text-center font-semibold text-gray-900">
                        {formatCurrency(p.price_monthly)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function fmt(n: number): string {
  return n === -1 ? 'Ilimitado' : String(n)
}

function hasFeature(features: string[], key: string): string {
  return features.includes(key) ? '✓' : '—'
}

function FeatureRow({ label, values }: { label: string; values: string[] }) {
  return (
    <tr>
      <td className="py-2 pr-4 text-gray-500">{label}</td>
      {values.map((v, i) => (
        <td key={i} className={`py-2 text-center ${v === '✓' ? 'text-green-600 font-semibold' : 'text-gray-400'}`}>
          {v}
        </td>
      ))}
    </tr>
  )
}
