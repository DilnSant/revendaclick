import { notFound } from 'next/navigation'
import { getUserIdFromHeaders, getTenantForUser } from '@/lib/tenant'
import { getSubscription, getPlans } from '@/lib/billing'
import { formatCurrency } from '@/lib/billing-utils'
import type { Plan } from '@/lib/billing-utils'
import PlanCard from './_components/PlanCard'

export const metadata = { title: 'Planos — RevendaClick' }

export default async function PlansPage() {
  const userId = await getUserIdFromHeaders()
  if (!userId) notFound()

  const tenant = await getTenantForUser(userId)
  if (!tenant) notFound()

  const [sub, plans] = await Promise.all([getSubscription(), getPlans()])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-heading font-bold text-graphite">Planos</h1>
        <p className="mt-1 text-sm text-gray-500">
          Escolha o plano ideal para sua revenda. Cancele quando quiser.
        </p>
      </div>

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
