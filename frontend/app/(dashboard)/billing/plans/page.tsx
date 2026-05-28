import { notFound } from 'next/navigation'
import { getUserIdFromHeaders, getTenantForUser } from '@/lib/tenant'
import { getSubscription, getPlans, statusLabel, statusColor } from '@/lib/billing'
import type { Plan, Subscription } from '@/lib/billing-utils'
import PlansGrid from './_components/PlansGrid'

export const metadata = { title: 'Planos — RevendaClick' }

export default async function PlansPage() {
  const userId = await getUserIdFromHeaders()
  if (!userId) notFound()

  const tenant = await getTenantForUser(userId)
  if (!tenant) notFound()

  const [sub, plans] = await Promise.all([getSubscription(), getPlans()])

  return (
    <div className="space-y-10">
      {/* Page header */}
      <div className="text-center">
        <h1 className="text-3xl font-heading font-bold text-graphite">Escolha seu plano</h1>
        <p className="mt-2 text-sm text-gray-500">
          Planos flexíveis para cada etapa da sua revenda. Cancele quando quiser.
        </p>
      </div>

      {/* Current subscription summary */}
      {sub && (
        <div className="mx-auto max-w-lg rounded-xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-medium text-gray-500">Plano atual</span>
              <span className="text-sm font-bold text-gray-900">{sub.plan_display}</span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(sub.status)}`}
              >
                {statusLabel(sub.status)}
              </span>
            </div>
            <div className="text-xs text-gray-400">
              {sub.is_trialing && sub.trial_days_left != null && (
                <span className="font-medium text-blue-600">
                  {sub.trial_days_left} dia{sub.trial_days_left !== 1 ? 's' : ''} de trial
                </span>
              )}
              {!sub.is_trialing && sub.current_period_end && (
                <span>
                  Renova em {new Date(sub.current_period_end).toLocaleDateString('pt-BR')}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {plans.length === 0 ? (
        <p className="text-center text-gray-500">Erro ao carregar planos. Tente novamente.</p>
      ) : (
        <PlansGrid
          plans={plans as Plan[]}
          subscription={sub as Subscription | null}
        />
      )}

      {/* Full comparison table */}
      {plans.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h3 className="text-sm font-semibold text-gray-900">Comparativo completo de recursos</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="py-3 pl-6 pr-4 text-left text-xs font-medium text-gray-500 w-52">
                    Recurso
                  </th>
                  {(plans as Plan[]).map((p) => (
                    <th
                      key={p.id}
                      className={`py-3 px-4 text-center text-xs font-semibold ${
                        p.name === 'pro' ? 'text-primary' : 'text-gray-700'
                      }`}
                    >
                      {p.display_name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                <SectionRow label="LIMITES" colSpan={(plans as Plan[]).length + 1} />
                <ValueRow
                  label="Veículos"
                  values={(plans as Plan[]).map((p) => fmtLimit(p.max_vehicles))}
                  plans={plans as Plan[]}
                />
                <ValueRow
                  label="Usuários"
                  values={(plans as Plan[]).map((p) => fmtLimit(p.max_users))}
                  plans={plans as Plan[]}
                />
                <ValueRow
                  label="Leads / mês"
                  values={(plans as Plan[]).map((p) => fmtLimit(p.max_leads))}
                  plans={plans as Plan[]}
                />

                <SectionRow label="LOJA & MARKETPLACE" colSpan={(plans as Plan[]).length + 1} />
                <BoolRow label="Marketplace público" feat="marketplace" plans={plans as Plan[]} />
                <BoolRow label="Botão WhatsApp na loja" feat="whatsapp_button" plans={plans as Plan[]} />
                <BoolRow label="Captura de leads" feat="lead_capture" plans={plans as Plan[]} />

                <SectionRow label="CENTRAL DE ATENDIMENTO" colSpan={(plans as Plan[]).length + 1} />
                <BoolRow label="WhatsApp operacional (QR)" feat="central_atendimento" plans={plans as Plan[]} />
                <BoolRow label="CRM completo" feat="crm" plans={plans as Plan[]} />
                <BoolRow label="Kanban de leads" feat="kanban" plans={plans as Plan[]} />
                <BoolRow label="Analytics avançado" feat="analytics" plans={plans as Plan[]} />

                <SectionRow label="IA & AUTOMAÇÃO" colSpan={(plans as Plan[]).length + 1} />
                <BoolRow label="IA: sugestão de resposta" feat="ai_suggest_reply" plans={plans as Plan[]} />
                <BoolRow label="IA: classificação de lead" feat="ai_classify_lead" plans={plans as Plan[]} />

                <SectionRow label="ENTERPRISE" colSpan={(plans as Plan[]).length + 1} />
                <BoolRow label="Suporte prioritário" feat="priority_support" plans={plans as Plan[]} />
                <BoolRow label="Acesso à API REST" feat="api_access" plans={plans as Plan[]} />
                <BoolRow label="White-label completo" feat="white_label" plans={plans as Plan[]} />
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function fmtLimit(n: number): string {
  return n === -1 ? 'Ilimitado' : String(n)
}

function SectionRow({ label, colSpan }: { label: string; colSpan: number }) {
  return (
    <tr className="bg-gray-50/70">
      <td
        colSpan={colSpan}
        className="py-2 pl-6 text-[10px] font-semibold uppercase tracking-wider text-gray-400"
      >
        {label}
      </td>
    </tr>
  )
}

function ValueRow({
  label,
  values,
  plans,
}: {
  label: string
  values: string[]
  plans: Plan[]
}) {
  return (
    <tr className="hover:bg-gray-50/50">
      <td className="py-2.5 pl-6 pr-4 text-xs text-gray-600">{label}</td>
      {values.map((v, i) => (
        <td
          key={i}
          className={`py-2.5 px-4 text-center text-xs font-medium text-gray-700 ${
            plans[i]?.name === 'pro' ? 'bg-primary/[0.02]' : ''
          }`}
        >
          {v}
        </td>
      ))}
    </tr>
  )
}

function BoolRow({
  label,
  feat,
  plans,
}: {
  label: string
  feat: string
  plans: Plan[]
}) {
  return (
    <tr className="hover:bg-gray-50/50">
      <td className="py-2.5 pl-6 pr-4 text-xs text-gray-600">{label}</td>
      {plans.map((p) => (
        <td
          key={p.id}
          className={`py-2.5 px-4 text-center ${
            p.name === 'pro' ? 'bg-primary/[0.02]' : ''
          }`}
        >
          {p.features.includes(feat) ? (
            <span className="inline-flex items-center justify-center">
              <svg
                className="h-4 w-4 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
          ) : (
            <span className="text-gray-300 text-sm">—</span>
          )}
        </td>
      ))}
    </tr>
  )
}
