import { notFound } from 'next/navigation'
import { getUserIdFromHeaders, getTenantForUser } from '@/lib/tenant'
import { getSubscription, getPlans, statusLabel, statusColor } from '@/lib/billing'
import type { Plan, Subscription } from '@/lib/billing-utils'
import PlansGrid from './_components/PlansGrid'
import BillingSubNav from '@/components/billing/BillingSubNav'

export const metadata = { title: 'Planos — RevendaClick' }

export default async function PlansPage() {
  const userId = await getUserIdFromHeaders()
  if (!userId) notFound()

  const tenant = await getTenantForUser(userId)
  if (!tenant) notFound()

  const [sub, plans] = await Promise.all([getSubscription(), getPlans()])

  // Only public plans in the comparison table
  const publicPlans = (plans as Plan[]).filter((p) => p.name !== 'scale')

  return (
    <div className="space-y-10">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-graphite">Assinatura</h1>
        <p className="mt-1 text-sm text-gray-500">Planos flexíveis para cada etapa da sua revenda.</p>
      </div>
      <BillingSubNav active="plans" />

      <div className="text-center">
        <h2 className="text-2xl font-heading font-bold text-graphite">Escolha seu plano</h2>
        <p className="mt-2 text-sm text-gray-500">
          Cancele quando quiser.
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

      {/* Benefit-focused comparison — 3 plan cards */}
      {publicPlans.length > 0 && (
        <div className="space-y-4">
          <div className="px-1">
            <h3 className="text-sm font-semibold text-gray-900">O que cada plano inclui</h3>
            <p className="mt-0.5 text-xs text-gray-400">Escolha o plano certo para o momento da sua revenda.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {publicPlans.map((p) => (
              <PlanBenefitsCard key={p.id} plan={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const PLAN_BENEFITS: Record<string, { tagline: string; includes?: string; benefits: string[] }> = {
  starter: {
    tagline: 'Ideal para começar sua revenda online.',
    benefits: [
      'Sua vitrine online de veículos',
      'Página pública para divulgação',
      'Recebimento automático de interessados',
      'WhatsApp direto na vitrine',
      'Controle financeiro básico',
      'Gestão da equipe',
    ],
  },
  pro: {
    tagline: 'Ideal para lojas que recebem contatos diariamente.',
    includes: 'Tudo do Starter, mais:',
    benefits: [
      'CRM para organizar atendimentos',
      'Pipeline visual de oportunidades',
      'Histórico completo dos contatos',
      'Relatórios para acompanhar resultados',
      'Gestão mais profissional da operação',
    ],
  },
  premium: {
    tagline: 'Ideal para lojas que querem automatizar e escalar vendas.',
    includes: 'Tudo do Pro, mais:',
    benefits: [
      'WhatsApp conectado ao CRM',
      'Automação de follow-up',
      'Campanhas de recuperação de clientes',
      'Inteligência artificial para atendimento',
      'IA para recuperar oportunidades perdidas',
      'Operação preparada para crescimento',
    ],
  },
}

function PlanBenefitsCard({ plan }: { plan: Plan }) {
  const info = PLAN_BENEFITS[plan.name]
  const isPro = plan.name === 'pro'

  return (
    <div className={`flex flex-col rounded-2xl border overflow-hidden ${
      isPro ? 'border-primary shadow-sm' : 'border-gray-200 bg-white'
    }`}>
      {/* Header */}
      <div className={`px-6 py-5 ${isPro ? 'bg-primary/[0.03] border-b border-primary/10' : 'border-b border-gray-100'}`}>
        <p className={`text-xs font-bold uppercase tracking-wider mb-1.5 ${isPro ? 'text-primary' : 'text-gray-400'}`}>
          {plan.display_name}
        </p>
        <p className="text-sm text-gray-600 leading-snug">{info?.tagline ?? ''}</p>
      </div>

      {/* Benefits */}
      <div className="px-6 py-5 flex-1 bg-white">
        {info?.includes && (
          <p className="mb-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{info.includes}</p>
        )}
        <ul className="space-y-2.5">
          {info?.benefits.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {b}
            </li>
          ))}
        </ul>
      </div>

      {/* Capacity */}
      <div className="border-t border-gray-100 bg-gray-50/70 px-6 py-4">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Capacidade</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span className="text-xs text-gray-500">
            <span className="font-semibold text-gray-800">{plan.max_vehicles}</span> veículos
          </span>
          <span className="text-xs text-gray-500">
            <span className="font-semibold text-gray-800">{plan.max_users}</span> usuários
          </span>
          <span className="text-xs text-gray-500">
            <span className="font-semibold text-gray-800">{plan.max_leads === -1 ? '∞' : plan.max_leads}</span> leads/mês
          </span>
        </div>
      </div>
    </div>
  )
}
